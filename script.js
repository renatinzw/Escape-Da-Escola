import * as THREE from "three";

/* =========================================================
   ESCAPE DA ESCOLA 3D
   JavaScript principal
   ========================================================= */

/* =========================================================
   CONFIGURAÇÕES
   ========================================================= */

const GAME_TIME = 15 * 60;
const MAX_ENERGY = 100;
const INVENTORY_LIMIT = 8;

const PLAYER_HEIGHT = 1.7;
const WALK_SPEED = 3.2;
const RUN_SPEED = 5.5;
const MOUSE_SENSITIVITY = 0.0022;

const FLASHLIGHT_DRAIN = 2.5;

/* =========================================================
   ESTADO DO JOGO
   ========================================================= */

const game = {
    started: false,
    paused: false,
    gameOver: false,
    victory: false,

    time: GAME_TIME,
    energy: MAX_ENERGY,

    flashlightOn: true,

    inventory: [],

    currentObjective: "Encontre uma saída.",

    currentLocation: "ENTRADA",

    nearObject: null,

    keys: {
        w: false,
        a: false,
        s: false,
        d: false,
        shift: false
    },

    joystick: {
        active: false,
        x: 0,
        y: 0
    }
};

/* =========================================================
   ELEMENTOS HTML
   ========================================================= */

const $ = (id) => document.getElementById(id);

const loading = $("loading");
const loadingProgress = $("loadingProgress");
const loadingText = $("loadingText");

const startScreen = $("startScreen");
const startButton = $("startButton");
const continueButton = $("continueButton");

const hud = $("hud");

const objectiveElement = $("objective");
const timerElement = $("timer");

const interactionPrompt = $("interactionPrompt");
const interactionText = $("interactionText");

const messageContainer = $("messageContainer");

const energyFill = $("energyFill");
const energyText = $("energyText");

const inventoryItems = $("inventoryItems");
const itemCount = $("itemCount");

const locationName = $("locationName");
const saveIndicator = $("saveIndicator");

const pauseScreen = $("pauseScreen");
const resumeButton = $("resumeButton");
const restartButton = $("restartButton");

const noteModal = $("noteModal");
const closeNote = $("closeNote");
const continueNote = $("continueNote");

const noteIcon = $("noteIcon");
const noteTitle = $("noteTitle");
const noteContent = $("noteContent");

const codeModal = $("codeModal");
const closeCode = $("closeCode");
const codeInput = $("codeInput");
const codeFeedback = $("codeFeedback");
const submitCode = $("submitCode");
const codeDisplay = $("codeDisplay");

const winScreen = $("winScreen");
const loseScreen = $("loseScreen");

const finalTime = $("finalTime");
const finalItems = $("finalItems");

const winRestart = $("winRestart");
const loseRestart = $("loseRestart");

const flashOverlay = $("flashOverlay");

const mobileControls = $("mobileControls");
const joystick = $("joystick");
const joystickKnob = $("joystickKnob");
const mobileInteract = $("mobileInteract");
const mobileFlashlight = $("mobileFlashlight");

/* =========================================================
   THREE.JS
   ========================================================= */

let scene;
let camera;
let renderer;

let player;
let playerBody;

let flashlight;
let ambientLight;

let clock;

let raycaster;
let centerRay;

let colliders = [];
let interactables = [];

let walls = [];
let doors = [];
let decorations = [];

/* =========================================================
   UTILITÁRIOS
   ========================================================= */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function formatTime(seconds) {
    seconds = Math.max(0, Math.floor(seconds));

    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function randomId() {
    return Math.random().toString(36).substring(2, 9);
}

/* =========================================================
   LOADING
   ========================================================= */

function updateLoading(percent, text) {
    loadingProgress.style.width = `${percent}%`;
    loadingText.textContent = text;
}

async function loadGame() {
    updateLoading(10, "Inicializando sistema...");

    await wait(250);

    updateLoading(30, "Construindo escola...");
    initThree();

    await wait(300);

    updateLoading(55, "Criando corredores...");
    createSchool();

    await wait(300);

    updateLoading(75, "Preparando objetos...");
    createInteractables();

    await wait(300);

    updateLoading(90, "Ligando sistemas...");
    setupEvents();

    updateLoading(100, "Tudo pronto!");

    await wait(500);

    loading.classList.add("hidden");

    checkSaveGame();
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* =========================================================
   INICIALIZAÇÃO THREE.JS
   ========================================================= */

function initThree() {
    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x05070a);

    scene.fog = new THREE.Fog(
        0x05070a,
        8,
        45
    );

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.05,
        100
    );

    camera.rotation.order = "YXZ";

    player = new THREE.Object3D();
    player.position.set(0, PLAYER_HEIGHT, 8);

    scene.add(player);

    player.add(camera);

    /* -----------------------------------------
       RENDERER
       ----------------------------------------- */

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance"
    });

    renderer.setPixelRatio(
        Math.min(window.devicePixelRatio, 2)
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    renderer.outputColorSpace = THREE.SRGBColorSpace;

    document.body.appendChild(renderer.domElement);

    renderer.domElement.id = "gameCanvas";

    /* -----------------------------------------
       LUZ AMBIENTE
       ----------------------------------------- */

    ambientLight = new THREE.HemisphereLight(
        0x7d8da8,
        0x111111,
        0.35
    );

    scene.add(ambientLight);

    /* -----------------------------------------
       LANTERNA
       ----------------------------------------- */

    flashlight = new THREE.SpotLight(
        0xffffff,
        3.5,
        25,
        Math.PI / 7,
        0.45,
        1.5
    );

    flashlight.castShadow = true;

    flashlight.shadow.mapSize.width = 1024;
    flashlight.shadow.mapSize.height = 1024;

    flashlight.position.set(0, 0, 0);

    player.add(flashlight);

    const flashlightTarget = new THREE.Object3D();

    flashlightTarget.position.set(
        0,
        0,
        -10
    );

    player.add(flashlightTarget);

    flashlight.target = flashlightTarget;

    /* -----------------------------------------
       RAYCAST
       ----------------------------------------- */

    raycaster = new THREE.Raycaster();

    centerRay = new THREE.Vector2(0, 0);

    clock = new THREE.Clock();

    window.addEventListener(
        "resize",
        onResize
    );

    animate();
}

