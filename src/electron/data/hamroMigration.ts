import fs from "fs"
import path from "path"
import { uid } from "uid"
import type { Bible } from "../../types/Bible"
import type { Show } from "../../types/Show"
import { getStore, safeStoreSet, _store } from "./store"
import { copyFileAsync, createFolder, doesPathExist, getDataFolderPath, getDataFolderRoot, writeFile } from "../utils/files"

const SOURCE_DATA_ROOT = path.join("C:\\Mandali Show", "church-presentation-app", "data")
const SOURCE_LIBRARY_DB = path.join(SOURCE_DATA_ROOT, "library.sqlite")
const SOURCE_LIBRARY_CACHE = path.join(SOURCE_DATA_ROOT, "library-cache.json")
const SOURCE_HYMNS_JSON = path.join(SOURCE_DATA_ROOT, "nepali_hymns.json")

const MIGRATION_VERSION = 1
const IMPORT_FOLDER_NAME = "Hamro Church Imported"
const NEPALI_BIBLE_CODE = "NNRV"
const NEPALI_BIBLE_FILE_NAME = "Nepali Bible"

const NEPALI_BOOK_NAMES: Record<number, string> = {
    1: "उत्पत्ति",
    2: "प्रस्थान",
    3: "लेवी",
    4: "गन्ती",
    5: "व्यवस्था",
    6: "यहोशू",
    7: "न्यायकर्ताहरू",
    8: "रूथ",
    9: "१ शमूएल",
    10: "२ शमूएल",
    11: "१ राजाहरू",
    12: "२ राजाहरू",
    13: "१ इतिहास",
    14: "२ इतिहास",
    15: "एज्रा",
    16: "नहेम्याह",
    17: "एस्तर",
    18: "अय्यूब",
    19: "भजनसंग्रह",
    20: "हितोपदेश",
    21: "उपदेशक",
    22: "श्रेष्ठगीत",
    23: "यशैया",
    24: "यर्मिया",
    25: "यर्मियाको विलाप",
    26: "इजकिएल",
    27: "दानियल",
    28: "होशे",
    29: "योएल",
    30: "आमोस",
    31: "ओबदिया",
    32: "योना",
    33: "मीका",
    34: "नहूम",
    35: "हबकूक",
    36: "सपन्याह",
    37: "हाग्गै",
    38: "जकरिया",
    39: "मलाकी",
    40: "मत्ती",
    41: "मर्कूस",
    42: "लूका",
    43: "यूहन्ना",
    44: "प्रेरितहरूका काम",
    45: "रोमी",
    46: "१ कोरिन्थी",
    47: "२ कोरिन्थी",
    48: "गलाती",
    49: "एफिसी",
    50: "फिलिप्पी",
    51: "कलस्सी",
    52: "१ थिस्सलोनिकी",
    53: "२ थिस्सलोनिकी",
    54: "१ तिमोथी",
    55: "२ तिमोथी",
    56: "तीतस",
    57: "फिलेमोन",
    58: "हिब्रू",
    59: "याकूब",
    60: "१ पत्रुस",
    61: "२ पत्रुस",
    62: "१ यूहन्ना",
    63: "२ यूहन्ना",
    64: "३ यूहन्ना",
    65: "यहूदा",
    66: "प्रकाश"
}

export async function runHamroChurchMigration() {
    if (!doesPathExist(SOURCE_DATA_ROOT) || !doesPathExist(SOURCE_LIBRARY_DB)) return

    const settings = getStore("SETTINGS")
    if ((settings as any)?.hamroMigrationVersion >= MIGRATION_VERSION) return

    const importedRoot = createFolder(path.join(getDataFolderRoot(), IMPORT_FOLDER_NAME))

    await copyIfPresent(SOURCE_LIBRARY_DB, path.join(importedRoot, "library.sqlite"))
    await copyIfPresent(SOURCE_LIBRARY_CACHE, path.join(importedRoot, "library-cache.json"))
    await copyIfPresent(SOURCE_HYMNS_JSON, path.join(importedRoot, "nepali_hymns.json"))
    await migrateHymnShows(SOURCE_HYMNS_JSON)

    const bible = await buildNepaliBibleFromSqlite(SOURCE_LIBRARY_DB)
    if (bible) {
        const scripturesFolder = getDataFolderPath("scriptures")
        const biblePath = path.join(scripturesFolder, `${NEPALI_BIBLE_FILE_NAME}.fsb`)
        writeFile(biblePath, JSON.stringify([uid(), bible]))
    }

    const nextSettings = { ...settings, hamroMigrationVersion: MIGRATION_VERSION }
    if (_store.SETTINGS) await safeStoreSet(_store.SETTINGS, nextSettings, "SETTINGS")
}

async function copyIfPresent(sourcePath: string, destPath: string) {
    if (!doesPathExist(sourcePath) || sourcePath === destPath) return
    await copyFileAsync(sourcePath, destPath)
}

