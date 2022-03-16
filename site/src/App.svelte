<script lang="ts">
	import { adapterNumber, globalTaxFormData } from "./stores";
	import { Service, services } from "./service";
	import Adapter from "./Adapter.svelte";
	import type { ETF, fillPdf, FormRow } from "./tobcalc-lib.js";
	import {
		cacheExchangeRates,
		CurrencyCode,
		exchangeRatesMap,
		getSecurity,
		IBKRAdapter,
		setECBHostname,
		setInvestingComHostname
	} from "./tobcalc-lib.js";

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

	// Basic tests
	let failedTestsError = "";
	getSecurity("IWDA").then(security => {
		if(security.type !== "ETF") {
			failedTestsError = "Wrong security type for IWDA";
			return;
		}
		if(!(<ETF> security).accumulating) {
			failedTestsError = "Wrong security data for IWDA (showing as distributing)";
			return;
		}
	}).catch(error => {
		failedTestsError = "Could not get IWDA security data";
	});
	getSecurity("VWCE").then(security => {
		if(security.type !== "ETF") {
			failedTestsError = "Wrong security type for VWCE";
			return;
		}
		if(!(<ETF> security).accumulating) {
			failedTestsError = "Wrong security data for VWCE (showing as distributing)";
			return;
		}
	}).catch(error => {
		failedTestsError = "Could not get VWCE security data";
	});
	const start = new Date("21 February 2022 00:00:00 GMT");
	const end = new Date("25 February 2022 00:00:00 GMT");
	const expectedRates: { [date: string]: number} = {
		"2022-02-21": 1.1338,
		"2022-02-22": 1.1342,
		"2022-02-23": 1.1344,
		"2022-02-24": 1.1163,
		"2022-02-25": 1.1216,
	};
	cacheExchangeRates(start, end, CurrencyCode.USD).then(result => {
		const rates = exchangeRatesMap.get(CurrencyCode.USD);
		if(rates === undefined) {
			failedTestsError = "Failed exchange rates test";
			return;
		}
		for(const date in expectedRates) {
			if(expectedRates[date] !== rates.get(date)) {
				failedTestsError = "Failed exchange rates test";
				return;
			}
		}
	}).catch(error => {
		failedTestsError = "Failed exchange rates test";
	});

	let selectedServices: Map<number, Service> = new Map();
	selectedServices.set($adapterNumber++, Service.InteractiveBrokers);

	function addSelectedService(service: Service) {
		selectedServices.set($adapterNumber++, service);
		// Force reactivity change
		selectedServices = selectedServices;
	}
	function setSelectedService(selectedServiceNumber: number, service: Service) {
		selectedServices.set(selectedServiceNumber, service);
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

	let pdfObjectUrl = "";

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
	let pdfError = "";
	async function downloadPdf() {
		const aggregatedTaxForms: { [taxRate: number]: FormRow } = {
			"0.0012": {
				quantity: 0,
				taxBase: 0,
				taxValue: 0,
			},
			"0.0035": {
				quantity: 0,
				taxBase: 0,
				taxValue: 0,
			},
			"0.0132": {
				quantity: 0,
				taxBase: 0,
				taxValue: 0,
			},
		};
		let totalTaxValue = 0;
		for(const [_, taxFormData] of $globalTaxFormData) {
			for(const [taxRate, { quantity, taxBase, taxValue }] of taxFormData) {
				const aggregatedFormRow = aggregatedTaxForms[taxRate];
				aggregatedFormRow.quantity += quantity;
				aggregatedFormRow.taxBase += taxBase;
				aggregatedFormRow.taxValue += taxValue;
				totalTaxValue += taxValue;
			}
		}
		const tax012FormRow = aggregatedTaxForms["0.0012"];
		const tax035FormRow = aggregatedTaxForms["0.0035"];
		const tax132FormRow = aggregatedTaxForms["0.0132"];

		try {
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
				tableATax012TaxBase: tax012FormRow.taxBase,
				tableATax035TaxBase: tax035FormRow.taxBase,
				tableATax132TaxBase: tax132FormRow.taxBase,
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
			pdfObjectUrl = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }))
			downloadElement.href = pdfObjectUrl;
			downloadElement.click();
			URL.revokeObjectURL(pdfObjectUrl);
		} catch(error) {
			pdfError = error.message;
		}
	}
</script>

{#if failedTestsError !== ""}
<h2>Error while performing checks: {failedTestsError}</h2>
{/if}

<div class="column">
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

	<button on:click|preventDefault={downloadPdf}>Download pdf</button>
	<a id="download-link" bind:this={downloadElement} download="tob-filled.pdf">Download pdf</a>
	<p class="pdf-error">{pdfError}</p>
</div>

<div class="column">
	<button on:click|preventDefault={() => addSelectedService(Service.InteractiveBrokers)}>New service</button>

	{#each [...selectedServices.entries()] as [selectedServiceNumber, selectedService] (selectedServiceNumber)}
	<div class="selected-service">
		<select on:change={event => setSelectedService(selectedServiceNumber, event.target.value)}>
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
</div>

<div class="column">
	<embed bind:src={pdfObjectUrl} width="250" height="600" />
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
