<script lang="ts">
	import { selectedServices } from "./stores";
	import { Service, services } from "./service";
	import IBKRAdapter from "./IBKRAdapter.svelte";

	import { consoleLog } from "./tobcalc-lib.js";

	consoleLog();
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
				<IBKRAdapter id={i} />
			{/if}
		</div>
	{/each}
</form>
