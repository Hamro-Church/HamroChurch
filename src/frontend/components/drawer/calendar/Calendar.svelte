<script lang="ts">
    import { activeDays, activePopup, eventEdit, events, labelsDisabled, language, popupData, special } from "../../../stores"
    import { translateText } from "../../../utils/language"
    import { BS_MONTHS, bsToGregorian, getBsDateParts, getBsMonthLength, shouldUseNepaliLocale, toNepaliDigits } from "../../../../common/nepali"
    import { actionData } from "../../actions/actionData"
    import { removeDuplicates, sortByTime } from "../../helpers/array"
    import Icon from "../../helpers/Icon.svelte"
    import T from "../../helpers/T.svelte"
    import FloatingInputs from "../../input/FloatingInputs.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import { MILLISECONDS_IN_A_DAY, copyDate, getDaysInMonth, getWeekNumber, isBetween, isSameDay } from "./calendar"

    export let active: string | null
    export let searchValue = ""

    // WIP search for events
    $: console.log(searchValue)

    $: sundayFirstDay = ($special.firstDayOfWeek || "7") === "7"

    // Display the calendar using the Nepali Bikram Sambat system when running in a Nepali locale.
    $: useBs = shouldUseNepaliLocale($language)
    $: bsView = useBs ? getBsDateParts(current) : null
    const BS_WEEKDAYS_SHORT = ["आइत", "सोम", "मंगल", "बुध", "बिही", "शुक्र", "शनि"]

    let today = new Date()
    $: current = new Date(today.getFullYear(), today.getMonth())
    $: year = current.getFullYear()
    $: month = current.getMonth()

    activeDays.set([copyDate(today).getTime()])

    let days: Date[][] = []
    let bsInfo = new Map<number, { bsDay: number; inMonth: boolean }>()
    $: getDays(month, sundayFirstDay, useBs, current)

    function getDays(month: number, _updater: any, _bs?: any, _current?: any) {
        if (useBs) {
            buildBsGrid()
            return
        }

        let daysList: any = []
        for (let i = 1; i <= getDaysInMonth(year, month); i++) daysList.push(new Date(year, month, i))

        let before: Date[] = getDaysBefore(daysList[0].getDay())

        daysList = [...before, ...daysList]
        days = []

        while (daysList.length < 42) daysList.push(copyDate(daysList[daysList.length - 1], 1))
        while (daysList.length) days.push(daysList.splice(0, 7))
    }

    // Build a true Bikram Sambat month grid. Each cell stays a Gregorian Date so events,
    // selection and "today" highlighting keep working; bsInfo holds the BS day label per cell.
    function buildBsGrid() {
        const parts = getBsDateParts(current)
        const bsYear = parts.year
        const bsMonth = parts.monthIndex + 1
        const monthStart = bsToGregorian(bsYear, bsMonth, 1)
        const monthLength = getBsMonthLength(bsYear, bsMonth)
        const firstWeekday = monthStart.getDay()
        const lead = sundayFirstDay ? firstWeekday : (firstWeekday + 6) % 7
        const prevMonth = bsMonth === 1 ? 12 : bsMonth - 1
        const prevYear = bsMonth === 1 ? bsYear - 1 : bsYear
        const prevLength = lead > 0 ? getBsMonthLength(prevYear, prevMonth) : 0

        const info = new Map<number, { bsDay: number; inMonth: boolean }>()
        const cells: Date[] = []
        for (let i = 0; i < 42; i++) {
            const date = copyDate(monthStart, i - lead)
            let bsDay: number
            let inMonth: boolean
            if (i < lead) {
                bsDay = prevLength - lead + 1 + i
                inMonth = false
            } else if (i < lead + monthLength) {
                bsDay = i - lead + 1
                inMonth = true
            } else {
                bsDay = i - lead - monthLength + 1
                inMonth = false
            }
            info.set(date.getTime(), { bsDay, inMonth })
            cells.push(date)
        }

        bsInfo = info
        days = []
        while (cells.length) days.push(cells.splice(0, 7))
    }

    function shiftBsMonth(direction: number): Date {
        const parts = getBsDateParts(current)
        let bsMonth = parts.monthIndex + 1 + direction
        let bsYear = parts.year
        if (bsMonth > 12) {
            bsMonth = 1
            bsYear += 1
        } else if (bsMonth < 1) {
            bsMonth = 12
            bsYear -= 1
        }
        return bsToGregorian(bsYear, bsMonth, 1)
    }

    function getDaysBefore(firstDay: number): Date[] {
        if (!sundayFirstDay && firstDay < 1 && firstDay <= 1 && firstDay !== 0) return []

        let before: Date[] = []
        let i = (sundayFirstDay ? firstDay : firstDay === 0 ? 6 : firstDay - 1) - 1
        for (i; i >= 0; i--) before.push(new Date(year, month, -i))

        return before
    }

    let currentEvents: any[] = []
    $: updateEvents($events, days)

    function updateEvents(events: any, _updater: any) {
        if (!days[0]) return

        currentEvents = []
        let first = days[0][0].getTime()
        let last = days[5][days.length - 1].getTime()

        Object.entries(events).forEach(([id, event]: any) => {
            let from = new Date(event.from).getTime()
            let to = new Date(event.to)?.getTime() || 0

            let startOrEndIsInMonth = from > first || from < last || to > first || to < last
            if (startOrEndIsInMonth) currentEvents.push({ id, ...event })
        })

        currentEvents = currentEvents.sort((a, b) => a.from - b.from)
    }

    let weekdays: string[] = []
    $: {
        weekdays = []
        for (let i = 0; i < 7; i++) {
            if (useBs) {
                const weekdayIndex = sundayFirstDay ? i : (i + 1) % 7
                weekdays.push(BS_WEEKDAYS_SHORT[weekdayIndex])
            } else {
                let index = sundayFirstDay ? (i === 0 ? 7 : i) : i + 1
                weekdays.push(translateText("weekday." + index))
            }
        }
    }

    let calendarElem: HTMLElement | undefined
    let nextScrollTimeout: NodeJS.Timeout | null = null
    function wheel(e: any) {
        if (nextScrollTimeout || !calendarElem) return

        let scrollDown = e.deltaY > 0
        if (scrollDown) nextMonth(true)
        else previousMonth(true)

        let isMouseAndNotTrackpad = e.deltaY >= 100 || e.deltaY <= -100
        if (isMouseAndNotTrackpad) return

        nextScrollTimeout = setTimeout(() => {
            nextScrollTimeout = null
        }, 500)
    }

    function nextMonth(checkScroll = false) {
        if (!calendarElem) return
        let scrolledToBottom = calendarElem.scrollTop + 1 + calendarElem.offsetHeight >= calendarElem.scrollHeight
        if (checkScroll && !scrolledToBottom) return

        current = useBs ? shiftBsMonth(1) : new Date(year, month, 33)
    }

    function previousMonth(checkScroll = false) {
        let scrolledToTop = calendarElem?.scrollTop === 0
        if (checkScroll && !scrolledToTop) return

        current = useBs ? shiftBsMonth(-1) : new Date(year, month, 0)
    }

    function getEvents(day: Date, currentEvents: any[], type: string) {
        let events: any[] = []
        currentEvents.forEach((a) => {
            let eventIsAtDayOrGoingThrough = a.to ? isBetween(new Date(a.from), new Date(a.to), copyDate(day)) : isSameDay(new Date(a.from), day)
            if (eventIsAtDayOrGoingThrough) events.push(a)
        })
        events.sort(sortByTime)
        events = events.filter((a) => a.type === type)

        return events
    }

    function dayClick(e: any, day: Date) {
        day = copyDate(day)

        if (e.ctrlKey || e.metaKey) return toggleCurrentDay(day)
        if (e.shiftKey) return selectRange(day)

        activeDays.set([day.getTime()])
    }

    function toggleCurrentDay(day: Date) {
        activeDays.update((a) => {
            let alreadySelected = a.includes(day.getTime())
            if (!alreadySelected) return [...a, day.getTime()]

            if (a.length < 2) return a
            a.splice(a.indexOf(day.getTime()), 1)

            return a
        })
    }

    function selectRange(day: Date) {
        let first = $activeDays[0] || day.getTime()
        let last = day.getTime()
        let timeDifference = day.getTime() - first
        if (timeDifference === 0) return

        // invert
        if (timeDifference < 0) {
            first = last
            last = $activeDays[$activeDays.length - 1]
        }

        let newActiveDays: number[] = []
        let count = 0

        do {
            let newDay = copyDate(new Date(first + count * MILLISECONDS_IN_A_DAY)).getTime()
            newActiveDays.push(newDay)
            count++
        } while (!isSameDay(new Date(newActiveDays[newActiveDays.length - 1]), new Date(last)))

        activeDays.set(newActiveDays)
    }

    function move(e: any, day: Date) {
        if (!e.buttons) return
        activeDays.set(removeDuplicates([...$activeDays, copyDate(day).getTime()]))
    }

    // listen for update
    $: if ($popupData?.action === "select_show" && $popupData?.location === "event" && $popupData?.showId) selectedShow()
    function selectedShow() {
        // let animation finish
        setTimeout(() => activePopup.set("edit_event"), 300)
    }

    function getEventIcon(type: string, { actionId }) {
        if (type === "event") return "calendar"
        if (type === "action") return actionData[actionId]?.icon || "actions"
        return type
    }

    $: isPresentDay = !!$activeDays.length && isSameDay(new Date($activeDays[0]), today) && isSameMonthView(current, new Date($activeDays[0]))
    function isSameMonthView(a: Date, b: Date) {
        if (useBs) {
            const partsA = getBsDateParts(a)
            const partsB = getBsDateParts(b)
            return partsA.year === partsB.year && partsA.monthIndex === partsB.monthIndex
        }
        return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
    }
    function setToPresentDay() {
        current = today
        activeDays.set([copyDate(today).getTime()])
    }
