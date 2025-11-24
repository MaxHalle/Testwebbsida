<script>
let image = "https://i.redd.it/rofzm44oka091.png"
let photo = "https://i.redd.it/vd9dc7wfk9471.png"
let picture = "https://miro.medium.com/v2/resize:fit:1400/0*YeaUsQyhXSL1TCTH.png"
</script>
<main>  
<div>
<h1>Photoapp</h1>
<p>Denna sida innehåller fina bilder</p>
</div>

<div class="photos">
  <div class="image-wrapper">
  <img src={image} alt="Flexbox egenskaper">
  </div>

  <div class="image-wrapper">
  <img src={photo} alt="Flexbox cheatsheet">
  </div>

  <div class="image-wrapper">
  <img src={picture} alt="CSS Flexbox">
  </div>

</div> 

<style>
    .photos{
      display:flex;
      max-width: 90vw;
      width: 100%;
      align-items:center;
      justify-content:center;
      flex-wrap: wrap;
      background-color: gainsboro;
    }

    .image-wrapper img{ 
      width: 100%;
      margin:10px;
      border-radius: 20px;
      border: 2px solid white;
      box-shadow: 4px 8px 10px rgba(0,0,0,0.2);
    }
    
    .image-wrapper{
      flex-grow:1;
      transition: flex-grow 1s;
      flex-basis: 300px;

    }

    .image-wrapper:hover {
      flex-grow:2;
      
    }

    .image-wrapper:active {
      transform: scale(0.9); 
    }

    
    h1{
    text-align: center;
    font-size: 50px;
    margin: 20px;
    color: grey;
    }
</style>
</main>
