<script lang="ts">
    import { openSettings, alwaysOpenFilterDialog } from "../../stores";
    import Modal from "./Modal.svelte";
    import Button from "../ui/Button.svelte";
</script>

<Modal bind:open={$openSettings}>
    <span slot="head">Settings</span>
    <label for="alwaysOpenFilterDialog">Always open transactions filter dialog</label> <input id="alwaysOpenFilterDialog" type="checkbox" bind:checked={$alwaysOpenFilterDialog} />
    <form method="dialog">
        <Button style="secondary" on:click={() => $openSettings = false}>Close</Button>
    </form>
</Modal>

<style>
    form {
        margin-top: 1rem;
    }
</style>
