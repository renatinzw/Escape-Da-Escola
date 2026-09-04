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
    playEscapeSound("success");

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
        Uma caixa contém algo útil.
      </span>

    </button>


    ${
      state.solved.has("labComputer")

      ?

      `<div class="locked-card success">
        ✓ Computador desbloqueado.
        A mensagem aponta para a biblioteca.
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

      <strong>Estante</strong>

      <span>
        Três livros parecem diferentes.
      </span>

    </button>


    <button class="object-btn"
      data-action="catalog">

      <span class="emoji">🗃️</span>

      <strong>Catálogo</strong>

      <span>
        Uma ficha tem números circulados.
      </span>

    </button>


    <button class="object-btn"
      data-action="reading">

      <span class="emoji">🔎</span>

      <strong>Mesa de leitura</strong>

      <span>
        Há uma lupa e um bilhete.
      </span>

    </button>


    ${
      state.solved.has("libraryBooks")

      ?

      `<div class="locked-card success">
        ✓ Pista encontrada.
        O caminho continua no laboratório.
      </div>`

      :

      `<div class="locked-card">
        Descubra a ordem correta dos livros.
      </div>`
    }

  `;

}


/* =========================
   CIÊNCIAS
========================= */

function scienceHTML() {

  return `

    <button class="object-btn"
      data-action="flasks">

      <span class="emoji">🧪</span>

      <strong>Frascos</strong>

      <span>
        Quatro frascos e uma sequência.
      </span>

    </button>


    <button class="object-btn"
      data-action="board">

      <span class="emoji">🧮</span>

      <strong>Quadro</strong>

      <span>
        Uma equação incompleta.
      </span>

    </button>


    <button class="object-btn"
      data-action="box">

      <span class="emoji">🧰</span>

      <strong>Caixa</strong>

      <span>
        Possui um cadeado.
      </span>

    </button>


    ${
      state.solved.has("sciencePuzzle")

      ?

      `<div class="locked-card success">
        ✓ A caixa revelou um cartão de acesso.
      </div>`

      :

      `<div class="locked-card">
        Resolva o enigma para encontrar o cartão.
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

      <strong>
        Armário de manutenção
      </strong>

      <span>
        Um cadeado com 3 números.
      </span>

    </button>


    <button class="object-btn"
      data-action="notice">

      <span class="emoji">📌</span>

      <strong>Mural de avisos</strong>

      <span>
        Há uma mensagem antiga.
      </span>

    </button>


    <button class="object-btn"
      data-action="camera">

      <span class="emoji">📹</span>

      <strong>Câmera</strong>

      <span>
        Ela aponta para o portão.
      </span>

    </button>


    ${
      state.solved.has("corridorDoor")

      ?

      `<div class="locked-card success">
        ✓ O armário foi aberto.
        A última pista foi encontrada.
      </div>`

      :

      `<div class="locked-card">
        Encontre o código do armário.
      </div>`
    }

  `;

}


/* =========================
   PORTÃO
========================= */

function exitHTML() {

  return `

    <div class="locked-card"
      style="grid-column:1/-1">

      <h3>
        🔐 PORTÃO PRINCIPAL
      </h3>

      <p>
        Depois de tudo que você encontrou,
        falta apenas colocar a senha final.
      </p>

      <button
        class="primary-btn"
        data-action="final"
        style="max-width:360px">

        DIGITAR SENHA FINAL

      </button>

    </div>

  `;

}


/* =========================
   OBJETOS
========================= */

function bindObjects() {

  document
    .querySelectorAll("[data-action]")
    .forEach(button => {

      button.onclick = () => {

        actions(button.dataset.action);

      };

    });

}


function actions(action) {

  playEscapeSound("click");

  const actionsMap = {

    blackboard: openBlackboard,

    clock: openClock,

    desk: openDesk,

    cabinet: openCabinet,

    computer: openComputer,

    keyboard: openKeyboard,

    shelf: openShelf,

    books: openBooks,

    catalog: openCatalog,

    reading: openReading,

    flasks: openFlasks,

    board: openBoard,

    box: openBox,

    locker: openLocker,

    notice: openNotice,

    camera: openCamera,

    final: openFinal

  };


  if (actionsMap[action]) {

    actionsMap[action]();

  }

}


/* =========================
   QUADRO
========================= */

function openBlackboard() {

  modal(`

    <h3>
      🧑‍🏫 O quadro
    </h3>

    <p>
      Você encontra uma frase:
    </p>

    <div class="clue">

      “A senha da sala está escondida
      no horário em que o último aluno saiu.”

    </div>

    <p>
      O relógio parou em
      <strong>16:20</strong>.
    </p>

  `);

}


/* =========================
   RELÓGIO
========================= */

function openClock() {

  modal(`

    <h3>🕐 Relógio</h3>

    <p>
      O relógio está parado exatamente em
      <strong>16:20</strong>.
    </p>

    <div class="clue">

      Use apenas os números do horário.

    </div>

    <div class="code-display">
      1620
    </div>

    <button
      class="primary-btn"
      onclick="checkClassCode()">

      TESTAR 1620

    </button>

    <p id="puzzleMsg"></p>

  `);

}


function checkClassCode() {

  solve("classroomDoor");

  closeModal();

  render();

}


/* =========================
   CARTEIRA
========================= */

function openDesk() {

  modal(`

    <h3>🪑 Carteira</h3>

    <p>
      A gaveta está presa.
    </p>

    <div class="clue">

      “A primeira letra do alfabeto
      abre a gaveta.”

    </div>

    <p>
      Qual é a letra?
    </p>

    <div class="choice-grid">

      <button
        class="choice"
        onclick="deskChoice('A')">
        A
      </button>

      <button
        class="choice"
        onclick="deskChoice('B')">
        B
      </button>

      <button
        class="choice"
        onclick="deskChoice('C')">
        C
      </button>

      <button
        class="choice"
        onclick="deskChoice('D')">
        D
      </button>

    </div>

    <p id="puzzleMsg"></p>

  `);

}


function deskChoice(letter) {

  if (letter === "A") {

    addItem("key");

    closeModal();

    toast("Você encontrou uma chave.");

  } else {

    failPuzzle(
      "Não é essa letra."
    );

  }

}


/* =========================
   ARMÁRIO
========================= */

function openCabinet() {

  if (hasItem("key")) {

    modal(`

      <h3>🗄️ Armário</h3>

      <p>
        Você usa a chave encontrada
        na carteira.
      </p>

      <div class="clue">

        “O laboratório fica depois da
        sala de aula. A senha do computador
        está relacionada às teclas marcadas.”

      </div>

    `);

  } else {

    modal(`

      <h3>🗄️ Armário</h3>

      <p>
        Está trancado.
        Procure uma chave pela sala.
      </p>

    `);

  }

}


/* =========================
   COMPUTADOR
========================= */

function openComputer() {

  if (state.solved.has("labComputer")) {

    modal(`

      <h3>💻 Computador</h3>

      <p class="success">
        Acesso liberado.
      </p>

      <div class="clue">

        “Procure na biblioteca
        os livros 3, 7 e 12.”

      </div>

    `);

    return;

  }


  modal(`

    <h3>💻 Computador</h3>

    <p>
      Digite a senha encontrada
      pelas pistas do teclado.
    </p>

    <div class="puzzle">

      <input
        id="answer"
        inputmode="numeric"
        maxlength="4"
        placeholder="4 dígitos"
      >

      <button
        class="primary-btn"
        onclick="computerCheck()">

        ACESSAR

      </button>

      <p id="puzzleMsg"></p>

    </div>

  `);

}


function computerCheck() {

  const value =
    $("#answer").value.trim();


  if (value === "2468") {

    solve("labComputer");

    closeModal();

    render();

  } else {

    failPuzzle(
      "Senha incorreta. Observe as teclas marcadas."
    );

  }

}


/* =========================
   TECLADO
========================= */

function openKeyboard() {

  modal(`

    <h3>⌨️ Teclado</h3>

    <p>
      Quatro teclas possuem pequenas marcas:
    </p>

    <div class="sequence">
      2 → 4 → 6 → 8
    </div>

    <div class="clue">

      Esses números formam a senha
      do computador.

    </div>

  `);

}


/* =========================
   PRATELEIRA
========================= */

function openShelf() {

  if (!hasItem("battery")) {

    addItem("battery");

    modal(`

      <h3>📦 Prateleira</h3>

      <p>
        Você encontrou uma bateria reserva.
        Pode ser útil mais tarde.
      </p>

    `);

  } else {

    modal(`

      <h3>📦 Prateleira</h3>

      <p>
        Está vazia.
      </p>

    `);

  }

}


/* =========================
   LIVROS
========================= */

function openBooks() {

  if (!state.solved.has("labComputer")) {

    modal(`

      <h3>📚 Estante</h3>

      <p>
        Você ainda não sabe
        quais livros procurar.
      </p>

    `);

    return;

  }


  modal(`

    <h3>📚 Os livros</h3>

    <p>
      Você encontra os livros
      <strong>3, 7 e 12</strong>.
    </p>

    <div class="sequence">
      C — O — R
    </div>

    <p>
      Uma etiqueta completa a mensagem:
      <strong>CORREDOR</strong>.
    </p>

    <button
      class="primary-btn"
      onclick="librarySolved()">

      REGISTRAR PISTA

    </button>

  `);

}


function librarySolved() {

  solve("libraryBooks");

  addItem("book");

  closeModal();

  render();

}


/* =========================
   CATÁLOGO
========================= */

function openCatalog() {

  modal(`

    <h3>🗃️ Catálogo</h3>

    <p>
      Uma ficha diz:
    </p>

    <div class="clue">

      “Livros 3, 7 e 12.
      A ordem importa.”

    </div>

  `);

}


/* =========================
   MESA
========================= */

function openReading() {

  if (!hasItem("lens")) {

    addItem("lens");

    modal(`

      <h3>🔎 Mesa</h3>

      <p>
        Você encontrou uma lupa.
      </p>

      <div class="clue">
        3 • 7 • 12
      </div>

    `);

  } else {

    modal(`

      <h3>🔎 Mesa</h3>

      <p>
        Você não encontra mais nada.
      </p>

    `);

  }

}


/* =========================
   FRASCOS
========================= */

function openFlasks() {

  modal(`

    <h3>🧪 Enigma dos frascos</h3>

    <p>
      Os frascos estão numerados.
    </p>

    <div class="sequence">
      1 — 2 — 4 — 8 — ?
    </div>

    <p>
      Qual número vem depois?
    </p>

    <div class="choice-grid">

      <button
        class="choice"
        onclick="flaskChoice(12)">
        12
      </button>

      <button
        class="choice"
        onclick="flaskChoice(16)">
        16
      </button>

      <button
        class="choice"
        onclick="flaskChoice(14)">
        14
      </button>

      <button
        class="choice"
        onclick="flaskChoice(18)">
        18
      </button>

    </div>

    <p id="puzzleMsg"></p>

  `);

}


function flaskChoice(value) {

  if (value === 16) {

    solve("sciencePuzzle");

    addItem("card");

    closeModal();

    render();

  } else {

    failPuzzle(
      "Observe a sequência: cada número dobra."
    );

  }

}


/* =========================
   QUADRO DE CIÊNCIAS
========================= */

function openBoard() {

  modal(`

    <h3>🧮 Quadro</h3>

    <p>
      Uma fórmula está escrita:
    </p>

    <div class="sequence">
      2 × 2 × 2 × 2 = ?
    </div>

    <div class="clue">

      A resposta também é uma pista.

    </div>

  `);

}


/* =========================
   CAIXA
========================= */

function openBox() {

  if (state.solved.has("sciencePuzzle")) {

    modal(`

      <h3>🧰 Caixa</h3>

      <p class="success">
        A caixa abriu!
      </p>

      <p>
        Dentro está um cartão
        de acesso ao corredor.
      </p>

    `);

  } else {

    modal(`

      <h3>🧰 Caixa</h3>

      <p>
        O cadeado parece seguir
        o mesmo padrão dos frascos.
      </p>

    `);

  }

}


/* =========================
   ARMÁRIO DO CORREDOR
========================= */

function openLocker() {

  modal(`

    <h3>🗄️ Armário</h3>

    <p>
      O cadeado pede três números.
    </p>

    <div class="clue">

      “Primeiro o número da sala de aula,
      depois o laboratório e por fim
      a biblioteca.”

    </div>

    <p>
      Sala 1, laboratório 2,
      biblioteca 3.
    </p>

    <button
      class="primary-btn"
      onclick="lockerSolved()">

      ABRIR COM 123

    </button>

    <p id="puzzleMsg"></p>

  `);

}


function lockerSolved() {

  solve("corridorDoor");

  addItem("note");

  closeModal();

  render();

}


/* =========================
   MURAL
========================= */

function openNotice() {

  modal(`

    <h3>📌 Mural</h3>

    <p>
      Há um aviso antigo:
    </p>

    <div class="clue">

      “A saída não é o fim.
      A resposta final está em tudo
      que você aprendeu.”

    </div>

  `);

}


/* =========================
   CÂMERA
========================= */

function openCamera() {

  modal(`

    <h3>📹 Câmera</h3>

    <p>
      A câmera mostra o portão.
    </p>

    <div class="clue">

      “Use os quatro números principais
      encontrados durante a investigação.”

    </div>

    <p>
      As pistas principais são:
      <strong>1620, 2468, 16 e 123</strong>.
    </p>

  `);

}


/* =========================
   PORTÃO FINAL
========================= */

function openFinal() {

  if (!state.solved.has("corridorDoor")) {

    return modal(`

      <h3>🔐 Portão</h3>

      <p>
        O sistema ainda não liberou
        o teclado.
      </p>

    `);

  }


  modal(`

    <h3>🔐 Senha final</h3>

    <p>
      Você precisa descobrir
      a combinação final.
    </p>

    <div class="clue">

      A última pista pede os dois últimos
      números do relógio e o resultado
      do enigma dos frascos.

    </div>

    <div class="code-display">
      20 + 16
    </div>

    <div class="puzzle">

      <input
        id="finalAnswer"
        inputmode="numeric"
        maxlength="4"
        placeholder="4 dígitos"
      >

      <button
        class="primary-btn"
        onclick="finalCheck()">

        ABRIR PORTÃO

      </button>

      <p id="puzzleMsg"></p>

    </div>

  `);

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

  playEscapeSound("error");

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

  playEscapeSound("win");
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


/* =========================
   EFEITOS SONOROS
========================= */

let escapeAudio = null;
let escapeSoundEnabled = true;

function startEscapeAudio() {
  if (!escapeSoundEnabled) return;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return;
  if (!escapeAudio) escapeAudio = new AudioCtor();
  if (escapeAudio.state === "suspended") escapeAudio.resume();
  playEscapeSound("start");
}

function playEscapeSound(type) {
  if (!escapeSoundEnabled || !escapeAudio) return;
  const notes = {
    click: [360],
    start: [262, 392],
    success: [523, 659, 784],
    error: [150, 110],
    win: [392, 523, 659, 784]
  }[type] || [300];
  notes.forEach((frequency, index) => {
    window.setTimeout(() => {
      if (!escapeAudio || !escapeSoundEnabled) return;
      const oscillator = escapeAudio.createOscillator();
      const gain = escapeAudio.createGain();
      const now = escapeAudio.currentTime;
      oscillator.type = type === "error" ? "sawtooth" : "triangle";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(type === "click" ? 0.025 : 0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (type === "click" ? 0.06 : 0.14));
      oscillator.connect(gain);
      gain.connect(escapeAudio.destination);
      oscillator.start(now);
      oscillator.stop(now + (type === "click" ? 0.06 : 0.14));
    }, index * 75);
  });
}

$("#startBtn").addEventListener("click", startEscapeAudio);

const soundButton = $("#soundBtn");
if (soundButton) {
  soundButton.addEventListener("click", () => {
    escapeSoundEnabled = !escapeSoundEnabled;
    soundButton.textContent = escapeSoundEnabled ? "🔊 SOM" : "🔇 MUDO";
    soundButton.setAttribute("aria-pressed", String(escapeSoundEnabled));
    if (escapeSoundEnabled) startEscapeAudio();
  });
}


/* =========================================================
   EXPLORAÇÃO 2D DO ESCAPE ROOM
   Não é um jogo de Pac-Man: não há pellets, fantasmas ou
   perseguição. O aluno apenas explora cada sala e investiga
   os objetos do escape room original.
========================================================= */

const escape2DObjects = {
  classroom: [
    ["blackboard", "🧑‍🏫", "Quadro", 25, 25, "Uma sequência está escrita."],
    ["clock", "🕐", "Relógio", 76, 23, "Ele parou em um horário estranho."],
    ["desk", "🪑", "Carteira", 44, 58, "Uma gaveta está fechada."],
    ["cabinet", "🗄️", "Armário", 76, 64, "Talvez a chave esteja por perto."]
  ],
  lab: [
    ["computer", "💻", "Computador", 68, 30, "Ele pede uma senha de 4 dígitos."],
    ["keyboard", "⌨️", "Teclado", 67, 57, "Há marcas nas teclas."],
    ["shelf", "📦", "Prateleira", 20, 65, "Há vários equipamentos."]
  ],
  library: [
    ["books", "📚", "Estantes", 20, 34, "Existem muitos livros."],
    ["catalog", "🗃️", "Catálogo", 49, 25, "Um catálogo antigo está sobre a mesa."],
    ["reading", "🔎", "Mesa de leitura", 71, 65, "Talvez alguém tenha deixado uma pista."]
  ],
  science: [
    ["flasks", "🧪", "Frascos", 24, 35, "Há uma sequência de números."],
    ["board", "🧮", "Quadro", 70, 25, "Fórmulas estão escritas aqui."],
    ["box", "🧰", "Caixa", 66, 65, "Uma caixa está trancada."]
  ],
  corridor: [
    ["locker", "🗄️", "Armário", 25, 48, "Um cadeado impede a abertura."],
    ["notice", "📌", "Mural", 51, 25, "Há vários avisos antigos."],
    ["camera", "📹", "Câmera", 78, 48, "Uma câmera observa o corredor."]
  ],
  exit: [
    ["final", "🔐", "Portão", 51, 43, "O portão exige a senha final."]
  ]
};

const escape2DPositions = {
  classroom: { x: 50, y: 82 },
  lab: { x: 50, y: 82 },
  library: { x: 50, y: 82 },
  science: { x: 50, y: 82 },
  corridor: { x: 50, y: 82 },
  exit: { x: 50, y: 78 }
};

const escape2DKeys = Object.create(null);
let escape2DLastFrame = 0;

function escape2DPropHTML(id) {
  const props = {
    classroom: '<div class="room-prop window left"></div><div class="room-prop window right"></div><div class="room-prop rug"></div>',
    lab: '<div class="room-prop window left"></div><div class="room-prop lab-table"></div>',
    library: '<div class="room-prop shelves"></div><div class="room-prop shelves right"></div><div class="room-prop rug"></div>',
    science: '<div class="room-prop board"></div><div class="room-prop lab-table"></div>',
    corridor: '<div class="room-prop locker-row"></div>',
    exit: '<div class="room-prop window left"></div><div class="room-prop window right"></div>'
  };
  return props[id] || "";
}

function escape2DRoomHTML(id) {
  const roomData = rooms[id];
  const position = escape2DPositions[id] || { x: 50, y: 80 };
  const objects = escape2DObjects[id] || [];
  const solvedActions = new Set([
    state.solved.has("classroomDoor") ? "blackboard" : "",
    state.solved.has("labComputer") ? "computer" : "",
    state.solved.has("libraryBooks") ? "books" : "",
    state.solved.has("sciencePuzzle") ? "flasks" : "",
    state.solved.has("corridorDoor") ? "locker" : "",
    state.solved.has("finalDoor") ? "final" : ""
  ]);

  return `
    <div class="topdown-wrap">
      <div class="topdown-header">
        <div>
          <h2>${roomData.icon} ${roomData.name}</h2>
          <p>${sceneDescription(id)}</p>
        </div>
        <div class="topdown-help">Clique nos objetos para investigar<br>WASD / SETAS para caminhar</div>
      </div>
      <div class="topdown-map" id="topdownMap">
        <div class="topdown-wall wall-top"></div>
        <div class="topdown-wall wall-bottom"></div>
        <div class="topdown-wall wall-left"></div>
        <div class="topdown-wall wall-right"></div>
        <div class="topdown-floor-lines"></div>
        ${escape2DPropHTML(id)}
        ${objects.map(([action, icon, name, x, y, description]) => `
          <button class="topdown-object ${solvedActions.has(action) ? "is-solved" : ""}" data-action="${action}" style="left:${x}%;top:${y}%;" title="${description}" aria-label="${name}. ${description}. Aproxime-se para investigar." aria-keyshortcuts="Enter" disabled>
            <span>${icon}</span><small>${name}</small>
          </button>
        `).join("")}
        <div id="topdownPlayer" class="topdown-player" style="left:${position.x}%;top:${position.y}%;">
          <span>🧑‍🎓</span><small>VOCÊ</small>
        </div>
        <div class="topdown-label label-start">INÍCIO</div>
        <div class="topdown-label label-exit">SAÍDA</div>
      </div>
      <div class="topdown-controls" aria-label="Controles de movimento">
        <button data-move="up" aria-label="Andar para cima">▲</button>
        <div><button data-move="left" aria-label="Andar para esquerda">◀</button><button data-move="down" aria-label="Andar para baixo">▼</button><button data-move="right" aria-label="Andar para direita">▶</button></div>
      </div>
      <div class="topdown-status" id="topdownStatus" role="status" aria-live="polite"><strong>Objetivo:</strong> aproxime-se de um objeto; quando aparecer ENTER, pressione Enter para investigar.</div>
    </div>
  `;
}

roomHTML = escape2DRoomHTML;

function bindEscape2DControls() {
  document.querySelectorAll("[data-move]").forEach((button) => {
    const direction = button.dataset.move;
    const key = direction === "up" ? "up" : direction === "down" ? "down" : direction === "left" ? "left" : "right";
    const start = (event) => { event.preventDefault(); escape2DKeys[key] = true; };
    const stop = (event) => { event.preventDefault(); escape2DKeys[key] = false; };
    button.addEventListener("pointerdown", start);
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("pointerleave", stop);
  });
}

const escape2DOriginalBindObjects = bindObjects;
bindObjects = function() {
  escape2DOriginalBindObjects();
  bindEscape2DControls();
};

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const movement = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" }[key];
  if (movement) {
    event.preventDefault();
    escape2DKeys[movement] = true;
  }
});

document.addEventListener("keyup", (event) => {
  const key = event.key.toLowerCase();
  const movement = { arrowup: "up", w: "up", arrowdown: "down", s: "down", arrowleft: "left", a: "left", arrowright: "right", d: "right" }[key];
  if (movement) escape2DKeys[movement] = false;
});

function updateEscape2DPlayer(timestamp) {
  const player = escape2DPositions[state.room];
  const element = $("#topdownPlayer");
  if (player && element && state.started) {
    let dx = 0;
    let dy = 0;
    if (escape2DKeys.left) dx -= 1;
    if (escape2DKeys.right) dx += 1;
    if (escape2DKeys.up) dy -= 1;
    if (escape2DKeys.down) dy += 1;
    if (dx || dy) {
      const length = Math.hypot(dx, dy) || 1;
      const speed = 0.65 * Math.min(2, (timestamp - escape2DLastFrame) / 16.67 || 1);
      const nextX = Math.max(8, Math.min(92, player.x + (dx / length) * speed));
      const nextY = Math.max(12, Math.min(88, player.y + (dy / length) * speed));
      if (!escape2DIsBlocked(nextX, player.y)) player.x = nextX;
      if (!escape2DIsBlocked(player.x, nextY)) player.y = nextY;
      element.style.left = `${player.x}%`;
      element.style.top = `${player.y}%`;
    }
  }
  escape2DLastFrame = timestamp;
  window.requestAnimationFrame(updateEscape2DPlayer);
}

window.requestAnimationFrame(updateEscape2DPlayer);


/* =========================================================
   INTERAÇÃO POR PROXIMIDADE + ENTER
========================================================= */

const ESCAPE_INTERACTION_DISTANCE = 15;
let escapeNearbyAction = null;
let escapeNearbyName = "";
let escapeNearbyDistance = Infinity;

function escapeModalIsOpen() {
  const modalElement = $("#modal");
  return Boolean(modalElement && !modalElement.classList.contains("hidden"));
}

function escapeGetNearbyObject() {
  const player = escape2DPositions[state.room];
  if (!player) return null;
  let closest = null;
  document.querySelectorAll(".topdown-object").forEach((button) => {
    const objectX = parseFloat(button.style.left);
    const objectY = parseFloat(button.style.top);
    const distance = Math.hypot(player.x - objectX, player.y - objectY);
    if (!closest || distance < closest.distance) {
      closest = { button, distance };
    }
  });
  return closest;
}

function escapeUpdateObjectFocus() {
  const buttons = [...document.querySelectorAll(".topdown-object")];
  const closest = escapeGetNearbyObject();
  const nearby = closest && closest.distance <= ESCAPE_INTERACTION_DISTANCE ? closest.button : null;
  escapeNearbyAction = nearby ? nearby.dataset.action : null;
  escapeNearbyName = nearby ? nearby.querySelector("small")?.textContent || "objeto" : "";
  escapeNearbyDistance = closest ? closest.distance : Infinity;

  buttons.forEach((button) => {
    const isNearby = button === nearby;
    button.disabled = !isNearby;
    button.tabIndex = isNearby ? 0 : -1;
    button.setAttribute("aria-disabled", String(!isNearby));
    button.classList.toggle("is-nearby", isNearby);
  });

  const status = $("#topdownStatus");
  if (!status) return;
  if (nearby) {
    status.innerHTML = `<strong>${escapeNearbyName} ao alcance.</strong> Pressione Enter ou clique no objeto para abrir o puzzle.`;
  } else if (closest) {
    status.innerHTML = `<strong>Você está a ${Math.ceil(closest.distance)} passos de ${closest.button.querySelector("small")?.textContent || "um objeto"}.</strong> Caminhe até ele para investigar.`;
  } else {
    status.innerHTML = "<strong>Objetivo:</strong> explore a sala e descubra as pistas.";
  }
}

function escapeOpenNearbyObject() {
  if (escapeModalIsOpen() || !escapeNearbyAction) return false;
  playEscapeSound("click");
  actions(escapeNearbyAction);
  return true;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !escapeModalIsOpen()) {
    if (escapeOpenNearbyObject()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
});

function escapeBindProximityClicks() {
  document.querySelectorAll(".topdown-object").forEach((button) => {
    button.onclick = (event) => {
      if (button.disabled || !button.classList.contains("is-nearby")) {
        event.preventDefault();
        return;
      }
      actions(button.dataset.action);
    };
  });
  escapeUpdateObjectFocus();
}

const escape2DOriginalBindObjectsWithProximity = bindObjects;
bindObjects = function() {
  escape2DOriginalBindObjectsWithProximity();
  escapeBindProximityClicks();
};

function escapeProximityLoop() {
  if (!escapeModalIsOpen()) escapeUpdateObjectFocus();
  window.requestAnimationFrame(escapeProximityLoop);
}
window.requestAnimationFrame(escapeProximityLoop);


/* =========================================================
   CENÁRIO ESCOLAR E OBSTÁCULOS SÓLIDOS
========================================================= */

const escape2DObstacles = {
  classroom: [
    { type: "teacher-desk", x: 29, y: 24, w: 18, h: 9, label: "Mesa do professor" },
    { type: "desk-row", x: 26, y: 44, w: 22, h: 11, label: "Mesas e cadeiras" },
    { type: "desk-row", x: 56, y: 44, w: 22, h: 11, label: "Mesas e cadeiras" },
    { type: "cabinet-furniture", x: 71, y: 70, w: 14, h: 11, label: "Armário" }
  ],
  lab: [
    { type: "computer-table", x: 39, y: 42, w: 47, h: 12, label: "Bancada de computadores" },
    { type: "chair", x: 45, y: 61, w: 8, h: 7, label: "Cadeira" },
    { type: "chair", x: 63, y: 61, w: 8, h: 7, label: "Cadeira" },
    { type: "cabinet-furniture", x: 12, y: 70, w: 12, h: 16, label: "Armário de equipamentos" }
  ],
  library: [
    { type: "bookcase", x: 9, y: 18, w: 12, h: 58, label: "Estante" },
    { type: "bookcase", x: 79, y: 18, w: 12, h: 58, label: "Estante" },
    { type: "reading-table", x: 54, y: 53, w: 25, h: 12, label: "Mesa de leitura" },
    { type: "chair", x: 60, y: 70, w: 8, h: 7, label: "Cadeira" }
  ],
  science: [
    { type: "lab-bench", x: 12, y: 45, w: 38, h: 13, label: "Bancada de laboratório" },
    { type: "lab-bench", x: 56, y: 45, w: 32, h: 13, label: "Bancada de laboratório" },
    { type: "stool", x: 24, y: 66, w: 8, h: 7, label: "Banqueta" },
    { type: "stool", x: 69, y: 66, w: 8, h: 7, label: "Banqueta" }
  ],
  corridor: [
    { type: "locker-row", x: 7, y: 18, w: 86, h: 12, label: "Armários" },
    { type: "bench", x: 30, y: 58, w: 27, h: 9, label: "Banco" },
    { type: "plant", x: 80, y: 67, w: 9, h: 10, label: "Vaso de planta" }
  ],
  exit: [
    { type: "gate", x: 34, y: 35, w: 34, h: 12, label: "Portão eletrônico" }
  ]
};

function escape2DObstacleHTML(id) {
  return (escape2DObstacles[id] || []).map((obstacle) => `
    <div class="solid-obstacle obstacle-${obstacle.type}" aria-label="${obstacle.label}" title="${obstacle.label}"
      style="left:${obstacle.x}%;top:${obstacle.y}%;width:${obstacle.w}%;height:${obstacle.h}%;"></div>
  `).join("");
}

escape2DPropHTML = function(id) {
  const props = {
    classroom: '<div class="room-prop window left"></div><div class="room-prop window right"></div><div class="room-prop board-wall"></div>',
    lab: '<div class="room-prop window left"></div><div class="room-prop equipment-wall"></div>',
    library: '<div class="room-prop window left"></div><div class="room-prop window right"></div>',
    science: '<div class="room-prop window left"></div><div class="room-prop formula-board"></div>',
    corridor: '<div class="room-prop corridor-window"></div>',
    exit: '<div class="room-prop exit-light left"></div><div class="room-prop exit-light right"></div>'
  };
  return (props[id] || "") + escape2DObstacleHTML(id);
};


function escape2DIsBlocked(x, y) {
  const playerRadius = 3.4;
  return (escape2DObstacles[state.room] || []).some((obstacle) => {
    return x + playerRadius > obstacle.x &&
      x - playerRadius < obstacle.x + obstacle.w &&
      y + playerRadius > obstacle.y &&
      y - playerRadius < obstacle.y + obstacle.h;
  });
}


/* =========================================================
   PARTIDA ALEATÓRIA E PROGRESSÃO DINÂMICA
========================================================= */

function escapeRandomFrom(values) {
  return values[Math.floor(Math.random() * values.length)];
}

function escapeShuffle(values) {
  return [...values].sort(() => Math.random() - 0.5);
}

function escapeCreateRandomScenario() {
  const hour = String(10 + Math.floor(Math.random() * 10)).padStart(2, "0");
  const minute = String(10 + Math.floor(Math.random() * 50)).padStart(2, "0");
  const classroomCode = `${hour}${minute}`;
  const clockTime = `${hour}:${minute}`;
  const evenDigits = escapeShuffle(["2", "4", "6", "8"]);
  const computerCode = evenDigits.join("");
  const flaskStart = escapeRandomFrom([1, 2, 3, 4, 5]);
  const flaskAnswer = flaskStart * 8;
  const roomOrder = escapeShuffle(["lab", "library", "science", "corridor"]);
  const roomNumbers = { lab: "1", library: "2", science: "3", corridor: "4" };
  const lockerCode = roomOrder.map((room) => roomNumbers[room]).join("");
  const finalCode = classroomCode.slice(-2) + String(flaskAnswer).padStart(2, "0").slice(-2);
  const inspectorRooms = escapeShuffle(roomOrder).slice(0, 2);
  const bookSequence = escapeShuffle(["A", "E", "I", "O", "U"]).slice(0, 3).join(" — ");
  const answerLetters = escapeShuffle(["A", "B", "C", "D"]);

  return {
    classroomCode,
    clockTime,
    computerCode,
    computerSequence: evenDigits.join(" → "),
    flaskStart,
    flaskAnswer,
    flaskSequence: `${flaskStart} — ${flaskStart * 2} — ${flaskStart * 4} — ?`,
    roomOrder,
    lockerCode,
    finalCode,
    inspectorRooms,
    inspectorPositions: {},
    answerLetters,
    bookSequence,
    caughtCooldown: 0
  };
}

function escapeCompletionKey(room) {
  return {
    classroom: "classroomDoor",
    lab: "labComputer",
    library: "libraryBooks",
    science: "sciencePuzzle",
    corridor: "corridorDoor",
    exit: "finalDoor"
  }[room];
}

function escapeRoute() {
  return ["classroom", ...(state.random?.roomOrder || ["lab", "library", "science", "corridor"]), "exit"];
}

function escapeIsRoomUnlocked(id) {
  const route = escapeRoute();
  const index = route.indexOf(id);
  if (index <= 0) return id === "classroom";
  return state.solved.has(escapeCompletionKey(route[index - 1]));
}

const escapeOriginalResetState = resetState;
resetState = function() {
  escapeOriginalResetState();
  state.random = escapeCreateRandomScenario();
  state.lives = 3;
  state.inspectorCaught = false;
  render();
  toast("Nova partida: a ordem e os códigos foram sorteados.");
};

const escapeOriginalRenderMap = renderMap;
renderMap = function() {
  const route = escapeRoute();
  $("#mapButtons").innerHTML = route.map((id) => {
    const locked = !escapeIsRoomUnlocked(id);
    return `<button class="map-btn ${state.room === id ? "active" : ""} ${locked ? "locked" : ""}" data-room="${id}" ${locked ? "disabled" : ""} aria-label="${rooms[id].name}${locked ? ", bloqueada" : ""}">${rooms[id].icon} ${rooms[id].name}</button>`;
  }).join("");
  document.querySelectorAll("[data-room]").forEach((button) => {
    button.onclick = () => goRoom(button.dataset.room);
  });
};

const escapeOriginalGoRoom = goRoom;
goRoom = function(id) {
  if (!escapeIsRoomUnlocked(id)) {
    const route = escapeRoute();
    const index = route.indexOf(id);
    const previous = route[Math.max(0, index - 1)];
    return toast(`Resolva o desafio de ${rooms[previous]?.name || "esta etapa"} antes de seguir.`);
  }
  state.room = id;
  if (state.random?.inspectorRooms.includes(id)) toast("Atenção: há um inspetor nesta fase.");
  render();
};

const escapeOriginalRender = render;
render = function() {
  escapeOriginalRender();
  if ($("#lives")) $("#lives").textContent = state.lives ?? 3;
  if ($("#progressText")) {
    const route = escapeRoute();
    const completed = route.filter((room) => state.solved.has(escapeCompletionKey(room))).length;
    $("#progressText").textContent = `${Math.round(completed / 5 * 100)}%`;
  }
  if (typeof escapeUpdateInspectorMarkup === "function") escapeUpdateInspectorMarkup();
  if (typeof escapeRenderInventoryButtons === "function") escapeRenderInventoryButtons();
};

/* Puzzles com respostas sorteadas, mas sempre reveladas pelas pistas */
checkClassCode = function() {
  const value = $("#classCode")?.value.trim();
  if (value === state.random.classroomCode) {
    solve("classroomDoor"); closeModal(); render();
  } else failPuzzle("Código incorreto. Observe o horário indicado nas pistas.");
};

deskChoice = function(letter) {
  if (letter === state.random.answerLetters[0]) {
    addItem("key"); closeModal(); toast("Você encontrou uma chave.");
  } else failPuzzle("Essa letra não abre a gaveta.");
};

computerCheck = function() {
  const value = $("#answer")?.value.trim();
  if (value === state.random.computerCode) {
    solve("labComputer"); closeModal(); render();
  } else failPuzzle("Senha incorreta. Observe a sequência do teclado.");
};

flaskChoice = function(value) {
  if (Number(value) === state.random.flaskAnswer) {
    solve("sciencePuzzle"); addItem("card"); closeModal(); render();
  } else failPuzzle("Resposta incorreta. Cada número segue o mesmo padrão.");
};

lockerSolved = function() {
  const value = $("#lockerAnswer")?.value.trim();
  if (value === state.random.lockerCode) {
    solve("corridorDoor"); addItem("note"); closeModal(); render();
  } else {
    failPuzzle("Sequência incorreta. Consulte a ordem revelada no mural.");
  }
};

finalCheck = function() {
  const value = $("#finalAnswer")?.value.trim();
  if (value === state.random.finalCode) win();
  else failPuzzle("Senha incorreta. Combine os últimos números das pistas principais.");
};

/* Pistas dinâmicas */
openBlackboard = function() {
  modal(`<h3>🧑‍🏫 O quadro</h3><p>Uma frase foi escrita antes do último sinal:</p><div class="clue">A senha da sala está escondida no horário em que o último aluno saiu.</div><p>O relógio parou em <strong>${state.random.clockTime}</strong>.</p>`);
};
openClock = function() {
  modal(`<h3>🕐 Relógio</h3><p>O ponteiro parou em <strong>${state.random.clockTime}</strong>.</p><div class="clue">Use os quatro algarismos desse horário para abrir a porta.</div><div class="puzzle"><input id="classCode" inputmode="numeric" maxlength="4" placeholder="4 dígitos"><button class="primary-btn" onclick="checkClassCode()">TESTAR CÓDIGO</button><p id="puzzleMsg"></p></div>`);
};
openDesk = function() {
  const correct = state.random.answerLetters[0];
  modal(`<h3>🪑 Carteira</h3><p>A gaveta está presa.</p><div class="clue">A letra correta é a primeira desta sequência embaralhada: <strong>${state.random.answerLetters.join(" — ")}</strong>.</div><p>Qual letra abre a gaveta?</p><div class="choice-grid">${["A", "B", "C", "D"].map((letter) => `<button class="choice" onclick="deskChoice('${letter}')">${letter}</button>`).join("")}</div><p id="puzzleMsg"></p>`);
};
openKeyboard = function() {
  modal(`<h3>⌨️ Teclado</h3><p>As teclas marcadas formam esta sequência:</p><div class="sequence">${state.random.computerSequence}</div><div class="clue">Junte os algarismos na ordem indicada para formar a senha do computador.</div>`);
};
openComputer = function() {
  if (state.solved.has("labComputer")) return modal(`<h3>💻 Computador</h3><p class="success">Acesso liberado.</p><div class="clue">A biblioteca está na próxima sala da sequência.</div>`);
  modal(`<h3>💻 Computador</h3><p>Digite a senha encontrada no teclado.</p><div class="puzzle"><input id="answer" inputmode="numeric" maxlength="4" placeholder="4 dígitos"><button class="primary-btn" onclick="computerCheck()">ACESSAR</button><p id="puzzleMsg"></p></div>`);
};
openBooks = function() {
  modal(`<h3>📚 Os livros</h3><p>Os livros certos formam a sequência:</p><div class="sequence">${state.random.bookSequence}</div><button class="primary-btn" onclick="librarySolved()">REGISTRAR PISTA</button>`);
};
openFlasks = function() {
  const answer = state.random.flaskAnswer;
  const choices = escapeShuffle([answer, answer - 2, answer + 2, answer + 4]);
  modal(`<h3>🧪 Enigma dos frascos</h3><p>Observe a sequência:</p><div class="sequence">${state.random.flaskSequence}</div><p>Qual número vem depois?</p><div class="choice-grid">${choices.map((value) => `<button class="choice" onclick="flaskChoice(${value})">${value}</button>`).join("")}</div><p id="puzzleMsg"></p>`);
};
openLocker = function() {
  modal(`<h3>🗄️ Armário de manutenção</h3><p>O cadeado pede a sequência das salas.</p><div class="clue">A ordem foi revelada no mural. Use 1 para Laboratório, 2 para Biblioteca, 3 para Ciências e 4 para Corredor.</div><div class="sequence">${escapeRoute().slice(1, -1).map((id) => ({lab: "1", library: "2", science: "3", corridor: "4"}[id])).join(" → ")}</div><div class="puzzle"><input id="lockerAnswer" inputmode="numeric" maxlength="4" placeholder="4 números"><button class="primary-btn" onclick="lockerSolved()">ABRIR ARMÁRIO</button><p id="puzzleMsg"></p></div>`);
};
openNotice = function() {
  modal(`<h3>📌 Mural</h3><p>O aviso revela a ordem desta partida:</p><div class="clue">${escapeRoute().slice(1, -1).map((id, index) => `${index + 1}º — ${rooms[id].name}`).join("<br>")}</div><p>Essa sequência é necessária para interpretar o armário.</p>`);
};
openCamera = function() {
  modal(`<h3>📹 Câmera</h3><p>A câmera mostra o portão e registra as pistas principais.</p><div class="clue">Os dois últimos números do relógio são <strong>${state.random.classroomCode.slice(-2)}</strong>. O resultado dos frascos termina em <strong>${String(state.random.flaskAnswer).padStart(2, "0").slice(-2)}</strong>.</div>`);
};
openFinal = function() {
  if (!state.solved.has("corridorDoor")) return modal(`<h3>🔐 Portão</h3><p>O teclado ainda está bloqueado. Encontre o cartão e abra o armário do corredor.</p>`);
  modal(`<h3>🔐 Senha final</h3><p>Combine os dois últimos números do relógio com os dois últimos números do enigma dos frascos.</p><div class="code-display">${state.random.classroomCode.slice(-2)} + ${String(state.random.flaskAnswer).padStart(2, "0").slice(-2)}</div><div class="puzzle"><input id="finalAnswer" inputmode="numeric" maxlength="4" placeholder="4 dígitos"><button class="primary-btn" onclick="finalCheck()">ABRIR PORTÃO</button><p id="puzzleMsg"></p></div>`);
};


/* =========================================================
   INVENTÁRIO FUNCIONAL E INSPETORES
========================================================= */

const escapeInventoryDescriptions = {
  key: "Chave encontrada na carteira. Pode abrir armários e portas internas.",
  card: "Cartão de acesso. Libera o portão principal quando todas as pistas forem resolvidas.",
  note: "Bilhete com a ordem dos números importantes da escola.",
  book: "Livro encontrado na biblioteca. A etiqueta contém parte da pista final.",
  battery: "Bateria reserva. Mantém equipamentos antigos funcionando.",
  lens: "Lupa usada para revelar detalhes escondidos nas pistas."
};

function escapeRenderInventoryButtons() {
  const inventory = $("#inventory");
  if (!inventory) return;
  inventory.innerHTML = Object.keys(itemData).map((id) => {
    const collected = state.inventory.includes(id);
    return `<button class="item ${collected ? "collected" : "empty"}" data-inventory="${id}" ${collected ? "" : "disabled"} aria-label="${collected ? itemData[id].name + ". Clique para ver e usar." : "Espaço vazio"} title="${collected ? "Clique para ver e usar" : "Espaço vazio"}">${collected ? `<span>${itemData[id].icon}</span><small>${itemData[id].name}</small>` : ""}</button>`;
  }).join("");
  inventory.querySelectorAll("[data-inventory]").forEach((button) => {
    button.addEventListener("click", () => escapeUseInventory(button.dataset.inventory));
  });
  const count = $("#itemCount");
  if (count) count.textContent = `${state.inventory.length}/${Object.keys(itemData).length}`;
}

