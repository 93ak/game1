let playerName = null;

const BACKEND_URL = "https://game1-3i6i.onrender.com";

// --- check if name exists on server ---
async function isNameTaken(name) {
  const res = await fetch(`${BACKEND_URL}/api/check-name?name=${encodeURIComponent(name)}`);
  const data = await res.json();
  return data.taken;
}
// --- submit score to server ---
async function submitScore(name, score) {
  await fetch(`${BACKEND_URL}/api/submit-score`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, score }),
  });
}

// --- get top 10 leaderboard from server ---
async function getLeaderboard() {
  const res = await fetch(`${BACKEND_URL}/api/leaderboard`);
  return await res.json();
}

// --- DOM references ---
const nameScreen = document.getElementById("nameScreen");
const canvas = document.getElementById("myCanvas");
const leaderboardDiv = document.getElementById("leaderboard");
const startBtn = document.getElementById("startGameBtn");
const nameInput = document.getElementById("playerName");
const nameError = document.getElementById("nameError");
const scoresList = document.getElementById("scoresList");
const personalBestDiv = document.getElementById("personalBest");

// --- start game button ---
startBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  if (!name) {
    nameError.textContent = "Please enter a name.";
    nameError.style.display = "block";
    return;
  }

  const taken = await isNameTaken(name);
  if (taken) {
    nameError.textContent = "Name already taken. Try another.";
    nameError.style.display = "block";
    return;
  }

  playerName = name;
  nameError.style.display = "none";
  nameScreen.style.display = "none";
  canvas.style.display = "block";

  startGame();
});

// --- show leaderboard after death ---
async function showLeaderboard(finalScore) {
  if (!playerName) return;

  await submitScore(playerName, finalScore);
  const leaderboard = await getLeaderboard();

  leaderboardDiv.style.display = "block";
  scoresList.innerHTML = "";

  leaderboard.forEach((entry, index) => {
    const li = document.createElement("li");
    li.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
    if (entry.name === playerName && entry.score === finalScore) {
      li.style.fontWeight = "bold";
      li.style.color = "blue";
    }
    scoresList.appendChild(li);
  });

  const myScore = leaderboard.find((e) => e.name === playerName);
  if (myScore) {
    personalBestDiv.textContent = `⭐ ${myScore.name}: ${myScore.score}`;
  }
}

