<!-- this component solely authenticates the user -->
<script>
    import { checkAuthenticationStatus } from "$lib/logic/accountLogic";
    import { onMount } from "svelte";

    onMount(() => {
        checkAuthenticationStatus();
    })
</script>