renderInventory = escapeRenderInventoryButtons;

function escapeUseInventory(id) {
  if (!state.inventory.includes(id)) return;
  const canHelp = {
    key: "A chave pode ser usada quando um armário ou porta pedir acesso.",
    card: "Leve este cartão até o portão principal depois de concluir as pistas.",
    note: "Leia o bilhete para relembrar a sequência de números descoberta.",
    book: "A etiqueta do livro confirma a pista da biblioteca.",
    battery: "A bateria pode ser consultada como evidência, mas não precisa ser gasta.",
    lens: "A lupa ajuda a enxergar pequenas marcas nas pistas."
  }[id];
  modal(`<h3>${itemData[id].icon} ${itemData[id].name}</h3><p>${escapeInventoryDescriptions[id]}</p><div class="clue">${canHelp}</div><button class="primary-btn" onclick="closeModal()">VOLTAR AO JOGO</button>`);
}

function escapeInspectorHTML(id) {
  if (!state.random?.inspectorRooms?.includes(id)) return "";
  const position = state.random.inspectorPositions[id] || { x: 20, y: 28 };
  return `<div id="escapeInspector" class="escape-inspector" style="left:${position.x}%;top:${position.y}%;" aria-label="Inspetor patrulhando esta fase"><span>🧑‍🏫</span><small>INSPETOR</small></div>`;
}

