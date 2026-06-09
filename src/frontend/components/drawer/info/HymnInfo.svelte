<script lang="ts">
    import { language } from "../../../stores"
    import { copySelectedHymnToClipboard, formatHymnNumber, getHymnCategoryDisplay, getSelectedHymn, hymnFavoriteIds, hymnSourceDates, toggleFavorite, insertSelectedHymnIntoSlides } from "../hymns/hymns"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import T from "../../helpers/T.svelte"
    import InfoMetadata from "./InfoMetadata.svelte"

    function handleFavorite() {
        if (!hymn) return
        toggleFavorite(hymn.id)
    }

    $: hymn = getSelectedHymn()
    $: info = hymn
        ? [
              { label: "info.created", value: $hymnSourceDates.created, type: "date" },
              { label: "info.modified", value: $hymnSourceDates.modified, type: "date" },
              { label: "hymns.repeat_chorus", value: hymn.repeatChorus ? "yes" : "no" },
              { label: "info.category", value: getHymnCategoryDisplay(hymn.categoryId, $language) },
              { label: "info.slides", value: hymn.slidesCount },
              { label: "info.words", value: hymn.wordCount },
              { label: "hymns.number", value: formatHymnNumber(hymn.number, $language) },
              { label: "hymns.source", value: hymn.sourcePage || hymn.rawDetails || null, type: hymn.sourcePage ? "url" : undefined }
          ]
        : []
</script>

{#if hymn}
    <div class="infoPanel">
        <InfoMetadata title={hymn.title} {info} />

        <div class="translit">{hymn.transliteration}</div>

        <div class="actions">
            <MaterialButton variant="contained" icon="add" on:click={insertSelectedHymnIntoSlides}>
                <T id="hymns.insert" />
            </MaterialButton>
            <MaterialButton variant="outlined" icon="copy" on:click={copySelectedHymnToClipboard} white>
                <T id="hymns.copy" />
            </MaterialButton>
            <MaterialButton variant="outlined" icon={hymn && $hymnFavoriteIds.includes(hymn.id) ? "favorite" : "star"} on:click={handleFavorite} white>
                <T id="hymns.favorites" />
            </MaterialButton>
        </div>

        <div class="lyricsCard">
            <h3><T id="hymns.lyrics" /></h3>
            {#each hymn.verses as verse, index}
                <section class="verse">
                    <h4>{verse.trim().startsWith("को.") || verse.includes("कोरस") ? ($language === "ne" ? "कोरस" : "Chorus") : `${$language === "ne" ? "अन्तरा" : "Verse"} ${index + 1}`}</h4>
                    <pre>{verse}</pre>
                </section>
            {/each}
        </div>
    </div>
{:else}
    <div class="emptyState"><T id="hymns.viewer_empty" /></div>
{/if}

<style>
    .infoPanel {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        padding-bottom: 0.75rem;
    }

    .translit {
        margin: 0 8px;
        padding: 0 8px;
        color: var(--text);
        opacity: 0.72;
        font-size: 0.92rem;
    }

    .actions {
        display: flex;
        gap: 0.6rem;
        flex-wrap: wrap;
        padding: 0 12px;
    }

    .lyricsCard {
        margin: 0 8px;
        padding: 1rem;
        background: color-mix(in srgb, var(--primary-darkest) 86%, black 14%);
        border: 1px solid var(--primary-lighter);
        border-radius: 12px;
        overflow-y: auto;
    }

    .lyricsCard h3,
    .verse h4,
    .verse pre {
        margin: 0;
        color: var(--text);
    }

    .lyricsCard h3 {
        margin-bottom: 0.9rem;
        color: var(--secondary);
    }

    .verse {
        padding: 0.8rem 0;
        border-top: 1px solid rgb(255 255 255 / 0.06);
    }

    .verse:first-of-type {
        border-top: none;
        padding-top: 0;
    }

    .verse h4 {
        margin-bottom: 0.45rem;
        font-size: 0.85rem;
        opacity: 0.78;
    }

    .verse pre {
        white-space: pre-wrap;
        font: inherit;
        line-height: 1.55;
    }

    .emptyState {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        opacity: 0.7;
        padding: 2rem;
        text-align: center;
    }
</style>