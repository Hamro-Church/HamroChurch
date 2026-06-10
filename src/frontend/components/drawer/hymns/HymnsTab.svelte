<script lang="ts">
    import { onDestroy, onMount } from "svelte"
    import { activeDrawerTab, activePopup, language } from "../../../stores"
    import HymnList from "./HymnList.svelte"
    import HymnSearchBar from "./HymnSearchBar.svelte"
    import { getActiveCategoryId, getCategoryCounts, getHymnCategoryDisplay, hymnItems, hymnLoadError, hymnLoading, hymnSelectedCategories, initializeHymnsPreferences, insertSelectedHymnIntoSlides, loadHymns } from "./hymns"
    import Loader from "../../main/Loader.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import T from "../../helpers/T.svelte"
    $: counts = getCategoryCounts($hymnItems)
    $: activeCategory = getActiveCategoryId($hymnSelectedCategories)

    function handleKeydown(event: KeyboardEvent) {
        if ($activeDrawerTab !== "hymns") return
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
            event.preventDefault()
            window.dispatchEvent(new CustomEvent("hamro-hymns-focus-search"))
            return
        }

        if (event.key === "Enter" && !(event.ctrlKey || event.metaKey)) {
            const activeElement = document.activeElement as HTMLElement | null
            if (activeElement?.tagName === "TEXTAREA") return
            if (activeElement?.closest("button")) return
            event.preventDefault()
            insertSelectedHymnIntoSlides()
        }
    }

    onMount(async () => {
        initializeHymnsPreferences()
        await loadHymns()
        window.addEventListener("keydown", handleKeydown)
    })

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown)
    })
</script>

<div class="hymnsPanel">
    <HymnSearchBar />

    <div class="toolbar">
        <MaterialButton variant="outlined" icon="add" on:click={() => activePopup.set("add_hymn")}>
            <T id="hymns.add_new" />
        </MaterialButton>
        <div class="activeBadge">{getHymnCategoryDisplay(activeCategory, $language)} <span>{counts[activeCategory]}</span></div>
    </div>

    {#if $hymnLoading}
        <div class="state"><Loader /></div>
    {:else if $hymnLoadError}
        <div class="state error"><T id="hymns.load_error" />: {$hymnLoadError}</div>
    {:else}
        <div class="resultsPane">
            <HymnList />
        </div>
    {/if}
</div>

<style>
    .hymnsPanel {
        display: flex;
        flex-direction: column;
        min-height: 0;
        height: 100%;
        background: linear-gradient(180deg, color-mix(in srgb, var(--primary-darkest) 88%, black 12%) 0%, var(--primary-darker) 100%);
    }

    .toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem 1rem;
        border-bottom: 1px solid var(--primary-lighter);
        background: color-mix(in srgb, var(--primary-darker) 94%, var(--secondary) 6%);
    }

    .resultsPane {
        min-height: 0;
        flex: 1;
    }

    .state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 260px;
        padding: 2rem;
    }

    .activeBadge {
        display: inline-flex;
        align-items: center;
        gap: 0.55rem;
        padding: 0.45rem 0.8rem;
        border: 1px solid color-mix(in srgb, var(--secondary) 35%, var(--primary-lighter) 65%);
        border-radius: 999px;
        font-size: 0.82rem;
        color: var(--text);
        background: color-mix(in srgb, var(--primary-darkest) 80%, black 20%);
    }

    .activeBadge span {
        color: var(--secondary);
        font-weight: 700;
    }

    .error {
        color: #ffb4a8;
    }
</style>