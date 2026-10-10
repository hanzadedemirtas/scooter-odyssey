// SCOOTER ODYSSEY

const $ = function (id) {
    return document.getElementById(id);
};

const screens = {
    home: $("screen-home"),
    character: $("screen-character"),
    intro: $("screen-intro-video"),
    game: $("screen-game"),
    ending: $("screen-ending")
};

const character = {
    gender: "female",
    color: "#ff5ca8"
};

const scooterSpeed = 7;
const jumpPower = 17;

const preview = $("preview-canvas");
const previewCtx = preview.getContext("2d");

const homeCanvas = $("home-canvas");
const homeCtx = homeCanvas.getContext("2d");

const canvas = $("game-canvas");
const ctx = canvas.getContext("2d");

const introVideo = $("video-intro");
const treasureVideo = $("video-event");
const finalVideo = $("video-final");
const dogVideo = $("video-dog");

let gameRunning = false;
let gamePaused = false;
let animationId = null;
let lastTime = 0;
let nextSpawn = 80;

const game = {
    distance: 0,
    coins: 0,
    crashes: 0,
    playerY: 0,
    jumpVelocity: 0,
    ducking: false,
    objects: [],
    frame: 0,
    treasureFound: false,
    sockFound: false,
    dogBikeShown: false,
    invincibleUntil: 0
};

const playerX = 165;
const groundY = 475;
const finishDistance = 350;

// --------------------------------------------------
// SCREEN AND MODAL FUNCTIONS
// --------------------------------------------------

function showScreen(screen) {
    Object.keys(screens).forEach(function (key) {
        screens[key].classList.add("hidden");
    });

    screen.classList.remove("hidden");
}

function showModal(id) {
    $(id).classList.remove("hidden");
}

function hideModal(id) {
    $(id).classList.add("hidden");
}

// --------------------------------------------------
// CHARACTER DRAWING
// --------------------------------------------------

function drawScooter(drawContext, x, y, scale, color) {
    drawContext.save();
    drawContext.translate(x, y);
    drawContext.scale(scale, scale);

    drawContext.fillStyle = "#403447";

    drawContext.beginPath();
    drawContext.arc(-25, 0, 9, 0, Math.PI * 2);
    drawContext.arc(25, 0, 9, 0, Math.PI * 2);
    drawContext.fill();

    drawContext.strokeStyle = color;
    drawContext.lineWidth = 8;
    drawContext.lineCap = "round";

    drawContext.beginPath();
    drawContext.moveTo(-25, -5);
    drawContext.lineTo(25, -5);
    drawContext.moveTo(22, -5);
    drawContext.lineTo(13, -48);
    drawContext.moveTo(5, -48);
    drawContext.lineTo(24, -48);
    drawContext.stroke();

    drawContext.restore();
}

