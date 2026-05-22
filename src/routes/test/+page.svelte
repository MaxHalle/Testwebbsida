<script>
  import { onMount, onDestroy } from "svelte";

  // --- Asset paths (replace with your real files) ---
  const bg_URL = "/src/lib/assets/IceGoal.png";
  const goalie_URL = "/src/lib/assets/goalie.png"; // optional sprite / single-frame
  const puck_URL = "/src/lib/assets/puck.png";
  const stick_URL = "/src/lib/assets/stick.png";

  // Audio placeholders (replace with real files)
  const music_URL = "/src/lib/assets/music.mp3";
  const nice_shot_sfx_URL = "/src/lib/assets/nice_shot.wav";
  const defeat_sfx_URL = "/src/lib/assets/defeat.wav";
  const game_over_URL = "/src/lib/assets/game_over.wav";

  // --- Game configuration (tweak these) ---
  const CANVAS_RATIO = 16 / 9;
  const GOAL_LINE_Y_RATIO = 0.15; // how far from top the goal line is (0..1)
  const PUCK_SPEED = 1400; // pixels/second (will scale with canvas)
  const GOALIE_SPEED = 600; // px/sec
  const GOALIE_WIDTH = 180; // base size (will scale)
  const GOALIE_HEIGHT = 220;
  const RELOAD_MS = 600; // time between shots
  const MAX_LIVES = 5;

  // --- Game state ---
  let canvas;
  let ctx;
  let canvasWidth = 1280;
  let canvasHeight = Math.round(canvasWidth / CANVAS_RATIO);

  let images = {};
  let audio = {};
  let loaded = false;

  let mouse = { x: 0, y: 0, inside: false };
  let aimPoint = { x: 0, y: 0 };

  let score = 0;
  let lives = MAX_LIVES;
  let lastShotAt = 0;
  let isPlaying = false;
  let message = "";

  // Puck object when a shot is in-flight:
  let puck = null; // { x, y, vx, vy, radius, image, active }

  // Goalie object:
  let goalie = {
    x: 0,
    y: 0,
    w: GOALIE_WIDTH,
    h: GOALIE_HEIGHT,
    targetX: 0,
    state: "idle", // idle, diving, saved, stunned
    stunUntil: 0
  };

  // Timing + loop
  let rafId;
  let lastTime = 0;

  // --- Helpers ---
  function loadImage(src) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img);
      img.onerror = rej;
      img.src = src;
    });
  }
  function loadAudio(src, loop = false) {
    const a = new Audio(src);
    a.loop = loop;
    a.preload = "auto";
    return a;
  }

  async function loadAssets() {
    const promises = [
      loadImage(bg_URL).then((img) => (images.bg = img)),
      loadImage(goalie_URL).then((img) => (images.goalie = img)).catch(() => (images.goalie = null)),
      loadImage(puck_URL).then((img) => (images.puck = img)).catch(() => (images.puck = null)),
      loadImage(stick_URL).then((img) => (images.stick = img)).catch(() => (images.stick = null))
    ];
    await Promise.all(promises);

    // audio (missing files should not break)
    try { audio.music = loadAudio(music_URL, true); } catch {}
    try { audio.nice = loadAudio(nice_shot_sfx_URL); } catch {}
    try { audio.defeat = loadAudio(defeat_sfx_URL); } catch {}
    try { audio.gameOver = loadAudio(game_over_URL); } catch {}

    loaded = true;
  }

  function resizeCanvas() {
    // make canvas fill container while keeping ratio
    const parent = canvas.parentElement;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    // fit by width
    canvasWidth = w;
    canvasHeight = Math.round(w / CANVAS_RATIO);
    if (canvasHeight > h) {
      canvasHeight = h;
      canvasWidth = Math.round(h * CANVAS_RATIO);
    }
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // reposition goalie
    goalie.w = Math.round(GOALIE_WIDTH * (canvasWidth / 1280));
    goalie.h = Math.round(GOALIE_HEIGHT * (canvasWidth / 1280));
    const goalLineY = Math.round(canvasHeight * GOAL_LINE_Y_RATIO);
    goalie.y = goalLineY + (goalie.h / 2);
    goalie.x = canvasWidth / 2;
  }

  function startGame() {
    score = 0;
    lives = MAX_LIVES;
    isPlaying = true;
    message = "";
    if (audio.music) {
      audio.music.currentTime = 0;
      audio.music.play().catch(() => {});
    }
  }

  function endGame() {
    isPlaying = false;
    message = "Game Over — click to restart";
    if (audio.gameOver) audio.gameOver.play().catch(() => {});
    stopLoop();
  }

  // circle vs rect collision (puck is a circle)
  function circleRectColl(circle, rect) {
    const cx = circle.x;
    const cy = circle.y;
    const rx = rect.x - rect.w / 2;
    const ry = rect.y - rect.h / 2;
    const nearestX = Math.max(rx, Math.min(cx, rx + rect.w));
    const nearestY = Math.max(ry, Math.min(cy, ry + rect.h));
    const dx = cx - nearestX;
    const dy = cy - nearestY;
    return dx * dx + dy * dy <= circle.r * circle.r;
  }

  // --- Shooting & collision handling ---
  function spawnPuck(targetX, targetY) {
    if (!isPlaying) startGame();
    const now = performance.now();
    if (now - lastShotAt < RELOAD_MS) return;
    lastShotAt = now;

    // start from bottom center
    const startX = canvasWidth / 2;
    const startY = canvasHeight - 80 * (canvasWidth / 1280);

    // direction
    const dx = targetX - startX;
    const dy = targetY - startY;
    const dist = Math.hypot(dx, dy);
    const speed = PUCK_SPEED * (canvasWidth / 1280);
    const vx = (dx / dist) * speed;
    const vy = (dy / dist) * speed;

    puck = {
      x: startX,
      y: startY,
      vx,
      vy,
      r: 16 * (canvasWidth / 1280),
      image: images.puck,
      active: true,
      startTime: now
    };

    // set goalie reaction target (goalie tries to move to intercept)
    goalie.targetX = clamp(targetX, goalie.w / 2, canvasWidth - goalie.w / 2);

    // small camera/audio feedback
    if (audio.nice) audio.nice.play().catch(() => {});
  }

  // --- Game loop ---
  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  function update(dt) {
    // dt in seconds
    // goalie movement
    if (performance.now() < goalie.stunUntil) {
      // stunned (after diving)
    } else {
      // move goalie toward targetX, but limit speed
      const dx = goalie.targetX - goalie.x;
      const maxMove = GOALIE_SPEED * (canvasWidth / 1280) * dt;
      if (Math.abs(dx) < maxMove) goalie.x = goalie.targetX;
      else goalie.x += Math.sign(dx) * maxMove;
    }

    // update puck
    if (puck && puck.active) {
      puck.x += puck.vx * dt;
      puck.y += puck.vy * dt;

      // check collision with goalie
      const rect = { x: goalie.x, y: goalie.y, w: goalie.w, h: goalie.h };
      if (circleRectColl({ x: puck.x, y: puck.y, r: puck.r }, rect)) {
        // saved
        puck.active = false;
        // goalie "save" animation: stun briefly
        goalie.stunUntil = performance.now() + 500;
        if (audio.defeat) audio.defeat.play().catch(() => {});
        // no points, maybe decrease life
        lives -= 1;
        if (lives <= 0) {
          endGame();
        }
        return;
      }

      // check if puck crossed goal line (y < goalLine)
      const goalLineY = canvasHeight * GOAL_LINE_Y_RATIO;
      if (puck.y <= goalLineY) {
        // goal!
        puck.active = false;
        score += 1;
        // small reaction: goalie tries to jump but too late
        goalie.stunUntil = performance.now() + 350;
        message = "Goal!";
        setTimeout(() => (message = ""), 700);
      }

      // If puck leaves canvas at sides or bottom, deactivate
      if (puck.x < -50 || puck.x > canvasWidth + 50 || puck.y > canvasHeight + 50) {
        puck.active = false;
      }
    }
  }

  function draw() {
    // background
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    if (images.bg) {
      // cover the canvas
      ctx.drawImage(images.bg, 0, 0, canvasWidth, canvasHeight);
    } else {
      // fallback background
      ctx.fillStyle = "#0aa";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    }

    // draw goal line
    const goalLineY = Math.round(canvasHeight * GOAL_LINE_Y_RATIO);
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvasWidth * 0.1, goalLineY);
    ctx.lineTo(canvasWidth * 0.9, goalLineY);
    ctx.stroke();

    // draw goalie (centered on goalie.x, goalie.y)
    ctx.save();
    const gx = goalie.x - goalie.w / 2;
    const gy = goalie.y - goalie.h / 2;
    if (images.goalie) {
      ctx.drawImage(images.goalie, gx, gy, goalie.w, goalie.h);
    } else {
      // fallback goalie rectangle with a simple "dive" tilt when stunned
      ctx.translate(goalie.x, goalie.y);
      if (performance.now() < goalie.stunUntil) {
        ctx.rotate(-0.25); // tilt on save
      }
      ctx.fillStyle = "#222";
      ctx.fillRect(-goalie.w / 2, -goalie.h / 2, goalie.w, goalie.h);
      ctx.restore();
    }

    // draw puck
    if (puck && puck.active) {
      if (puck.image) {
        ctx.drawImage(puck.image, puck.x - puck.r, puck.y - puck.r, puck.r * 2, puck.r * 2);
      } else {
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(puck.x, puck.y, puck.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // draw aim reticle
    if (mouse.inside) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mouse.x - 20, mouse.y);
      ctx.lineTo(mouse.x + 20, mouse.y);
      ctx.moveTo(mouse.x, mouse.y - 20);
      ctx.lineTo(mouse.x, mouse.y + 20);
      ctx.stroke();
    }

    // UI overlays (score, lives)
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(12, 12, 220, 64);
    ctx.fillStyle = "#fff";
    ctx.font = `${20 * (canvasWidth / 1280)}px Arial`;
    ctx.fillText(`Score: ${score}`, 24, 36);
    ctx.fillText(`Lives: ${lives}`, 24, 62);

    // message
    if (message) {
      ctx.font = `${36 * (canvasWidth / 1280)}px Arial`;
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.textAlign = "center";
      ctx.fillText(message, canvasWidth / 2, canvasHeight / 2);
      ctx.textAlign = "start";
    }
  }

  function loop(t) {
    if (!lastTime) lastTime = t;
    const dt = (t - lastTime) / 1000;
    lastTime = t;

    update(dt);
    draw();

    rafId = requestAnimationFrame(loop);
  }

  function startLoop() {
    if (!rafId) {
      lastTime = 0;
      rafId = requestAnimationFrame(loop);
    }
  }
  function stopLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // --- Event handlers ---
  function handleMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - rect.left) * (canvas.width / rect.width);
    mouse.y = (e.clientY - rect.top) * (canvas.height / rect.height);
    mouse.inside = true;
  }

  function handleMouseLeave() {
    mouse.inside = false;
  }

  function handleClick(e) {
    // If not playing, clicking restarts
    if (!isPlaying) {
      startGame();
      startLoop();
      return;
    }
    // shoot toward mouse
    const rect = canvas.getBoundingClientRect();
    const tx = (e.clientX - rect.left) * (canvas.width / rect.width);
    const ty = (e.clientY - rect.top) * (canvas.height / rect.height);
    spawnPuck(tx, ty);

    // ensure loop is running
    startLoop();
  }

  // lifecycle
  onMount(async () => {
    await loadAssets();
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("click", handleClick);

    // default UI values
    goalie.targetX = canvasWidth / 2;
    goalie.x = canvasWidth / 2;

    // start loop but don't auto-start music/game
    startLoop();
  });

  onDestroy(() => {
    window.removeEventListener("resize", resizeCanvas);
    canvas && canvas.removeEventListener("mousemove", handleMouseMove);
    canvas && canvas.removeEventListener("mouseleave", handleMouseLeave);
    canvas && canvas.removeEventListener("click", handleClick);
    stopLoop();
    if (audio.music) audio.music.pause();
  });
</script>

<main class="game-wrapper">
  <canvas bind:this={canvas} class="game-canvas"></canvas>

  <div class="hud">
    <div class="hint">
      Aim where the goalie isn't, click to shoot. <strong>Click to start/restart</strong>
    </div>
  </div>
</main>

<style>
  .game-wrapper {
    width: 100%;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    background: #0b2a3a; /* fallback */
  }
  canvas.game-canvas {
    /* responsive canvas placed center */
    max-width: 100%;
    max-height: 100%;
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
    border-radius: 8px;
    cursor: crosshair;
  }
  .hud {
    position: absolute;
    bottom: 20px;
    left: 20px;
    color: #fff;
    font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
    pointer-events: none;
  }
  .hint {
    background: rgba(0,0,0,0.5);
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 14px;
  }
</style>