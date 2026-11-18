<script lang="ts">
	import './layout.css';
	import favicon from '#lib/assets/favicon.svg';
	import type { LayoutProps } from './$types';
	import Navbar from "#lib/components/navbar.svelte";

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

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
{@render children()}
</main>
