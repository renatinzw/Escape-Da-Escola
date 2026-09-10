import * as THREE from "three";


/* =========================================================
   CONFIGURAÇÕES
========================================================= */

const GAME_TIME = 15 * 60;

const FINAL_CODE = "4271";

let timeLeft = GAME_TIME;

let gameStarted = false;
let gamePaused = false;
let gameEnded = false;

let flashlightOn = true;

let energy = 100;

let lastTime = performance.now();

const keys = {};

const inventory = [];


/* =========================================================
   THREE.JS
========================================================= */

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x050b16);

scene.fog = new THREE.FogExp2(
    0x050b16,
    0.035
);


const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    0.1,
    200
);

camera.position.set(
    0,
    1.7,
    12
);


const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

renderer.shadowMap.enabled = true;

renderer.shadowMap.type =
    THREE.PCFSoftShadowMap;

renderer.outputColorSpace =
    THREE.SRGBColorSpace;

renderer.toneMapping =
    THREE.ACESFilmicToneMapping;

renderer.toneMappingExposure = 1.1;

renderer.domElement.id = "game";

document.body.insertBefore(
    renderer.domElement,
    document.body.firstChild
);


/* =========================================================
   LUZ
========================================================= */

const ambientLight =
    new THREE.HemisphereLight(
        0x9bbcff,
        0x080b12,
        0.32
    );

scene.add(ambientLight);


const flashlight =
    new THREE.SpotLight(
        0xeaf7ff,
        9,
        32,
        Math.PI / 7,
        0.55,
        1.4
    );

flashlight.position.set(
    0,
    1.7,
    12
);

flashlight.castShadow = true;

flashlight.shadow.mapSize.width = 1024;
flashlight.shadow.mapSize.height = 1024;

scene.add(flashlight);

scene.add(flashlight.target);


/* =========================================================
   MATERIAIS
========================================================= */

const materials = {

    floor: new THREE.MeshStandardMaterial({
        color: 0x202b38,
        roughness: .9
    }),

    wall: new THREE.MeshStandardMaterial({
        color: 0x273444,
        roughness: .8
    }),

    wallDark: new THREE.MeshStandardMaterial({
        color: 0x111a27,
        roughness: .9
    }),

    ceiling: new THREE.MeshStandardMaterial({
        color: 0x101722,
        roughness: 1
    }),

    wood: new THREE.MeshStandardMaterial({
        color: 0x583c2b,
        roughness: .8
    }),

    metal: new THREE.MeshStandardMaterial({
        color: 0x64748b,
        metalness: .7,
        roughness: .35
    }),

    desk: new THREE.MeshStandardMaterial({
        color: 0x573d2d,
        roughness: .75
    }),

    blue: new THREE.MeshStandardMaterial({
        color: 0x2563eb,
        roughness: .45
    }),

    green: new THREE.MeshStandardMaterial({
        color: 0x16a34a,
        roughness: .5
    }),

    red: new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: .5
    }),

    white: new THREE.MeshStandardMaterial({
        color: 0xdbeafe,
        roughness: .6
    }),

    black: new THREE.MeshStandardMaterial({
        color: 0x020617,
        roughness: .9
    })

};


/* =========================================================
   FUNÇÕES DE OBJETOS
========================================================= */

const colliders = [];

const interactables = [];

const lights = [];


function box(
    x,
    y,
    z,
    w,
    h,
    d,
    material,
    collide = true
) {

    const geometry =
        new THREE.BoxGeometry(
            w,
            h,
            d
        );

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.position.set(
        x,
        y,
        z
    );

    mesh.castShadow = true;
    mesh.receiveShadow = true;

    scene.add(mesh);

    if (collide) {

        colliders.push({
            mesh,
            halfX: w / 2,
            halfZ: d / 2
        });

    }

    return mesh;
}


