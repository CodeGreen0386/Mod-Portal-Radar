import fs from "fs";

const body = process.env.ISSUE_BODY;

function getSection(name) {
    const re = new RegExp(`### ${name}\\s*\\n(.*?)(?=\\n### |$)`, "s")
    return body.match(re)?.[1].trim() ?? ""
}

const URL = getSection("Mod URL")
const parsedURL = URL(URL)
if (parsedURL.hostname !== "mods.factorio.com") {
    throw new Error("Invalid URL")
}

const name = URL.split("/mod/")[1]?.split("?")[0]
if (!name) {
    throw new Error("Missing mod name in URL")
}

const output = `mods/${name}.json`
if (fs.existsSync(output)) {
    throw new Error("Mod already exists") // TODO: change to allow updating of checkboxes
}

const aiUsage = getSection("AI Usage")
const mod = {
    code: /- \[x\] Code/.test(aiUsage),
    graphics: /- \[x\] Graphics/.test(aiUsage),
    text: /- \[x\] Text/.test(aiUsage),
    thumbnail: /- \[x\] Thumbnail/.test(aiUsage),
    other: /- \[x\] Other/.test(aiUsage)
};

fs.writeFileSync(output, JSON.stringify(mod, null, 4) + "\n")
fs.appendFileSync(process.env.GITHUB_ENV, `MOD_NAME=${name}\n`)