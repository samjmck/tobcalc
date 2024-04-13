<script>
  import { openSettings } from "../stores";
</script>

<header>
  <div class="content">
    <div>
      <h1 class="header-brand">TOBCALC</h1>
    </div>
  </div>
</header>

<style>
  header {
    padding: 10px;
    background-color: var(--header-color);
    color: white;
  }

  header .content {
    display: flex;
    flex-direction: row;
    max-width: var(--break-lg);
    margin: auto auto;
  }

  .header-brand {
    color: white;
    font-weight: 600;
    font-size: 1.3em;
    margin: 0;
  }

  .action-menu {
    margin-left: auto;
  }

</style>
