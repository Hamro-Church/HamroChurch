(function () {
    const apiUrl = "https://api.github.com/repos/Hamro-Church/HamroChurch/releases/latest"
    const fallbackUrl = "https://github.com/Hamro-Church/HamroChurch/releases/latest"

    const pageLinks = document.querySelectorAll("[data-release-page]")
    const windowsLinks = document.querySelectorAll("[data-release-windows]")
    const macLinks = document.querySelectorAll("[data-release-macos]")
    const linuxLinks = document.querySelectorAll("[data-release-linux]")
    const versionNodes = document.querySelectorAll("[data-release-version]")
    const summaryNodes = document.querySelectorAll("[data-release-summary]")

    if (!pageLinks.length && !windowsLinks.length && !macLinks.length && !linuxLinks.length) return

    function setLinkGroup(nodes, href) {
        nodes.forEach((node) => node.setAttribute("href", href))
    }

    function setTextGroup(nodes, value) {
        nodes.forEach((node) => {
            node.textContent = value
        })
    }

    function findAsset(assets, matcher) {
        return assets.find((asset) => matcher.test(asset.name || "")) || null
    }

    setLinkGroup(pageLinks, fallbackUrl)
    setLinkGroup(windowsLinks, fallbackUrl)
    setLinkGroup(macLinks, fallbackUrl)
    setLinkGroup(linuxLinks, fallbackUrl)

    fetch(apiUrl, { headers: { Accept: "application/vnd.github+json" } })
        .then((response) => {
            if (!response.ok) throw new Error("Could not load the latest release")
            return response.json()
        })
        .then((release) => {
            const assets = Array.isArray(release.assets) ? release.assets : []
            const releaseUrl = release.html_url || fallbackUrl
            const version = release.tag_name || "latest"

            const windowsAsset = findAsset(assets, /\.exe$/i)
            const macAsset = findAsset(assets, /\.dmg$/i)
            const linuxAsset = findAsset(assets, /\.AppImage$/i) || findAsset(assets, /\.deb$/i)

            setLinkGroup(pageLinks, releaseUrl)
            setTextGroup(versionNodes, version)
            setTextGroup(summaryNodes, "Latest stable release is " + version + ".")

            setLinkGroup(windowsLinks, windowsAsset ? windowsAsset.browser_download_url : releaseUrl)
            setLinkGroup(macLinks, macAsset ? macAsset.browser_download_url : releaseUrl)
            setLinkGroup(linuxLinks, linuxAsset ? linuxAsset.browser_download_url : releaseUrl)
        })
        .catch(() => {
            setTextGroup(summaryNodes, "Use the latest GitHub Release page if asset detection is unavailable.")
        })
})()