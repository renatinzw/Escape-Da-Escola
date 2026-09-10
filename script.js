import * as THREE from "three";

/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const GAME_TIME = 15 * 60;
const SAVE_KEY = "escape_da_escola_save";

const CODE = "2714";

let scene;
let camera;
let renderer;

let clock;

let gameStarted = false;
let paused = false;
let gameOver = false;

let timeLeft = GAME_TIME;

let timerInterval = null;

let flashlightOn = true;
let flashlightEnergy = 100;

let inventory = [];

let currentInteraction = null;

let objects = [];
let colliders = [];

let keys = {};

let player = {
    speed: 4,
    runSpeed: 7,
    height: 1.7,
    radius: 0.35
};

let yaw = 0;
let pitch = 0;

let pointerLocked = false;

let flashlight;

let mobileMode = false;

let joystickData = {
    active: false,
    x: 0,
    y: 0
};


/* =========================================================
   DOM
========================================================= */

const $ = (id) => document.getElementById(id);

const loading = $("loading");
const loadingProgress = $("loadingProgress");
const loadingText = $("loadingText");

const startScreen = $("startScreen");
const startButton = $("startButton");
const continueButton = $("continueButton");

const hud = $("hud");

const objective = $("objective");
const timerElement = $("timer");

const interactionPrompt = $("interactionPrompt");
const interactionText = $("interactionText");

const messageContainer = $("messageContainer");

const energyFill = $("energyFill");
const energyText = $("energyText");

const inventoryItems = $("inventoryItems");
const itemCount = $("itemCount");

const locationName = $("locationName");

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
   INICIALIZAÇÃO
========================================================= */

window.addEventListener("load", () => {

    detectDevice();

    simulateLoading();

    setupEvents();

});


function simulateLoading() {

    let progress = 0;

    const interval = setInterval(() => {

        progress += Math.random() * 15 + 5;

        if (progress >= 100) {

            progress = 100;

            clearInterval(interval);

            loadingProgress.style.width = "100%";

            loadingText.textContent =
                "Escola preparada.";

            setTimeout(() => {

                loading.classList.add("hidden");

                checkSave();

            }, 500);

            return;
        }

        loadingProgress.style.width =
            `${progress}%`;

        if (progress < 40) {

            loadingText.textContent =
                "Construindo a escola...";

        } else if (progress < 75) {

            loadingText.textContent =
                "Preparando os enigmas...";

        } else {

            loadingText.textContent =
                "Acendendo as luzes...";

        }

    }, 120);

}


/* =========================================================
   DETECTAR CELULAR
========================================================= */

function detectDevice() {

    mobileMode =
        /Android|iPhone|iPad|iPod/i.test(
            navigator.userAgent
        );

    if (mobileMode) {

        mobileControls.classList.remove("hidden");

    }

}


/* =========================================================
   EVENTOS
========================================================= */

function setupEvents() {

    startButton.addEventListener(
        "click",
        () => startGame(false)
    );

    continueButton.addEventListener(
        "click",
        () => startGame(true)
    );

    resumeButton.addEventListener(
        "click",
        resumeGame
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
        closeCodeModal
    );

    submitCode.addEventListener(
        "click",
        checkCode
    );

    codeInput.addEventListener(
        "input",
        updateCodeDisplay
    );

    window.addEventListener(
        "keydown",
        handleKeyDown
    );

    window.addEventListener(
        "keyup",
        handleKeyUp
    );

    document.addEventListener(
        "mousemove",
        handleMouseMove
    );

    document.addEventListener(
        "pointerlockchange",
        handlePointerLock
    );

    mobileInteract.addEventListener(
        "click",
        interact
    );

    mobileFlashlight.addEventListener(
        "click",
        toggleFlashlight
    );

    setupJoystick();

}


/* =========================================================
   SAVE
========================================================= */

function checkSave() {

    const saved =
        localStorage.getItem(SAVE_KEY);

    if (saved) {

        try {

            const data =
                JSON.parse(saved);

            if (
                data &&
                data.timeLeft > 0 &&
                !data.completed
            ) {

                continueButton.classList.remove(
                    "hidden"
                );

            }

        } catch {

            localStorage.removeItem(
                SAVE_KEY
            );

        }

    }

}