function addCeilingLight(
    x,
    z
) {

    const fixture =
        box(
            x,
            4.85,
            z,
            1.6,
            .08,
            .3,
            materials.white,
            false
        );

    const light =
        new THREE.PointLight(
            0xcfe9ff,
            1.2,
            9
        );

    light.position.set(
        x,
        4.7,
        z
    );

    light.castShadow = true;

    scene.add(light);

    lights.push(light);

    return fixture;
}


/* =========================================================
   CHÃO
========================================================= */

box(
    0,
    -0.15,
    0,
    34,
    .3,
    42,
    materials.floor,
    false
);


/* =========================================================
   TETO
========================================================= */

box(
    0,
    5.2,
    0,
    34,
    .25,
    42,
    materials.ceiling,
    false
);


/* =========================================================
   PAREDES EXTERNAS
========================================================= */

box(
    0,
    2.5,
    -20,
    34,
    5,
    .5,
    materials.wall
);

box(
    -17,
    2.5,
    0,
    .5,
    5,
    40,
    materials.wall
);

box(
    17,
    2.5,
    0,
    .5,
    5,
    40,
    materials.wall
);


/* =========================================================
   DIVISÕES DA ESCOLA
========================================================= */

/* Parede central */

box(
    -6,
    2.5,
    4,
    11,
    5,
    .35,
    materials.wall
);

box(
    6,
    2.5,
    4,
    11,
    5,
    .35,
    materials.wall
);


/* Parede lateral esquerda */

box(
    -11,
    2.5,
    -8,
    .35,
    5,
    16,
    materials.wall
);


/* Parede lateral direita */

box(
    11,
    2.5,
    -8,
    .35,
    5,
    16,
    materials.wall
);


/* =========================================================
   SALA DE AULA
========================================================= */

for (
    let z = -15;
    z <= -7;
    z += 2.4
) {

    box(
        -5,
        .85,
        z,
        2.1,
        .15,
        1,
        materials.desk
    );

    box(
        -5,
        .4,
        z + .35,
        .12,
        .8,
        .12,
        materials.metal
    );

    box(
        -5,
        .4,
        z - .35,
        .12,
        .8,
        .12,
        materials.metal
    );

}


box(
    -5,
    2.4,
    -18.8,
    5,
    1.8,
    .12,
    materials.black
);


/* =========================================================
   OUTRA SALA
========================================================= */

for (
    let z = -15;
    z <= -8;
    z += 2.3
) {

    box(
        6,
        .85,
        z,
        2.1,
        .15,
        1,
        materials.desk
    );

}


/* =========================================================
   ARMÁRIOS
========================================================= */

for (
    let z = -13;
    z <= -7;
    z += 1.7
) {

    box(
        13,
        1.4,
        z,
        1,
        2.8,
        1.2,
        materials.blue
    );

}


/* =========================================================
   PORTA FINAL
========================================================= */

const exitDoor =
    box(
        0,
        2,
        -19.65,
        3.4,
        4,
        .35,
        materials.red
    );

exitDoor.name = "exitDoor";


/* =========================================================
   PLACA DA SAÍDA
========================================================= */

const exitSign =
    box(
        0,
        4,
        -19.35,
        2.3,
        .6,
        .08,
        materials.green,
        false
    );


/* =========================================================
   LUZES
========================================================= */

for (
    let x = -12;
    x <= 12;
    x += 6
) {

    for (
        let z = -15;
        z <= 15;
        z += 6
    ) {

        addCeilingLight(
            x,
            z
        );

    }

}


/* =========================================================
   OBJETOS INTERATIVOS
========================================================= */

function createInteractable(
    name,
    position,
    type,
    message,
    icon = "📦"
) {

    const mesh =
        new THREE.Mesh(
            new THREE.BoxGeometry(
                .65,
                .65,
                .65
            ),
            new THREE.MeshStandardMaterial({
                color: 0x38bdf8,
                emissive: 0x063b5a,
                emissiveIntensity: .8
            })
        );

    mesh.position.copy(position);

    mesh.castShadow = true;

    mesh.userData = {
        name,
        type,
        message,
        icon,
        collected: false
    };

    scene.add(mesh);

    interactables.push(mesh);

    return mesh;
}


