/* =========================================================
   ESCAPE SCHOOL – DEPOIS DO SINAL!
   SCRIPT COMPLETO
   Versão com visual 2D visto de cima
   ========================================================= */

const $ = (selector) => document.querySelector(selector);

/* =========================================================
   ESTADO DO JOGO
   ========================================================= */

const rooms = {
    classroom: {
        name: "Sala de Aula",
        objective: "Descubra o código escondido na sala."
    },
    lab: {
        name: "Laboratório de Informática",
        objective: "Encontre a senha do computador."
    },
    library: {
        name: "Biblioteca",
        objective: "Descubra a palavra escondida nos livros."
    },
    science: {
        name: "Laboratório de Ciências",
        objective: "Resolva a sequência dos frascos."
    },
    corridor: {
        name: "Corredor",
        objective: "Abra o armário e descubra o próximo caminho."
    },
    exit: {
        name: "Saída",
        objective: "Descubra a senha final e escape da escola!"
    }
};

const state = {
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

/* =========================================================
   OBJETOS DAS SALAS
   ========================================================= */

const topDownObjects = {

    classroom: [
        { action: "blackboard", x: 18, y: 20, icon: "📋", label: "Quadro" },
        { action: "clock", x: 78, y: 18, icon: "🕐", label: "Relógio" },
        { action: "desk", x: 42, y: 48, icon: "🪑", label: "Mesa" },
        { action: "cabinet", x: 76, y: 65, icon: "🗄️", label: "Armário" }
    ],

    lab: [
        { action: "computer", x: 65, y: 35, icon: "💻", label: "Computador" },
        { action: "keyboard", x: 65, y: 55, icon: "⌨️", label: "Teclado" },
        { action: "shelf", x: 20, y: 65, icon: "📚", label: "Estante" }
    ],

    library: [
        { action: "books", x: 20, y: 30, icon: "📚", label: "Livros" },
        { action: "catalog", x: 48, y: 25, icon: "📖", label: "Catálogo" },
        { action: "reading", x: 70, y: 65, icon: "📕", label: "Mesa de leitura" }
    ],

    science: [
        { action: "flasks", x: 25, y: 32, icon: "🧪", label: "Frascos" },
        { action: "board", x: 70, y: 25, icon: "🧮", label: "Quadro" },
        { action: "box", x: 65, y: 65, icon: "📦", label: "Caixa" }
    ],

    corridor: [
        { action: "locker", x: 25, y: 48, icon: "🔐", label: "Armário" },
        { action: "notice", x: 50, y: 25, icon: "📌", label: "Aviso" },
        { action: "camera", x: 78, y: 48, icon: "📹", label: "Câmera" }
    ],

    exit: [
        { action: "final", x: 50, y: 25, icon: "🚪", label: "Portão" }
    ]
};

/* =========================================================
   PLAYER
   ========================================================= */

const topDownPlayer = {
    x: 50,
    y: 78,
    speed: 0.45,
    keys: {}
};

/* =========================================================
   UTILIDADES
   ========================================================= */

function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const screen = document.getElementById(screenId);

    if (screen) {
        screen.classList.add("active");
    }
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function addInventory(item) {
    if (!state.inventory.includes(item)) {
        state.inventory.push(item);
    }
}

function hasItem(item) {
    return state.inventory.includes(item);
}

function markSolved(name) {
    state.solved.add(name);
}

function isSolved(name) {
    return state.solved.has(name);
}

function message(text) {
    const element = $("#messageText");

    if (element) {
        element.textContent = text;
    }
}

function openModal(content) {
    const modal = $("#modal");
    const modalContent = $("#modalContent");

    if (!modal || !modalContent) return;

    modalContent.innerHTML = content;
    modal.classList.add("active");
}

function closeModal() {
    const modal = $("#modal");

    if (modal) {
        modal.classList.remove("active");
    }
}

/* =========================================================
   INICIAR / REINICIAR
   ========================================================= */

function resetState() {

    if (state.timer) {
        clearInterval(state.timer);
    }

    state.room = "classroom";
    state.inventory = [];
    state.solved = new Set();
    state.flags = {};
    state.hints = 3;
    state.time = 900;
    state.score = 1000;
    state.started = true;

    topDownPlayer.x = 50;
    topDownPlayer.y = 78;

    showScreen("gameScreen");

    updateHintCounter();

    render();

    startTimer();
}

function startTimer() {

    if (state.timer) {
        clearInterval(state.timer);
    }

    state.timer = setInterval(() => {

        if (!state.started) return;

        state.time--;

        if (state.time < 0) {
            state.time = 0;
        }

        updateTimer();

        if (state.time <= 0) {
            lose();
        }

    }, 1000);
}

/* =========================================================
   RENDER
   ========================================================= */

function render() {

    updateLocation();
    updateTimer();
    updateMap();
    updateInventory();
    updateProgress();
    updateObjective();
    updateHintCounter();

    const room = $("#room");

    if (room) {
        room.innerHTML = topDownRoomHTML(state.room);
    }

    bindTopDownObjects();
}

function updateLocation() {

    const element = $("#locationName");

    if (element && rooms[state.room]) {
        element.textContent = rooms[state.room].name;
    }
}

function updateTimer() {

    const element = $("#timer");

    if (element) {
        element.textContent = formatTime(state.time);
    }
}

function updateHintCounter() {

    const element = $("#hintCount");

    if (element) {
        element.textContent = state.hints;
    }
}

function updateObjective() {

    const element = $("#objectiveText");

    if (!element || !rooms[state.room]) return;

    element.textContent = rooms[state.room].objective;
}

function updateInventory() {

    const element = $("#inventory");

    if (!element) return;

    if (state.inventory.length === 0) {
        element.innerHTML = "<span>Nenhum item</span>";
        return;
    }

    element.innerHTML = state.inventory
        .map(item => `<span class="inventory-item">${item}</span>`)
        .join("");
}

function updateProgress() {

    const element = $("#progressText");

    if (!element) return;

    const total = 5;
    const completed = state.solved.size;

    element.textContent = `${completed}/${total}`;
}

function updateMap() {

    const container = $("#mapButtons");

    if (!container) return;

    const roomOrder = [
        "classroom",
        "lab",
        "library",
        "science",
        "corridor",
        "exit"
    ];

    container.innerHTML = "";

    roomOrder.forEach(id => {

        const button = document.createElement("button");

        button.textContent = rooms[id].name;
        button.className = "map-btn";

        if (id === state.room) {
            button.classList.add("active");
        }

        button.onclick = () => goRoom(id);

        container.appendChild(button);
    });
}

/* =========================================================
   MOVIMENTAÇÃO ENTRE SALAS
   ========================================================= */

function goRoom(id) {

    if (!rooms[id]) return;

    if (id === "lab" && !isSolved("classroomDoor")) {
        message("Você ainda não descobriu como sair da sala de aula.");
        return;
    }

    if (id === "library" && !isSolved("labComputer")) {
        message("O laboratório ainda está bloqueado.");
        return;
    }

    if (id === "science" && !isSolved("libraryBooks")) {
        message("Você precisa resolver o enigma da biblioteca.");
        return;
    }

    if (id === "corridor" && !isSolved("sciencePuzzle")) {
        message("Você precisa resolver o laboratório de ciências.");
        return;
    }

    if (id === "exit" && !isSolved("corridorDoor")) {
        message("A saída ainda está trancada.");
        return;
    }

    state.room = id;

    topDownPlayer.x = 50;
    topDownPlayer.y = 78;

    message(`Você entrou em: ${rooms[id].name}`);

    render();
}

/* =========================================================
   SALAS EM 2D VISTAS DE CIMA
   ========================================================= */

function topDownRoomHTML(id) {

    const room = rooms[id];
    const objects = topDownObjects[id] || [];

    let objectsHTML = "";

    objects.forEach(obj => {

        objectsHTML += `
            <button
                class="topdown-object"
                data-action="${obj.action}"
                style="left:${obj.x}%; top:${obj.y}%"
                title="${obj.label}"
            >
                <span class="object-icon">${obj.icon}</span>
                <span class="object-label">${obj.label}</span>
            </button>
        `;
    });

    return `
        <div class="topdown-wrap">

            <div class="topdown-header">
                <strong>${room.name}</strong>
                <span>Explore a sala e clique nos objetos.</span>
            </div>

            <div class="topdown-map">

                <div class="topdown-wall wall-top"></div>
                <div class="topdown-wall wall-bottom"></div>
                <div class="topdown-wall wall-left"></div>
                <div class="topdown-wall wall-right"></div>

                <div class="floor-line line-1"></div>
                <div class="floor-line line-2"></div>
                <div class="floor-line line-3"></div>
                <div class="floor-line line-4"></div>

                <div class="room-label start-label">
                    INÍCIO
                </div>

                <div class="room-label exit-label">
                    SAÍDA
                </div>

                ${objectsHTML}

                <div
                    id="topdownPlayer"
                    class="topdown-player"
                    style="left:${topDownPlayer.x}%; top:${topDownPlayer.y}%"
                >
                    🧍
                </div>

            </div>

            <div class="movement-area">

                <div class="movement-title">
                    MOVIMENTAÇÃO
                </div>

                <div class="movement-buttons">

                    <button data-move="up">⬆️</button>

                    <div>
                        <button data-move="left">⬅️</button>
                        <button data-move="down">⬇️</button>
                        <button data-move="right">➡️</button>
                    </div>

                </div>

                <small>
                    Use as setas ou W A S D para andar.
                </small>

            </div>

        </div>
    `;
}

/* =========================================================
   CONTROLES DO 2D
   ========================================================= */

function bindTopDownObjects() {

    document.querySelectorAll("[data-action]").forEach(button => {

        button.addEventListener("click", () => {

            const action = button.dataset.action;

            actions(action);
        });
    });

    document.querySelectorAll("[data-move]").forEach(button => {

        const direction = button.dataset.move;

        const start = (event) => {
            event.preventDefault();
            topDownPlayer.keys[direction] = true;
        };

        const stop = (event) => {
            event.preventDefault();
            topDownPlayer.keys[direction] = false;
        };

        button.addEventListener("pointerdown", start);
        button.addEventListener("pointerup", stop);
        button.addEventListener("pointerleave", stop);
        button.addEventListener("pointercancel", stop);
    });
}

/* =========================================================
   TECLADO
   ========================================================= */

document.addEventListener("keydown", event => {

    const key = event.key.toLowerCase();

    if (key === "arrowup" || key === "w") {
        topDownPlayer.keys.up = true;
    }

    if (key === "arrowdown" || key === "s") {
        topDownPlayer.keys.down = true;
    }

    if (key === "arrowleft" || key === "a") {
        topDownPlayer.keys.left = true;
    }

    if (key === "arrowright" || key === "d") {
        topDownPlayer.keys.right = true;
    }
});

document.addEventListener("keyup", event => {

    const key = event.key.toLowerCase();

    if (key === "arrowup" || key === "w") {
        topDownPlayer.keys.up = false;
    }

    if (key === "arrowdown" || key === "s") {
        topDownPlayer.keys.down = false;
    }

    if (key === "arrowleft" || key === "a") {
        topDownPlayer.keys.left = false;
    }

    if (key === "arrowright" || key === "d") {
        topDownPlayer.keys.right = false;
    }
});

/* =========================================================
   LOOP DO JOGADOR
   ========================================================= */

function topDownLoop() {

    if (state.started) {

        let moved = false;

        if (topDownPlayer.keys.up) {
            topDownPlayer.y -= topDownPlayer.speed;
            moved = true;
        }

        if (topDownPlayer.keys.down) {
            topDownPlayer.y += topDownPlayer.speed;
            moved = true;
        }

        if (topDownPlayer.keys.left) {
            topDownPlayer.x -= topDownPlayer.speed;
            moved = true;
        }

        if (topDownPlayer.keys.right) {
            topDownPlayer.x += topDownPlayer.speed;
            moved = true;
        }

        topDownPlayer.x = Math.max(
            7,
            Math.min(93, topDownPlayer.x)
        );

        topDownPlayer.y = Math.max(
            10,
            Math.min(90, topDownPlayer.y)
        );

        if (moved) {

            const player = document.getElementById("topdownPlayer");

            if (player) {
                player.style.left = `${topDownPlayer.x}%`;
                player.style.top = `${topDownPlayer.y}%`;
            }
        }
    }

    requestAnimationFrame(topDownLoop);
}

topDownLoop();

/* =========================================================
   SISTEMA DE AÇÕES
   ========================================================= */

function actions(action) {

    switch (action) {

        case "blackboard":
            openBlackboard();
            break;

        case "clock":
            openClock();
            break;

        case "desk":
            openDesk();
            break;

        case "cabinet":
            openCabinet();
            break;

        case "computer":
            openComputer();
            break;

        case "keyboard":
            openKeyboard();
            break;

        case "shelf":
            openShelf();
            break;

        case "books":
            openBooks();
            break;

        case "catalog":
            openCatalog();
            break;

        case "reading":
            openReading();
            break;

        case "flasks":
            openFlasks();
            break;

        case "board":
            openBoard();
            break;

        case "box":
            openBox();
            break;

        case "locker":
            openLocker();
            break;

        case "notice":
            openNotice();
            break;

        case "camera":
            openCamera();
            break;

        case "final":
            openFinal();
            break;
    }
}

/* =========================================================
   SALA DE AULA
   ========================================================= */

function openBlackboard() {

    if (isSolved("blackboard")) {
        openModal(`
            <h2>Quadro</h2>
            <p>Você já examinou o quadro.</p>
            <p><strong>Parece que o relógio é importante...</strong></p>
        `);
        return;
    }

    openModal(`
        <h2>Quadro</h2>

        <p>Há uma anotação escrita no canto do quadro:</p>

        <div class="clue">
            "O tempo pode abrir portas."
        </div>

        <p>Talvez você deva observar o relógio.</p>

        <button class="primary-btn" onclick="closeModal()">
            Entendi
        </button>
    `);

    markSolved("blackboard");
}

function openClock() {

    openModal(`
        <h2>Relógio</h2>

        <p>O relógio está parado exatamente em:</p>

        <div class="big-code">
            16:20
        </div>

        <p>Talvez esse horário seja um código.</p>

        <input
            id="classCode"
            type="text"
            maxlength="4"
            placeholder="Digite o código"
        >

        <button class="primary-btn" onclick="checkClassCode()">
            Confirmar
        </button>
    `);
}

function checkClassCode() {

    const input = $("#classCode");

    if (!input) return;

    const value = input.value.trim();

    if (value === "1620") {

        markSolved("classroomDoor");

        state.score += 100;

        addInventory("🔑 Chave da sala");

        closeModal();

        message("Código correto! Você encontrou a chave da sala.");

        render();

    } else {

        state.score -= 25;

        message("Código incorreto. Observe melhor o relógio.");

        input.value = "";
    }
}

function openDesk() {

    if (hasItem("🔑 Chave da sala")) {

        openModal(`
            <h2>Mesa</h2>
            <p>Você encontra apenas materiais escolares.</p>
            <p>A chave que encontrou parece ser mais importante.</p>

            <button class="primary-btn" onclick="closeModal()">
                Fechar
            </button>
        `);

        return;
    }

    openModal(`
        <h2>Mesa</h2>

        <p>Há duas gavetas.</p>

        <button class="choice-btn" onclick="deskChoice('A')">
            Abrir gaveta A
        </button>

        <button class="choice-btn" onclick="deskChoice('B')">
            Abrir gaveta B
        </button>
    `);
}

function deskChoice(choice) {

    if (choice === "A") {

        addInventory("🔑 Chave da sala");

        closeModal();

        message("Você encontrou uma chave!");

        render();

    } else {

        openModal(`
            <h2>Gaveta B</h2>
            <p>Está vazia.</p>

            <button class="primary-btn" onclick="closeModal()">
                Voltar
            </button>
        `);
    }
}

function openCabinet() {

    openModal(`
        <h2>Armário</h2>

        <p>O armário está cheio de livros e materiais antigos.</p>

        <p>
            Você encontra uma pequena frase:
            <strong>"A tecnologia guarda segredos."</strong>
        </p>

        <button class="primary-btn" onclick="closeModal()">
            Fechar
        </button>
    `);
}

/* =========================================================
   LABORATÓRIO DE INFORMÁTICA
   ========================================================= */

function openComputer() {

    if (isSolved("labComputer")) {

        openModal(`
            <h2>Computador</h2>

            <p>O computador está desbloqueado.</p>

            <p>
                Na tela aparece:
                <strong>"Procure a biblioteca."</strong>
            </p>

            <button class="primary-btn" onclick="closeModal()">
                Fechar
            </button>
        `);

        return;
    }

    openModal(`
        <h2>Computador</h2>

        <p>O computador está protegido por uma senha.</p>

        <p>
            A tela mostra:
            <strong>"Descubra a sequência no teclado."</strong>
        </p>

        <button class="primary-btn" onclick="closeModal()">
            Fechar
        </button>
    `);
}

function openKeyboard() {

    openModal(`
        <h2>Teclado</h2>

        <p>Algumas teclas estão destacadas:</p>

        <div class="big-code">
            2 - 4 - 6 - 8
        </div>

        <p>Isso provavelmente é a senha.</p>

        <input
            id="computerCode"
            type="text"
            maxlength="4"
            placeholder="Senha"
        >

        <button class="primary-btn" onclick="computerCheck()">
            Confirmar
        </button>
    `);
}

function computerCheck() {

    const input = $("#computerCode");

    if (!input) return;

    if (input.value.trim() === "2468") {

        markSolved("labComputer");

        state.score += 150;

        addInventory("💾 Acesso ao computador");

        closeModal();

        message("Senha correta! O computador foi desbloqueado.");

        render();

    } else {

        state.score -= 25;

        message("Senha incorreta.");

        input.value = "";
    }
}

function openShelf() {

    if (!hasItem("🔋 Bateria")) {

        addInventory("🔋 Bateria");

        openModal(`
            <h2>Estante</h2>

            <p>
                Entre os equipamentos antigos você encontrou
                uma bateria.
            </p>

            <p><strong>Item adicionado ao inventário.</strong></p>

            <button class="primary-btn" onclick="closeModal()">
                Pegar
            </button>
        `);

        return;
    }

    openModal(`
        <h2>Estante</h2>

        <p>Você já pegou a bateria.</p>

        <button class="primary-btn" onclick="closeModal()">
            Fechar
        </button>
    `);
}

/* =========================================================
   BIBLIOTECA
   ========================================================= */

function openBooks() {

    openModal(`
        <h2>Livros</h2>

        <p>Três livros parecem diferentes:</p>

        <div class="clue">
            Livro 3<br>
            Livro 7<br>
            Livro 12
        </div>

        <p>
            Os números parecem formar alguma coisa.
        </p>

        <button class="primary-btn" onclick="librarySolved()">
            Examinar
        </button>
    `);
}

function librarySolved() {

    markSolved("libraryBooks");

    state.score += 150;

    addInventory("📕 Livro com a pista");

    openModal(`
        <h2>Pista encontrada!</h2>

        <p>Os livros formam a palavra:</p>

        <div class="big-code">
            CORREDOR
        </div>

        <p>
            Talvez essa palavra indique para onde você deve ir.
        </p>

        <button class="primary-btn" onclick="closeModal(); render()">
            Continuar
        </button>
    `);
}

function openCatalog() {

    openModal(`
        <h2>Catálogo</h2>

        <p>
            O catálogo possui vários registros de alunos.
        </p>

        <p>
            Um registro está marcado:
        </p>

        <div class="clue">
            "A resposta está onde os livros descansam."
        </div>

        <button class="primary-btn" onclick="closeModal()">
            Fechar
        </button>
    `);
}

function openReading() {

    if (!hasItem("🔎 Lente")) {

        addInventory("🔎 Lente");

        openModal(`
            <h2>Mesa de leitura</h2>

            <p>
                Debaixo da mesa você encontrou uma pequena lente.
            </p>

            <p><strong>Lente adicionada ao inventário.</strong></p>

            <button class="primary-btn" onclick="closeModal()">
                Pegar
            </button>
        `);

        return;
    }

    openModal(`
        <h2>Mesa de leitura</h2>

        <p>Você já encontrou a lente.</p>

        <button class="primary-btn" onclick="closeModal()">
            Fechar
        </button>
    `);
}

/* =========================================================
   LABORATÓRIO DE CIÊNCIAS
   ========================================================= */

function openFlasks() {

    openModal(`
        <h2>Frascos</h2>

        <p>
            Os frascos possuem números:
        </p>

        <div class="big-code">
            1 → 2 → 4 → 8 → ?
        </div>

        <p>
            Qual é o próximo número?
        </p>

        <input
            id="flaskCode"
            type="number"
            placeholder="Resposta"
        >

        <button class="primary-btn" onclick="flaskChoice()">
            Confirmar
        </button>
    `);
}

function flaskChoice() {

    const input = $("#flaskCode");

    if (!input) return;

    if (input.value.trim() === "16") {

        markSolved("sciencePuzzle");

        state.score += 200;

        addInventory("🪪 Cartão de acesso");

        closeModal();

        message("Sequência correta! Você encontrou um cartão.");

        render();

    } else {

        state.score -= 30;

        message("Resposta incorreta. Observe a sequência.");

        input.value = "";
    }
}

function openBoard() {

    openModal(`
        <h2>Quadro de Ciências</h2>

        <p>Há uma expressão escrita:</p>

        <div class="big-code">
            2 × 2 × 2 × 2
        </div>

        <p>
            Ela parece confirmar a lógica da sequência dos frascos.
        </p>

        <button class="primary-btn" onclick="closeModal()">
            Fechar
        </button>
    `);
}

function openBox() {

    if (!isSolved("sciencePuzzle")) {

        openModal(`
            <h2>Caixa</h2>

            <p>
                A caixa está trancada.
            </p>

            <p>
                Você precisa resolver o enigma dos frascos primeiro.
            </p>

            <button class="primary-btn" onclick="closeModal()">
                Fechar
            </button>
        `);

        return;
    }

    openModal(`
        <h2>Caixa</h2>

        <p>
            O cartão encontrado no laboratório permite abrir a caixa.
        </p>

        <p>
            Dentro dela existe uma anotação:
        </p>

        <div class="clue">
            "O corredor guarda a última chave."
        </div>

        <button class="primary-btn" onclick="closeModal()">
            Fechar
        </button>
    `);
}

/* =========================================================
   CORREDOR
   ========================================================= */

function openLocker() {

    openModal(`
        <h2>Armário do corredor</h2>

        <p>
            O armário possui um teclado numérico.
        </p>

        <p>
            Uma pequena etiqueta mostra:
        </p>

        <div class="big-code">
            1 - 2 - 3
        </div>

        <input
            id="lockerCode"
            type="text"
            maxlength="3"
            placeholder="Código"
        >

        <button class="primary-btn" onclick="lockerSolved()">
            Abrir
        </button>
    `);
}

function lockerSolved() {

    const input = $("#lockerCode");

    if (!input) return;

    if (input.value.trim() === "123") {

        markSolved("corridorDoor");

        state.score += 200;

        addInventory("📝 Bilhete da saída");

        closeModal();

        message("Armário aberto! Você encontrou um bilhete.");

        render();

    } else {

        state.score -= 25;

        message("Código incorreto.");

        input.value = "";
    }
}

function openNotice() {

    openModal(`
        <h2>Aviso</h2>

        <p>
            Há um aviso antigo preso na parede.
        </p>

        <div class="clue">
            "A câmera observa tudo,
            mas não consegue esconder o que está escrito."
        </div>

        <button class="primary-btn" onclick="closeModal()">
            Fechar
        </button>
    `);
}

function openCamera() {

    openModal(`
        <h2>Câmera</h2>

        <p>
            A câmera está apontada para a saída.
        </p>

        <p>
            Em uma pequena etiqueta está escrito:
        </p>

        <div class="big-code">
            2016
        </div>

        <p>
            Talvez esse seja o código final.
        </p>

        <button class="primary-btn" onclick="closeModal()">
            Fechar
        </button>
    `);
}

/* =========================================================
   SAÍDA FINAL
   ========================================================= */

function openFinal() {

    openModal(`
        <h2>🚪 Portão da Escola</h2>

        <p>
            Você chegou à saída!
        </p>

        <p>
            O portão pede uma senha de quatro números.
        </p>

        <input
            id="finalCode"
            type="text"
            maxlength="4"
            placeholder="Senha final"
        >

        <button class="primary-btn" onclick="finalCheck()">
            Abrir portão
        </button>
    `);
}

function finalCheck() {

    const input = $("#finalCode");

    if (!input) return;

    if (input.value.trim() === "2016") {

        closeModal();

        state.score += 300;

        win();

    } else {

        state.score -= 50;

        message("Senha final incorreta.");

        input.value = "";
    }
}

/* =========================================================
   VITÓRIA
   ========================================================= */

function win() {

    state.started = false;

    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }

    if (state.time > 0) {
        state.score += state.time;
    }

    if (state.score < 0) {
        state.score = 0;
    }

    const summary = $("#winSummary");
    const finalScore = $("#finalScore");

    if (summary) {
        summary.textContent =
            "Você resolveu os enigmas e conseguiu escapar da escola antes que o tempo acabasse!";
    }

    if (finalScore) {
        finalScore.textContent = state.score;
    }

    showScreen("winScreen");
}

