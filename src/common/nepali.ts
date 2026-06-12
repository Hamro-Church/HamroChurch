const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"]
export const BS_MONTHS = ["बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन", "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुण", "चैत"]
export const BS_WEEKDAYS = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"]

/**
 * Self-contained Bikram Sambat (Nepali) date conversion.
 *
 * Ported from the GPL-3.0 "bikram-js" library (Build-for-Nepal / Khumnath CG), which in turn
 * implements the Surya Siddhanta based Pancanga calculations by M. Fushimi and M. Yano.
 * The library is vendored here because the published npm package only ships uncompiled
 * TypeScript (no dist build), so requiring it at runtime fails in the bundled app.
 */
const YUGA_ROTATION_STAR = 1582237828
const YUGA_ROTATION_SUN = 4320000
const YUGA_CIVIL_DAYS = YUGA_ROTATION_STAR - YUGA_ROTATION_SUN
const PLANET_APOGEE_SUN = 77 + 17 / 60
const PLANET_CIRCUMM_SUN = 13 + 50 / 60
const RAD = 57.2957795 // 180 / pi

function gregorianFromJulian(julianDate: number): { year: number; month: number; day: number } {
    const a = Math.floor(julianDate + 0.5)
    const b = a + 1537
    const c = Math.floor((b - 122.1) / 365.25)
    const d = Math.floor(365.25 * c)
    const e = Math.floor((b - d) / 30.6001)
    const f = b - d - Math.floor(30.6001 * e) + (julianDate + 0.5 - a)
    const day = Math.floor(f)
    const month = e < 14 ? e - 1 : e - 13
    const year = month > 2 ? c - 4716 : c - 4715
    return { year, month, day }
}

function getTslong(ahar: number): number {
    const t1 = ((YUGA_ROTATION_SUN * ahar) / YUGA_CIVIL_DAYS) % 1
    const mslong = 360 * t1
    const x1 = mslong - PLANET_APOGEE_SUN
    const y2 = Math.sin(x1 / RAD)
    const y3 = (PLANET_CIRCUMM_SUN / 360) * y2
    const x2 = Math.asin(y3) * RAD
    return mslong - x2
}

function todaySauraMasaFirst(ahar: number): boolean {
    const tslongToday = getTslong(ahar)
    const tslongTomorrow = getTslong(ahar + 1)
    const todayMod = tslongToday - Math.floor(tslongToday / 30) * 30
    const tomorrowMod = tslongTomorrow - Math.floor(tslongTomorrow / 30) * 30
    return todayMod > 25 && tomorrowMod < 5
}

// Iterative form of bikram-js getSauraMasaDay (avoids deep recursion).
function getSauraMasaDay(ahar: number): { month: number; day: number } {
    let start = ahar
    while (!todaySauraMasaFirst(start)) start -= 1
    const day = ahar - start + 1
    const month = ((Math.floor(getTslong(start + 1) / 30) % 12) + 12) % 12
    return { month, day }
}

function gregorianToBs(date: Date): { year: number; monthIndex: number; day: number } {
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()

    // The Surya-Siddhanta year term in the original library is unreliable near the new-year
    // boundary, so derive the BS year from the (consistent) bsToGregorian inverse instead.
    let year = date.getFullYear() + 57
    while (bsToGregorian(year, 1, 1).getTime() > target) year -= 1
    while (bsToGregorian(year + 1, 1, 1).getTime() <= target) year += 1

    for (let month = 1; month <= 12; month++) {
        const monthStart = bsToGregorian(year, month, 1).getTime()
        const length = getBsMonthLength(year, month)
        const dayOffset = Math.round((target - monthStart) / 86400000)
        if (dayOffset >= 0 && dayOffset < length) return { year, monthIndex: month - 1, day: dayOffset + 1 }
    }

    return { year: year + 1, monthIndex: 0, day: 1 }
}

/**
 * Convert a Bikram Sambat date (1-based month) to a Gregorian Date.
 */
