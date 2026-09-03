
/*
 * ESCAPE SCHOOL — Depois do Sinal
 * Jogo 2D top-down sem bibliotecas externas.
 * O áudio é criado com Web Audio API para o projeto funcionar no GitHub Pages
 * sem depender de arquivos de som ou caminhos externos.
 */

const COLS = 23;
const ROWS = 15;
const GAME_TIME = 15 * 60;

const MAP = [
  "#######################",
  "#.........#...........#",
  "#.###.###.#.###.###.#.#",
  "#.....................#",
  "#.###.#.#########.#.#.#",
  "#.....#.....#.....#...#",
  "#####.#####.#.#####.###",
  "#.........#.#.........#",
  "###.#####.#.#####.####",
  "#...#.....#.....#.....#",
  "#.#.#.###.#####.###.#.#",
  "#.#........#........#.#",
  "#.########.#.########.#",
  "#...................G#",
  "#######################"
];

const ITEMS = [
  { id: "notebook", label: "Caderno", icon: "📘", x: 2, y: 1 },
  { id: "key", label: "Chave", icon: "🔑", x: 17, y: 3 },
  { id: "card", label: "Cartão", icon: "🪪", x: 17, y: 13 }
];

const POWER_POSITIONS = [
  { x: 1, y: 3 },
  { x: 19, y: 11 }
];

const GHOST_STARTS = [
  { id: "inspector", x: 11, y: 7, color: "red", direction: { x: 1, y: 0 }, cooldown: 0 },
  { id: "monitor", x: 13, y: 7, color: "purple", direction: { x: -1, y: 0 }, cooldown: 0 }
];

const $ = (selector) => document.querySelector(selector);
const room = $("#room");
const messageText = $("#messageText");
const toast = $("#toast");

const state = {
  started: false,
  running: false,
  paused: false,
  ended: false,
  elapsed: 0,
  score: 0,
  lives: 3,
  soundOn: true,
  powerUntil: 0,
  lastTime: 0,
  lastGhostMove: 0,
  hintIndex: 0,
  player: { x: 1, y: 13, direction: { x: 1, y: 0 }, moving: false },
  ghosts: [],
  pellets: new Set(),
  pelletsTotal: 0,
  powers: new Set(),
  collectedItems: new Set(),
  interactionTarget: null
};

const keys = new Set();
let audioContext = null;
let ambientTimer = null;
let toastTimer = null;

function isInside(x, y) {
  return x >= 0 && x < COLS && y >= 0 && y < ROWS;
}

function cellAt(x, y) {
  if (!isInside(x, y)) return "#";
  return MAP[y][x];
}

function isWalkable(x, y) {
  return cellAt(Math.round(x), Math.round(y)) !== "#";
}

function cellKey(x, y) {
  return `${x},${y}`;
}

function formatScore(value) {
  return String(Math.max(0, value)).padStart(5, "0");
}

function formatTime(seconds) {
  const remaining = Math.max(0, Math.ceil(GAME_TIME - seconds));
  const minutes = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.remove("active"));
  const target = $(`#${id}`);
  if (target) target.classList.add("active");
}

function showToast(text) {
  toast.textContent = text;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function setMessage(text) {
  if (messageText) messageText.textContent = text;
}

function startAudio() {
  if (!state.soundOn) return;
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
  if (ambientTimer) return;
  ambientTimer = window.setInterval(() => {
    if (state.running && !state.paused && !state.ended) playTone(92, 0.06, "sine", 0.018);
  }, 4200);
}

function playTone(frequency, duration = 0.08, type = "square", volume = 0.035) {
  if (!state.soundOn || !audioContext) return;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function playCollectSound() {
  playTone(520, 0.06, "square", 0.04);
  window.setTimeout(() => playTone(780, 0.09, "square", 0.035), 55);
}

function playPowerSound() {
  [330, 440, 660, 880].forEach((note, index) => window.setTimeout(() => playTone(note, 0.08, "triangle", 0.04), index * 65));
}

function playHitSound() {
  playTone(130, 0.24, "sawtooth", 0.06);
}

function playWinSound() {
  [392, 523, 659, 784].forEach((note, index) => window.setTimeout(() => playTone(note, 0.16, "triangle", 0.05), index * 100));
}

function prepareBoard() {
  state.pellets.clear();
  state.powers.clear();
  state.collectedItems.clear();
  state.ghosts = GHOST_STARTS.map((ghost) => ({ ...ghost, direction: { ...ghost.direction } }));

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      if (isWalkable(x, y)) state.pellets.add(cellKey(x, y));
    }
  }

  [state.player, ...state.ghosts, ...ITEMS, ...POWER_POSITIONS].forEach((entity) => {
    if (entity && Number.isFinite(entity.x) && Number.isFinite(entity.y)) state.pellets.delete(cellKey(entity.x, entity.y));
  });
  state.pelletsTotal = state.pellets.size;

  POWER_POSITIONS.forEach((position) => {
    if (isWalkable(position.x, position.y)) state.powers.add(cellKey(position.x, position.y));
  });

  state.player = { x: 1, y: 13, direction: { x: 1, y: 0 }, moving: false };
  state.elapsed = 0;
  state.score = 0;
  state.lives = 3;
  state.powerUntil = 0;
  state.lastGhostMove = 0;
  state.ended = false;
  state.interactionTarget = null;
  updateHud();
}

