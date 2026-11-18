<script>
    import { page } from '$app/state';
</script>

<h1 class="text-center text-6xl">
    <span class="font-light italic">{page.status}</span>
    <span class="font-extrabold">{page.error.message}</span>
</h1>
<p class="text-center text-medium">Wir werden das Problem bestimmt bald gelöst haben...</p>
