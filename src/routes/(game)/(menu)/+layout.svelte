<script>
    let { children } = $props();
</script>

<main class="menu">
    {@render children?.()}
</main>

<style>
    .menu {
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background: var(--panel-color);
        z-index: 90;
        backdrop-filter: blur(10px);
    }
</style>