/* =========================================================
   PISTAS
========================================================= */

const note1 =
    createInteractable(
        "Bilhete da sala",
        new THREE.Vector3(
            -5,
            1.3,
            -10
        ),
        "note1",
        "Primeira pista encontrada.",
        "📄"
    );


const key =
    createInteractable(
        "Chave azul",
        new THREE.Vector3(
            6,
            1.3,
            -11
        ),
        "key",
        "Você encontrou uma chave.",
        "🔑"
    );


const note2 =
    createInteractable(
        "Bilhete do armário",
        new THREE.Vector3(
            13,
            2,
            -8
        ),
        "note2",
        "Há números escritos no bilhete.",
        "📝"
    );


const battery =
    createInteractable(
        "Bateria",
        new THREE.Vector3(
            -8,
            .7,
            10
        ),
        "battery",
        "Bateria encontrada. A lanterna foi recarregada.",
        "🔋"
    );


const finalNote =
    createInteractable(
        "Última pista",
        new THREE.Vector3(
            8,
            1,
            10
        ),
        "finalNote",
        "Esta parece ser a última pista.",
        "📜"
    );


/* =========================================================
   COFRE
========================================================= */

const safe =
    createInteractable(
        "Cofre",
        new THREE.Vector3(
            12,
            1.3,
            10
        ),
        "safe",
        "Um cofre está trancado.",
        "🔐"
    );


/* =========================================================
   LUZES DOS OBJETOS
========================================================= */

interactables.forEach(
    object => {

        const light =
            new THREE.PointLight(
                0x38bdf8,
                .6,
                3
            );

        light.position.copy(
            object.position
        );

        scene.add(light);

    }
);


/* =========================================================
   PLAYER
========================================================= */

const player = {

    position: new THREE.Vector3(
        0,
        1.7,
        14
    ),

    yaw: Math.PI,

    pitch: 0,

    speed: 4,

    radius: .45

};


camera.position.copy(
    player.position
);


/* =========================================================
   CONTROLES
========================================================= */

window.addEventListener(
    "keydown",
    event => {

        keys[event.code] = true;

        if (
            event.code === "Escape" &&
            gameStarted &&
            !gameEnded
        ) {

            togglePause();

        }

        if (
            event.code === "KeyE" &&
            gameStarted &&
            !gamePaused &&
            !gameEnded
        ) {

            interact();

        }

        if (
            event.code === "KeyF" &&
            gameStarted &&
            !gamePaused
        ) {

            toggleFlashlight();

        }

    }
);


window.addEventListener(
    "keyup",
    event => {

        keys[event.code] = false;

    }
);


/* =========================================================
   MOUSE
========================================================= */

let mouseLocked = false;

renderer.domElement.addEventListener(
    "click",
    () => {

        if (
            gameStarted &&
            !gamePaused &&
            !isMobile()
        ) {

            renderer.domElement.requestPointerLock();

        }

    }
);


document.addEventListener(
    "pointerlockchange",
    () => {

        mouseLocked =
            document.pointerLockElement ===
            renderer.domElement;

    }
);


document.addEventListener(
    "mousemove",
    event => {

        if (
            !mouseLocked ||
            !gameStarted ||
            gamePaused
        ) {
            return;
        }

        player.yaw -=
            event.movementX * .0022;

        player.pitch -=
            event.movementY * .0022;

        player.pitch =
            THREE.MathUtils.clamp(
                player.pitch,
                -.9,
                .9
            );

    }
);


/* =========================================================
   MOVIMENTO
========================================================= */

