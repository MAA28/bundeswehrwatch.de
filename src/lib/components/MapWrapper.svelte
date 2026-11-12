<script lang="ts">
    import { onMount } from 'svelte';
    import type { Component } from 'svelte';

    let MapComponent: Component | null = $state(null);
    let error: string | null = $state(null);
    let loading = $state(true);

    onMount(() => {
        const loadMap = async () => {
            try {
                console.log('Starting Sveaflet component import...');

                const module = await import('./Map.svelte');

                console.log('Sveaflet component imported:', module);

                MapComponent = module.default;
            } catch (err) {
                console.error('Failed to load map:', err);
                error = err instanceof Error ? err.message : String(err);
            } finally {
                loading = false;
            }
        };

        void loadMap();
    });
</script>

{#if loading}
    <p>Loading map...</p>
{:else if error}
    <p>Map error: {error}</p>
{:else if MapComponent}
    <MapComponent />
{/if}