export type NepaliTypingResult = {
    newValue: string
    newCursor: number
}

export type NepaliTypingEventLike = {
    data?: string | null
    inputType?: string
}

type Mapping = Record<string, string>

const HALANT = "\u094D"

const consonantMap: Mapping = {
    k: "क",
    q: "क",
    kh: "ख",
    K: "ख",
    g: "ग",
    gh: "घ",
    G: "घ",
    ng: "ङ",
    NG: "ङ",
    c: "च",
    ch: "च",
    chh: "छ",
    C: "छ",
    j: "ज",
    jh: "झ",
    z: "झ",
    yn: "ञ",
    NY: "ञ",
    T: "ट",
    Th: "ठ",
    D: "ड",
    Dh: "ढ",
    N: "ण",
    t: "त",
    th: "थ",
    d: "द",
    dh: "ध",
    n: "न",
    p: "प",
    ph: "फ",
    f: "फ",
    F: "फ",
    b: "ब",
    bh: "भ",
    B: "भ",
    V: "भ",
    m: "म",
    y: "य",
    r: "र",
    l: "ल",
    v: "व",
    w: "व",
    s: "स",
    sh: "श",
    S: "श",
    shh: "ष",
    Sh: "ष",
    h: "ह",
    x: "क्ष",
    kSh: "क्ष",
    tr: "त्र",
    jn: "ज्ञ",
    Jn: "ज्ञ"
}

const vowelMap: Mapping = {
    a: "अ",
    aa: "आ",
    A: "आ",
    i: "इ",
    ii: "ई",
    I: "ई",
    ee: "ई",
    u: "उ",
    uu: "ऊ",
    U: "ऊ",
    oo: "ऊ",
    e: "ए",
    ai: "ऐ",
    o: "ओ",
    au: "औ",
    am: "अं",
    aM: "अं",
    ah: "अः",
    "a:": "अः",
    ri: "ऋ",
    Ri: "ऋ",
    RI: "ॠ"
}

const matraMap: Mapping = {
    a: "",
    aa: "ा",
    A: "ा",
    i: "ि",
    ii: "ी",
    I: "ी",
    ee: "ी",
    u: "ु",
    uu: "ू",
    U: "ू",
    oo: "ू",
    e: "े",
    ai: "ै",
    o: "ो",
    au: "ौ",
    am: "ं",
    M: "ं",
    an: "ं",
    ah: "ः",
    ":": "ः",
    ri: "ृ",
    Ri: "ृ",
    RI: "ॄ",
    "~": "ँ",
    "M~": "ँ"
}

const symbolMap: Mapping = {
    "0": "०",
    "1": "१",
    "2": "२",
    "3": "३",
    "4": "४",
    "5": "५",
    "6": "६",
    "7": "७",
    "8": "८",
    "9": "९",
    ".": "।",
    "|": "।",
    "/": "/"
}

const modifierMap: Record<string, Mapping> = {
    "क": { h: "ख", S: "क्ष", x: "क्ष" },
    "ग": { h: "घ" },
    "च": { h: "छ" },
    "ज": { h: "झ", n: "ज्ञ" },
    "ट": { h: "ठ" },
    "ड": { h: "ढ" },
    "त": { h: "थ", r: "त्र" },
    "द": { h: "ध" },
    "प": { h: "फ" },
    "ब": { h: "भ" },
    "न": { g: "ङ" },
    "ण": { G: "ङ", Y: "ञ" },
    "य": { n: "ञ" },
    "र": { r: "र", y: "र्य" },
    "स": { h: "श" },
    "श": { h: "ष", r: "श्र" }
}

