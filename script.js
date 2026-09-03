const $ = s => document.querySelector(s);


/* =========================
   SALAS
========================= */

const rooms = {

  classroom: {
    name: "Sala de Aula",
    icon: "📚"
  },

  lab: {
    name: "Laboratório de Informática",
    icon: "💻"
  },

  library: {
    name: "Biblioteca",
    icon: "📖"
  },

  science: {
    name: "Laboratório de Ciências",
    icon: "🧪"
  },

  corridor: {
    name: "Corredor Principal",
    icon: "🚪"
  },

  exit: {
    name: "Portão Principal",
    icon: "🔐"
  }

};


/* =========================
   ITENS
========================= */

const itemData = {

  key: {
    icon: "🔑",
    name: "Chave"
  },

  card: {
    icon: "🪪",
    name: "Cartão"
  },

  note: {
    icon: "📝",
    name: "Bilhete"
  },

  book: {
    icon: "📕",
    name: "Livro"
  },

  battery: {
    icon: "🔋",
    name: "Bateria"
  },

  lens: {
    icon: "🔍",
    name: "Lupa"
  }

};


/* =========================
   ESTADO DO JOGO
========================= */

let state = {

  room: "classroom",

  inventory: [],

  solved: new Set(),

  flags: {},

  hints: 3,

  time: 900,

  timer: null,

  score: 1000,

  started: false

};


/* =========================
   RESET
========================= */

function resetState() {

  state = {

    room: "classroom",

    inventory: [],

    solved: new Set(),

    flags: {},

    hints: 3,

    time: 900,

    timer: null,

    score: 1000,

    started: true

  };

  showScreen("gameScreen");

  render();

  startTimer();

}


/* =========================
   TELAS
========================= */

function showScreen(id) {

  document
    .querySelectorAll(".screen")
    .forEach(x => x.classList.remove("active"));

  $("#" + id).classList.add("active");

}


/* =========================
   CRONÔMETRO
========================= */

function startTimer() {

  clearInterval(state.timer);

  state.timer = setInterval(() => {

    if (!state.started) return;

    state.time--;

    updateTimer();

    if (state.time <= 0) {

      clearInterval(state.timer);

      state.started = false;

      showScreen("loseScreen");

    }

  }, 1000);

}


function updateTimer() {

  const minutes =
    Math.floor(state.time / 60)
    .toString()
    .padStart(2, "0");

  const seconds =
    (state.time % 60)
    .toString()
    .padStart(2, "0");

  $("#timer").textContent =
    `${minutes}:${seconds}`;

  if (state.time <= 120) {

    $("#timer").style.color =
      "var(--danger)";

  } else {

    $("#timer").style.color = "";

  }

}


/* =========================
   INVENTÁRIO
========================= */

function addItem(id) {

  if (!state.inventory.includes(id)) {

    state.inventory.push(id);

    toast(
      `Item obtido: ${itemData[id].name}`
    );

    renderInventory();

  }

}


function hasItem(id) {

  return state.inventory.includes(id);

}


function renderInventory() {

  $("#inventory").innerHTML =
    Object.keys(itemData).map(id => {

      const has =
        state.inventory.includes(id);

      return `

        <div
          class="item"
          title="${
            has
              ? itemData[id].name
              : "Espaço vazio"
          }"
        >

          ${has ? itemData[id].icon : ""}

          ${
            has
              ? `<small>
                   ${itemData[id].name}
                 </small>`
              : ""
          }

        </div>

      `;

    }).join("");

}


/* =========================
   PUZZLES RESOLVIDOS
========================= */

function solve(id) {

  if (!state.solved.has(id)) {

    state.solved.add(id);

    state.score += 100;

    toast(
      "Puzzle resolvido! +100 pontos"
    );

  }

}


function progress() {

  const total = 9;

  return Math.min(
    100,
    Math.round(
      state.solved.size / total * 100
    )
  );

}


/* =========================
   MAPA
========================= */

