<script>
  import { onMount } from "svelte";

  let allGames = [];
  let games = [];
  let loading = true;
  let error = "";
  let pickedSide = "";
  let resultMessage = "";
  let rounds = 0;
  let score = 0;

  async function getGameList() {
    const response = await fetch("/api/mobile/top-100");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data?.games ?? [];
  }

  function getRandomGames(gameList, count) {
    const shuffled = [...gameList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  function startNewRound() {
    games = getRandomGames(allGames, 2);
    pickedSide = "";
    resultMessage = "";
  }

  function choose(side) {
    if (pickedSide || !games[0] || !games[1]) return;

    pickedSide = side;
    rounds += 1;

    const leftGame = games[0];
    const rightGame = games[1];
    const isLeftMorePopular = leftGame.rank < rightGame.rank;
    const guessedLeft = side === "left";
    const isCorrect = guessedLeft === isLeftMorePopular;

    if (isCorrect) {
      score += 1;
    }

    const winner = isLeftMorePopular ? leftGame : rightGame;
    resultMessage = isCorrect
      ? `Correct! ${winner.name} is more popular (#${winner.rank}).`
      : `Wrong guess. ${winner.name} is more popular (#${winner.rank}).`;
  }

  onMount(async () => {
    try {
      allGames = await getGameList();

      if (allGames.length < 2) {
        throw new Error("Not enough mobile games to play.");
      }

      startNewRound();
    } catch (e) {
      error = "Failed to load top mobile games.";
      console.error(e);
    } finally {
      loading = false;
    }
  });
</script>

<main>
  <h1>Top 100 Mobile Games — Guess the most popular</h1>

  {#if !loading && !error}
    <p class="score">Score: {score} / {rounds}</p>
  {/if}
    
    <div class="containers">
        <div class="containerLeft">
            {#if loading}
                <p>Loading...</p>
            {:else if error}
                <p>{error}</p>
            {:else if games[0]}
        <button class="pick-button" on:click={() => choose("left")} disabled={!!pickedSide}>
          <div class="game-name">{games[0].name}</div>
          {#if pickedSide}
          <div class="rank">Rank #{games[0].rank}</div>
          {/if}
        </button>
            {/if}
        </div>

        <div class="containerRight">
            {#if loading}
                <p>Loading...</p>
            {:else if error}
                <p>{error}</p>
            {:else if games[1]}
        <button class="pick-button" on:click={() => choose("right")} disabled={!!pickedSide}>
          <div class="game-name">{games[1].name}</div>
          {#if pickedSide}
          <div class="rank">Rank #{games[1].rank}</div>
          {/if}
        </button>
            {/if}
        </div>
    </div>

  {#if pickedSide}
    <div class="result-row">
    <p>{resultMessage}</p>
    <button class="next-button" on:click={startNewRound}>Next round</button>
    </div>
  {/if}
</main>

<style>
main {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

h1 {
    background-color: white;
    text-align: center;
    margin: 0;
    padding: 1rem;
}

.score {
  margin: 0;
  padding: 0.75rem;
  text-align: center;
  background: #f2f2f2;
}

.containers {
    display: flex;
    flex: 1;
}

.containerLeft {
    background-color: black;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    color: white;
}

.containerRight {
    background-color: green;
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    color: white;
}

.game-name {
    font-size: 1.2rem;
    font-weight: bold;
  text-align: center;
}

.pick-button {
  background: transparent;
  color: white;
  border: 2px solid white;
  border-radius: 10px;
  padding: 1rem;
  width: 75%;
  cursor: pointer;
}

.pick-button:disabled {
  opacity: 0.85;
  cursor: default;
}

.rank {
  margin-top: 0.5rem;
  font-weight: 700;
}

.result-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
}

.next-button {
  border: 1px solid black;
  border-radius: 8px;
  background: black;
  color: white;
  padding: 0.6rem 1rem;
  cursor: pointer;
}
</style> 