function movePlayer(
    delta
) {

    const direction =
        new THREE.Vector3();

    const forward =
        new THREE.Vector3(
            -Math.sin(player.yaw),
            0,
            -Math.cos(player.yaw)
        );

    const right =
        new THREE.Vector3(
            Math.cos(player.yaw),
            0,
            -Math.sin(player.yaw)
        );


    if (keys["KeyW"]) {

        direction.add(
            forward
        );

    }

    if (keys["KeyS"]) {

        direction.sub(
            forward
        );

    }

    if (keys["KeyD"]) {

        direction.add(
            right
        );

    }

    if (keys["KeyA"]) {

        direction.sub(
            right
        );

    }


    if (
        direction.lengthSq() === 0
    ) {

        return;

    }


    direction.normalize();


    let speed =
        player.speed;


    if (
        keys["ShiftLeft"] ||
        keys["ShiftRight"]
    ) {

        speed = 6.5;

        energy -=
            delta * 9;

    } else {

        energy +=
            delta * 4;

    }


    energy =
        THREE.MathUtils.clamp(
            energy,
            0,
            100
        );


    if (
        energy <= 0
    ) {

        speed = 3;

    }


    const movement =
        direction.multiplyScalar(
            speed * delta
        );


    const next =
        player.position.clone();

    next.x += movement.x;
    next.z += movement.z;


    if (
        !checkCollision(next)
    ) {

        player.position.copy(
            next
        );

    }

}


/* =========================================================
   COLISÃO
========================================================= */

function checkCollision(
    position
) {

    for (
        const collider of colliders
    ) {

        const box =
            collider.mesh;

        const minX =
            box.position.x -
            collider.halfX -
            player.radius;

        const maxX =
            box.position.x +
            collider.halfX +
            player.radius;

        const minZ =
            box.position.z -
            collider.halfZ -
            player.radius;

        const maxZ =
            box.position.z +
            collider.halfZ +
            player.radius;


        if (
            position.x > minX &&
            position.x < maxX &&
            position.z > minZ &&
            position.z < maxZ
        ) {

            return true;

        }

    }

    return false;

}


/* =========================================================
   CÂMERA
========================================================= */

function updateCamera() {

    camera.position.copy(
        player.position
    );


    camera.rotation.order =
        "YXZ";

    camera.rotation.y =
        player.yaw;

    camera.rotation.x =
        player.pitch;


    const direction =
        new THREE.Vector3(
            0,
            0,
            -1
        );

    direction.applyEuler(
        camera.rotation
    );


    flashlight.position.copy(
        camera.position
    );

    flashlight.target.position.copy(
        camera.position
            .clone()
            .add(
                direction.multiplyScalar(10)
            )
    );

}


/* =========================================================
   INTERAÇÃO
========================================================= */

function getNearestInteractable() {

    let nearest = null;

    let distance = Infinity;


    for (
        const object of interactables
    ) {

        if (
            object.userData.collected
        ) {

            continue;

        }


        const d =
            player.position.distanceTo(
                object.position
            );


        if (
            d < 2.4 &&
            d < distance
        ) {

            nearest = object;

            distance = d;

        }

    }


    return nearest;

}


function updateInteraction() {

    const object =
        getNearestInteractable();

    const prompt =
        document.getElementById(
            "interactionPrompt"
        );

    const text =
        document.getElementById(
            "interactionText"
        );


    if (
        object &&
        !gamePaused
    ) {

        prompt.classList.add(
            "visible"
        );

        text.textContent =
            object.userData.name;

    } else {

        prompt.classList.remove(
            "visible"
        );

    }

}


/* =========================================================
   INTERAGIR
========================================================= */

