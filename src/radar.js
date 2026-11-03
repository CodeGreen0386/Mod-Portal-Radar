const loggedIn = !document.querySelector('a[href^="/login"]')

const categories = {
    code: {
        title: "Code",
        description: "Any amount of generated or assisted code."
    },
    graphics: {
        title: "Graphics",
        description: "Graphics used in-game for entities, items, technologies, etc."
    },
    text: {
        title: "Text",
        description: "Descriptions, summaries, or any other place with generated text."
    },
    thumbnail: {
        title: "Thumbnail",
        description: "The thumbnail or any gallery images on the mod portal page."
    },
    other: {
        title: "Other",
        description: "Catch-all for anything that doesn't fit into the other categories."
    },
}

let mods = {}
let filters = {}

async function init() {
    const modsResult = await browser.storage.local.get("mods")
    mods = modsResult.mods ?? {}

    const filtersResult = await browser.storage.local.get("filters")
    filters = filtersResult.filters ?? {}
    for (let [name, _] of Object.entries(categories)) {
        if (filters[name] === undefined) filters[name] = true
    }

    filter()

    // tootlip setup
    document.body.dispatchEvent(new CustomEvent("htmx:afterSettle"))

    document.body.addEventListener("htmx:afterSettle", filter)
    document.body.addEventListener("htmx:historyRestore", filter)
}
init()

function filter() {
    let pathname = window.location.pathname
    let inSearchList = pathname === "/" || pathname.startsWith("/search") || pathname.startsWith("/browse")

    if (inSearchList) {
        createSearchFilters()
    }

    document.querySelectorAll('a[href*="/mod/"]').forEach((link) => {
        if (link.className !== "block") return

        let panel = link
        for (let i = 0; i < 5; i++) {
            panel = panel.parentElement
        }

        // tooltip z-index jank
        panel.children[0].style.zIndex = 100 - [...panel.parentElement.children].indexOf(panel)

        let modName = link.pathname.split("/")[2]
        let usage = mods[modName]
        if (usage) {
            createAITag(panel, usage)

            if (inSearchList) {
                if (panel.style.display === "none") {
                    panel.style.display = "flex"
                }
                for (let [name, used] of Object.entries(usage)) {
                    if (used && filters[name]) {
                        panel.style.display = "none"
                        return
                    }
                }
            }
        }

        if (loggedIn) {
            createReportButton(panel, link)
        }
    })
}

function createSearchFilters() {
    const sidebar = document.querySelector("#explore-sidebar")
    if (sidebar.querySelector("#ai-filters")) return

    const header = sidebar.appendChild(document.createElement("h2"))
    header.textContent = "AI Usage"
    header.id = "ai-filters"

    for (const [name, category] of Object.entries(categories)) {
        const row = sidebar.appendChild(document.createElement("div"))

        const label = row.appendChild(document.createElement("label"))
        label.className = "checkbox-label"

        const div = label.appendChild(document.createElement("div"))

        const span = div.appendChild(document.createElement("span"))
        span.className = filters[name] ? "disabled-label" : ""
        span.textContent = category.title

        const tooltip = div.appendChild(document.createElement("div"))
        tooltip.className = "tooltip"
        tooltip.role = "tooltip"

        const title = tooltip.appendChild(document.createElement("div"))
        title.className = "panel-tooltip-title"
        title.textContent = category.title

        const description = tooltip.appendChild(document.createElement("div"))
        description.className = "panel-tooltip"
        description.textContent = category.description

        const exclude = label.appendChild(document.createElement("label"))
        exclude.className = "disable-checkbox-label"

        const checkbox = exclude.appendChild(document.createElement("input"))
        checkbox.name = "exclude_tag"
        checkbox.type = "checkbox"
        checkbox.checked = filters[name]

        checkbox.addEventListener("click", () => {
            span.className = checkbox.checked ? "disabled-label" : ""
            filters[name] = checkbox.checked
            filter()
            
            browser.storage.local.set({
                filters: filters
            })
        })
    }
}

function createAITag(panel, usage) {
    if (panel.querySelector("#ai-usage")) return
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

    for (const [name, category] of Object.entries(categories)) {
        if (usage[name]) {
            let li = list.appendChild(document.createElement("li"))
            li.textContent = category.title
        }
    }
}

function createReportButton(panel, link) {
    if (panel.querySelector("#report-ai-usage")) return

    let buttons = panel.querySelector(".mod-download-section")

    const mr12 = buttons.insertBefore(buttons.appendChild(document.createElement("div")), buttons.children[1])
    mr12.className = "mr12"

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