function renderMap() {

  const order = [

    "classroom",
    "lab",
    "library",
    "science",
    "corridor",
    "exit"

  ];


  $("#mapButtons").innerHTML =
    order.map(id => {

      const locked =

        (id === "lab" &&
         !state.solved.has("classroomDoor"))

        ||

        (id === "library" &&
         !state.solved.has("labComputer"))

        ||

        (id === "science" &&
         !state.solved.has("libraryBooks"))

        ||

        (id === "corridor" &&
         !state.solved.has("sciencePuzzle"))

        ||

        (id === "exit" &&
         !state.solved.has("corridorDoor"));


      return `

        <button

          class="
            map-btn
            ${state.room === id ? "active" : ""}
            ${locked ? "locked" : ""}
          "

          data-room="${id}"

          ${locked ? "disabled" : ""}

        >

          ${rooms[id].icon}

          ${rooms[id].name}

        </button>

      `;

    }).join("");


  document
    .querySelectorAll("[data-room]")
    .forEach(button => {

      button.onclick = () => {

        goRoom(button.dataset.room);

      };

    });

}


/* =========================
   MUDAR DE SALA
========================= */

function goRoom(id) {

  if (
    id === "lab" &&
    !state.solved.has("classroomDoor")
  ) {

    return toast(
      "A porta do laboratório ainda está trancada."
    );

  }


  if (
    id === "library" &&
    !state.solved.has("labComputer")
  ) {

    return toast(
      "Você ainda precisa descobrir a senha do computador."
    );

  }


  if (
    id === "science" &&
    !state.solved.has("libraryBooks")
  ) {

    return toast(
      "A biblioteca ainda esconde uma pista."
    );

  }


  if (
    id === "corridor" &&
    !state.solved.has("sciencePuzzle")
  ) {

    return toast(
      "Você ainda não resolveu o desafio do laboratório."
    );

  }


  if (
    id === "exit" &&
    !state.solved.has("corridorDoor")
  ) {

    return toast(
      "O portão ainda não pode ser acessado."
    );

  }


  state.room = id;

  render();

}


/* =========================
   RENDER
========================= */

function render() {

  $("#locationName").textContent =
    rooms[state.room].name;

  renderMap();

  renderInventory();

  updateTimer();

  $("#progressText").textContent =
    `Progresso: ${progress()}%`;


  const objectives = {

    classroom:
      "Encontre uma forma de abrir a porta da sala.",

    lab:
      "Descubra a senha do computador.",

    library:
      "Encontre o livro certo e descubra a pista.",

    science:
      "Resolva o enigma dos frascos.",

    corridor:
      "Abra o armário de manutenção.",

    exit:
      "Digite a senha final no portão."

  };


  $("#objectiveText").textContent =
    objectives[state.room];


  $("#room").innerHTML =
    roomHTML(state.room);


  bindObjects();

}


/* =========================
   DESCRIÇÕES
========================= */

function sceneDescription(id) {

  return {

    classroom:
      "As carteiras estão vazias. O relógio parou. Há algo escrito no quadro.",

    lab:
      "Monitores desligados, cabos espalhados e um computador que ainda funciona.",

    library:
      "Silêncio absoluto. Estantes enormes escondem dezenas de pistas.",

    science:
      "Há frascos coloridos, um quadro de fórmulas e uma caixa trancada.",

    corridor:
      "As luzes piscam. Um armário metálico está preso por um cadeado.",

    exit:
      "O portão eletrônico exige uma senha de quatro dígitos."

  }[id];

}


/* =========================
   HTML DAS SALAS
========================= */

function roomHTML(id) {

  const header = `

    <div class="scene-header">

      <h2>
        ${rooms[id].icon}
        ${rooms[id].name}
      </h2>

      <p>
        ${sceneDescription(id)}
      </p>

    </div>

  `;


  let body = "";


  if (id === "classroom")
    body = classroomHTML();


  if (id === "lab")
    body = labHTML();


  if (id === "library")
    body = libraryHTML();


  if (id === "science")
    body = scienceHTML();


  if (id === "corridor")
    body = corridorHTML();


  if (id === "exit")
    body = exitHTML();


  return `

    <div class="scene">

      ${header}

      <div class="scene-body">

        ${body}

      </div>

    </div>

  `;

}


/* =========================
   SALA DE AULA
========================= */

