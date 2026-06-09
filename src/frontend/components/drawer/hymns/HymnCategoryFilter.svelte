<script lang="ts">
    import { getCategoryCounts, hymnItems, hymnSelectedCategories, toggleCategory, type HymnCategoryId } from "./hymns"
    import T from "../../helpers/T.svelte"

    let collapsed = false

    $: counts = getCategoryCounts($hymnItems)

    const categoryOrder: { id: HymnCategoryId; icon: string; label: string }[] = [
        { id: "all", icon: "●", label: "hymns.all" },
        { id: "bhajan", icon: "🎵", label: "hymns.bhajan" },
        { id: "chorus", icon: "🎶", label: "hymns.chorus" },
        { id: "children", icon: "🧒", label: "hymns.children" },
        { id: "new", icon: "✨", label: "hymns.new" }
    ]

    function isChecked(id: HymnCategoryId) {
        return $hymnSelectedCategories.includes(id)
    }
</script>

<div class="sidebar">
    <div class="header">
        <div>
            <h3><T id="tabs.hymns" /></h3>
            <p>{counts.all} <T id="hymns.count" /></p>
        </div>
        <button class="collapse" on:click={() => (collapsed = !collapsed)} aria-label={collapsed ? "Expand hymn filters" : "Collapse hymn filters"}>
            <T id={collapsed ? "hymns.expand" : "hymns.collapse"} />
        </button>
    </div>

    {#if !collapsed}
        <div class="filters">
            {#each categoryOrder as category}
                <label class="item">
                    <input type="checkbox" checked={isChecked(category.id)} on:change={() => toggleCategory(category.id)} />
                    <span class="icon">{category.icon}</span>
                    <span class="label"><T id={category.label} /></span>
                    <span class="count">{counts[category.id]}</span>
                </label>
            {/each}
        </div>
    {/if}
</div>

<style>
    .sidebar {
        display: flex;
        flex-direction: column;
        gap: 0.8rem;
        padding: 0.75rem 0 0.85rem;
        background: var(--primary-darker);
        height: 100%;
    }

    .header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 0.5rem;
        padding: 0 1rem;
    }

    .header h3,
    .header p {
        margin: 0;
    }

    .header h3 {
        font-size: 1rem;
        color: var(--text);
    }

    .header p {
        font-size: 0.78rem;
        opacity: 0.7;
    }

    .collapse {
        border: none;
        background: transparent;
        color: var(--secondary);
        font: inherit;
        font-size: 0.78rem;
        cursor: pointer;
        white-space: nowrap;
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
        grid-template-columns: 1rem 1.4rem 1fr auto;
        align-items: center;
        gap: 0.65rem;
        padding: 0.7rem 1rem;
        color: var(--text);
        cursor: pointer;
        border-left: 3px solid transparent;
    }

    .item:hover {
        background: var(--hover);
    }

    .item:has(input:checked) {
        background: color-mix(in srgb, var(--secondary) 14%, var(--primary-darker) 86%);
        border-left-color: var(--secondary);
    }

    .item input {
        margin: 0;
        accent-color: var(--secondary);
    }

    .icon {
        font-size: 1rem;
        line-height: 1;
    }

    .label {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .count {
        font-size: 0.8rem;
        opacity: 0.65;
    }
</style>