function drawRider(drawContext, x, ground, scale, isPreview) {
    drawContext.save();
    drawContext.translate(
        x,
        ground - (isPreview ? 0 : game.playerY)
    );
    drawContext.scale(scale, scale);

    let headY = -77;
    let bodyY = -51;

    if (!isPreview && game.ducking) {
        headY = -45;
        bodyY = -32;
    }

    drawContext.fillStyle = "rgba(51,38,61,0.13)";
    drawContext.beginPath();
    drawContext.ellipse(0, 4, 43, 8, 0, 0, Math.PI * 2);
    drawContext.fill();

    drawContext.strokeStyle = "#493c55";
    drawContext.lineWidth = 10;
    drawContext.lineCap = "round";

    drawContext.beginPath();
    drawContext.moveTo(-8, bodyY + 20);
    drawContext.lineTo(-15, -10);
    drawContext.moveTo(8, bodyY + 20);
    drawContext.lineTo(14, -10);
    drawContext.stroke();

    drawContext.strokeStyle = "#ffffff";
    drawContext.lineWidth = 8;

    drawContext.beginPath();
    drawContext.moveTo(-15, -10);
    drawContext.lineTo(-25, -8);
    drawContext.moveTo(14, -10);
    drawContext.lineTo(24, -8);
    drawContext.stroke();

    drawContext.fillStyle =
        character.gender === "female" ? "#f5d9ec" : "#8b73bd";

    drawContext.beginPath();
    drawContext.roundRect(-16, bodyY - 4, 32, 42, 10);
    drawContext.fill();

    drawContext.strokeStyle = "#d99a75";
    drawContext.lineWidth = 8;

    drawContext.beginPath();
    drawContext.moveTo(-12, bodyY + 5);
    drawContext.lineTo(-26, bodyY + 17);
    drawContext.moveTo(12, bodyY + 5);
    drawContext.lineTo(22, bodyY + 17);
    drawContext.stroke();

    drawContext.fillStyle = "#d99a75";
    drawContext.beginPath();
    drawContext.arc(0, headY, 17, 0, Math.PI * 2);
    drawContext.fill();

    drawContext.fillStyle = "#49334e";
    drawContext.beginPath();
    drawContext.arc(0, headY - 4, 18, Math.PI, Math.PI * 2);
    drawContext.fill();

    if (character.gender === "female") {
        drawContext.fillStyle = "#f5d9ec";
        drawContext.beginPath();
        drawContext.arc(0, headY + 1, 18, Math.PI, Math.PI * 2);
        drawContext.lineTo(17, headY + 10);
        drawContext.quadraticCurveTo(
            0,
            headY + 25,
            -17,
            headY + 10
        );
        drawContext.closePath();
        drawContext.fill();
    }

    drawContext.fillStyle = "#49334e";
    drawContext.beginPath();
    drawContext.arc(6, headY, 2, 0, Math.PI * 2);
    drawContext.fill();

    drawScooter(drawContext, 0, 0, 1, character.color);

    drawContext.restore();
}

function drawPreviewOn(drawContext, width, height) {
    drawContext.clearRect(0, 0, width, height);

    drawContext.fillStyle = "#ffe5f1";
    drawContext.fillRect(0, 0, width, height);

    drawContext.fillStyle = "rgba(255,255,255,0.7)";
    drawContext.beginPath();
    drawContext.arc(width * 0.22, height * 0.22, 27, 0, Math.PI * 2);
    drawContext.arc(width * 0.8, height * 0.25, 39, 0, Math.PI * 2);
    drawContext.fill();

    drawRider(
        drawContext,
        width / 2,
        height * 0.76,
        width / 400,
        true
    );
}

function drawPreview() {
    drawPreviewOn(previewCtx, preview.width, preview.height);
}

function drawHomePreview() {
    drawPreviewOn(homeCtx, homeCanvas.width, homeCanvas.height);
}

// --------------------------------------------------
// CHARACTER OPTIONS
// --------------------------------------------------

function updateCharacterButtons() {
    document.querySelectorAll("[data-gender]").forEach(function (button) {
        button.classList.toggle(
            "active",
            button.dataset.gender === character.gender
        );
    });

    document.querySelectorAll("[data-color]").forEach(function (button) {
        button.classList.toggle(
            "active",
            button.dataset.color === character.color
        );
    });

    drawPreview();
}

// --------------------------------------------------
// HOME BUTTONS
// --------------------------------------------------

$("btn-home-create").addEventListener("click", function () {
    showScreen(screens.character);
});

$("btn-home-default").addEventListener("click", function () {
    showModal("modal-default-meme");
});

$("btn-default-back").addEventListener("click", function () {
    hideModal("modal-default-meme");
});

// --------------------------------------------------
// CHARACTER SELECTION
// --------------------------------------------------

$("btn-back-home").addEventListener("click", function () {
    showScreen(screens.home);
});

document.querySelectorAll("[data-gender]").forEach(function (button) {
    button.addEventListener("click", function () {
        character.gender = this.dataset.gender;
        updateCharacterButtons();
    });
});

document.querySelectorAll("[data-color]").forEach(function (button) {
    button.addEventListener("click", function () {
        character.color = this.dataset.color;
        updateCharacterButtons();
    });
});

