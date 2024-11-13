<script lang="ts">
    import type { BrokerTransaction } from "#lib";
    import { formatMoney } from "#lib";
    import { formatDate } from "../../format";
    import { alwaysOpenFilterDialog } from "../../stores";
    import Modal from "./Modal.svelte";
    import Table from "../ui/Table.svelte";
    import Button from "../ui/Button.svelte";

    export let check: boolean;
    export let brokerTransactions: BrokerTransaction[];
    export let resolveFilteredBrokerTransactions: (filteredBrokerTransactions: BrokerTransaction[]) => void;

    let open = false;

    $: {
        if(check) {
            initialiseFilteredBrokerTransactions();
        }
    }
    type FilteredBrokerTransaction = {
        include: boolean, brokerTransaction: BrokerTransaction
    };
    let filteredBrokerTransactions: FilteredBrokerTransaction[] = [];
    function equalsFilteredBrokerTransaction(a: FilteredBrokerTransaction, b: FilteredBrokerTransaction) {
        return a.include === b.include &&
            a.brokerTransaction.date.valueOf() == b.brokerTransaction.date.valueOf() &&
            a.brokerTransaction.isin == b.brokerTransaction.isin &&
            a.brokerTransaction.currency == b.brokerTransaction.currency &&
            a.brokerTransaction.value == b.brokerTransaction.value;
    }
    let containsDuplicate: boolean;
    function initialiseFilteredBrokerTransactions() {
        containsDuplicate = false;
        filteredBrokerTransactions = [];
        for(const brokerTransaction of brokerTransactions) {
            if(filteredBrokerTransactions.some(filteredBrokerTransaction => equalsFilteredBrokerTransaction(filteredBrokerTransaction, { include: true, brokerTransaction }))) {
                filteredBrokerTransactions.push({
                    include: false,
                    brokerTransaction,
                });
                containsDuplicate = true;
            } else {
                filteredBrokerTransactions.push({
                    include: true,
                    brokerTransaction,
                });
            }
        }
        if($alwaysOpenFilterDialog || containsDuplicate) {
            open = true;
        } else {
            check = false;
            resolveFilteredBrokerTransactions(brokerTransactions);
        }
    }

    function finishedFiltering() {
        open = false;
        check = false;
        resolveFilteredBrokerTransactions(
            filteredBrokerTransactions
                .filter(filteredBrokerTransaction => filteredBrokerTransaction.include)
                .map(filteredBrokerTransaction => filteredBrokerTransaction.brokerTransaction)
        );
    }
</script>

<Modal force={true} bind:open>
    <span slot="head">Filter Broker Transactions</span>
    {#if containsDuplicate}
    <p>
        It seems like the transaction history you uploaded contains some duplicate transactions. We have excluded
        the duplicates by unchecking them in the table below, but you can include them again if this isn't correct.
    </p>
    {/if}
    <p>
        After you have checked the transactions you want to include, click the "Continue" button to continue to the tax
        calculation.
    </p>
    <Table>
        <svelte:fragment slot="head">
            <th>Include</th>
            <th>No.</th>
            <th>Date</th>
            <th>ISIN</th>
            <th>Currency</th>
            <th>Value</th>
        </svelte:fragment>
        {#each filteredBrokerTransactions as filteredBrokerTransaction, i}
        <tr>
            <td><input type="checkbox" bind:checked={filteredBrokerTransactions[i].include} /></td>
            <td>{i + 1}</td>
            <td>{formatDate(filteredBrokerTransaction.brokerTransaction.date)}</td>
            <td>{filteredBrokerTransaction.brokerTransaction.isin}</td>
            <td>{filteredBrokerTransaction.brokerTransaction.currency}</td>
            <td>{formatMoney(filteredBrokerTransaction.brokerTransaction.value, "")}</td>
        {/each}
    </Table>
    <form method="dialog">
        <Button style=secondary on:click={finishedFiltering}>Continue</Button>
    </form>
</Modal>

<style>
    form {
        margin-top: 1rem;
    }
</style>