function classroomHTML() {

  return `

    <button class="object-btn"
      data-action="blackboard">

      <span class="emoji">🧑‍🏫</span>

      <strong>Quadro</strong>

      <span>
        Há uma sequência escrita.
      </span>

    </button>


    <button class="object-btn"
      data-action="clock">

      <span class="emoji">🕐</span>

      <strong>Relógio</strong>

      <span>
        Ele parou em um horário estranho.
      </span>

    </button>


    <button class="object-btn"
      data-action="desk">

      <span class="emoji">🪑</span>

      <strong>Carteira</strong>

      <span>
        Uma gaveta está fechada.
      </span>

    </button>


    <button class="object-btn"
      data-action="cabinet">

      <span class="emoji">🗄️</span>

      <strong>Armário</strong>

      <span>
        Talvez a chave esteja por perto.
      </span>

    </button>


    ${
      state.solved.has("classroomDoor")

        ?

      `<div class="locked-card success">
        ✓ A porta foi aberta.
        Você pode seguir para o laboratório.
      </div>`

        :

      `<div class="locked-card">
        A porta está trancada.
        Descubra o código da fechadura.
      </div>`
    }

  `;

}


/* =========================
   LABORATÓRIO
========================= */

function labHTML() {

  return `

    <button class="object-btn"
      data-action="computer">

      <span class="emoji">💻</span>

      <strong>Computador</strong>

      <span>
        Ele pede uma senha de 4 dígitos.
      </span>

    </button>


    <button class="object-btn"
      data-action="keyboard">

      <span class="emoji">⌨️</span>

      <strong>Teclado</strong>

      <span>
        Há marcas nas teclas.
      </span>

    </button>


    <button class="object-btn"
      data-action="shelf">

      <span class="emoji">📦</span>

      <strong>Prateleira</strong>

      <span>
        Há vários equipamentos.
      </span>

    </button>


    ${
      state.solved.has("labComputer")

        ?

      `<div class="locked-card success">
        ✓ Computador desbloqueado.
        A pista indica quais livros procurar.
      </div>`

        :

      `<div class="locked-card">
        O computador está bloqueado.
      </div>`
    }

  `;

}


/* =========================
   BIBLIOTECA
========================= */

function libraryHTML() {

  return `

    <button class="object-btn"
      data-action="books">

      <span class="emoji">📚</span>

      <strong>Estantes</strong>

      <span>
        Existem muitos livros.
      </span>

    </button>


    <button class="object-btn"
      data-action="catalog">

      <span class="emoji">🗃️</span>

      <strong>Catálogo</strong>

      <span>
        Um catálogo antigo está sobre a mesa.
      </span>

    </button>


    <button class="object-btn"
      data-action="reading">

      <span class="emoji">🔎</span>

      <strong>Mesa de leitura</strong>

      <span>
        Talvez alguém tenha deixado uma pista.
      </span>

    </button>


    ${
      state.solved.has("libraryBooks")

        ?

      `<div class="locked-card success">
        ✓ Você encontrou o livro correto.
      </div>`

        :

      `<div class="locked-card">
        Encontre o livro indicado pela pista.
      </div>`
    }

  `;

}


/* =========================
   LABORATÓRIO DE CIÊNCIAS
========================= */

function scienceHTML() {

  return `

    <button class="object-btn"
      data-action="flasks">

      <span class="emoji">🧪</span>

      <strong>Frascos</strong>

      <span>
        Há uma sequência de números.
      </span>

    </button>


    <button class="object-btn"
      data-action="board">

      <span class="emoji">🧮</span>

      <strong>Quadro</strong>

      <span>
        Fórmulas estão escritas aqui.
      </span>

    </button>


    <button class="object-btn"
      data-action="box">

      <span class="emoji">🧰</span>

      <strong>Caixa</strong>

      <span>
        Uma caixa está trancada.
      </span>

    </button>


    ${
      state.solved.has("sciencePuzzle")

        ?

      `<div class="locked-card success">
        ✓ Enigma resolvido.
        Você encontrou a pista do corredor.
      </div>`

        :

      `<div class="locked-card">
        Descubra a sequência correta.
      </div>`
    }

  `;

}


/* =========================
   CORREDOR
========================= */

function corridorHTML() {

  return `

    <button class="object-btn"
      data-action="locker">

      <span class="emoji">🗄️</span>

      <strong>Armário</strong>

      <span>
        Um cadeado impede a abertura.
      </span>

    </button>


    <button class="object-btn"
      data-action="notice">

      <span class="emoji">📌</span>

      <strong>Mural</strong>

      <span>
        Há vários avisos antigos.
      </span>

    </button>


    <button class="object-btn"
      data-action="camera">

      <span class="emoji">📹</span>

      <strong>Câmera</strong>

      <span>
        Uma câmera observa o corredor.
      </span>

    </button>


    ${
      state.solved.has("corridorDoor")

        ?

      `<div class="locked-card success">
        ✓ Armário aberto.
        Você encontrou a última pista.
      </div>`

        :

      `<div class="locked-card">
        Abra o armário de manutenção.
      </div>`
    }

  `;

}


