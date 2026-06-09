<script lang="ts">
    import { nepaliTypingTips } from "../../../utils/nepaliTyping"
    import { language } from "../../../stores"
    import T from "../../helpers/T.svelte"

    const sections = Object.entries(nepaliTypingTips) as [keyof typeof nepaliTypingTips, string[]][]

    function titleFor(section: keyof typeof nepaliTypingTips) {
        const labels = {
            vowels: $language === "ne" ? "स्वर" : "Vowels",
            consonants: $language === "ne" ? "व्यञ्जन" : "Consonants",
            conjuncts: $language === "ne" ? "संयुक्त अक्षर" : "Conjuncts",
            punctuation: $language === "ne" ? "विरामचिन्ह र अंक" : "Punctuation and digits",
            examples: $language === "ne" ? "उदाहरण" : "Examples"
        }

        return labels[section]
    }
</script>

<div class="tips">
    <p class="intro"><T id="typing.popup_intro" /></p>

    {#each sections as [section, entries]}
        <section class="card">
            <h3>{titleFor(section)}</h3>
            <ul>
                {#each entries as entry}
                    <li>{entry}</li>
                {/each}
            </ul>
        </section>
    {/each}
</div>

<style>
    .tips {
        display: grid;
        gap: 1rem;
        min-width: min(980px, 100%);
    }

    .intro {
        margin: 0;
        opacity: 0.82;
    }

    .card {
        background: color-mix(in srgb, var(--primary-darkest) 85%, black 15%);
        border: 1px solid var(--primary-lighter);
        border-radius: 14px;
        padding: 1rem 1.15rem;
    }

    h3 {
        margin: 0 0 0.75rem;
        color: var(--secondary);
    }

    ul {
        margin: 0;
        padding-left: 1.15rem;
        display: grid;
        gap: 0.45rem;
    }

    li {
        line-height: 1.5;
    }
</style>