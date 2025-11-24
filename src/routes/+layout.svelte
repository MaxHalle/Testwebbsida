<script>

	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>
<nav>
<a href="/photoapp">Photo App</a>
</nav>
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