/* =========================================================
   MATERIAIS
   ========================================================= */

function material(color, options = {}) {
    return new THREE.MeshStandardMaterial({
        color,
        roughness: options.roughness ?? 0.8,
        metalness: options.metalness ?? 0,
        emissive: options.emissive ?? 0x000000,
        emissiveIntensity: options.emissiveIntensity ?? 0
    });
}

/* =========================================================
   OBJETOS BÁSICOS
   ========================================================= */

function createBox(
    x,
    y,
    z,
    width,
    height,
    depth,
    color,
    options = {}
) {
    const geometry = new THREE.BoxGeometry(
        width,
        height,
        depth
    );

    const mesh = new THREE.Mesh(
        geometry,
        material(color, options)
    );

    mesh.position.set(x, y, z);

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    return mesh;
}

function addCollider(mesh) {
    colliders.push(mesh);
}

/* =========================================================
   ESCOLA
   ========================================================= */

function createSchool() {

    /* -----------------------------------------
       CHÃO
       ----------------------------------------- */

    const floor = createBox(
        0,
        -0.15,
        0,
        42,
        0.3,
        42,
        0x24272b
    );

    floor.receiveShadow = true;

    /* -----------------------------------------
       TETO
       ----------------------------------------- */

    createBox(
        0,
        4,
        0,
        42,
        0.2,
        42,
        0x16181b
    );

    /* -----------------------------------------
       CORREDOR PRINCIPAL
       ----------------------------------------- */

    createRoom(
        0,
        0,
        30,
        5,
        "CORREDOR PRINCIPAL"
    );

    /* -----------------------------------------
       SALAS
       ----------------------------------------- */

    createRoom(
        -8,
        0,
        7,
        5,
        "SALA 01"
    );

    createRoom(
        8,
        0,
        7,
        5,
        "SALA 02"
    );

    createRoom(
        -8,
        0,
        -7,
        5,
        "BIBLIOTECA"
    );

    createRoom(
        8,
        0,
        -7,
        5,
        "LABORATÓRIO"
    );

    /* -----------------------------------------
       FINAL
       ----------------------------------------- */

    createFinalArea();

    /* -----------------------------------------
       DECORAÇÕES
       ----------------------------------------- */

    createLockers();
    createLights();
    createTables();
    createChairs();
}

/* =========================================================
   SALAS / CORREDORES
   ========================================================= */

function createRoom(
    x,
    y,
    z,
    size,
    name
) {

    const wallColor = 0x42464b;

    /* Parede esquerda */

    const left = createBox(
        x - size,
        2,
        z,
        0.3,
        4,
        12,
        wallColor
    );

    addCollider(left);
    walls.push(left);

    /* Parede direita */

    const right = createBox(
        x + size,
        2,
        z,
        0.3,
        4,
        12,
        wallColor
    );

    addCollider(right);
    walls.push(right);

    /* Parede traseira */

    const back = createBox(
        x,
        2,
        z + 6,
        10,
        4,
        0.3,
        wallColor
    );

    addCollider(back);
    walls.push(back);

    /* Nome da área */

    createAreaSign(
        x,
        2.8,
        z - 5.8,
        name
    );
}

function createAreaSign(
    x,
    y,
    z,
    text
) {
    const canvas = document.createElement("canvas");

    canvas.width = 512;
    canvas.height = 128;

    const ctx = canvas.getContext("2d");

    ctx.fillStyle = "#101214";
    ctx.fillRect(0, 0, 512, 128);

    ctx.fillStyle = "#eeeeee";
    ctx.font = "bold 42px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        text,
        256,
        64
    );

    const texture = new THREE.CanvasTexture(canvas);

    const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(3, 0.75),
        new THREE.MeshBasicMaterial({
            map: texture
        })
    );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.rotation.x = 0;

    scene.add(mesh);
}

/* =========================================================
   ÁREA FINAL
   ========================================================= */

function createFinalArea() {

    const finalWall = createBox(
        0,
        2,
        -19,
        42,
        4,
        0.3,
        0x30343a
    );

    addCollider(finalWall);

    /* Porta de saída */

    const door = createBox(
        0,
        1.5,
        -18.75,
        3,
        3,
        0.4,
        0x553b2c
    );

    door.userData.type = "exitDoor";
    door.userData.name = "Porta de saída";

    doors.push(door);
    interactables.push(door);
}

/* =========================================================
   ARMÁRIOS
   ========================================================= */

function createLockers() {

    for (let i = -2; i <= 2; i++) {

        const locker = createBox(
            -4.8,
            1.5,
            i * 2,
            0.8,
            3,
            1.4,
            0x5b6570,
            {
                metalness: 0.5,
                roughness: 0.55
            }
        );

        decorations.push(locker);
    }
}

/* =========================================================
   LUZES
   ========================================================= */

