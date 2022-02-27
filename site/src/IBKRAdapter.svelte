<script lang="ts">
    import { Service } from "./service";

    export let id: number;
</script>

<label for={`adapter_${id}`}>Choose {Service.InteractiveBrokers} csv</label>
<input name={`adapter_${id}`} type="file" />
