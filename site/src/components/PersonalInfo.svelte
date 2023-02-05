<script lang="ts">
    import { lastSession, signatureFiles, nationalRegistrationNumber } from "../stores";
    import type { SessionInfo } from "../stores";

    export let update: () => void;

    let pdfObjectUrl = "";

    function updatePersonalInfo(key: keyof SessionInfo, value: string) {
        const oldLastSession = $lastSession;
        $lastSession = {
            ...oldLastSession,
            [key]: value,
        };
    }

    const initialLastSession = $lastSession;

	let startDateValue = initialLastSession.start;
	let endDateValue = initialLastSession.end;
	let fullName = initialLastSession.fullName
	let addressLine1Value = initialLastSession.addressLine1;
	let addressLine2Value = initialLastSession.addressLine2;
	let addressLine3Value = initialLastSession.addressLine3;
	let signatureNameValue = initialLastSession.signatureName;
	let signatureCapacityValue: string;
	let signatureFiles: File[] = [];
	let locationValue = initialLastSession.location;
	let dateValue = initialLastSession.date;
</script>

<label for="start">Start date</label>
<input id="start" name="start" type="date" bind:value={startDateValue} on:input={() => updatePersonalInfo("start", startDateValue)} on:input={update} />
<label for="end">End date</label>
<input id="end" name="end" type="date" bind:value={endDateValue} on:input={() => updatePersonalInfo("start", endDateValue)} on:input={update} />
<input name="national_registration_number" placeholder="National registration number" type="text" bind:value={$nationalRegistrationNumber} on:input={update} />
<input name="full_name" placeholder="Full name" type="text" bind:value={fullName} on:input={() => updatePersonalInfo("fullName", fullName)} on:input={update} />
<input name="address_line_1" placeholder="Address line 1" type="text" bind:value={addressLine1Value} on:input={() => updatePersonalInfo("addressLine1", addressLine1Value)} on:input={update} />
<input name="address_line_2" placeholder="Address line 2" type="text" bind:value={addressLine2Value} on:input={() => updatePersonalInfo("addressLine2", addressLine1Value)} on:input={update} />
<input name="address_line_3" placeholder="Address line 3" type="text" bind:value={addressLine3Value} on:input={() => updatePersonalInfo("addressLine3", addressLine1Value)} on:input={update} />
<input name="signature_name" placeholder="Signature name" type="text" bind:value={signatureNameValue} on:input={() => updatePersonalInfo("signatureName", signatureNameValue)} on:input={update} />
<input name="signature_capacity" placeholder="Signature capacity" type="text" bind:value={signatureCapacityValue} on:input={() => updatePersonalInfo("signatureCapacity", signatureCapacityValue)} on:input={update} />
<input name="location" placeholder="Location" type="text" bind:value={locationValue} on:input={() => updatePersonalInfo("location", locationValue)} on:input={update} />
<input name="date" placeholder="Date" type="text" bind:value={dateValue} on:input={() => updatePersonalInfo("date", dateValue)} on:input={update} />

<label for="signature_png">Choose signature png</label>
<input id="signature_png" name="signature_png" type="file" accept="image/png" bind:files={signatureFiles} on:input={update} />

<style>
    input[type="date"] {
        margin-top: 0;
		margin-bottom: 1em;
    }
    label {
		margin-top: 1em;
		margin-bottom: 0.25em;
	}
</style>