function interact() {

    const object =
        getNearestInteractable();


    if (!object) {

        return;

    }


    const type =
        object.userData.type;


    if (
        type === "safe"
    ) {

        if (
            !inventory.includes("🔑 Chave")
        ) {

            showMessage(
                "O cofre parece precisar de uma chave."
            );

            return;

        }

        openCodeModal();

        return;

    }


    object.userData.collected =
        true;

    object.visible = false;


    if (
        type === "note1"
    ) {

        addItem(
            "📄 Pista 1"
        );

        openNote(
            "Primeira pista",
            "Na sala existe uma sequência escondida. Procure o próximo objeto azul."
        );

        setObjective(
            "Encontre a chave azul."
        );

    }


    else if (
        type === "key"
    ) {

        addItem(
            "🔑 Chave"
        );

        showMessage(
            "Chave encontrada!"
        );

        setObjective(
            "Encontre o bilhete próximo aos armários."
        );

    }


    else if (
        type === "note2"
    ) {

        addItem(
            "📝 Pista 2"
        );

        openNote(
            "Segunda pista",
            "Os números parecem indicar uma parte do código: 42."
        );

        setObjective(
            "Encontre a última pista."
        );

    }


    else if (
        type === "battery"
    ) {

        energy = 100;

        addItem(
            "🔋 Bateria"
        );

        showMessage(
            "A lanterna foi completamente recarregada."
        );

    }


    else if (
        type === "finalNote"
    ) {

        addItem(
            "📜 Pista final"
        );

        openNote(
            "Última pista",
            "O restante do código é 71. Juntando as pistas: 42 + 71."
        );

        setObjective(
            "Use o código 4271 no cofre."
        );

    }

}


/* =========================================================
   INVENTÁRIO
========================================================= */

function addItem(
    item
) {

    if (
        inventory.includes(item)
    ) {

        return;

    }


    inventory.push(item);

    updateInventory();

    saveGame();

}


function updateInventory() {

    const container =
        document.getElementById(
            "inventoryItems"
        );

    const count =
        document.getElementById(
            "itemCount"
        );


    count.textContent =
        `${inventory.length}/8`;


    container.innerHTML = "";


    if (
        inventory.length === 0
    ) {

        container.innerHTML =
            `<span class="empty-inventory">Nenhum item encontrado.</span>`;

        return;

    }


    inventory.forEach(
        item => {

            const element =
                document.createElement(
                    "div"
                );

            element.className =
                "inventory-item";

            element.textContent =
                item;

            container.appendChild(
                element
            );

        }
    );

}


/* =========================================================
   OBJETIVO
========================================================= */

function setObjective(
    text
) {

    document.getElementById(
        "objective"
    ).textContent = text;

}


/* =========================================================
   MENSAGEM
========================================================= */

function showMessage(
    text
) {

    const container =
        document.getElementById(
            "messageContainer"
        );


    const message =
        document.createElement(
            "div"
        );

    message.className =
        "game-message";

    message.textContent =
        text;


    container.appendChild(
        message
    );


    setTimeout(
        () => {

            message.remove();

        },
        3500
    );

}


/* =========================================================
   PISTA
========================================================= */

function openNote(
    title,
    content
) {

    document.getElementById(
        "noteTitle"
    ).textContent = title;

    document.getElementById(
        "noteContent"
    ).textContent = content;


    document.getElementById(
        "noteModal"
    ).classList.remove(
        "hidden"
    );

}


function closeNote() {

    document.getElementById(
        "noteModal"
    ).classList.add(
        "hidden"
    );

}


/* =========================================================
   COFRE
========================================================= */

function openCodeModal() {

    gamePaused = true;

    document.getElementById(
        "codeModal"
    ).classList.remove(
        "hidden"
    );

    const input =
        document.getElementById(
            "codeInput"
        );

    input.value = "";

    updateCodeDisplay("");

    setTimeout(
        () => input.focus(),
        100
    );

}


function closeCodeModal() {

    document.getElementById(
        "codeModal"
    ).classList.add(
        "hidden"
    );

    if (
        !gameEnded
    ) {

        gamePaused = false;

    }

}