function renderBoard() {
  const maze = document.createElement("div");
  maze.className = "maze";
  maze.setAttribute("aria-label", "Labirinto 2D da escola");

  for (let y = 0; y < ROWS; y += 1) {
    for (let x = 0; x < COLS; x += 1) {
      const tile = document.createElement("div");
      const value = cellAt(x, y);
      tile.className = `tile ${value === "#" ? "wall" : "floor"}`;
      if (value === "G") tile.classList.add("gate");
      if (state.pellets.has(cellKey(x, y))) {
        const pellet = document.createElement("span");
        pellet.className = "pellet";
        tile.appendChild(pellet);
      }
      if (state.powers.has(cellKey(x, y))) {
        const power = document.createElement("span");
        power.className = "power-pellet";
        tile.appendChild(power);
      }
      maze.appendChild(tile);
    }
  }

  const topLabel = document.createElement("span");
  topLabel.className = "map-label top";
  topLabel.textContent = "BLOCO A • CORREDOR";
  maze.appendChild(topLabel);
  const bottomLabel = document.createElement("span");
  bottomLabel.className = "map-label bottom";
  bottomLabel.textContent = "PORTÃO PRINCIPAL";
  maze.appendChild(bottomLabel);

  ITEMS.forEach((item) => {
    const collectible = document.createElement("div");
    collectible.id = `item-${item.id}`;
    collectible.className = `collectible ${item.id === "card" ? "access" : ""}`;
    collectible.style.left = `${((item.x + 0.5) / COLS) * 100}%`;
    collectible.style.top = `${((item.y + 0.5) / ROWS) * 100}%`;
    collectible.innerHTML = `<span>${item.icon}</span>`;
    collectible.setAttribute("aria-label", item.label);
    maze.appendChild(collectible);
  });

  const player = document.createElement("div");
  player.id = "player";
  player.className = "entity player";
  player.innerHTML = '<span class="player-body"></span>';
  maze.appendChild(player);

  state.ghosts.forEach((ghost) => {
    const ghostElement = document.createElement("div");
    ghostElement.id = `ghost-${ghost.id}`;
    ghostElement.className = `entity ghost ${ghost.color}`;
    ghostElement.innerHTML = '<span class="ghost-body"><span class="ghost-eyes"><i></i><i></i></span></span>';
    maze.appendChild(ghostElement);
  });

  room.replaceChildren(maze);
  renderEntities();
  updateInventory();
  updateProgress();
}

function setEntityPosition(element, x, y) {
  if (!element) return;
  element.style.left = `${((x + 0.5) / COLS) * 100}%`;
  element.style.top = `${((y + 0.5) / ROWS) * 100}%`;
}

function renderEntities() {
  setEntityPosition($("#player"), state.player.x, state.player.y);
  const player = $("#player");
  if (player) {
    player.classList.toggle("invincible", state.powerUntil > state.elapsed);
    player.classList.toggle("moving", state.player.moving);
  }
  state.ghosts.forEach((ghost) => setEntityPosition($(`#ghost-${ghost.id}`), ghost.x, ghost.y));
  ITEMS.forEach((item) => {
    const element = $(`#item-${item.id}`);
    if (element) element.classList.toggle("collected", state.collectedItems.has(item.id));
  });
}

function updateHud() {
  $("#timer").textContent = formatTime(state.elapsed);
  $("#score").textContent = formatScore(state.score);
  $("#lives").textContent = String(state.lives);
  $("#itemCount").textContent = `${state.collectedItems.size}/3`;
  $("#progressText").textContent = `${Math.round(progressPercent())}%`;
}

function progressPercent() {
  const itemProgress = state.collectedItems.size / ITEMS.length;
  const pelletProgress = state.pelletsTotal === 0 ? 1 : 1 - state.pellets.size / state.pelletsTotal;
  return Math.min(100, Math.round((itemProgress * 0.6 + pelletProgress * 0.4) * 100));
}