/* =========================
   PORTÃO FINAL
========================= */

function exitHTML() {

  return `

    <div class="final-panel">

      <div class="final-icon">
        🔐
      </div>

      <h2>
        PORTÃO PRINCIPAL
      </h2>

      <p>
        O portão eletrônico exige
        uma senha de quatro dígitos.
      </p>

      <input
        id="finalAnswer"
        type="number"
        inputmode="numeric"
        placeholder="Digite a senha"
      >

      <button
        class="primary-btn"
        onclick="finalCheck()">

        ABRIR PORTÃO

      </button>

      <p id="puzzleMsg"></p>

    </div>

  `;

}


function finalCheck() {

  const value =
    $("#finalAnswer").value.trim();


  if (value === "2016") {

    win();

  } else {

    failPuzzle(
      "Ainda não. Releia as pistas finais."
    );

  }

}


/* =========================
   ERRO DE PUZZLE
========================= */

function failPuzzle(message) {

  const p =
    $("#puzzleMsg");


  if (p) {

    p.textContent = message;

    p.className = "error";

  }


  const card =
    document.querySelector(".modal-card");


  if (card) {

    card.classList.add("shake");

    setTimeout(() => {

      card.classList.remove("shake");

    }, 400);

  }


  state.score =
    Math.max(
      0,
      state.score - 20
    );

}


/* =========================
   MODAL
========================= */

function modal(html) {

  $("#modalContent").innerHTML =
    html;

  $("#modal").classList.remove("hidden");

}


function closeModal() {

  $("#modal")
    .classList.add("hidden");

}


/* =========================
   MENSAGEM
========================= */

function toast(message) {

  const toastElement =
    $("#toast");

  toastElement.textContent =
    message;

  toastElement.classList.add("show");


  setTimeout(() => {

    toastElement.classList.remove("show");

  }, 2200);

}


/* =========================
   DICAS
========================= */

function hint() {

  if (state.hints <= 0) {

    return toast(
      "Você já usou todas as dicas."
    );

  }


  const hints = {

    classroom:
      "Observe o horário parado no relógio.",

    lab:
      "As teclas marcadas formam uma sequência de números pares.",

    library:
      "O computador revelou exatamente quais livros procurar.",

    science:
      "Na sequência dos frascos, cada número dobra.",

    corridor:
      "O mural fala sobre números de salas.",

    exit:
      "Combine os dois números destacados nas pistas finais."

  };


  state.hints--;

  state.score =
    Math.max(
      0,
      state.score - 75
    );


  $("#hintCount").textContent =
    state.hints;


  toast(
    "💡 " + hints[state.room]
  );

}


/* =========================
   VITÓRIA
========================= */

function win() {

  clearInterval(state.timer);

  state.started = false;


  const used =
    900 - state.time;


  const bonus =
    Math.max(
      0,
      500 - Math.floor(used / 3)
    );


  const finalScore =
    Math.max(
      0,
      state.score + bonus
    );


  $("#finalScore").textContent =
    finalScore;


  $("#winSummary").textContent =
    `Você resolveu os desafios em
     ${Math.floor(used / 60)}m
     ${(used % 60).toString().padStart(2,"0")}s
     e encontrou a senha 2016.`;


  showScreen("winScreen");

}


/* =========================
   BOTÕES
========================= */

$("#startBtn").onclick =
  resetState;


$("#howBtn").onclick =
  () => showScreen("howScreen");


$("#hintBtn").onclick =
  hint;


$("#restartBtn").onclick =
  () => {

    if (
      confirm(
        "Recomeçar o jogo? Seu progresso atual será perdido."
      )
    ) {

      resetState();

    }

  };


$("#playAgainBtn").onclick =
  resetState;


$("#tryAgainBtn").onclick =
  resetState;


$("#modalClose").onclick =
  closeModal;


$("#modal").addEventListener(
  "click",
  event => {

    if (
      event.target.id === "modal"
    ) {

      closeModal();

    }

  }
);


document
  .querySelectorAll("[data-close]")
  .forEach(button => {

    button.onclick =
      () => showScreen(
        button.dataset.close
      );

  });


