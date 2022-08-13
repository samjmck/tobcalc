<script lang="ts">
    import { globalTaxFormData } from "./stores";
    import { Broker } from "./broker";
    import type { FormRow, BrokerAdapter, BrokerTransaction, TaxableTransaction } from "./tobcalc-lib";
    import {
        formatMoney,
        getTaxableTransactions,
        getTaxFormData,
        getTaxRate,
        isNameRegistered,
        SecurityType,
    } from "./tobcalc-lib.js";

    function formatPercentage(value: number) {
        return `${(value * 100).toFixed(2)}%`
    }
    function getSecurityTypeString(securityType: SecurityType) {
        switch(securityType) {
            case SecurityType.Stock:
                return "Stock";
            case SecurityType.ETF:
                return "ETF";
        }
    }

    export let broker: Broker;
    export let selectedBrokerNumber: number;
    export let brokerAdapter: BrokerAdapter;

    let files: File[] = [];
    let brokerTransactions: BrokerTransaction[] = [];
    let taxableTransactions: TaxableTransaction[] = [];
    let taxFormData: Map<number, FormRow> = new Map();
    let adapterError = "";
    async function loadedFile() {
        // try {
            brokerTransactions = await brokerAdapter(files[0]);
            taxableTransactions = await getTaxableTransactions(brokerTransactions);
            taxFormData = await getTaxFormData(taxableTransactions);
            globalTaxFormData.setTaxFormData(selectedBrokerNumber, taxFormData);
        // } catch(error) {
        //     adapterError = error.message;
        // }
    }
</script>

<label for={`adapter_${selectedBrokerNumber}`}>Choose {broker} csv</label>
<input name={`adapter_${selectedBrokerNumber}`} type="file" accept="text/csv, .csv" bind:files on:change={loadedFile} />
<p class="adapter-error">{adapterError}</p>
<table class="taxable-transactions">
    <tr>
        <th>Name</th>
        <th>Value</th>
        <th>Type</th>
        <th>Country</th>
        <th>Tax</th>
        <th>Registered</th>
    </tr>
    {#each taxableTransactions as taxableTransaction}
    <tr>
        <td>{taxableTransaction.security.name}</td>
        <td>{formatMoney(taxableTransaction.value)}</td>
        <td>{getSecurityTypeString(taxableTransaction.security.type)}</td>
        <td>{taxableTransaction.countryCode}</td>
        <td>{formatPercentage(getTaxRate(taxableTransaction))}</td>
        <td>{isNameRegistered(taxableTransaction.security.name) ? "Registered" : "Not registered"}</td>
    </tr>
    {/each}
</table>
<table class="tax-form-data">
    <tr>
        <th>Row no.</th>
        <th>Tax</th>
        <th>Quantity</th>
        <th>Tax base</th>
        <th>Tax value</th>
    </tr>
    {#each [...taxFormData.entries()] as [taxRate, formRow], i}
    <tr>
        <td>{i + 1}</td>
        <td>{formatPercentage(taxRate)}</td>
        <td>{formRow.quantity}</td>
        <td>{formatMoney(formRow.taxBase)}</td>
        <td>{formatMoney(formRow.taxValue)}</td>
    </tr>
    {/each}
</table>
