import { spawn } from "child_process"
import { createHash } from "crypto"
import { app, shell } from "electron"
import axios from "axios"
import fs from "fs"
import os from "os"
import path from "path"
import { Transform } from "stream"
import { pipeline } from "stream/promises"
import type { AppUpdateAsset, AppUpdateDownloadResult, AppUpdateInfo } from "../types/Main"
import { config } from "./data/store"

const RELEASES_LATEST_URL = "https://api.github.com/repos/Hamro-Church/HamroChurch/releases/latest"
const RELEASES_PAGE_URL = "https://github.com/Hamro-Church/HamroChurch/releases"
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000
const UPDATE_TEMP_DIR = path.join(os.tmpdir(), "Hamro Church Updates")

type GitHubRelease = {
    tag_name?: string
    body?: string
    html_url?: string
    prerelease?: boolean
    published_at?: string
    assets?: Array<{
        name?: string
        browser_download_url?: string
        content_type?: string
        digest?: string | null
    }>
}

let cachedUpdateInfo: AppUpdateInfo | null = null

export function initializeUpdater() {
    fs.mkdirSync(UPDATE_TEMP_DIR, { recursive: true })
}

function normalizeVersion(value: string) {
    return String(value || "").trim().replace(/^v/i, "")
}

function parseSemver(value: string) {
    const normalized = normalizeVersion(value)
    const [core, prerelease = ""] = normalized.split("-")
    const [major = "0", minor = "0", patch = "0"] = core.split(".")

    return {
        major: Number(major) || 0,
        minor: Number(minor) || 0,
        patch: Number(patch) || 0,
        prerelease
    }
}

function compareVersions(left: string, right: string) {
    const a = parseSemver(left)
    const b = parseSemver(right)

    if (a.major !== b.major) return a.major - b.major
    if (a.minor !== b.minor) return a.minor - b.minor
    if (a.patch !== b.patch) return a.patch - b.patch

    if (!a.prerelease && b.prerelease) return 1
    if (a.prerelease && !b.prerelease) return -1
    return a.prerelease.localeCompare(b.prerelease)
}

function githubHeaders() {
    return {
        Accept: "application/vnd.github+json",
        "User-Agent": `Hamro Church/${app.getVersion()}`
    }
}

function scoreAsset(assetName: string) {
    const name = assetName.toLowerCase()
    let score = 0

    if (process.arch === "x64") {
        if (name.includes("x64") || name.includes("amd64")) score += 20
        if (name.includes("arm64") || name.includes("aarch64")) score -= 20
    } else if (process.arch === "arm64") {
        if (name.includes("arm64") || name.includes("aarch64")) score += 20
        if (name.includes("x64") || name.includes("amd64")) score -= 20
    }

    if (process.platform === "win32" && /\.exe$/i.test(name)) score += 10
    if (process.platform === "darwin" && /\.dmg$/i.test(name)) score += 10
    if (process.platform === "linux" && /\.appimage$/i.test(name)) score += 10

    return score
}

function selectAsset(release: GitHubRelease): AppUpdateAsset | null {
    const assets = Array.isArray(release.assets) ? release.assets : []
    const platformMatchers =
        process.platform === "win32"
            ? [/\.exe$/i]
            : process.platform === "darwin"
              ? [/\.dmg$/i, /\.zip$/i]
              : [/\.AppImage$/i, /\.deb$/i, /\.rpm$/i]

    const matchingAssets = assets.filter((asset) => {
        const name = String(asset.name || "")
        return platformMatchers.some((matcher) => matcher.test(name))
    })

    if (!matchingAssets.length) return null

    const asset = matchingAssets.sort((left, right) => scoreAsset(String(right.name || "")) - scoreAsset(String(left.name || "")))[0]
    if (!asset?.name || !asset.browser_download_url) return null

    return {
        name: asset.name,
        url: asset.browser_download_url,
        contentType: asset.content_type,
        digest: asset.digest || null
    }
}

async function fetchLatestRelease() {
    const response = await axios.get<GitHubRelease>(RELEASES_LATEST_URL, {
        timeout: 15000,
        headers: githubHeaders(),
        validateStatus: (status) => status >= 200 && status < 300
    })

    return response.data
}

function createBaseResult(currentVersion: string, checkedAt: number): AppUpdateInfo {
    return {
        checked: true,
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
        releaseNotes: "",
        releaseUrl: RELEASES_PAGE_URL,
        checkedAt
    }
}

