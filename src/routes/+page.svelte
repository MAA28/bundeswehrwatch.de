<script lang="ts">
    import Map from "#lib/components/Map.svelte";
    import EventsPerDayChart from "#lib/components/EventsPerDayChart.svelte";
    import Navbar from "#lib/components/navbar.svelte";

    export const {data} = $props();
</script>
<header class="p-3 bg-bg flex flex-col items-center">
    <h1 class="font-sans italic p-3 text-text-heading font-extrabold relative">
        <span class="text-2xl left-7 relative">Wo wirbt</span><br>
        <span class="text-5xl">die Bundeswehr</span><br>
        <span class="text-3xl left-10 relative">heute voraussichtlich?</span>
    </h1>
    <p class="text-xs text-text-muted flex gap-1 items-center">
        <a href="bundeswehrwatch.de" class="font-sans font-extrabold">bundeswehrwatch.de</a>
        <span class="italic"> sponsered by </span>
        <a href="schulstreikgegenwehrpflicht.de" class="font-sans font-extrabold">SCHULSTREIK GEGEN WEHRPFLICHT</a>
    </p>
    <Navbar/>
</header>
<main class="bg-bg m-3 gap-2 flex flex-col text-text">
    <Map events={data.current_events}/>
    <div class="font-medium flex flex-col flex-wrap gap-1 m-2">
        <p>Seit Jahren wird die Bundeswehr mehr und mehr um junge Menschen und Minderjährige und das trotz wiederholter
            Anklage dieser Praxis. Die Gewerkschaften (gerade auch die GEW), verschiedene Jugendverbände und
            Friedensorganisationen protestieren und die UN kritisiert die Verstöße gegen die UN-Kinderrechtskonvention,
            die durch die Rekrutierung von Minderjährigen entstehen.</p>
        <p>Um die Öffentlichkeit dabei zu unterstützen sich ein Bild der Situation zu machen sollen auf dieser Website
            Daten zusammengetragen werden, die Ausmaß der militärischen Propaganda verdeutlichen.</p>
        <p>Auf der oberen interaktiven Karte können alle Auftritte der Bundeswehr bei denen sie heute versucht junge
            Menschen für den Militärdienst zu begeistern angezeigt.</p>
    </div>
    <EventsPerDayChart data={data.events_per_day}/>
    <div class="font-medium flex flex-col flex-wrap gap-1 m-2">
        <p>Wie man unschwer erkennen kann gibt es jeden Tag eine vielzahl ans angewandten Strategien. Die
            Veranstaltungen von Vereinen sind oft Sponsoring-Agreements, also beispielsweise ein Banner auf dem
            Fußballplatz. Einigungen längfristig laufen geschlossen werden haben sie auch in dem Diagram einen großen
            Anteil. Sie sind aber keines wegs unbedenklich: Das die E-Jugend unter einem Flecktarn-Banner trainiert soll
            die Jugendlichen frühzeitig fürs Militär begeistern.</p>
        <p></p>
    </div>
</main>
