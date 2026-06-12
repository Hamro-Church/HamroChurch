const { cpSync, existsSync, rmSync } = require("fs")
const { join } = require("path")
const { spawnSync } = require("child_process")

const repoRoot = join(__dirname, "..")
const grandioseRoot = join(repoRoot, "node_modules", "grandiose")
const sourceNdiDir = join(repoRoot, "ndi")
const targetNdiDir = join(grandioseRoot, "ndi")

if (!existsSync(grandioseRoot)) {
    throw new Error("grandiose is not installed in node_modules")
}

ensureRootNdiSdk()
mirrorNdiSdkForGrandiose()

function ensureRootNdiSdk() {
    const includeDir = join(sourceNdiDir, "include")
    const libDir = join(sourceNdiDir, "lib")
    if (existsSync(includeDir) && existsSync(libDir)) return

    const result = spawnSync("node", [join(grandioseRoot, "ndi.js")], {
        cwd: repoRoot,
        stdio: "inherit"
    })

    if (result.status !== 0) {
        throw new Error(`grandiose ndi.js failed with exit code ${result.status}`)
    }

    if (!existsSync(includeDir) || !existsSync(libDir)) {
        throw new Error("grandiose ndi.js did not produce ndi/include and ndi/lib")
    }
}

function mirrorNdiSdkForGrandiose() {
    rmSync(targetNdiDir, { recursive: true, force: true })
    cpSync(sourceNdiDir, targetNdiDir, { recursive: true, force: true })
}