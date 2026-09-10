/* =========================================================
   ESCAPE DA ESCOLA
   Jogo feito somente com HTML + CSS + JavaScript + Canvas
   SEM THREE.JS
========================================================= */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const howScreen = document.getElementById("howScreen");
const game = document.getElementById("game");

const startButton = document.getElementById("startButton");
const howButton = document.getElementById("howButton");
const backButton = document.getElementById("backButton");

const objectiveElement = document.getElementById("objective");
const timerElement = document.getElementById("timer");
const promptElement = document.getElementById("interactionPrompt");
const messageElement = document.getElementById("message");

const inventoryElement = document.getElementById("inventoryItems");

const joystick = document.getElementById("joystick");
const joystickStick = document.getElementById("joystickStick");

const interactButton = document.getElementById("interactButton");
const runButton = document.getElementById("runButton");

const codeModal = document.getElementById("codeModal");
const codeInput = document.getElementById("codeInput");

const openSafeButton = document.getElementById("openSafeButton");
const cancelCodeButton = document.getElementById("cancelCodeButton");

const winScreen = document.getElementById("winScreen");
const loseScreen = document.getElementById("loseScreen");

const restartWin = document.getElementById("restartWin");
const restartLose = document.getElementById("restartLose");


/* =========================================================
   CANVAS
========================================================= */

let width = window.innerWidth;
let height = window.innerHeight;

function resizeCanvas() {

  width = window.innerWidth;
  height = window.innerHeight;

  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;

  canvas.style.width = width + "px";
  canvas.style.height = height + "px";

  ctx.setTransform(
    pixelRatio,
    0,
    0,
    pixelRatio,
    0,
    0
  );
}

window.addEventListener("resize", resizeCanvas);

resizeCanvas();


/* =========================================================
   ESTADO DO JOGO
========================================================= */

let playing = false;
let finished = false;

let timeLeft = 15 * 60;

let player = {
  x: 0,
  y: 12,
  angle: Math.PI
};

let joystickX = 0;
let joystickY = 0;

let running = false;

const keys = {};


/* =========================================================
   MAPA
========================================================= */

const map = {

  width: 30,
  height: 34,

  walls: [

    // paredes externas
    {
      x: 0,
      y: -17,
      width: 30,
      height: 1
    },

    {
      x: -15,
      y: 0,
      width: 1,
      height: 34
    },

    {
      x: 15,
      y: 0,
      width: 1,
      height: 34
    },

    {
      x: 0,
      y: 17,
      width: 30,
      height: 1
    },

    // parede interna esquerda
    {
      x: -7,
      y: -7,
      width: 1,
      height: 13
    },

    // parede interna direita
    {
      x: 7,
      y: 7,
      width: 1,
      height: 13
    }

  ]

};


/* =========================================================
   OBJETOS
========================================================= */

const objects = [

  {
    type: "clue1",
    x: -10,
    y: -10,
    color: "#4c79ff",
    name: "Pista azul",
    active: true
  },

  {
    type: "key",
    x: 6,
    y: -11,
    color: "#ffd447",
    name: "Chave",
    active: true
  },

  {
    type: "clue2",
    x: 11,
    y: -8,
    color: "#51df87",
    name: "Pista 2",
    active: true
  },

  {
    type: "final",
    x: -9,
    y: 10,
    color: "#eeeeee",
    name: "Pista final",
    active: true
  },

  {
    type: "safe",
    x: 10,
    y: 10,
    color: "#df5368",
    name: "Cofre",
    active: true
  }

];


/* =========================================================
   INVENTÁRIO
========================================================= */

const inventory = [];

function addInventory(name) {

  if (inventory.includes(name)) {
    return;
  }

  inventory.push(name);

  const item = document.createElement("div");

  item.className = "inventory-item";

  item.textContent = name;

  inventoryElement.appendChild(item);
}


/* =========================================================
   OBJETIVO
========================================================= */

function setObjective(text) {

  objectiveElement.textContent = text;
}


/* =========================================================
   MENSAGEM
========================================================= */

let messageTimeout;

