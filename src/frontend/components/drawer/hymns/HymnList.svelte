<script lang="ts">
    import { createEventDispatcher } from "svelte"
    import { language } from "../../../stores"
    import { formatHymnNumber, getFilteredHymns, highlightHymnText, hymnFavoriteIds, hymnItems, hymnSearchValue, hymnSelectedCategories, hymnSelectedId, hymnSort, insertSelectedHymnIntoSlides, toggleHymnSort, type HymnRecord, type HymnSortField } from "./hymns"
    import { translateText } from "../../../utils/language"
    import T from "../../helpers/T.svelte"

    const dispatch = createEventDispatcher<{ select: HymnRecord }>()

    $: filtered = getFilteredHymns($hymnSearchValue, $hymnSelectedCategories, false, $hymnItems, $hymnFavoriteIds, $hymnSort)

    function sortArrow(field: HymnSortField, sort = $hymnSort) {
        if (sort.field !== field) return "⇅"
        return sort.direction === "asc" ? "▲" : "▼"
    }

    function selectHymn(hymn: HymnRecord) {
        hymnSelectedId.set(hymn.id)
        dispatch("select", hymn)
        insertSelectedHymnIntoSlides()
    }
</script>

<div class="list">
    <div class="headerRow">
        <button type="button" class="sortHeader" class:active={$hymnSort.field === "number"} on:click={() => toggleHymnSort("number")} title={translateText("hymns.sort_by_number")}>
            <span>No.</span>
            <span class="sortArrow">{sortArrow("number")}</span>
        </button>
        <button type="button" class="sortHeader" class:active={$hymnSort.field === "name"} on:click={() => toggleHymnSort("name")} title={translateText("hymns.sort_by_name")}>
            <T id="inputs.name" />
            <span class="sortArrow">{sortArrow("name")}</span>
        </button>
        <span class="translitHeader"><T id="hymns.transliteration" /></span>
    </div>

    {#if filtered.length}
        {#each filtered as hymn}
            <button class:selected={$hymnSelectedId === hymn.id} class="row" on:click={() => selectHymn(hymn)}>
                <span class="number">{formatHymnNumber(hymn.number, $language)}</span>
                <span class="title">{@html highlightHymnText(hymn.title, $hymnSearchValue)}</span>
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
        grid-template-columns: 52px minmax(0, 1.15fr) minmax(0, 0.85fr) 16px;
        gap: 10px;
        padding: 0.35rem 0.9rem;
        border-bottom: 1px solid var(--primary-lighter);
        position: sticky;
        top: 0;
        z-index: 1;
        background: color-mix(in srgb, var(--primary-darkest) 95%, var(--secondary) 5%);
        color: var(--secondary);
        font-weight: 700;
        font-size: 0.82rem;
    }

    .sortHeader {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-width: 0;
        margin: 0;
        padding: 0;
        border: none;
        background: transparent;
        color: var(--secondary);
        font: inherit;
        font-weight: 700;
        text-align: left;
        cursor: pointer;
    }

    .sortHeader:hover {
        color: var(--text);
    }

    .sortArrow {
        font-size: 0.7rem;
        opacity: 0.55;
    }

    .sortHeader.active {
        color: var(--text);
    }

    .sortHeader.active .sortArrow {
        opacity: 1;
    }

    .row {
        display: grid;
        grid-template-columns: 52px minmax(0, 1.15fr) minmax(0, 0.85fr) 16px;
        gap: 10px;
        align-items: center;
        border: 1px solid transparent;
        background: transparent;
        color: var(--text);
        text-align: left;
        padding: 0.32rem 0.9rem;
        border-bottom: 1px solid color-mix(in srgb, var(--primary-lighter) 55%, transparent 45%);
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
        border-radius: 6px;
        padding: 0.12rem 0.35rem;
        text-align: center;
        font-size: 0.85rem;
    }

    .title {
        font-weight: 600;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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