<script lang="ts">
	import { adapterNumber, globalTaxFormData } from "./stores";
	import { Service, services } from "./service";
	import Adapter from "./Adapter.svelte";
	import { setECBHostname, setInvestingComHostname, IBKRAdapter } from "./tobcalc-lib.js";
	import type { fillPdf } from "./tobcalc-lib.js";
	import type { FormRow } from "./tobcalc-lib";

	const pdfWorker = new Worker("tobcalc-lib-pdf.js");

	let resolveFillPdfPromise: (result: Awaited<ReturnType<typeof fillPdf>>) => void;
	const workerFillPdf = (...params: Parameters<typeof fillPdf>): ReturnType<typeof fillPdf> => {
		pdfWorker.postMessage(params);
		return new Promise(resolve => resolveFillPdfPromise = resolve);
	};
	pdfWorker.onmessage = event => {
		resolveFillPdfPromise(event.data);
	};

	setECBHostname("localhost:8081/ecb");
	setInvestingComHostname("localhost:8081/investing_com");

	let selectedServices: Map<number, Service> = new Map();
	selectedServices.set($adapterNumber++, Service.InteractiveBrokers);

	function addSelectedService(service: Service) {
		selectedServices.set($adapterNumber++, service);
		// Force reactivity change
		selectedServices = selectedServices;
	}
	function removeSelectedService(selectedServiceNumber: number) {
		selectedServices.delete(selectedServiceNumber);
		globalTaxFormData.delete(selectedServiceNumber)
		selectedServices = selectedServices;
	}

	let pdfBytes: Uint8Array;
	fetch("tob-fillable.pdf").then(async response => {
		pdfBytes = new Uint8Array(await response.arrayBuffer());
	});

	let downloadElement: HTMLAnchorElement;
	let startDateValue: string;
	let endDateValue: string;
	let nationalRegistrationNumberValue: string;
	let fullName: string;
	let addressLine1Value: string;
	let addressLine2Value: string;
	let addressLine3Value: string;
	let signatureNameValue: string;
	let signatureCapacityValue: string;
	let signatureFiles: File[];
	let locationValue: string;
	let dateValue: string;
	async function downloadPdf() {
		const aggregatedTaxForms: { [taxRate: number]: FormRow } = {
			"0.0012": {
				quantity: 0,
				taxableValue: 0,
				taxValue: 0,
			},
			"0.0035": {
				quantity: 0,
				taxableValue: 0,
				taxValue: 0,
			},
			"0.0132": {
				quantity: 0,
				taxableValue: 0,
				taxValue: 0,
			},
		};
		let totalTaxValue = 0;
		for(const [_, taxFormData] of $globalTaxFormData) {
			for(const [taxRate, { quantity, taxableValue, taxValue }] of taxFormData) {
				const aggregatedFormRow = aggregatedTaxForms[taxRate];
				aggregatedFormRow.quantity += quantity;
				aggregatedFormRow.taxableValue += taxableValue;
				aggregatedFormRow.taxValue += taxValue;
				totalTaxValue += taxValue;
			}
		}

		const tax012FormRow = aggregatedTaxForms["0.0012"];
		const tax035FormRow = aggregatedTaxForms["0.0035"];
		const tax132FormRow = aggregatedTaxForms["0.0132"];
		const bytes = await workerFillPdf(pdfBytes, {
			start: new Date(startDateValue),
			end: new Date(endDateValue),
			nationalRegistrationNumber: nationalRegistrationNumberValue,
			fullName: fullName,
			addressLine1: addressLine1Value,
			addressLine2: addressLine2Value,
			addressLine3: addressLine3Value,
			tableATax012Quantity: tax012FormRow.quantity,
			tableATax035Quantity: tax035FormRow.quantity,
			tableATax132Quantity: tax132FormRow.quantity,
			tableATax012TaxableValue: tax012FormRow.taxableValue,
			tableATax035TaxableValue: tax035FormRow.taxableValue,
			tableATax132TaxableValue: tax132FormRow.taxableValue,
			tableATax012TaxValue: tax012FormRow.taxValue,
			tableATax035TaxValue: tax012FormRow.taxValue,
			tableATax132TaxValue: tax012FormRow.taxValue,
			tableATotalTaxValue: totalTaxValue,
			totalTaxValue: totalTaxValue,
			signaturePng: new Uint8Array(await signatureFiles[0].arrayBuffer()),
			signatureName: signatureNameValue,
			signatureCapacity: signatureCapacityValue,
			location: locationValue,
			date: dateValue,
		});
		const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }))
		downloadElement.href = url;
		downloadElement.click();
		URL.revokeObjectURL(url);
	}
</script>

<form>
	<label for="start">Start date</label>
	<input id="start" name="start" type="date" bind:value={startDateValue} />
	<label for="end">End date</label>
	<input id="end" name="end" type="date" bind:value={endDateValue} />
	<input name="national_registration_number" placeholder="National registration number" type="text" bind:value={nationalRegistrationNumberValue} />
	<input name="full_name" placeholder="Full name" type="text" bind:value={fullName} />
	<input name="address_line_1" placeholder="Address line 1" type="text" bind:value={addressLine1Value} />
	<input name="address_line_2" placeholder="Address line 2" type="text" bind:value={addressLine2Value} />
	<input name="address_line_3" placeholder="Address line 3" type="text" bind:value={addressLine3Value} />
	<input name="signature_name" placeholder="Signature name" type="text" bind:value={signatureNameValue} />
	<input name="signature_capacity" placeholder="Signature capacity" type="text" bind:value={signatureCapacityValue} />
	<input name="location" placeholder="Location" type="text" bind:value={locationValue} />
	<input name="date" placeholder="Date" type="text" bind:value={dateValue} />

	<label for="signature_png">Choose signature png</label>
	<input id="signature_png" name="signature_png" type="file" accept="image/png" bind:files={signatureFiles} />

	<button on:click|preventDefault={() => addSelectedService(Service.InteractiveBrokers)}>New service</button>

	{#each [...selectedServices.entries()] as [selectedServiceNumber, selectedService] (selectedServiceNumber)}
		<div>
			<select bind:value={selectedService}>
				{#each services as service}
				<option value={service}>{service}</option>
				{/each}
			</select>
			<button on:click|preventDefault={() => removeSelectedService(selectedServiceNumber)}>Remove</button>
			{#if selectedService === Service.InteractiveBrokers}
				<Adapter selectedServiceNumber={selectedServiceNumber} service={selectedService} serviceAdapter={IBKRAdapter} />
			{/if}
		</div>
	{/each}

	<button on:click|preventDefault={downloadPdf}>Download pdf</button>
	<a id="download-link" bind:this={downloadElement} download="tob-filled.pdf">Download pdf</a>
</form>

<style>
	form {
		padding-bottom: 10em;
	}
	#download-link {
		display: none;
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
