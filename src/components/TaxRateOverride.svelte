<script lang="ts">
    import { taxRates } from "../overrides";
    import { taxRateOverrides } from "../stores";

    function formatPercentage(value: number) {
        return `${(value * 100).toFixed(2)}%`;
    }

    let newIsin = "";
    let newRate = taxRates[0];

    function addEntry() {
        if(newIsin.length === 0) {
            return;
        }
        if($taxRateOverrides.has(newIsin)) {
            return;
        }

        taxRateOverrides.setOverride(newIsin, newRate)

        newIsin = "";
        newRate = taxRates[0];
    }

    function removeEntry(isin: string) {
        taxRateOverrides.delete(isin);
    }
</script>

<p>If you notice an incorrect tax rate, you can override the rate by adding an entry in this table.</p>
<p>Take VWCE for example. If you believe its TOB rate should be 0.12% yet tobcalc is showing 1.32%, then you can manually override this by adding an entry with ISIN "IE00BK5BQT80" and tax rate 0.12%.</p>

<table>
    <tr>
        <th>ISIN</th>
        <th>Tax rate</th>
        <th></th>
    </tr>
    <tr>
        <td><input type="text" bind:value={newIsin} /></td>
        <td>
            <select bind:value={newRate}>
                {#each taxRates as rate}
                    <option value={rate}>{formatPercentage(rate)}</option>
                {/each}
            </select>
        </td>
        <td><button on:click={addEntry}>Add</button></td>
    </tr>
    {#each [...$taxRateOverrides.entries()] as [isin, rate]}
        <tr>
            <td>{isin}</td>
            <td>{rate}</td>
            <td><button on:click={() => removeEntry(isin)}>Remove</button></td>
        </tr>
    {/each}
</table>