function showMessage(text) {

  messageElement.textContent = text;

  messageElement.style.opacity = "1";

  clearTimeout(messageTimeout);

  messageTimeout = setTimeout(() => {

    messageElement.style.opacity = "0";

  }, 2800);

}


/* =========================================================
   COLISÃO
========================================================= */

function collision(x, y) {

  const radius = 0.45;

  if (
    x < -14.3 ||
    x > 14.3 ||
    y < -16.3 ||
    y > 16.3
  ) {

    return true;
  }


  for (const wall of map.walls) {

    if (
      x > wall.x - wall.width / 2 - radius &&
      x < wall.x + wall.width / 2 + radius &&
      y > wall.y - wall.height / 2 - radius &&
      y < wall.y + wall.height / 2 + radius
    ) {

      return true;
    }

  }

  return false;
}


/* =========================================================
   DISTÂNCIA
========================================================= */

function distance(a, b) {

  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2)
  );

}


/* =========================================================
   OBJETO MAIS PRÓXIMO
========================================================= */

function getNearestObject() {

  let nearest = null;

  let nearestDistance = 2;

  for (const object of objects) {

    if (!object.active) {
      continue;
    }

    const d = distance(player, object);

    if (d < nearestDistance) {

      nearest = object;

      nearestDistance = d;

    }

  }

  return nearest;
}


/* =========================================================
   INTERAÇÃO
========================================================= */

function interact() {

  if (!playing || finished) {
    return;
  }

  const object = getNearestObject();

  if (!object) {

    showMessage(
      "Aproxime-se de um objeto brilhante."
    );

    return;
  }


  /* COFRE */

  if (object.type === "safe") {

    if (!inventory.includes("Chave")) {

      showMessage(
        "🔒 Você precisa encontrar a chave primeiro."
      );

      return;
    }

    codeModal.classList.remove("hidden");

    codeInput.value = "";

    setTimeout(() => {

      codeInput.focus();

    }, 100);

    return;
  }


  /* PISTA 1 */

  if (object.type === "clue1") {

    object.active = false;

    addInventory("Pista 1");

    setObjective(
      "Encontre a chave azul."
    );

    showMessage(
      "📄 A pista diz: procure a chave azul."
    );

    return;
  }


  /* CHAVE */

  if (object.type === "key") {

    object.active = false;

    addInventory("Chave");

    setObjective(
      "Encontre a pista nos armários."
    );

    showMessage(
      "🔑 Você encontrou a chave!"
    );

    return;
  }


  /* PISTA 2 */

  if (object.type === "clue2") {

    object.active = false;

    addInventory("Pista 2");

    setObjective(
      "Encontre a pista final."
    );

    showMessage(
      "📝 A pista revela o número 42."
    );

    return;
  }


  /* PISTA FINAL */

  if (object.type === "final") {

    object.active = false;

    addInventory("Pista final");

    setObjective(
      "Vá até o cofre e use o código."
    );

    showMessage(
      "📜 A pista final revela 71. Código: 4271."
    );

    return;
  }

}


/* =========================================================
   CÓDIGO DO COFRE
========================================================= */

function openSafe() {

  const code = codeInput.value.trim();

  if (code === "4271") {

    codeModal.classList.add("hidden");

    playing = false;

    finished = true;

    winScreen.classList.remove("hidden");

    return;
  }


  showMessage(
    "❌ Código incorreto."
  );

  codeInput.select();
}


openSafeButton.addEventListener(
  "click",
  openSafe
);


cancelCodeButton.addEventListener(
  "click",
  () => {

    codeModal.classList.add("hidden");

  }
);


codeInput.addEventListener(
  "keydown",
  event => {

    if (event.key === "Enter") {

      openSafe();

    }

  }
);


/* =========================================================
   MOVIMENTO
========================================================= */

