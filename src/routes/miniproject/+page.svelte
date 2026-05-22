<script>
  const TOTAL_SECONDS = 60;

  // -------- Audio file paths--------
  const BEFORE_LOOP_URL   = "/audio/happy.mp3";         
  const START_SFX_URL     = "/audio/PowerOutage.mp3";    
  const DURING_LOOP_URL   = "/audio/Chase.mp3";          
  const FINISH_SFX_URL    = "/audio/low_honour.mp3";     
  const SUCCESS_SFX_URL   = "/audio/success.mp3";         

  // volumes (0..1)
  const VOL_BEFORE = 0.35;
  const VOL_DURING = 0.45;
  const VOL_SFX_START = 0.9;
  const VOL_SFX_FINISH = 0.9;
  const VOL_SFX_SUCCESS = 0.6;

  // Backgrounds
  const PRE_TIMER_BG_URL =
    "https://media.istockphoto.com/id/182493016/photo/sky-and-grass-backround.jpg?s=612x612&w=0&k=20&c=u9Hk93MPbXqjOTTEFNGMq7JJJ46HDBlnqiG7dvrbu9w=";

  const FADE_BG_URL = "/src/lib/assets/scary.jpg";
  const FINISHED_BG_URL = "/src/lib/assets/blood.webp";

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // -------- Password helpers --------
  function isPrime(n) {
    if (n < 2) return false;
    for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
    return true;
  }

  function distinctSpecialCount(p) {
    const specials = p.match(/[^A-Za-z0-9\s]/g) || [];
    return new Set(specials).size;
  }

  function hasThreeSameInARow(p) {
    return /(.)\1\1/.test(p);
  }

  function hasIncreasingSequenceLikeAbcOr123(p) {
    const s = p.toLowerCase();
    for (let i = 0; i < s.length - 2; i++) {
      const a = s[i], b = s[i + 1], c = s[i + 2];

      if (/[a-z]/.test(a) && /[a-z]/.test(b) && /[a-z]/.test(c)) {
        const A = a.charCodeAt(0), B = b.charCodeAt(0), C = c.charCodeAt(0);
        if (B === A + 1 && C === B + 1) return true;
      }

      if (/\d/.test(a) && /\d/.test(b) && /\d/.test(c)) {
        const A = a.charCodeAt(0), B = b.charCodeAt(0), C = c.charCodeAt(0);
        if (B === A + 1 && C === B + 1) return true;
      }
    }
    return false;
  }

  // Rule order matters (first failing is revealed)
  const passwordRules = [
    { id: "min12", label: "At least 12 characters long", test: (p) => p.length >= 12 },
    { id: "max20", label: "Cannot be over 20 characters long", test: (p) => p.length <= 20 },
    { id: "prime", label: "Length must be a prime number", test: (p) => isPrime(p.length) },

 
    { id: "hasnum", label: "Must include a number", test: (p) => /\d/.test(p) },
    { id: "hasupper", label: "Must include an uppercase letter", test: (p) => /[A-Z]/.test(p) },

    { id: "3special", label: "Must include 3 different special characters", test: (p) => distinctSpecialCount(p) >= 3 },
    { id: "nospaces", label: "Cannot contain spaces", test: (p) => !/\s/.test(p) },
    { id: "no3same", label: "Cannot have 3 of the same character in a row", test: (p) => !hasThreeSameInARow(p) },
    { id: "noseq", label: "Cannot have sequences like abc or 123", test: (p) => !hasIncreasingSequenceLikeAbcOr123(p) }
  ];

  function firstFailingRule(p) {
    for (const r of passwordRules) if (!r.test(p)) return r;
    return null;
  }

  let email = $state("");
  let password = $state("");

  let timeLeft = $state(TOTAL_SECONDS);
  let timerRunning = $state(false);
  let timerFinished = $state(false);

  let successLocked = $state(false);

  let overlayOpacity = $state(0);

  let message = $state(null);
  function showMessage(text, type = "error") {
    message = { text, type };
  }

  let revealedRuleIds = $state([]);
  function revealRule(id) {
    if (!revealedRuleIds.includes(id)) revealedRuleIds = [...revealedRuleIds, id];
  }
  const revealedRules = $derived(passwordRules.filter((r) => revealedRuleIds.includes(r.id)));

  // -------- AUDIO --------
  let beforeLoopEl;
  let startSfxEl;
  let duringLoopEl;
  let finishSfxEl;
  let successSfxEl;

  let audioEnabled = $state(false);

  function enableAudio() {
    if (!audioEnabled) audioEnabled = true;
  }

  function stop(el) {
    if (!el) return;
    el.pause();
    el.currentTime = 0;
  }

  function playLoop(el, volume) {
    if (!el || !audioEnabled) return;
    el.loop = true;
    el.volume = volume;
    const p = el.play();
    if (p?.catch) p.catch(() => {});
  }

  function playOnceAndWait(el, volume) {
    return new Promise((resolve) => {
      if (!el || !audioEnabled) {
        resolve();
        return;
      }

      el.loop = false;
      el.volume = volume;
      el.currentTime = 0;

      const done = () => resolve();
      el.addEventListener("ended", done, { once: true });

      const p = el.play();
      if (p?.catch) p.catch(() => resolve());
    });
  }

  function playOnceNoWait(el, volume) {
    if (!el || !audioEnabled) return;
    el.loop = false;
    el.volume = volume;
    el.currentTime = 0;
    const p = el.play();
    if (p?.catch) p.catch(() => {});
  }

  function stopAllMusic() {
    stop(beforeLoopEl);
    stop(duringLoopEl);
  }

  function stopAllAudio() {
    stop(beforeLoopEl);
    stop(startSfxEl);
    stop(duringLoopEl);
    stop(finishSfxEl);
    stop(successSfxEl);
  }

  function onEmailFocus() {
    if (timerRunning || timerFinished || successLocked) return;
    enableAudio();
    stopAllMusic();
    playLoop(beforeLoopEl, VOL_BEFORE);
  }

  async function playDuringSequence() {
    if (!audioEnabled) return;

    stopAllMusic();

    stop(startSfxEl);
    await playOnceAndWait(startSfxEl, VOL_SFX_START);

    if (timerFinished || successLocked) return;

    stop(duringLoopEl);
    playLoop(duringLoopEl, VOL_DURING);
  }

  function playFinishSfx() {
    if (!audioEnabled) return;

    stopAllMusic();

    stop(finishSfxEl);
    playOnceNoWait(finishSfxEl, VOL_SFX_FINISH);
  }

  function playSuccessSfx() {
    if (!audioEnabled) return;

    stopAllMusic();

    stop(successSfxEl);
    playOnceNoWait(successSfxEl, VOL_SFX_SUCCESS);
  }

  // -------- Timer internals --------
  let intervalId = null;
  let deadlineMs = 0;

  function stopIntervalOnly() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function clearTimer() {
    stopIntervalOnly();
    timerRunning = false;
    overlayOpacity = 0;
  }

  function timeoutAndLock() {
    stopIntervalOnly();
    timerRunning = false;
    timerFinished = true;
    overlayOpacity = 0;

    timeLeft = 0;

    enableAudio();
    playFinishSfx();

    showMessage("Time is up! Start over", "error");
  }

  function tick() {
    const msRemaining = deadlineMs - Date.now();
    const remainingSec = Math.ceil(msRemaining / 1000);
    timeLeft = Math.max(0, remainingSec);

    const totalMs = TOTAL_SECONDS * 1000;
    const progress = 1 - msRemaining / totalMs;
    overlayOpacity = Math.min(1, Math.max(0, progress));

    if (timeLeft <= 0) timeoutAndLock();
  }

  // Start timer on password focus
  function startTimer() {
    if (timerRunning || timerFinished || successLocked) return;

    enableAudio();

    playDuringSequence();

    timerFinished = false;
    timerRunning = true;
    overlayOpacity = 0;

    deadlineMs = Date.now() + TOTAL_SECONDS * 1000;

    tick();
    intervalId = setInterval(tick, 100);
  }

  function tryAgain() {
    clearTimer();
    timerFinished = false;
    successLocked = false;

    email = "";
    password = "";
    timeLeft = TOTAL_SECONDS;

    revealedRuleIds = [];
    message = null;

    enableAudio();
    stopAllMusic();
    playLoop(beforeLoopEl, VOL_BEFORE);
  }

  $effect(() => {
    return () => {
      clearTimer();
      stopAllAudio();
    };
  });

  function handleSubmit() {
    if (timerFinished || successLocked) return;

    if (!email || !password || !isValidEmail(email)) {
      showMessage("Password rejected.", "error");
      return;
    }

    const failing = firstFailingRule(password);
    if (failing) {
      revealRule(failing.id);
      showMessage("Password rejected.", "error");
      return;
    }

    // success: lock the form
    successLocked = true;

    clearTimer();
    showMessage("Registered.", "success");

    enableAudio();
    playSuccessSfx();
  }
