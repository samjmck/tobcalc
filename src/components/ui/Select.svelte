<script lang="ts">
  export let value: any;

  let select_bg_color = '#f0f0f0';
  let select_color = '#212225'
</script>

<select style="--select-bg-color:{select_bg_color};--select-color:{select_color}" {...$$props} bind:value on:change >
  <slot />
</select>

<style>
  select {
    background-color: var(--select-bg-color);
    border: 5px solid #000;
    font-size: 1em;
    color: var(--select-color);
    padding: 8px 13px;
    border: none;
    border-radius: 5px;
  }

  select :global(option:first-child:hover) {
    background-color: green;

  }
</style>