function updateMovement(delta) {

  let forward = 0;
  let strafe = 0;


  if (keys["w"]) {
    forward += 1;
  }

  if (keys["s"]) {
    forward -= 1;
  }

  if (keys["a"]) {
    strafe -= 1;
  }

  if (keys["d"]) {
    strafe += 1;
  }


  forward += -joystickY;
  strafe += joystickX;


  const magnitude = Math.sqrt(
    forward * forward +
    strafe * strafe
  );


  if (magnitude > 1) {

    forward /= magnitude;
    strafe /= magnitude;

  }


  let speed = running ? 5.5 : 3.8;

  speed *= delta;


  const sin = Math.sin(player.angle);
  const cos = Math.cos(player.angle);


  const moveX =
    (sin * forward +
    cos * strafe) *
    speed;


  const moveY =
    (cos * forward -
    sin * strafe) *
    speed;


  const newX = player.x + moveX;
  const newY = player.y + moveY;


  if (!collision(newX, player.y)) {

    player.x = newX;

  }


  if (!collision(player.x, newY)) {

    player.y = newY;

  }

}


/* =========================================================
   DESENHO 3D FAKE / RAYCASTING
========================================================= */

const FOV = Math.PI / 3;

const RAYS = 180;

function normalizeAngle(angle) {

  while (angle < -Math.PI) {
    angle += Math.PI * 2;
  }

  while (angle > Math.PI) {
    angle -= Math.PI * 2;
  }

  return angle;

}


/* =========================================================
   RAIO
========================================================= */

function castRay(angle) {

  const step = 0.035;

  let x = player.x;
  let y = player.y;

  for (
    let distance = 0;
    distance < 30;
    distance += step
  ) {

    x += Math.sin(angle) * step;
    y += Math.cos(angle) * step;


    if (collision(x, y)) {

      return distance;

    }

  }


  return 30;
}


/* =========================================================
   PROJEÇÃO DOS OBJETOS
========================================================= */

function projectObject(object) {

  if (!object.active) {
    return null;
  }


  const dx =
    object.x - player.x;

  const dy =
    object.y - player.y;


  const distanceValue =
    Math.sqrt(
      dx * dx +
      dy * dy
    );


  let angle =
    Math.atan2(
      dx,
      dy
    );


  angle =
    normalizeAngle(
      angle - player.angle
    );


  if (
    Math.abs(angle) >
    FOV / 2
  ) {

    return null;

  }


  const screenX =
    width / 2 +
    (angle / (FOV / 2)) *
    (width / 2);


  const size =
    Math.min(
      height,
      500 / Math.max(distanceValue, 0.2)
    );


  const screenY =
    height / 2 -
    size * 0.1;


  return {
    x: screenX,
    y: screenY,
    size,
    distance: distanceValue
  };

}


/* =========================================================
   DESENHAR CÉU
========================================================= */

function drawSky() {

  const sky = ctx.createLinearGradient(
    0,
    0,
    0,
    height / 2
  );

  sky.addColorStop(
    0,
    "#070917"
  );

  sky.addColorStop(
    1,
    "#242744"
  );


  ctx.fillStyle = sky;

  ctx.fillRect(
    0,
    0,
    width,
    height / 2
  );

}


/* =========================================================
   DESENHAR CHÃO
========================================================= */

function drawFloor() {

  const floor =
    ctx.createLinearGradient(
      0,
      height / 2,
      0,
      height
    );


  floor.addColorStop(
    0,
    "#25283a"
  );

  floor.addColorStop(
    1,
    "#080a12"
  );


  ctx.fillStyle = floor;

  ctx.fillRect(
    0,
    height / 2,
    width,
    height / 2
  );


  /* LINHAS DE PERSPECTIVA */

  ctx.strokeStyle =
    "rgba(255,255,255,0.07)";

  ctx.lineWidth = 1;


  for (
    let i = -10;
    i <= 10;
    i++
  ) {

    const x =
      width / 2 +
      i * (width / 14);


    ctx.beginPath();

    ctx.moveTo(
      width / 2,
      height / 2
    );

    ctx.lineTo(
      x,
      height
    );

    ctx.stroke();

  }


  for (
    let i = 1;
    i <= 9;
    i++
  ) {

    const y =
      height / 2 +
      Math.pow(
        i / 9,
        1.7
      ) *
      height / 2;


    ctx.beginPath();

    ctx.moveTo(
      0,
      y
    );

    ctx.lineTo(
      width,
      y
    );

    ctx.stroke();

  }

}


