<script lang="ts">
    import { onMount } from "svelte"
    import { activePopup, currentWindow, language, nepaliTypingEnabled } from "../../stores"
    import { initializeNepaliTypingPreference, toggleNepaliTyping } from "../../utils/nepaliTyping"

    function toggleTips() {
        activePopup.set("nepali_typing_tips")
    }

    function keydown(event: KeyboardEvent) {
        if (!(event.ctrlKey && event.altKey && event.key.toLowerCase() === "n")) return
        if ($currentWindow) return
        event.preventDefault()
        toggleNepaliTyping()
    }

    onMount(() => {
        initializeNepaliTypingPreference()
    })

    $: label = $nepaliTypingEnabled ? "ने" : "EN"
    $: helpLabel = $language === "ne" ? "नेपाली टाइपिंग सुझावहरू" : "Nepali typing tips"
</script>

<svelte:window on:keydown={keydown} />

{#if !$currentWindow}
    <div class="typingControls">
        <button class:active={$nepaliTypingEnabled} class="toggle" on:click={() => toggleNepaliTyping()} title={helpLabel}>
            <span class="mode">{label}</span>
            <span class="shortcut">Ctrl+Alt+N</span>
        </button>
        <button class="help" on:click={toggleTips} aria-label={helpLabel}>?</button>
    </div>
{/if}

<style>
    .typingControls {
        position: fixed;
        right: 18px;
        bottom: 18px;
        display: flex;
        align-items: center;
        gap: 10px;
        z-index: 31;
    }

    .toggle,
    .help {
        border: 1px solid color-mix(in srgb, var(--secondary) 45%, var(--primary-lighter) 55%);
        background: color-mix(in srgb, var(--primary-darkest) 88%, black 12%);
        color: var(--text);
        border-radius: 999px;
        box-shadow: 0 8px 24px rgb(0 0 0 / 0.28);
    }

    .toggle {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        padding: 10px 16px;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
    }

    .toggle.active {
        border-color: var(--secondary);
        color: var(--secondary);
    }

    .mode {
        font-size: 1rem;
        line-height: 1;
    }

    .shortcut {
        font-size: 0.82rem;
        opacity: 0.76;
    }

    .help {
        width: 40px;
        height: 40px;
        cursor: pointer;
        font: inherit;
        font-weight: 700;
        font-size: 1rem;
    }
    .help:hover,
    .toggle:hover {
        border-color: var(--secondary);
    }
    @media (max-width: 900px) {
        .typingControls {
            right: 12px;
            bottom: 12px;
        }

        .shortcut {
            display: none;
        }
    }
</style>