<script lang="ts">
	import { adapterNumber, globalTaxFormData } from "./stores";
	import { Service, services } from "./service";
	import Adapter from "./Adapter.svelte";
	import { setECBHostname, setInvestingComHostname, IBKRAdapter, fillPdf } from "./tobcalc-lib.js";

	setECBHostname("localhost:8081/ecb")
	setInvestingComHostname("localhost:8081/investing_com");

	let selectedServices: Map<number, Service> = new Map();
	selectedServices.set($adapterNumber++, Service.InteractiveBrokers);

	function addSelectedService(service: Service) {
		selectedServices.set($adapterNumber++, Service.InteractiveBrokers);
		// Force reactivity change
		selectedServices = selectedServices;
	}
	function removeSelectedService(selectedServiceNumber: number) {
		selectedServices.delete(selectedServiceNumber);
		selectedServices = selectedServices;
	}

	let pdfBytes: Uint8Array = null;
	let downloadElement: HTMLAnchorElement;
	$: {
		(async () => {
			if(pdfBytes === null) {
				const pdfResponse = await fetch("tob-fillable.pdf");
				pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
			}
			const bytes = await fillPdf(pdfBytes, {
				start: new Date(),
				end: new Date(),
				nationalRegistrationNumber: "",
				fullName: "",
				addressLine1: "",
				addressLine2: "",
				addressLine3: "",
				tableATax012Quantity: 0,
				tableATax035Quantity: 0,
				tableATax132Quantity: 0,
				tableATax012TaxableValue: 0,
				tableATax035TaxableValue: 0,
				tableATax132TaxableValue: 0,
				tableATax012TaxValue: 0,
				tableATax035TaxValue: 0,
				tableATax132TaxValue: 0,
				tableATotalTaxValue: 0,
				totalTaxValue: 0,
				signaturePng: new Uint8Array(),
				signatureName: "",
				signatureCapacity: "",
				location: "",
				date: "",
			});
			downloadElement.href = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }))
		})();
	}
</script>

<form>
	<input name="start" type="date" />
	<input name="end" type="date" />
	<input name="national_registration_number" type="text" />
	<input name="full_name" placeholder="Full name" type="text" />
	<input name="address_line_1" placeholder="Address line 1" type="text" />
	<input name="address_line_2" placeholder="Address line 2" type="text" />
	<input name="address_line_3" placeholder="Address line 3" type="text" />
	<input name="national_registration_number" placeholder="National registration number" type="text" />
	<input name="signature_name" placeholder="Signature name" type="text" />
	<input name="signature_capacity" placeholder="Signature capacity" type="text" />
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

	<a bind:this={downloadElement} download="tob-filled.pdf">Download pdf</a>
</form>
