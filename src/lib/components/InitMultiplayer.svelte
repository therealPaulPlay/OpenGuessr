<script>
  import { onMount } from "svelte";
  import { getPeer } from "$lib/logic/multiplayerLogic";

  onMount(async () => {
    try {
      await getPeer();
    } catch (error) {
      console.error("Could not inizialize Peer in InitMultiplayer Component:", error);
    }
  });
</script>

<!-- Just to mount this -->
<div style="display: none;"></div>