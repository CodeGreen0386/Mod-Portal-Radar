let mods = {}

async function init() {
    const result = await browser.storage.local.get("mods")
    mods = result.mods ?? {}

    filter()

    const observer = new MutationObserver(() => {
        filter()
    })

    observer.observe(document.getElementById("search-results"), {
        childList: true,
    })
}

function filter() {
    let pathname = window.location.pathname
    let shouldHide = pathname === "/" || pathname.startsWith("/search") || pathname.startsWith("/browse")
    document.querySelectorAll('a[href*="/mod/"]').forEach((link) => {
        if (link.className === "result-field") return

        let panel = link
        for (let i = 0; i < 5; i++) {
            panel = panel.parentElement
        }

        if (shouldHide) {
            let modName = link.pathname.split("/")[2]
            if (mods[modName]) {
                panel.style.display = "none"
                return
            }
        }

        let buttons = panel.children[1].children[0].children[1]

        const mr12 = document.createElement("div")
        mr12.className = "mr12"
        buttons.insertBefore(buttons.appendChild(mr12), buttons.children[1])

        const button = document.createElement("button")
        button.className = "button"
        button.innerText = "Report"
        button.title = "Report AI usage"
        button.style.minWidth = "44px"
        mr12.appendChild(button)
    })
}

init()