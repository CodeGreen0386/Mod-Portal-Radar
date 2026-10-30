let mods = {};

async function init() {
    const result = await browser.storage.local.get("mods")
    mods = result.mods ?? {};

    filter()

    const observer = new MutationObserver(() => {
        filter()
    })

    observer.observe(document.body, {
        childList: true,
        subtree: true
    })
}

function filter() {
    let pathname = window.location.pathname
    if (pathname === "/" || pathname.startsWith("/search") || pathname.startsWith("/browse")) {
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