function saveGame() {

    if (!gameStarted || gameOver) {
        return;
    }

    const data = {

        timeLeft,

        inventory,

        flashlightEnergy,

        flashlightOn,

        completed: false,

        player: {

            x: camera.position.x,

            y: camera.position.y,

            z: camera.position.z

        }

    };

    localStorage.setItem(
        SAVE_KEY,
        JSON.stringify(data)
    );

    $("saveIndicator").classList.add("show");

    setTimeout(() => {

        $("saveIndicator").classList.remove(
            "show"
        );

    }, 1200);

}


/* =========================================================
   START
========================================================= */

function startGame(continueSave = false) {

    startScreen.classList.add("hidden");

    hud.classList.remove("hidden");

    gameStarted = true;

    paused = false;

    gameOver = false;

    if (continueSave) {

        loadGame();

    } else {

        resetGame();

    }

    initThree();

    startTimer();

    requestAnimationFrame(gameLoop);

    showMessage(
        "Você está preso na escola. Encontre uma saída."
    );

    objective.textContent =
        "Explore a escola e encontre uma forma de sair.";

}


/* =========================================================
   RESET
========================================================= */

function resetGame() {

    timeLeft = GAME_TIME;

    inventory = [];

    flashlightEnergy = 100;

    flashlightOn = true;

    yaw = 0;

    pitch = 0;

    renderInventory();

    updateTimer();

    updateEnergy();

}


/* =========================================================
   CARREGAR SAVE
========================================================= */

function loadGame() {

    const saved =
        localStorage.getItem(SAVE_KEY);

    if (!saved) {

        resetGame();

        return;

    }

    try {

        const data =
            JSON.parse(saved);

        timeLeft =
            Number(data.timeLeft) ||
            GAME_TIME;

        inventory =
            Array.isArray(data.inventory)
                ? data.inventory
                : [];

        flashlightEnergy =
            Number(data.flashlightEnergy) || 100;

        flashlightOn =
            data.flashlightOn !== false;

        renderInventory();

        updateTimer();

        updateEnergy();

    } catch {

        resetGame();

    }

}


/* =========================================================
   THREE.JS
========================================================= */

function initThree() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x030712);

    scene.fog =
        new THREE.Fog(
            0x030712,
            8,
            35
        );


    camera =
        new THREE.PerspectiveCamera(
            70,
            window.innerWidth /
            window.innerHeight,
            0.05,
            100
        );

    camera.position.set(
        0,
        player.height,
        12
    );


    renderer =
        new THREE.WebGLRenderer({
            antialias: true
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio,
            2
        )
    );

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    renderer.shadowMap.enabled = true;

    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;

    renderer.outputColorSpace =
        THREE.SRGBColorSpace;

    document.body.appendChild(
        renderer.domElement
    );


    clock = new THREE.Clock();


    createLights();

    createSchool();

    createFlashlight();

    window.addEventListener(
        "resize",
        onResize
    );

}


/* =========================================================
   ILUMINAÇÃO
========================================================= */

function createLights() {

    const ambient =
        new THREE.AmbientLight(
            0x7890a8,
            0.18
        );

    scene.add(ambient);


    const moon =
        new THREE.DirectionalLight(
            0x8ab4d6,
            0.35
        );

    moon.position.set(
        5,
        10,
        5
    );

    moon.castShadow = true;

    scene.add(moon);


    const lightPositions = [
        [-8, 2.8, 8],
        [0, 2.8, 8],
        [8, 2.8, 8],
        [-8, 2.8, 0],
        [0, 2.8, 0],
        [8, 2.8, 0],
        [-8, 2.8, -8],
        [0, 2.8, -8],
        [8, 2.8, -8]
    ];


    lightPositions.forEach(
        (pos, index) => {

            const light =
                new THREE.PointLight(
                    index % 3 === 0
                        ? 0x7dd3fc
                        : 0xcbd5e1,
                    0.6,
                    9
                );

            light.position.set(
                pos[0],
                pos[1],
                pos[2]
            );

            scene.add(light);

        }
    );

}


/* =========================================================
   LANTERNA
========================================================= */

