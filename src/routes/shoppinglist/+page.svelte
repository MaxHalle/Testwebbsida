<script>
  // Håller värdet från inputfältet
  let newItem = "";

  // Applikationens state: EN lista med alla varor
  let varor = $state([
    { id: crypto.randomUUID(), name: "Mjölk", köpt: false }
  ]);

  // Lägg till ny vara
  function addItem() {
    // Förhindrar tomma eller blankstegs-namn
    if (!newItem.trim()) return;

    // Skapar en NY array (viktigt i Svelte 5)
    varor = [
      ...varor,
      {
        id: crypto.randomUUID(),
        name: newItem.trim(),
        köpt: false
      }
    ];

    // Töm inputfältet efter submit
    newItem = "";
  }

  // Växlar mellan köpt / ej köpt
  function toggleKöpt(id) {
    varor = varor.map(vara =>
      vara.id === id
        ? { ...vara, köpt: !vara.köpt }
        : vara
    );
  }

  // Tar bort en specifik vara
  function removeItem(id) {
    varor = varor.filter(vara => vara.id !== id);
  }
</script>

<main class="container">
  <h1>Shoppinglist</h1>

  <div class="categories_container">
    <!-- VAROR ATT KÖPA -->
    <section>
      <h2>Varor att köpa</h2>
      <ol>
        {#each varor as vara (vara.id)}
          {#if !vara.köpt}
            <li>
              {vara.name}

              <button on:click={() => toggleKöpt(vara.id)}>
                ✔
              </button>

              <button on:click={() => removeItem(vara.id)}>
                ✖
              </button>
            </li>
          {/if}
        {/each}
      </ol>
    </section>

    <!-- KÖPTA VAROR -->
    <section>
      <h2>Köpta varor</h2>
      <ul>
        {#each varor as vara (vara.id)}
          {#if vara.köpt}
            <li>
              {vara.name}

              <button on:click={() => toggleKöpt(vara.id)}>
                ↩
              </button>

              <button on:click={() => removeItem(vara.id)}>
                ✖
              </button>
            </li>
          {/if}
        {/each}
      </ul>
    </section>
  </div>

  <!-- FORMULÄR -->
  <form on:submit|preventDefault={addItem}>
    <input
      type="text"
      placeholder="Lägg till vara"
      bind:value={newItem}
    />
    <button type="submit">Lägg till</button>
  </form>
</main>


<style>

.container{
    background-color: gray;
    width: 60vw;
    height: 70vh;
    border-radius: 20px;
    display: grid;
    grid-template-rows: 1fr 9fr 1fr;
        
}

h1{
    background-color: gainsboro;
    border-radius: 10px;
}

.container h1{
    justify-self: center;
    align-self: center;
}

.categories_container{
    background-color: lightblue;
    height: 100%;
    border-radius: 20px;
    display: grid;
    grid-template-columns: repeat(2,1fr);
    gap: 10px;
}

.categories_container section {
  width: 100%;
  height: 100%;
  background-color: white;
  border-radius: 10px;
}

.categories_container section:first-child {
  background-color: rgba(0, 0, 0, 0.1);
}

.categories_container section:last-child {
  background-color: rgba(0, 0, 0, 0.3);
}

.categories_container section h2{
    background-color: rgb(144, 142, 142);
    border-radius: 10px;
    text-align: center;
    font-size: x-large;
    margin: 20px;
}


form {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

form input {
  padding: 8px 12px;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 5px;
}

form button {
  padding: 8px 16px;
  font-size: 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

form button:hover {
  background-color: #45a049;
}

</style>