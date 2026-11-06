# AGENTS.md

## Project

Mod Portal Radar is a dependency-free browser extension plus a community-maintained
database of Factorio mods that use AI. The extension hides reported mods on
mods.factorio.com and tags them with the categories they were reported for.

Two deliverables:

- `src/` — a Manifest V3 WebExtension for Firefox and Chrome. Plain JavaScript,
  no build step, no package manager, no tests.
- `mods/` — one JSON file per reported mod. `mods.json` is the aggregated database
  served to the extension from the `master` branch via raw.githubusercontent.com.

## Commands

```sh
node scripts/mods.js     # regenerate mods.json from mods/*.json (required after edits)
```

Load the extension manually:

- Chrome: `chrome://extensions` → Developer mode → Load unpacked → `src/`
- Firefox: `about:debugging#/runtime/this-firefox` → Load Temporary Add-on → `src/manifest.json`

Test the issue-report parser locally:

```sh
ISSUE_BODY="$(cat /tmp/issue-body.md)" GITHUB_ENV=/tmp/github-env node scripts/report.js
```

`scripts/*.js` use ESM syntax inside `.js` files without a `package.json`, so they
need Node with module syntax detection (Node 22.7+; verified with Node 23).

## Architecture

### Extension (`src/`)

- `manifest.json` — MV3 manifest. Permissions are only `storage` and `alarms`.
  The content script runs on `*://mods.factorio.com/*`.
- `background.js` — caches the remote `mods.json` in `browser.storage.local`
  (`mods` and `lastUpdated`). Refreshes on install, browser startup, and every
  60 minutes via an alarm. The database URL is hardcoded to the `master` branch.
- `radar.js` — content script. Reads the cached database, then:
  - adds an "AI usage" warning tag and tooltip to every mod card;
  - on `/`, `/search*` and `/browse*`, injects the "AI Usage" filter sidebar and
    hides cards whose reported categories are enabled in the filters;
  - adds a report button that pre-fills the GitHub issue template, but only when
    the visitor is logged in to the mod portal.

The content script re-runs `filter()` on the mod portal's htmx events
(`htmx:afterSettle`, `htmx:historyRestore`) because navigation is client-side.
It also dispatches `htmx:afterSettle` manually after init so the site initializes
the injected tooltips.

Filter semantics are inverted relative to the label: a checked category means
"hide mods reported for this category". All categories default to checked
(hidden).

### Data

`mods/<mod-name>.json` — named after the mod's portal URL slug
(`https://mods.factorio.com/mod/<mod-name>`). Always contains exactly these five
boolean keys, in this order:

```json
{
    "code": true,
    "graphics": false,
    "text": false,
    "thumbnail": false,
    "other": false
}
```

- `code` — generated or assisted code
- `graphics` — in-game graphics (entities, items, technologies, etc.)
- `text` — descriptions, summaries, or other generated text
- `thumbnail` — thumbnail or gallery images on the portal page
- `other` — catch-all

A mod with no categories selected must not have a file at all.

`mods.json` is generated. Never edit it by hand; run `node scripts/mods.js` after
changing anything under `mods/`. The generator keys entries by filename (without
`.json`) and writes 4-space JSON with a trailing newline.

### Report pipeline

1. A user opens a "Report Mod" issue (`.github/ISSUE_TEMPLATE/report-mod.yml`).
   The extension pre-fills the title (`Report: <mod title>`) and `url` field.
2. A maintainer reviews it and applies the `accepted` label. The issue must also
   keep the `report` label (added by the template).
3. `.github/workflows/report-accepted.yml` runs `scripts/report.js` with the
   issue body in `ISSUE_BODY`. The script:
   - parses the `### Mod URL` and `### AI Usage` sections;
   - rejects URLs whose hostname is not `mods.factorio.com`;
   - derives the mod name from the path after `/mod/`;
   - writes `mods/<name>.json` if any category is checked, otherwise deletes the
     existing file;
   - exports `MOD_NAME` via `GITHUB_ENV` for the commit message.
4. The workflow commits and pushes to `master`, then closes the issue.
5. Pushing files under `mods/**` triggers
   `.github/workflows/generate-mods-json.yml`, which regenerates `mods.json` and
   commits it. Both workflows share the `database` concurrency group so these
   commits do not race.

The report workflow checks out with `secrets.PAT` on purpose: pushes authenticated
with the default `GITHUB_TOKEN` do not trigger other workflows, so the database
regeneration would never run without it.

To add or change a report manually, edit the individual file under `mods/`, then
run `node scripts/mods.js` and commit both the mod file and `mods.json`.

### New-issue info comments

`.github/workflows/comment-mod-info.yml` runs when an issue is opened and posts a
comment containing the mod thumbnail, a source-code link when `source_url` is a
recognized code host, otherwise the latest direct download link, and the mod
description.
`scripts/issue-info.js` reads the `### Mod URL` section, queries
`https://mods.factorio.com/api/mods/<name>/full`, and writes the comment to
`$RUNNER_TEMP`; the workflow posts it with `gh issue comment`. Issues without a
mod URL are skipped.

The workflow also runs when itself or `scripts/issue-info.js` is pushed to
`master`, and on manual dispatch, to backfill existing open issues. Backfilled
comments end with the hidden `<!-- mod-portal-radar:mod-info -->` marker, and any
issue whose comments already contain that marker is skipped, so reruns do not
post duplicates.

## Conventions

- 4-space indentation, double quotes, no semicolons, trailing newline at EOF.
- `const`/`let`, camelCase, small top-level helper functions.
- Keep the extension dependency-free: no frameworks, bundlers, or `package.json`
  unless the task explicitly requires them.
- Use the `browser.*` WebExtension namespace consistently in `src/`.
- Keep the five category keys and their order identical across `mods/*.json`,
  `scripts/report.js`, `scripts/mods.js` output, and `categories` in `src/radar.js`.
- Do not rename or reorder generated `mods.json`; it is deterministic output.
- Commit messages follow `Report #<number>: <mod-name>` or `Update mods.json`.
- CI targets `master`; the current local branch may be a feature branch.

## Gotchas

- `radar.js` depends on mod portal DOM details: `.mod-card-info`,
  `.mod-download-section`, `#explore-sidebar`, link class `block`, and walking five
  parent elements up from the mod link. Changes here break against site updates.
- Mod card detection requires `a[href*="/mod/"]` with `className === "block"`;
  other mod links are ignored.
- The issue template checkboxes must serialize as `- [x] Code` lines; the parser
  matches those exact strings.
- `scripts/report.js` trusts the parsed URL path except for the hostname check and
  writes directly under `mods/`.
- Cached data in `browser.storage.local` can be stale for up to an hour. Restarting
  the browser or reinstalling refreshes it.
- There is no automated test suite or linter; verify changes by loading the
  extension and checking a mod list/search page, and run `node scripts/mods.js`
  after data changes.
