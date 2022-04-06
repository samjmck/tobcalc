<script lang="ts">
	import { adapterNumber, globalTaxFormData } from "./stores";
	import { Broker, brokers } from "./broker";
	import Adapter from "./Adapter.svelte";
	import type { fillPdf, FormRow } from "./tobcalc-lib.js";
	import {
		IBKRAdapter,
		Trading212Adapter,
		setECBHostname,
		setInvestingComHostname
	} from "./tobcalc-lib.js";
	import { runTests } from "./tests";
	import type { TaxFormData } from "./tobcalc-lib.js";

	declare const process: { env: { [key: string]: string } };

	const pdfWorker = new Worker("tobcalc-lib-pdf.js");

	let resolveFillPdfPromise: (result: string) => void;
	const workerFillPdf = (...params: Parameters<typeof fillPdf>): Promise<string> => {
		pdfWorker.postMessage(params);
		return new Promise(resolve => resolveFillPdfPromise = resolve);
	};
	pdfWorker.onmessage = event => {
		resolveFillPdfPromise(event.data);
	};

	setECBHostname(process.env.ECB_HOSTNAME);
	setInvestingComHostname(process.env.INVESTING_COM_HOSTNAME);

	let failedTestsError = "";
	runTests().then(result => {
		if(result !== null) {
			failedTestsError = result;
		}
	});

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
		globalTaxFormData.delete(selectedBrokerNumber)
		selectedBrokers = selectedBrokers;
	}

	let pdfBytes: Uint8Array;
	fetch("tob-fillable.pdf").then(async response => {
		pdfBytes = new Uint8Array(await response.arrayBuffer());
	});

	let pdfObjectUrl = "";

	let downloadElement: HTMLAnchorElement;
	let embedElement: HTMLEmbedElement;
	let startDateValue: string;
	let endDateValue: string;
	let nationalRegistrationNumberValue: string;
	let fullName: string;
	let addressLine1Value: string;
	let addressLine2Value: string;
	let addressLine3Value: string;
	let signatureNameValue: string;
	let signatureCapacityValue: string;
	let signatureFiles: File[] = [];
	let locationValue: string;
	let dateValue: string;
	let pdfError = "";
	async function setPdfUrl(pdfTaxFormData: Map<number, TaxFormData>) {
		const emptyFormRow: FormRow = {
			quantity: 0,
			taxBase: 0,
			taxValue: 0,
		};
		const tax012FormRow: FormRow = Object.assign({}, emptyFormRow);
		const tax035FormRow: FormRow = Object.assign({}, emptyFormRow);
		const tax132FormRow: FormRow = Object.assign({}, emptyFormRow);
		let totalTaxValue = 0;
		for(const [_, taxFormData] of pdfTaxFormData) {
			for(const [taxRate, { quantity, taxBase, taxValue }] of taxFormData) {
				let aggregatedFormRow: FormRow;
				switch(taxRate) {
					case 0.0012:
						aggregatedFormRow = tax012FormRow;
						break;
					case 0.0035:
						aggregatedFormRow = tax035FormRow;
						break;
					default:
						aggregatedFormRow = tax132FormRow;
				}
				aggregatedFormRow.quantity += quantity;
				aggregatedFormRow.taxBase += taxBase;
				aggregatedFormRow.taxValue += taxValue;
				totalTaxValue += taxValue;
			}
		}

		try {
			const objectUrl = await workerFillPdf(pdfBytes, {
				start: startDateValue ? new Date(startDateValue) : new Date(),
				end: startDateValue ? new Date(endDateValue) : new Date(),
				nationalRegistrationNumber: nationalRegistrationNumberValue,
				fullName: fullName,
				addressLine1: addressLine1Value,
				addressLine2: addressLine2Value,
				addressLine3: addressLine3Value,
				tableATax012Quantity: tax012FormRow.quantity,
				tableATax035Quantity: tax035FormRow.quantity,
				tableATax132Quantity: tax132FormRow.quantity,
				tableATax012TaxBase: tax012FormRow.taxBase,
				tableATax035TaxBase: tax035FormRow.taxBase,
				tableATax132TaxBase: tax132FormRow.taxBase,
				tableATax012TaxValue: tax012FormRow.taxValue,
				tableATax035TaxValue: tax035FormRow.taxValue,
				tableATax132TaxValue: tax132FormRow.taxValue,
				tableATotalTaxValue: totalTaxValue,
				totalTaxValue: totalTaxValue,
				signaturePng: signatureFiles[0] ? new Uint8Array(await signatureFiles[0].arrayBuffer()) : undefined,
				signatureName: signatureNameValue,
				signatureCapacity: signatureCapacityValue,
				location: locationValue,
				date: dateValue,
			});
			downloadElement.href = objectUrl;
			embedElement.src = objectUrl;
		} catch(error) {
			pdfError = error.message;
		}
	}

	$: {
		if(pdfBytes !== undefined) {
			setPdfUrl($globalTaxFormData);
		}
	}

	let previousTimeoutId: number;
	function delayedPdfUpdate() {
		if(previousTimeoutId !== undefined) {
			clearTimeout(previousTimeoutId);
		}
		previousTimeoutId = setTimeout(() => {
			setPdfUrl($globalTaxFormData);
		}, 500);
	}
