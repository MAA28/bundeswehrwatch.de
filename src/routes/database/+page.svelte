<script lang="ts">
    import {SvelteSet} from 'svelte/reactivity';
    import {eventColors} from '#lib/events/eventColors.ts';
    import type {BundeswehrEvent} from '#lib/events/bundeswehrEvent.js';

    let {data}: { data: { events: BundeswehrEvent[] } } = $props();

    // Adjust these if your fields are named differently
    const FIELDS = {
        type: 'Art der Veranstaltung',
        from: 'Zeitraum von',
        to: 'Zeitraum bis',
        place: 'Ort',
        plz: 'PLZ',
        state: 'Bundesland',
        source: 'Quelle'
    } as const;

    const text = (e: BundeswehrEvent, key: string): string =>
        String((e as Record<string, unknown>)[key] ?? '').trim();

    // dd.mm.yyyy -> yyyy-mm-dd (sortable and comparable as a string)
    function toIso(value: string): string | null {
        const m = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
    }

    const rows = $derived(
        data.events.map((e) => {
            const start = toIso(text(e, FIELDS.from));
            const end = toIso(text(e, FIELDS.to)) ?? start;
            return {
                event: e,
                type: text(e, FIELDS.type),
                place: text(e, FIELDS.place),
                plz: text(e, FIELDS.plz),
                state: text(e, FIELDS.state),
                source: text(e, FIELDS.source),
                start,
                end
            };
        })
    );

    const unique = (values: string[]) =>
        [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, 'de'));

    const stateOptions = $derived(unique(rows.map((r) => r.state)));
    const sourceOptions = $derived(unique(rows.map((r) => r.source)));
    const typeOptions = $derived(unique(rows.map((r) => r.type)));

    // Filter state
    let regionMode = $state<'plz' | 'state'>('state');
    let plz = $state('');
    let state = $state('');
    let from = $state('');
    let to = $state('');
    let source = $state('');
    const selectedTypes = new SvelteSet<string>();

    const filtered = $derived(
        rows
            .filter((r) => {
                if (regionMode === 'plz' && plz.trim() && !r.plz.startsWith(plz.trim())) return false;
                if (regionMode === 'state' && state && r.state !== state) return false;

                // Events overlapping the selected range
                if (from && (!r.end || r.end < from)) return false;
                if (to && (!r.start || r.start > to)) return false;

                if (selectedTypes.size > 0 && !selectedTypes.has(r.type)) return false;
                if (source && r.source !== source) return false;
                return true;
            })
            .sort((a, b) => (a.start ?? '9999').localeCompare(b.start ?? '9999'))
    );

    const hasFilters = $derived(
        Boolean(plz.trim() || state || from || to || source || selectedTypes.size)
    );

    function toggleType(type: string) {
        if (selectedTypes.has(type)) selectedTypes.delete(type);
        else selectedTypes.add(type);
    }

    function reset() {
        plz = '';
        state = '';
        from = '';
        to = '';
        source = '';
        selectedTypes.clear();
    }

    const dateFormat = new Intl.DateTimeFormat('de-DE', {timeZone: 'UTC'});
    const formatIso = (iso: string | null) => (iso ? dateFormat.format(new Date(iso)) : '–');

    const field = 'bg-surface-raised rounded shadow p-2 text-sm w-full';
    const label = 'flex flex-col gap-1 text-xs font-semibold';
</script>