function createLights() {

    const positions = [
        [-8, 3.7, 7],
        [8, 3.7, 7],
        [0, 3.7, 0],
        [-8, 3.7, -7],
        [8, 3.7, -7],
        [0, 3.7, -14]
    ];

    positions.forEach(
        ([x, y, z], index) => {

            const light = new THREE.PointLight(
                0xffe9c4,
                index === 2 ? 0.8 : 0.45,
                8
            );

            light.position.set(
                x,
                y,
                z
            );

            scene.add(light);

            /* lâmpada */

            const bulb = createBox(
                x,
                y,
                z,
                1.2,
                0.1,
                0.3,
                0xffe4aa,
                {
                    emissive: 0xffbb66,
                    emissiveIntensity: 2
                }
            );

            bulb.castShadow = false;
        }
    );
}

/* =========================================================
   MESAS
   ========================================================= */

function createTables() {

    const positions = [
        [-7, 0, 6],
        [-9, 0, 6],
        [7, 0, 6],
        [9, 0, 6],
        [-7, 0, -7],
        [7, 0, -7]
    ];

    positions.forEach(
        ([x, y, z]) => {

            createBox(
                x,
                1,
                z,
                2.2,
                0.15,
                1.1,
                0x5a3827
            );

            const legPositions = [
                [-0.8, -0.45],
                [0.8, -0.45],
                [-0.8, 0.45],
                [0.8, 0.45]
            ];

            legPositions.forEach(
                ([lx, lz]) => {

                    createBox(
                        x + lx,
                        0.5,
                        z + lz,
                        0.1,
                        1,
                        0.1,
                        0x32231c
                    );
                }
            );
        }
    );
}

/* =========================================================
   CADEIRAS
   ========================================================= */

function createChairs() {

    const positions = [
        [-7, 0, 7.5],
        [-9, 0, 7.5],
        [7, 0, 7.5],
        [9, 0, 7.5]
    ];

    positions.forEach(
        ([x, y, z]) => {

            createBox(
                x,
                0.7,
                z,
                0.8,
                0.12,
                0.8,
                0x39434c
            );

            createBox(
                x,
                1.15,
                z + 0.35,
                0.8,
                1,
                0.12,
                0x39434c
            );
        }
    );
}

/* =========================================================
   INTERAGÍVEIS
   ========================================================= */

function createInteractables() {

    createNote(
        "biblioteca",
        "📖",
        "Anotação antiga",
        `
        <p><strong>Dia 17</strong></p>
        <p>
        O diretor trocou o código do cofre novamente.
        Ele disse que usou os quatro números escritos
        no quadro da sala de matemática.
        </p>
        <p>
        Talvez o número esteja escondido em algum lugar...
        </p>
        `,
        -8,
        1.2,
        -4
    );

    createKey(
        "chaveBiblioteca",
        "🔑",
        "Chave da sala de segurança",
        -9,
        1.1,
        -6
    );

    createNote(
        "codigo",
        "📝",
        "Pedaço de papel",
        `
        <p>
        <strong>4 - 1 - 7 - 3</strong>
        </p>
        <p>
        Não conte para ninguém.
        </p>
        `,
        7,
        1.2,
        4
    );

    createSafe();

    createKey(
        "chaveSaida",
        "🗝️",
        "Chave da saída",
        8,
        1.2,
        -10
    );

    createNote(
        "aviso",
        "⚠️",
        "Aviso do diretor",
        `
        <p>
        Se você encontrou esta mensagem,
        provavelmente já descobriu que a porta
        principal não abre por dentro.
        </p>
        <p>
        Procure a chave.
        </p>
        `,
        -7,
        1.2,
        10
    );
}

/* =========================================================
   CRIAR BILHETE
   ========================================================= */

function createNote(
    id,
    icon,
    title,
    content,
    x,
    y,
    z
) {

    const geometry =
        new THREE.BoxGeometry(
            0.6,
            0.04,
            0.8
        );

    const mesh =
        new THREE.Mesh(
            geometry,
            material(0xe8dfc8)
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.rotation.x =
        THREE.MathUtils.degToRad(8);

    mesh.userData = {
        type: "note",
        id,
        icon,
        title,
        content,
        name: title
    };

    scene.add(mesh);

    interactables.push(mesh);
}

/* =========================================================
   CRIAR CHAVE
   ========================================================= */

function createKey(
    id,
    icon,
    name,
    x,
    y,
    z
) {

    const group =
        new THREE.Group();

    group.position.set(
        x,
        y,
        z
    );

    const ring =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                0.15,
                0.045,
                8,
                16
            ),
            material(0xd4aa32, {
                metalness: 0.8,
                roughness: 0.3
            })
        );

    group.add(ring);

    const shaft =
        createBox(
            0.25,
            0,
            0,
            0.35,
            0.06,
            0.06,
            0xd4aa32,
            {
                metalness: 0.8,
                roughness: 0.3
            }
        );

    shaft.rotation.z =
        Math.PI / 2;

    group.add(shaft);

    group.userData = {
        type: "key",
        id,
        name
    };

    scene.add(group);

    interactables.push(group);
}

/* =========================================================
   COFRE
   ========================================================= */

function createSafe() {

    const safe =
        createBox(
            9,
            1.4,
            -6,
            1.5,
            2.4,
            0.8,
            0x292d31,
            {
                metalness: 0.7,
                roughness: 0.35
            }
        );

    safe.userData = {
        type: "safe",
        name: "Cofre"
    };

    interactables.push(safe);
}

/* =========================================================
   INTERAÇÃO
   ========================================================= */

