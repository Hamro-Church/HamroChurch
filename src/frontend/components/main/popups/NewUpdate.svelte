<script lang="ts">
    import type { AppUpdateInfo } from "../../../../types/Main"
    import { activePopup, popupData, special } from "../../../stores"
    import { downloadAndInstallUpdate, openReleasePage } from "../../../utils/checkForUpdates"
    import { newToast } from "../../../utils/common"
    import T from "../../helpers/T.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"

    let installing = false
    let errorMessage = ""

    function closePopup() {
        activePopup.set(null)
        popupData.set({})
    }

    async function download() {
        if (installing) return

        installing = true
        errorMessage = ""

        const result = await downloadAndInstallUpdate()
        if (!result.success) {
            errorMessage = result.error || ""
            newToast("updates.install_failed")
            installing = false
            return
        }

        closePopup()
    }

    function openRelease() {
        const updateInfo = $popupData as AppUpdateInfo
        openReleasePage(updateInfo.releaseUrl)
        closePopup()
    }
</script>

{#if $special.autoUpdates !== false}
    <div class="auto_update">
        <T id="updates.automatic_checks_enabled" />
    </div>
{/if}

<div class="versions">
    <div class="version-block">
        <span class="label"><T id="updates.current_version" /></span>
        <span class="value">v{$popupData.currentVersion}</span>
    </div>
    <div class="version-block">
        <span class="label"><T id="updates.latest_version" /></span>
        <span class="value">v{$popupData.latestVersion}</span>
    </div>
</div>

<div class="buttons">
    {#if $popupData.asset}
        <MaterialButton variant="contained" icon="download" disabled={installing} on:click={download}>
            <T id="updates.download_install" />
        </MaterialButton>
    {:else}
        <MaterialButton variant="contained" icon="open_in_new" on:click={openRelease}>
            <T id="updates.open_release" />
        </MaterialButton>
    {/if}

    <MaterialButton icon="schedule" disabled={installing} on:click={closePopup}>
        <T id="updates.later" />
    </MaterialButton>
</div>

{#if errorMessage}
    <p class="error"><T id="updates.install_failed" /></p>
    <p class="error-detail">{errorMessage}</p>
{/if}

<div class="changelog">
    <h3 style="color: var(--text);text-decoration: underline solid var(--secondary);"><T id="about.changes" /></h3>
    {#if $popupData.releaseNotes}
        <pre class="changelog-content">{$popupData.releaseNotes}</pre>
    {:else}
        <p><T id="about.new_update" /></p>
    {/if}
</div>

<style>
    .auto_update {
        max-width: 650px;
        font-size: 0.9em;
        margin-bottom: 12px;
    }

    .changelog {
        margin-top: 20px;
        max-height: 300px;
        overflow-y: auto;

        padding: 20px;
        background-color: var(--primary-darker);
        border-radius: 8px;
    }

    .changelog-content {
        white-space: pre-wrap;
        margin: 0;
        font-family: inherit;
    }

    .versions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
        margin-bottom: 14px;
    }

    .version-block {
        display: flex;
        flex-direction: column;
        gap: 4px;
        padding: 10px 14px;
        border-radius: 8px;
        background-color: var(--primary-darker);
    }

    .label {
        opacity: 0.8;
        font-size: 0.9em;
    }

    .value {
        font-weight: 600;
        color: var(--text);
    }

    .buttons {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
    }

    .error {
        margin-top: 12px;
        color: var(--text-red, #ff6b6b);
    }

    .error-detail {
        margin-top: 4px;
        font-size: 0.9em;
        opacity: 0.8;
    }
</style>
