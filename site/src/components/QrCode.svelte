<script lang="ts">
	import QrCode from "../qrcodegen";

	// Error Correction Level map
	const ECL = {
		"L": QrCode.Ecc.LOW,
		"M": QrCode.Ecc.MEDIUM,
		"Q": QrCode.Ecc.QUARTILE,
		"H": QrCode.Ecc.HIGH
	};
	export let value = "";
	export let ecl = "M";
	export let extent = 256;
	export let border = 8;
	export let label = "";
	let canvas: HTMLCanvasElement;
	let qr: QrCode;

	// Draws the QR Code on a canvas. The canvas dimensions are set to match
	// the QR Code size (integer depending on the length of the value to encode).
	// The canvas is rescaled to match the 'extent' property using CSS style
	// properties.
	function drawCanvas(qr: QrCode, canvas: HTMLCanvasElement) {
		if (!canvas)
			return;

		canvas.width = qr.size;
		canvas.height = qr.size;
		let ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
		// Clear canvas
		ctx.clearRect(0, 0, qr.size, qr.size);
		// Draw white and black modules
		for (let y = 0; y < qr.size; y++) {
			for (let x = 0; x < qr.size; x++) {
				ctx.fillStyle = qr.getModule(x, y) ? "#000000" : "#ffffff";
				ctx.fillRect(x, y, 1, 1);
			}
		}
	}

	$: {
		qr = QrCode.encodeText(value, ECL[ecl]);
		drawCanvas(qr, canvas);
	}
</script>

<div>
	<canvas style:width="{extent}px" style:height="{extent}px" style:border-width="{border}px" bind:this={canvas}></canvas>
	<p>{label}</p>
</div>

<style>
	div {
		display: block;
	}
	canvas {
		display: block;
		border-color: #dddddd;
		border-style: solid;
		image-rendering: pixelated;
	}
	p {
		text-align: center;
	}
</style>