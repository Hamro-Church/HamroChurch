import { get } from "svelte/store"
import { shouldUseNepaliLocale } from "../../common/nepali"
import { handleKeyPress, nepaliTypingTips, romanizeNepali, toUnicode, type NepaliTypingEventLike } from "../../lib/nepaliTyping"
import { language, nepaliTypingEnabled } from "../stores"

const STORAGE_KEY = "hamrochurch.nepaliTyping.enabled"

function getStorageSafe() {
    try {
        return window.localStorage
    } catch {
        return null
    }
}

export function initializeNepaliTypingPreference() {
    const storage = getStorageSafe()
    const defaultValue = shouldUseNepaliLocale(get(language))

    if (!storage) {
        nepaliTypingEnabled.set(defaultValue)
        return
    }

    const stored = storage.getItem(STORAGE_KEY)
    if (stored === "true" || stored === "false") {
        nepaliTypingEnabled.set(stored === "true")
        return
    }

    nepaliTypingEnabled.set(defaultValue)
    storage.setItem(STORAGE_KEY, String(defaultValue))
}

export function setNepaliTypingEnabled(value: boolean) {
    nepaliTypingEnabled.set(value)
    const storage = getStorageSafe()
    if (storage) storage.setItem(STORAGE_KEY, String(value))
}

export function toggleNepaliTyping() {
    const nextValue = !get(nepaliTypingEnabled)
    setNepaliTypingEnabled(nextValue)
    return nextValue
}

function shouldTransformTextInput(target: HTMLInputElement | HTMLTextAreaElement) {
    if (!get(nepaliTypingEnabled)) return false
    if ((target as HTMLElement).dataset.disableNepaliTyping === "true") return false
    if (target instanceof HTMLInputElement) return ["text", "search"].includes(target.type || "text")
    return true
}

export function transformTextInputTarget(target: HTMLInputElement | HTMLTextAreaElement, event: Event) {
    if (!shouldTransformTextInput(target)) return target.value

    const inputEvent = event as InputEvent
    const inputType = inputEvent.inputType || ""
    const cursorPosition = target.selectionStart ?? target.value.length

    if (inputType === "insertFromPaste" || inputType === "insertReplacementText") {
        const transformed = toUnicode(target.value)
        if (transformed !== target.value) {
            target.value = transformed
            const newCursor = Math.min(transformed.length, cursorPosition)
            target.setSelectionRange?.(newCursor, newCursor)
        }
        return target.value
    }

    const result = handleKeyPress({ data: inputEvent.data, inputType } as NepaliTypingEventLike, target.value, cursorPosition)
    if (!result || result.newValue === target.value) return target.value

    target.value = result.newValue
    target.setSelectionRange?.(result.newCursor, result.newCursor)
    return target.value
}

export function transformEditableTextNode(textNode: Text, cursorPosition: number, eventLike: NepaliTypingEventLike) {
    if (!get(nepaliTypingEnabled)) return null
    const currentValue = textNode.textContent || ""
    const result = handleKeyPress(eventLike, currentValue, cursorPosition)
    if (!result || result.newValue === currentValue) return null

    textNode.textContent = result.newValue
    return result
}

export { nepaliTypingTips, romanizeNepali, toUnicode }