<script lang="ts">
    import { hymnTypingLanguage, setTypingLanguage, type HymnTypingLanguage } from "./hymns"
    import T from "../../helpers/T.svelte"

    export let compact = false

    function selectLanguage(value: HymnTypingLanguage) {
        setTypingLanguage(value)
    }
</script>

<div class="toggle" class:compact>
    <span class="label"><T id="hymns.typing" /></span>
    <button class:active={$hymnTypingLanguage === "ne"} on:click={() => selectLanguage("ne")}>नेपाली</button>
    <button class:active={$hymnTypingLanguage === "en"} on:click={() => selectLanguage("en")}>EN</button>
</div>

<style>
    .toggle {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        padding: 0.35rem;
        border-radius: 999px;
        border: 1px solid var(--primary-lighter);
        background: var(--primary-darkest);
    }

    .label {
        font-size: 0.75rem;
        opacity: 0.72;
        padding-inline: 0.5rem;
        white-space: nowrap;
    }

    .compact .label {
        display: none;
    }

    button {
        border: none;
        background: transparent;
        color: var(--text);
        font: inherit;
        font-weight: 700;
        cursor: pointer;
        border-radius: 999px;
        padding: 0.45rem 0.8rem;
    }

    button.active {
        background: var(--secondary);
        color: var(--primary-darkest);
    }
</style>