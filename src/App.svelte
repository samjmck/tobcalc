<script lang="ts">
	import { openPaymentInfo, signatureFiles, totalTaxFormData, lastSession, nationalRegistrationNumber, type SessionInfo } from "./stores";
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

<h2>We are aware of an issue with the ECB exchange rates not working. See <a href="https://github.com/samjmck/tobcalc-lib/issues/6">this</a> issue on GitHub for more details. Transactions with foreign currencies may not work, while transactions in euros should still work.</h2>

{#if failedTestsError !== ""}
<h2>Error while performing checks: {failedTestsError}</h2>
{/if}

<Header />

<main>
	<section class="content mt-3">
		<Brokers />
	</section>

	<section class="taxe-override">
		<div class="content">
			<TaxRateOverride />
		</div>
	</section>

	<section class="content form">
		<div>
			<PersonalInfo />
		</div>
		<div>
			<Button style="primary" on:click={() => $openPaymentInfo = true}>Payment Info</Button>
			<PdfDownload objectUrl={pdfObjectUrl} error={pdfError} />
		</div>
	</section>
</main>

<!-- Modals -->
<PaymentInfo amount={totalTaxValue} />

<footer>
	<a href="https://github.com/samjmck/tobcalc">GitHub</a>
	<a href="https://samjmck.com">samjmck.com</a>
	<a href="/privacy-policy.txt">Privacy Policy</a>
</footer>

<style>
	main > section {
		padding: 1rem;
	}

	footer {
		display: flex;
		flex-direction: row;
		justify-content: center;
		gap: 5%;
		margin-top: 1rem;
		background-color: rgb(238, 238, 238);
		border-top: 1px solid #bebebe;
		padding: 1em;
	}

	:global(body) {
		background-color: var(--main-bg-color);
	}

	.content {
		max-width: var(--break-lg);
		margin-left: auto;
		margin-right: auto;
	}

	.taxe-override {
		margin-top: 1rem;
		margin-bottom: 2rem;
 		background-color: #fffcda;
	}

	.form>*:nth-child(2) {
		margin-top: 1rem;
	}

	@media only screen and (min-width: 1024px) {
		.form>*:nth-child(2) {
			margin-top: 0;
		}
		.form {
			margin-top: 0;
			display: flex;
			justify-content: space-between;
			flex-direction: row;
			align-items: start;
		}
	}

</style>
