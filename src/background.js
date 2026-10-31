const url = "https://raw.githubusercontent.com/CodeGreen0386/Mod-Portal-Radar/refs/heads/master/mods.json"

async function cache() {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch mods");

    const mods = await response.json();
    await browser.storage.local.set({
        mods: mods,
        lastUpdated: Date.now()
    })
}

browser.runtime.onInstalled.addListener(cache)
browser.runtime.onStartup.addListener(cache)

browser.alarms.create("cache", {
    periodInMinutes: 60
})

browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "cache") {
        cache()
    }
})