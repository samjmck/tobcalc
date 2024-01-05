<script lang="ts">
    import { openPaymentInfo, nationalRegistrationNumber, lastSession } from "../stores";
    import { formatMoney } from "../tobcalc-lib.js";
    import QrCode from "./QrCode.svelte";

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
    <div>
        <form method="dialog">
            <label for="beneficiary">Beneficiary</label> <input id="beneficiary" type="text" bind:value={beneficiary} />
            <label for="iban">IBAN</label> <input id="iban" type="text" bind:value={iban} />
            <label for="bic">BIC</label> <input id="bic" type="text" bind:value={bic} />
            <label for="unstructuredReference">Reference</label> <input id="unstructuredReference" type="text" on:input={() => customUnstructuredReference=true} bind:value={unstructuredReference} />
            <p>Amount {formatMoney(amount)}</p>
            <button on:click={() => $openPaymentInfo = false}>Close</button>
        </form>
        <!--{#if amount >= 1}-->
        <QrCode value={qrData} ecl="M" label="Scan to pay in banking app" />
        <!--{/if}-->
    </div>
</dialog>

<style>
    dialog {
        margin: 0;
        max-height: 100vh;
        position: fixed;
        z-index: 1;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    dialog > div {
        display: flex;
    }
    form {
        margin-right: 1em;
    }
    input {
        width: 20em;
    }
</style>