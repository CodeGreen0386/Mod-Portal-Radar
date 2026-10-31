import fs from "fs"

const mods = {}

const files = fs.readdirSync("mods")

for (const file of files) {
    const name = file.replace(".json", "")
    const data = JSON.parse(fs.readFileSync(`mods/${file}`, "utf8"));
    mods[name] = data
}

fs.writeSync("mods.json", JSON.stringify(mods, null, 4) + "\n")