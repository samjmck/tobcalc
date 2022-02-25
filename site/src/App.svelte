<script lang="ts">
	let adapterNumber = 1;
	const selectedAdapters = [
			"Interactive Brokers",
	];
	const adapterNames = [
			"Interactive Brokers",
	];
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
	{#each selectedAdapters as selectedAdapter, i}
		<input name={selectedAdapter, } type="file" />
	{/each}
</form>
