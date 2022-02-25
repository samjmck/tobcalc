<script lang="ts">
    import { adapterNumber } from "./stores";

    export let name: string;
    export let adapter: (data: Blob) => Promise<any[]>;

    const currentAdapterNumber = adapterNumber;
    adapterNumber.update(n => n + 1);
</script>

<label for={`adapter_${currentAdapterNumber}`}>Choose {name} csv</label>
<input name={`adapter_${currentAdapterNumber}`} type="file" />
