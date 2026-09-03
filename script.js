/* =========================================================
   ESCAPE SCHOOL - MOVIMENTO 2D TOP-DOWN
   ========================================================= */

let player2D = {
  x: 50,
  y: 50,
  speed: 0.65,
  moving: {
    up: false,
    down: false,
    left: false,
    right: false
  }
};

let nearbyObject = null;


/* =========================================================
   CONFIGURAÇÃO DOS OBJETOS
   ========================================================= */

const topdownObjects = {

  classroom: [
    {
      id: "blackboard",
      x: 20,
      y: 20,
      icon: "🧑‍🏫",
      name: "Quadro"
    },
    {
      id: "clock",
      x: 75,
      y: 20,
      icon: "🕐",
      name: "Relógio"
    },
    {
      id: "desk",
      x: 35,
      y: 55,
      icon: "🪑",
      name: "Carteira"
    },
    {
      id: "cabinet",
      x: 75,
      y: 60,
      icon: "🗄️",
      name: "Armário"
    }
  ],

  lab: [
    {
      id: "computer",
      x: 25,
      y: 30,
      icon: "💻",
      name: "Computador"
    },
    {
      id: "keyboard",
      x: 45,
      y: 30,
      icon: "⌨️",
      name: "Teclado"
    },
    {
      id: "shelf",
      x: 75,
      y: 55,
      icon: "📦",
      name: "Prateleira"
    }
  ],

  library: [
    {
      id: "books",
      x: 22,
      y: 30,
      icon: "📚",
      name: "Estante"
    },
    {
      id: "catalog",
      x: 72,
      y: 30,
      icon: "🗃️",
      name: "Catálogo"
    },
    {
      id: "reading",
      x: 50,
      y: 65,
      icon: "🔎",
      name: "Mesa"
    }
  ],

  science: [
    {
      id: "flasks",
      x: 25,
      y: 30,
      icon: "🧪",
      name: "Frascos"
    },
    {
      id: "board",
      x: 75,
      y: 25,
      icon: "🧮",
      name: "Quadro"
    },
    {
      id: "box",
      x: 55,
      y: 65,
      icon: "🧰",
      name: "Caixa"
    }
  ],

  corridor: [
    {
      id: "locker",
      x: 25,
      y: 40,
      icon: "🗄️",
      name: "Armário"
    },
    {
      id: "notice",
      x: 50,
      y: 25,
      icon: "📌",
      name: "Mural"
    },
    {
      id: "camera",
      x: 75,
      y: 40,
      icon: "📹",
      name: "Câmera"
    }
  ],

  exit: [
    {
      id: "final",
      x: 50,
      y: 45,
      icon: "🔐",
      name: "Portão"
    }
  ]

};


/* =========================================================
   NOVA CENA 2D
   ========================================================= */

function roomHTML(id) {

  const objects =
    topdownObjects[id] || [];

  return `

    <div class="topdown-scene" id="topdownScene">

      <div class="topdown-floor"></div>

      <div class="topdown-wall wall-top"></div>
      <div class="topdown-wall wall-bottom"></div>
      <div class="topdown-wall wall-left"></div>
      <div class="topdown-wall wall-right"></div>

      <div class="topdown-room-title">
        ${rooms[id].icon}
        ${rooms[id].name}
      </div>

      ${objects.map(object => `

        <button
          class="topdown-object"
          data-topdown-action="${object.id}"
          style="
            left:${object.x}%;
            top:${object.y}%;
          "
        >

          <span class="object-icon">
            ${object.icon}
          </span>

          <span class="object-name">
            ${object.name}
          </span>

        </button>

      `).join("")}

      <div
        id="player2D"
        class="topdown-player"
        style="
          left:${player2D.x}%;
          top:${player2D.y}%;
        "
      >
        🧍
        <span class="player-label">
          VOCÊ
        </span>
      </div>

      <div
        id="interactionText"
        class="interaction-text"
      >
        Pressione ESPAÇO para interagir
      </div>

      <button
        id="interactButton"
        class="interact-button"
      >
        INTERAGIR
      </button>

      <div class="controls-help">
        ⬆️⬇️⬅️➡️ / WASD • Chegue perto dos objetos
      </div>

      <div class="mobile-controls">

        <button
          class="mobile-up"
          data-move="up"
        >
          ▲
        </button>

        <button
          class="mobile-left"
          data-move="left"
        >
          ◀
        </button>

        <button
          class="mobile-down"
          data-move="down"
        >
          ▼
        </button>

        <button
          class="mobile-right"
          data-move="right"
        >
          ▶
        </button>

      </div>

    </div>

  `;
}


/* =========================================================
   INICIALIZA O MAPA
   ========================================================= */

function bindObjects() {

  document
    .querySelectorAll("[data-topdown-action]")
    .forEach(button => {

      button.onclick = () => {

        const action =
          button.dataset.topdownAction;

        interactWithObject(action);

      };

    });


  const interactButton =
    document.querySelector("#interactButton");


  if (interactButton) {

    interactButton.onclick =
      () => {

        if (nearbyObject) {

          actions(nearbyObject.id);

        }

      };

  }


  document
    .querySelectorAll("[data-move]")
    .forEach(button => {

      const direction =
        button.dataset.move;


      const start = event => {

        event.preventDefault();

        player2D.moving[direction] =
          true;

      };


      const stop = event => {

        event.preventDefault();

        player2D.moving[direction] =
          false;

      };


      button.addEventListener(
        "touchstart",
        start,
        { passive:false }
      );

      button.addEventListener(
        "touchend",
        stop,
        { passive:false }
      );

      button.addEventListener(
        "mousedown",
        start
      );

      button.addEventListener(
        "mouseup",
        stop
      );

      button.addEventListener(
        "mouseleave",
        stop
      );

    });


  updateNearbyObject();

}


