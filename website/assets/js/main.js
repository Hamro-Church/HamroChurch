(function () {
    const body = document.body
    const root = document.documentElement
    const languageKey = "hamrochurch-site-language"
    const navToggle = document.querySelector("[data-nav-toggle]")
    const nav = document.querySelector("[data-site-nav]")
    const year = document.querySelector("[data-year]")

    function setLanguage(language) {
        const nextLanguage = language === "ne" ? "ne" : "en"
        body.dataset.lang = nextLanguage
        root.lang = nextLanguage

        document.querySelectorAll("[data-language]").forEach((button) => {
            const isActive = button.getAttribute("data-language") === nextLanguage
            button.classList.toggle("is-active", isActive)
            button.setAttribute("aria-pressed", String(isActive))
        })

        window.localStorage.setItem(languageKey, nextLanguage)
    }

    function setActiveNav() {
        const path = window.location.pathname.replace(/index\.html$/, "") || "/"
        document.querySelectorAll("[data-nav]").forEach((link) => {
            const target = (link.getAttribute("href") || "/").replace(/index\.html$/, "")
            const active = target === "/" ? path === "/" : path === target || path.startsWith(target)
            link.classList.toggle("is-active", active)
        })
    }

    document.querySelectorAll("[data-language]").forEach((button) => {
        button.addEventListener("click", () => setLanguage(button.getAttribute("data-language") || "en"))
    })

    if (navToggle && nav) {
        navToggle.addEventListener("click", () => {
            const isOpen = body.dataset.navOpen === "true"
            const nextState = String(!isOpen)
            body.dataset.navOpen = nextState
            navToggle.setAttribute("aria-expanded", nextState)
        })

        nav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                body.dataset.navOpen = "false"
                navToggle.setAttribute("aria-expanded", "false")
            })
        })
    }

    document.querySelectorAll("[data-placeholder-link]").forEach((link) => {
        link.addEventListener("click", (event) => {
            if (link.getAttribute("href") === "#") event.preventDefault()
        })
    })

    if (year) year.textContent = String(new Date().getFullYear())

    setActiveNav()
    setLanguage(window.localStorage.getItem(languageKey) || "en")
})()