// Use the default character.
$("btn-confirm-default-meme").addEventListener("click", function () {
    character.gender = "female";
    character.color = "#ff5ca8";

    updateCharacterButtons();
    hideModal("modal-default-meme");
    startIntro();
});

// Start with the custom character.
$("btn-create-character").addEventListener("click", function () {
    startIntro();
});

// --------------------------------------------------
// INTRO VIDEO
// --------------------------------------------------

function startIntro() {
    gameRunning = false;

    cancelAnimationFrame(animationId);

    hideModal("modal-pause");
    hideModal("modal-crash");
    hideModal("modal-event-video");
    hideModal("modal-dog-video");
    hideModal("modal-sock-secret");

    showScreen(screens.intro);

    // Show the game instructions while the intro video plays.
    $("intro-ready-card").classList.remove("hidden");
    $("btn-skip-intro").classList.remove("hidden");

    introVideo.pause();
    introVideo.currentTime = 0;

    const playResult = introVideo.play();

    if (playResult) {
        playResult.catch(function () {
            // The video can still be played using its controls.
        });
    }
}

function showReadyCard() {
    $("intro-ready-card").classList.remove("hidden");
}

introVideo.addEventListener("ended", showReadyCard);

$("btn-skip-intro").addEventListener("click", function () {
    introVideo.pause();
    showReadyCard();
});

$("btn-start-game").addEventListener("click", startGame);

// --------------------------------------------------
// RESET AND START GAME
// --------------------------------------------------

function resetGame() {
    game.distance = 0;
    game.coins = 0;
    game.crashes = 0;
    game.playerY = 0;
    game.jumpVelocity = 0;
    game.ducking = false;
    game.objects = [];
    game.frame = 0;
    game.treasureFound = false;
    game.sockFound = false;
    game.dogBikeShown = false;
    game.invincibleUntil = 0;

    nextSpawn = 80;
    lastTime = 0;

    updateHUD();
}

function startGame() {
    introVideo.pause();
    treasureVideo.pause();
    dogVideo.pause();
    finalVideo.pause();

    hideModal("modal-pause");
    hideModal("modal-crash");
    hideModal("modal-event-video");
    hideModal("modal-dog-video");
    hideModal("modal-sock-secret");

    resetGame();

    showScreen(screens.game);

    gameRunning = true;
    gamePaused = false;

    animationId = requestAnimationFrame(gameLoop);
}

// --------------------------------------------------
// GAME BACKGROUND
// --------------------------------------------------

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);

    sky.addColorStop(0, "#d9f3f3");
    sky.addColorStop(1, "#fff0f7");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffe09a";
    ctx.beginPath();
    ctx.arc(820, 95, 40, 0, Math.PI * 2);
    ctx.fill();

    const buildingColors = ["#c9c2e9", "#e4c5de", "#b8dcd9"];

    for (let i = 0; i < 12; i++) {
        const x = i * 100 - (game.distance * 1.3 % 100);
        const height = 120 + (i % 4) * 30;

        ctx.fillStyle = buildingColors[i % buildingColors.length];
        ctx.fillRect(x, groundY - height, 70, height);
    }

    ctx.fillStyle = "#bce9cc";
    ctx.fillRect(
        0,
        groundY,
        canvas.width,
        canvas.height - groundY
    );

    ctx.fillStyle = "#71657b";
    ctx.fillRect(0, groundY + 15, canvas.width, 100);

    ctx.fillStyle = "#fff4d8";

    for (let i = 0; i < 10; i++) {
        const x = i * 140 - (game.distance * 5 % 140);
        ctx.fillRect(x, groundY + 62, 65, 5);
    }

    ctx.fillStyle = "#f6b7d9";
    ctx.fillRect(0, groundY + 10, canvas.width, 6);
}

// --------------------------------------------------
// DRAW OBJECTS
// --------------------------------------------------

