import svelte from 'rollup-plugin-svelte';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import sveltePreprocess from 'svelte-preprocess';
import typescript from '@rollup/plugin-typescript';
import css from 'rollup-plugin-css-only';
import replace from '@rollup/plugin-replace';

const production = !process.env.ROLLUP_WATCH;
// By default, use the proxy hostnames as specified in the environment variables.
const proxy_hostnames = {
	'ecb': process.env.ECB_HOSTNAME,
	'justetf': process.env.JUSTETF_HOSTNAME,
	'yahoo_finance_query1': process.env.YAHOO_FINANCE_QUERY1_HOSTNAME
};
// When developing, use the proxy hostnames as configured in the Caddyfile if the environment variables are not set.
if (!production) {
	const port = 8081;
	proxy_hostnames["ecb"] = proxy_hostnames["ecb"] || `${localhost(port)}/ecb`;
	proxy_hostnames["justetf"] = proxy_hostnames["justetf"] || `${localhost(port)}/justetf`;
	proxy_hostnames["yahoo_finance_query1"] = proxy_hostnames["yahoo_finance_query1"] || `${localhost(port)}/yahoo_finance_query1`;
}
// Parameters passed to livereload script.
const livereload_params = new URLSearchParams();
livereload_params.append("snipver", 1);
if (process.env.CODESPACES) {
	livereload_params.append("host", localhost(35729));
	livereload_params.append("port", 443);
}

// Get the localhost address for the given port.
// For local development, this is just 'localhost:port'.
// For remote development on github codespaces, this becomes the forwarded port address.
function localhost(port) {
	if (process.env.CODESPACES) {
		return `${process.env.CODESPACE_NAME}-${port}.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`;
	} else {
		return `localhost:${port}`;
	}
}

function serve() {
	let server;

	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: 'src/main.ts',
	output: {
		sourcemap: true,
		format: 'esm',
		name: 'app',
		file: 'public/app.js'
	},
	external: ['./tobcalc-lib.js', '../tobcalc-lib.js'],
	plugins: [
		replace({
			values: {
				"process.env.ECB_HOSTNAME": `"${proxy_hostnames['ecb']}"`,
				"process.env.JUSTETF_HOSTNAME": `"${proxy_hostnames['justetf']}"`,
				"process.env.YAHOO_FINANCE_QUERY1_HOSTNAME": `"${proxy_hostnames['yahoo_finance_query1']}"`,
			},
		}),
		svelte({
			preprocess: sveltePreprocess({ sourceMap: !production }),
			compilerOptions: {
				// enable run-time checks when not in production
				dev: !production
			}
		}),
		// we'll extract any component CSS out into
		// a separate file - better for performance
		css({ output: 'app.css' }),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		typescript({
			sourceMap: !production,
			inlineSources: !production
		}),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload({
			watch: `${__dirname}/public`,
			clientUrl: `livereload.js?${livereload_params.toString()}`,
		}),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
