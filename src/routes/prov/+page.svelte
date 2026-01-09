<script>
    let colours = ["red", "blue", "green", "yellow", "purple", "orange"]
</script>

<div class="container">
    {#each colours as colour, index}
        <div class="box" style = "background-color:{colour};">{index +1}</div>
    {/each}
</div>

<style>
    .container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        width: 100vw;
        height: 100vh;
        background-color: gray;
        place-items: center;
    }

    .box {
        width: 400px;
        height: 400px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
    }
</style>

