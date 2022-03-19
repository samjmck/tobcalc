<script lang="ts">
    import { globalTaxFormData } from "./stores";
    import { Service } from "./service";
    import type { ServiceAdapter, ServiceTransaction, TaxableTransaction, FormRow } from "./tobcalc-lib";
    import { getTaxFormData, getTaxableTransactions, getTaxRate, formatMoney } from "./tobcalc-lib.js";

    export let service: Service;
    export let selectedServiceNumber: number;
    export let serviceAdapter: ServiceAdapter;

    let files: File[] = [];
    let serviceTransactions: ServiceTransaction[] = [];
    let taxableTransactions: TaxableTransaction[] = [];
    let taxFormData: Map<number, FormRow> = new Map();
    let adapterError = "";
    async function loadedFile() {
        try {
            serviceTransactions = await serviceAdapter(files[0]);
            taxableTransactions = await getTaxableTransactions(serviceTransactions);
            taxFormData = await getTaxFormData(taxableTransactions);
            globalTaxFormData.setTaxFormData(selectedServiceNumber, taxFormData);
        } catch(error) {
            adapterError = error.message;
        }
    }
</script>

<label for={`adapter_${selectedServiceNumber}`}>Choose {service} csv</label>
<input name={`adapter_${selectedServiceNumber}`} type="file" accept="text/csv, .csv" bind:files on:change={loadedFile} />
<p class="adapter-error">{adapterError}</p>
<table class="taxable-transactions">
    <tr>
        <th>Row no.</th>
        <th>Value</th>
        <th>Security type</th>
        <th>Country</th>
        <th>Tax</th>
    </tr>
    {#each taxableTransactions as taxableTransaction, i}
    <tr>
        <td>{i + 1}</td>
        <td>{formatMoney(taxableTransaction.value)}</td>
        <td>{taxableTransaction.security.type}</td>
        <td>{taxableTransaction.countryCode}</td>
        <td>{getTaxRate(taxableTransaction) * 100}%</td>
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
        <td>{taxRate * 100}%</td>
        <td>{formRow.quantity}</td>
        <td>{formatMoney(formRow.taxBase)}</td>
        <td>{formatMoney(formRow.taxValue)}</td>
    </tr>
    {/each}
</table>
