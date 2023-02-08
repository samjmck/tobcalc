<script lang="ts">
    import type { BrokerTransaction } from "../tobcalc-lib.js";
    import { formatMoney } from "../tobcalc-lib.js";
    import { formatDate } from "../format";
    import { alwaysOpenFilterDialog } from "../stores";

    export let check;
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
    let containsDuplicate;
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

<dialog {open}>
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
    <table>
        <tr>
            <th>Include</th>
            <th>No.</th>
            <th>Date</th>
            <th>ISIN</th>
            <th>Currency</th>
            <th>Value</th>
        </tr>
        {#each filteredBrokerTransactions as filteredBrokerTransaction, i}
        <tr>
            <td><input type="checkbox" bind:checked={filteredBrokerTransactions[i].include} /></td>
            <td>{i + 1}</td>
            <td>{formatDate(filteredBrokerTransaction.brokerTransaction.date)}</td>
            <td>{filteredBrokerTransaction.brokerTransaction.isin}</td>
            <td>{filteredBrokerTransaction.brokerTransaction.currency}</td>
            <td>{formatMoney(filteredBrokerTransaction.brokerTransaction.value, "")}</td>
        {/each}
    </table>
    <form method="dialog">
        <button on:click={finishedFiltering}>Continue</button>
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
