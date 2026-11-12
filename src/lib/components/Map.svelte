<script lang="ts">
    import { onMount } from 'svelte';
    import type { Map as MapLibreMap } from 'maplibre-gl';

    import 'maplibre-gl/dist/maplibre-gl.css';

    let mapElement: HTMLDivElement;

    const center: [number, number] = [10.447694, 51.163361];

    const locations = [
        {
            name: 'Brandenburg Gate',
            coordinates: [13.3777, 52.5163] as [number, number]
        },
        {
            name: 'Berlin Cathedral',
            coordinates: [13.4011, 52.5192] as [number, number]
        },
        {
            name: 'Alexanderplatz',
            coordinates: [13.4132, 52.5219] as [number, number]
        }
    ];


    onMount(() => {
        let map: MapLibreMap | undefined;
        let cancelled = false;

        async function initializeMap() {
            try {
                const [
                    maplibre,
                    workerModule
                ] = await Promise.all([
                    import('maplibre-gl'),
                    import('maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url')
                ]);

                if (cancelled) return;

                maplibre.setWorkerUrl(workerModule.default);

                map = new maplibre.Map({
                    container: mapElement,

                    // OpenFreeMap Positron
                    style: 'https://tiles.openfreemap.org/styles/positron',

                    // [longitude, latitude]
                    center,

                    zoom: 5,
                });

                map.on('load', () => {
                    for (const location of locations) {
                        const popup = new maplibre.Popup({
                            offset: 25
                        }).setText(location.name);

                        new maplibre.Marker({
                            color: '#2563eb'
                        })
                            .setLngLat(location.coordinates)
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

<div class="map-container" bind:this={mapElement}></div>

<style>
    .map-container {
        width: 100%;
        height: 500px;
        border-radius: 12px;
        overflow: hidden;
    }
</style>