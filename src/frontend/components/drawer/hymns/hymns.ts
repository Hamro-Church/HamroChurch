import { get, writable } from "svelte/store"
import { uid } from "uid"
import { fromNepaliDigits, shouldUseNepaliLocale, toNepaliDigits } from "../../../../common/nepali"
import type { Show } from "../../../../types/Show"
import { ShowObj } from "../../../classes/Show"
import { createCategory } from "../../../converters/importHelpers"
import { requestMain } from "../../../IPC/main"
import { activeProject, activeShow, language } from "../../../stores"
import { newToast } from "../../../utils/common"
import { translateText } from "../../../utils/language"
import { history } from "../../helpers/history"
import { checkName } from "../../helpers/show"
import { Main } from "../../../../types/IPC/Main"

export type HymnCategoryId = "all" | "bhajan" | "chorus" | "children" | "new"
export type HymnTypingLanguage = "ne" | "en"

type RawHymnSong = {
    sourceKey?: string
    sourcePage?: string
    title?: string
    titleEn?: string | null
    category?: string
    language?: string
    sourceRefs?: string[]
    lyrics?: string
    slides?: string[]
    authors?: string
    hasLyrics?: boolean
    rawDetails?: string
}

type RawHymnPayload = {
    version?: number
    source?: { name?: string; url?: string }
    language?: string
    categories?: { name?: string; songs?: RawHymnSong[] }[]
}

export type HymnRecord = {
    id: string
    sourceKey: string
    sourcePage: string
    title: string
    titleEn: string
    categoryRaw: string
    categoryId: HymnCategoryId
    number: string
    lyrics: string
    verses: string[]
    authors: string
    rawDetails: string
    firstLine: string
    searchTitle: string
    searchTitleEn: string
    searchLyrics: string
    searchNumber: string
}

const TYPING_LANGUAGE_KEY = "hamrochurch.hymns.typing"
const FAVORITES_KEY = "hamrochurch.hymns.favorites"

export const hymnItems = writable<HymnRecord[]>([])
export const hymnLoading = writable(false)
export const hymnLoadError = writable("")
export const hymnSearchValue = writable("")
export const hymnSelectedId = writable("")
export const hymnSelectedCategories = writable<HymnCategoryId[]>(["all"])
export const hymnTypingLanguage = writable<HymnTypingLanguage>("ne")
export const hymnFavoriteIds = writable<string[]>([])

const categoryKeyMap: Record<Exclude<HymnCategoryId, "all">, string> = {
    bhajan: "hymns.bhajan",
    chorus: "hymns.chorus",
    children: "hymns.children",
    new: "hymns.new"
}

export function getHymnCategoryLabel(categoryId: HymnCategoryId, _locale = get(language)) {
    if (categoryId === "all") return translateText("hymns.all")
    return translateText(categoryKeyMap[categoryId])
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function escapeHtml(value: string) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;")
}

function normalizeWhitespace(value: string) {
    return value.replace(/\u00a0/g, " ").replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim()
}

function normalizeSearchText(value: string) {
    return fromNepaliDigits(normalizeWhitespace(value).toLowerCase())
}

function mapCategoryId(rawCategory: string) {
    const normalized = normalizeSearchText(rawCategory)
    if (normalized.includes("chorus") || normalized.includes("कोरस") || normalized.startsWith("को.")) return "chorus"
    if (normalized.includes("bal sangati") || normalized.includes("बाल सङ्गती") || normalized.includes("children")) return "children"
    if (normalized.includes("new songs") || normalized.includes("नयाँ भजन") || normalized.includes("new song")) return "new"
    return "bhajan"
}

function extractSongNumber(sourceRefs: string[] = [], sourceKey = "") {
    for (const ref of sourceRefs) {
        const match = String(ref).match(/s(\d+)/i)
        if (match?.[1]) return match[1]
    }

    const sourceKeyMatch = String(sourceKey).match(/(\d+)/)
    return sourceKeyMatch?.[1] || ""
}

function deriveVerses(song: RawHymnSong) {
    const slides = Array.isArray(song.slides) ? song.slides.map((entry) => normalizeWhitespace(String(entry))).filter(Boolean) : []
    if (slides.length > 1) return slides

    const lyrics = normalizeWhitespace(String(song.lyrics || ""))
    if (!lyrics) return []

    const blocks = lyrics
        .split(/\n\s*\n/)
        .map((entry) => entry.trim())
        .filter(Boolean)

    return blocks.length ? blocks : [lyrics]
}

function inferSlideGroup(text: string) {
    const trimmed = text.trim().toLowerCase()
    if (trimmed.startsWith("को.")) return "chorus"
    if (trimmed.includes("कोरस") || trimmed.includes("chorus")) return "chorus"
    return "verse"
}