const devanagariToRoman: Record<string, string> = {
    "अ": "a",
    "आ": "aa",
    "इ": "i",
    "ई": "ii",
    "उ": "u",
    "ऊ": "uu",
    "ऋ": "ri",
    "ए": "e",
    "ऐ": "ai",
    "ओ": "o",
    "औ": "au",
    "क": "ka",
    "ख": "kha",
    "ग": "ga",
    "घ": "gha",
    "ङ": "nga",
    "च": "cha",
    "छ": "chha",
    "ज": "ja",
    "झ": "jha",
    "ञ": "nya",
    "ट": "Ta",
    "ठ": "Tha",
    "ड": "Da",
    "ढ": "Dha",
    "ण": "Na",
    "त": "ta",
    "थ": "tha",
    "द": "da",
    "ध": "dha",
    "न": "na",
    "प": "pa",
    "फ": "pha",
    "ब": "ba",
    "भ": "bha",
    "म": "ma",
    "य": "ya",
    "र": "ra",
    "ल": "la",
    "व": "wa",
    "श": "sha",
    "ष": "Sha",
    "स": "sa",
    "ह": "ha",
    "क्ष": "kSha",
    "ज्ञ": "jnya",
    "त्र": "tra",
    "ा": "aa",
    "ि": "i",
    "ी": "ii",
    "ु": "u",
    "ू": "uu",
    "ृ": "ri",
    "ॄ": "RI",
    "े": "e",
    "ै": "ai",
    "ो": "o",
    "ौ": "au",
    "ं": "am",
    "ः": "ah",
    "ँ": "~",
    "।": ".",
    "०": "0",
    "१": "1",
    "२": "2",
    "३": "3",
    "४": "4",
    "५": "5",
    "६": "6",
    "७": "7",
    "८": "8",
    "९": "9"
}

export const nepaliTypingTips = {
    vowels: [
        "a -> अ",
        "A / aa -> आ",
        "i -> इ",
        "I / ii / ee -> ई",
        "u -> उ",
        "U / uu / oo -> ऊ",
        "e -> ए",
        "ai -> ऐ",
        "o -> ओ",
        "au -> औ",
        "Ri -> ऋ, after consonant -> ृ"
    ],
    consonants: [
        "k -> क्, ka -> क, kh / K -> ख्",
        "g -> ग्, gh / G -> घ्",
        "c / ch -> च्, chh / C -> छ्",
        "j -> ज्, jh / z -> झ्",
        "T / Th / D / Dh / N -> ट-series",
        "t / th / d / dh / n -> त-series",
        "p / ph / b / bh / m -> प-series",
        "y r l v/w s sh Sh h -> य र ल व स श ष ह"
    ],
    conjuncts: [
        "NG -> ङ",
        "NY -> ञ",
        "jn -> ज्ञ",
        "kSh / x -> क्ष",
        "tr -> त्र",
        "rr -> र्",
        "rry -> र्य"
    ],
    punctuation: [
        ". -> ।",
        "| -> ।",
        ".. -> .",
        "0-9 -> ०-९"
    ],
    examples: [
        "k -> क्, a -> क, aa -> का",
        "gRi -> गृ",
        "shr -> श्र्",
        "jn -> ज्ञ्",
        "tr -> त्र्"
    ]
}

function isHalant(char: string | undefined) {
    return char === HALANT
}

function isDevanagariConsonant(char: string | undefined) {
    if (!char) return false
    const code = char.charCodeAt(0)
    return code >= 0x0915 && code <= 0x0939
}

function getLiteralDotReplacement(beforeCursor: string, char: string) {
    if (char !== "." || !beforeCursor.endsWith("।")) return null
    return beforeCursor.slice(0, -1) + "."
}

function createResult(newValue: string, newCursor: number): NepaliTypingResult {
    return { newValue, newCursor }
}

function insertMappedValue(beforeCursor: string, afterCursor: string, mappedValue: string) {
    return createResult(beforeCursor + mappedValue + afterCursor, beforeCursor.length + mappedValue.length)
}

