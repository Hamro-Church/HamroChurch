<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import { language } from "../../../stores"
    import { formatHymnNumber, getFilteredHymns, getHymnCategoryLabel, highlightHymnText, hymnFavoriteIds, hymnItems, hymnSearchValue, hymnSelectedCategories, hymnSelectedId, hymnTypingLanguage, type HymnRecord } from "./hymns"
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
    {#if filtered.length}
        {#each filtered as hymn}
            <button class:selected={$hymnSelectedId === hymn.id} class="row" on:click={() => selectHymn(hymn)}>
                <div class="topline">
                    <span class="number">{formatHymnNumber(hymn.number, $hymnTypingLanguage)}</span>
                    <span class="title">{@html highlightHymnText(hymn.title, $hymnSearchValue)}</span>
                    {#if $hymnFavoriteIds.includes(hymn.id)}<span class="star">★</span>{/if}
                </div>
                <div class="meta">
                    <span class="badge">{getHymnCategoryLabel(hymn.categoryId, $language)}</span>
                    <span class="preview">{@html highlightHymnText(hymn.firstLine, $hymnSearchValue)}</span>
                </div>
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

    .row {
        border: none;
        background: transparent;
        color: var(--text);
        text-align: left;
        padding: 0.85rem 1rem;
        border-bottom: 1px solid var(--primary-lighter);
        cursor: pointer;
    }

    .row:hover,
    .row.selected {
        background: color-mix(in srgb, var(--secondary) 12%, var(--primary-darker) 88%);
    }

    .topline,
    .meta {
        display: flex;
        align-items: center;
        gap: 0.7rem;
    }

    .topline {
        margin-bottom: 0.45rem;
    }

    .number {
        min-width: 3rem;
        font-weight: 700;
        color: var(--secondary);
    }

    .title {
        flex: 1;
        font-weight: 600;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .badge {
        display: inline-flex;
        align-items: center;
        padding: 0.18rem 0.55rem;
        border-radius: 999px;
        background: color-mix(in srgb, var(--secondary) 18%, var(--primary-darkest) 82%);
        font-size: 0.72rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .preview {
        flex: 1;
        font-size: 0.85rem;
        opacity: 0.7;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .star {
        color: #f4c542;
        font-size: 0.9rem;
    }

    .empty {
        padding: 2rem 1rem;
        text-align: center;
        opacity: 0.72;
    }

    :global(mark) {
        background: color-mix(in srgb, var(--secondary) 32%, transparent 68%);
        color: inherit;
        border-radius: 4px;
        padding: 0 0.08rem;
    }
</style>