function scoreHymn(hymn: HymnRecord, query: string): number {
    if (hymn.searchTitle === query || hymn.searchTitleEn === query) return 0
    if (hymn.searchNumber && hymn.searchNumber === query) return 25
    if (hymn.searchTitle.startsWith(query) || hymn.searchTitleEn.startsWith(query)) return 100

    const titlePositions = [hymn.searchTitle.indexOf(query), hymn.searchTitleEn.indexOf(query)].filter((value) => value >= 0)
    if (titlePositions.length) return 200 + Math.min(...titlePositions)

    const numberPosition = hymn.searchNumber.indexOf(query)
    if (numberPosition >= 0) return 350 + numberPosition

    const lyricsPosition = hymn.searchLyrics.indexOf(query)
    if (lyricsPosition >= 0) return 1000 + lyricsPosition

    return Number.MAX_SAFE_INTEGER
}

function getLocalStorageSafe() {
    try {
        return window.localStorage
    } catch {
        return null
    }
}

export function initializeHymnsPreferences() {
    const storage = getLocalStorageSafe()
    const defaultLanguage: HymnTypingLanguage = shouldUseNepaliLocale(get(language)) ? "ne" : "en"

    if (!storage) {
        hymnTypingLanguage.set(defaultLanguage)
        return
    }

    const savedTypingLanguage = storage.getItem(TYPING_LANGUAGE_KEY)
    hymnTypingLanguage.set(savedTypingLanguage === "en" || savedTypingLanguage === "ne" ? savedTypingLanguage : defaultLanguage)

    const savedFavorites = storage.getItem(FAVORITES_KEY)
    if (!savedFavorites) return

    try {
        const parsed = JSON.parse(savedFavorites)
        if (Array.isArray(parsed)) hymnFavoriteIds.set(parsed.map(String))
    } catch {
        hymnFavoriteIds.set([])
    }
}

export function setTypingLanguage(value: HymnTypingLanguage) {
    hymnTypingLanguage.set(value)
    const storage = getLocalStorageSafe()
    if (storage) storage.setItem(TYPING_LANGUAGE_KEY, value)
}

export function toggleFavorite(id: string) {
    hymnFavoriteIds.update((current) => {
        const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
        const storage = getLocalStorageSafe()
        if (storage) storage.setItem(FAVORITES_KEY, JSON.stringify(next))
        return next
    })
}

export function toggleCategory(categoryId: HymnCategoryId) {
    hymnSelectedCategories.update((current) => {
        if (categoryId === "all") return ["all"]

        let next = current.filter((value) => value !== "all")
        next = next.includes(categoryId) ? next.filter((value) => value !== categoryId) : [...next, categoryId]
        return next.length ? next : ["all"]
    })
}

export function getCategoryCounts(items: HymnRecord[]) {
    const counts: Record<HymnCategoryId, number> = { all: items.length, bhajan: 0, chorus: 0, children: 0, new: 0 }
    items.forEach((item) => {
        counts[item.categoryId] += 1
    })
    return counts
}

export function formatHymnNumber(value: string, typingLanguage = get(hymnTypingLanguage)) {
    if (!value) return "—"
    return typingLanguage === "ne" ? toNepaliDigits(value) : value
}

export async function loadHymns() {
    hymnLoading.set(true)
    hymnLoadError.set("")

    try {
        const result = await requestMain(Main.READ_HYMNS)
        const content = result?.content || ""
        if (!content) throw new Error("No hymn data found")

        const parsed = JSON.parse(content) as RawHymnPayload
        const items: HymnRecord[] = []

        ;(parsed.categories || []).forEach((category) => {
            ;(category.songs || []).forEach((song, index) => {
                const title = normalizeWhitespace(String(song.title || ""))
                const titleEn = normalizeWhitespace(String(song.titleEn || ""))
                const verses = deriveVerses(song)
                const lyrics = normalizeWhitespace(String(song.lyrics || verses.join("\n\n")))
                if (!title || !lyrics || !verses.length) return

                const categoryId = mapCategoryId(song.category || category.name || "")
                const number = extractSongNumber(song.sourceRefs || [], song.sourceKey || "")
                const firstLine = verses[0]?.split("\n").map((line) => line.trim()).find(Boolean) || title

                items.push({
                    id: song.sourceKey || `hymn-${index}-${uid(4)}`,
                    sourceKey: String(song.sourceKey || ""),
                    sourcePage: String(song.sourcePage || ""),
                    title,
                    titleEn,
                    categoryRaw: String(song.category || category.name || ""),
                    categoryId,
                    number,
                    lyrics,
                    verses,
                    authors: normalizeWhitespace(String(song.authors || "")),
                    rawDetails: normalizeWhitespace(String(song.rawDetails || "")),
                    firstLine,
                    searchTitle: normalizeSearchText(title),
                    searchTitleEn: normalizeSearchText(titleEn),
                    searchLyrics: normalizeSearchText(lyrics),
                    searchNumber: normalizeSearchText(number)
                })
            })
        })

        hymnItems.set(items)
        if (!get(hymnSelectedId) && items[0]) hymnSelectedId.set(items[0].id)
    } catch (error) {
        hymnLoadError.set(error instanceof Error ? error.message : String(error))
        hymnItems.set([])
        hymnSelectedId.set("")
    } finally {
        hymnLoading.set(false)
    }
}

