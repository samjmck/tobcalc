import App from './App.svelte';
import { setECBHostname, setInvestingComHostname } from "./tobcalc-lib.js";

setECBHostname(process.env.ECB_HOSTNAME);
setInvestingComHostname(process.env.INVESTING_COM_HOSTNAME)

const app = new App({
	target: document.body,
	props: {
		name: 'world'
	}
});


export default app;
