<script lang="ts">
    import {goto} from '$app/navigation';
    import {navigating, page} from '$app/state';
    import {eventColors} from '#lib/events/eventColors.ts';
    import type {PageProps} from './$types';
    import {fieldsFor} from '#lib/events/eventFields.ts';

    let {data}: PageProps = $props();

    const filters = $derived(data.filters);
    const colorOf = (type: string) => (eventColors as Record<string, string>)[type] ?? '#9ca3af';

    // Writes the given params into the URL; the navigation re-runs `load` on the server.
    // Passing null, '' or [] removes a param. Any filter change goes back to page 1.
    function update(patch: Record<string, string | string[] | null>) {
        const params = new URLSearchParams(page.url.searchParams);

        for (const [key, value] of Object.entries(patch)) {
            params.delete(key);
            for (const v of [value ?? []].flat()) if (v) params.append(key, v);
        }
        if (!('page' in patch)) params.delete('page');

        goto(`?${params}`, {reset: false, replace: true});
    }

    let plzTimer: ReturnType<typeof setTimeout>;
    function onPlzInput(event: Event & {currentTarget: HTMLInputElement}) {
        const value = event.currentTarget.value.replace(/\D/g, '');
        clearTimeout(plzTimer);
        plzTimer = setTimeout(() => update({plz: value}), 300);
    }

    function toggleType(type: string) {
        const next = filters.types.includes(type)
            ? filters.types.filter((t) => t !== type)
            : [...filters.types, type];
        update({type: next});
    }

    const hasFilters = $derived(page.url.searchParams.size > 0);
    const loading = $derived(navigating.to !== null);

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
                            class:opacity-40={filters.region !== mode}
                            aria-pressed={filters.region === mode}
                            onclick={() => update({region: mode === 'state' ? null : mode})}
                    >
                        {text}
                    </button>
                {/each}
            </div>

            {#if filters.region === 'state'}
                <select
                        class={field}
                        aria-label="Bundesland"
                        value={filters.state}
                        onchange={(e) => update({state: e.currentTarget.value})}
                >
                    <option value="">Alle Bundesländer</option>
                    {#each data.options.states as option (option)}
                        <option value={option}>{option}</option>
                    {/each}
                </select>
            {:else}
                <div class="flex gap-2">
                    <input
                            class="{field}"
                            type="text"
                            inputmode="numeric"
                            maxlength="5"
                            placeholder="PLZ, z. B. 37073"
                            aria-label="Postleitzahl"
                            value={filters.plz}
                            oninput={onPlzInput}
                    />
                    <select
                            class="{field}"
                            aria-label="Umkreis"
                            value={filters.radius}
                            onchange={(e) => update({radius: e.currentTarget.value})}
                    >
                        {#each data.options.radii as radius (radius)}
                            <option value={radius}>{radius === 0 ? 'Nur diese PLZ' : `${radius} km`}</option>
                        {/each}
                    </select>
                </div>

                {#if data.centerMissing}
                    <p class="text-xs">Diese PLZ wurde nicht gefunden.</p>
                {:else if filters.radius > 0 && filters.plz.length < 5}
                    <p class="text-xs opacity-60">Für die Umkreissuche eine vollständige 5-stellige PLZ eingeben.</p>
                {/if}
            {/if}
        </fieldset>

        <!-- Zeitraum -->
        <fieldset class="grid grid-cols-2 gap-2 min-w-0">
            <legend class="text-xs font-semibold mb-1">Zeitraum</legend>
            <label class={label}>
                Von
                <input
                        class={field}
                        type="date"
                        value={filters.from}
                        max={filters.to || undefined}
                        onchange={(e) => update({from: e.currentTarget.value})}
                />
            </label>
            <label class={label}>
                Bis
                <input
                        class={field}
                        type="date"
                        value={filters.to}
                        min={filters.from || undefined}
                        onchange={(e) => update({to: e.currentTarget.value})}
                />
            </label>
        </fieldset>

        <!-- Quelle -->
        <label class="{label} min-w-0">
            Quelle
            <select class={field} value={filters.source} onchange={(e) => update({source: e.currentTarget.value})}>
                <option value="">Alle Quellen</option>
                {#each data.options.sources as option (option)}
                    <option value={option}>{option}</option>
                {/each}
            </select>
        </label>

        <!-- Art der Veranstaltung -->
        <fieldset class="flex flex-col gap-1 min-w-0">
            <legend class="text-xs font-semibold mb-1">Art der Veranstaltung</legend>
            <ul class="flex flex-wrap gap-1">
                {#each data.options.types as type (type)}
                    {@const selected = filters.types.includes(type)}
                    <li class="min-w-0 max-w-full">
                        <button
                                type="button"
                                class="bg-surface-raised text-xs shadow p-2 rounded flex items-center gap-1.5 cursor-pointer transition-opacity max-w-full"
                                class:opacity-40={filters.types.length > 0 && !selected}
                                aria-pressed={selected}
                                title={type}
                                onclick={() => toggleType(type)}
                        >
                            <span class="inline-block size-3 shrink-0 rounded-full" style="background: {colorOf(type)}"></span>
                            <span class="truncate min-w-0">{type}</span>
                        </button>
                    </li>
                {/each}
            </ul>
        </fieldset>
    </section>

    <div class="flex items-center justify-between text-sm">
        <span aria-live="polite">{data.total} Veranstaltungen</span>
        {#if hasFilters}
            <button
                    type="button"
                    class="underline cursor-pointer"
                    onclick={() => goto(page.url.pathname, {reset: false, replace: true})}
            >
                Filter zurücksetzen
            </button>
        {/if}
    </div>

    <div class="overflow-x-auto transition-opacity" class:opacity-50={loading} aria-busy={loading}>
        <ul
                class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 transition-opacity"
                class:opacity-50={loading}
                aria-busy={loading}
        >
            {#each data.rows as row (row.id)}
                {@const color = colorOf(row.type)}
                <li
                        class="rounded shadow p-3 flex flex-col gap-2 min-w-0 border-l-4"
                        style="border-color: {color}; background: color-mix(in srgb, {color} 14%, var(--color-surface, transparent));"
                >
                    <div class="flex items-center gap-1.5 text-sm font-semibold min-w-0">
                        <span class="inline-block size-3 shrink-0 rounded-full" style="background: {color}"></span>
                        <span class="break-words min-w-0">{row.type || 'Unbekannt'}</span>
                        {#if row.distance !== null}
                            <span class="ml-auto shrink-0 pl-2 text-xs font-normal opacity-70">{row.distance} km</span>
                        {/if}
                    </div>

                    <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                        {#each fieldsFor(row.type) as key (key)}
                            {@const value = String(row.fields[key] ?? '').trim()}
                            <dt class="opacity-60">{key}</dt>
                            <dd class="break-words" class:opacity-40={!value}>{value || '–'}</dd>
                        {/each}
                    </dl>
                </li>
            {:else}
                <li class="col-span-full bg-surface rounded shadow p-4 text-center text-sm opacity-60">
                    Keine Veranstaltungen für diese Filter.
                </li>
            {/each}
        </ul>
    </div>

    {#if data.pages > 1}
        <div class="flex items-center justify-center gap-3 text-sm">
            <button
                    type="button"
                    class="bg-surface-raised shadow px-3 py-1 rounded cursor-pointer disabled:opacity-40"
                    disabled={filters.page <= 1}
                    onclick={() => update({page: String(filters.page - 1)})}
            >
                Zurück
            </button>
            <span>Seite {filters.page} von {data.pages}</span>
            <button
                    type="button"
                    class="bg-surface-raised shadow px-3 py-1 rounded cursor-pointer disabled:opacity-40"
                    disabled={filters.page >= data.pages}
                    onclick={() => update({page: String(filters.page + 1)})}
            >
                Weiter
            </button>
        </div>
    {/if}
</div>