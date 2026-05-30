<script>
  import { onMount } from 'svelte';
  import { recentSearches } from '$lib/recentSearches.js';

  /** @type {import('./$types').PageData} */
  export let data;

  onMount(() => {
    const type = data?.response?.types?.[0]?.type?.name;
    if (type) {
      recentSearches.setType(data.response.name, type);
    }
  });
</script>

{#await data}
  <p>.. waiting</p>
{:then pokemon}
<article>
  {#each Object.entries(pokemon.response.sprites) as sprites}
    {#if typeof sprites[1] == "string"}
    <img src={sprites[1]} />
    {/if}
  {/each}
</article>
<h1>{pokemon.response.name}</h1>
<section>
  <p><strong>Height:</strong> {pokemon.response.height / 10} m</p>
  <p><strong>Weight:</strong> {pokemon.response.weight / 10} kg</p>
  <p><strong>Base experience:</strong> {pokemon.response.base_experience}</p>
  <p><strong>Abilities:</strong> {pokemon.response.abilities.map(a => a.ability.name).join(', ')}</p>
</section>

{/await}

<style>
  article {
    display: flex;
    width: 90%;
    height: 30%;
    gap: 1em;
  }
</style>
