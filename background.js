const url = ""

async function cache() {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch mods");

    const mods = await response.json();
    await browser.storage.local.set({
        mods: mods,
        lastUpdates: Date.now()
    })
}