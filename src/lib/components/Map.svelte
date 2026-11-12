<script lang="ts">
    import { onMount } from 'svelte';
    import type { Map as MapLibreMap } from 'maplibre-gl';

    import 'maplibre-gl/dist/maplibre-gl.css';
    let { events } = $props();

    let mapElement: HTMLDivElement;

    const center: [number, number] = [10.447694, 51.163361];

    const palette = ['#2563eb', '#dc2626', '#16a34a', '#f59e0b', '#9333ea', '#0891b2'];

    // One color per distinct event type
    const legendItems = $derived.by(() => {
        const types = [...new Set(events.map((e: any) => e['Art der Veranstaltung']))];
        return types.map((type, i) => ({
            label: type as string,
            color: palette[i % palette.length]
        }));
    });

    onMount(() => {
        let map: MapLibreMap | undefined;
        let cancelled = false;

        async function initializeMap() {
            try {
                const [maplibre, workerModule] = await Promise.all([
                    import('maplibre-gl'),
                    import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url')
                ]);

                if (cancelled) return;

                maplibre.setWorkerUrl(workerModule.default);

                map = new maplibre.Map({
                    container: mapElement,
                    style: 'https://tiles.openfreemap.org/styles/positron',
                    center,
                    zoom: 5
                });

                map.on('load', () => {
                    for (const event of events) {
                        const type = event['Art der Veranstaltung'];
                        const color =
                            legendItems.find((item) => item.label === type)?.color ?? '#2563eb';

                        const popup = new maplibre.Popup({ offset: 25 }).setText(type);

                        new maplibre.Marker({ color })
                            .setLngLat([event['lng'], event['lat']] as [number, number])
                            .setPopup(popup)
                            .addTo(map!);
                    }
                });
            } catch (error) {
                console.error('Could not initialize map:', error);
            }
        }

        void initializeMap();

        return () => {
            cancelled = true;
            map?.remove();
        };
    });
</script>

<div class="map-wrapper">
    <div class="map-container" bind:this={mapElement}></div>

    <div class="legend">
        <strong>Legend</strong>
        <ul>
            {#each legendItems as item}
                <li>
                    <span class="swatch" style="background: {item.color}"></span>
                    {item.label}
                </li>
            {/each}
        </ul>
    </div>
</div>

<style>
    .map-wrapper {
        position: relative;
    }

    .map-container {
        width: 100%;
        height: 500px;
        border-radius: 12px;
        overflow: hidden;
    }

    .legend {
        position: absolute;
        bottom: 16px;
        left: 16px;
        z-index: 1;
        background: white;
        padding: 8px 12px;
        border-radius: 8px;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
        font-size: 0.85rem;
        max-height: 200px;
        overflow-y: auto;
    }

    .legend ul {
        list-style: none;
        margin: 4px 0 0;
        padding: 0;
    }

    .legend li {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 2px 0;
    }

    .swatch {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        display: inline-block;
    }
</style>