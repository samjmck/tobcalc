<script lang="ts">
	import { openSettings, openPaymentInfo, signatureFiles, totalTaxFormData, lastSession, nationalRegistrationNumber, SessionInfo } from "./stores";
	import TaxRateOverride from "./components/TaxRateOverride.svelte";
	import PersonalInfo from "./components/PersonalInfo.svelte";
	import type { fillPdf, FormRow } from "./tobcalc-lib.js";
	import {
		setECBHostname,
		setJustETFHostname,
		setYahooFinanceQuery1Hostname,
	} from "./tobcalc-lib.js";
	import { runTests } from "./tests";
	import type { TaxFormData } from "./tobcalc-lib.js";
	import PdfDownload from "./components/PdfDownload.svelte";
	import Brokers from "./components/Brokers.svelte";
	import Settings from "./components/Settings.svelte";
	import PaymentInfo from "./components/PaymentInfo.svelte";

	declare const process: { env: { [key: string]: string } };

	const pdfWorker = new Worker("tobcalc-lib-pdf.js");

	let resolveFillPdfPromise: (result: string) => void;
	const workerFillPdf = (...params: Parameters<typeof fillPdf>): Promise<string> => {
		pdfWorker.postMessage(params);
		return new Promise(resolve => resolveFillPdfPromise = resolve);
	};
	pdfWorker.onmessage = event => {
		resolveFillPdfPromise(event.data);
	};

	setECBHostname(process.env.ECB_HOSTNAME);
	setJustETFHostname(process.env.JUSTETF_HOSTNAME);
	setYahooFinanceQuery1Hostname(process.env.YAHOO_FINANCE_QUERY1_HOSTNAME);

	let failedTestsError = "";
	runTests().then(result => {
		if(result !== null) {
			failedTestsError = result;
		}
	});

	let lang: string;
	let pdfBytes: Uint8Array;
	function loadPdf(lang: string) {
		fetch(`TOB-${lang}.pdf`).then(async response => {
			console.log(`Loaded ${lang} PDF`);
			pdfBytes = new Uint8Array(await response.arrayBuffer());
		});
	}
	$: lang = $lastSession.lang;
	$: loadPdf(lang);

	// Aggregate taxes per tax rate category and calculate total tax value
	let tax012FormRow: FormRow;
	let tax035FormRow: FormRow;
	let tax132FormRow: FormRow;
	let totalTaxValue: number = 0;
	function aggregateTaxes(totalTaxFormData: Map<number, TaxFormData>) {
		const emptyFormRow: FormRow = {
			quantity: 0,
			taxBase: 0,
			taxValue: 0,
		};
		tax012FormRow = Object.assign({}, emptyFormRow);
		tax035FormRow = Object.assign({}, emptyFormRow);
		tax132FormRow = Object.assign({}, emptyFormRow);
		totalTaxValue = 0;
		for(const [_, taxFormData] of totalTaxFormData) {
			for(const [taxRate, { quantity, taxBase, taxValue }] of taxFormData) {
				let aggregatedFormRow: FormRow;
				switch(taxRate) {
					case 0.0012:
						aggregatedFormRow = tax012FormRow;
						break;
					case 0.0035:
						aggregatedFormRow = tax035FormRow;
						break;
					default:
						aggregatedFormRow = tax132FormRow;
				}
				aggregatedFormRow.quantity += quantity;
				aggregatedFormRow.taxBase += taxBase;
				aggregatedFormRow.taxValue += taxValue;
				totalTaxValue += taxValue;
			}
		}
	}

	let pdfObjectUrl = "";
	let pdfError = "";
	async function setPdfUrl(
			personalInfo: SessionInfo,
			signatureFiles: File[],
			nationalRegistrationNumber: string,
	) {
		try {
			pdfObjectUrl = await workerFillPdf(pdfBytes, {
				start: personalInfo.start ? new Date(personalInfo.start) : new Date(),
				end: personalInfo.end ? new Date(personalInfo.end) : new Date(),
				nationalRegistrationNumber: nationalRegistrationNumber,
				fullName: personalInfo.fullName,
				addressLine1: personalInfo.addressLine1,
				addressLine2: personalInfo.addressLine2,
				addressLine3: personalInfo.addressLine3,
				tableATax012Quantity: tax012FormRow.quantity,
				tableATax035Quantity: tax035FormRow.quantity,
				tableATax132Quantity: tax132FormRow.quantity,
				tableATax012TaxBase: tax012FormRow.taxBase,
				tableATax035TaxBase: tax035FormRow.taxBase,
				tableATax132TaxBase: tax132FormRow.taxBase,
				tableATax012TaxValue: tax012FormRow.taxValue,
				tableATax035TaxValue: tax035FormRow.taxValue,
				tableATax132TaxValue: tax132FormRow.taxValue,
				tableATotalTaxValue: totalTaxValue,
				totalTaxValue: totalTaxValue,
				signaturePng: signatureFiles[0] ? new Uint8Array(await signatureFiles[0].arrayBuffer()) : undefined,
				signatureName: personalInfo.signatureName,
				signatureCapacity: personalInfo.signatureCapacity,
				location: personalInfo.location,
				date: personalInfo.date,
			});
		} catch(error) {
			pdfError = error.message;
		}
	}

	let previousTimeoutId: number;
	function delayedPdfUpdate(
			personalInfo: SessionInfo,
			signatureFiles: File[],
			nationalRegistrationNumber: string,
	) {
		if(previousTimeoutId !== undefined) {
			clearTimeout(previousTimeoutId);
		}
		previousTimeoutId = setTimeout(() => {
			setPdfUrl(personalInfo, signatureFiles, nationalRegistrationNumber);
		}, 1000);
	}

	$: {
		aggregateTaxes($totalTaxFormData);
		if(pdfBytes !== undefined) {
			delayedPdfUpdate(
					$lastSession,
					$signatureFiles,
					$nationalRegistrationNumber,
			);
		}
	}
</script>

{#if failedTestsError !== ""}
<h2>Error while performing checks: {failedTestsError}</h2>
{/if}

<div class="column">
	<PersonalInfo />
</div>

<div class="column">
	<TaxRateOverride />
	<Brokers />
</div>

<div class="column">
	<button on:click={() => $openPaymentInfo = true}>Payment Info</button>
	<PdfDownload objectUrl={pdfObjectUrl} error={pdfError} />
</div>

<Settings />
<PaymentInfo amount={totalTaxValue} />

<footer>
	<a on:click|preventDefault={() => $openSettings = true}>Open settings</a>
	<a href="https://github.com/samjmck/tobcalc">GitHub</a>
	<a href="https://samjmck.com">samjmck.com</a>
	<a href="/privacy-policy.txt">Privacy Policy</a>
</footer>

<style>
	div.column {
		padding-bottom: 10em;
		margin-right: 3em;
	}
	input {
		display: block;
		margin: 1em 0;
	}
	footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		text-align: center;
		background-color: white;
		padding: 1em;
	}
	footer a {
		margin: 0 1.5em;
	}
	:global(body) {
		margin-bottom: 2em;
	}
</style>