function startGame() {
  console.log("Starting game for:", playerName);

  const myCanvas = document.getElementById("myCanvas");
  const ctx = myCanvas.getContext("2d");

  const FPS = 40;
  const jump_amount = -10;
  const max_fall_speed = +10;
  const acceleration = 1;
  const pipe_speed = -2;

  let game_mode = "prestart";
  let time_game_last_running;
  let bottom_bar_offset = 0;
  let pipes = [];

  function MySprite(img_url) {
    this.x = 0;
    this.y = 0;
    this.visible = true;
    this.velocity_x = 0;
    this.velocity_y = 0;
    this.MyImg = new Image();
    this.MyImg.src = img_url || "";
    this.angle = 0;
    this.flipV = false;
    this.flipH = false;
  }
  MySprite.prototype.Do_Frame_Things = function () {
    ctx.save();
    ctx.translate(this.x + this.MyImg.width / 2, this.y + this.MyImg.height / 2);
    ctx.rotate((this.angle * Math.PI) / 180);
    if (this.flipV) ctx.scale(1, -1);
    if (this.flipH) ctx.scale(-1, 1);
    if (this.visible) {
      ctx.drawImage(this.MyImg, -this.MyImg.width / 2, -this.MyImg.height / 2);
    }
    this.x = this.x + this.velocity_x;
    this.y = this.y + this.velocity_y;
    ctx.restore();
  };

  function ImagesTouching(thing1, thing2) {
    if (!thing1.visible || !thing2.visible) return false;
    if (
      thing1.x >= thing2.x + thing2.MyImg.width ||
      thing1.x + thing1.MyImg.width <= thing2.x
    )
      return false;
    if (
      thing1.y >= thing2.y + thing2.MyImg.height ||
      thing1.y + thing1.MyImg.height <= thing2.y
    )
      return false;
    return true;
  }

  function Got_Player_Input(MyEvent) {
    switch (game_mode) {
      case "prestart": {
        game_mode = "running";
        break;
      }
      case "running": {
        bird.velocity_y = jump_amount;
        break;
      }
      case "over":
        if (new Date() - time_game_last_running > 1000) {
          reset_game();
          game_mode = "running";
          break;
        }
    }
    MyEvent.preventDefault();
  }
  addEventListener("touchstart", Got_Player_Input);
  addEventListener("mousedown", Got_Player_Input);
  addEventListener("keydown", Got_Player_Input);

  function make_bird_slow_and_fall() {
    if (bird.velocity_y < max_fall_speed) {
      bird.velocity_y = bird.velocity_y + acceleration;
    }
    if (bird.y > myCanvas.height - bird.MyImg.height) {
      bird.velocity_y = 0;
      game_mode = "over";
    }
    if (bird.y < 0 - bird.MyImg.height) {
      bird.velocity_y = 0;
      game_mode = "over";
    }
  }

  function add_pipe(x_pos, top_of_gap, gap_width) {
    const top_pipe = new MySprite();
    top_pipe.MyImg = pipe_piece;
    top_pipe.x = x_pos;
    top_pipe.y = top_of_gap - pipe_piece.height;
    top_pipe.velocity_x = pipe_speed;
    pipes.push(top_pipe);

    const bottom_pipe = new MySprite();
    bottom_pipe.MyImg = pipe_piece;
    bottom_pipe.flipV = true;
    bottom_pipe.x = x_pos;
    bottom_pipe.y = top_of_gap + gap_width;
    bottom_pipe.velocity_x = pipe_speed;
    pipes.push(bottom_pipe);
  }

  function make_bird_tilt_appropriately() {
    if (bird.velocity_y < 0) {
      bird.angle = -15;
    } else if (bird.angle < 70) {
      bird.angle = bird.angle + 4;
    }
  }

  function show_the_pipes() {
    for (let i = 0; i < pipes.length; i++) {
      pipes[i].Do_Frame_Things();
    }
  }

  function check_for_end_game() {
    for (let i = 0; i < pipes.length; i++) {
      if (ImagesTouching(bird, pipes[i])) game_mode = "over";
    }
  }

  function display_intro_instructions() {
    ctx.font = "25px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText(
      "Press, touch or click to start",
      myCanvas.width / 2,
      myCanvas.height / 4
    );
  }

  function display_game_over() {
    let score = 0;
    for (let i = 0; i < pipes.length; i++)
      if (pipes[i].x < bird.x) score = score + 0.5;

    ctx.font = "30px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", myCanvas.width / 2, 100);
    ctx.fillText("Score: " + score, myCanvas.width / 2, 150);

    ctx.font = "20px Arial";
    ctx.fillText(
      "Click, touch, or press to play again",
      myCanvas.width / 2,
      300
    );

    // also show player name
    ctx.font = "18px Arial";
    ctx.fillStyle = "black";
    ctx.fillText(`Player: ${playerName}`, myCanvas.width / 2, 350);

    // 🎯 Show leaderboard after death
    showLeaderboard(score);
  }

  function display_bar_running_along_bottom() {
    if (bottom_bar_offset < -23) bottom_bar_offset = 0;
    ctx.drawImage(
      bottom_bar,
      bottom_bar_offset,
      myCanvas.height - bottom_bar.height
    );
  }

  function reset_game() {
    bird.y = myCanvas.height / 2;
    bird.angle = 0;
    pipes = []; // erase all pipes
    add_all_my_pipes();
  }

  function add_all_my_pipes() {
    add_pipe(500, 100, 140);
    add_pipe(800, 50, 140);
    add_pipe(1000, 250, 140);
    add_pipe(1200, 150, 120);
    add_pipe(1600, 100, 120);
    add_pipe(1800, 150, 120);
    add_pipe(2000, 200, 120);
    add_pipe(2200, 250, 120);
    add_pipe(2400, 30, 100);
    add_pipe(2700, 300, 100);
    add_pipe(3000, 100, 80);
    add_pipe(3300, 250, 80);
    add_pipe(3600, 50, 60);
    const finish_line = new MySprite("http://s2js.com/img/etc/flappyend.png");
    finish_line.x = 3900;
    finish_line.velocity_x = pipe_speed;
    pipes.push(finish_line);
  }

  const pipe_piece = new Image();
  pipe_piece.onload = add_all_my_pipes;
  pipe_piece.src = "http://s2js.com/img/etc/flappypipe.png";

  function Do_a_Frame() {
    ctx.clearRect(0, 0, myCanvas.width, myCanvas.height);
    bird.Do_Frame_Things();
    display_bar_running_along_bottom();

    switch (game_mode) {
      case "prestart": {
        display_intro_instructions();
        break;
      }
      case "running": {
        time_game_last_running = new Date();
        bottom_bar_offset = bottom_bar_offset + pipe_speed;
        show_the_pipes();
        make_bird_tilt_appropriately();
        make_bird_slow_and_fall();
        check_for_end_game();

        // show player name live
        ctx.font = "18px Arial";
        ctx.fillStyle = "black";
        ctx.fillText(`Player: ${playerName}`, 60, 30);
        break;
      }
      case "over": {
        make_bird_slow_and_fall();
        display_game_over();
        break;
      }
    }
  }

  const bottom_bar = new Image();
  bottom_bar.src = "http://s2js.com/img/etc/flappybottom.png";

  const bird = new MySprite("http://s2js.com/img/etc/flappybird.png");
  bird.x = myCanvas.width / 3;
  bird.y = myCanvas.height / 2;

  setInterval(Do_a_Frame, 1000 / FPS);
}

// 🎯 Leaderboard function (currently local mock, later backend)
async function showLeaderboard(finalScore) {
  const leaderboardDiv = document.getElementById("leaderboard");
  leaderboardDiv.style.display = "block";

  try {
    // Send player's score to server
    await fetch(`${BACKEND_URL}/api/submit-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: playerName, score: finalScore })
    });

    // Fetch top scores
    const res = await fetch(`${BACKEND_URL}/api/leaderboard`);
    const leaderboard = await res.json();

    const scoresList = document.getElementById("scoresList");
    scoresList.innerHTML = "";

    leaderboard.forEach((entry, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${entry.name}: ${entry.score}`;
      if (entry.name === playerName && entry.score === finalScore) {
        li.style.fontWeight = "bold";
        li.style.color = "blue";
      }
      scoresList.appendChild(li);
    });

  } catch (err) {
    console.error("Error loading leaderboard:", err);
  }
}