function createFlashlight() {

    flashlight =
        new THREE.SpotLight(
            0xffffff,
            5,
            24,
            Math.PI / 7,
            0.5,
            1
        );

    flashlight.position.set(
        0,
        0,
        0
    );

    flashlight.castShadow = true;

    camera.add(
        flashlight
    );

    flashlight.target.position.set(
        0,
        0,
        -10
    );

    camera.add(
        flashlight.target
    );

    scene.add(camera);

    updateFlashlight();

}


function updateFlashlight() {

    if (!flashlight) {
        return;
    }

    flashlight.visible =
        flashlightOn &&
        flashlightEnergy > 0;

}


/* =========================================================
   CONSTRUÇÃO DA ESCOLA
========================================================= */

function createSchool() {

    objects = [];

    colliders = [];


    createFloor();

    createWalls();

    createClassrooms();

    createDecorations();

    createPuzzleObjects();

    createExit();

}


/* =========================================================
   MATERIAIS
========================================================= */

function material(
    color,
    roughness = 0.8,
    metalness = 0
) {

    return new THREE.MeshStandardMaterial({
        color,
        roughness,
        metalness
    });

}


/* =========================================================
   CUBO
========================================================= */

function cube(
    x,
    y,
    z,
    sx,
    sy,
    sz,
    color,
    collide = false,
    name = ""
) {

    const mesh =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                sx,
                sy,
                sz
            ),
            material(color)
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.castShadow = true;

    mesh.receiveShadow = true;

    mesh.userData.name = name;

    scene.add(mesh);

    if (collide) {

        colliders.push({
            x,
            z,
            sx,
            sz
        });

    }

    return mesh;

}


/* =========================================================
   PISO
========================================================= */

function createFloor() {

    const floor =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                34,
                34
            ),
            material(0x17202b)
        );

    floor.rotation.x =
        -Math.PI / 2;

    floor.receiveShadow = true;

    scene.add(floor);


    const ceiling =
        new THREE.Mesh(
            new THREE.PlaneGeometry(
                34,
                34
            ),
            material(0x0b1118)
        );

    ceiling.rotation.x =
        Math.PI / 2;

    ceiling.position.y = 4;

    scene.add(ceiling);

}


/* =========================================================
   PAREDES
========================================================= */

function createWalls() {

    const wallColor =
        0x263746;


    // Parede externa norte
    cube(
        0,
        2,
        -17,
        34,
        4,
        0.5,
        wallColor,
        true
    );


    // Parede externa sul
    cube(
        0,
        2,
        17,
        34,
        4,
        0.5,
        wallColor,
        true
    );


    // Parede externa esquerda
    cube(
        -17,
        2,
        0,
        0.5,
        4,
        34,
        wallColor,
        true
    );


    // Parede externa direita
    cube(
        17,
        2,
        0,
        0.5,
        4,
        34,
        wallColor,
        true
    );


    // Corredor central - salas esquerda
    cube(
        -7,
        2,
        5,
        0.4,
        4,
        10,
        wallColor,
        true
    );

    cube(
        7,
        2,
        5,
        0.4,
        4,
        10,
        wallColor,
        true
    );


    // Parte traseira
    cube(
        -7,
        2,
        -7,
        0.4,
        4,
        8,
        wallColor,
        true
    );

    cube(
        7,
        2,
        -7,
        0.4,
        4,
        8,
        wallColor,
        true
    );

}


/* =========================================================
   SALAS
========================================================= */

function createClassrooms() {

    const doors = [
        [-7, 2, 10],
        [7, 2, 10],
        [-7, 2, -2],
        [7, 2, -2]
    ];

    doors.forEach(
        (pos) => {

            const door =
                cube(
                    pos[0],
                    pos[1],
                    pos[2],
                    2.5,
                    3.2,
                    0.3,
                    0x5b3a29,
                    false,
                    "door"
                );

            door.userData.interactive =
                true;

        }
    );

}


/* =========================================================
   DECORAÇÕES
========================================================= */

function createDecorations() {

    // Mesas
    for (
        let z = 8;
        z >= -8;
        z -= 4
    ) {

        createTable(
            -11,
            z
        );

        createTable(
            11,
            z
        );

    }


    // Armários
    createCabinet(
        -15,
        -8
    );

    createCabinet(
        15,
        -8
    );


    // Quadros
    createBoard(
        -10,
        3.2,
        16.5
    );

    createBoard(
        10,
        3.2,
        16.5
    );

}