function checkInteraction() {

    if (!game.started ||
        game.paused ||
        game.gameOver ||
        game.victory) {
        return;
    }

    raycaster.setFromCamera(
        centerRay,
        camera
    );

    const objects =
        raycaster.intersectObjects(
            interactables,
            true
        );

    if (!objects.length) {
        setInteraction(null);
        return;
    }

    const object =
        findInteractableParent(
            objects[0].object
        );

    if (!object) {
        setInteraction(null);
        return;
    }

    const distance =
        camera.position.distanceTo(
            object.position
        );

    if (distance > 3) {
        setInteraction(null);
        return;
    }

    setInteraction(object);
}

function findInteractableParent(object) {

    let current = object;

    while (current) {

        if (current.userData &&
            current.userData.type) {
            return current;
        }

        current = current.parent;
    }

    return null;
}

function setInteraction(object) {

    game.nearObject = object;

    if (!object) {

        interactionPrompt.classList.remove(
            "show"
        );

        return;
    }

    let text = "Interagir";

    if (object.userData.type === "note") {
        text = "Ler";
    }

    if (object.userData.type === "key") {
        text = "Pegar";
    }

    if (object.userData.type === "safe") {
        text = "Abrir cofre";
    }

    if (object.userData.type === "exitDoor") {
        text = "Abrir porta";
    }

    interactionText.textContent = text;

    interactionPrompt.classList.add(
        "show"
    );
}

/* =========================================================
   EXECUTAR INTERAÇÃO
   ========================================================= */

function interact() {

    if (!game.started ||
        game.paused ||
        game.gameOver ||
        game.victory) {
        return;
    }

    if (!game.nearObject) {
        return;
    }

    const object =
        game.nearObject;

    switch (object.userData.type) {

        case "note":
            openNote(object.userData);
            break;

        case "key":
            pickupItem(object);
            break;

        case "safe":
            openSafe();
            break;

        case "exitDoor":
            openExit();
            break;
    }
}

/* =========================================================
   BILHETES
   ========================================================= */

function openNote(data) {

    noteIcon.textContent =
        data.icon || "📄";

    noteTitle.textContent =
        data.title;

    noteContent.innerHTML =
        data.content;

    noteModal.classList.remove(
        "hidden"
    );

    document.exitPointerLock?.();

    game.paused = true;
}

function closeNoteModal() {

    noteModal.classList.add(
        "hidden"
    );

    if (game.started &&
        !game.gameOver &&
        !game.victory) {

        game.paused = false;
    }
}

/* =========================================================
   INVENTÁRIO
   ========================================================= */

function pickupItem(object) {

    if (game.inventory.length >= INVENTORY_LIMIT) {

        showMessage(
            "Inventário cheio.",
            "warning"
        );

        return;
    }

    const data =
        object.userData;

    game.inventory.push({
        id: data.id,
        name: data.name,
        icon: data.icon || "🔑"
    });

    scene.remove(object);

    interactables =
        interactables.filter(
            item => item !== object
        );

    game.nearObject = null;

    updateInventory();

    showMessage(
        `${data.name} adicionada ao inventário.`,
        "success"
    );

    saveGame();

    checkObjectives();
}

function hasItem(id) {

    return game.inventory.some(
        item => item.id === id
    );
}

function updateInventory() {

    inventoryItems.innerHTML = "";

    game.inventory.forEach(
        item => {

            const element =
                document.createElement("div");

            element.className =
                "inventory-item";

            element.title =
                item.name;

            element.innerHTML = `
                <span>${item.icon}</span>
            `;

            inventoryItems.appendChild(
                element
            );
        }
    );

    itemCount.textContent =
        `${game.inventory.length}/${INVENTORY_LIMIT}`;
}

/* =========================================================
   COFRE
   ========================================================= */

function openSafe() {

    codeModal.classList.remove(
        "hidden"
    );

    codeInput.value = "";

    codeFeedback.textContent = "";

    updateCodeDisplay("");

    game.paused = true;

    setTimeout(
        () => codeInput.focus(),
        100
    );
}

function closeSafe() {

    codeModal.classList.add(
        "hidden"
    );

    game.paused = false;
}

function updateCodeDisplay(value) {

    const spans =
        codeDisplay.querySelectorAll(
            "span"
        );

    spans.forEach(
        (span, index) => {

            span.textContent =
                value[index] || "_";
        }
    );
}

function submitSafeCode() {

    const code =
        codeInput.value.trim();

    updateCodeDisplay(code);

    if (code.length !== 4) {

        codeFeedback.textContent =
            "Digite quatro números.";

        codeFeedback.style.color =
            "#ffb347";

        return;
    }

    if (code === "4173") {

        codeFeedback.textContent =
            "Cofre desbloqueado!";

        codeFeedback.style.color =
            "#6eff9a";

        setTimeout(
            () => {

                closeSafe();

                unlockSafe();

            },
            700
        );

    } else {

        codeFeedback.textContent =
            "Código incorreto.";

        codeFeedback.style.color =
            "#ff6262";

        codeInput.select();
    }
}

function unlockSafe() {

    const safe =
        interactables.find(
            object =>
                object.userData.type === "safe"
        );

    if (safe) {

        scene.remove(safe);

        interactables =
            interactables.filter(
                object => object !== safe
            );
    }

    createKey(
        "chaveSaida",
        "🗝️",
        "Chave da saída",
        9,
        1.4,
        -6
    );

    showMessage(
        "O cofre abriu! Você encontrou uma chave.",
        "success"
    );

    game.currentObjective =
        "Encontre a chave da saída.";

    updateObjective();

    saveGame();
}

/* =========================================================
   PORTA DE SAÍDA
   ========================================================= */

