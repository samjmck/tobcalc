<script lang="ts">
    import { taxRateOverrides, totalTaxFormData } from "../stores";
    import type {
        BrokerAdapter,
        BrokerTransaction,
        FormRow,
        Security,
        TaxableTransaction
    } from "@samjmck/tobcalc-lib";
    import { formatMoney, isNameRegistered, SecurityType, getTaxableTransactions, getTaxFormData } from "@samjmck/tobcalc-lib";
    import { Broker } from "../broker";
    import { getSecuritiesMapWithOverrides, getTaxRateWithOverrides } from "../overrides";
    import { formatPercentage } from "../format";
    import PromptFailedSecurityFetches from "./modal/PromptFailedSecurityFetches.svelte";
    import PromptFilterBrokerTransactions from "./modal/PromptFilterBrokerTransactions.svelte";
    import PromptMergeTransactions from "./modal/PromptMergeTransactions.svelte";
    import Table from './ui/Table.svelte';

    export let broker: Broker;
    export let selectedBrokerNumber: number;
    export let brokerAdapter: BrokerAdapter;

    function getSecurityTypeString(securityType: SecurityType) {
        switch(securityType) {
            case SecurityType.Stock:
                return "Stock";
            case SecurityType.ETF:
                return "ETF";
        }
    }

    let openFailedSecuritiesPrompt = false;
    let failedSecuritiesIsins: string[] = [];
    let resolveNewSecurities: (newSecurities: Map<string, Security>) => void;
    function promptNewSecurities(failedIsins: string[]): Promise<Map<string, Security>> {
        return new Promise(resolve => {
            failedSecuritiesIsins = failedIsins;
            resolveNewSecurities = resolve;
            openFailedSecuritiesPrompt = true;
        });
    }

    let checkDuplicateBrokerTransactions = false;
    let brokerTransactions: BrokerTransaction[] = [];
    let resolveFilteredBrokerTransactions: (filteredBrokerTransactions: BrokerTransaction[]) => void;
    function filterBrokerTransactions(brokerTransactions: BrokerTransaction[]): Promise<BrokerTransaction[]> {
        return new Promise(resolve => {
            checkDuplicateBrokerTransactions = true;
            brokerTransactions = brokerTransactions;
            resolveFilteredBrokerTransactions = resolve;
        });
    }

    let shouldCheckMergeTransactionPrompt = false;
    let resolveMergedBrokerTransactions: (mergedTransactions: BrokerTransaction[]) => void;
    function mergeBrokerTransactions(brokerTransactions: BrokerTransaction[]): Promise<BrokerTransaction[]> {
        return new Promise(resolve => {
            brokerTransactions = brokerTransactions;
            shouldCheckMergeTransactionPrompt = true;
            resolveMergedBrokerTransactions = resolve;
        });
    }

    let files: File[] = [];
    let taxableTransactions: TaxableTransaction[] = [];
    let taxResults: [string, FormRow][] = [];
    let adapterError = "";
    async function updateTaxableTransactions() {
        try {
            brokerTransactions = await brokerAdapter(files[0]);
            brokerTransactions = await filterBrokerTransactions(brokerTransactions);
            brokerTransactions = await mergeBrokerTransactions(brokerTransactions);
            taxableTransactions = await getTaxableTransactions(brokerTransactions, isins => {
                return getSecuritiesMapWithOverrides(isins, failedIsins => {
                    if(failedIsins.length > 0) {
                        return promptNewSecurities(failedIsins);
                    } else {
                        return Promise.resolve(new Map());
                    }
                });
            });
        } catch(error) {
            adapterError = error.message;
        }
    }
    function updateTaxFormData(taxableTransactions: TaxableTransaction[], taxRateOverrides: Map<string, number>) {
        const taxFormData = getTaxFormData(taxableTransactions, getTaxRateWithOverrides(taxRateOverrides));
		taxResults = [
			['0.12%', taxFormData['012']],
            ['0.35%', taxFormData['035']],
            ['1.32%', taxFormData['132']]
        ]
        totalTaxFormData.setTaxFormData(selectedBrokerNumber, taxFormData);
    }

    $: {
        if(files.length > 0) {
            updateTaxableTransactions();
        }
    }
    $: {
        updateTaxFormData(taxableTransactions, $taxRateOverrides);
    }
</script>

<label for={`adapter_${selectedBrokerNumber}`}>Choose {broker} csv</label>
<input name={`adapter_${selectedBrokerNumber}`} type="file" accept="text/csv, .csv" bind:files />
<p class="adapter-error">{adapterError}</p>
    <Table>
        <svelte:fragment slot="head">
        <th>Name</th>
        <th>Value</th>
        <th>Type</th>
        <th>Country</th>
        <th>Registered</th>
        <th>Tax</th>
        <th>Overridden</th>
        </svelte:fragment>

    {#each taxableTransactions as taxableTransaction}
    <tr>
        <td>{taxableTransaction.security.name}</td>
        <td>{formatMoney(taxableTransaction.value)}</td>
        <td>{getSecurityTypeString(taxableTransaction.security.type)}</td>
        <td>{taxableTransaction.countryCode}</td>
        <td>{isNameRegistered(taxableTransaction.security.name) ? "Registered" : "Not registered"}</td>
        <td>{formatPercentage(getTaxRateWithOverrides($taxRateOverrides)(taxableTransaction))}</td>
        <td>{$taxRateOverrides.has(taxableTransaction.security.isin)}</td>
    </tr>
    {/each}
    </Table>
    <Table>
        <svelte:fragment slot="head">
        <th>Row no.</th>
        <th>Tax</th>
        <th>Quantity</th>
        <th>Tax base</th>
        <th>Tax value</th>
        </svelte:fragment>

    {#each taxResults as [taxRate, formRow], i}
    <tr>
        <td>{i + 1}</td>
        <td>{taxRate}</td>
        <td>{formRow.quantity}</td>
        <td>{formatMoney(formRow.taxBase)}</td>
        <td>{formatMoney(formRow.taxValue)}</td>
    </tr>
    {/each}
    </Table>

<PromptFilterBrokerTransactions bind:check={checkDuplicateBrokerTransactions} {brokerTransactions} {resolveFilteredBrokerTransactions} />
<PromptMergeTransactions bind:shouldCheck={shouldCheckMergeTransactionPrompt} {brokerTransactions} {resolveMergedBrokerTransactions} />
<PromptFailedSecurityFetches bind:open={openFailedSecuritiesPrompt} failedIsins={failedSecuritiesIsins} {resolveNewSecurities} />

<style>
    input[type="file"] {
		margin-top: 0;
		margin-bottom: 1em;
	}
	label {
		margin-top: 1em;
		margin-bottom: 0.25em;
	}
	button {
		margin: 1em 0;
	}
</style>