/* =========================================================
   PAREDES
========================================================= */

function drawWalls() {

  const wallData = [];


  for (
    let ray = 0;
    ray < RAYS;
    ray++
  ) {

    const rayAngle =
      player.angle -
      FOV / 2 +
      (ray / RAYS) * FOV;


    let distanceValue =
      castRay(rayAngle);


    /* CORREÇÃO DO EFEITO FISH EYE */

    distanceValue *=
      Math.cos(
        rayAngle -
        player.angle
      );


    wallData.push(
      distanceValue
    );


    const wallHeight =
      Math.min(
        height * 1.5,
        height /
        Math.max(
          distanceValue,
          0.1
        )
      );


    const sliceWidth =
      width / RAYS + 1;


    const x =
      ray * sliceWidth;


    const top =
      height / 2 -
      wallHeight / 2;


    let brightness =
      1 -
      distanceValue / 30;


    brightness =
      Math.max(
        0.15,
        brightness
      );


    const value =
      Math.floor(
        45 +
        brightness * 65
      );


    ctx.fillStyle =
      `rgb(${value}, ${value + 3}, ${value + 15})`;


    ctx.fillRect(
      x,
      top,
      sliceWidth + 1,
      wallHeight
    );


    /* luzes do corredor */

    if (
      ray % 30 === 0 &&
      distanceValue < 18
    ) {

      ctx.fillStyle =
        "rgba(210,220,255,0.18)";

      ctx.fillRect(
        x,
        top,
        sliceWidth + 1,
        4
      );

    }

  }

}


/* =========================================================
   DESENHAR OBJETOS
========================================================= */

function drawObjects() {

  const visible = [];


  for (
    const object of objects
  ) {

    const projected =
      projectObject(object);


    if (projected) {

      visible.push({
        object,
        projected
      });

    }

  }


  visible.sort(
    (a,b) =>
      b.projected.distance -
      a.projected.distance
  );


  for (
    const item of visible
  ) {

    const object =
      item.object;

    const p =
      item.projected;


    const radius =
      Math.max(
        7,
        p.size * 0.18
      );


    /* brilho */

    const glow =
      ctx.createRadialGradient(
        p.x,
        p.y,
        0,
        p.x,
        p.y,
        radius * 2
      );


    glow.addColorStop(
      0,
      object.color + "aa"
    );

    glow.addColorStop(
      1,
      object.color + "00"
    );


    ctx.fillStyle = glow;

    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      radius * 2,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /* objeto */

    ctx.fillStyle =
      object.color;


    ctx.beginPath();

    ctx.arc(
      p.x,
      p.y,
      radius,
      0,
      Math.PI * 2
    );

    ctx.fill();


    /* contorno */

    ctx.strokeStyle =
      "#ffffffaa";

    ctx.lineWidth = 2;

    ctx.stroke();


    /* símbolo */

    ctx.fillStyle =
      "#ffffff";

    ctx.font =
      `bold ${Math.max(
        12,
        radius
      )}px Arial`;

    ctx.textAlign =
      "center";

    ctx.textBaseline =
      "middle";


    let symbol = "?";


    if (object.type === "key") {
      symbol = "🔑";
    }

    if (object.type === "safe") {
      symbol = "🔐";
    }


    ctx.fillText(
      symbol,
      p.x,
      p.y
    );

  }

}


/* =========================================================
   PORTA DE SAÍDA
========================================================= */

