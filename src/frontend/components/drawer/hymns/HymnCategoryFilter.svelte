<script lang="ts">
    import { language } from "../../../stores"
    import { getActiveCategoryId, getCategoryCounts, getHymnCategoryDisplay, hymnItems, hymnSelectedCategories, toggleCategory, type HymnCategoryId } from "./hymns"
    import T from "../../helpers/T.svelte"

    $: counts = getCategoryCounts($hymnItems)

    const categoryOrder: { id: HymnCategoryId; icon: string }[] = [
        { id: "all", icon: "●" },
        { id: "bhajan", icon: "◫" },
        { id: "chorus", icon: "◫" },
        { id: "children", icon: "◫" },
        { id: "new", icon: "◫" }
    ]

    function isChecked(id: HymnCategoryId) {
        return getActiveCategoryId($hymnSelectedCategories) === id
    }
</script>

<div class="sidebar">
    <button class="item allItem" class:active={isChecked("all")} on:click={() => toggleCategory("all")}>
        <span class="icon">●</span>
        <span class="label">{getHymnCategoryDisplay("all", $language)}</span>
        <span class="count">{counts.all}</span>
    </button>

    <div class="sectionLabel">
        <T id="hymns.categories_heading" />
    </div>

    <div class="filters">
        {#each categoryOrder.filter((category) => category.id !== "all") as category}
            <button class="item" class:active={isChecked(category.id)} on:click={() => toggleCategory(category.id)}>
                <span class="icon">{category.icon}</span>
                <span class="label">{getHymnCategoryDisplay(category.id, $language)}</span>
                <span class="count">{counts[category.id]}</span>
            </button>
        {/each}
    </div>
</div>

<style>
    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
        padding: 0.65rem 0 0.85rem;
        background: var(--primary-darker);
        height: 100%;
    }

    .sectionLabel {
        padding: 0.25rem 1rem 0.1rem;
        font-size: 0.78rem;
        opacity: 0.7;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    .filters {
        display: flex;
        flex-direction: column;
        gap: 0.15rem;
        overflow-y: auto;
        padding-right: 0.4rem;
    }

    .item {
        display: grid;
        grid-template-columns: 1rem 1fr auto;
        align-items: center;
        gap: 0.65rem;
        padding: 0.7rem 1rem;
        color: var(--text);
        cursor: pointer;
        border-left: 3px solid transparent;
        border: none;
        background: transparent;
        text-align: left;
    }

    .item:hover,
    .item.active {
        background: var(--hover);
    }

    .item.active {
        background: color-mix(in srgb, var(--secondary) 14%, var(--primary-darker) 86%);
        border-left-color: var(--secondary);
    }

    .icon {
        font-size: 0.95rem;
        line-height: 1;
        opacity: 0.8;
    }

    .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: normal;
        line-height: 1.25;
    }

    .count {
        font-size: 0.8rem;
        opacity: 0.65;
    }

    .allItem {
        margin-bottom: 0.25rem;
    }
</style>