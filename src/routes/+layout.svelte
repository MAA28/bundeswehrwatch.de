<script lang="ts">
    import './layout.css';
    import favicon from '#lib/assets/favicon.svg';
    import type {LayoutProps} from './$types';
    import Navbar from "#lib/components/navbar.svelte";

    let {children}: LayoutProps = $props();
</script>

<svelte:head>
    <link rel="icon" href={favicon}/>
    <title>bundeswehrwatch.de | 🪖🔎</title>
</svelte:head>

<div class="min-h-[100vh] flex flex-col">
<header class="p-3 bg-bg flex flex-col items-center">
    <h1 class="font-sans italic p-3 text-text-heading font-extrabold relative">
        <span class="sm:text-2xl left-7 relative">Wo wirbt</span><br>
        <span class="sm:text-5xl">die Bundeswehr</span><br>
        <span class="sm:text-3xl left-10 relative">heute voraussichtlich?</span>
    </h1>
    <p class="text-xs text-text-muted flex gap-1 items-center not-sm:flex-col">
        <a href="bundeswehrwatch.de" class="font-sans font-extrabold">bundeswehrwatch.de</a>
        <span class="italic"> sponsered by </span>
        <a href="schulstreikgegenwehrpflicht.de" class="font-sans font-extrabold">SCHULSTREIK GEGEN WEHRPFLICHT</a>
    </p>
    <Navbar/>
</header>

<main class="bg-bg m-3 gap-2 flex flex-col flex-1 text-text">
    {@render children()}
</main>

<footer class="bg-accent text-surface p-3">
    <h3 class="text-2xl font-black italic mb-3">Impressum</h3>
    <div class="grid grid-cols-2">
        <div>
            <p>Malte Arved Aschenbach</p>
            <p>Hagenweg 41</p>
            <p>37081 Göttingen</p>
        </div>
        <div>
            <p>Kontaktiere uns unter</p>
            <a href="mailto:info@bundeswehrwatch.de">info@bundeswehrwatch.de</a>
            <a href="/datenschutz">Datenschutzhinweise</a>
        </div>
    </div>
</footer>
</div>