export function getFilteredHymns(query: string, selectedCategories: HymnCategoryId[], favoritesOnly = false, items = get(hymnItems), favoriteIds = get(hymnFavoriteIds)) {
    const normalizedQuery = normalizeSearchText(query)

    const filtered = items.filter((item) => {
        if (favoritesOnly && !favoriteIds.includes(item.id)) return false
        if (!selectedCategories.includes("all") && !selectedCategories.includes(item.categoryId)) return false
        if (!normalizedQuery) return true
        return item.searchTitle.includes(normalizedQuery) || item.searchTitleEn.includes(normalizedQuery) || item.searchNumber.includes(normalizedQuery) || item.searchLyrics.includes(normalizedQuery)
    })

    if (!normalizedQuery) return filtered

    return filtered.sort((left, right) => scoreHymn(left, normalizedQuery) - scoreHymn(right, normalizedQuery) || left.title.localeCompare(right.title, "ne"))
}

export function getSelectedHymn() {
    const selectedId = get(hymnSelectedId)
    return get(hymnItems).find((item) => item.id === selectedId) || null
}

export function highlightHymnText(text: string, query: string) {
    if (!query) return escapeHtml(text)
    const escaped = escapeRegExp(normalizeWhitespace(query))
    return escapeHtml(text).replace(new RegExp(escaped, "gi"), (match) => `<mark>${match}</mark>`)
}

function buildHymnShow(hymn: HymnRecord): Show {
    const layoutId = uid()
    const created = Date.now()
    const slides: Record<string, any> = {}
    const layoutSlides: { id: string }[] = []

    hymn.verses.forEach((verseText) => {
        const slideId = uid()
        slides[slideId] = {
            group: inferSlideGroup(verseText),
            globalGroup: inferSlideGroup(verseText),
            color: null,
            settings: {},
            notes: "",
            items: [
                {
                    type: "text",
                    style: "top:88px;left:50px;height:904px;width:1820px;font-family:NotoSansDevanagari;",
                    lines: verseText.split("\n").map((line) => ({ align: "", text: [{ value: line, style: "font-size: 100px;" }] }))
                }
            ]
        }
        layoutSlides.push({ id: slideId })
    })

    const categoryNames: Record<Exclude<HymnCategoryId, "all">, string> = {
        bhajan: "bhajan",
        chorus: "chorus",
        children: "bal sangati",
        new: "new hymns"
    }
    const categoryName = categoryNames[hymn.categoryId as Exclude<HymnCategoryId, "all">] || "bhajan"
    const categoryId = createCategory(categoryName, "lyrics")
    const show = new ShowObj(false, categoryId, layoutId, created, "default")
    const titleWithNumber = hymn.number ? `${hymn.title} (${shouldUseNepaliLocale(get(language)) ? toNepaliDigits(hymn.number) : hymn.number})` : hymn.title

    show.name = checkName(titleWithNumber)
    show.origin = "hamro-hymns"
    show.quickAccess = hymn.number ? { number: hymn.number } : {}
    show.meta = {
        title: hymn.title,
        number: hymn.number || undefined,
        author: hymn.authors || undefined,
        copyright: hymn.rawDetails || undefined
    }
    show.slides = slides
    show.layouts = { [layoutId]: { name: shouldUseNepaliLocale(get(language)) ? "मूल" : "Main", notes: "", slides: layoutSlides } }
    show.media = {}

    return show
}

export function insertSelectedHymnIntoSlides() {
    const hymn = getSelectedHymn()
    if (!hymn) return

    const show = buildHymnShow(hymn)
    const selectedIndex = get(activeShow)?.index === undefined ? undefined : get(activeShow)!.index! + 1
    history({ id: "UPDATE", newData: { data: show, remember: { project: get(activeProject), index: selectedIndex } }, location: { page: "show", id: "show" } })
    newToast("hymns.inserted")
}

export async function copySelectedHymnToClipboard() {
    const hymn = getSelectedHymn()
    if (!hymn) return

    await navigator.clipboard.writeText(hymn.lyrics)
    newToast("hymns.copied")
}