function updateCodeDisplay(
    code
) {

    const boxes =
        document.querySelectorAll(
            "#codeDisplay span"
        );


    boxes.forEach(
        (box, index) => {

            box.textContent =
                code[index] || "_";

        }
    );

}


function submitCode() {

    const input =
        document.getElementById(
            "codeInput"
        );

    const feedback =
        document.getElementById(
            "codeFeedback"
        );


    const code =
        input.value.trim();


    if (
        code === FINAL_CODE
    ) {

        feedback.textContent =
            "Código correto!";

        feedback.style.color =
            "#4ade80";


        setTimeout(
            () => {

                closeCodeModal();

                winGame();

            },
            700
        );

    } else {

        feedback.textContent =
            "Código incorreto. Procure mais pistas.";

        feedback.style.color =
            "#f87171";


        input.value = "";

        updateCodeDisplay("");

    }

}


/* =========================================================
   LANTERNA
========================================================= */

function toggleFlashlight() {

    flashlightOn =
        !flashlightOn;

    flashlight.visible =
        flashlightOn;


    showMessage(
        flashlightOn
            ? "Lanterna ligada."
            : "Lanterna desligada."
    );

}


function updateEnergy() {

    const fill =
        document.getElementById(
            "energyFill"
        );

    const text =
        document.getElementById(
            "energyText"
        );


    fill.style.width =
        `${energy}%`;

    text.textContent =
        `${Math.round(energy)}%`;

}


/* =========================================================
   TIMER
========================================================= */