/* A marcação da sala recebe o inspetor sem transformar o jogo em perseguição constante. */
const escapeRoomWithInspector = escape2DRoomHTML;
escape2DRoomHTML = function(id) {
  return escapeRoomWithInspector(id).replace('<div id="topdownPlayer"', `${escapeInspectorHTML(id)}<div id="topdownPlayer"`);
};
roomHTML = escape2DRoomHTML;

function escapeUpdateInspectorMarkup() {
  const id = state.room;
  if (!state.random?.inspectorRooms?.includes(id) || !state.started) return;
  const inspector = state.random.inspectorPositions[id] || (state.random.inspectorPositions[id] = { x: 20, y: 28, direction: 1 });
  const element = $("#escapeInspector");
  if (!element) return;
  const player = escape2DPositions[id];
  if (!player) return;
  const now = performance.now();
  inspector.x += inspector.direction * 0.08;
  if (inspector.x > 78 || inspector.x < 18) inspector.direction *= -1;
  element.style.left = `${inspector.x}%`;
  element.style.top = `${inspector.y}%`;
  const distance = Math.hypot(player.x - inspector.x, player.y - inspector.y);
  if (distance < 13 && (state.random.caughtCooldown || 0) <= 0) toast("Cuidado: o inspetor está próximo. Afaste-se!");
  if (distance < 7 && (state.random.caughtCooldown || 0) <= 0) {
    state.random.caughtCooldown = 2200;
    state.lives = Math.max(0, (state.lives ?? 3) - 1);
    playEscapeSound("error");
    if ($("#lives")) $("#lives").textContent = state.lives;
    if (state.lives <= 0) {
      state.started = false;
      clearInterval(state.timer);
      showScreen("loseScreen");
    } else {
      player.x = 50; player.y = 82;
      const playerElement = $("#topdownPlayer");
      if (playerElement) { playerElement.style.left = "50%"; playerElement.style.top = "82%"; }
      toast(`O inspetor encontrou você. Vidas restantes: ${state.lives}`);
    }
  }
  if (state.random.caughtCooldown > 0) state.random.caughtCooldown = Math.max(0, state.random.caughtCooldown - (now - (state.random.lastInspectorTick || now)));
  state.random.lastInspectorTick = now;
}

const escapeOriginalProximityLoop = escapeProximityLoop;
escapeProximityLoop = function() {
  escapeOriginalProximityLoop();
  escapeUpdateInspectorMarkup();
};

/* Garante que os botões inline dos puzzles usem as versões aleatórias. */
Object.assign(window, { checkClassCode, deskChoice, computerCheck, librarySolved, flaskChoice, lockerSolved, finalCheck, closeModal });
$("#startBtn").onclick = resetState;
$("#playAgainBtn").onclick = resetState;
$("#tryAgainBtn").onclick = resetState;
