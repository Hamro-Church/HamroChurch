<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import { language } from "../../../stores"
    import { formatHymnNumber, getFilteredHymns, getHymnCategoryLabel, highlightHymnText, hymnFavoriteIds, hymnItems, hymnSearchValue, hymnSelectedCategories, hymnSelectedId, type HymnRecord } from "./hymns"
    import T from "../../helpers/T.svelte"

    export let favoritesOnly = false

    const dispatch = createEventDispatcher<{ select: HymnRecord }>()

    $: filtered = getFilteredHymns($hymnSearchValue, $hymnSelectedCategories, favoritesOnly, $hymnItems, $hymnFavoriteIds)

    function selectHymn(hymn: HymnRecord) {
        hymnSelectedId.set(hymn.id)
        dispatch("select", hymn)
    }
</script>

<div class="list">
    <div class="headerRow">
        <span>No.</span>
        <span><T id="inputs.name" /></span>
        <span class="translitHeader"><T id="hymns.transliteration" /></span>
    </div>

    {#if filtered.length}
        {#each filtered as hymn}
            <button class:selected={$hymnSelectedId === hymn.id} class="row" on:click={() => selectHymn(hymn)}>
                <span class="number">{formatHymnNumber(hymn.number, $language)}</span>
                <span class="titleWrap">
                    <span class="title">{@html highlightHymnText(hymn.title, $hymnSearchValue)}</span>
                    <span class="preview">{getHymnCategoryLabel(hymn.categoryId, $language)}</span>
                </span>
                <span class="transliteration">{@html highlightHymnText(hymn.transliteration, $hymnSearchValue)}</span>
                {#if $hymnFavoriteIds.includes(hymn.id)}<span class="star">★</span>{/if}
            </button>
        {/each}
    {:else}
        <div class="empty"><T id="hymns.not_found" /></div>
    {/if}
</div>

<style>
    .list {
        display: flex;
        flex-direction: column;
        overflow-y: auto;
        min-height: 0;
        height: 100%;
    }

    .headerRow {
        display: grid;
        grid-template-columns: 56px minmax(0, 1.15fr) minmax(0, 0.85fr);
        gap: 12px;
        padding: 0.65rem 1rem;
        border-bottom: 1px solid var(--primary-lighter);
        position: sticky;
        top: 0;
        z-index: 1;
        background: color-mix(in srgb, var(--primary-darkest) 95%, var(--secondary) 5%);
        color: var(--secondary);
        font-weight: 700;
    }

    .row {
        display: grid;
        grid-template-columns: 56px minmax(0, 1.15fr) minmax(0, 0.85fr) 20px;
        gap: 12px;
        align-items: center;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text);
        text-align: left;
        padding: 0.62rem 0.9rem;
        border-bottom: 1px solid var(--primary-lighter);
        cursor: pointer;
    }

    .row:hover,
    .row.selected {
        background: color-mix(in srgb, var(--secondary) 12%, var(--primary-darker) 88%);
        border-color: color-mix(in srgb, var(--secondary) 80%, transparent 20%);
    }

    .number {
        min-width: 0;
        font-weight: 700;
        color: var(--secondary);
        background: color-mix(in srgb, var(--secondary) 18%, var(--primary-darkest) 82%);
        border-radius: 8px;
        padding: 0.25rem 0.45rem;
        text-align: center;
    }

    .titleWrap {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .title {
        font-weight: 600;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .preview {
        font-size: 0.78rem;
        opacity: 0.7;
    }

    .transliteration {
        min-width: 0;
        font-size: 0.88rem;
        opacity: 0.72;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .star {
        color: #f4c542;
        font-size: 0.9rem;
        justify-self: end;
    }

    .empty {
        padding: 2rem 1rem;
        text-align: center;
        opacity: 0.72;
    }

    @media (max-width: 1180px) {
        .headerRow,
        .row {
            grid-template-columns: 56px minmax(0, 1fr);
        }

        .translitHeader,
        .transliteration {
            display: none;
        }
    }

    :global(mark) {
        background: color-mix(in srgb, var(--secondary) 32%, transparent 68%);
        color: inherit;
        border-radius: 4px;
        padding: 0 0.08rem;
    }
</style>