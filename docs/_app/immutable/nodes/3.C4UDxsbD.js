import"../chunks/DsnmJJEf.js";import"../chunks/DkecjGR1.js";import{f as h,a as w,s as p,c as i,r as a,n as f}from"../chunks/QBsdy4Tx.js";import{s}from"../chunks/CbZqhYkN.js";var b=h(`<main><div><h1>Photoapp</h1> <p>Denna sida innehåller fina bilder</p></div> <div class="photos"><div class="image-wrapper"><img alt="Flexbox egenskaper"/></div> <div class="image-wrapper"><img alt="Flexbox cheatsheet"/></div> <div class="image-wrapper"><img alt="CSS Flexbox"/></div></div> <style>.photos{
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
    }</style></main>`);function z(d){let n="https://i.redd.it/rofzm44oka091.png",l="https://i.redd.it/vd9dc7wfk9471.png",g="https://miro.medium.com/v2/resize:fit:1400/0*YeaUsQyhXSL1TCTH.png";var e=b(),o=p(i(e),2),r=i(o),v=i(r);s(v,"src",n),a(r);var t=p(r,2),x=i(t);s(x,"src",l),a(t);var m=p(t,2),c=i(m);s(c,"src",g),a(m),a(o),f(2),a(e),w(d,e)}export{z as component};