function createTable(x, z) {

    cube(
        x,
        0.8,
        z,
        2,
        0.15,
        1,
        0x553c2d,
        true,
        "table"
    );

    cube(
        x - 0.8,
        0.4,
        z - 0.3,
        0.12,
        0.8,
        0.12,
        0x3b2a20,
        true
    );

    cube(
        x + 0.8,
        0.4,
        z - 0.3,
        0.12,
        0.8,
        0.12,
        0x3b2a20,
        true
    );

}


function createCabinet(x, z) {

    cube(
        x,
        1.4,
        z,
        1.3,
        2.8,
        0.7,
        0x334155,
        true,
        "cabinet"
    );

}


function createBoard(x, y, z) {

    cube(
        x,
        y,
        z,
        3,
        1.6,
        0.12,
        0x1e293b,
        false
    );

}


/* =========================================================
   PUZZLES
========================================================= */

function createPuzzleObjects() {

    createNote(
        -11,
        1.25,
        4,
        "Bilhete antigo",
        "O primeiro número está onde o tempo sempre está.",
        "📄"
    );


    createKey(
        11,
        1.25,
        4
    );


    createNote(
        -11,
        1.25,
        -4,
        "Anotação",
        "O segundo número está escondido perto de onde os alunos estudam.",
        "📝"
    );


    createChest(
        11,
        1.1,
        -4
    );


    createNote(
        -11,
        1.25,
        -12,
        "Última pista",
        "Quando encontrar os quatro números, procure o cofre.",
        "🔎"
    );


    createSafe(
        0,
        1.2,
        -13
    );

}


function interactiveMesh(
    mesh,
    type,
    data = {}
) {

    mesh.userData.interactive = true;

    mesh.userData.type = type;

    mesh.userData.data = data;

    objects.push(mesh);

}


/* =========================================================
   BILHETE
========================================================= */

function createNote(
    x,
    y,
    z,
    title,
    content,
    icon
) {

    const note =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.65,
                0.05,
                0.5
            ),
            material(0xe8ddbd)
        );

    note.position.set(
        x,
        y,
        z
    );

    note.rotation.x =
        Math.PI / 2;

    scene.add(note);

    interactiveMesh(
        note,
        "note",
        {
            title,
            content,
            icon
        }
    );

}


/* =========================================================
   CHAVE
========================================================= */

function createKey(x, y, z) {

    const group =
        new THREE.Group();

    const ring =
        new THREE.Mesh(
            new THREE.TorusGeometry(
                0.18,
                0.05,
                8,
                16
            ),
            material(
                0xfacc15,
                0.25,
                0.6
            )
        );

    const shaft =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                0.35,
                0.06,
                0.06
            ),
            material(
                0xfacc15,
                0.25,
                0.6
            )
        );

    shaft.position.x =
        0.25;

    group.add(
        ring,
        shaft
    );

    group.position.set(
        x,
        y,
        z
    );

    scene.add(group);

    interactiveMesh(
        group,
        "key"
    );

}


/* =========================================================
   BAÚ
========================================================= */

function createChest(x, y, z) {

    const chest =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.2,
                0.8,
                0.8
            ),
            material(0x654321)
        );

    chest.position.set(
        x,
        y,
        z
    );

    chest.castShadow = true;

    scene.add(chest);

    interactiveMesh(
        chest,
        "chest"
    );

}


/* =========================================================
   COFRE
========================================================= */

function createSafe(x, y, z) {

    const safe =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                1.5,
                1.7,
                0.8
            ),
            material(
                0x475569,
                0.35,
                0.3
            )
        );

    safe.position.set(
        x,
        y,
        z
    );

    safe.castShadow = true;

    scene.add(safe);

    interactiveMesh(
        safe,
        "safe"
    );

}


/* =========================================================
   SAÍDA
========================================================= */

function createExit() {

    const exit =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                2.5,
                3.2,
                0.35
            ),
            material(0x7f1d1d)
        );

    exit.position.set(
        0,
        1.6,
        16.6
    );

    scene.add(exit);

    interactiveMesh(
        exit,
        "exit"
    );

}