</script>

<!-- Audio elements -->
<audio bind:this={beforeLoopEl} src={BEFORE_LOOP_URL} preload="auto"></audio>
<audio bind:this={startSfxEl} src={START_SFX_URL} preload="auto"></audio>
<audio bind:this={duringLoopEl} src={DURING_LOOP_URL} preload="auto"></audio>
<audio bind:this={finishSfxEl} src={FINISH_SFX_URL} preload="auto"></audio>
<audio bind:this={successSfxEl} src={SUCCESS_SFX_URL} preload="auto"></audio>

<main
  class:running={timerRunning}
  class:finished={timerFinished}
  style={`--pre-bg: url(${PRE_TIMER_BG_URL}); --fade-bg: url(${FADE_BG_URL}); --finished-bg: url(${FINISHED_BG_URL}); --fade-opacity: ${timerRunning ? overlayOpacity : 0};`}
>
  <div class="fadeLayer" aria-hidden="true"></div>

  <div class="container">
    <h1>Sign Up</h1>

    {#if timerRunning || timerFinished}
      <div class="timer">⏳ {timeLeft}s</div>
    {/if}

    {#if message}
      <div class="msgOverlay {message.type}">{message.text}</div>
    {/if}

    {#if revealedRules.length > 0}
      <ul class="rulesOverlay">
        {#each revealedRules as r}
          <li class:bad={!r.test(password)} class:good={r.test(password)}>
            {r.test(password) ? "✅" : "❌"} {r.label}
          </li>
        {/each}
      </ul>
    {/if}

    <form on:submit|preventDefault={handleSubmit}>
      <label for="email">Email:</label>
      <input
        type="email"
        bind:value={email}
        id="email"
        required
        disabled={timerFinished || successLocked}
        on:focus={onEmailFocus}
      >

      <label for="password">Password:</label>
      <input
        type="text"
        bind:value={password}
        id="password"
        disabled={timerFinished || successLocked || !isValidEmail(email)}
        on:focus={startTimer}
        required
        autocomplete="off"
      >

      <input
        type="submit"
        value="Continue"
        disabled={timerFinished || successLocked}
      >
    </form>

    {#if timerFinished}
      <button class="tryAgain" type="button" on:click={tryAgain}>
        TRY AGAIN
      </button>
    {/if}
  </div>
</main>

<style>
  main{
    width: 100%;
    height: 100vh;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;

    position: relative;
    overflow: hidden;

    background-image: var(--pre-bg);
    background-size: cover;
    background-position: center;
  }

  main.running{
    background-image: none;
    background-color: #000;
  }

  main.finished{
    background-image: var(--finished-bg);
    background-size: cover;
    background-position: center;
    background-color: #000;
  }

  .fadeLayer{
    position: absolute;
    inset: 0;
    background-image: var(--fade-bg);
    background-size: cover;
    background-position: center;
    opacity: var(--fade-opacity);
    pointer-events: none;
    z-index: 0;
  }

  .container{
    border: solid 5px rgb(0, 0, 0);
    border-radius: 10px;
    width: 40%;
    height: 70%;
    background-color: #433944;
    margin: auto;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-evenly;

    position: relative;
    z-index: 1;
  }

  .container h1{
    color: rgb(255, 255, 255);
  }

  .timer{
    position: absolute;
    top: 12px;
    right: 12px;
    color: rgba(212, 24, 24);
    font-weight: 900;
    font-size: 30px;
    background: rgba(0,0,0,0.40);
    padding: 10px 14px;
    border-radius: 10px;
    z-index: 5;
    pointer-events: none;
  }

  .msgOverlay{
    position: absolute;
    top: 52%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: white;
    font-weight: 800;
    padding: 10px 14px;
    border-radius: 10px;
    max-width: 80%;
    text-align: center;
    z-index: 6;
    pointer-events: none;
  }
  .msgOverlay.error { background: rgba(255, 0, 0, 0.45); }
  .msgOverlay.success { background: rgba(0, 255, 0, 0.25); }

  .rulesOverlay{
    position: absolute;
    left: 16px;
    bottom: 16px;
    margin: 0;
    padding: 8px 10px;
    list-style: none;
    color: white;
    font-weight: 800;
    font-size: 12px;

    background: rgba(0,0,0,0.25);
    border-radius: 10px;

    max-width: 70%;
    max-height: 110px;
    overflow: auto;

    z-index: 6;
    pointer-events: none;
  }
  .rulesOverlay li { margin: 4px 0; }
  .rulesOverlay li.bad { opacity: 0.55; text-decoration: line-through; }
  .rulesOverlay li.good { opacity: 1; }

  .tryAgain{
    position: absolute;
    top: 58%;
    left: 50%;
    transform: translateX(-50%);
    z-index: 8;

    font-size: 16px;
    font-weight: 900;
    letter-spacing: 1px;

    padding: 8px 14px;
    border-radius: 10px;
    border: 3px solid black;

    background: rgb(212, 24, 24);
    color: white;
    cursor: pointer;
  }

  .tryAgain:hover{
    filter: brightness(1.05);
  }

  input:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
</style>
