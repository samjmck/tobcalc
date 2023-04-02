<script lang="ts">
    import { IBKRAdapter, DEGIROAdapter, Trading212Adapter, BoursoramaAdapter } from "../tobcalc-lib.js";
    import { adapterNumber, totalTaxFormData } from "../stores";
    import BrokerAdapter from "./BrokerAdapter.svelte";
    import { Broker, brokers } from "../broker";

    let selectedBrokers: Map<number, Broker> = new Map();
	selectedBrokers.set($adapterNumber++, Broker.InteractiveBrokers);

	function addSelectedBroker(service: Broker) {
		selectedBrokers.set($adapterNumber++, service);
		// Force reactivity change
		selectedBrokers = selectedBrokers;
	}
	function setSelectedBroker(selectedBrokerNumber: number, broker: Broker) {
		selectedBrokers.set(selectedBrokerNumber, broker);
		selectedBrokers = selectedBrokers;
	}
	function removeSelectedBroker(selectedBrokerNumber: number) {
		selectedBrokers.delete(selectedBrokerNumber);
		totalTaxFormData.delete(selectedBrokerNumber)
		selectedBrokers = selectedBrokers;
	}
</script>

<button on:click|preventDefault={() => addSelectedBroker(Broker.InteractiveBrokers)}>Import extra transactions file</button>

{#each [...selectedBrokers.entries()] as [selectedBrokerNumber, selectedBroker] (selectedBrokerNumber)}
<div class="selected-service">
    <select on:change={event => setSelectedBroker(selectedBrokerNumber, event.target.value)}>
        {#each brokers as service}
            <option value={service}>{service}</option>
        {/each}
    </select>
    <button on:click|preventDefault={() => removeSelectedBroker(selectedBrokerNumber)}>Remove</button>
    {#if selectedBroker === Broker.InteractiveBrokers}
        <BrokerAdapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={IBKRAdapter} />
    {:else if selectedBroker === Broker.Trading212}
        <BrokerAdapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={Trading212Adapter} />
    {:else if selectedBroker === Broker.DEGIRO}
        <BrokerAdapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={DEGIROAdapter} />
    {:else if selectedBroker === Broker.Boursorama}
        <BrokerAdapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={BoursoramaAdapter} />
    {/if}
</div>
{/each}