async function buildNepaliBibleFromSqlite(filePath: string): Promise<Bible | null> {
    let DatabaseCtor: any = null
    try {
        const sqliteModule: any = await import("better-sqlite3")
        DatabaseCtor = sqliteModule.default || sqliteModule
    } catch (error) {
        console.error("Failed to load better-sqlite3 for Nepali Bible migration:", error)
        return null
    }

    let database: any = null
    try {
        database = new DatabaseCtor(filePath, { readonly: true })

        const translation = database
            .prepare(
                `SELECT code, label
                 FROM bible_translations
                 WHERE language = ? OR code = ?
                 ORDER BY CASE WHEN code = ? THEN 0 ELSE 1 END, code
                 LIMIT 1`
            )
            .get("ne", NEPALI_BIBLE_CODE, NEPALI_BIBLE_CODE)

        const translationCode = String(translation?.code || NEPALI_BIBLE_CODE)
        const translationLabel = String(translation?.label || "नेपाली बाइबल")

        const bookRows = database
            .prepare(
                `SELECT id, name, abbreviation
                 FROM bible_books
                 ORDER BY ord, id`
            )
            .all()

        const verseRows = database
            .prepare(
                `SELECT book_id, chapter_no, verse_no, text
                 FROM bible_verses
                 WHERE translation_code = ?
                 ORDER BY book_id, chapter_no, verse_no`
            )
            .all(translationCode)

        if (!bookRows.length || !verseRows.length) return null

        const booksById = new Map<number, any>()
        for (const row of bookRows) {
            booksById.set(Number(row.id), {
                number: Number(row.id),
                name: NEPALI_BOOK_NAMES[Number(row.id)] || String(row.name || ""),
                abbreviation: String(row.abbreviation || ""),
                chapters: [] as any[]
            })
        }

        const chapterMap = new Map<string, any>()
        for (const row of verseRows) {
            const bookId = Number(row.book_id)
            const chapterNumber = Number(row.chapter_no)
            const verseNumber = Number(row.verse_no)
            const book = booksById.get(bookId)
            if (!book) continue

            const chapterKey = `${bookId}:${chapterNumber}`
            let chapter = chapterMap.get(chapterKey)
            if (!chapter) {
                chapter = { number: chapterNumber, verses: [] as any[] }
                chapterMap.set(chapterKey, chapter)
                book.chapters.push(chapter)
            }

            chapter.verses.push({ number: verseNumber, text: normalizeScriptureText(String(row.text || "")) })
        }

        return {
            name: NEPALI_BIBLE_FILE_NAME,
            metadata: {
                language: "ne",
                abbreviation: translationCode,
                copyright: translationLabel,
                source: "Hamro Church migration"
            },
            books: [...booksById.values()].filter((book) => book.chapters.length)
        }
    } catch (error) {
        console.error("Failed to migrate Nepali Bible:", error)
        return null
    } finally {
        if (database) database.close()
    }
}

function normalizeScriptureText(text: string) {
    return text.replace(/\s+/g, " ").trim()
}

async function migrateHymnShows(filePath: string) {
    if (!doesPathExist(filePath)) return

    try {
        const payload = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }))
        const categories = Array.isArray(payload.categories) ? payload.categories : []
        const showsPath = getDataFolderPath("shows")

        for (const category of categories) {
            const songs = Array.isArray(category.songs) ? category.songs : []
            for (const song of songs) {
                const show = createHymnShow(song)
                if (!show) continue

                const showId = uid()
                const fileName = sanitizeFileName(`${show.name}-${song.sourceKey || showId}`)
                fs.writeFileSync(path.join(showsPath, `${fileName}.show`), JSON.stringify([showId, show]))
            }
        }
    } catch (error) {
        console.error("Failed to migrate Nepali hymn shows:", error)
    }
}

function createHymnShow(song: any): Show | null {
    const title = normalizeScriptureText(String(song?.title || ""))
    const rawSlides = Array.isArray(song?.slides) ? song.slides : []
    const slidesText = rawSlides.map((entry: string) => normalizeScriptureText(entry)).filter(Boolean)
    if (!title || !slidesText.length) return null

    const layoutId = uid()
    const slides: Record<string, any> = {}
    const layoutSlides: { id: string }[] = []

    slidesText.forEach((slideText: string) => {
        const slideId = uid()
        slides[slideId] = {
            group: inferSlideGroup(slideText),
            globalGroup: inferSlideGroup(slideText),
            color: null,
            settings: {},
            notes: "",
            items: [
                {
                    type: "text",
                    style: "top:88px;left:50px;height:904px;width:1820px;font-family:NotoSansDevanagari;",
                    lines: slideText.split("\n").map((line: string) => ({ align: "", text: [{ value: line, style: "font-size: 100px;" }] }))
                }
            ]
        }
        layoutSlides.push({ id: slideId })
    })

    const created = Date.now()
    const songNumber = Array.isArray(song?.sourceRefs) ? extractSongNumber(song.sourceRefs) : ""

    return {
        name: title,
        origin: "hamro-hymns",
        category: "song",
        settings: { activeLayout: layoutId, template: "default" },
        timestamps: { created, modified: created, used: null },
        quickAccess: songNumber ? { number: songNumber } : {},
        meta: {
            title,
            number: songNumber || undefined,
            author: normalizeScriptureText(String(song?.authors || "")) || undefined,
            copyright: normalizeScriptureText(String(song?.rawDetails || "")) || undefined
        },
        slides,
        layouts: { [layoutId]: { name: "मूल", notes: "", slides: layoutSlides } },
        media: {}
    }
}

function inferSlideGroup(text: string) {
    const trimmed = text.trim().toLowerCase()
    if (trimmed.startsWith("को.")) return "chorus"
    if (trimmed.includes("कोरस")) return "chorus"
    return "verse"
}

function extractSongNumber(sourceRefs: string[]) {
    for (const ref of sourceRefs) {
        const match = String(ref).match(/s(\d+)/i)
        if (match?.[1]) return match[1]
    }
    return ""
}

function sanitizeFileName(value: string) {
    return value.replace(/[<>:"/\\|?*]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120) || uid()
}