import fs from "fs";

const body = process.env.ISSUE_BODY;

function getSection(name) {
    const re = new RegExp(`### ${name}\\s*\\n(.*?)(?=\\n### |$)`, "s")
    return body.match(re)?.[1].trim() ?? ""
}

const name = getSection("Internal Name")
const output = `mods/${name}.json`
if (fs.existsSync(output)) {
    throw new Error("Mod already exists")
}

const aiUsage = getSection("AI Usage")
const mod = {
    code: /- \[x\] Code/.test(aiUsage),
    graphics: /- \[x\] Graphics/.test(aiUsage),
    text: /- \[x\] Text/.test(aiUsage),
    thumbnail: /- \[x\] Thumbnail/.test(aiUsage)
};

fs.writeFileSync(output, JSON.stringify(mod, null, 4) + "\n")
fs.appendFileSync(process.env.GITHUB_ENV, `MOD_NAME=${name}\n`)