/* =========================================================
   DERROTA
   ========================================================= */

function lose() {

    state.started = false;

    if (state.timer) {
        clearInterval(state.timer);
        state.timer = null;
    }

    showScreen("loseScreen");
}

/* =========================================================
   DICAS
   ========================================================= */

function useHint() {

    if (state.hints <= 0) {
        message("Você não possui mais dicas.");
        return;
    }

    state.hints--;

    updateHintCounter();

    const hints = {

        classroom:
            "Dica: observe o relógio. O horário mostrado pode ser usado como código.",

        lab:
            "Dica: procure uma sequência numérica perto do computador.",

        library:
            "Dica: os livros 3, 7 e 12 são importantes.",

        science:
            "Dica: a sequência 1, 2, 4, 8 continua dobrando.",

        corridor:
            "Dica: observe o código indicado no armário.",

        exit:
            "Dica: a câmera possui uma pista importante para a senha final."
    };

    message(hints[state.room] || "Explore melhor o ambiente.");
}

/* =========================================================
   EVENTOS DOS BOTÕES DO HTML
   ========================================================= */

const startButton = $("#startBtn");

if (startButton) {
    startButton.addEventListener("click", resetState);
}

const howButton = $("#howBtn");

if (howButton) {

    howButton.addEventListener("click", () => {

        openModal(`
            <h2>Como jogar</h2>

            <p>
                Explore cada sala e procure pistas.
            </p>

            <p>
                Clique nos objetos para investigar.
            </p>

            <p>
                Você também pode andar pelo mapa usando
                as setas ou as teclas W, A, S e D.
            </p>

            <p>
                Resolva os enigmas para desbloquear as próximas salas.
            </p>

            <button class="primary-btn" onclick="closeModal()">
                Entendi
            </button>
        `);
    });
}