/* =========================
   FUNÇÕES DOS PUZZLES
========================= */

Object.assign(
  window,
  {

    checkClassCode,

    deskChoice,

    computerCheck,

    librarySolved,

    flaskChoice,

    lockerSolved,

    finalCheck,

    closeModal

  }
);


updateTimer();


/* =========================================================
   MODO 2D VISTO DE CIMA
   Mantém os puzzles originais.
========================================================= */

const topDownObjects = {

  classroom: [
    ["blackboard", "🧑‍🏫", "Quadro", 18, 20],
    ["clock", "🕐", "Relógio", 78, 18],
    ["desk", "🪑", "Carteira", 42, 48],
    ["cabinet", "🗄️", "Armário", 76, 65]
  ],

  lab: [
    ["computer", "💻", "Computador", 65, 35],
    ["keyboard", "⌨️", "Teclado", 65, 55],
    ["shelf", "📦", "Prateleira", 20, 65]
  ],

  library: [
    ["books", "📚", "Estante", 20, 30],
    ["catalog", "🗃️", "Catálogo", 48, 25],
    ["reading", "🔎", "Mesa de leitura", 70, 65]
  ],

  science: [
    ["flasks", "🧪", "Frascos", 25, 32],
    ["board", "🧮", "Quadro", 70, 25],
    ["box", "🧰", "Caixa", 65, 65]
  ],

  corridor: [
    ["locker", "🗄️", "Armário", 25, 48],
    ["notice", "📌", "Mural", 50, 25],
    ["camera", "📹", "Câmera", 78, 48]
  ],

  exit: [
    ["final", "🔐", "Portão", 50, 25]
  ]

};


/* =========================
   POSIÇÃO DO JOGADOR
========================= */

const topDownPlayer = {

  classroom: {
    x: 50,
    y: 78
  },

  lab: {
    x: 50,
    y: 78
  },

  library: {
    x: 50,
    y: 78
  },

  science: {
    x: 50,
    y: 78
  },

  corridor: {
    x: 50,
    y: 78
  },

  exit: {
    x: 50,
    y: 78
  }

};


let topDownKeys = {};

let topDownMoving = false;


/* =========================
   MAPA 2D
========================= */

function topDownRoomHTML(id) {

  const room =
    rooms[id];

  const player =
    topDownPlayer[id] ||
    {
      x: 50,
      y: 78
    };

  const objects =
    topDownObjects[id] ||
    [];


  return `

    <div class="topdown-wrap">

      <div class="topdown-header">

        <div>

          <h2>
            ${room.icon}
            ${room.name}
          </h2>

          <p>
            ${sceneDescription(id)}
          </p>

        </div>

        <div class="topdown-help">
          WASD / SETAS para andar
        </div>

      </div>


      <div
        class="topdown-map"
        id="topdownMap"
      >

        <div
          class="topdown-wall wall-top">
        </div>

        <div
          class="topdown-wall wall-bottom">
        </div>

        <div
          class="topdown-wall wall-left">
        </div>

        <div
          class="topdown-wall wall-right">
        </div>


        <div class="topdown-floor-lines">
        </div>


        ${
          objects.map(
            ([action, icon, name, x, y]) => `

              <button

                class="topdown-object"

                data-action="${action}"

                style="
                  left:${x}%;
                  top:${y}%;
                "

                title="${name}"

              >

                <span>
                  ${icon}
                </span>

                <small>
                  ${name}
                </small>

              </button>

            `
          ).join("")
        }


        <div

          id="topdownPlayer"

          class="topdown-player"

          style="
            left:${player.x}%;
            top:${player.y}%;
          "

        >

          <span>
            🧑‍🎓
          </span>

          <small>
            VOCÊ
          </small>

        </div>


        <div
          class="topdown-label label-start"
        >
          INÍCIO
        </div>


        <div
          class="topdown-label label-exit"
        >
          SAÍDA
        </div>

      </div>


      <div class="topdown-controls">

        <button data-move="up">
          ▲
        </button>

        <div>

          <button data-move="left">
            ◀
          </button>

          <button data-move="down">
            ▼
          </button>

          <button data-move="right">
            ▶
          </button>

        </div>

      </div>


      <div class="topdown-status">

        <strong>
          🎯 Explore a sala:
        </strong>

        aproxime-se dos objetos e
        clique neles para investigar.

      </div>

    </div>

  `;

}


