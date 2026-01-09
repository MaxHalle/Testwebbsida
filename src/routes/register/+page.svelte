<script>
    	import { base } from '$app/paths';

let color = "black"
let colours = [{namn: "Blå", value: "blue"}, {namn: "Röd", value: "red"}]
function handleSubmit(){
alert("Välkommen")
}
let namn
let epost
let lösenord
</script>
<main>
<div class="container">
    <h1>Registrering</h1>
    
    <form on:submit|preventDefault={handleSubmit}>

<div style="width: 100px; height: 100px; border-radius: 50%; overflow:hidden; background-color:{color};"></div>
        
<!-- label: information om vad användaren ska fylla i -->
<!-- for och id attribut kopplar ihop label och input -->
<label for="Favoritfärg">Favoritfärg:</label>
<select type="text" bind:value={color} id="name"> 
    {#each colours as c}
            <option value={c.value}>{c.namn}</option>

    {/each}
</select>

<label for="name">Namn:</label>
<input type="text" bind:value={namn} id="name" >

<label for="name">Namn:</label>




<!-- input: där användaren fyller i sin information -->
<!-- type attribut sätter vilken typ av data som ska fyllas i -->
<input type="submit" value="Registrera">

    </form>
<a href="{base}/login">Har du redan ett konto? Logga in</a>

</div>   
</main>

<style>
.container{
        border: solid 5px rosybrown;
        border-radius: 10px;
        width: 35%;
        height: 80%;
        background-color: #3a2e3b;
        margin: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: space-evenly;
}  

main{
        background-image: url("https://t4.ftcdn.net/jpg/05/21/65/59/360_F_521655929_N80d5GaCQJ2VP073PfTXJTe9mkvsNtHE.jpg");
        background-size: cover;
        width: 100%;
        height: 100%;
        padding: 5%;
}
</style>