function updateProgress() {
  updateHud();
}

function updateInventory() {
  const inventory = $("#inventory");
  inventory.replaceChildren();
  ITEMS.forEach((item) => {
    const slot = document.createElement("div");
    slot.className = `item ${state.collectedItems.has(item.id) ? "found" : ""}`;
    slot.innerHTML = `<span>${state.collectedItems.has(item.id) ? item.icon : "·"}</span><small>${item.label}</small>`;
    inventory.appendChild(slot);
  });
}

function addParticles(x, y, color = "#ffd05c") {
  const maze = room.querySelector(".maze");
  if (!maze) return;
  for (let index = 0; index < 7; index += 1) {
    const particle = document.createElement("i");
    particle.className = "particle";
    particle.style.left = `${((x + 0.5) / COLS) * 100}%`;
    particle.style.top = `${((y + 0.5) / ROWS) * 100}%`;
    particle.style.background = color;
    particle.style.setProperty("--dx", `${(Math.random() - .5) * 40}px`);
    particle.style.setProperty("--dy", `${(Math.random() - .5) * 40}px`);
    maze.appendChild(particle);
    window.setTimeout(() => particle.remove(), 720);
  }
}

function attemptMove(entity, dx, dy, speed, delta) {
  const amount = speed * delta;
  let moved = false;
  if (dx !== 0) {
    const nextX = entity.x + dx * amount;
    if (isWalkable(nextX, entity.y) && isWalkable(nextX, Math.round(entity.y))) {
      entity.x = nextX;
      moved = true;
    }
  }
  if (dy !== 0) {
    const nextY = entity.y + dy * amount;
    if (isWalkable(entity.x, nextY) && isWalkable(Math.round(entity.x), nextY)) {
      entity.y = nextY;
      moved = true;
    }
  }
  return moved;
}

function getInputDirection() {
  let dx = 0;
  let dy = 0;
  if (keys.has("arrowleft") || keys.has("a")) dx -= 1;
  if (keys.has("arrowright") || keys.has("d")) dx += 1;
  if (keys.has("arrowup") || keys.has("w")) dy -= 1;
  if (keys.has("arrowdown") || keys.has("s")) dy += 1;
  if (dx !== 0 && dy !== 0) {
    if (Math.abs(state.player.direction.x) > 0) dy = 0;
    else dx = 0;
  }
  return { x: dx, y: dy };
}

function collectAtPlayer() {
  const current = cellKey(Math.round(state.player.x), Math.round(state.player.y));
  if (state.pellets.delete(current)) {
    state.score += 10;
    playTone(540, 0.035, "square", 0.018);
    addParticles(Math.round(state.player.x), Math.round(state.player.y));
  }
  if (state.powers.delete(current)) {
    state.score += 50;
    state.powerUntil = state.elapsed + 8;
    playPowerSound();
    showToast("Energia ativada: os inspetores estão vulneráveis!");
    addParticles(Math.round(state.player.x), Math.round(state.player.y), "#29e7d2");
  }
}

function nearestInteraction() {
  let nearest = null;
  let distance = Infinity;
  ITEMS.forEach((item) => {
    if (state.collectedItems.has(item.id)) return;
    const currentDistance = Math.hypot(state.player.x - item.x, state.player.y - item.y);
    if (currentDistance < distance) { nearest = { type: "item", item }; distance = currentDistance; }
  });
  const gateDistance = Math.hypot(state.player.x - 21, state.player.y - 13);
  if (gateDistance < distance) { nearest = { type: "gate" }; distance = gateDistance; }
  return distance <= 1.15 ? nearest : null;
}

function updateInteraction() {
  const next = nearestInteraction();
  state.interactionTarget = next;
  if (!next) {
    if (!state.paused && !state.ended) setMessage("Colete os pontos e encontre o cartão de acesso.");
    return;
  }
  if (next.type === "item") setMessage(`Pressione E para pegar ${next.item.label}.`);
  else if (state.collectedItems.has("card")) setMessage("Pressione E para abrir o portão principal.");
  else setMessage("O portão está trancado. Encontre o cartão de acesso.");
}

