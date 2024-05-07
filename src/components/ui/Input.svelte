<script lang="ts">
  export let value:string|number;
</script>

<input {...$$props} bind:value on:input />

<style>
  input {
    background-color: rgb(255, 255, 255);
    border-radius: 3px;
    border-bottom: 1px solid #2b5494;
    padding: 0.4rem;
  }

  input:focus, input:hover {
    outline-color: #96abcc;
    outline-style: solid;
    outline-width: 1px;
  }
</style>