export async function checkForUpdates(options: { manual?: boolean; includeBeta?: boolean } = {}): Promise<AppUpdateInfo> {
    const manual = options.manual === true
    const includeBeta = options.includeBeta === true
    const currentVersion = normalizeVersion(app.getVersion())
    const checkedAt = Date.now()

    if (!manual && !app.isPackaged) {
        return { ...createBaseResult(currentVersion, checkedAt), checked: false, skipped: true }
    }

    const lastCheck = Number(config.get("lastUpdateCheck") || 0)
    if (!manual && lastCheck && checkedAt - lastCheck < CHECK_INTERVAL_MS && cachedUpdateInfo) {
        return { ...cachedUpdateInfo, checked: false, skipped: true }
    }

    config.set("lastUpdateCheck", checkedAt)

    try {
        const release = await fetchLatestRelease()
        const latestVersion = normalizeVersion(release.tag_name || currentVersion)
        const isPrerelease = Boolean(release.prerelease || parseSemver(latestVersion).prerelease)
        const hasUpdate = compareVersions(latestVersion, currentVersion) > 0 && (!isPrerelease || includeBeta)

        const result: AppUpdateInfo = {
            checked: true,
            hasUpdate,
            currentVersion,
            latestVersion,
            releaseNotes: String(release.body || ""),
            releaseUrl: String(release.html_url || RELEASES_PAGE_URL),
            publishedAt: release.published_at,
            asset: hasUpdate ? selectAsset(release) : null,
            checkedAt
        }

        cachedUpdateInfo = result
        return result
    } catch (error) {
        const result: AppUpdateInfo = {
            ...createBaseResult(currentVersion, checkedAt),
            error: error instanceof Error ? error.message : String(error)
        }
        cachedUpdateInfo = result
        return result
    }
}

function getExpectedHash(asset: AppUpdateAsset | null | undefined) {
    const digest = String(asset?.digest || "")
    if (!digest.startsWith("sha256:")) return null
    return digest.slice("sha256:".length)
}

async function downloadAsset(asset: AppUpdateAsset) {
    await fs.promises.mkdir(UPDATE_TEMP_DIR, { recursive: true })
    const targetPath = path.join(UPDATE_TEMP_DIR, asset.name)

    const response = await axios.get(asset.url, {
        responseType: "stream",
        timeout: 120000,
        headers: githubHeaders(),
        validateStatus: (status) => status >= 200 && status < 300
    })

    const hash = createHash("sha256")
    const hashStream = new Transform({
        transform(chunk, _encoding, callback) {
            hash.update(chunk)
            callback(null, chunk)
        }
    })

    await pipeline(response.data, hashStream, fs.createWriteStream(targetPath))

    const expectedHash = getExpectedHash(asset)
    if (expectedHash) {
        const actualHash = hash.digest("hex")
        if (actualHash !== expectedHash) throw new Error("Downloaded update file failed integrity validation")
    }

    return targetPath
}

async function launchInstaller(filePath: string) {
    const extension = path.extname(filePath).toLowerCase()

    if (process.platform === "win32") {
        const child = spawn(filePath, [], { detached: true, stdio: "ignore" })
        child.unref()
        setTimeout(() => app.quit(), 250)
        return
    }

    if (process.platform === "darwin") {
        const child = spawn("open", [filePath], { detached: true, stdio: "ignore" })
        child.unref()
        setTimeout(() => app.quit(), 250)
        return
    }

    if (process.platform === "linux" && extension === ".appimage") {
        await fs.promises.chmod(filePath, 0o755)
        const child = spawn(filePath, [], { detached: true, stdio: "ignore" })
        child.unref()
        setTimeout(() => app.quit(), 250)
        return
    }

    if (process.platform === "linux" && [".deb", ".rpm"].includes(extension)) {
        const child = spawn("xdg-open", [filePath], { detached: true, stdio: "ignore" })
        child.unref()
        setTimeout(() => app.quit(), 250)
        return
    }

    const result = await shell.openPath(filePath)
    if (result) throw new Error(result)
    setTimeout(() => app.quit(), 250)
}

export async function downloadAndInstallUpdate(options: { includeBeta?: boolean } = {}): Promise<AppUpdateDownloadResult> {
    const current = cachedUpdateInfo?.hasUpdate ? cachedUpdateInfo : await checkForUpdates({ manual: true, includeBeta: options.includeBeta })
    if (!current.hasUpdate || !current.asset) {
        return { success: false, launched: false, error: "No downloadable update is available for this platform." }
    }

    try {
        const filePath = await downloadAsset(current.asset)
        await launchInstaller(filePath)
        return { success: true, launched: true, filePath }
    } catch (error) {
        return {
            success: false,
            launched: false,
            error: error instanceof Error ? error.message : String(error)
        }
    }
}