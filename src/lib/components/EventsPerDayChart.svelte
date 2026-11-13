<script lang="ts">
    import {eventColors} from '#lib/events/eventColors.ts';

    type DayEntry = {
        day: Date | string;
        veranstaltungen: Record<string, number>;
    };

    let {data, height = 320}: { data: DayEntry[]; height?: number } = $props();

    const margin = {top: 12, right: 12, bottom: 32, left: 36};
    const fallbackColor = '#9ca3af';

    // The pipeline produces UTC midnight, so format in UTC to avoid off-by-one days
    const shortDate = new Intl.DateTimeFormat('de-DE', {day: '2-digit', timeZone: 'UTC'});
    const longDate = new Intl.DateTimeFormat('de-DE', {
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC'
    });

    let width = $state(0);
    let hovered = $state<number | null>(null);

    const days = $derived(data.map((d) => ({date: new Date(d.day), counts: d.veranstaltungen})));

    // Known types first (in legend order), unknown ones (e.g. "Unbekannt") afterwards
    const types = $derived.by(() => {
        const present = new Set(data.flatMap((d) => Object.keys(d.veranstaltungen)));
        const known = Object.keys(eventColors).filter((t) => present.has(t));
        const unknown = [...present].filter((t) => !(t in eventColors)).sort();
        return [...known, ...unknown];
    });

    const colorOf = (type: string): string =>
        (eventColors as Record<string, string>)[type] ?? fallbackColor;

    const innerWidth = $derived(Math.max(0, width - margin.left - margin.right));
    const innerHeight = $derived(height - margin.top - margin.bottom);

    const yTicks = $derived.by(() => {
        const max = Math.max(
            1,
            ...days.map((d) => Object.values(d.counts).reduce((a, b) => a + b, 0))
        );
        const rough = max / 5;
        const pow = 10 ** Math.floor(Math.log10(rough));
        const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough)!;
        const top = Math.ceil(max / step) * step;

        const ticks: number[] = [];
        for (let v = 0; v <= top; v += step) ticks.push(v);
        return ticks;
    });

    const yMax = $derived(yTicks[yTicks.length - 1]);
    const y = (value: number) => innerHeight - (value / yMax) * innerHeight;

    const band = $derived(days.length ? innerWidth / days.length : 0);
    const barWidth = $derived(band * 0.7);

    // Only label every n-th day so the labels don't overlap
    const labelEvery = $derived(Math.max(1, Math.ceil(days.length / Math.max(1, Math.floor(innerWidth / 48)))));

    const bars = $derived(
        days.map((d, i) => {
            let acc = 0;
            const segments = types.flatMap((type) => {
                const value = d.counts[type] ?? 0;
                if (!value) return [];
                const from = acc;
                acc += value;
                return [{type, value, y: y(acc), height: y(from) - y(acc)}];
            });
            return {x: i * band + (band - barWidth) / 2, date: d.date, total: acc, segments};
        })
    );

    const hoveredBar = $derived(hovered === null ? null : bars[hovered]);
</script>

<div class="bg-surface rounded shadow p-3">
    <strong>Veranstaltungen der Nächsten Tage</strong>

    <div class="relative mt-2" bind:clientWidth={width}>
        {#if days.length === 0}
            <p class="text-sm opacity-60">Keine Veranstaltungen im Zeitraum.</p>
        {:else}
            <svg {width} {height} role="img" aria-label="Gestapeltes Balkendiagramm: Veranstaltungen pro Tag nach Art">
                <g transform="translate({margin.left},{margin.top})">
                    {#each yTicks as tick (tick)}
                        <line x1="0" x2={innerWidth} y1={y(tick)} y2={y(tick)} stroke="currentColor" opacity="0.12"/>
                        <text x="-8" y={y(tick)} dy="0.32em" text-anchor="end" class="fill-current text-[10px] opacity-60">
                            {tick}
                        </text>
                    {/each}

                    {#each bars as bar, i (i)}
                        <g opacity={hovered === null || hovered === i ? 1 : 0.5}>
                            {#each bar.segments as seg (seg.type)}
                                <rect
                                        x={bar.x}
                                        y={seg.y}
                                        width={barWidth}
                                        height={seg.height}
                                        fill={colorOf(seg.type)}
                                />
                            {/each}
                        </g>

                        {#if i % labelEvery === 0}
                            <text
                                    x={bar.x + barWidth / 2}
                                    y={innerHeight + 16}
                                    text-anchor="middle"
                                    class="fill-current text-xs opacity-60"
                            >
                                {shortDate.format(bar.date)}.
                            </text>
                        {/if}

                        <!-- Invisible full-height hit area for hovering -->
                        <rect
                                x={i * band}
                                y="0"
                                width={band}
                                height={innerHeight}
                                fill="transparent"
                                role="presentation"
                                onpointerenter={() => (hovered = i)}
                                onpointerleave={() => (hovered = null)}
                        />
                    {/each}
                </g>
            </svg>

            {#if hoveredBar && hovered !== null}
                <div
                        class="bg-surface-raised pointer-events-none absolute top-0 z-10 rounded p-2 text-xs shadow whitespace-nowrap"
                        style="left: {margin.left + hoveredBar.x + barWidth / 2}px; transform: translateX({hovered > days.length / 2 ? 'calc(-100% - 8px)' : '8px'});"
                >
                    <div class="font-semibold">{longDate.format(hoveredBar.date)}</div>
                    <ul class="mt-1 flex flex-col gap-0.5">
                        {#each [...hoveredBar.segments].reverse() as seg (seg.type)}
                            <li class="flex items-center gap-1.5">
                                <span class="inline-block size-2.5 rounded-full" style="background: {colorOf(seg.type)}"></span>
                                <span>{seg.type}</span>
                                <span class="ml-auto pl-3 font-medium">{seg.value}</span>
                            </li>
                        {/each}
                    </ul>
                    <div class="mt-1 border-t border-current/20 pt-1 font-semibold">Gesamt: {hoveredBar.total}</div>
                </div>
            {/if}
        {/if}
    </div>

    <ul class="mt-3 flex flex-wrap gap-1">
        {#each types as type (type)}
            <li class="bg-surface-raised text-xs shadow p-2 rounded flex items-center gap-1.5">
                <span class="inline-block size-3 rounded-full" style="background: {colorOf(type)}"></span>
                {type}
            </li>
        {/each}
    </ul>
</div>