function drawExit() {

  const dx =
    0 - player.x;

  const dy =
    -16.4 - player.y;


  const distanceValue =
    Math.sqrt(
      dx * dx +
      dy * dy
    );


  let angle =
    Math.atan2(
      dx,
      dy
    );


  angle =
    normalizeAngle(
      angle - player.angle
    );


  if (
    Math.abs(angle) >
    FOV / 2
  ) {

    return;

  }


  const screenX =
    width / 2 +
    (angle / (FOV / 2)) *
    (width / 2);


  const doorHeight =
    Math.min(
      height * 1.2,
      height /
      Math.max(
        distanceValue,
        0.1
      )
    );


  const doorWidth =
    doorHeight * 0.55;


  const top =
    height / 2 -
    doorHeight / 2;


  ctx.fillStyle =
    "#5a1725";


  ctx.fillRect(
    screenX - doorWidth / 2,
    top,
    doorWidth,
    doorHeight
  );


  ctx.strokeStyle =
    "#e15168";

  ctx.lineWidth = 3;


  ctx.strokeRect(
    screenX - doorWidth / 2,
    top,
    doorWidth,
    doorHeight
  );


  if (
    distanceValue < 12
  ) {

    ctx.fillStyle =
      "#ff8c9c";

    ctx.font =
      "bold 15px Arial";

    ctx.textAlign =
      "center";

    ctx.fillText(
      "SAÍDA TRANCADA",
      screenX,
      top - 15
    );

  }

}


/* =========================================================
   DESENHAR ESCOLA
========================================================= */

function drawGame() {

  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  drawSky();

  drawFloor();

  drawWalls();

  drawExit();

  drawObjects();

}


/* =========================================================
   ATUALIZAR PROMPT
========================================================= */

function updatePrompt() {

  const nearest =
    getNearestObject();


  if (nearest) {

    promptElement.style.opacity =
      "1";

    promptElement.textContent =
      "E — " +
      nearest.name.toUpperCase();

  } else {

    promptElement.style.opacity =
      "0";

  }

}


/* =========================================================
   CRONÔMETRO
========================================================= */

function updateTimer(delta) {

  if (!playing || finished) {
    return;
  }


  timeLeft -= delta;


  if (timeLeft <= 0) {

    timeLeft = 0;

    playing = false;

    loseScreen.classList.remove(
      "hidden"
    );

    return;

  }


  const minutes =
    Math.floor(
      timeLeft / 60
    );


  const seconds =
    Math.floor(
      timeLeft % 60
    );


  timerElement.textContent =
    String(minutes).padStart(
      2,
      "0"
    ) +
    ":" +
    String(seconds).padStart(
      2,
      "0"
    );

}


/* =========================================================
   LOOP PRINCIPAL
========================================================= */

let lastTime = performance.now();


function gameLoop(now) {

  const delta =
    Math.min(
      (now - lastTime) / 1000,
      0.05
    );


  lastTime = now;


  if (playing) {

    updateMovement(delta);

    updateTimer(delta);

    updatePrompt();

  }


  if (!game.classList.contains("hidden")) {

    drawGame();

  }


  requestAnimationFrame(
    gameLoop
  );

}


requestAnimationFrame(
  gameLoop
);


/* =========================================================
   INICIAR
========================================================= */

startButton.addEventListener(
  "click",
  () => {

    startScreen.classList.add(
      "hidden"
    );

    game.classList.remove(
      "hidden"
    );

    playing = true;

    finished = false;

    timeLeft = 15 * 60;

    player.x = 0;

    player.y = 12;

    player.angle = Math.PI;

    setObjective(
      "Encontre a pista azul."
    );

    showMessage(
      "Explore a escola e encontre a pista azul."
    );

  }
);


/* =========================================================
   COMO JOGAR
========================================================= */

howButton.addEventListener(
  "click",
  () => {

    startScreen.classList.add(
      "hidden"
    );

    howScreen.classList.remove(
      "hidden"
    );

  }
);


backButton.addEventListener(
  "click",
  () => {

    howScreen.classList.add(
      "hidden"
    );

    startScreen.classList.remove(
      "hidden"
    );

  }
);


/* =========================================================
   REINICIAR
========================================================= */

restartWin.addEventListener(
  "click",
  () => {

    location.reload();

  }
);


restartLose.addEventListener(
  "click",
  () => {

    location.reload();

  }
);


/* =========================================================
   TECLADO
========================================================= */

