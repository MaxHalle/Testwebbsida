<script>
  import { onMount } from "svelte";

  // Images
  import bg from "$lib/assets/IceGoal.png";
  import goalie from "$lib/assets/goalie.png";
  import puck from "$lib/assets/puck.png";
  import niceshot from "$lib/assets/nice-shot.png";

  // Audio files
  const music = "/audio/hockeyambience.mp3";
  const lvl_10 = "/audio/boss-music.mp3";
  const nice_shot_sfx = "/audio/nice-shot-sfx.mp3";
  const hockey_shot = "/audio/hockey-shot.mp3";

  // Volumes (0.0–1.0) — tweak these
  const MUSIC_VOL = 0.28;
  const LVL10_VOL = 0.32;
  const NICE_SHOT_VOL = 0.75;
  const SHOT_VOL = 0.65;

  // Goal hitbox
  const HB_W = 598, HB_H = 320, HB_OX = 0, HB_OY = -18;

  // Puck
  const PUCK_W = 140, PUCK_H = 110;
  const PUCK_BOTTOM = 28;

  // Shot tuning (KEEP)
  const SHOT_MS = 620;
  const ARC_PX = 0;
  const END_SCALE = 0.45;

  // Collision tuning (KEEP)
  const GOALIE_COL_W = 0.55;
  const GOALIE_COL_H = 0.80;
  const GOALIE_COL_OY = 18;
  const COLLIDE_AFTER_T = 0.22;

  // Cooldown + goalie speed
  const COOLDOWN_MS = 1500;
  const GOALIE_DEFAULT_MS = 3000;
  const GOALIE_STEP_MS = 300;

  // Nice shot
  const NICE_SHOT_MS = 1150;
  const NICE_W = 500;
  const NICE_OX = 0;
  const NICE_OY = -140;

  // DOM refs
  let mainEl, goalieEl, hitboxEl;

  // Game state
  let shooting = $state(false);
  let cooldown = $state(false);
  let goalStreak = $state(0);
  let goalieMs = $state(GOALIE_DEFAULT_MS);

  // Nice shot banner
  let showNiceShot = $state(false);
  let niceX = $state(0);
  let niceY = $state(0);

  // Puck state (center pos in <main> coords)
  let x = $state(0);
  let y = $state(0);
  let s = $state(1);

  // Timers / handles
  let resetTimer, cooldownTimer, niceShotTimer;
  let goalieAnim;

  // Audio refs (client only)
  let musicAudio, lvl10Audio, shotSfxBase, niceSfxBase;
  let bgmMode = "normal"; // "normal" | "lvl10"
  let musicResumeTime = 0;

  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  // ---------- Audio ----------
  function playClone(base, volume) {
    if (!base) return;
    const a = base.cloneNode(true);
    a.volume = volume;
    a.play().catch(() => {});
  }
  const playShotSfx = () => playClone(shotSfxBase, SHOT_VOL);
  const playNiceShotSfx = () => playClone(niceSfxBase, NICE_SHOT_VOL);

  function setBgmMode(mode) {
    if (mode === bgmMode) return;
    bgmMode = mode;

    if (mode === "lvl10") {
      if (musicAudio) {
        musicResumeTime = musicAudio.currentTime || 0;
        musicAudio.pause();
      }
      if (lvl10Audio) {
        lvl10Audio.currentTime = 0;
        lvl10Audio.volume = LVL10_VOL;
        lvl10Audio.play().catch(() => {});
      }
    } else {
      if (lvl10Audio) {
        lvl10Audio.pause();
        lvl10Audio.currentTime = 0;
      }
      if (musicAudio) {
        musicAudio.volume = MUSIC_VOL;
        musicAudio.currentTime = Number.isFinite(musicResumeTime) ? musicResumeTime : 0;
        musicAudio.play().catch(() => {});
      }
    }
  }

  function updateBgmForStreak() {
    setBgmMode(goalStreak >= 10 ? "lvl10" : "normal");
  }

  // Call on a user gesture (click) so autoplay isn’t blocked
  function ensureBgmPlaying() {
    updateBgmForStreak();
    const a = goalStreak >= 10 ? lvl10Audio : musicAudio;
    if (!a) return;
    if (a.paused) a.play().catch(() => {});
  }

  // ---------- Placement / UI ----------
  function placePuckAtStart() {
    const m = mainEl.getBoundingClientRect();
    x = m.width / 2;
    y = m.height - PUCK_BOTTOM - PUCK_H / 2;
    s = 1;
  }

  function schedulePuckReset(ms = 550) {
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => placePuckAtStart(), ms);
  }

  function startCooldown() {
    clearTimeout(cooldownTimer);
    cooldown = true;
    cooldownTimer = setTimeout(() => (cooldown = false), COOLDOWN_MS);
  }

  function setNiceShotAboveNet() {
    if (!mainEl || !hitboxEl) return;
    const mr = mainEl.getBoundingClientRect();
    const hb = hitboxEl.getBoundingClientRect();
    niceX = (hb.left + hb.right) / 2 - mr.left + NICE_OX;
    niceY = hb.top - mr.top + NICE_OY;
  }

  function flashNiceShot() {
    clearTimeout(niceShotTimer);
    setNiceShotAboveNet();
    showNiceShot = true;
    playNiceShotSfx();
    niceShotTimer = setTimeout(() => (showNiceShot = false), NICE_SHOT_MS);
  }

  // ---------- Collision ----------
  function pointInHitbox(clientX, clientY) {
    const hb = hitboxEl.getBoundingClientRect();
    return (
      clientX >= hb.left && clientX <= hb.right &&
      clientY >= hb.top && clientY <= hb.bottom
    );
  }

  function goalieColliderRelMain() {
    const gr = goalieEl.getBoundingClientRect();
    const mr = mainEl.getBoundingClientRect();

    const l = gr.left - mr.left;
    const t = gr.top - mr.top;
    const w = gr.width;
    const h = gr.height;

    const cx = l + w / 2;
    const cy = t + h / 2 + GOALIE_COL_OY;

    const cw = w * GOALIE_COL_W;
    const ch = h * GOALIE_COL_H;

    return { l: cx - cw / 2, r: cx + cw / 2, t: cy - ch / 2, b: cy + ch / 2 };
  }

  function puckHitsRect(scale, r) {
    const w = PUCK_W * scale;
    const h = PUCK_H * scale;

    const shrink = 0.78;
    const hw = (w * shrink) / 2;
    const hh = (h * shrink) / 2;

    const pl = x - hw, pr = x + hw;
    const pt = y - hh, pb = y + hh;

    return pl < r.r && pr > r.l && pt < r.b && pb > r.t;
  }

  // ---------- Goalie speed (no position reset) ----------
  function applyGoalieSpeed() {
    if (!goalieAnim) return;
    const safeMs = Math.max(1, goalieMs); // no cap; just avoids 0/negative
    goalieAnim.playbackRate = GOALIE_DEFAULT_MS / safeMs;
  }

  // ---------- Gameplay ----------
  function shootTo(clientX, clientY, canScore) {
    if (shooting || cooldown) return;

    ensureBgmPlaying();  // user gesture start/resume music
    playShotSfx();       // shot sound

    clearTimeout(resetTimer);
    shooting = true;

    const mr = mainEl.getBoundingClientRect();
    const sx = x, sy = y;
    const tx = clientX - mr.left;
    const ty = clientY - mr.top;

    const start = performance.now();

    const frame = (now) => {
      if (!shooting) return;

      let t = (now - start) / SHOT_MS;
      if (t > 1) t = 1;

      const e = easeOutCubic(t);

      const bx = lerp(sx, tx, e);
      const by = lerp(sy, ty, e);
      x = bx;
      y = by - ARC_PX * 4 * t * (1 - t);
      s = lerp(1, END_SCALE, e);

      // SAVE (only if this was a valid goal attempt)
      if (canScore && t > COLLIDE_AFTER_T) {
        const gcol = goalieColliderRelMain();
        if (puckHitsRect(s, gcol)) {
          shooting = false;

          goalStreak = 0;
          updateBgmForStreak();

          goalieMs = GOALIE_DEFAULT_MS;
          applyGoalieSpeed();

          schedulePuckReset(550);
          startCooldown();
          return;
        }
      }

      // Shot finished
      if (t >= 1) {
        shooting = false;

        if (canScore) {
          // GOAL
          goalStreak += 1;
          updateBgmForStreak();

          goalieMs = goalieMs - GOALIE_STEP_MS; // no cap
          applyGoalieSpeed();

          schedulePuckReset(550);
          startCooldown();
          setTimeout(() => flashNiceShot(), 60);
        } else {
          // MISS
          goalStreak = 0;
          updateBgmForStreak();

          goalieMs = GOALIE_DEFAULT_MS;
          applyGoalieSpeed();

          schedulePuckReset(550);
        }
        return;
      }

      requestAnimationFrame(frame);
    };

    requestAnimationFrame(frame);
  }

  function onHitboxPointer(e) {
    shootTo(e.clientX, e.clientY, true);
  }

  function onMainPointer(e) {
    if (shooting || cooldown) return;
    if (pointInHitbox(e.clientX, e.clientY)) return;
    shootTo(e.clientX, e.clientY, false);
  }

  onMount(() => {
    placePuckAtStart();
    setNiceShotAboveNet();

    // Audio init (client)
    musicAudio = new Audio(music);
    musicAudio.loop = true;
    musicAudio.volume = MUSIC_VOL;
    musicAudio.preload = "auto";

    lvl10Audio = lvl_10 ? new Audio(lvl_10) : null;
    if (lvl10Audio) {
      lvl10Audio.loop = true;
      lvl10Audio.volume = LVL10_VOL;
      lvl10Audio.preload = "auto";
    }

    shotSfxBase = hockey_shot ? new Audio(hockey_shot) : null;
    if (shotSfxBase) shotSfxBase.preload = "auto";

    niceSfxBase = nice_shot_sfx ? new Audio(nice_shot_sfx) : null;
    if (niceSfxBase) niceSfxBase.preload = "auto";

    // Attempt BGM (may be blocked until click; ensureBgmPlaying handles it on shots)
    updateBgmForStreak();
    ensureBgmPlaying();

    // Goalie movement (WAAPI)
    goalieAnim = goalieEl.animate(
      [
        { transform: "translate(-50%, -50%) translateX(-150px)" },
        { transform: "translate(-50%, -50%) translateX(150px)" }
      ],
      { duration: GOALIE_DEFAULT_MS, direction: "alternate", iterations: Infinity, easing: "ease-in-out", fill: "both" }
    );
    applyGoalieSpeed();

    const onResize = () => {
      if (!shooting) placePuckAtStart();
      setNiceShotAboveNet();
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      goalieAnim?.cancel();
      musicAudio?.pause();
      lvl10Audio?.pause();
    };
  });
