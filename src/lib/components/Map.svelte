<script lang="ts">
    import {onMount} from 'svelte';
    import {SvelteSet} from 'svelte/reactivity';
    import type {Map as MapLibreMap, Marker} from 'maplibre-gl';

    import 'maplibre-gl/dist/maplibre-gl.css';
    import {eventColors} from "#lib/events/eventColors.ts";
    import type {BundeswehrEvent} from "#lib/events/bundeswehrEvent.js";

    let {events}: { events: BundeswehrEvent[] } = $props();

    let mapElement: HTMLDivElement;

    const center: [number, number] = [10.447694, 51.163361];

    const hiddenTypes = new SvelteSet<string>();
    let markers = $state.raw<{ type: string; marker: Marker }[]>([]);

    function toggleType(type: string) {
        if (hiddenTypes.has(type)) {
            hiddenTypes.delete(type);
        } else {
            hiddenTypes.add(type);
        }
    }

    $effect(() => {
        for (const {type, marker} of markers) {
            const hidden = hiddenTypes.has(type);

            marker.getElement().style.display = hidden ? 'none' : '';

            if (hidden && marker.getPopup()?.isOpen()) {
                marker.togglePopup();
            }
        }
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
                    const created: { type: string; marker: Marker }[] = [];

                    for (const bundeswehrEvent of events) {
                        const type = bundeswehrEvent['Art der Veranstaltung'];
                        const color = eventColors[type];

                        const popup = new maplibre.Popup({offset: 25}).setText(`${type} in ${bundeswehrEvent['Ort']}`);

                        const marker = new maplibre.Marker({color})
                            .setLngLat([bundeswehrEvent.lng, bundeswehrEvent.lat] as [number, number])
                            .setPopup(popup)
                            .addTo(map!);

                        created.push({type, marker});
                    }

                    markers = created;
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

<div class="relative gap-1 flex flex-col md:grid grid-cols-7">
    <div class="h-[500px] w-full col-span-5 overflow-hidden rounded shadow" bind:this={mapElement}></div>

    <div class="bg-surface rounded w-full col-span-2 p-3 shadow">
        <strong>Legende</strong>
        <ul class="mt-1 flex  gap-1 not-md:flex-wrap md:flex-col">
            {#each Object.entries(eventColors) as [type, color]}
                {@const hidden = hiddenTypes.has(type)}
                <li>
                    <button
                            type="button"
                            class="bg-surface-raised text-xs shadow p-2 rounded flex items-center gap-1.5 cursor-pointer transition-opacity md:w-full"
                            class:opacity-40={hidden}
                            class:line-through={hidden}
                            aria-pressed={!hidden}
                            onclick={() => toggleType(type)}
                    >
                        <span class="inline-block size-3 rounded-full aspect-square" style="background: {color}"></span>
                        <span class="text-left">{type}</span>
                    </button>
                </li>
            {/each}
        </ul>
    </div>
</div>