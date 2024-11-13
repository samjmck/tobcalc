<script lang="ts">
    import type { BrokerTransaction } from "#lib";
    import { formatMoney } from "#lib";
    import { formatDate } from "../../format";
    import Modal from "./Modal.svelte";
    import Table from "../ui/Table.svelte";
    import Button from "../ui/Button.svelte";

    export let shouldCheck: boolean;
    export let brokerTransactions: BrokerTransaction[];
    export let resolveMergedBrokerTransactions: (mergedBrokerTransactions: BrokerTransaction[]) => void;

    let open = false
    let groupedMergedBrokerTransactions: MergedBrokerTransaction[][]= [];

    $: {
        if(shouldCheck) {
            initialiseMergedBrokerTransactions();
        }
    }

    type MergedBrokerTransaction = {
        merge: boolean,
        brokerTransaction: BrokerTransaction
    };


    function initialiseMergedBrokerTransactions() {
        // Group together similar transactions
        const groupedTransactions: { [key: string]: MergedBrokerTransaction[] } = brokerTransactions.reduce((acc: { [key: string]: MergedBrokerTransaction[] } , transaction: BrokerTransaction) => {
            const key: string = `${transaction.date}-${transaction.isin}-${transaction.currency}`;
            acc[key] = acc[key] || [];
            acc[key].push({merge:true,brokerTransaction:transaction});
            return acc;
        }, {});

        groupedMergedBrokerTransactions = Object.values(groupedTransactions);

        if (groupedMergedBrokerTransactions.some(e => e.length > 1)) {
            open = true;
        } else {
            shouldCheck = false;
            resolveMergedBrokerTransactions(brokerTransactions);
        }
    }

    function finishedMerging() {
        let mergedBrokerTransactions: BrokerTransaction[] = []
        const resultMap = new Map<string, BrokerTransaction>();

        // Sum all the values for the transaction that should be merged together
        groupedMergedBrokerTransactions.flat().forEach(group => {
            if (group.merge) {
                const key = `${group.brokerTransaction.date}-${group.brokerTransaction.isin}-${group.brokerTransaction.currency}`;
                const currentValue = resultMap.get(key)?.value || 0;
                resultMap.set(key, {
                    ...group.brokerTransaction,
                    value: group.brokerTransaction.value + currentValue
                });
            } else {
                mergedBrokerTransactions.push(group.brokerTransaction)
            }
        });

        mergedBrokerTransactions = [...mergedBrokerTransactions, ...resultMap.values()];

        open = false;
        shouldCheck = false;
        resolveMergedBrokerTransactions(mergedBrokerTransactions);
    }

</script>

<Modal force={true} bind:open>
    <p>
        It seems like some transactions have been split. Please check the transactions that should be merged back together.
    </p>
    <Table>
        <svelte:fragment slot="head">
            <th>Merge</th>
            <th>No.</th>
            <th>Date</th>
            <th>ISIN</th>
            <th>Currency</th>
            <th>Value</th>
        </svelte:fragment>

        {#each groupedMergedBrokerTransactions.filter(group => group.length > 1) as mergedBrokerTransactions, i}
        {#each mergedBrokerTransactions as mergedBrokerTransaction, j}
        <tr class="{j || !i ? '' : 'sep'}">
            <td><input type="checkbox" bind:checked={mergedBrokerTransaction.merge} /></td>
            <td>{j + 1}</td>
            <td>{formatDate(mergedBrokerTransaction.brokerTransaction.date)}</td>
            <td>{mergedBrokerTransaction.brokerTransaction.isin}</td>
            <td>{mergedBrokerTransaction.brokerTransaction.currency}</td>
            <td>{formatMoney(mergedBrokerTransaction.brokerTransaction.value, "")}</td>
        </tr>
        {/each}
        {/each}
    </Table>
    <form method="dialog">
        <Button style="secondary" on:click={finishedMerging}>Continue</Button>
    </form>
</Modal>

<style>
    tr.sep {
        border-top: solid gray 5px;
    }

    form {
        margin-top: 1rem;
    }
</style>
