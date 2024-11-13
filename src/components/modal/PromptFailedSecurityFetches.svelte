<script lang="ts">
    import type { Security } from "#lib";
    import { SecurityType } from "#lib";
    import Modal from "./Modal.svelte";
    import Table from "../ui/Table.svelte";
    import Button from "../ui/Button.svelte";
    import Select from "../ui/Select.svelte";

    export let open: boolean;
    export let failedIsins: string[];
    export let resolveNewSecurities: (newSecuritiesMap: Map<string, Security>) => void;

    $: {
        if(open) {
            initialiseNewSecurities();
        }
    }

    let newSecurities: Security[] = [];
    function finishedNewSecurities() {
        open = false;
        resolveNewSecurities(new Map(newSecurities.map(newSecurity => [newSecurity.isin, newSecurity])));
    }
    function initialiseNewSecurities() {
        newSecurities = [];
        for(const failedIsin of failedIsins) {
            newSecurities.push({
                type: SecurityType.ETF,
                name: "",
                isin: failedIsin,
                accumulating: true,
            });
        }
    }
</script>

<Modal force={true} bind:open>
    <p>
        Some of the securities in your transaction history cannot be found online. This could be due to them being delisted
        or not being available in the database we use.
    </p>
    <p>
        Please enter the details for these securities manually. Note that overrides also apply to these securities, so
        if it's easier, you can just leave these details blank and enter the overrides instead.
    </p>
    <Table>
        <svelte:fragment slot="head" >
            <th>ISIN</th>
            <th>Name</th>
            <th>Type</th>
            <th>Fund type</th>
        </svelte:fragment>
        {#each newSecurities as newSecurity}
        <tr>
            <td>{newSecurity.isin}</td>
            <td><input type="text" bind:value={newSecurity.name} /></td>
            <td>
                <Select bind:value={newSecurity.type}>
                    <option value={SecurityType.Stock}>Stock</option>
                    <option value={SecurityType.ETF}>ETF</option>
                </Select>
            </td>
            {#if newSecurity.type === SecurityType.ETF}
            <td>
                <Select bind:value={newSecurity.accumulating}>
                    <option value={true}>Accumulating</option>
                    <option value={false}>Distributing</option>
                </Select>
            </td>
            {:else}
            <td>Not a fund</td>
            {/if}
        </tr>
        {/each}
    </Table>
    <form method="dialog">
        <Button style="secondary" on:click={finishedNewSecurities}>Continue</Button>
    </form>
</Modal>

<style>
    p {
        margin-bottom: 0.8em;
    }

    form {
        margin-top: 1rem;
    }
</style>
