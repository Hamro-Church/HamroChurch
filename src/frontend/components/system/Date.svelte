<script lang="ts">
    import { getBsDateParts, shouldUseNepaliLocale, toNepaliDigits } from "../../../common/nepali"
    import { onDestroy, onMount } from "svelte"
    import { language } from "../../stores"
    import T from "../helpers/T.svelte"

    // let format = "dd/mm/yyyy"
    // let format = "d m y, day"
    export let format = "day,d,m,y"

    let d: Date = new Date()

    let dateInterval: NodeJS.Timeout | null = null
    onMount(() => {
        // check for new day every 10 seconds
        dateInterval = setInterval(() => (d = new Date()), 10000)
    })
    onDestroy(() => {
        if (dateInterval) clearInterval(dateInterval)
    })

    // WIP same format as dateToString(d, true, $dictionary)
    $: data = (() => {
        if (shouldUseNepaliLocale($language)) {
            const parts = getBsDateParts(d)
            return {
                d: toNepaliDigits(parts.day) + ".",
                day: parts.weekdayName,
                m: parts.monthName,
                y: toNepaliDigits(parts.year),
                bs: `${parts.weekdayName} ${toNepaliDigits(parts.day)} ${parts.monthName} ${toNepaliDigits(parts.year)}`
            }
        }

        return {
            d: d.getDate() + ".",
            day: "T: weekday." + (d.getDay() === 0 ? 7 : d.getDay()),
            m: "T: month." + (d.getMonth() + 1),
            y: d.getFullYear(),
            bs: ""
        }
    })()
</script>

<div>
    {#each format.split(",") as key}
        <span>
            {#key d}
                {#if data[key].toString().includes("T: ")}
                    <T id={data[key].slice(3, data[key].length)} />
                {:else}
                    {data[key]}
                {/if}
                {" "}
            {/key}
        </span>
    {/each}
</div>

<style>
    div span:first-child {
        text-transform: capitalize;
    }
</style>