/* =========================================================
   INPUT
========================================================= */

function handleKeyDown(event) {

    keys[event.code] = true;


    if (
        event.code === "KeyE" &&
        gameStarted &&
        !paused
    ) {

        interact();

    }


    if (
        event.code === "KeyF" &&
        gameStarted &&
        !paused
    ) {

        toggleFlashlight();

    }


    if (
        event.code === "Escape" &&
        gameStarted
    ) {

        if (
            noteModal.classList.contains(
                "hidden"
            ) === false
        ) {

            closeNoteModal();

            return;

        }

        if (
            codeModal.classList.contains(
                "hidden"
            ) === false
        ) {

            closeCodeModal();

            return;

        }

        togglePause();

    }

}


function handleKeyUp(event) {

    keys[event.code] = false;

}


/* =========================================================
   MOUSE
========================================================= */

function handleMouseMove(event) {

    if (
        !gameStarted ||
        paused ||
        !pointerLocked
    ) {
        return;
    }

    yaw -=
        event.movementX * 0.0025;

    pitch -=
        event.movementY * 0.0025;

    pitch =
        THREE.MathUtils.clamp(
            pitch,
            -1.4,
            1.4
        );

}


/* =========================================================
   POINTER LOCK
========================================================= */

function handlePointerLock() {

    pointerLocked =
        document.pointerLockElement ===
        renderer?.domElement;

}


/* =========================================================
   JOYSTICK
========================================================= */

