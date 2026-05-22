<script>

	import favicon from '$lib/assets/favicon.svg';
	import { base } from '$app/paths';
	let { children } = $props();
</script>
<nav>
<a href="{base}/">Start</a>
<a href="{base}/photoapp">Photo App</a>
<a href="{base}/register">Register</a>
<a href="{base}/login">Login</a>
<a href="{base}/shoppinglist">Shoppinglist</a>
<a href="{base}/memory">Memory</a>
<a href="{base}/chat">Chat</a>
<a href="{base}/miniproject">Mini Project</a>
<a href="{base}/miniproject2">Mini Project_2</a>
<a href="{base}/miniproject3">Mini Project_3</a>


</nav>
<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}

<style>
	
:global(body), :global(html){
  margin: 0%;
  padding: 0%;
  height: 100vh;
  width: 100vw;
}    

</style>