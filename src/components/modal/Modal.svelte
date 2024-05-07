<script lang="ts">
  import { openPaymentInfo } from "../../stores";

  export let open = false;
  export let force = false;

  function handleClose() {
    if (!force) {
      dialog.close();
      open = false
    }
  }

  // Dom element
  let dialog: HTMLDialogElement;

  $: if(dialog) {
    if(open) {
      dialog.showModal();
    } else {
      dialog.close();
    }
  }

  // $: console.log('open: ' + open + ' open store: ' + $openPaymentInfo)
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
<dialog bind:this={dialog} on:click={handleClose} >
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div on:click|stopPropagation={()=>{}}>
    <div class="head">
      <slot name="head">Header</slot>
    </div>
    <div>
      <slot>
        Content
      </slot>
    </div>

    {#if $$slots.footer}
      <div class="footer">
        <slot name="footer">Footer</slot>
      </div>
    {/if}
  </div>
</dialog>

<style>
  dialog::backdrop {
    background-color: rgba(185, 185, 185, 0.479);
  }

  dialog {
    color: rgb(48, 48, 48);
    padding: 0;
    margin: 0;
    position: fixed;
    z-index: 1;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border: none;
    outline: none;
    box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.24);
    border-radius: 5px;
    border: 1px solid rgb(134, 134, 134);
  }

  dialog > div > div {
    padding: 1rem 1.5rem;
  }

  .head {
    border-bottom: 1px solid lightgray;
    font-size: 1.5em;
  }

  .footer {
    border-top: 1px solid lightgray;
  }
</style>
