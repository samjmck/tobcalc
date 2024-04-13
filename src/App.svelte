<script lang="ts">
	import { openSettings, openPaymentInfo, signatureFiles, totalTaxFormData, lastSession, nationalRegistrationNumber, type SessionInfo } from "./stores";
	import TaxRateOverride from "./components/TaxRateOverride.svelte";
	import PersonalInfo from "./components/PersonalInfo.svelte";
	import {
		setECBUrlStart,
		setJustETFUrlStart,
		setYahooFinanceQuery1UrlStart,
	} from "@samjmck/tobcalc-lib";
	import { runTests } from "./tests";
	import type { TaxFormData, fillPdf, FormRow } from "@samjmck/tobcalc-lib";
	import PdfDownload from "./components/PdfDownload.svelte";
	import Brokers from "./components/Brokers.svelte";
	import Settings from "./components/modal/Settings.svelte";
	import PaymentInfo from "./components/modal/PaymentInfo.svelte";
	import PdfWorker from "./pdf-worker?worker";
	import Header from "./components/Header.svelte";
	import Button from "./components/ui/Button.svelte";

	const pdfWorker = new PdfWorker();

	let resolveFillPdfPromise: (result: string) => void;
	const workerFillPdf = (...params: Parameters<typeof fillPdf>): Promise<string> => {
		pdfWorker.postMessage(params);
		return new Promise(resolve => resolveFillPdfPromise = resolve);
	};
	pdfWorker.onmessage = event => {
		resolveFillPdfPromise(event.data);
	};

	setECBUrlStart(import.meta.env.VITE_ECB_URL_START);
	setJustETFUrlStart(import.meta.env.VITE_JUSTETF_URL_START);
	setYahooFinanceQuery1UrlStart(import.meta.env.VITE_YAHOO_FINANCE_QUERY1_URL_START);

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
	let totalTaxValue = 0;
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
			const formRow012 = <FormRow> taxFormData['012'];
			const formRow035 = <FormRow> taxFormData['035'];
			const formRow132 = <FormRow> taxFormData['132'];
			const formRowTotalTax = taxFormData['total'];

			tax012FormRow.quantity += formRow012.quantity;
			tax012FormRow.taxBase += formRow012.taxBase;
			tax012FormRow.taxValue += formRow012.taxValue;

			tax035FormRow.quantity += formRow035.quantity;
			tax035FormRow.taxBase += formRow035.taxBase;
			tax035FormRow.taxValue += formRow035.taxValue;

			tax132FormRow.quantity += formRow132.quantity;
			tax132FormRow.taxBase += formRow132.taxBase;
			tax132FormRow.taxValue += formRow132.taxValue;

			totalTaxValue += formRowTotalTax;
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
				signaturePng: <Uint8Array> (signatureFiles[0] ? new Uint8Array(await signatureFiles[0].arrayBuffer()) : undefined),
				signatureName: personalInfo.signatureName,
				signatureCapacity: personalInfo.signatureCapacity,
				location: personalInfo.location,
				date: personalInfo.date,
			});
		} catch(error) {
			pdfError = "Error while generating pdf";
			console.error(error);
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

<Header />
<div class="column">
	<PersonalInfo />
</div>

<div class="column">
	<TaxRateOverride />
	<Brokers />
</div>

<div class="column">
	<Button style="primary" on:click={() => $openPaymentInfo = true}>Payment Info</Button>
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
