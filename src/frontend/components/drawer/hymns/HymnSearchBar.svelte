<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from "svelte"
    import { nepaliTypingInput } from "../../helpers/inputActions"
    import { hymnSearchValue } from "./hymns"
    import { nepaliTypingEnabled } from "../../../stores"
    import T from "../../helpers/T.svelte"
    import { translateText } from "../../../utils/language"

    const dispatch = createEventDispatcher<{ input: string }>()

    let value = ""
    let searchInput: HTMLInputElement | null = null
    let debounceTimeout: ReturnType<typeof setTimeout> | null = null

    $: value = $hymnSearchValue
    $: placeholder = translateText($nepaliTypingEnabled ? "hymns.search_placeholder_ne" : "hymns.search_placeholder_en")

    function emitSearch(nextValue: string) {
        hymnSearchValue.set(nextValue)
        dispatch("input", nextValue)
    }

    function onInput(event: Event) {
        const target = event.currentTarget as HTMLInputElement
        const nextValue = target.value
        if (debounceTimeout) clearTimeout(debounceTimeout)
        debounceTimeout = setTimeout(() => emitSearch(nextValue), 300)
    }

    function clearSearch() {
        if (debounceTimeout) clearTimeout(debounceTimeout)
        value = ""
        emitSearch("")
        searchInput?.focus()
    }

    function focusSearch(event?: Event) {
        if (event) event.preventDefault()
        searchInput?.focus()
        searchInput?.select()
    }

    onMount(() => {
        window.addEventListener("hamro-hymns-focus-search", focusSearch)
    })

    onDestroy(() => {
        if (debounceTimeout) clearTimeout(debounceTimeout)
        window.removeEventListener("hamro-hymns-focus-search", focusSearch)
    })
</script>

<div class="searchbar">
    <label class="title" for="hymnSearchInput"><T id="hymns.search_label" /></label>
    <div class="inputRow">
        <input
            id="hymnSearchInput"
            bind:this={searchInput}
            type="text"
            class="searchInput"
            bind:value
            on:input={onInput}
            use:nepaliTypingInput
            placeholder={placeholder}
            inputmode="text"
            autocapitalize="off"
            autocomplete="off"
            spellcheck="false"
        />
        {#if value}
            <button class="clear" on:click={clearSearch} aria-label="Clear hymn search">×</button>
        {/if}
    </div>
    <p class="hint"><T id="hymns.typing_help" /></p>
</div>

<style>
    .searchbar {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        padding: 0.85rem 1rem 0.7rem;
        border-bottom: 1px solid var(--primary-lighter);
        background: linear-gradient(180deg, color-mix(in srgb, var(--primary-darkest) 94%, var(--secondary) 6%) 0%, var(--primary-darker) 100%);
    }

    .title {
        font-size: 0.8rem;
        opacity: 0.72;
        text-transform: uppercase;
        letter-spacing: 0.06em;
    }

    .inputRow {
        position: relative;
    }

    .searchInput {
        width: 100%;
        border: 1px solid color-mix(in srgb, var(--secondary) 25%, var(--primary-lighter) 75%);
        border-radius: 14px;
        background: var(--primary-darkest);
        color: var(--text);
        padding: 0.9rem 2.8rem 0.9rem 0.95rem;
        font: inherit;
        font-size: 1rem;
        outline: none;
    }

    .searchInput:focus {
        border-color: var(--secondary);
        box-shadow: 0 0 0 1px color-mix(in srgb, var(--secondary) 55%, transparent 45%);
    }

    .clear {
        position: absolute;
        right: 0.55rem;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: transparent;
        color: var(--text);
        opacity: 0.7;
        font-size: 1.5rem;
        line-height: 1;
        cursor: pointer;
    }

    .hint {
        margin: 0;
        font-size: 0.78rem;
        opacity: 0.68;
    }
</style>