window.addEventListener(
  "keydown",
  event => {

    keys[
      event.key.toLowerCase()
    ] = true;


    if (
      event.key.toLowerCase() === "e"
    ) {

      interact();

    }

  }
);


window.addEventListener(
  "keyup",
  event => {

    keys[
      event.key.toLowerCase()
    ] = false;

  }
);


/* =========================================================
   MOUSE
========================================================= */

let mouseDown = false;
let lastMouseX = 0;


canvas.addEventListener(
  "mousedown",
  event => {

    mouseDown = true;

    lastMouseX =
      event.clientX;

  }
);


window.addEventListener(
  "mouseup",
  () => {

    mouseDown = false;

  }
);


window.addEventListener(
  "mousemove",
  event => {

    if (
      !mouseDown ||
      !playing
    ) {

      return;

    }


    const difference =
      event.clientX -
      lastMouseX;


    player.angle +=
      difference * 0.006;


    lastMouseX =
      event.clientX;

  }
);


/* =========================================================
   JOYSTICK
========================================================= */

let joystickPointer = null;


function updateJoystick(event) {

  const rect =
    joystick.getBoundingClientRect();


  const centerX =
    rect.left +
    rect.width / 2;


  const centerY =
    rect.top +
    rect.height / 2;


  let x =
    (event.clientX -
      centerX) / 43;


  let y =
    (event.clientY -
      centerY) / 43;


  const length =
    Math.sqrt(
      x * x +
      y * y
    );


  if (length > 1) {

    x /= length;

    y /= length;

  }


  joystickX = x;

  joystickY = y;


  joystickStick.style.transform =
    `translate(
      ${x * 35}px,
      ${y * 35}px
    )`;

}


function resetJoystick() {

  joystickX = 0;

  joystickY = 0;

  joystickStick.style.transform =
    "translate(0,0)";

}


joystick.addEventListener(
  "pointerdown",
  event => {

    joystickPointer =
      event.pointerId;

    joystick.setPointerCapture(
      joystickPointer
    );

    updateJoystick(event);

  }
);


joystick.addEventListener(
  "pointermove",
  event => {

    if (
      event.pointerId ===
      joystickPointer
    ) {

      updateJoystick(event);

    }

  }
);


joystick.addEventListener(
  "pointerup",
  resetJoystick
);


joystick.addEventListener(
  "pointercancel",
  resetJoystick
);


/* =========================================================
   OLHAR NO CELULAR
========================================================= */

let looking = false;

let lastTouchX = 0;

game.addEventListener(
  "touchstart",
  event => {

    if (
      event.touches.length !== 1
    ) {

      return;

    }


    const touch =
      event.touches[0];


    if (
      touch.clientX >
      window.innerWidth * 0.48
    ) {

      looking = true;

      lastTouchX =
        touch.clientX;

    }

  },
  {
    passive: false
  }
);


game.addEventListener(
  "touchmove",
  event => {

    if (!looking) {
      return;
    }


    const touch =
      event.touches[0];


    const difference =
      touch.clientX -
      lastTouchX;


    player.angle +=
      difference * 0.008;


    lastTouchX =
      touch.clientX;


    event.preventDefault();

  },
  {
    passive: false
  }
);


game.addEventListener(
  "touchend",
  () => {

    looking = false;

  }
);


/* =========================================================
   BOTÃO INTERAGIR
========================================================= */

interactButton.addEventListener(
  "click",
  interact
);


/* =========================================================
   CORRER
========================================================= */

runButton.addEventListener(
  "pointerdown",
  () => {

    running = true;

  }
);


runButton.addEventListener(
  "pointerup",
  () => {

    running = false;

  }
);


runButton.addEventListener(
  "pointercancel",
  () => {

    running = false;

  }
);


/* =========================================================
   PREVENIR ZOOM / SCROLL
========================================================= */

document.addEventListener(
  "gesturestart",
  event => {

    event.preventDefault();

  }
);


document.addEventListener(
  "dblclick",
  event => {

    event.preventDefault();

  }
);


/* =========================================================
   FINAL
========================================================= */

console.log(
  "ESCAPE DA ESCOLA carregado com sucesso."
);