export function handleKeyPress(event: NepaliTypingEventLike, currentValue: string, cursorPosition: number): NepaliTypingResult | null {
    if (event.inputType !== "insertText" || !event.data) return null

    const char = event.data
    const beforeCursor = currentValue.substring(0, cursorPosition - 1)
    const afterCursor = currentValue.substring(cursorPosition)
    const contextChar = beforeCursor.length ? beforeCursor[beforeCursor.length - 1] : ""

    let prevConsonant = ""
    let hasHalant = false
    if (isHalant(contextChar)) {
        hasHalant = true
        if (beforeCursor.length > 1) prevConsonant = beforeCursor[beforeCursor.length - 2]
    }

    if (hasHalant && prevConsonant && modifierMap[prevConsonant]?.[char]) {
        const result = modifierMap[prevConsonant][char] + HALANT
        const newBefore = beforeCursor.slice(0, -2)
        return createResult(newBefore + result + afterCursor, newBefore.length + result.length)
    }

    if (contextChar === "R" && (char === "i" || char === "I")) {
        const beforeR = beforeCursor.slice(0, -1)
        const charBeforeR = beforeR.length ? beforeR[beforeR.length - 1] : ""

        if (isHalant(charBeforeR)) {
            const riMatra = char === "I" ? "ॄ" : "ृ"
            const newBefore = beforeR.slice(0, -1)
            return createResult(newBefore + riMatra + afterCursor, newBefore.length + riMatra.length)
        }

        const result = char === "I" ? "ॠ" : "ऋ"
        return createResult(beforeR + result + afterCursor, beforeR.length + result.length)
    }

    if (vowelMap[char]) {
        if (hasHalant && prevConsonant) {
            if (char === "a") {
                const newBefore = beforeCursor.slice(0, -1)
                return createResult(newBefore + afterCursor, newBefore.length)
            }

            if (matraMap[char] !== undefined) {
                const matra = matraMap[char]
                const newBefore = beforeCursor.slice(0, -1)
                return createResult(newBefore + matra + afterCursor, newBefore.length + matra.length)
            }
        }

        if (isDevanagariConsonant(contextChar)) {
            if (char === "i") return insertMappedValue(beforeCursor, afterCursor, "ै")
            if (char === "u") return insertMappedValue(beforeCursor, afterCursor, "ौ")
            if (char === "a") return insertMappedValue(beforeCursor, afterCursor, "ा")
            if (matraMap[char] !== undefined) return insertMappedValue(beforeCursor, afterCursor, matraMap[char])
        }

        if (["M", ":", "~"].includes(char) && matraMap[char]) return insertMappedValue(beforeCursor, afterCursor, matraMap[char])
        if (contextChar === "अ" && char === "i") {
            const newBefore = beforeCursor.slice(0, -1)
            return createResult(newBefore + "ऐ" + afterCursor, newBefore.length + 1)
        }
        if (contextChar === "अ" && char === "u") {
            const newBefore = beforeCursor.slice(0, -1)
            return createResult(newBefore + "औ" + afterCursor, newBefore.length + 1)
        }

        return insertMappedValue(beforeCursor, afterCursor, vowelMap[char])
    }

    if (matraMap[char]) return insertMappedValue(beforeCursor, afterCursor, matraMap[char])
    if (consonantMap[char]) return insertMappedValue(beforeCursor, afterCursor, consonantMap[char] + HALANT)

    const literalDot = getLiteralDotReplacement(beforeCursor, char)
    if (literalDot !== null) return createResult(literalDot + afterCursor, literalDot.length)
    if (symbolMap[char]) return insertMappedValue(beforeCursor, afterCursor, symbolMap[char])

    return null
}

export function toUnicode(input: string): string {
    let buffer = ""

    for (const char of input) {
        const currentValue = buffer + char
        const transformed = handleKeyPress({ data: char, inputType: "insertText" }, currentValue, currentValue.length)
        if (transformed) {
            buffer = transformed.newValue
            continue
        }

        buffer += char
    }

    return buffer
}

export function romanizeNepali(text: string): string {
    if (!text) return ""

    let result = ""
    let index = 0

    while (index < text.length) {
        const pair = text.slice(index, index + 2)
        if (devanagariToRoman[pair]) {
            result += devanagariToRoman[pair]
            index += 2
            continue
        }

        const char = text[index]
        result += devanagariToRoman[char] || char
        index += 1
    }

    return result.replace(/\s+/g, " ").trim()
}