function interactCurrent() {
  if (!state.running || state.paused || state.ended) return;
  const target = state.interactionTarget || nearestInteraction();
  if (!target) return;
  if (target.type === "item") {
    state.collectedItems.add(target.item.id);
    state.score += 150;
    playCollectSound();
    addParticles(target.item.x, target.item.y, "#ffd05c");
    updateInventory();
    updateHud();
    if (target.item.id === "card") {
      $("#objectiveText").textContent = "Você tem o cartão. Vá até a saída verde.";
      $("#hintText").textContent = "A saída está no canto inferior direito.";
      showToast("Cartão de acesso encontrado!");
    } else {
      showToast(`${target.item.label} adicionado ao inventário.`);
    }
    updateInteraction();
    return;
  }
  if (target.type === "gate") {
    if (state.collectedItems.has("card")) winGame();
    else {
      showModal("Portão principal", "A luz vermelha pisca. O portão exige um cartão de acesso para abrir.");
      playTone(120, 0.16, "sawtooth", 0.04);
    }
  }
}

function validNeighbors(x, y) {
  return [
    { x: x + 1, y, dx: 1, dy: 0 },
    { x: x - 1, y, dx: -1, dy: 0 },
    { x, y: y + 1, dx: 0, dy: 1 },
    { x, y: y - 1, dx: 0, dy: -1 }
  ].filter((next) => isWalkable(next.x, next.y));
}

function ghostNextStep(ghost) {
  const start = { x: Math.round(ghost.x), y: Math.round(ghost.y) };
  const target = { x: Math.round(state.player.x), y: Math.round(state.player.y) };
  const queue = [start];
  const parents = new Map([[cellKey(start.x, start.y), null]]);
  while (queue.length) {
    const current = queue.shift();
    if (current.x === target.x && current.y === target.y) break;
    validNeighbors(current.x, current.y).forEach((next) => {
      const key = cellKey(next.x, next.y);
      if (!parents.has(key)) { parents.set(key, current); queue.push(next); }
    });
  }
  let cursor = target;
  if (!parents.has(cellKey(cursor.x, cursor.y))) {
    const options = validNeighbors(start.x, start.y);
    return options[Math.floor(Math.random() * Math.max(1, options.length))] || start;
  }
  while (parents.get(cellKey(cursor.x, cursor.y)) && cellKey(parents.get(cellKey(cursor.x, cursor.y)).x, parents.get(cellKey(cursor.x, cursor.y)).y) !== cellKey(start.x, start.y)) {
    cursor = parents.get(cellKey(cursor.x, cursor.y));
  }
  return cursor;
}

function moveGhosts(delta) {
  state.lastGhostMove += delta;
  const interval = state.powerUntil > state.elapsed ? 0.28 : 0.34;
  if (state.lastGhostMove < interval) return;
  state.lastGhostMove = 0;
  state.ghosts.forEach((ghost, index) => {
    const next = ghostNextStep(ghost);
    const distance = Math.hypot(next.x - ghost.x, next.y - ghost.y);
    if (distance > 0.01) {
      ghost.direction = { x: Math.sign(next.x - ghost.x), y: Math.sign(next.y - ghost.y) };
      ghost.x += ghost.direction.x * 0.72;
      ghost.y += ghost.direction.y * 0.72;
    } else {
      const options = validNeighbors(Math.round(ghost.x), Math.round(ghost.y));
      const random = options[(Math.floor(state.elapsed * 10) + index) % Math.max(1, options.length)];
      if (random) { ghost.x = random.x; ghost.y = random.y; }
    }
  });
}

function checkGhostCollisions() {
  for (const ghost of state.ghosts) {
    if (Math.hypot(state.player.x - ghost.x, state.player.y - ghost.y) > 0.62) continue;
    if (state.powerUntil > state.elapsed) {
      state.score += 250;
      ghost.x = 11 + Math.random() * 2;
      ghost.y = 7;
      playTone(190, 0.07, "square", 0.05);
      showToast("Inspetor despistado! +250 pontos");
      continue;
    }
    loseLife();
    break;
  }
}

function loseLife() {
  state.lives -= 1;
  playHitSound();
  const player = $("#player");
  if (player) player.classList.add("hit");
  if (state.lives <= 0) {
    window.setTimeout(() => loseGame("Os inspetores encontraram você três vezes."), 260);
    return;
  }
  showToast(`Cuidado! Você perdeu uma vida. Restam ${state.lives}.`);
  state.player.x = 1;
  state.player.y = 13;
  state.player.direction = { x: 1, y: 0 };
  state.ghosts = GHOST_STARTS.map((ghost) => ({ ...ghost, direction: { ...ghost.direction } }));
  updateHud();
  renderEntities();
}

