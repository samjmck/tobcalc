<script lang="ts">
    export let objectUrl: string;
    export let error: string;

    let downloadElement: HTMLAnchorElement;
    let embedElement: HTMLEmbedElement;
    $: {
        if(downloadElement && embedElement) {
            downloadElement.href = objectUrl;
            embedElement.src = objectUrl;
        }
    }
</script>

<a id="download-link" bind:this={downloadElement} download="tob-filled.pdf">Download pdf</a>
<button on:click|preventDefault={() => downloadElement.click()}>Download pdf</button>
<p class="pdf-error">{error}</p>
<embed bind:this={embedElement} width="500" height="700" />

<style>
    #download-link {
        display: none;
    }
</style>