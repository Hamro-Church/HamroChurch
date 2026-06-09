<script lang="ts">
    import { onMount } from "svelte"
    import type { AppUpdateInfo } from "../../../../types/Main"
    import { alertUpdates, special, version } from "../../../stores"
    import { downloadAndInstallUpdate, getUpdateData, notifyManualUpdateResult, openReleasePage } from "../../../utils/checkForUpdates"
    import Loader from "../Loader.svelte"
    import T from "../../helpers/T.svelte"
    import MaterialButton from "../../inputs/MaterialButton.svelte"
    import MaterialToggleSwitch from "../../inputs/MaterialToggleSwitch.svelte"
    import InputRow from "../../input/InputRow.svelte"

    let loading = true
    let installing = false
    let updateInfo: AppUpdateInfo = {
        checked: false,
        hasUpdate: false,
        currentVersion: "",
        latestVersion: "",
        releaseNotes: "",
        releaseUrl: "https://github.com/Hamro-Church/HamroChurch/releases"
    }
    let errorMessage = ""

    function updateSpecial(value: any, key: string) {
        special.update((a) => {
            if (key === "autoUpdates") a[key] = value !== false
            else if (!value) delete a[key]
            else a[key] = value

            return a
        })
    }

    async function checkUpdates(showToast = false) {
        loading = true
        errorMessage = ""

        try {
            updateInfo = await getUpdateData(true)
            errorMessage = updateInfo.error || ""
            if (showToast) notifyManualUpdateResult(updateInfo)
        } catch (error) {
            console.warn(error)
            errorMessage = error instanceof Error ? error.message : String(error)
        }

        loading = false
    }

    async function downloadLatest() {
        if (!updateInfo.hasUpdate || !updateInfo.latestVersion || installing) return

        installing = true
        errorMessage = ""

        const result = await downloadAndInstallUpdate()
        if (!result.success) errorMessage = result.error || ""

        installing = false
    }

    function openRelease() {
        openReleasePage(updateInfo.releaseUrl)
    }

    onMount(() => checkUpdates())

    $: isBeta = $version.includes("-beta")
    $: currentVersion = updateInfo.currentVersion || $version
    $: latestVersion = updateInfo.latestVersion || currentVersion
    $: hasUpdate = updateInfo.hasUpdate
</script>

<div class="settings">
    <InputRow arrow={$alertUpdates}>
        <MaterialToggleSwitch style="flex: 1;" label="settings.alert_updates" checked={$alertUpdates} defaultValue={true} on:change={(e) => alertUpdates.set(e.detail)} />
        <div slot="menu">
            <MaterialToggleSwitch label="settings.alert_updates_beta" disabled={isBeta} checked={isBeta ? $alertUpdates : $special.betaVersionAlert} defaultValue={false} on:change={(e) => updateSpecial(e.detail, "betaVersionAlert")} />
        </div>
    </InputRow>

    <MaterialToggleSwitch label="settings.auto_updates" checked={$special.autoUpdates !== false} on:change={(e) => updateSpecial(e.detail, "autoUpdates")} />

    <MaterialButton variant="contained" style="margin-top: 10px;" icon="update" disabled={loading || installing} on:click={() => checkUpdates(true)}>
        <T id="updates.check_now" />
    </MaterialButton>
</div>

{#if !loading}
    <div class="versions">
        <div class="version-block">
            <span class="label"><T id="updates.current_version" /></span>
            <span class="value">v{currentVersion}</span>
        </div>
        <div class="version-block">
            <span class="label"><T id="updates.latest_version" /></span>
            <span class="value">v{latestVersion}</span>
        </div>
    </div>
{/if}

{#if !loading && hasUpdate}
    <div class="actions">
        {#if updateInfo.asset}
            <MaterialButton variant="contained" icon="download" disabled={installing} on:click={downloadLatest}>
                <T id="updates.download_install" />
            </MaterialButton>
        {:else}
            <MaterialButton variant="contained" icon="open_in_new" on:click={openRelease}>
                <T id="updates.open_release" />
            </MaterialButton>
        {/if}
    </div>
{/if}

{#if loading}
    <div class="loading">
        <Loader />
    </div>
{:else}
    <div class="changelog">
        <h3>{#if hasUpdate}<T id="about.changes" />{:else}<T id="updates.latest" />{/if}</h3>

        {#if errorMessage}
            <p><T id="updates.unable_to_check" /></p>
            <p class="small">{errorMessage}</p>
        {:else if hasUpdate && !updateInfo.asset}
            <p><T id="updates.asset_missing" /></p>
        {:else if updateInfo.releaseNotes}
            <pre class="changelog-content">{updateInfo.releaseNotes}</pre>
        {:else if hasUpdate}
            <p><T id="about.new_update" /></p>
        {:else}
            <p><T id="updates.latest" /></p>
        {/if}

        {#if $special.autoUpdates !== false}
            <p class="small"><T id="updates.automatic_checks_enabled" /></p>
        {/if}
    </div>
{/if}

<style>
    .settings {
        display: flex;
        flex-direction: column;
        margin-bottom: 10px;
    }

    .versions {
        display: flex;
        justify-content: center;
        gap: 12px;
        margin-top: 10px;
        flex-wrap: wrap;
    }

    .version-block {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 14px;
        border-radius: 8px;
        background-color: var(--primary-darker);
    }

    .value {
        color: var(--text);
        font-weight: 600;
    }

    .loading {
        margin-top: 15px;
        display: flex;
        justify-content: center;
    }

    .changelog {
        margin-top: 15px;
        padding: 16px;
        background-color: var(--primary-darker);
        border-radius: 8px;
        max-height: 300px;
        overflow-y: auto;
    }

    .actions {
        display: flex;
        justify-content: center;
        margin-top: 12px;
    }

    h3 {
        color: var(--text);
        text-decoration: underline solid var(--secondary);
        margin-bottom: 8px;
    }

    .changelog-content {
        line-height: 1.4;
        white-space: pre-wrap;
        font-family: inherit;
        margin: 0;
    }

    .small {
        opacity: 0.8;
        font-size: 0.9em;
    }
</style>
