<script lang="ts">
    import { activePopup, language } from "../../../stores"
    import { copySelectedHymnToClipboard, formatHymnNumber, getHymnCategoryLabel, hymnEditTarget, hymnFavoriteIds, hymnItems, hymnSelectedId, hymnTypingLanguage, insertSelectedHymnIntoSlides, toggleFavorite } from "./hymns"
    import T from "../../helpers/T.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import { shouldUseNepaliLocale } from "../../../../common/nepali"

    $: hymn = $hymnItems.find((item) => item.id === $hymnSelectedId) || null

    function handleFavorite() {
        if (!hymn) return
        toggleFavorite(hymn.id)
    }

    function editHymn() {
        if (!hymn) return
        hymnEditTarget.set(hymn)
        activePopup.set("edit_hymn")
    }

    function getSectionLabel(verse: string, index: number) {
        const normalized = verse.trim().toLowerCase()
        if (normalized.startsWith("को.") || normalized.includes("कोरस") || normalized.includes("chorus")) return shouldUseNepaliLocale($language) ? "कोरस" : "Chorus"
        return shouldUseNepaliLocale($language) ? `अन्तरा ${index + 1}` : `Verse ${index + 1}`
    }
</script>

<div class="viewer">
    {#if hymn}
        <div class="header">
            <div>
                <h2>{hymn.title}</h2>
                <div class="subline">
                    <span class="badge">{getHymnCategoryLabel(hymn.categoryId, $language)}</span>
                    {#if hymn.number}<span class="number">{formatHymnNumber(hymn.number, $hymnTypingLanguage)}</span>{/if}
                    {#if hymn.authors}<span class="author">{hymn.authors}</span>{/if}
                </div>
            </div>

            <button class="favorite" class:active={$hymnFavoriteIds.includes(hymn.id)} on:click={handleFavorite} aria-label="Toggle hymn favorite">★</button>
        </div>

        <div class="actions">
            <MaterialButton variant="contained" icon="add" on:click={insertSelectedHymnIntoSlides}>
                <T id="hymns.insert" />
            </MaterialButton>
            <MaterialButton variant="outlined" icon="edit" on:click={editHymn} white>
                <T id="hymns.edit" />
            </MaterialButton>
            <MaterialButton variant="outlined" icon="copy" on:click={copySelectedHymnToClipboard} white>
                <T id="hymns.copy" />
            </MaterialButton>
        </div>

        <div class="lyrics">
            {#each hymn.verses as verse, index}
                <section class="verse">
                    <h3>{getSectionLabel(verse, index)}</h3>
                    <pre>{verse}</pre>
                </section>
            {/each}
        </div>
    {:else}
        <div class="empty"><T id="hymns.viewer_empty" /></div>
    {/if}
</div>

<style>
    .viewer {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
        background: color-mix(in srgb, var(--primary-darkest) 70%, black 30%);
    }

    .header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 1rem 1rem 0.75rem;
        border-bottom: 1px solid var(--primary-lighter);
    }

    h2,
    h3,
    pre {
        margin: 0;
        color: var(--text);
    }

    .subline {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        margin-top: 0.55rem;
        font-size: 0.85rem;
        opacity: 0.8;
    }

    .badge,
    .number {
        background: color-mix(in srgb, var(--secondary) 18%, var(--primary-darker) 82%);
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
    }

    .favorite {
        border: none;
        background: transparent;
        color: rgba(255, 255, 255, 0.4);
        font-size: 1.5rem;
        cursor: pointer;
        align-self: flex-start;
    }

    .favorite.active {
        color: #f4c542;
    }

    .actions {
        display: flex;
        gap: 0.7rem;
        padding: 0.9rem 1rem;
        border-bottom: 1px solid var(--primary-lighter);
        flex-wrap: wrap;
    }

    .lyrics {
        padding: 1rem;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .verse {
        padding: 0.85rem 1rem;
        border-radius: 16px;
        background: color-mix(in srgb, var(--primary-darker) 88%, white 12%);
    }

    .verse h3 {
        margin-bottom: 0.65rem;
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: var(--secondary);
    }

    pre {
        white-space: pre-wrap;
        font: inherit;
        line-height: 1.65;
    }

    .empty {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        opacity: 0.72;
        padding: 2rem;
        text-align: center;
    }
</style>