<script lang="ts">
    import Map from "#lib/components/Map.svelte";

    export const { data } = $props();
</script>
<h1 class="font-mono bg-green-800">bundeswehrwatch.de</h1>
<Map events={data.current_events}/>
