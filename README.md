# Mod Portal Radar

Hide and tag Factorio mods with AI usage, powered by a community-maintained database.

Available for:
- [Firefox](https://addons.mozilla.org/en-US/firefox/addon/mod-portal-radar/)
- [Google Chrome](https://chromewebstore.google.com/detail/mod-portal-radar/lmhgfdjkokmjmphmgeiabccjmolbpeim)

## Information

Mods are reported on an individual basis for different categories of AI usage. All reports are subjected to human review before being accepted and added to the database. Your browser fetches and caches this database to use for the hiding and tagging of mods.

Reports are handled through Github issues, using the report template. If logged in on the mod portal, a report button will appear on each mod, pre-filling the template with information when clicked. This unfortunately means a Github account is required to report mods, however that also serves as a form of spam protection.

Accepted reports may take up to an hour to have an effect on the mod portal, as that is the delay between cache refreshes. Restarting the browser will refresh the cache immediately.

### Categories

Mods are labeled according to how AI was used, that way you can filter depending on your level of comfort.

- <ins>**Audio**</ins>: If the mod contains any AI-generated sound effects, music, or other sound sources.
- <ins>**Code**</ins>: When a mod has any amount of AI-written or assisted code. It is only applied specifically when the mod's code has an agent as a contributor, if the repository contains AI-specific files or folders like AGENTS.md or /skills, or if it is disclosed in the mod description, readme, or elsewhere by the author. Otherwise, the source code may be investigated for any obvious LLM usage, though that is seldom applied.
- <ins>**Graphics**</ins>: If the mod has any AI-generated or modified sprites/animations used in-game. This does not include images used in the mod portal gallery or description, unless those images are screenshots of in-game assets.
- <ins>**Text**</ins>: If there is any LLM text, either in the mod portal summary, description, changelog, or in-game. Generally speaking, if there's LLM text anywhere, it's included.
- <ins>**Thumbnail**</ins>: This one's pretty simple, if the mod has an AI-generated thumbnail. Also applies to gallery images that are meant to be thumbnail-y.
- <ins>**Other**</ins>: This is a catch-all for anything that doesn't fit the other labels. More specifically, it's still only things that were used in the creation of the mod, for example audio.

Any mod that has its assets separated into one or more asset mods will be labeled as if it contains the assets, to appear consistent with mods that don't split their assets. This caveat only applies to the original mod the asset mods were intended to be used for.

Due to the the nature of the labels being used for *any* amount of AI usage, be aware that choosing to hide mods could prevent you from seeing mods of good quality, especially for the Code label.
