<script>
  import { openSettings } from "../stores";
  import Settings from "./modal/Settings.svelte";
  import Ic_setting from "./icon/Setting.svelte";
</script>

<Settings />
<header>
  <div class="content">
    <div>
      <h1 class="header-brand">TOBCALC</h1>
    </div>
    <div class="action-menu">
      <button on:click={() => $openSettings = true}>
        <Ic_setting color="white" />
      </button>
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
