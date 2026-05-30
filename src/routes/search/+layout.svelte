<script>
	import { goto } from '$app/navigation';
	import { base } from '$app/paths';
	import { recentSearches } from '$lib/recentSearches.js';

	const typeColors = {
		normal: '#A8A878', fire: '#F08030', water: '#6890F0',
		electric: '#F8D030', grass: '#78C850', ice: '#98D8D8',
		fighting: '#C03028', poison: '#A040A0', ground: '#E0C068',
		flying: '#A890F0', psychic: '#F85888', bug: '#A8B820',
		rock: '#B8A038', ghost: '#705898', dragon: '#7038F8',
		dark: '#705848', steel: '#B8B8D0', fairy: '#EE99AC'
	};

	function handleSubmit(e) {
		e.preventDefault();
		const formData = new FormData(e.target);
		const search = formData.get('search').toLowerCase();
		recentSearches.add(search);
		// eslint-disable-next-line
		goto(base + '/search/' + search);
	}
</script>

<main>
	<form onsubmit={handleSubmit}>
		<input type="text" name="search" placeholder="Sök upp en pokemon" />
	</form>
	<slot />
</main>

<div class="backdrop"></div>

{#if $recentSearches.length > 0}
<footer>
	{#each $recentSearches as search (search.name)}
		<!-- eslint-disable-next-line -->
		<a
			href="{base}/search/{search.name}"
			style="background-color: {search.type ? (typeColors[search.type] ?? '#888') : '#888'}"
		>
			{search.name}
		</a>
	{/each}
</footer>
{/if}

<style>
	main {
		width: 80vw;
		height: 100vh;
		background-color: rgba(255, 255, 255, 0.8);
		margin: 5vh auto;
		border: 1px solid #ccc;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	form {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1rem;
	}

	input {
		width: 320px;
		padding: 0.75rem 1.25rem;
		border: 2px solid #ccc;
		border-radius: 999px;
		font-size: 1rem;
		outline: none;
		transition: border-color 0.2s;
		background-color: rgba(255, 255, 255, 0.9);
	}

	input:focus {
		border-color: #e3350d;
	}

	.backdrop {
		width: 100vw;
		height: 100vh;
		background-image: url('https://imageio.forbes.com/specials-images/imageserve/604202ff091b6539cb90fcbc/The-backs-of-a-number-of-Pok-mon-cards-/960x0.jpg?format=jpg&width=960');
		background-size: cover;
		position: fixed;
		top: 0;
		left: 0;
		z-index: -1;
		filter: blur(5px);
	}

	footer {
		position: fixed;
		bottom: 0;
		left: 0;
		width: 100%;
		display: flex;
		flex-direction: row;
		gap: 0.5rem;
		padding: 0.75rem 1.5rem;
		background-color: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(4px);
	}

	footer a {
		padding: 0.4rem 1rem;
		border-radius: 999px;
		text-decoration: none;
		color: white;
		font-weight: bold;
		font-size: 0.9rem;
		text-transform: capitalize;
		transition: opacity 0.2s;
	}

	footer a:hover {
		opacity: 0.8;
	}
</style>
