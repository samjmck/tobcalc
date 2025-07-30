<script lang="ts">
    import {
		IBKRAdapter,
        DEGIROAdapter,
        Trading212Adapter,
        BoursoramaAdapter,
        RevolutAdapter,
	} from "@samjmck/tobcalc-lib";
    import { adapterNumber, totalTaxFormData } from "../stores";
    import BrokerAdapter from "./BrokerAdapter.svelte";
    import { Broker, brokers } from "../broker";
    import Button from "./ui/Button.svelte";
    import Select from "./ui/Select.svelte";
    import Ic_close from "./icon/Close.svelte";

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

<h2>Import transactions</h2>

<p>Buy orders have a negative (-) value because they represent money leaving your account to purchase securities. On the other hand, sell orders have a positive (+) value because they represent money coming into your account when you sell securities. This mirrors how you would record the cash flow in a bank account.</p>

<Button style='primary' on:click={() => addSelectedBroker(Broker.InteractiveBrokers)}>Add import file</Button>

{#each [...selectedBrokers.entries()] as [selectedBrokerNumber, selectedBroker] (selectedBrokerNumber)}
<div class="selected-service">
    <div class="broker-action">
        <Select on:change={event => setSelectedBroker(selectedBrokerNumber, event.target.value)}>
        {#each brokers as service}
            <option value={service}>{service}</option>
        {/each}
        </Select>

        <button on:click={() => removeSelectedBroker(selectedBrokerNumber)}><Ic_close color='#a02929' /></button>
    </div>

    <div class="mt-3">
        {#if selectedBroker === Broker.InteractiveBrokers}
            <BrokerAdapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={IBKRAdapter} />
        {:else if selectedBroker === Broker.Trading212}
            <BrokerAdapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={Trading212Adapter} />
        {:else if selectedBroker === Broker.DEGIRO}
            <BrokerAdapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={DEGIROAdapter} />
        {:else if selectedBroker === Broker.Boursorama}
            <BrokerAdapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={BoursoramaAdapter} />
        {:else if selectedBroker === Broker.Revolut}
            <BrokerAdapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={RevolutAdapter} />
        {/if}
    </div>
</div>
{/each}

<style>
    .broker-action {
        display: flex;
        justify-content: space-between;
    }

    .selected-service {
        margin-top: 1rem;
        padding: 1rem;
        background-color: #e6e6e6;
        border-radius: 5px;
        border-color: #dfdfdf;
        border-width: 2px;
        border-style: solid;
    }
</style>