</script>

<main
  bind:this={mainEl}
  class="goal"
  style={`--bg:url(${bg});`}
  on:pointerdown={onMainPointer}
>
  <div bind:this={goalieEl} class="goalie" style={`--goalie:url(${goalie});`} />

  {#if showNiceShot}
    <img
      class="nice-shot"
      src={niceshot}
      alt=""
      aria-hidden="true"
      style={`--nx:${niceX}px; --ny:${niceY}px; --nw:${NICE_W}px;`}
    />
  {/if}

  <img
    class="puck"
    src={puck}
    alt="puck"
    draggable="false"
    style={`--x:${x}px; --y:${y}px; --s:${s};`}
  />

  <button
    bind:this={hitboxEl}
    type="button"
    class="hitbox"
    disabled={shooting || cooldown}
    on:pointerdown|stopPropagation={onHitboxPointer}
    style={`--w:${HB_W}px; --h:${HB_H}px; --ox:${HB_OX}px; --oy:${HB_OY}px;`}
    aria-label="Goal hitbox"
  />

  <div class="streak">
    <div class="streak-title">Goal streak</div>
    <div class="streak-num">{goalStreak}</div>
  </div>
</main>

<style>
  .goal {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
    background-image: var(--bg);
    background-size: cover;
    background-position: center;
  }

  .goalie {
    width: 400px;
    height: 400px;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) translateX(0px);
    background-image: var(--goalie);
    background-size: cover;
    background-position: center;
    z-index: 5;
    pointer-events: none;
    will-change: transform;
  }

  .nice-shot {
    position: absolute;
    left: var(--nx);
    top: var(--ny);
    width: var(--nw);
    transform: translate(-50%, -50%);
    z-index: 18;
    image-rendering: pixelated;
    pointer-events: none;
    animation: popfade 1.75s ease-out forwards;
    filter: drop-shadow(0 6px 10px rgba(0,0,0,0.55));
  }

  @keyframes popfade {
    0%   { transform: translate(-50%, -50%) scale(0.95); opacity: 0; }
    20%  { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1.0);  opacity: 0; }
  }

  .puck {
    position: absolute;
    left: var(--x);
    top: var(--y);
    width: 140px;
    height: 110px;
    transform: translate(-50%, -50%) scale(var(--s));
    image-rendering: pixelated;
    z-index: 9;
    user-select: none;
    pointer-events: none;
  }

  .hitbox {
    position: absolute;
    top: 50%;
    left: 50%;
    width: var(--w);
    height: var(--h);
    transform: translate(-50%, -50%) translate(var(--ox), var(--oy));
    z-index: 10;
    background: transparent;
    border: 0;
    padding: 0;
    cursor: crosshair;
  }

  .streak {
    position: fixed;
    right: 18px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 50;
    padding: 14px 16px;
    border-radius: 16px;
    background: rgba(0,0,0,0.72);
    border: 2px solid rgba(255,255,255,0.22);
    box-shadow: 0 10px 22px rgba(0,0,0,0.45);
    color: white;
    text-align: right;
    pointer-events: none;
    min-width: 150px;
  }

  .streak-title {
    font-size: 13px;
    opacity: 0.95;
    font-weight: 800;
    letter-spacing: 0.3px;
    text-transform: uppercase;
  }

  .streak-num {
    margin-top: 6px;
    font-size: 42px;
    font-weight: 950;
    line-height: 1;
  }
</style>