function setupJoystick() {

    if (!mobileMode) {
        return;
    }

    let rect;

    const updateJoystick =
        (event) => {

            if (!joystickData.active) {
                return;
            }

            rect =
                joystick.getBoundingClientRect();

            const centerX =
                rect.left +
                rect.width / 2;

            const centerY =
                rect.top +
                rect.height / 2;

            let dx =
                event.clientX -
                centerX;

            let dy =
                event.clientY -
                centerY;

            const max =
                rect.width / 2 - 26;

            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (distance > max) {

                dx =
                    dx / distance * max;

                dy =
                    dy / distance * max;

            }

            joystickData.x =
                dx / max;

            joystickData.y =
                dy / max;

            joystickKnob.style.transform =
                `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;

        };


    joystick.addEventListener(
        "pointerdown",
        (event) => {

            joystickData.active = true;

            joystick.setPointerCapture(
                event.pointerId
            );

            updateJoystick(event);

        }
    );


    joystick.addEventListener(
        "pointermove",
        updateJoystick
    );


    joystick.addEventListener(
        "pointerup",
        resetJoystick
    );


    joystick.addEventListener(
        "pointercancel",
        resetJoystick
    );

}


function resetJoystick() {

    joystickData.active = false;

    joystickData.x = 0;
    joystickData.y = 0;

    joystickKnob.style.transform =
        "translate(-50%, -50%)";

}


/* =========================================================
   MOVIMENTO
========================================================= */

function updatePlayer(delta) {

    if (
        !gameStarted ||
        paused ||
        gameOver ||
        !camera
    ) {
        return;
    }


    let forward = 0;
    let strafe = 0;


    if (keys["KeyW"]) {
        forward += 1;
    }

    if (keys["KeyS"]) {
        forward -= 1;
    }

    if (keys["KeyA"]) {
        strafe -= 1;
    }

    if (keys["KeyD"]) {
        strafe += 1;
    }


    if (mobileMode) {

        forward -=
            joystickData.y;

        strafe +=
            joystickData.x;

    }


    if (
        forward === 0 &&
        strafe === 0
    ) {

        return;

    }


    const running =
        keys["ShiftLeft"] ||
        keys["ShiftRight"];


    const speed =
        running
            ? player.runSpeed
            : player.speed;


    const length =
        Math.sqrt(
            forward * forward +
            strafe * strafe
        );


    if (length > 1) {

        forward /= length;
        strafe /= length;

    }


    const direction =
        new THREE.Vector3();


    camera.getWorldDirection(
        direction
    );


    direction.y = 0;

    direction.normalize();


    const right =
        new THREE.Vector3(
            direction.z,
            0,
            -direction.x
        );


    const movement =
        new THREE.Vector3();


    movement.addScaledVector(
        direction,
        forward * speed * delta
    );

    movement.addScaledVector(
        right,
        strafe * speed * delta
    );


    tryMove(
        movement.x,
        movement.z
    );

}


/* =========================================================
   COLISÃO
========================================================= */

function tryMove(dx, dz) {

    const nextX =
        camera.position.x + dx;

    const nextZ =
        camera.position.z + dz;


    if (
        !isColliding(
            nextX,
            camera.position.z
        )
    ) {

        camera.position.x =
            nextX;

    }


    if (
        !isColliding(
            camera.position.x,
            nextZ
        )
    ) {

        camera.position.z =
            nextZ;

    }


    camera.position.y =
        player.height;

}


function isColliding(x, z) {

    const r =
        player.radius;


    for (const wall of colliders) {

        if (
            x + r > wall.x - wall.sx / 2 &&
            x - r < wall.x + wall.sx / 2 &&
            z + r > wall.z - wall.sz / 2 &&
            z - r < wall.z + wall.sz / 2
        ) {

            return true;

        }

    }


    return false;

}


/* =========================================================
   INTERAÇÃO
========================================================= */

function findInteraction() {

    if (!camera || !scene) {
        return null;
    }


    const raycaster =
        new THREE.Raycaster();

    raycaster.setFromCamera(
        new THREE.Vector2(0, 0),
        camera
    );


    const hits =
        raycaster.intersectObjects(
            objects,
            true
        );


    if (!hits.length) {
        return null;
    }


    const hit =
        hits[0];


    if (hit.distance > 3.2) {
        return null;
    }


    let target =
        hit.object;


    while (
        target &&
        !target.userData.interactive
    ) {

        target =
            target.parent;

    }


    return target || null;

}


function updateInteraction() {

    if (
        !gameStarted ||
        paused ||
        gameOver
    ) {

        interactionPrompt.classList.remove(
            "visible"
        );

        currentInteraction = null;

        return;

    }


    const target =
        findInteraction();


    currentInteraction =
        target;


    if (!target) {

        interactionPrompt.classList.remove(
            "visible"
        );

        return;

    }


    let text =
        "Interagir";


    switch (
        target.userData.type
    ) {

        case "note":
            text = "Ler bilhete";
            break;

        case "key":
            text = "Pegar chave";
            break;

        case "chest":
            text = "Abrir baú";
            break;

        case "safe":
            text = "Usar cofre";
            break;

        case "exit":
            text = "Abrir saída";
            break;

    }


    interactionText.textContent =
        text;


    interactionPrompt.classList.add(
        "visible"
    );

}


/* =========================================================
   INTERAGIR
========================================================= */

function interact() {

    if (
        !gameStarted ||
        paused ||
        gameOver
    ) {
        return;
    }


    const target =
        currentInteraction ||
        findInteraction();


    if (!target) {

        showMessage(
            "Não há nada para interagir aqui."
        );

        return;

    }


    switch (
        target.userData.type
    ) {

        case "note":

            openNote(
                target.userData.data
            );

            break;


        case "key":

            collectKey(
                target
            );

            break;


        case "chest":

            openChest(
                target
            );

            break;


        case "safe":

            openCodeModal();

            break;


        case "exit":

            tryExit();

            break;

    }

}


/* =========================================================
   BILHETE
========================================================= */

function openNote(data) {

    noteIcon.textContent =
        data.icon || "📄";

    noteTitle.textContent =
        data.title;

    noteContent.textContent =
        data.content;

    noteModal.classList.remove(
        "hidden"
    );

    paused = true;

}


function closeNoteModal() {

    noteModal.classList.add(
        "hidden"
    );

    if (
        gameStarted &&
        !gameOver
    ) {

        paused = false;

    }

}


/* =========================================================
   CHAVE
========================================================= */

function collectKey(target) {

    if (
        !inventory.includes("🔑 Chave")
    ) {

        inventory.push(
            "🔑 Chave"
        );

        showMessage(
            "Você encontrou uma chave!"
        );

        objective.textContent =
            "Procure uma porta ou baú que possa ser aberto.";

        renderInventory();

        target.visible = false;

        saveGame();

    }

}


/* =========================================================
   BAÚ
========================================================= */

function openChest(target) {

    if (
        !inventory.includes("🔑 Chave")
    ) {

        showMessage(
            "O baú está trancado. Você precisa de uma chave."
        );

        return;

    }


    if (
        !inventory.includes("🧩 Pista")
    ) {

        inventory.push(
            "🧩 Pista"
        );

        showMessage(
            "Você encontrou uma pista dentro do baú!"
        );

        objective.textContent =
            "Encontre o cofre e descubra o código.";

        renderInventory();

        target.visible = false;

        saveGame();

    }

}


/* =========================================================
   COFRE
========================================================= */

function openCodeModal() {

    codeModal.classList.remove(
        "hidden"
    );

    codeFeedback.textContent =
        "";

    codeInput.value =
        "";

    updateCodeDisplay();

    paused = true;

    setTimeout(() => {

        codeInput.focus();

    }, 100);

}


function closeCodeModal() {

    codeModal.classList.add(
        "hidden"
    );

    codeInput.blur();

    if (
        gameStarted &&
        !gameOver
    ) {

        paused = false;

    }

}


function updateCodeDisplay() {

    const value =
        codeInput.value
            .replace(/\D/g, "")
            .slice(0, 4);

    codeInput.value =
        value;


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


function checkCode() {

    const value =
        codeInput.value.trim();


    if (
        value.length !== 4
    ) {

        codeFeedback.textContent =
            "Digite quatro números.";

        return;

    }


    if (value === CODE) {

        closeCodeModal();

        inventory.push(
            "🚪 Código da saída"
        );

        renderInventory();

        objective.textContent =
            "Vá até a porta principal e escape!";

        showMessage(
            "Código correto! A saída foi desbloqueada."
        );

        saveGame();

    } else {

        codeFeedback.textContent =
            "Código incorreto. Tente novamente.";

        codeInput.select();

    }

}


/* =========================================================
   SAÍDA
========================================================= */

function tryExit() {

    if (
        inventory.includes(
            "🚪 Código da saída"
        )
    ) {

        winGame();

        return;

    }


    showMessage(
        "A porta está trancada. Você ainda precisa encontrar o código."
    );

}


/* =========================================================
   INVENTÁRIO
========================================================= */

function renderInventory() {

    inventoryItems.innerHTML =
        "";


    itemCount.textContent =
        `${inventory.length}/8`;


    if (
        inventory.length === 0
    ) {

        const empty =
            document.createElement(
                "span"
            );

        empty.className =
            "empty-inventory";

        empty.textContent =
            "Nenhum item encontrado.";

        inventoryItems.appendChild(
            empty
        );

        return;

    }


    inventory.forEach(
        item => {

            const element =
                document.createElement(
                    "span"
                );

            element.className =
                "inventory-item";

            element.textContent =
                item;

            inventoryItems.appendChild(
                element
            );

        }
    );

}


/* =========================================================
   LANTERNA
========================================================= */

function toggleFlashlight() {

    if (
        flashlightEnergy <= 0
    ) {

        showMessage(
            "A bateria da lanterna acabou."
        );

        return;

    }


    flashlightOn =
        !flashlightOn;


    updateFlashlight();


    showMessage(
        flashlightOn
            ? "Lanterna ligada."
            : "Lanterna desligada."
    );

}


function drainFlashlight(delta) {

    if (
        !flashlightOn ||
        !gameStarted ||
        paused ||
        gameOver
    ) {

        return;

    }


    flashlightEnergy -=
        delta * 0.9;


    if (
        flashlightEnergy <= 0
    ) {

        flashlightEnergy = 0;

        flashlightOn = false;

        updateFlashlight();

        showMessage(
            "A bateria da lanterna acabou."
        );

    }


    updateEnergy();

}


function updateEnergy() {

    const value =
        Math.max(
            0,
            Math.min(
                100,
                flashlightEnergy
            )
        );


    energyFill.style.width =
        `${value}%`;

    energyText.textContent =
        `${Math.round(value)}%`;

}


/* =========================================================
   TIMER
========================================================= */

function startTimer() {

    clearInterval(
        timerInterval
    );


    timerInterval =
        setInterval(
            () => {

                if (
                    !gameStarted ||
                    paused ||
                    gameOver
                ) {

                    return;

                }


                timeLeft--;

                updateTimer();


                if (
                    timeLeft <= 0
                ) {

                    timeLeft = 0;

                    loseGame();

                }

            },
            1000
        );

}


function updateTimer() {

    const minutes =
        Math.floor(
            timeLeft / 60
        );

    const seconds =
        timeLeft % 60;


    timerElement.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;


    timerElement.classList.remove(
        "warning",
        "danger"
    );


    if (
        timeLeft <= 60
    ) {

        timerElement.classList.add(
            "danger"
        );

    } else if (
        timeLeft <= 180
    ) {

        timerElement.classList.add(
            "warning"
        );

    }

}


/* =========================================================
   MENSAGEM
========================================================= */

let messageTimeout;


function showMessage(text) {

    clearTimeout(
        messageTimeout
    );


    messageContainer.innerHTML =
        "";


    const message =
        document.createElement(
            "div"
        );

    message.className =
        "game-message";

    message.textContent =
        text;


    messageContainer.appendChild(
        message
    );


    messageTimeout =
        setTimeout(
            () => {

                message.remove();

            },
            3500
        );

}


/* =========================================================
   PAUSA
========================================================= */

function togglePause() {

    if (
        noteModal.classList.contains(
            "hidden"
        ) === false
    ) {
        return;
    }

    if (
        codeModal.classList.contains(
            "hidden"
        ) === false
    ) {
        return;
    }


    paused =
        !paused;


    if (paused) {

        pauseScreen.classList.remove(
            "hidden"
        );

    } else {

        pauseScreen.classList.add(
            "hidden"
        );

    }

}


function resumeGame() {

    paused = false;

    pauseScreen.classList.add(
        "hidden"
    );

}


/* =========================================================
   RECOMEÇAR
========================================================= */

function restartGame() {

    localStorage.removeItem(
        SAVE_KEY
    );

    location.reload();

}


/* =========================================================
   VITÓRIA
========================================================= */

function winGame() {

    if (gameOver) {
        return;
    }


    gameOver = true;

    gameStarted = false;

    clearInterval(
        timerInterval
    );


    finalTime.textContent =
        formatTime(timeLeft);


    finalItems.textContent =
        inventory.length;


    winScreen.classList.remove(
        "hidden"
    );


    hud.classList.add(
        "hidden"
    );


    document.exitPointerLock?.();


    localStorage.removeItem(
        SAVE_KEY
    );

}


/* =========================================================
   DERROTA
========================================================= */

function loseGame() {

    if (gameOver) {
        return;
    }


    gameOver = true;

    gameStarted = false;

    clearInterval(
        timerInterval
    );


    loseScreen.classList.remove(
        "hidden"
    );


    hud.classList.add(
        "hidden"
    );


    document.exitPointerLock?.();


    localStorage.removeItem(
        SAVE_KEY
    );

}


/* =========================================================
   FORMATAR TEMPO
========================================================= */

function formatTime(seconds) {

    const minutes =
        Math.floor(
            seconds / 60
        );

    const secs =
        seconds % 60;


    return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

}


/* =========================================================
   LOOP
========================================================= */

function gameLoop() {

    if (!gameStarted) {
        return;
    }


    requestAnimationFrame(
        gameLoop
    );


    const delta =
        Math.min(
            clock.getDelta(),
            0.05
        );


    if (!paused && !gameOver) {

        updatePlayer(
            delta
        );

        drainFlashlight(
            delta
        );

    }


    updateCamera();

    updateInteraction();

    renderer.render(
        scene,
        camera
    );

}


/* =========================================================
   CÂMERA
========================================================= */

function updateCamera() {

    if (!camera) {
        return;
    }


    camera.rotation.order =
        "YXZ";


    camera.rotation.y =
        yaw;

    camera.rotation.x =
        pitch;

}


/* =========================================================
   RESIZE
========================================================= */

function onResize() {

    if (!camera || !renderer) {
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

}


/* =========================================================
   CLIQUE PARA OLHAR
========================================================= */

document.addEventListener(
    "click",
    () => {

        if (
            !mobileMode &&
            gameStarted &&
            !paused &&
            renderer
        ) {

            renderer.domElement.requestPointerLock();

        }

    }
);
