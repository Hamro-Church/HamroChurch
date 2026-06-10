<script lang="ts">
    import { Main } from "../../../../types/IPC/Main"
    import { requestMain } from "../../../IPC/main"
    import { activePopup } from "../../../stores"
    import { hymnSelectedId, loadHymns } from "../../drawer/hymns/hymns"
    import T from "../../helpers/T.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import MaterialDropdown from "../../inputs/MaterialDropdown.svelte"
    import MaterialTextInput from "../../inputs/MaterialTextInput.svelte"
    import MaterialTextarea from "../../inputs/MaterialTextarea.svelte"

    let title = ""
    let titleEn = ""
    let lyrics = ""
    let number = ""
    let authors = ""
    let saving = false
    let errorMessage = ""
    let categoryId: "bhajan" | "chorus" | "children" | "new" = "bhajan"

    const categoryOptions = [
        { value: "bhajan", label: "Bhajan / भजन" },
        { value: "chorus", label: "Chorus / कोरस" },
        { value: "children", label: "Bal Sangati / बाल सङ्गित" },
        { value: "new", label: "New Songs / नयाँ गीत" }
    ]

    async function saveHymn() {
        if (!title.trim() || !lyrics.trim()) {
            errorMessage = "Title and lyrics are required."
            return
        }

        saving = true
        errorMessage = ""
        const result = await requestMain(Main.SAVE_HYMN, {
            title,
            titleEn,
            lyrics,
            categoryId,
            number,
            authors
        })
        saving = false

        if (!result?.success) {
            errorMessage = result?.error || "Could not save hymn."
            return
        }

        await loadHymns()
        if (result.id) hymnSelectedId.set(result.id)
        activePopup.set(null)
    }
</script>

<div class="form">
    <MaterialTextInput label="hymns.form_title" value={title} on:change={(e) => (title = e.detail)} autofocus />
    <MaterialTextInput label="hymns.form_transliteration" value={titleEn} on:change={(e) => (titleEn = e.detail)} />
    <MaterialDropdown label="hymns.form_category" options={categoryOptions} value={categoryId} on:change={(e) => (categoryId = e.detail)} />
    <MaterialTextInput label="hymns.form_number" value={number} on:change={(e) => (number = e.detail)} />
    <MaterialTextInput label="hymns.form_author" value={authors} on:change={(e) => (authors = e.detail)} />
    <MaterialTextarea label="hymns.form_lyrics" value={lyrics} rows={10} on:change={(e) => (lyrics = e.detail)} />

    {#if errorMessage}
        <p class="error">{errorMessage}</p>
    {/if}

    <div class="actions">
        <MaterialButton variant="contained" icon="save" on:click={saveHymn} disabled={saving}>
            <T id="actions.save" />
        </MaterialButton>
    </div>
</div>

<style>
    .form {
        display: flex;
        flex-direction: column;
        gap: 0.85rem;
        min-width: min(720px, 100%);
    }

    .actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 0.4rem;
    }

    .error {
        color: #ffb4a8;
        margin: 0;
    }
</style>