const hintButton = $("#hintBtn");

if (hintButton) {
    hintButton.addEventListener("click", useHint);
}

const restartButton = $("#restartBtn");

if (restartButton) {
    restartButton.addEventListener("click", resetState);
}

const playAgainButton = $("#playAgainBtn");

if (playAgainButton) {
    playAgainButton.addEventListener("click", resetState);
}

const tryAgainButton = $("#tryAgainBtn");

if (tryAgainButton) {
    tryAgainButton.addEventListener("click", resetState);
}

const modalClose = $("#modalClose");

if (modalClose) {
    modalClose.addEventListener("click", closeModal);
}

/* =========================================================
   FECHAR MODAL CLICANDO FORA
   ========================================================= */

const modal = $("#modal");

if (modal) {

    modal.addEventListener("click", event => {

        if (event.target === modal) {
            closeModal();
        }
    });
}

/* =========================================================
   GARANTIA PARA BOTÕES INLINE
   ========================================================= */

window.checkClassCode = checkClassCode;
window.deskChoice = deskChoice;
window.computerCheck = computerCheck;
window.librarySolved = librarySolved;
window.flaskChoice = flaskChoice;
window.lockerSolved = lockerSolved;
window.finalCheck = finalCheck;
window.closeModal = closeModal;

/* =========================================================
   FIM DO SCRIPT
   ========================================================= */
