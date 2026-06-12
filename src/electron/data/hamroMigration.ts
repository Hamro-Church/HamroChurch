import { app } from "electron"
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

function getBundledDataRoots() {
    const appPath = (() => {
        try {
            return app.getAppPath()
        } catch {
            return ""
        }
    })()

    return [path.join(appPath, "bundled-data"), path.join(process.resourcesPath || "", "bundled-data"), path.join(process.cwd(), "bundled-data")].filter(Boolean)
}

function getBundledDataRoot() {
    return getBundledDataRoots().find((candidate) => doesPathExist(candidate)) || ""
}

function shouldRebuildBundledNepaliBible(filePath: string) {
    if (!doesPathExist(filePath)) return true

    try {
        const parsed = JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }))
        const bible = Array.isArray(parsed) ? parsed[1] : parsed
        const firstBookName = String(bible?.books?.[0]?.name || "").trim()
        return firstBookName !== NEPALI_BOOK_NAMES[1]
    } catch {
        return true
    }
}

export async function runHamroChurchMigration() {
    await seedBundledChurchData()

    const settings = getStore("SETTINGS")
    await ensureNepaliBiblePresent()

    const dataRoot = path.join(getDataFolderRoot(), "data")
    const librarySource = resolveExistingFile([path.join(dataRoot, "library.sqlite"), SOURCE_LIBRARY_DB, path.join(getDataFolderRoot(), IMPORT_FOLDER_NAME, "library.sqlite")])
    const cacheSource = resolveExistingFile([path.join(dataRoot, "library-cache.json"), SOURCE_LIBRARY_CACHE, path.join(getDataFolderRoot(), IMPORT_FOLDER_NAME, "library-cache.json")])
    const hymnSource = resolveExistingFile([path.join(dataRoot, "nepali_hymns.json"), SOURCE_HYMNS_JSON, path.join(getDataFolderRoot(), IMPORT_FOLDER_NAME, "nepali_hymns.json")])

    if (!librarySource) return
    if ((settings as any)?.hamroMigrationVersion >= MIGRATION_VERSION) return

    const importedRoot = createFolder(path.join(getDataFolderRoot(), IMPORT_FOLDER_NAME))

    await copyIfPresent(librarySource, path.join(importedRoot, "library.sqlite"))
    if (cacheSource) await copyIfPresent(cacheSource, path.join(importedRoot, "library-cache.json"))
    if (hymnSource) {
        await copyIfPresent(hymnSource, path.join(importedRoot, "nepali_hymns.json"))
        await migrateHymnShows(hymnSource)
    }

    await ensureNepaliBiblePresent()

    const nextSettings = { ...settings, hamroMigrationVersion: MIGRATION_VERSION }
    if (_store.SETTINGS) await safeStoreSet(_store.SETTINGS, nextSettings, "SETTINGS")
}

function resolveExistingFile(candidates: string[]) {
    return candidates.find((candidate) => doesPathExist(candidate)) || ""
}

async function seedBundledChurchData() {
    const dataFolder = createFolder(path.join(getDataFolderRoot(), "data"))
    const sourceRoot = getBundledDataRoot()
    if (!sourceRoot) return false

    // Seed only when the file is missing so the user's added/edited hymns are never overwritten on restart.
    await copyIfMissing(path.join(sourceRoot, "library.sqlite"), path.join(dataFolder, "library.sqlite"))
    await copyIfMissing(path.join(sourceRoot, "library-cache.json"), path.join(dataFolder, "library-cache.json"))
    await copyIfMissing(path.join(sourceRoot, "nepali_hymns.json"), path.join(dataFolder, "nepali_hymns.json"))
    await copyIfMissing(path.join(sourceRoot, "nnrv_bible.sql"), path.join(dataFolder, "nnrv_bible.sql"))
    return true
}

// Restore the original bundled hymns and Nepali Bible, discarding any user additions/edits.
export async function reseedHamroChurchData() {
    const dataFolder = createFolder(path.join(getDataFolderRoot(), "data"))
    const sourceRoot = getBundledDataRoot()

    if (sourceRoot) {
        await copyIfPresent(path.join(sourceRoot, "nepali_hymns.json"), path.join(dataFolder, "nepali_hymns.json"))
        await copyIfPresent(path.join(sourceRoot, "library-cache.json"), path.join(dataFolder, "library-cache.json"))
        await copyIfPresent(path.join(sourceRoot, "library.sqlite"), path.join(dataFolder, "library.sqlite"))
        await copyIfPresent(path.join(sourceRoot, "nnrv_bible.sql"), path.join(dataFolder, "nnrv_bible.sql"))
    }

    // Force the Nepali Bible to be rebuilt from the originals.
    const biblePath = path.join(getDataFolderPath("scriptures"), `${NEPALI_BIBLE_FILE_NAME}.fsb`)
    try {
        if (doesPathExist(biblePath)) fs.rmSync(biblePath, { force: true })
    } catch (error) {
        console.error("Failed to remove existing Nepali Bible during reset:", error)
    }
    await ensureNepaliBiblePresent()
    return true
}

