<script lang="ts">
    import { openSettings, alwaysOpenFilterDialog } from "../stores";
</script>

<dialog open={$openSettings}>
    <label for="alwaysOpenFilterDialog">Always open transactions filter dialog</label> <input id="alwaysOpenFilterDialog" type="checkbox" bind:checked={$alwaysOpenFilterDialog} />
    <form method="dialog">
        <button on:click={() => $openSettings = false}>Close</button>
    </form>
</dialog>

<style>
    dialog {
        max-height: 100vh;
        overflow-y: scroll;
        position: fixed;
        z-index: 1;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style>