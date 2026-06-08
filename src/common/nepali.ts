const NEPALI_DIGITS = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"]
const BS_MONTHS = ["बैशाख", "जेठ", "असार", "श्रावण", "भदौ", "आश्विन", "कार्तिक", "मंसिर", "पुष", "माघ", "फाल्गुण", "चैत"]
const BS_WEEKDAYS = ["आइतबार", "सोमबार", "मंगलबार", "बुधबार", "बिहीबार", "शुक्रबार", "शनिबार"]

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
        const pkg = require("bikram-js")
        const BikramCtor = pkg.Bikram || pkg.default || pkg
        const bikram = new BikramCtor()
        bikram.fromGregorian(date.getFullYear(), date.getMonth() + 1, date.getDate())

        const year = Number(bikram.getYear?.() || 0)
        const monthIndex = Number(bikram.getMonth?.() || 1) - 1
        const day = Number(bikram.getDay?.() || 0)
        const monthName = BS_MONTHS[monthIndex] || ""
        const weekdayName = BS_WEEKDAYS[date.getDay()] || ""

        return { year, monthIndex, day, monthName, weekdayName }
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