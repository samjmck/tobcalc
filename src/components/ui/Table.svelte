<script>

</script>

<table {...$$restProps}>
  <thead>
    <tr>
      <slot name="head" />
    </tr>
  </thead>
  <tbody>
    <slot></slot>
  </tbody>
</table>

<style>
  table {
    background-color: white;
    border-collapse: collapse;
    width: 100%;
  }

  table :global(td), table :global(th) {
    border-bottom: solid 1px rgb(219, 219, 219);
    padding: 0.6rem;
  }

  table thead {
    text-align: left;
    background-color: var(--header-color);
    color: white;
  }
</style>