function gameLoop(timestamp) {
  if (!state.lastTime) state.lastTime = timestamp;
  const delta = Math.min(0.05, (timestamp - state.lastTime) / 1000);
  state.lastTime = timestamp;
  if (state.running && !state.paused && !state.ended) {
    state.elapsed += delta;
    const input = getInputDirection();
    state.player.moving = input.x !== 0 || input.y !== 0;
    if (state.player.moving) {
      state.player.direction = { ...input };
      attemptMove(state.player, input.x, input.y, 5.3, delta);
    }
    collectAtPlayer();
    moveGhosts(delta);
    checkGhostCollisions();
    renderEntities();
    updateInteraction();
    updateHud();
    if (state.elapsed >= GAME_TIME) loseGame("O relógio chegou a zero antes de você alcançar o portão.");
  }
  window.requestAnimationFrame(gameLoop);
}

function startGame() {
  startAudio();
  prepareBoard();
  renderBoard();
  state.started = true;
  state.running = true;
  state.paused = false;
  showScreen("gameScreen");
  room.focus();
  $("#pauseOverlay").classList.add("hidden");
  setMessage("Use as setas ou WASD para explorar. Pressione E perto de um item.");
  showToast("O último sinal tocou. Encontre a saída!");
}

function togglePause(force) {
  if (!state.running || state.ended) return;
  state.paused = typeof force === "boolean" ? force : !state.paused;
  $("#pauseOverlay").classList.toggle("hidden", !state.paused);
  $("#pauseOverlay").setAttribute("aria-hidden", String(!state.paused));
  if (state.paused) setMessage("Jogo pausado.");
  else { setMessage("De volta ao corredor."); room.focus(); }
}

function resetGame() {
  startGame();
}

function winGame() {
  if (state.ended) return;
  state.ended = true;
  state.running = false;
  playWinSound();
  $("#finalScore").textContent = formatScore(state.score + Math.max(0, Math.floor(GAME_TIME - state.elapsed)) * 2);
  $("#winSummary").textContent = `Você encontrou ${state.collectedItems.size} itens, desviou dos inspetores e saiu com ${Math.ceil(GAME_TIME - state.elapsed)} segundos de sobra.`;
  showScreen("winScreen");
}

function loseGame(reason) {
  if (state.ended) return;
  state.ended = true;
  state.running = false;
  $("#loseSummary").textContent = reason;
  showScreen("loseScreen");
}

function showModal(title, text) {
  $("#modalContent").innerHTML = `<h3 id="modalTitle">${title}</h3><p>${text}</p><button class="primary-btn" id="modalAction">VOLTAR AO LABIRINTO</button>`;
  $("#modal").classList.remove("hidden");
  $("#modalAction").addEventListener("click", closeModal, { once: true });
}

function closeModal() {
  $("#modal").classList.add("hidden");
  room.focus();
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "e", "enter"].includes(key)) event.preventDefault();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(key)) keys.add(key);
  if (key === "e" || key === "enter") interactCurrent();
  if (key === " ") togglePause();
}

function handleKeyUp(event) {
  keys.delete(event.key.toLowerCase());
}

function bindEvents() {
  $("#startBtn").addEventListener("click", startGame);
  $("#restartBtn").addEventListener("click", resetGame);
  $("#playAgainBtn").addEventListener("click", startGame);
  $("#tryAgainBtn").addEventListener("click", startGame);
  $("#howBtn").addEventListener("click", () => showScreen("howScreen"));
  $("#resumeBtn").addEventListener("click", () => togglePause(false));
  $("#modalClose").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (event) => { if (event.target.id === "modal") closeModal(); });
  $("#soundBtn").addEventListener("click", () => {
    state.soundOn = !state.soundOn;
    $("#soundBtn").textContent = state.soundOn ? "♫ SOM" : "♫ MUDO";
    $("#soundBtn").setAttribute("aria-pressed", String(state.soundOn));
    if (state.soundOn) { startAudio(); playTone(600, 0.1, "triangle", 0.04); }
  });
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => showScreen(button.dataset.close === "howScreen" ? "startScreen" : button.dataset.close)));
  document.addEventListener("keydown", handleKeyDown);
  document.addEventListener("keyup", handleKeyUp);
  room.addEventListener("pointerdown", () => room.focus());
  document.querySelectorAll("[data-direction]").forEach((button) => {
    const direction = button.dataset.direction;
    const down = (event) => { event.preventDefault(); keys.add(direction === "up" ? "arrowup" : direction === "down" ? "arrowdown" : direction === "left" ? "arrowleft" : "arrowright"); };
    const up = (event) => { event.preventDefault(); keys.delete(direction === "up" ? "arrowup" : direction === "down" ? "arrowdown" : direction === "left" ? "arrowleft" : "arrowright"); };
    button.addEventListener("pointerdown", down);
    button.addEventListener("pointerup", up);
    button.addEventListener("pointerleave", up);
    button.addEventListener("pointercancel", up);
  });
}

bindEvents();
prepareBoard();
window.requestAnimationFrame(gameLoop);
