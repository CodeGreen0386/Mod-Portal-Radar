const loggedIn = !document.querySelector('a[href^="/login"]')

let mods = {}

async function init() {
    const result = await browser.storage.local.get("mods")
    mods = result.mods ?? {}

    filter()

    // tootlip setup
    document.body.dispatchEvent(new CustomEvent("htmx:afterSettle"))

    document.body.addEventListener("htmx:afterSettle", filter)
    document.body.addEventListener("htmx:historyRestore", filter)
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
        if (panel.querySelector("#ai-usage")) return

        // tooltip z-index jank
        panel.children[0].style.zIndex = 100 - [...panel.parentElement.children].indexOf(panel)

        let modName = link.pathname.split("/")[2]
        let usage = mods[modName]
        if (usage) {
            createAITag(panel, usage)

            if (shouldHide) {
                // panel.style.display = "none"
                // return
            }
        }

        if (loggedIn) {
            createReportButton(panel, link)
        }
    })
}

function createAITag(panel, usage) {
    let info = panel.querySelector(".mod-card-info").parentElement

    let tag = info.appendChild(document.createElement("div"))
    tag.id ="ai-usage"
    tag.className = "pb8 result-field category-label"

    let icon = tag.appendChild(document.createElement("i"))
    icon.className = "fa-solid fa-triangle-exclamation orange"

    tag.append(" ")

    let span = tag.appendChild(document.createElement("span"))
    span.textContent = "AI usage"
    span.className = "orange bold"

    let tooltip = info.appendChild(document.createElement("div"))
    tooltip.className = "tooltip"
    tooltip.role = "tooltip"

    let title = tooltip.appendChild(document.createElement("div"))
    title.className = "panel-tooltip-title"
    title.textContent = "AI usage categories:"

    let content = tooltip.appendChild(document.createElement("div"))
    content.className = "panel-tooltip"

    let p = content.appendChild(document.createElement("p"))
    p.textContent = "Reported for the following categories:"

    let list = content.appendChild(document.createElement("ul"))
    list.style.marginTop = "4px"
    tooltipCategory(list, usage.code, "Code")
    tooltipCategory(list, usage.graphics, "Graphics")
    tooltipCategory(list, usage.text, "Text")
    tooltipCategory(list, usage.thumbnail, "Thumbnail")
    tooltipCategory(list, usage.other, "Other")
}

function tooltipCategory(content, category, text) {
    if (!category) return
    let li = content.appendChild(document.createElement("li"))
    li.textContent = text
}

function createReportButton(panel, link) {
    if (panel.querySelector("#report-ai-usage")) return

    let buttons = panel.querySelector(".mod-download-section")

    const mr12 = buttons.appendChild(document.createElement("div"))
    mr12.className = "mr12"
    buttons.insertBefore(mr12, buttons.children[1])

    const button = mr12.appendChild(document.createElement("a"))
    button.className = "button"
    button.id = "report-ai-usage"
    button.title = "Report AI usage"
    button.style.minWidth = "44px"
    button.style.textAlign = "center"
    button.target = "_blank"

    let modTitle = panel.querySelector("h2").innerText
    const url = new URL("https://github.com/CodeGreen0386/Mod-Portal-Radar/issues/new")
    url.searchParams.set("template", "report-mod.yml")
    url.searchParams.set("title", `Report: ${modTitle}`)
    url.searchParams.set("url", link.href)
    button.href = url.toString()

    const flag = button.appendChild(document.createElement("i"))
    flag.className = "fa-solid fa-flag"
}

init()