<div class="flex flex-col gap-3">
    <section class="bg-surface rounded shadow p-3 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Region -->
        <fieldset class="flex flex-col gap-2 min-w-0">
            <legend class="text-xs font-semibold mb-1">Region</legend>

            <div class="flex gap-1" role="group" aria-label="Regionsfilter">
                {#each [['state', 'Bundesland'], ['plz', 'PLZ']] as [mode, text] (mode)}
                    <button
                            type="button"
                            class="bg-surface-raised text-xs shadow px-2 py-1 rounded cursor-pointer transition-opacity"
                            class:opacity-40={regionMode !== mode}
                            aria-pressed={regionMode === mode}
                            onclick={() => (regionMode = mode as 'plz' | 'state')}
                    >
                        {text}
                    </button>
                {/each}
            </div>

            {#if regionMode === 'state'}
                <select class={field} bind:value={state} aria-label="Bundesland">
                    <option value="">Alle Bundesländer</option>
                    {#each stateOptions as option (option)}
                        <option value={option}>{option}</option>
                    {/each}
                </select>
            {:else}
                <input
                        class={field}
                        type="text"
                        inputmode="numeric"
                        maxlength="5"
                        placeholder="PLZ oder Anfang, z. B. 37"
                        aria-label="Postleitzahl"
                        bind:value={plz}
                />
            {/if}
        </fieldset>

        <!-- Zeitraum -->
        <fieldset class="grid grid-cols-2 gap-2 min-w-0">
            <legend class="text-xs font-semibold mb-1">Zeitraum</legend>
            <label class={label}>
                Von
                <input class={field} type="date" bind:value={from} max={to || undefined}/>
            </label>
            <label class={label}>
                Bis
                <input class={field} type="date" bind:value={to} min={from || undefined}/>
            </label>
        </fieldset>

        <!-- Quelle -->
        <label class="{label} min-w-0">
            Quelle
            <select class={field} bind:value={source}>
                <option value="">Alle Quellen</option>
                {#each sourceOptions as option (option)}
                    <option value={option}>{option}</option>
                {/each}
            </select>
        </label>

        <!-- Art der Veranstaltung -->
        <fieldset class="flex flex-col gap-1 min-w-0">
            <legend class="text-xs font-semibold mb-1">Art der Veranstaltung</legend>
            <ul class="flex flex-wrap gap-1">
                {#each typeOptions as type (type)}
                    {@const active = selectedTypes.size === 0 || selectedTypes.has(type)}
                    <li class="min-w-0 max-w-full">
                        <button
                                type="button"
                                class="bg-surface-raised text-xs shadow p-2 rounded flex items-center gap-1.5 cursor-pointer transition-opacity max-w-full"
                                class:opacity-40={!active}
                                aria-pressed={selectedTypes.has(type)}
                                title={type}
                                onclick={() => toggleType(type)}
                        >
                            <span
                                    class="inline-block size-3 shrink-0 rounded-full"
                                    style="background: {(eventColors as Record<string, string>)[type] ?? '#9ca3af'}"
                            ></span>
                            <span class="truncate min-w-0">{type}</span>
                        </button>
                    </li>
                {/each}
            </ul>
        </fieldset>
    </section>

    <div class="flex items-center justify-between text-sm">
        <span aria-live="polite">{filtered.length} von {rows.length} Veranstaltungen</span>
        {#if hasFilters}
            <button type="button" class="underline cursor-pointer" onclick={reset}>
                Filter zurücksetzen
            </button>
        {/if}
    </div>

    <div class="bg-surface rounded shadow overflow-x-auto">
        <table class="w-full text-sm">
            <thead class="text-left text-xs">
            <tr class="border-b border-current/20">
                <th class="p-2">Art</th>
                <th class="p-2">Ort</th>
                <th class="p-2">PLZ</th>
                <th class="p-2">Bundesland</th>
                <th class="p-2">Von</th>
                <th class="p-2">Bis</th>
                <th class="p-2">Quelle</th>
            </tr>
            </thead>
            <tbody>
            {#each filtered as row, i (i)}
                <tr class="border-b border-current/10 last:border-0">
                    <td class="p-2">
                        <span class="flex items-center gap-1.5">
                            <span
                                    class="inline-block size-3 shrink-0 rounded-full"
                                    style="background: {(eventColors as Record<string, string>)[row.type] ?? '#9ca3af'}"
                            ></span>
                            {row.type}
                        </span>
                    </td>
                    <td class="p-2">{row.place}</td>
                    <td class="p-2">{row.plz}</td>
                    <td class="p-2">{row.state}</td>
                    <td class="p-2 whitespace-nowrap">{formatIso(row.start)}</td>
                    <td class="p-2 whitespace-nowrap">{formatIso(row.end)}</td>
                    <td class="p-2">{row.source}</td>
                </tr>
            {:else}
                <tr>
                    <td class="p-4 text-center opacity-60" colspan="7">
                        Keine Veranstaltungen für diese Filter.
                    </td>
                </tr>
            {/each}
            </tbody>
        </table>
    </div>
</div>