function openExit() {

    if (!hasItem("chaveSaida")) {

        showMessage(
            "A porta está trancada. Você precisa de uma chave.",
            "warning"
        );

        game.currentObjective =
            "Encontre a chave da saída.";

        updateObjective();

        return;
    }

    winGame();
}

/* =========================================================
   OBJETIVOS
   ========================================================= */

function checkObjectives() {

    if (!hasItem("chaveBiblioteca")) {

        game.currentObjective =
            "Encontre a chave da sala de segurança.";

    } else if (!hasItem("chaveSaida")) {

        game.currentObjective =
            "Descubra o código do cofre e encontre a chave da saída.";

    } else {

        game.currentObjective =
            "Vá até a porta de saída.";

    }

    updateObjective();
}

function updateObjective() {

    objectiveElement.textContent =
        game.currentObjective;
}

/* =========================================================
   MENSAGENS
   ========================================================= */

function showMessage(
    text,
    type = "normal"
) {

    const message =
        document.createElement("div");

    message.className =
        `game-message ${type}`;

    message.textContent =
        text;

    messageContainer.appendChild(
        message
    );

    setTimeout(
        () => {

            message.classList.add(
                "fade-out"
            );

            setTimeout(
                () => message.remove(),
                400
            );

        },
        2800
    );
}

/* =========================================================
   LANTERNA
   ========================================================= */

function toggleFlashlight() {

    if (game.energy <= 0) {

        showMessage(
            "A bateria da lanterna acabou.",
            "warning"
        );

        return;
    }

    game.flashlightOn =
        !game.flashlightOn;

    flashlight.visible =
        game.flashlightOn;

    flashOverlay.classList.toggle(
        "flashlight-off",
        !game.flashlightOn
    );
}

function updateFlashlight(delta) {

    if (!game.flashlightOn ||
        !game.started ||
        game.paused) {
        return;
    }

    game.energy -=
        FLASHLIGHT_DRAIN * delta;

    game.energy =
        clamp(
            game.energy,
            0,
            MAX_ENERGY
        );

    if (game.energy <= 0) {

        game.energy = 0;

        game.flashlightOn = false;

        flashlight.visible = false;

        showMessage(
            "A bateria da lanterna acabou.",
            "warning"
        );
    }

    updateEnergy();
}

function updateEnergy() {

    const percentage =
        Math.round(game.energy);

    energyFill.style.width =
        `${percentage}%`;

    energyText.textContent =
        `${percentage}%`;

    if (percentage <= 25) {

        energyFill.classList.add(
            "low"
        );

    } else {

        energyFill.classList.remove(
            "low"
        );
    }
}

/* =========================================================
   MOVIMENTO
   ========================================================= */

function updateMovement(delta) {

    if (!game.started ||
        game.paused ||
        game.gameOver ||
        game.victory) {
        return;
    }

    let forward = 0;
    let right = 0;

    if (game.keys.w) forward += 1;
    if (game.keys.s) forward -= 1;

    if (game.keys.d) right += 1;
    if (game.keys.a) right -= 1;

    /* joystick */

    if (Math.abs(game.joystick.y) > 0.05) {
        forward += -game.joystick.y;
    }

    if (Math.abs(game.joystick.x) > 0.05) {
        right += game.joystick.x;
    }

    const length =
        Math.hypot(
            forward,
            right
        );

    if (length > 1) {

        forward /= length;
        right /= length;
    }

    let speed =
        game.keys.shift
            ? RUN_SPEED
            : WALK_SPEED;

    const movement =
        new THREE.Vector3(
            right,
            0,
            -forward
        );

    movement.applyQuaternion(
        new THREE.Quaternion().setFromEuler(
            new THREE.Euler(
                0,
                player.rotation.y,
                0
            )
        )
    );

    movement.multiplyScalar(
        speed * delta
    );

    movePlayer(
        movement.x,
        movement.z
    );
}

function movePlayer(dx, dz) {

    const oldX =
        player.position.x;

    const oldZ =
        player.position.z;

    player.position.x += dx;

    if (checkCollision()) {
        player.position.x =
            oldX;
    }

    player.position.z += dz;

    if (checkCollision()) {
        player.position.z =
            oldZ;
    }

    /* Limites do mapa */

    player.position.x =
        clamp(
            player.position.x,
            -19,
            19
        );

    player.position.z =
        clamp(
            player.position.z,
            -18,
            18
        );
}

function checkCollision() {

    const playerBox =
        new THREE.Box3();

    playerBox.min.set(
        player.position.x - 0.35,
        0,
        player.position.z - 0.35
    );

    playerBox.max.set(
        player.position.x + 0.35,
        2,
        player.position.z + 0.35
    );

    for (const object of colliders) {

        if (!object.parent) {
            continue;
        }

        const box =
            new THREE.Box3()
                .setFromObject(object);

        if (playerBox.intersectsBox(box)) {
            return true;
        }
    }

    return false;
}

/* =========================================================
   MOUSE / CÂMERA
   ========================================================= */

let pitch = 0;

function onMouseMove(event) {

    if (!game.started ||
        game.paused ||
        game.gameOver ||
        game.victory) {
        return;
    }

    if (
        document.pointerLockElement !==
        renderer.domElement
    ) {
        return;
    }

    player.rotation.y -=
        event.movementX *
        MOUSE_SENSITIVITY;

    pitch -=
        event.movementY *
        MOUSE_SENSITIVITY;

    pitch =
        clamp(
            pitch,
            -Math.PI / 2 + 0.1,
            Math.PI / 2 - 0.1
        );

    camera.rotation.x =
        pitch;
}

function requestPointerLock() {

    if (
        renderer &&
        renderer.domElement &&
        !isMobile()
    ) {
        renderer.domElement.requestPointerLock();
    }
}

