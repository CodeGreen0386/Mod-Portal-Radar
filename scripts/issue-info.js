import fs from "fs"
import path from "path"
import { execFileSync } from "child_process"

const MARKER = "<!-- mod-portal-radar:mod-info -->"

const SOURCE_HOSTS = new Set([
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "codeberg.org",
    "gitea.com",
    "sourceforge.net",
    "sr.ht",
    "git.sr.ht",
    "notabug.org",
    "savannah.gnu.org",
    "invent.kde.org",
    "gitlab.gnome.org",
    "gitlab.freedesktop.org"
])

const GITHUB_RESERVED_PATHS = new Set([
    "about",
    "collections",
    "contact",
    "customer-stories",
    "enterprise",
    "events",
    "explore",
    "features",
    "issues",
    "join",
    "login",
    "marketplace",
    "new",
    "notifications",
    "orgs",
    "pricing",
    "pulls",
    "search",
    "security",
    "settings",
    "site",
    "sponsors",
    "topics",
    "trending",
    "users"
])

// Only trust source_url when it points at a known code host and looks like a
// repository, not a profile, invite, or unrelated website.
function isSourceURL(value) {
    if (!value) return false

    let url
    try {
        url = new URL(value)
    } catch {
        return false
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") return false

    const host = url.hostname.toLowerCase().replace(/^www\./, "")
    const segments = url.pathname.split("/").filter(Boolean)

    if (host === "github.com") {
        return segments.length >= 2 && !GITHUB_RESERVED_PATHS.has(segments[0].toLowerCase())
    }

    if (SOURCE_HOSTS.has(host)) {
        return segments.length >= 2
    }

    if (/^(git|gitlab|gitea|forgejo)\./.test(host)) {
        return segments.length >= 1
    }

    return false
}

function getSection(body, name) {
    const re = new RegExp(`### ${name}\\s*\\n(.*?)(?=\\n### |$)`, "s")
    return body.match(re)?.[1].trim() ?? ""
}

function getModName(body) {
    const rawURL = getSection(body, "Mod URL")
    if (!rawURL) return null

    const parsedURL = new URL(rawURL)
    if (parsedURL.hostname !== "mods.factorio.com") {
        throw new Error("Invalid URL")
    }

    const name = parsedURL.pathname.match(/^\/mod\/([^/]+)\/?$/)?.[1]
    if (!name) {
        throw new Error("Missing mod name in URL")
    }

    return name
}

async function buildComment(body) {
    const name = getModName(body)
    if (!name) return null

    const response = await fetch(`https://mods.factorio.com/api/mods/${encodeURIComponent(name)}/full`, {
        headers: {
            "User-Agent": "Mod-Portal-Radar"
        }
    })
    if (!response.ok) {
        throw new Error(`Failed to fetch mod info: ${response.status}`)
    }

    const mod = await response.json()

    const rawThumbnail = mod.thumbnail ?? mod.images?.[0]?.thumbnail ?? null
    const thumbnail = rawThumbnail
        ? rawThumbnail.startsWith("http")
            ? rawThumbnail
            : `https://assets-mod.factorio.com${rawThumbnail}`
        : null

    const releases = Array.isArray(mod.releases) ? mod.releases : []
    const latestRelease = releases.reduce((latest, release) => {
        if (!latest) return release
        return release.released_at > latest.released_at ? release : latest
    }, null)

    const downloadURL = latestRelease?.download_url
        ? new URL(latestRelease.download_url, "https://mods.factorio.com").href
        : null

    const hasSource = isSourceURL(mod.source_url)
    const link = hasSource
        ? mod.source_url
        : downloadURL || `https://mods.factorio.com/mod/${encodeURIComponent(name)}`
    const linkLabel = hasSource ? "Source code" : downloadURL ? "Download" : "Mod portal"

    const description = (mod.description ?? mod.summary ?? "").trim() || "_No description provided._"
    const maxDescriptionLength = 60000
    const commentDescription = description.length > maxDescriptionLength
        ? `${description.slice(0, maxDescriptionLength)}\n\n_[Description truncated]_`
        : description

    const lines = []
    if (thumbnail) {
        lines.push(`![Mod thumbnail](${thumbnail})`, "")
    }
    lines.push(`**${linkLabel}:** ${link}`, "", "### Description", "", commentDescription, "", MARKER)

    return lines.join("\n") + "\n"
}

function writeCommentFile(comment) {
    const outputPath = path.join(process.env.RUNNER_TEMP ?? "/tmp", "mod-info-comment.md")
    fs.writeFileSync(outputPath, comment)

    if (process.env.GITHUB_ENV) {
        fs.appendFileSync(process.env.GITHUB_ENV, `COMMENT_FILE=${outputPath}\n`)
    }

    console.log(`Wrote mod info comment to ${outputPath}`)
}

function postComment(issueNumber, comment) {
    const outputPath = path.join(process.env.RUNNER_TEMP ?? "/tmp", `mod-info-comment-${issueNumber}.md`)
    fs.writeFileSync(outputPath, comment)
    execFileSync("gh", ["issue", "comment", String(issueNumber), "--body-file", outputPath], {
        stdio: "inherit"
    })
}

async function backfill() {
    const repo = process.env.GH_REPO
    if (!repo) {
        throw new Error("GH_REPO is required for --all")
    }

    const dryRun = process.argv.includes("--dry-run")
    const output = execFileSync("gh", [
        "issue", "list",
        "--repo", repo,
        "--state", "open",
        "--limit", "1000",
        "--json", "number,body,comments"
    ], {
        encoding: "utf8"
    })
    const issues = JSON.parse(output)

    let posted = 0
    let skipped = 0
    let failed = 0

    for (const issue of issues) {
        if (!issue.body) {
            skipped++
            continue
        }

        const alreadyCommented = (issue.comments ?? []).some((comment) => {
            return (comment.body ?? "").includes(MARKER)
        })
        if (alreadyCommented) {
            skipped++
            continue
        }

        let comment
        try {
            comment = await buildComment(issue.body)
        } catch (error) {
            console.error(`#${issue.number}: ${error.message}`)
            failed++
            continue
        }

        if (!comment) {
            skipped++
            continue
        }

        if (dryRun) {
            console.log(`#${issue.number}: would comment`)
            posted++
            continue
        }

        try {
            postComment(issue.number, comment)
            posted++
            console.log(`#${issue.number}: commented`)
        } catch (error) {
            console.error(`#${issue.number}: failed to comment`)
            failed++
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    console.log(`Done: ${posted} commented, ${skipped} skipped, ${failed} failed`)
    if (failed) {
        process.exitCode = 1
    }
}

if (process.argv.includes("--all")) {
    await backfill()
} else {
    const comment = await buildComment(process.env.ISSUE_BODY ?? "")
    if (comment) {
        writeCommentFile(comment)
    } else {
        console.log("No mod URL in issue body; skipping")
    }
}
