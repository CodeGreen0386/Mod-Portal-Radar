let mods = {}

async function init() {
    const result = await browser.storage.local.get("mods")
    mods = result.mods ?? {}

    filter()

    let results = document.getElementById("search-results")
    if (results) {
        const observer = new MutationObserver(() => {
            filter()
        })

        observer.observe(results, {
            childList: true,
        })
    }
}

function filter() {
    let pathname = window.location.pathname
    let shouldHide = pathname === "/" || pathname.startsWith("/search") || pathname.startsWith("/browse")
    document.querySelectorAll('a[href*="/mod/"]').forEach((link) => {
        if (link.className !== "block") return

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

        createButton(panel, link)
    })
}

function createButton(panel, link) {
    if (panel.querySelector("#report-ai-usage")) return

    let buttons = panel.querySelector(".mod-download-section")

    const mr12 = document.createElement("div")
    mr12.className = "mr12"
    buttons.insertBefore(buttons.appendChild(mr12), buttons.children[1])

    const button = document.createElement("button")
    button.id = "report-ai-usage"
    button.className = "button"
    button.innerText = "Report"
    button.title = "Report AI usage"
    button.style.minWidth = "44px"
    mr12.appendChild(button)

    let modTitle = panel.querySelector("h2").innerText

    button.addEventListener("click", () => {
        const url = new URL("https://github.com/CodeGreen0386/Mod-Portal-Radar/issues/new")
        url.searchParams.set("template", "report-mod.yml")
        url.searchParams.set("title", `Report: ${modTitle}`)
        url.searchParams.set("url", link.href)
        window.open(url)
    })
}

init()