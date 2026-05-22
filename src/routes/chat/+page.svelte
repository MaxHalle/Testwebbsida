<script>
import ElizaBot from 'elizabot';
import { enhance } from "$app/forms";
const eliza = new ElizaBot();
let chat = $state([{ user: 'Eliza', message: eliza.getInitial() }]);


async function write(message) {
    chat = [...chat, { user: 'You', message }];

    // Show the typing indicator
    var element = document.getElementById("visible");
    element.style.display = "flex";

    // random delay for Eliza's response time
    await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

    // Hide the typing indicator
    element.style.display = "none";

    const response = eliza.transform(message);
    chat = [...chat, { user: 'Eliza', message: response }];
  }
                
</script>

<main>
    <section>
        {#each chat as msg (msg.message)}
            <article class={msg.user}>
                <strong>{msg.user}:</strong>
                <p>{msg.message}</p>
            </article>
        {/each}
        <article id="visible">
            <span class="circle"></span>
            <span class="circle"></span>
            <span class="circle"></span>
        </article>
    </section>

    <form method="post"
    use:enhance={({ formElement, formData, cancel }) => {
      cancel(); // don't post anything to server
      const text = formData.get("text")?.toString().trim();
      if (!text) return;

      write(text);
      formElement.reset();
      }}>
        <textarea name="text" placeholder="Type your message..."></textarea>
        <button type="submit">Send</button>
    </form>
</main>

<style>
    main {
        width: 60vw;
        height: 70vh;
        padding: 10px;
        background-color: lightblue;
        display: grid;
        grid-template-rows: 90% 10%;
        margin: auto;
    }

    section {
        overflow-y: scroll;
        padding: 8px;
        background: white;
        border: 1px solid #ccc;
    }

    #visible {
        width: 100px;
        height: 60px;
        padding: 0;
        display: none;
        justify-content: center;
        align-items: center;
    }

    @keyframes typing {
        0% {
            transform: scale(1);
        }
        25% {
            transform: scale(1);
        }
        50% {
            transform: scale(1.4);
        }
        100% {
            transform: scale(1);
        }
    }

    .circle {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background-color: rgb(100, 100, 100);
        animation: typing 1000ms ease-in-out;
        animation-iteration-count: infinite;
        margin: 0 4px;
    }

    .circle:nth-child(1) {
        animation-delay: 0ms;
    }

    .circle:nth-child(2) {
        animation-delay: 333ms;
    }

    .circle:nth-child(3) {
        animation-delay: 666ms;
    }

    textarea {
        margin: 10px;
        padding: 10px;
        border-radius: 10px;
        background-color: rgb(77, 180, 244);
        width: 90%;
    }

    article {
        margin: 10px;
        padding: 10px;
        border-radius: 10px;
        width: 70%;
    }

    article.You {
        background-color: #e8f5e9;
        margin-left: auto;
        margin-right: 10px;
        text-align: right;
    }

    article.Eliza {
        background-color: #e3f2fd;
        margin-left: 10px;
        margin-right: auto;
        text-align: left;
    }
</style>