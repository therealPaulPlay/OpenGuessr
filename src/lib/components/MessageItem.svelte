<script>
    let { message } = $props();
</script>

<div class="message">
    <!-- TODO, show actual message, created at, the alias, on hover or click show reply + react + forward options -->
</div>

<style>
    .message {
        border-radius: var(--content-margin);
        background-color: var(--box-color);
        box-shadow: var(--bulb-shadow);
        padding: var(--content-margin);
        padding-inline: var(--panel-margin);
    }
</style>