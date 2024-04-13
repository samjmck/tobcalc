<script lang="ts">
    import { openPaymentInfo, nationalRegistrationNumber, lastSession } from "../../stores";
    import { formatMoney } from "@samjmck/tobcalc-lib";
    import QrCode from "../ui/QrCode.svelte";
    import Input from "../ui/Input.svelte";
    import Button from "../ui/Button.svelte";

    export let amount = 0.00;

    // Defaults from: https://financien.belgium.be/nl/particulieren/internationaal/buitenlandse-inkomsten-en-rekeningen/taks-op-beursverrichtingen#q3
    const defaultBeneficiary = "Inningscentrum - sectie diverse taksen";
    const defaultIban = "BE39679200229319";
    const defaultBic = "PCHQBEBB";
    let defaultUnstructuredReference: string;
    function getDefaultUnstructuredReference(nn: string, start: string, end: string) {
        const [startYear, startMonth,] = start.split('-');
        const [endYear, endMonth,] = end.split('-');
        let period = `${startMonth}/${startYear}`;
        if (endMonth != startMonth)
            period += `-${endMonth}/${endYear}`;
        return `TOB - ${nn} - ${period}`;
    }

    // Necessary SCT data
    let beneficiary = defaultBeneficiary;
    let iban = defaultIban;
    let bic = defaultBic;
    let unstructuredReference: string;
    let customUnstructuredReference = false; // Flag to use custom unstructured reference or the default one (updated once user starts modifying the default).

    // Update default unstructured reference (and unstructuredReference if it was not yet modified)
    $: {
        defaultUnstructuredReference = getDefaultUnstructuredReference($nationalRegistrationNumber, $lastSession.start, $lastSession.end);
        if (!customUnstructuredReference)
            unstructuredReference = defaultUnstructuredReference;
    }

    let qrData: string;
    function getSCTData(beneficiary: string, bic: string, iban: string, amount: number, unstructuredReference: string): string {
        // For a reference on the SEPA Credit Transfer (SCT) protocol, see
        // https://www.europeanpaymentscouncil.eu/document-library/guidance-documents/quick-response-code-guidelines-enable-data-capture-initiation
        const SERVICE_TAG = "BCD";
        const VERSION = "002";// Latest version (V2)
        const CHARSET = "1";// UTF-8 character set
        const ID = "SCT";// Identification code
        return [
            SERVICE_TAG,
            VERSION,
            CHARSET,
            ID,
            bic,
            beneficiary,
            iban,
            formatMoney(amount, "", {decimal: ".", thousand: ""}),
            "",// Purpose code
            "",// Structured reference
            unstructuredReference,
            "",// Beneficiary to Originator information
        ].join("\n");
    }

    // Update QR data
    $: qrData = getSCTData(beneficiary, bic, iban, amount, unstructuredReference);
</script>

<dialog open={$openPaymentInfo}>
    <p>Note that it's your responsibility to make sure the payment detail are up to date. You should be able to find the latest <a href="https://financien.belgium.be/nl/particulieren/internationaal/buitenlandse-inkomsten-en-rekeningen/taks-op-beursverrichtingen#q3" target="_blank">here</a>.</p>


    <div class="payment-info">
        <div class="form">
            <div><label for="beneficiary">Beneficiary</label> <Input id="beneficiary" type="text" bind:value={beneficiary} /></div>
            <div><label for="iban">IBAN</label> <Input id="iban" type="text" bind:value={iban} /></div>
            <div><label for="bic">BIC</label> <Input id="bic" type="text" bind:value={bic} /></div>
            <div><label for="unstructuredReference">Reference</label> <Input id="unstructuredReference" type="text" on:input={() => customUnstructuredReference=true} bind:value={unstructuredReference} /></div>
    <div>
            <p>Amount {formatMoney(amount)}</p>
            </div>
        </div>
        <div>
        <QrCode value={qrData} ecl="M" label="Scan to pay in banking app" />
        </div>
    </div>

    <Button style="secondary" slot="footer" on:click={() => $openPaymentInfo = false}>Close</Button>
</dialog>

<style>
    .payment-info {
        margin-top: 2rem;
        display: flex;
        justify-content: space-around;
    }

    .form > div {
        margin-top: 1em;
        display: flex;
        flex-direction: column;
    }
</style>