function updateTimer(
    delta
) {

    if (
        !gameStarted ||
        gamePaused ||
        gameEnded
    ) {

        return;

    }


    timeLeft -= delta;


    if (
        timeLeft <= 0
    ) {

        timeLeft = 0;

        loseGame();

    }


    const minutes =
        Math.floor(
            timeLeft / 60
        );

    const seconds =
        Math.floor(
            timeLeft % 60
        );


    const formatted =
        `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;


    const timer =
        document.getElementById(
            "timer"
        );

    timer.textContent =
        formatted;


    timer.classList.remove(
        "warning",
        "danger"
    );


    if (
        timeLeft <= 60
    ) {

        timer.classList.add(
            "danger"
        );

    } else if (
        timeLeft <= 180
    ) {

        timer.classList.add(
            "warning"
        );

    }

}


/* =========================================================
   PAUSA
========================================================= */

function togglePause() {

    if (
        document.getElementById(
            "noteModal"
        ).classList.contains(
            "hidden"
        ) === false
    ) {

        return;

    }


    if (
        document.getElementById(
            "codeModal"
        ).classList.contains(
            "hidden"
        ) === false
    ) {

        return;

    }


    gamePaused =
        !gamePaused;


    document.getElementById(
        "pauseScreen"
    ).classList.toggle(
        "hidden",
        !gamePaused
    );

}


/* =========================================================
   SALVAR
========================================================= */

function saveGame() {

    try {

        localStorage.setItem(
            "escape_school_save",
            JSON.stringify({
                inventory,
                timeLeft,
                energy
            })
        );


        const indicator =
            document.getElementById(
                "saveIndicator"
            );

        indicator.classList.add(
            "show"
        );


        setTimeout(
            () => {

                indicator.classList.remove(
                    "show"
                );

            },
            1200
        );

    } catch (error) {

        console.warn(
            "Não foi possível salvar:",
            error
        );

    }

}


function loadGame() {

    try {

        const saved =
            localStorage.getItem(
                "escape_school_save"
            );


        if (!saved) {

            return false;

        }


        const data =
            JSON.parse(saved);


        if (
            Array.isArray(
                data.inventory
            )
        ) {

            inventory.push(
                ...data.inventory
            );

        }


        if (
            typeof data.timeLeft ===
            "number"
        ) {

            timeLeft =
                data.timeLeft;

        }


        if (
            typeof data.energy ===
            "number"
        ) {

            energy =
                data.energy;

        }


        updateInventory();

        updateEnergy();

        return true;

    } catch {

        return false;

    }

}


/* =========================================================
   REINICIAR
========================================================= */

function restartGame() {

    localStorage.removeItem(
        "escape_school_save"
    );

    location.reload();

}


/* =========================================================
   VITÓRIA
========================================================= */

function winGame() {

    if (
        gameEnded
    ) {

        return;

    }


    gameEnded = true;

    gamePaused = true;


    const minutes =
        Math.floor(
            timeLeft / 60
        );

    const seconds =
        Math.floor(
            timeLeft % 60
        );


    document.getElementById(
        "finalTime"
    ).textContent =
        `${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;


    document.getElementById(
        "finalItems"
    ).textContent =
        inventory.length;


    document.getElementById(
        "winScreen"
    ).classList.remove(
        "hidden"
    );


    if (
        document.pointerLockElement
    ) {

        document.exitPointerLock();

    }

}


/* =========================================================
   DERROTA
========================================================= */

function loseGame() {

    if (
        gameEnded
    ) {

        return;

    }


    gameEnded = true;

    gamePaused = true;


    document.getElementById(
        "loseScreen"
    ).classList.remove(
        "hidden"
    );


    if (
        document.pointerLockElement
    ) {

        document.exitPointerLock();

    }

}


/* =========================================================
   MOBILE
========================================================= */

function isMobile() {

    return (
        window.innerWidth <= 700 ||
        "ontouchstart" in window
    );

}


function setupMobile() {

    if (
        !isMobile()
    ) {

        return;

    }


    document.getElementById(
        "mobileControls"
    ).classList.remove(
        "hidden"
    );


    const joystick =
        document.getElementById(
            "joystick"
        );

    const knob =
        document.getElementById(
            "joystickKnob"
        );


    let active = false;


    joystick.addEventListener(
        "touchstart",
        event => {

            active = true;

            event.preventDefault();

        },
        {
            passive: false
        }
    );


    joystick.addEventListener(
        "touchmove",
        event => {

            if (!active) {

                return;

            }


            const touch =
                event.touches[0];

            const rect =
                joystick.getBoundingClientRect();


            const centerX =
                rect.left +
                rect.width / 2;

            const centerY =
                rect.top +
                rect.height / 2;


            let dx =
                touch.clientX -
                centerX;

            let dy =
                touch.clientY -
                centerY;


            const distance =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );


            const max =
                35;


            if (
                distance > max
            ) {

                dx =
                    dx / distance * max;

                dy =
                    dy / distance * max;

            }


            knob.style.transform =
                `translate(${dx}px,${dy}px)`;


            keys["KeyW"] =
                dy < -10;

            keys["KeyS"] =
                dy > 10;

            keys["KeyA"] =
                dx < -10;

            keys["KeyD"] =
                dx > 10;


            event.preventDefault();

        },
        {
            passive: false
        }
    );


    joystick.addEventListener(
        "touchend",
        () => {

            active = false;

            knob.style.transform =
                "translate(0,0)";


            keys["KeyW"] = false;
            keys["KeyS"] = false;
            keys["KeyA"] = false;
            keys["KeyD"] = false;

        }
    );


    document.getElementById(
        "mobileInteract"
    ).addEventListener(
        "click",
        interact
    );


    document.getElementById(
        "mobileFlashlight"
    ).addEventListener(
        "click",
        toggleFlashlight
    );

}


/* =========================================================
   BOTÕES
========================================================= */

document.getElementById(
    "startButton"
).addEventListener(
    "click",
    startGame
);


document.getElementById(
    "continueButton"
).addEventListener(
    "click",
    startGame
);


document.getElementById(
    "resumeButton"
).addEventListener(
    "click",
    () => {

        gamePaused = false;

        document.getElementById(
            "pauseScreen"
        ).classList.add(
            "hidden"
        );

    }
);


