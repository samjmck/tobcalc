<script>
  export let style = '';

  let btn_bg_color = '';
  let btn_bg_color_hover = '';
  let btn_color = '#212225'
  switch (style) {
    case 'primary':
      btn_bg_color = 'var(--primary-color)';
      btn_bg_color_hover = 'var(--primary-color-hover)';
      btn_color = 'white';
      break;
    case 'secondary':
      btn_bg_color = 'var(--secondary-color)';
      btn_bg_color_hover = 'var(--secondary-color-hover)';
      break;
    case 'danger':
      btn_bg_color = '#dc3333';
      btn_bg_color_hover = '#bd2b2b';
      btn_color = 'white';
      break;
  }

</script>

<button style="--btn-bg-color:{btn_bg_color};--btn-bg-color-hover:{btn_bg_color_hover};--btn-color:{btn_color}" {...$$restProps} on:click>
  <slot />
</button>

<style>
  button {
    background-color: var(--btn-bg-color);
    font-size: 1em;
    color: var(--btn-color);
    padding: 8px 13px;
    border: none;
    border-radius: 5px;
  }

  button:hover {
    background-color: var(--btn-bg-color-hover);
  }
</style>