/* =========================================================
   TECLADO
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    const key =
      event.key.toLowerCase();


    if (
      [
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "w",
        "a",
        "s",
        "d"
      ].includes(key)
    ) {

      event.preventDefault();

    }


    if (
      key === "arrowup" ||
      key === "w"
    ) {

      player2D.moving.up = true;

    }


    if (
      key === "arrowdown" ||
      key === "s"
    ) {

      player2D.moving.down = true;

    }


    if (
      key === "arrowleft" ||
      key === "a"
    ) {

      player2D.moving.left = true;

    }


    if (
      key === "arrowright" ||
      key === "d"
    ) {

      player2D.moving.right = true;

    }


    if (
      key === " " ||
      key === "enter"
    ) {

      if (nearbyObject) {

        actions(
          nearbyObject.id
        );

      }

    }

  }
);


document.addEventListener(
  "keyup",
  event => {

    const key =
      event.key.toLowerCase();


    if (
      key === "arrowup" ||
      key === "w"
    ) {

      player2D.moving.up = false;

    }


    if (
      key === "arrowdown" ||
      key === "s"
    ) {

      player2D.moving.down = false;

    }


    if (
      key === "arrowleft" ||
      key === "a"
    ) {

      player2D.moving.left = false;

    }


    if (
      key === "arrowright" ||
      key === "d"
    ) {

      player2D.moving.right = false;

    }

  }
);


/* =========================================================
   MOVIMENTO
   ========================================================= */

function updatePlayer() {

  if (!state.started) {

    requestAnimationFrame(
      updatePlayer
    );

    return;

  }


  let dx = 0;
  let dy = 0;


  if (player2D.moving.up)
    dy -= player2D.speed;


  if (player2D.moving.down)
    dy += player2D.speed;


  if (player2D.moving.left)
    dx -= player2D.speed;


  if (player2D.moving.right)
    dx += player2D.speed;


  if (dx !== 0 || dy !== 0) {

    player2D.x += dx;
    player2D.y += dy;


    /*
      Limites da sala.
      O personagem não consegue
      atravessar as paredes.
    */

    player2D.x =
      Math.max(
        5,
        Math.min(
          95,
          player2D.x
        )
      );


    player2D.y =
      Math.max(
        8,
        Math.min(
          92,
          player2D.y
        )
      );


    const player =
      document.querySelector(
        "#player2D"
      );


    if (player) {

      player.style.left =
        player2D.x + "%";

      player.style.top =
        player2D.y + "%";

    }


    updateNearbyObject();

  }


  requestAnimationFrame(
    updatePlayer
  );

}


requestAnimationFrame(
  updatePlayer
);


/* =========================================================
   OBJETO MAIS PRÓXIMO
   ========================================================= */

function updateNearbyObject() {

  const objects =
    topdownObjects[state.room] || [];


  let closest = null;
  let closestDistance = Infinity;


  objects.forEach(object => {

    const dx =
      player2D.x - object.x;

    const dy =
      player2D.y - object.y;


    const distance =
      Math.sqrt(
        dx * dx +
        dy * dy
      );


    if (
      distance < closestDistance
    ) {

      closestDistance =
        distance;

      closest =
        object;

    }

  });


  const interactionText =
    document.querySelector(
      "#interactionText"
    );


  const interactButton =
    document.querySelector(
      "#interactButton"
    );


  document
    .querySelectorAll(
      ".topdown-object"
    )
    .forEach(object => {

      object.classList.remove(
        "near"
      );

    });


  nearbyObject = null;


  /*
    10% é a distância necessária
    para interagir.
  */

  if (
    closest &&
    closestDistance < 13
  ) {

    nearbyObject =
      closest;


    const element =
      document.querySelector(
        `[data-topdown-action="${closest.id}"]`
      );


    if (element) {

      element.classList.add(
        "near"
      );

    }


    if (interactionText) {

      interactionText.textContent =
        `ESPAÇO → ${closest.name}`;

      interactionText.classList.add(
        "show"
      );

    }


    if (interactButton) {

      interactButton.textContent =
        `INTERAGIR: ${closest.name}`;

      interactButton.classList.add(
        "show"
      );

    }

  } else {

    if (interactionText) {

      interactionText.classList.remove(
        "show"
      );

    }


    if (interactButton) {

      interactButton.classList.remove(
        "show"
      );

    }

  }

}


/* =========================================================
   REINICIAR POSIÇÃO AO TROCAR DE SALA
   ========================================================= */

const originalGoRoom =
  goRoom;


goRoom = function(id) {

  originalGoRoom(id);


  /*
    Coloca o jogador novamente
    no centro da nova sala.
  */

  player2D.x = 50;
  player2D.y = 75;

  nearbyObject = null;

  setTimeout(
    updateNearbyObject,
    50
  );

};


/* =========================================================
   POSIÇÃO INICIAL
   ========================================================= */

player2D.x = 50;
player2D.y = 75;