/* =========================================================
   TEMPO
   ========================================================= */

function updateTimer(delta) {

    if (!game.started ||
        game.paused ||
        game.gameOver ||
        game.victory) {
        return;
    }

    game.time -= delta;

    game.time =
        Math.max(
            0,
            game.time
        );

    timerElement.textContent =
        formatTime(game.time);

    if (game.time <= 60) {

        timerElement.classList.add(
            "danger"
        );

    } else {

        timerElement.classList.remove(
            "danger"
        );
    }

    if (game.time <= 0) {

        loseGame();
    }
}

/* =========================================================
   VITÓRIA
   ========================================================= */

function winGame() {

    if (game.victory) {
        return;
    }

    game.victory = true;
    game.started = false;

    document.exitPointerLock?.();

    finalTime.textContent =
        formatTime(game.time);

    finalItems.textContent =
        game.inventory.length;

    winScreen.classList.remove(
        "hidden"
    );

    localStorage.removeItem(
        "escapeEscolaSave"
    );
}

/* =========================================================
   DERROTA
   ========================================================= */

function loseGame() {

    if (game.gameOver) {
        return;
    }

    game.gameOver = true;
    game.started = false;

    document.exitPointerLock?.();

    loseScreen.classList.remove(
        "hidden"
    );
}

/* =========================================================
   INICIAR JOGO
   ========================================================= */

function startGame() {

    startScreen.classList.add(
        "hidden"
    );

    pauseScreen.classList.add(
        "hidden"
    );

    winScreen.classList.add(
        "hidden"
    );

    loseScreen.classList.add(
        "hidden"
    );

    hud.classList.remove(
        "hidden"
    );

    game.started = true;
    game.paused = false;
    game.gameOver = false;
    game.victory = false;

    if (!isMobile()) {
        requestPointerLock();
    }

    updateObjective();
    updateInventory();
    updateEnergy();

    showMessage(
        "Você está dentro da escola. Encontre uma saída.",
        "normal"
    );

    saveGame();
}

/* =========================================================
   RECOMEÇAR
   ========================================================= */

function restartGame() {

    localStorage.removeItem(
        "escapeEscolaSave"
    );

    location.reload();
}

/* =========================================================
   PAUSA
   ========================================================= */

function togglePause() {

    if (!game.started ||
        game.gameOver ||
        game.victory) {
        return;
    }

    if (noteModal.classList.contains("hidden") === false) {
        return;
    }

    if (codeModal.classList.contains("hidden") === false) {
        return;
    }

    game.paused =
        !game.paused;

    pauseScreen.classList.toggle(
        "hidden",
        !game.paused
    );

    if (game.paused) {

        document.exitPointerLock?.();

    } else {

        if (!isMobile()) {
            requestPointerLock();
        }
    }
}

/* =========================================================
   SALVAMENTO
   ========================================================= */

function saveGame() {

    if (!game.started ||
        game.gameOver ||
        game.victory) {
        return;
    }

    const data = {
        time: game.time,
        energy: game.energy,

        flashlightOn:
            game.flashlightOn,

        inventory:
            game.inventory,

        player: {
            x: player.position.x,
            y: player.position.y,
            z: player.position.z,

            rotationY:
                player.rotation.y,

            rotationX:
                camera.rotation.x
        }
    };

    localStorage.setItem(
        "escapeEscolaSave",
        JSON.stringify(data)
    );

    showSaveIndicator();
}

function checkSaveGame() {

    const saved =
        localStorage.getItem(
            "escapeEscolaSave"
        );

    if (saved) {

        continueButton.classList.remove(
            "hidden"
        );
    }
}

function loadSavedGame() {

    const saved =
        localStorage.getItem(
            "escapeEscolaSave"
        );

    if (!saved) {
        startGame();
        return;
    }

    try {

        const data =
            JSON.parse(saved);

        game.time =
            data.time ?? GAME_TIME;

        game.energy =
            data.energy ?? MAX_ENERGY;

        game.flashlightOn =
            data.flashlightOn ?? true;

        game.inventory =
            data.inventory ?? [];

        if (data.player) {

            player.position.set(
                data.player.x ?? 0,
                data.player.y ?? PLAYER_HEIGHT,
                data.player.z ?? 8
            );

            player.rotation.y            player.rotation.y =
                data.player.rotationY ?? 0;

            camera.rotation.x =
                data.player.rotationX ?? 0;

            pitch =
                camera.rotation.x;
        }

        /* Restaurar estado visual */

        flashlight.visible =
            game.flashlightOn && game.energy > 0;

        updateInventory();
        updateEnergy();
        updateTimer(0);
        updateObjective();

        game.started = true;
        game.paused = false;
        game.gameOver = false;
        game.victory = false;

        startScreen.classList.add("hidden");
        pauseScreen.classList.add("hidden");
        winScreen.classList.add("hidden");
        loseScreen.classList.add("hidden");

        hud.classList.remove("hidden");

        showMessage(
            "Jogo carregado. Boa sorte!",
            "success"
        );

        saveIndicator.textContent =
            "✓ JOGO CARREGADO";

        saveIndicator.classList.add("visible");

        setTimeout(() => {
            saveIndicator.classList.remove("visible");
        }, 2000);

        if (!isMobile()) {
            requestPointerLock();
        }

    } catch (error) {

        console.error(
            "Erro ao carregar o jogo:",
            error
        );

        localStorage.removeItem(
            "escapeEscolaSave"
        );

        startGame();
    }
}

/* =========================================================
   INDICADOR DE SAVE
   ========================================================= */

