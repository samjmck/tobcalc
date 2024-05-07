<script lang="ts">
    import { lastSession, signatureFiles, nationalRegistrationNumber } from "../stores";
    import type { SessionInfo } from "../stores";
    import Select from "./ui/Select.svelte";
    import Input from "./ui/Input.svelte";
    let pdfObjectUrl = "";

    function updatePersonalInfo(key: keyof SessionInfo, value: string) {
        const oldLastSession = $lastSession;
        $lastSession = {
            ...oldLastSession,
            [key]: value,
        };
    }

    const initialLastSession = $lastSession;

    let lang = initialLastSession.lang;
	let startDateValue = initialLastSession.start;
	let endDateValue = initialLastSession.end;
	let fullName = initialLastSession.fullName
	let addressLine1Value = initialLastSession.addressLine1;
	let addressLine2Value = initialLastSession.addressLine2;
	let addressLine3Value = initialLastSession.addressLine3;
	let signatureNameValue = initialLastSession.signatureName;
	let signatureCapacityValue: string;
	let locationValue = initialLastSession.location;
	let dateValue = initialLastSession.date;
</script>

<div class="form">
    <label for="lang">Language</label>
    <Select id="lang" name="lang" bind:value={lang} on:change={() => updatePersonalInfo("lang", lang)}>
        <option value="DE">German</option>
        <option value="EN">English</option>
        <option value="FR">French</option>
        <option value="NL">Dutch</option>
    </Select>

    <label for="start">Start date</label>
    <Input id="start" name="start" type="date" bind:value={startDateValue} on:input={() => updatePersonalInfo("start", startDateValue)} />

    <label for="end">End date</label>
    <Input id="end" name="end" type="date" bind:value={endDateValue} on:input={() => updatePersonalInfo("end", endDateValue)} />

    <label for="national_registration_number">National registration number</label>
    <Input id="national_registration_number" name="national_registration_number" placeholder="ex: 700101000" type="text" bind:value={$nationalRegistrationNumber} />
    <label for="full_name">Full name</label>
    <Input id="full_name" name="full_name" placeholder="ex: John James Doe" type="text" bind:value={fullName} on:input={() => updatePersonalInfo("fullName", fullName)} />

    <label for="address_line_1">Address</label>
    <div>
        <Input id="address_line_1" name="address_line_1" placeholder="Address line 1" type="text" bind:value={addressLine1Value} on:input={() => updatePersonalInfo("addressLine1", addressLine1Value)} />
        <Input class="mt-3" name="address_line_2" placeholder="Address line 2" type="text" bind:value={addressLine2Value} on:input={() => updatePersonalInfo("addressLine2", addressLine2Value)} />
        <Input class="mt-3" name="address_line_3" placeholder="Address line 3" type="text" bind:value={addressLine3Value} on:input={() => updatePersonalInfo("addressLine3", addressLine3Value)} />
    </div>

    <label for="signature_name">Signature name</label>
    <Input id="signature_name" name="signature_name" placeholder="ex: John Doe" type="text" bind:value={signatureNameValue} on:input={() => updatePersonalInfo("signatureName", signatureNameValue)} />
    <label for="signature_capacity">Signature capacity</label>
    <Input id="signature_capacity" name="signature_capacity" placeholder="ex: Employee" type="text" bind:value={signatureCapacityValue} on:input={() => updatePersonalInfo("signatureCapacity", signatureCapacityValue)} />

    <label for="location">Location</label>
    <Input id="location" name="location" placeholder="Location" type="text" bind:value={locationValue} on:input={() => updatePersonalInfo("location", locationValue)} />

    <label for="date">Date</label>
    <Input id="date" name="date" placeholder="Date" type="text" bind:value={dateValue} on:input={() => updatePersonalInfo("date", dateValue)} />

    <label for="signature_png">Choose signature png</label>
    <input id="signature_png" name="signature_png" type="file" accept="image/png" bind:files={$signatureFiles} />
</div>

<style>
    .form {
        display: flex;
        flex-direction: column;
        background-color: rgb(216, 234, 241);
        box-shadow: 3px 3px 3px rgb(192, 208, 214);
        border-radius: 20px;
        padding: 1rem;
        margin-right: 2rem;
    }
    input[type="date"] {
        margin-top: 0;
		margin-bottom: 1em;
    }
    label {
		margin-top: 1em;
		margin-bottom: 0.25em;
	}
</style>