export async function ensureNepaliBiblePresent() {
    const scripturesFolder = getDataFolderPath("scriptures")
    const biblePath = path.join(scripturesFolder, `${NEPALI_BIBLE_FILE_NAME}.fsb`)
    if (doesPathExist(biblePath) && !shouldRebuildBundledNepaliBible(biblePath)) return true

    // 1) Prefer the bundled SQL dump: it needs no native module and works on every fresh install.
    const sqlSources = [path.join(getDataFolderRoot(), "data", "nnrv_bible.sql"), ...getBundledDataRoots().map((root) => path.join(root, "nnrv_bible.sql"))]
    const sqlSource = sqlSources.find((candidate) => doesPathExist(candidate))
    if (sqlSource) {
        const bibleFromSql = buildNepaliBibleFromSqlText(sqlSource)
        if (bibleFromSql) {
            writeFile(biblePath, JSON.stringify([uid(), bibleFromSql]))
            return true
        }
    }

    // 2) Fallback to the SQLite database via better-sqlite3.
    const fallbackSources = [path.join(getDataFolderRoot(), "data", "library.sqlite"), SOURCE_LIBRARY_DB, path.join(getDataFolderRoot(), IMPORT_FOLDER_NAME, "library.sqlite")]
    const sourcePath = fallbackSources.find((candidate) => doesPathExist(candidate))
    if (!sourcePath) {
        console.warn(`Nepali Bible source not found. Expected bundled nnrv_bible.sql/library.sqlite or ${SOURCE_DATA_ROOT}.`)
        return false
    }

    const bible = await buildNepaliBibleFromSqlite(sourcePath)
    if (!bible) return false

    writeFile(biblePath, JSON.stringify([uid(), bible]))
    return true
}

async function copyIfPresent(sourcePath: string, destPath: string) {
    if (!doesPathExist(sourcePath) || sourcePath === destPath) return
    await copyFileAsync(sourcePath, destPath)
}

async function copyIfMissing(sourcePath: string, destPath: string) {
    if (doesPathExist(destPath)) return
    await copyIfPresent(sourcePath, destPath)
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

function parseSqlStringTuple(tupleContent: string): string[] {
    const fields: string[] = []
    let current = ""
    let inString = false

    for (let i = 0; i < tupleContent.length; i++) {
        const char = tupleContent[i]
        if (inString) {
            if (char === "'") {
                if (tupleContent[i + 1] === "'") {
                    current += "'"
                    i++
                    continue
                }
                inString = false
                continue
            }
            current += char
            continue
        }
        if (char === "'") {
            inString = true
            continue
        }
        if (char === ",") {
            fields.push(current.trim())
            current = ""
            continue
        }
        current += char
    }

    fields.push(current.trim())
    return fields
}

function extractValuesTuple(statement: string): string | null {
    const marker = "VALUES ("
    const markerIndex = statement.indexOf(marker)
    if (markerIndex < 0) return null

    let depth = 1
    let inString = false
    const start = markerIndex + marker.length

    for (let i = start; i < statement.length; i++) {
        const char = statement[i]
        if (inString) {
            if (char === "'") {
                if (statement[i + 1] === "'") {
                    i++
                    continue
                }
                inString = false
            }
            continue
        }
        if (char === "'") {
            inString = true
            continue
        }
        if (char === "(") {
            depth++
            continue
        }
        if (char === ")") {
            depth--
            if (depth === 0) return statement.slice(start, i)
        }
    }

    return null
}

// Build the Nepali Bible directly from the bundled SQL dump without any native dependency.
function buildNepaliBibleFromSqlText(filePath: string): Bible | null {
    try {
        const content = fs.readFileSync(filePath, { encoding: "utf-8" })
        const lines = content.split(/\r?\n/)

        const booksById = new Map<number, any>()
        const chapterMap = new Map<string, any>()

        for (const line of lines) {
            const trimmed = line.trim()

            if (trimmed.startsWith("INSERT INTO bible_books")) {
                const tuple = extractValuesTuple(trimmed)
                if (!tuple) continue
                const fields = parseSqlStringTuple(tuple)
                const id = Number.parseInt(fields[0], 10)
                if (!Number.isFinite(id)) continue
                booksById.set(id, {
                    number: id,
                    name: NEPALI_BOOK_NAMES[id] || String(fields[2] || ""),
                    abbreviation: String(fields[3] || ""),
                    chapters: [] as any[]
                })
                continue
            }

            if (trimmed.startsWith("INSERT INTO bible_verses")) {
                const tuple = extractValuesTuple(trimmed)
                if (!tuple) continue
                const fields = parseSqlStringTuple(tuple)
                const translationCode = String(fields[0] || "")
                if (translationCode && translationCode !== NEPALI_BIBLE_CODE) continue

                const bookId = Number.parseInt(fields[1], 10)
                const chapterNumber = Number.parseInt(fields[2], 10)
                const verseNumber = Number.parseInt(fields[3], 10)
                if (!Number.isFinite(bookId) || !Number.isFinite(chapterNumber) || !Number.isFinite(verseNumber)) continue

                let book = booksById.get(bookId)
                if (!book) {
                    book = { number: bookId, name: NEPALI_BOOK_NAMES[bookId] || "", abbreviation: "", chapters: [] as any[] }
                    booksById.set(bookId, book)
                }

                const chapterKey = `${bookId}:${chapterNumber}`
                let chapter = chapterMap.get(chapterKey)
                if (!chapter) {
                    chapter = { number: chapterNumber, verses: [] as any[] }
                    chapterMap.set(chapterKey, chapter)
                    book.chapters.push(chapter)
                }

                chapter.verses.push({ number: verseNumber, text: normalizeScriptureText(String(fields[4] || "")) })
            }
        }

        const books = [...booksById.values()].filter((book) => book.chapters.length).sort((left, right) => left.number - right.number)
        if (!books.length) return null

        return {
            name: NEPALI_BIBLE_FILE_NAME,
            metadata: {
                language: "ne",
                abbreviation: NEPALI_BIBLE_CODE,
                copyright: "नेपाली बाइबल (NNRV)",
                source: "Hamro Church bundled data"
            },
            books
        }
    } catch (error) {
        console.error("Failed to build Nepali Bible from SQL text:", error)
        return null
    }
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