</script>

{#if failedTestsError !== ""}
<h2>Error while performing checks: {failedTestsError}</h2>
{/if}

<div class="column">
	<label for="start">Start date</label>
	<input id="start" name="start" type="date" bind:value={startDateValue} on:input={delayedPdfUpdate} />
	<label for="end">End date</label>
	<input id="end" name="end" type="date" bind:value={endDateValue} on:input={delayedPdfUpdate} />
	<input name="national_registration_number" placeholder="National registration number" type="text" bind:value={nationalRegistrationNumberValue} on:input={delayedPdfUpdate} />
	<input name="full_name" placeholder="Full name" type="text" bind:value={fullName} on:input={delayedPdfUpdate} />
	<input name="address_line_1" placeholder="Address line 1" type="text" bind:value={addressLine1Value} on:input={delayedPdfUpdate} />
	<input name="address_line_2" placeholder="Address line 2" type="text" bind:value={addressLine2Value} on:input={delayedPdfUpdate} />
	<input name="address_line_3" placeholder="Address line 3" type="text" bind:value={addressLine3Value} on:input={delayedPdfUpdate} />
	<input name="signature_name" placeholder="Signature name" type="text" bind:value={signatureNameValue} on:input={delayedPdfUpdate} />
	<input name="signature_capacity" placeholder="Signature capacity" type="text" bind:value={signatureCapacityValue} on:input={delayedPdfUpdate} />
	<input name="location" placeholder="Location" type="text" bind:value={locationValue} on:input={delayedPdfUpdate} />
	<input name="date" placeholder="Date" type="text" bind:value={dateValue} on:input={delayedPdfUpdate} />

	<label for="signature_png">Choose signature png</label>
	<input id="signature_png" name="signature_png" type="file" accept="image/png" bind:files={signatureFiles} on:input={delayedPdfUpdate} />
</div>

<div class="column">
	<button on:click|preventDefault={() => addSelectedBroker(Broker.InteractiveBrokers)}>New service</button>

	{#each [...selectedBrokers.entries()] as [selectedBrokerNumber, selectedBroker] (selectedBrokerNumber)}
	<div class="selected-service">
		<select on:change={event => setSelectedBroker(selectedBrokerNumber, event.target.value)}>
			{#each brokers as service}
				<option value={service}>{service}</option>
			{/each}
		</select>
		<button on:click|preventDefault={() => removeSelectedBroker(selectedBrokerNumber)}>Remove</button>
		{#if selectedBroker === Broker.InteractiveBrokers}
			<Adapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={IBKRAdapter} />
		{:else if selectedBroker === Broker.Trading212}
			<Adapter selectedBrokerNumber={selectedBrokerNumber} broker={selectedBroker} brokerAdapter={Trading212Adapter} />
		{/if}
	</div>
	{/each}
</div>

<div class="column">
	<a id="download-link" bind:this={downloadElement} download="tob-filled.pdf">Download pdf</a>
	<button on:click|preventDefault={() => downloadElement.click()}>Download pdf</button>
	<p class="pdf-error">{pdfError}</p>
	<embed bind:this={embedElement} width="500" height="700" />
</div>

<style>
	div.column {
		padding-bottom: 10em;
		margin-right: 3em;
	}
	#download-link {
		display: none;
	}
	div.selected-service {
		margin: 1em 0;
	}
	input {
		display: block;
		margin: 1em 0;
	}
	input[type="file"], input[type="date"] {
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
