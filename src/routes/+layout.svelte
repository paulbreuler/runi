<script>
  import '../app.css';
</script>

<main>
  <slot />
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family:
      system-ui,
      -apple-system,
      sans-serif;
  }
</style>