/* =========================
   ATIVA O MAPA 2D
========================= */

roomHTML = function(id) {

  return topDownRoomHTML(id);

};


/* =========================
   OBJETOS DO MAPA
========================= */

function bindTopDownObjects() {

  document
    .querySelectorAll(".topdown-object")
    .forEach(button => {

      button.onclick = () => {

        const action =
          button.dataset.action;

        actions(action);

      };

    });


  document
    .querySelectorAll("[data-move]")
    .forEach(button => {

      const direction =
        button.dataset.move;


      const start = event => {

        event.preventDefault();

        topDownKeys[direction] = true;

        topDownMoving = true;

      };


      const stop = event => {

        event.preventDefault();

        topDownKeys[direction] = false;

        topDownMoving = false;

      };


      button.addEventListener(
        "pointerdown",
        start
      );


      button.addEventListener(
        "pointerup",
        stop
      );


      button.addEventListener(
        "pointercancel",
        stop
      );


      button.addEventListener(
        "pointerleave",
        stop
      );

    });

}


/* =========================
   MOVIMENTO DO JOGADOR
========================= */

function updateTopDownPlayer() {

  const player =
    topDownPlayer[state.room];

  const el =
    $("#topdownPlayer");


  if (!player || !el)
    return;


  let dx = 0;

  let dy = 0;


  if (
    topDownKeys.up ||
    topDownKeys.w ||
    topDownKeys.ArrowUp
  ) {

    dy -= 1;

  }


  if (
    topDownKeys.down ||
    topDownKeys.s ||
    topDownKeys.ArrowDown
  ) {

    dy += 1;

  }


  if (
    topDownKeys.left ||
    topDownKeys.a ||
    topDownKeys.ArrowLeft
  ) {

    dx -= 1;

  }


  if (
    topDownKeys.right ||
    topDownKeys.d ||
    topDownKeys.ArrowRight
  ) {

    dx += 1;

  }


  if (
    dx !== 0 ||
    dy !== 0
  ) {

    const speed = 0.65;


    player.x =
      Math.max(
        7,
        Math.min(
          93,
          player.x +
          dx * speed
        )
      );


    player.y =
      Math.max(
        10,
        Math.min(
          90,
          player.y +
          dy * speed
        )
      );


    el.style.left =
      `${player.x}%`;


    el.style.top =
      `${player.y}%`;

  }

}


/* =========================
   LOOP
========================= */

function topDownLoop() {

  updateTopDownPlayer();

  requestAnimationFrame(
    topDownLoop
  );

}


/* =========================
   TECLADO
========================= */

document.addEventListener(
  "keydown",
  event => {

    const key =
      event.key;


    if (

      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "w",
        "a",
        "s",
        "d",
        "W",
        "A",
        "S",
        "D"
      ].includes(key)

    ) {

      event.preventDefault();


      if (
        key === "ArrowUp" ||
        key === "w" ||
        key === "W"
      ) {

        topDownKeys.up = true;

      }


      if (
        key === "ArrowDown" ||
        key === "s" ||
        key === "S"
      ) {

        topDownKeys.down = true;

      }


      if (
        key === "ArrowLeft" ||
        key === "a" ||
        key === "A"
      ) {

        topDownKeys.left = true;

      }


      if (
        key === "ArrowRight" ||
        key === "d" ||
        key === "D"
      ) {

        topDownKeys.right = true;

      }

    }

  }
);


document.addEventListener(
  "keyup",
  event => {

    const key =
      event.key;


    if (
      key === "ArrowUp" ||
      key === "w" ||
      key === "W"
    ) {

      topDownKeys.up = false;

    }


    if (
      key === "ArrowDown" ||
      key === "s" ||
      key === "S"
    ) {

      topDownKeys.down = false;

    }


    if (
      key === "ArrowLeft" ||
      key === "a" ||
      key === "A"
    ) {

      topDownKeys.left = false;

    }


    if (
      key === "ArrowRight" ||
      key === "d" ||
      key === "D"
    ) {

      topDownKeys.right = false;

    }

  }
);


/* =========================
   BIND DOS OBJETOS
========================= */

const originalBindObjects =
  bindObjects;


bindObjects = function() {

  originalBindObjects();

  bindTopDownObjects();

};


/* =========================
   INICIA O MOVIMENTO
========================= */

topDownLoop();
