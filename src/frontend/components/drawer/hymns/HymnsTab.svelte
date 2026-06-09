<script lang="ts">
    import { onDestroy, onMount } from "svelte"
    import { activeDrawerTab } from "../../../stores"
    import HymnList from "./HymnList.svelte"
    import HymnSearchBar from "./HymnSearchBar.svelte"
    import HymnViewer from "./HymnViewer.svelte"
    import { hymnLoadError, hymnLoading, initializeHymnsPreferences, insertSelectedHymnIntoSlides, loadHymns } from "./hymns"
    import Loader from "../../main/Loader.svelte"
    import MaterialCheckbox from "../../inputs/MaterialCheckbox.svelte"
    import T from "../../helpers/T.svelte"

    let favoritesOnly = false

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
        <MaterialCheckbox label="hymns.favorites_only" checked={favoritesOnly} on:change={(e) => (favoritesOnly = e.detail)} />
    </div>

    {#if $hymnLoading}
        <div class="state"><Loader /></div>
    {:else if $hymnLoadError}
        <div class="state error"><T id="hymns.load_error" />: {$hymnLoadError}</div>
    {:else}
        <div class="mainPane">
            <div class="resultsPane">
                <HymnList {favoritesOnly} />
            </div>
            <div class="viewerPane">
                <HymnViewer />
            </div>
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

    .mainPane {
        display: grid;
        grid-template-columns: minmax(320px, 0.9fr) minmax(360px, 1.1fr);
        min-height: 0;
        flex: 1;
    }

    .resultsPane {
        min-height: 0;
        border-right: 1px solid var(--primary-lighter);
    }

    .viewerPane {
        min-height: 0;
    }

    .state {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 260px;
        padding: 2rem;
    }

    .error {
        color: #ffb4a8;
    }

    @media (max-width: 1180px) {
        .mainPane {
            grid-template-columns: 1fr;
        }

        .resultsPane {
            border-right: none;
            border-bottom: 1px solid var(--primary-lighter);
            max-height: 40vh;
        }
    }
</style>