document.getElementById(
    "restartButton"
).addEventListener(
    "click",
    restartGame
);


document.getElementById(
    "winRestart"
).addEventListener(
    "click",
    restartGame
);


document.getElementById(
    "loseRestart"
).addEventListener(
    "click",
    restartGame
);


document.getElementById(
    "closeNote"
).addEventListener(
    "click",
    closeNote
);


document.getElementById(
    "continueNote"
).addEventListener(
    "click",
    closeNote
);


document.getElementById(
    "closeCode"
).addEventListener(
    "click",
    closeCodeModal
);


document.getElementById(
    "submitCode"
).addEventListener(
    "click",
    submitCode
);


document.getElementById(
    "codeInput"
).addEventListener(
    "input",
    event => {

        event.target.value =
            event.target.value
                .replace(/\D/g, "")
                .slice(0,4);

        updateCodeDisplay(
            event.target.value
        );

    }
);


document.getElementById(
    "codeInput"
).addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            submitCode();

        }

    }
);


/* =========================================================
   INICIAR
========================================================= */

function startGame() {

    document.getElementById(
        "startScreen"
    ).classList.add(
        "hidden"
    );

    document.getElementById(
        "hud"
    ).classList.remove(
        "hidden"
    );


    gameStarted = true;

    gamePaused = false;

    gameEnded = false;


    setupMobile();


    if (
        !isMobile()
    ) {

        renderer.domElement.requestPointerLock();

    }


    setObjective(
        "Encontre a primeira pista na sala de aula."
    );


    showMessage(
        "Explore a escola. Pressione E perto de objetos."
    );

}


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    () => {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;

        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);


/* =========================================================
   LOOP
========================================================= */

function animate(
    currentTime
) {

    requestAnimationFrame(
        animate
    );


    const delta =
        Math.min(
            (currentTime - lastTime) / 1000,
            .05
        );


    lastTime =
        currentTime;


    if (
        gameStarted &&
        !gamePaused &&
        !gameEnded
    ) {

        movePlayer(
            delta
        );

        updateCamera();

        updateInteraction();

        updateTimer(
            delta
        );

        updateEnergy();

        saveGamePeriodically(
            currentTime
        );

    }


    renderer.render(
        scene,
        camera
    );

}


let lastSave =
    0;


function saveGamePeriodically(
    time
) {

    if (
        time - lastSave < 15000
    ) {

        return;

    }


    lastSave =
        time;

    saveGame();

}


/* =========================================================
   PREPARAÇÃO
========================================================= */

function loadingSequence() {

    const progress =
        document.getElementById(
            "loadingProgress"
        );

    const text =
        document.getElementById(
            "loadingText"
        );


    let value = 0;


    const interval =
        setInterval(
            () => {

                value +=
                    Math.random() * 18;


                if (
                    value >= 100
                ) {

                    value = 100;

                    clearInterval(
                        interval
                    );


                    text.textContent =
                        "Escola pronta!";


                    setTimeout(
                        () => {

                            const loading =
                                document.getElementById(
                                    "loading"
                                );

                            loading.style.opacity =
                                "0";


                            setTimeout(
                                () => {

                                    loading.remove();

                                },
                                500
                            );

                        },
                        350
                    );

                }


                progress.style.width =
                    `${value}%`;


                if (
                    value < 35
                ) {

                    text.textContent =
                        "Construindo a escola...";

                } else if (
                    value < 70
                ) {

                    text.textContent =
                        "Preparando as pistas...";

                } else {

                    text.textContent =
                        "Acendendo as luzes...";

                }

            },
            100
        );

}


/* =========================================================
   SAVE EXISTENTE
========================================================= */

const hasSave =
    loadGame();


if (
    hasSave
) {

    document.getElementById(
        "continueButton"
    ).classList.remove(
        "hidden"
    );

}


updateInventory();

updateEnergy();

loadingSequence();

animate(
    performance.now()
);