</script>

<div class="calendar">
    <div class="week" style="flex: 1;">
        <div class="weekday" style="min-width: 25px;flex: 1;padding: 0;background-color: var(--primary-darker);font-size: 0.9em;opacity: 0.7;font-weight: 600;">
            {useBs && bsView ? toNepaliDigits(bsView.year) : current.getFullYear().toString().slice(2)}
        </div>

        {#each weekdays as weekday}
            <div class="weekday">
                {weekday}
                <!-- {weekday.slice(0, 3)} -->
            </div>
        {/each}
    </div>

    <div class="grid" on:wheel|passive={wheel} bind:this={calendarElem}>
        {#each days as week}
            <div class="week">
                <span class="weeknumber">
                    {getWeekNumber(week[0])}
                </span>

                {#each week as day}
                    {@const dayEvents = getEvents(day, currentEvents, active || "event")}
                    <div class="day" class:today={isSameDay(day, today)} class:faded={useBs ? !bsInfo.get(day.getTime())?.inMonth : day.getMonth() !== month || day.getFullYear() !== year} class:active={$activeDays?.includes(copyDate(day).getTime())} on:mousedown={(e) => dayClick(e, day)} on:mousemove={(e) => move(e, day)}>
                        <!-- // isSameDay(day, new Date($activeDays[0]))} -->
                        <span style="font-size: 1.5em;font-weight: 600;">{useBs ? toNepaliDigits(bsInfo.get(day.getTime())?.bsDay ?? day.getDate()) : day.getDate()}</span>
                        <span class="events">
                            {#each dayEvents as event, i}
                                {@const eventIcon = getEventIcon(event.type, { actionId: event.action?.id })}

                                {#if dayEvents.length > 3 && i > 1}
                                    <span class="dot" style="background-color: {event.color || 'white'}" data-title={event.name} />
                                {:else}
                                    <div class="event" style="color: {event.color || 'white'}" data-title={event.name}>
                                        <Icon id={eventIcon} right white />
                                        <p>{event.name}</p>
                                    </div>
                                {/if}
                            {/each}
                        </span>
                    </div>
                {/each}
            </div>
        {/each}
    </div>
</div>

<FloatingInputs style="margin-left: 25px;" side="left">
    <MaterialButton title="media.previous" on:click={() => previousMonth()}>
        <Icon id="previous" size={1.1} />
    </MaterialButton>
    <MaterialButton title="media.next" on:click={() => nextMonth()}>
        <Icon id="next" size={1.1} />
    </MaterialButton>

    <div class="divider"></div>

    <MaterialButton title="calendar.today" isActive={isPresentDay} on:click={setToPresentDay}>
        <Icon id="home" white={!isPresentDay} size={1.1} />
    </MaterialButton>

    <div class="divider"></div>

    <span style="opacity: 0.8;text-transform: capitalize;white-space: nowrap;align-self: center;padding: 0 10px;">
        {#if useBs && bsView}
            {BS_MONTHS[bsView.monthIndex]} {toNepaliDigits(bsView.year)}
        {:else}
            {translateText("month." + (current.getMonth() + 1))}
            {current.getFullYear()}
        {/if}
    </span>
</FloatingInputs>

<FloatingInputs onlyOne>
    <MaterialButton
        on:click={() => {
            eventEdit.set(null)
            popupData.set({})
            activePopup.set("edit_event")
        }}
    >
        <Icon id="add" right={!$labelsDisabled} />
        {#if !$labelsDisabled}<T id="new.{active === 'action' ? 'event_action' : 'event'}" />{/if}
    </MaterialButton>
</FloatingInputs>

<style>
    .calendar {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        overflow-y: auto;
    }

    .grid {
        flex: 10;
        display: flex;
        flex-direction: column;

        overflow: auto;
    }

    .week {
        display: flex;
        flex: 2;
        justify-content: space-between;
    }

    .day,
    .weekday {
        padding: 5px;
        flex: 4;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .weekday {
        overflow: hidden;
        text-transform: capitalize;
        background-color: var(--primary-darkest);
    }

    .weeknumber {
        min-width: 25px;
        font-size: 0.8em;
        flex: 1;
        color: var(--secondary);
        background-color: var(--primary-darkest);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .day {
        flex-direction: column;
        overflow: hidden;
    }
    .day:hover {
        background-color: var(--hover);
    }

    .day.faded {
        opacity: 0.5;
    }
    .day.today {
        color: var(--secondary);
        background-color: var(--primary-darkest);
    }
    .day.active {
        background-color: var(--focus);
    }

    .events {
        /* flex: 3; */
        width: 100%;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
    }

    .event {
        padding: 2px 5px;
        text-align: center;
        width: 100%;
        display: flex;
        align-items: center;
    }
    .dot {
        display: flex;
        height: 10px;
        width: 10px;
        border-radius: 50%;
        margin: 2px;
    }
</style>