function drawObject(object) {
    if (object.type === "coin") {
        ctx.fillStyle = "#ffc94f";
        ctx.beginPath();
        ctx.arc(object.x, object.y, 13, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#e89b2d";
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.fillStyle = "#fff6c6";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("$", object.x, object.y + 5);
    }

    if (object.type === "treasure") {
        ctx.fillStyle = "#ffbd3f";
        ctx.beginPath();
        ctx.arc(object.x, object.y, 36, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#fff1a3";
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = "#8e5719";
        ctx.font = "bold 29px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("★", object.x, object.y + 1);
        ctx.textBaseline = "alphabetic";
    }

    if (object.type === "sock") {
        ctx.fillStyle = "#fff8fd";
        ctx.strokeStyle = "#c46ba5";
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.roundRect(object.x - 10, object.y - 24, 19, 33, 8);
        ctx.lineTo(object.x + 17, object.y + 15);
        ctx.quadraticCurveTo(
            object.x + 20,
            object.y + 23,
            object.x + 9,
            object.y + 23
        );
        ctx.lineTo(object.x - 7, object.y + 18);
        ctx.quadraticCurveTo(
            object.x - 13,
            object.y + 15,
            object.x - 10,
            object.y + 8
        );
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    if (object.type === "cone") {
        ctx.fillStyle = "#ff795f";

        ctx.beginPath();
        ctx.moveTo(object.x, groundY + 15);
        ctx.lineTo(object.x + 22, groundY - 40);
        ctx.lineTo(object.x + 44, groundY + 15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(object.x + 9, groundY - 5, 26, 6);
    }

    if (object.type === "low") {
        ctx.fillStyle = "#594667";
        ctx.fillRect(object.x, groundY - 28, 48, 28);

        ctx.fillStyle = "#9275ed";
        ctx.fillRect(object.x + 4, groundY - 20, 6, 20);
        ctx.fillRect(object.x + 38, groundY - 20, 6, 20);
    }


    if (object.type === "big") {
        ctx.fillStyle = "#e74f63";
        ctx.fillRect(object.x, groundY - 70, 58, 85);

        ctx.fillStyle = "#fff4e8";

        for (let i = 0; i < 2; i++) {
            ctx.beginPath();
            ctx.moveTo(object.x + 10 + i * 27, groundY - 70);
            ctx.lineTo(object.x + 23 + i * 27, groundY - 70);
            ctx.lineTo(object.x + 10 + i * 27, groundY - 48);
            ctx.lineTo(object.x + 4 + i * 27, groundY - 48);
            ctx.closePath();
            ctx.fill();
        }


        ctx.fillStyle = "#594667";
        ctx.fillRect(object.x - 2, groundY + 7, 62, 8);
    }
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBackground();

    for (let i = 0; i < game.objects.length; i++) {
        drawObject(game.objects[i]);
    }

    drawRider(ctx, playerX, groundY, 1.1, false);

}

// --------------------------------------------------
// SPAWN GAME OBJECTS
// --------------------------------------------------

function spawnObjects() {
    // Obstacles stop appearing near the finish.
    if (game.distance < 285 && Math.random() < 0.65) {
        const roll = Math.random();
        let obstacleType = "low";

        if (roll < 0.2) {
            obstacleType = "big";
        } else if (roll < 0.55) {
            obstacleType = "cone";
        }

        game.objects.push({
            type: obstacleType,
            x: canvas.width + 30,
            passed: false
        });
    }

    // Coins
    if (Math.random() < 0.8) {
        for (let i = 0; i < 3; i++) {
            game.objects.push({
                type: "coin",
                x: canvas.width + 100 + i * 38,
                y: groundY - 70 - (i % 2) * 20,
                collected: false
            });
        }
    }

    // Small obstacle followed by the treasure.
    if (
        !game.treasureFound &&
        game.distance >= 175 &&
        !game.objects.some(function (item) {
            return item.type === "treasure" ||
                (item.type === "low" && item.treasureObstacle);
        })
    ) {
        game.objects.push({
            type: "low",
            x: canvas.width + 60,
            passed: false,
            treasureObstacle: true
        });

        game.objects.push({
            type: "treasure",
            x: canvas.width + 155,
            y: groundY - 105,
            collected: false
        });
    }

    // Sock collectible.
    if (
        !game.sockFound &&
        game.distance >= 95 &&
        !game.objects.some(function (item) {
            return item.type === "sock";
        })
    ) {
        game.objects.push({
            type: "sock",
            x: canvas.width + 220,
            y: groundY - 23,
            collected: false
        });
    }
}

// --------------------------------------------------
// COLLISIONS
// --------------------------------------------------

function overlapsPlayer(object) {
    const playerLeft = playerX - 25;
    const playerRight = playerX + 25;

    const playerTop =
        groundY - game.playerY - (game.ducking ? 50 : 91);

    const playerBottom = groundY - game.playerY - 4;

    let left;
    let right;
    let top;
    let bottom;


    if (
        object.type === "coin" ||
        object.type === "treasure" ||
        object.type === "sock"
    ) {
        let radius = 13;

        if (object.type === "treasure") radius = 36;
        if (object.type === "sock") radius = 17;

        left = object.x - radius;
        right = object.x + radius;
        top = object.y - radius;
        bottom = object.y + radius;
    } else {
        left = object.x;

        if (object.type === "big") {
            right = object.x + 58;
            top = groundY - 70;
        } else if (object.type === "low") {
            right = object.x + 48;
            top = groundY - 28;
        } else {
            right = object.x + 44;
            top = groundY - 40;
        }

        bottom = groundY + 15;
    }


    return (
        playerRight > left &&
        playerLeft < right &&
        playerBottom > top &&
        playerTop < bottom
    );
}

function onTreasureCollected() {
    game.treasureFound = true;
    game.coins += 10;

    updateHUD();

    gameRunning = false;
    showModal("modal-event-video");

    treasureVideo.pause();
    treasureVideo.src = "videolar/treasure-24-ayar.mp4";
    treasureVideo.load();
    treasureVideo.currentTime = 0;

    const playResult = treasureVideo.play();

    if (playResult) {
        playResult.catch(function () {
            // Video controls can be used if autoplay is blocked.
        });
    }
}

function onSockCollected() {
    game.sockFound = true;
    gameRunning = false;
    showModal("modal-sock-secret");
}

function playDogVideo() {
    gameRunning = false;
    showModal("modal-dog-video");

    dogVideo.pause();
    dogVideo.src = "videolar/dog-bike.mp4";
    dogVideo.controls = true;
    dogVideo.load();

    const playResult = dogVideo.play();

    if (playResult) {
        playResult.catch(function () {
            // Video controls can be used if autoplay is blocked.
        });
    }
}

function checkDogVideoEvents() {
    if (game.distance >= 180 && !game.dogBikeShown) {
        game.dogBikeShown = true;
        playDogVideo();
    }
}

function onCrash(object) {
    if (performance.now() < game.invincibleUntil) {
        return;
    }

    object.passed = true;
    game.crashes++;
    game.invincibleUntil = performance.now() + 1500;

    gameRunning = false;
    updateHUD();

    // Add the crash meme to the modal if it is not already there.
    let crashImage = $("crash-meme-image");

    if (!crashImage) {
        crashImage = document.createElement("img");
        crashImage.id = "crash-meme-image";
        crashImage.src = "resimler/crash-meme.png";
        crashImage.alt = "Crash meme";

        const crashModal = $("modal-crash");
        const paragraph = crashModal.querySelector("p");

        const imageContainer = document.createElement("div");
        imageContainer.className = "meme-image-container";
        imageContainer.appendChild(crashImage);

        if (paragraph) {
            paragraph.after(imageContainer);
        } else {
            crashModal.appendChild(imageContainer);
        }
    } else {
        crashImage.src = "resimler/crash-meme.png";
    }

    showModal("modal-crash");
}

function updateObjects() {
    for (let i = 0; i < game.objects.length; i++) {
        const object = game.objects[i];

        object.x -= scooterSpeed;

        if (
            object.type === "coin" ||
            object.type === "treasure" ||
            object.type === "sock"
        ) {
            if (!object.collected && overlapsPlayer(object)) {
                object.collected = true;

                if (object.type === "coin") {
                    game.coins++;
                } else if (object.type === "treasure") {
                    onTreasureCollected();
                    return;
                } else if (object.type === "sock") {
                    onSockCollected();
                    return;
                }
            }
        } else if (!object.passed && overlapsPlayer(object)) {
            if (performance.now() >= game.invincibleUntil) {
                onCrash(object);
                return;
            }
        }
    }

    game.objects = game.objects.filter(function (object) {
        if (
            object.type === "coin" ||
            object.type === "treasure" ||
            object.type === "sock"
        ) {
            return object.x > -60 && !object.collected;
        }

        return object.x > -100 && !object.passed;
    });
}

// --------------------------------------------------
// KEYBOARD AND TOUCH CONTROLS
// --------------------------------------------------

function jump() {
    if (!gameRunning || game.playerY > 0 || game.ducking) {
        return;
    }
    game.jumpVelocity = jumpPower;
}

function startDuck() {
    if (gameRunning && game.playerY === 0) {
        game.ducking = true;
    }
}

function stopDuck() {
    game.ducking = false;
}

document.addEventListener("keydown", function (event) {
    const key = event.key.toLowerCase();

    if (
        key === " " ||
        key === "arrowup" ||
        key === "arrowdown"
    ) {
        event.preventDefault();
    }

    if (
        key === " " ||
        key === "arrowup" ||
        key === "w"
    ) {
        if (!event.repeat) {
            jump();
        }
    }

    if (key === "arrowdown" || key === "s") {
        startDuck();
    }

    if (key === "escape" && gameRunning) {
        pauseGame();
    }
});

document.addEventListener("keyup", function (event) {
    const key = event.key.toLowerCase();

    if (key === "arrowdown" || key === "s") {
        stopDuck();
    }
});

$("touch-jump").addEventListener("pointerdown", function (event) {
    event.preventDefault();
    jump();
});

$("touch-duck").addEventListener("pointerdown", function (event) {
    event.preventDefault();
    startDuck();
});

["pointerup", "pointercancel", "pointerleave"].forEach(function (eventName) {
    $("touch-duck").addEventListener(eventName, stopDuck);
});

// --------------------------------------------------
// HUD AND MAIN GAME LOOP
// --------------------------------------------------

function updateHUD() {
    const progress = Math.min(
        game.distance / finishDistance * 100,
        100
    );

    $("route-progress-bar").style.width = progress + "%";
}

function gameLoop(time) {
    if (!gameRunning) {
        return;
    }

    if (!lastTime) {
        lastTime = time;
    }

    const delta = Math.min((time - lastTime) / 16.67, 2);
    lastTime = time;

    game.frame++;
    game.distance += 0.16 * delta;

    if (game.distance > finishDistance) {
        game.distance = finishDistance;
    }

    if (game.frame >= nextSpawn) {
        spawnObjects();
        nextSpawn = game.frame + 95 + Math.floor(Math.random() * 45);
    }

    // Jump movement.
    if (game.playerY > 0 || game.jumpVelocity > 0) {
        game.playerY += game.jumpVelocity * delta;
        game.jumpVelocity -= 0.8 * delta;

        if (game.playerY <= 0) {
            game.playerY = 0;
            game.jumpVelocity = 0;
        }
    }

    updateObjects();

    if (gameRunning) {
        checkDogVideoEvents();
    }

    drawGame();
    updateHUD();

    if (!gameRunning) {
        return;
    }

    if (game.distance >= finishDistance) {
        finishGame();
        return;
    }

    animationId = requestAnimationFrame(gameLoop);
}

// --------------------------------------------------
// PAUSE
// --------------------------------------------------

function pauseGame() {
    if (!gameRunning) {
        return;
    }

    gameRunning = false;
    gamePaused = true;

    showModal("modal-pause");
}

$("btn-pause-toggle").addEventListener("click", pauseGame);

$("btn-resume-game").addEventListener("click", function () {
    hideModal("modal-pause");

    gamePaused = false;
    gameRunning = true;
    lastTime = 0;

    animationId = requestAnimationFrame(gameLoop);
});

$("btn-pause-quit").addEventListener("click", function () {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    hideModal("modal-pause");
    showScreen(screens.home);
});

// --------------------------------------------------
// CRASH RECOVERY
// --------------------------------------------------

$("btn-continue-crash").addEventListener("click", function () {
    hideModal("modal-crash");

    gameRunning = true;
    lastTime = 0;

    animationId = requestAnimationFrame(gameLoop);
});

$("btn-crash-quit").addEventListener("click", function () {
    gameRunning = false;
    cancelAnimationFrame(animationId);

    hideModal("modal-crash");
    showScreen(screens.home);
});

// --------------------------------------------------
// TREASURE VIDEO
// --------------------------------------------------

function closeTreasureVideo() {
    treasureVideo.pause();
    hideModal("modal-event-video");

    if (game.distance >= finishDistance) {
        finishGame();
        return;
    }

    gameRunning = true;
    lastTime = 0;

    animationId = requestAnimationFrame(gameLoop);
}

$("btn-skip-event-video").addEventListener(
    "click",
    closeTreasureVideo
);


treasureVideo.addEventListener("ended", closeTreasureVideo);

// --------------------------------------------------
// SOCK MEME
// --------------------------------------------------

$("btn-confirm-sock").addEventListener("click", function () {
    hideModal("modal-sock-secret");

    gameRunning = true;
    lastTime = 0;

    animationId = requestAnimationFrame(gameLoop);
});

// --------------------------------------------------
// DOG VIDEO
// --------------------------------------------------

function closeDogVideo() {
    dogVideo.pause();
    hideModal("modal-dog-video");

    if (game.distance >= finishDistance) {
        finishGame();
        return;
    }

    gameRunning = true;
    lastTime = 0;

    animationId = requestAnimationFrame(gameLoop);
}

$("btn-close-dog-video").addEventListener("click", closeDogVideo);
dogVideo.addEventListener("ended", closeDogVideo);

dogVideo.addEventListener("error", function () {
    if (!$("modal-dog-video").classList.contains("hidden")) {
        closeDogVideo();
    }
});

// --------------------------------------------------
// ENDING
// --------------------------------------------------

function finishGame() {
    gameRunning = false;
    gamePaused = false;

    cancelAnimationFrame(animationId);
    showScreen(screens.ending);

    $("ending-wait-card").classList.remove("hidden");
    $("ending-video-card").classList.add("hidden");
    $("ending-victory-card").classList.add("hidden");

    finalVideo.pause();
    finalVideo.controls = true;
    finalVideo.currentTime = 0;

    setTimeout(function () {
        $("ending-wait-card").classList.add("hidden");
        $("ending-video-card").classList.remove("hidden");

        finalVideo.load();

        const playResult = finalVideo.play();

        if (playResult) {
            playResult.catch(function () {
                finalVideo.controls = true;
            });
        }
    }, 500);
}

function showVictory() {
    finalVideo.pause();

    $("ending-wait-card").classList.add("hidden");
    $("ending-video-card").classList.add("hidden");
    $("ending-victory-card").classList.remove("hidden");
}

finalVideo.addEventListener("ended", showVictory);

finalVideo.addEventListener("error", function () {
    if (!screens.ending.classList.contains("hidden")) {
        showVictory();
    }
});

$("btn-skip-final-video").addEventListener("click", showVictory);

// Play again.
$("btn-play-again").addEventListener("click", function () {
    finalVideo.pause();
    finalVideo.currentTime = 0;

    startIntro();
});

// Return to home.
$("btn-main-menu").addEventListener("click", function () {
    gameRunning = false;
    gamePaused = false;

    cancelAnimationFrame(animationId);

    introVideo.pause();
    treasureVideo.pause();
    finalVideo.pause();
    dogVideo.pause();

    hideModal("modal-default-meme");
    hideModal("modal-pause");
    hideModal("modal-crash");
    hideModal("modal-event-video");
    hideModal("modal-sock-secret");
    hideModal("modal-dog-video");

    showScreen(screens.home);
    drawHomePreview();
});

// --------------------------------------------------
// INITIAL SETUP
// --------------------------------------------------

updateCharacterButtons();
drawHomePreview();