function showSaveIndicator() {

    saveIndicator.classList.add(
        "visible"
    );

    clearTimeout(
        showSaveIndicator.timeout
    );

    showSaveIndicator.timeout =
        setTimeout(() => {

            saveIndicator.classList.remove(
                "visible"
            );

        }, 1500);
}

/* =========================================================
   LOCALIZAÇÃO
   ========================================================= */

function updateLocation() {

    if (!player) {
        return;
    }

    const x = player.position.x;
    const z = player.position.z;

    let location = "CORREDOR";

    if (z > 3) {

        if (x < -3) {
            location = "SALA 01";
        } else if (x > 3) {
            location = "SALA 02";
        } else {
            location = "ENTRADA";
        }

    } else if (z < -3) {

        if (x < -3) {
            location = "BIBLIOTECA";
        } else if (x > 3) {
            location = "LABORATÓRIO";
        } else if (z < -12) {
            location = "CORREDOR FINAL";
        }

    } else {

        location = "CORREDOR PRINCIPAL";
    }

    if (
        game.currentLocation !== location
    ) {

        game.currentLocation =
            location;

        locationName.textContent =
            location;
    }
}

/* =========================================================
   CONTROLES DE TECLADO
   ========================================================= */

function onKeyDown(event) {

    const key =
        event.key.toLowerCase();

    if (key === "w") {
        game.keys.w = true;
    }

    if (key === "a") {
        game.keys.a = true;
    }

    if (key === "s") {
        game.keys.s = true;
    }

    if (key === "d") {
        game.keys.d = true;
    }

    if (event.key === "Shift") {
        game.keys.shift = true;
    }

    /* Interação */

    if (
        key === "e" &&
        !event.repeat
    ) {

        interact();
    }

    /* Lanterna */

    if (
        key === "f" &&
        !event.repeat
    ) {

        toggleFlashlight();
    }

    /* Pausa */

    if (
        event.key === "Escape" &&
        !event.repeat
    ) {

        /*
         * Se o navegador acabou de tirar
         * o pointer lock, não pausamos duas vezes.
         */

        if (
            document.pointerLockElement ===
            renderer?.domElement
        ) {

            document.exitPointerLock();

        } else {

            togglePause();
        }
    }
}

function onKeyUp(event) {

    const key =
        event.key.toLowerCase();

    if (key === "w") {
        game.keys.w = false;
    }

    if (key === "a") {
        game.keys.a = false;
    }

    if (key === "s") {
        game.keys.s = false;
    }

    if (key === "d") {
        game.keys.d = false;
    }

    if (event.key === "Shift") {
        game.keys.shift = false;
    }
}

/* =========================================================
   MOUSE
   ========================================================= */

function onMouseDown() {

    if (
        game.started &&
        !game.paused &&
        !game.gameOver &&
        !game.victory &&
        !isMobile()
    ) {

        if (
            document.pointerLockElement !==
            renderer.domElement
        ) {

            requestPointerLock();
        }
    }
}

/* =========================================================
   POINTER LOCK
   ========================================================= */

function onPointerLockChange() {

    if (!game.started ||
        game.gameOver ||
        game.victory) {
        return;
    }

    /*
     * Se o jogador saiu do pointer lock
     * voluntariamente, mostramos a pausa.
     */

    if (
        document.pointerLockElement !==
        renderer.domElement &&
        !game.paused &&
        !isMobile()
    ) {

        togglePause();
    }
}

/* =========================================================
   CONTROLES MOBILE
   ========================================================= */

function isMobile() {

    return (
        window.matchMedia(
            "(max-width: 800px)"
        ).matches ||
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0
    );
}

/* ---------------------------------------------------------
   JOYSTICK
   --------------------------------------------------------- */

let joystickPointerId = null;

function updateJoystick(
    clientX,
    clientY
) {

    const rect =
        joystick.getBoundingClientRect();

    const centerX =
        rect.left + rect.width / 2;

    const centerY =
        rect.top + rect.height / 2;

    let dx =
        clientX - centerX;

    let dy =
        clientY - centerY;

    const radius =
        rect.width * 0.35;

    const distance =
        Math.hypot(dx, dy);

    if (distance > radius) {

        dx =
            (dx / distance) *
            radius;

        dy =
            (dy / distance) *
            radius;
    }

    game.joystick.x =
        dx / radius;

    game.joystick.y =
        dy / radius;

    joystickKnob.style.transform =
        `translate(${dx}px, ${dy}px)`;
}

function resetJoystick() {

    joystickPointerId = null;

    game.joystick.active =
        false;

    game.joystick.x = 0;
    game.joystick.y = 0;

    joystickKnob.style.transform =
        "translate(0, 0)";
}

function onJoystickStart(event) {

    if (!isMobile()) {
        return;
    }

    joystickPointerId =
        event.pointerId;

    game.joystick.active =
        true;

    joystick.setPointerCapture(
        event.pointerId
    );

    updateJoystick(
        event.clientX,
        event.clientY
    );
}

function onJoystickMove(event) {

    if (
        !game.joystick.active ||
        event.pointerId !==
        joystickPointerId
    ) {
        return;
    }

    updateJoystick(
        event.clientX,
        event.clientY
    );
}

function onJoystickEnd(event) {

    if (
        event.pointerId !==
        joystickPointerId
    ) {
        return;
    }

    resetJoystick();
}

/* ---------------------------------------------------------
   BOTÕES MOBILE
   --------------------------------------------------------- */

