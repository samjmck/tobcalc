<script lang="ts">
    import Button from "./ui/Button.svelte";

    export let objectUrl: string;
    export let error: string;

    declare function sa_event(name: string): void;

    let downloadElement: HTMLAnchorElement;
    let embedElement: HTMLEmbedElement;
    $: {
        if(downloadElement && embedElement) {
            downloadElement.href = objectUrl;
            embedElement.src = objectUrl;
        }
    }
</script>

<a id="download-link" on:click={() => sa_event("download_pdf")} bind:this={downloadElement} download="tob-filled.pdf">Download PDF</a>
<Button style="primary" on:click={() => downloadElement.click()}>Download pdf</Button>
<p class="pdf-error">{error}</p>
<embed bind:this={embedElement} width="500" height="700" />

<style>
    #download-link {
        display: none;
    }
</style>