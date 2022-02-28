<script lang="ts">
	import { selectedServices } from "./stores";
	import { Service, services } from "./service";
	import Adapter from "./Adapter.svelte";
	import { getSecurity, setECBHostname, setInvestingComHostname, IBKRAdapter } from "./tobcalc-lib.js";

	setECBHostname("localhost:8081/ecb")
	setInvestingComHostname("localhost:8081/investing_com");
</script>

<form>
	<input name="start" type="date" />
	<input name="end" type="date" />
	<input name="national_registration_number" type="text" />
	<input name="full_name" type="text" />
	<input name="address_line_1" type="text" />
	<input name="address_line_2" type="text" />
	<input name="address_line_3" type="text" />
	<input name="national_registration_number" type="text" />
	<input name="signature_name" type="text" />
	<input name="signature_capacity" type="text" />
	<button on:click|preventDefault={() => selectedServices.add(Service.InteractiveBrokers)}>New service</button>
	{#each $selectedServices as selectedService, i}
		<div>
			<select bind:value={selectedService}>
				{#each services as service}
				<option value={service}>{service}</option>
				{/each}
			</select>
			<button on:click|preventDefault={() => selectedServices.remove(i)}>Remove</button>
			{#if selectedService === Service.InteractiveBrokers}
				<Adapter id={i} service={selectedService} serviceAdapter={IBKRAdapter} />
			{/if}
		</div>
	{/each}
</form>
