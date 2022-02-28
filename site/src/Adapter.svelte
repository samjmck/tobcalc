<script lang="ts">
    import { Service } from "./service";
    import type { ServiceAdapter, ServiceTransaction, TaxableTransaction, FormRow } from "./tobcalc-lib";
    import { getTaxFormData, getTaxableTransactions } from "./tobcalc-lib.js";

    export let id: number;
    export let service: Service;
    export let serviceAdapter: ServiceAdapter;

    let files: File[] = [];
    let serviceTransactions: ServiceTransaction[] = [];
    let taxableTransactions: TaxableTransaction[] = [];
    let taxFormRows: FormRow[] = [];
    async function loadedFile() {
        serviceTransactions = await serviceAdapter(files[0]);
        taxableTransactions = await getTaxableTransactions(serviceTransactions);
        const taxFormData = await getTaxFormData(taxableTransactions);
        for(const [_, formRow] of taxFormData) {
            taxFormRows.push(formRow);
        }
    }
</script>

<label for={`adapter_${id}`}>Choose {service} csv</label>
<input name={`adapter_${id}`} type="file" accept="text/csv, .csv" bind:files on:change={loadedFile} />
<ul class="taxable-transactions">
    {#each taxableTransactions as taxableTransaction}
    <li>Value {taxableTransaction.value} EUR, security type {taxableTransaction.security.type}, country code {taxableTransaction.countryCode}</li>
    {/each}
</ul>

