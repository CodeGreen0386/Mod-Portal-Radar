async function init() {
    const {mods = {}} = await browser.storage.local.get("mods")

    let pathname = window.location.pathname
    if (pathname.startsWith("/browse") || pathname.startsWith("/search")) {
        document.querySelectorAll('a[href*="/mod/"]').forEach((link) => {
            if (link.className === "result-field") return

            let modName = link.pathname.split("/")[2]
            if (!mods[modName]) return

            let element = link
            for (let i = 0; i < 5; i++) {
                element = element.parentElement
            }

            element.style.display = "none"
        })
    }
}

init();