function setupMobileControls() {

    if (!isMobile()) {
        return;
    }

    mobileControls.classList.remove(
        "hidden"
    );

    mobileInteract.addEventListener(
        "click",
        () => {
            interact();
        }
    );

    mobileFlashlight.addEventListener(
        "click",
        () => {
            toggleFlashlight();
        }
    );

    joystick.addEventListener(
        "pointerdown",
        onJoystickStart
    );

    joystick.addEventListener(
        "pointermove",
        onJoystickMove
    );

    joystick.addEventListener(
        "pointerup",
        onJoystickEnd
    );

    joystick.addEventListener(
        "pointercancel",
        onJoystickEnd
    );

    joystick.addEventListener(
        "pointerleave",
        (event) => {

            if (
                game.joystick.active &&
                event.pointerId ===
                joystickPointerId
            ) {
                updateJoystick(
                    event.clientX,
                    event.clientY
                );
            }
        }
    );
}

/* =========================================================
   EVENTOS DOS MODAIS
   ========================================================= */

function setupModalEvents() {

    closeNote.addEventListener(
        "click",
        closeNoteModal
    );

    continueNote.addEventListener(
        "click",
        closeNoteModal
    );

    closeCode.addEventListener(
        "click",
        closeSafe
    );

    submitCode.addEventListener(
        "click",
        submitSafeCode
    );

    codeInput.addEventListener(
        "input",
        () => {

            codeInput.value =
                codeInput.value
                    .replace(/\D/g, "")
                    .slice(0, 4);

            updateCodeDisplay(
                codeInput.value
            );
        }
    );

    codeInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                submitSafeCode();
            }

            if (
                event.key === "Escape"
            ) {

                closeSafe();
            }
        }
    );

    /*
     * Clicar fora do bilhete fecha o modal.
     */

    noteModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                noteModal
            ) {

                closeNoteModal();
            }
        }
    );

    /*
     * Clicar fora do cofre fecha o modal.
     */

    codeModal.addEventListener(
        "click",
        event => {

            if (
                event.target ===
                codeModal
            ) {

                closeSafe();
            }
        }
    );
}

/* =========================================================
   EVENTOS PRINCIPAIS
   ========================================================= */

function setupEvents() {

    startButton.addEventListener(
        "click",
        startGame
    );

    continueButton.addEventListener(
        "click",
        loadSavedGame
    );

    resumeButton.addEventListener(
        "click",
        () => {

            if (game.paused) {
                togglePause();
            }
        }
    );

    restartButton.addEventListener(
        "click",
        restartGame
    );

    winRestart.addEventListener(
        "click",
        restartGame
    );

    loseRestart.addEventListener(
        "click",
        restartGame
    );

    window.addEventListener(
        "keydown",
        onKeyDown
    );

    window.addEventListener(
        "keyup",
        onKeyUp
    );

    window.addEventListener(
        "mousemove",
        onMouseMove
    );

    renderer.domElement.addEventListener(
        "mousedown",
        onMouseDown
    );

    document.addEventListener(
        "pointerlockchange",
        onPointerLockChange
    );

    setupModalEvents();
    setupMobileControls();

    /*
     * Impede o menu de contexto do botão direito
     * dentro do jogo.
     */

    renderer.domElement.addEventListener(
        "contextmenu",
        event => {
            event.preventDefault();
        }
    );

    /*
     * Salva ao sair/fechar a página.
     */

    window.addEventListener(
        "beforeunload",
        () => {

            if (game.started &&
                !game.gameOver &&
                !game.victory) {

                saveGame();
            }
        }
    );
}

/* =========================================================
   ANIMAÇÃO DOS OBJETOS
   ========================================================= */

function animateObjects(delta) {

    /*
     * Faz as chaves e bilhetes
     * flutuarem levemente.
     */

    interactables.forEach(
        object => {

            if (!object.parent) {
                return;
            }

            const type =
                object.userData?.type;

            if (
                type === "key" ||
                type === "note"
            ) {

                object.rotation.y +=
                    delta * 1.5;

                const baseY =
                    object.userData.baseY;

                if (
                    typeof baseY ===
                    "number"
                ) {

                    object.position.y =
                        baseY +
                        Math.sin(
                            performance.now() *
                            0.002
                        ) * 0.08;
                }
            }
        }
    );
}

/* =========================================================
   COLISÃO / POSIÇÃO
   ========================================================= */

function keepPlayerInsideMap() {

    player.position.x =
        clamp(
            player.position.x,
            -19,
            19
        );

    player.position.z =
        clamp(
            player.position.z,
            -18,
            18
        );

    player.position.y =
        PLAYER_HEIGHT;
}

/* =========================================================
   LOOP PRINCIPAL
   ========================================================= */

function animate() {

    requestAnimationFrame(
        animate
    );

    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );

    if (game.started &&
        !game.paused &&
        !game.gameOver &&
        !game.victory) {

        updateMovement(delta);

        updateTimer(delta);

        updateFlashlight(delta);

        checkInteraction();

        updateLocation();

        animateObjects(delta);
    }

    renderer.render(
        scene,
        camera
    );
}

/* =========================================================
   RESIZE
   ========================================================= */

function onResize() {

    if (!camera ||
        !renderer) {
        return;
    }

    camera.aspect =
        window.innerWidth /
        window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );
}

/* =========================================================
   CORREÇÕES DOS INTERAGÍVEIS
   ========================================================= */

function prepareInteractables() {

    interactables.forEach(
        object => {

            if (
                object.userData &&
                (
                    object.userData.type ===
                    "key" ||
                    object.userData.type ===
                    "note"
                )
            ) {

                object.userData.baseY =
                    object.position.y;
            }
        }
    );
}

/* =========================================================
   INICIALIZAÇÃO FINAL
   ========================================================= */

loadGame();