export function bsToGregorian(bsYear: number, bsMonth: number, bsDay: number): Date {
    const yearSaka = bsYear - 135
    const yearKali = yearSaka + 3179
    let ahar = Math.floor((yearKali * YUGA_CIVIL_DAYS) / YUGA_ROTATION_SUN)
    let { month: sauraMonth, day: sauraDay } = getSauraMasaDay(ahar)
    const targetMonth = (bsMonth + 11) % 12

    while (sauraMonth !== targetMonth || sauraDay !== bsDay) {
        ahar += sauraMonth < targetMonth || (sauraMonth === targetMonth && sauraDay < bsDay) ? 1 : -1
        ;({ month: sauraMonth, day: sauraDay } = getSauraMasaDay(ahar))
    }

    const { year, month, day } = gregorianFromJulian(ahar + 588465.5)
    return new Date(year, month - 1, day)
}

/**
 * Number of days in a given Bikram Sambat month (1-based month).
 */
export function getBsMonthLength(bsYear: number, bsMonth: number): number {
    const start = bsToGregorian(bsYear, bsMonth, 1)
    const nextMonth = (bsMonth % 12) + 1
    const nextYear = bsMonth === 12 ? bsYear + 1 : bsYear
    const nextStart = bsToGregorian(nextYear, nextMonth, 1)
    return Math.round((nextStart.getTime() - start.getTime()) / 86400000)
}

export function shouldUseNepaliLocale(locale: string | null | undefined) {
    return String(locale || "").toLowerCase().startsWith("ne")
}

export function toNepaliDigits(value: string | number) {
    return String(value).replace(/\d/g, (digit) => NEPALI_DIGITS[Number(digit)] || digit)
}

export function fromNepaliDigits(value: string) {
    return String(value).replace(/[०-९]/g, (digit) => String(NEPALI_DIGITS.indexOf(digit)))
}

export function localizeNumberText(value: string | number, locale = "ne") {
    return shouldUseNepaliLocale(locale) ? toNepaliDigits(value) : String(value)
}

export function getNepaliMeridiem(hours: number) {
    return hours >= 12 ? "अपराह्न" : "पूर्वाह्न"
}

export function getBsDateParts(date: Date) {
    try {
        const { year, monthIndex, day } = gregorianToBs(date)
        return {
            year,
            monthIndex,
            day,
            monthName: BS_MONTHS[monthIndex] || "",
            weekdayName: BS_WEEKDAYS[date.getDay()] || ""
        }
    } catch (error) {
        console.warn("Falling back to Gregorian date for Nepali formatting:", error)
        return {
            year: date.getFullYear(),
            monthIndex: date.getMonth(),
            day: date.getDate(),
            monthName: BS_MONTHS[date.getMonth()] || "",
            weekdayName: BS_WEEKDAYS[date.getDay()] || ""
        }
    }
}

export function formatBsDate(date: Date, includeWeekday = false) {
    const { year, day, monthName, weekdayName } = getBsDateParts(date)
    const core = `${toNepaliDigits(year)} ${monthName} ${toNepaliDigits(day)}`.trim()
    return includeWeekday ? `${weekdayName}, ${core}` : core
}

export function formatLocalizedDate(date: Date, locale = "ne", includeWeekday = false) {
    if (shouldUseNepaliLocale(locale)) return formatBsDate(date, includeWeekday)

    return new Intl.DateTimeFormat(locale || "en", {
        weekday: includeWeekday ? "long" : undefined,
        year: "numeric",
        month: "long",
        day: "numeric"
    }).format(date)
}

export function formatNepaliTime(date: Date, is12Hour: boolean, includeSeconds: boolean) {
    let hours = date.getHours()
    const minutes = String(date.getMinutes()).padStart(2, "0")
    const seconds = String(date.getSeconds()).padStart(2, "0")
    let suffix = ""

    if (is12Hour) {
        suffix = ` ${getNepaliMeridiem(hours)}`
        if (hours === 0) hours = 12
        else if (hours > 12) hours -= 12
    }

    const clock = includeSeconds ? `${hours}:${minutes}:${seconds}` : `${hours}:${minutes}`
    return `${toNepaliDigits(clock)}${suffix}`
}

export function formatLocalizedTime(date: Date, locale = "ne", is12Hour = false, includeSeconds = true) {
    if (shouldUseNepaliLocale(locale)) return formatNepaliTime(date, is12Hour, includeSeconds)

    return new Intl.DateTimeFormat(locale || "en", {
        hour: is12Hour ? "numeric" : "2-digit",
        minute: "2-digit",
        second: includeSeconds ? "2-digit" : undefined,
        hour12: is12Hour
    })
        .format(date)
        .replace(/\u202f/g, " ")
}