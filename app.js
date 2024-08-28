
Array.prototype.last = function () {
  return this[this.length - 1];
};

// A sinus function that acceps degrees instead of radians
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game data
let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];
let trees = [];


let score = 0;



// Configuration
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 10; // While waiting
const paddingX = 100; // The waiting position of the hero in from the original canvas size
const perfectAreaSize = 10;

// The background moves slower than the hero
const backgroundSpeedMultiplier = 0.2;

const hill1BaseHeight = 100;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;

const stretchingSpeed = 5; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17; // 24
const heroHeight = 30; // 40

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");
const scoreWhenFinish = document.getElementById("scoreProgress");
const changeLanguage = document.getElementById('openModalBtn');
const comboElement = document.getElementById('combo');
const checkbox = document.getElementById('rect3');
const textSound = document.getElementById('text-sound');
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let currentSource = null;
let mainMusicSource = null; // Источник для основной музыки

let randomSoundSource = null;

async function loadAudio(url) {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}

// Сохраняем загруженные звуки
const sounds = {};
const failedSounds = {};


// Загружаем основные и дополнительные звуки
async function loadSounds() {
  sounds.mainSound = await loadAudio('assets/main.mp3');
  sounds.wow = await Promise.all([
    loadAudio('assets/wow.mp3'),
    loadAudio('assets/wow2.mp3'),
    loadAudio('assets/wow3.mp3'),
    loadAudio('assets/wow4.mp3'),
  ]);
  sounds.fail = await Promise.all([
    loadAudio('assets/fail.mp3'),
    loadAudio('assets/fail2.mp3'),
    loadAudio('assets/fail3.mp3'),
    loadAudio('assets/fail4.mp3'),
  ]);
}

loadSounds();

// Воспроизведение звука
function playSound(buffer) {

  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
  return source;
}

// Функция для воспроизведения музыки
function playMusic() {
  if (sounds.mainSound) {
    mainMusicSource = playSound(sounds.mainSound);
  }
}

// Функция для паузы музыки
function pauseMusic() {
  if (mainMusicSource) {
    mainMusicSource.stop(); // Останавливаем текущий источник
    mainMusicSource = null; // Сбрасываем источник
  }
}


changeLanguage.addEventListener('click', () => {
    pauseMusic();
  });



let selectedLanguage = 'ru'; // По умолчанию русский


checkbox.addEventListener('change', function() {
  if (checkbox.checked) {
    playMusic();
    if(selectedLanguage === 'ru'){
      textSound.innerText = "Музыка: включено"
    }
    if(selectedLanguage === 'en'){
      textSound.innerText = "Sound: On"
    }
    if(selectedLanguage === 'tr'){
      textSound.innerText = "Ses: açık"
    }
  } else {
    pauseMusic();
    if(selectedLanguage === 'ru'){
      textSound.innerText = "Музыка: выключено"
    }
    if(selectedLanguage === 'en'){
      textSound.innerText = "Music: Off"
    }
    if(selectedLanguage === 'tr'){
      textSound.innerText = "Müzik: kapalı"
    }
  }
});


// Функция для обновления фраз
function updatePhrases() {
  const phrases = phrasesByLanguage[selectedLanguage];
  if (currentPhraseIndex < phrases.length) {
    perfectElement.innerText = phrases[currentPhraseIndex];
    currentPhraseIndex++;
  } else {
    currentPhraseIndex = 0;
    perfectElement.innerText = phrases[currentPhraseIndex];
  }
}

// Получаем кнопки с флагами
const russianFlagButton = document.getElementById('russian-flag');
const americanFlagButton = document.getElementById('american-flag');
const turkishFlagButton = document.getElementById('turkish-flag');

function updateRestartButtonText() {
  const score = localStorage.getItem('score'); // Получаем счет из localStorage
  
  if (selectedLanguage === 'ru') {
    restartButton.querySelector('b').innerHTML = `Все еще впереди! <br/>Количество пройденных столбов: ${score}`;
    restartButton.querySelector('i').innerText = 'Нажмите на квадрат, чтобы продолжить!';
    if(selectedLanguage === 'ru' && checkbox.checked){
      textSound.innerText = "Музыка: включено"
    }else {
      textSound.innerText = "Музыка: выключено"
    }
  } else if (selectedLanguage === 'en') {
    restartButton.querySelector('b').innerHTML = `Still Ahead! <br/>Pillars Passed: ${score}`;
    restartButton.querySelector('i').innerText = 'Click the square to continue!';
    if(selectedLanguage === 'en' && checkbox.checked){
      textSound.innerText = "Music: On"
    }else {
      textSound.innerText = "Music: Off"
    }
  } else if (selectedLanguage === 'tr') {
    restartButton.querySelector('b').innerHTML = `Hala Önümüzde! <br/>Sütunlar Geçildi: ${score}`;
    restartButton.querySelector('i').innerText = 'Devam etmek için kareye tıklayın!';
    if(selectedLanguage === 'tr' && checkbox.checked){
      textSound.innerText = "Müzik: açık"
    }else {
      textSound.innerText = "Müzik: kapalı"
    }
  }
}

russianFlagButton.addEventListener('click', () => {
//После старта игры
  introductionElement.firstChild.nodeValue = 'Тебе направо! Кликни и держи';
  changeLanguage.firstChild.nodeValue = 'Изменить язык';


  selectedLanguage = 'ru';
  updatePhrases();
  updateRestartButtonText();
});

americanFlagButton.addEventListener('click', () => {
//after start
  introductionElement.firstChild.nodeValue = 'You go right! Click and hold';
  changeLanguage.firstChild.nodeValue = 'Change the language';

  selectedLanguage = 'en';
  updatePhrases();
  updateRestartButtonText();
});

turkishFlagButton.addEventListener('click', () => {
  // titleTask.firstChild.nodeValue = 'Göreviniz mümkün olduğunca çok sayıda engeli aşmak!';
  // type2Description.firstChild.nodeValue = 'Asla pes etme!';
  // type3Description.firstChild.nodeValue = 'Her zorluğun üstesinden gel!';
  // afterClickDescription.firstChild.nodeValue = '"İleri" butonuna tıkladıktan sonra ninjanız yolculuğuna başlayacak!';
  // forwardButton.firstChild.nodeValue = 'İleri';

  introductionElement.firstChild.nodeValue = 'Sen sağa git! Tıkla ve tut';
  changeLanguage.firstChild.nodeValue = 'Dili değiştir'; 


  selectedLanguage = 'tr';
  updatePhrases();
  updateRestartButtonText();
});

function playRandomSound() {
  const randomSound = sounds.wow[Math.floor(Math.random() * sounds.wow.length)];
  playSound(randomSound);
}

function playRandomFailsSounds(){
  const randomFailSound = sounds.fail[Math.floor(Math.random() * sounds.fail.length)];
  playSound(randomFailSound);
}


let pausedSounds = new Set();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    audioContext.suspend();
  } else {
    audioContext.resume();
  }
});

// Initialize layout
resetGame();

// Resets game variables and layouts but does not start the game (game starts on keypress)
function resetGame() {
  // Reset game progress
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;


  const yandexStart = async () => {
    const ysdk = await YaGames.init();
    ysdk.features.GameplayAPI?.start()
  }

  yandexStart()


  introductionElement.style.opacity = 1;
  perfectElement.style.display = "none";
  restartButton.style.display = "none";
  scoreElement.innerText = score;
  scoreWhenFinish.innerText = score;

localStorage.setItem('score', 0)

  platforms = [{ x: 50, w: 50 }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  trees = [];
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  draw();
}

function generateTree() {
  const minimumGap = 30;
  const maximumGap = 150;

  // X coordinate of the right edge of the furthest tree
  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));

  const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
  const color = treeColors[Math.floor(Math.random() * 3)];

  trees.push({ x, color });
}

function generatePlatform() {
  const minimumGap = 40;
  const maximumGap = 200;
  const minimumWidth = 20;
  const maximumWidth = 100;

  // X coordinate of the right edge of the furthest platform
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
}

resetGame();

// If space was pressed restart the game
window.addEventListener("keydown", function (event) {
  if (event.key == " ") {
    event.preventDefault();
    resetGame();
    return;
  }
});

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

document.addEventListener("contextmenu", function (e) {
  e.preventDefault();
});


// Обработчик для десктопных устройств
if (!isTouchDevice) {
  window.addEventListener("mousedown", function (event) {
    if (event.target === canvas) {
      if (phase === "waiting") {
        lastTimestamp = undefined;
        introductionElement.style.opacity = 0;
        phase = "stretching";
        window.requestAnimationFrame(animate);
      }
    }
  });
  window.addEventListener("mouseup", function (event) {
    if (phase === "stretching") {
      phase = "turning";
    }
  });
}

if (isTouchDevice) {
  window.addEventListener("touchstart", function (event) {
    if (event.target === canvas) {
      if (phase === "waiting") {
        lastTimestamp = undefined;
        introductionElement.style.opacity = 0;
        phase = "stretching";
        window.requestAnimationFrame(animate);
      }
    }
  });

  window.addEventListener("touchend", function (event) {
    if (phase === "stretching") {
      phase = "turning";
    }
  });
}

document.body.style.userSelect = 'none';
document.body.style.webkitTouchCallout = 'none';

document.addEventListener('touchstart', function (event) {
  if (event.target.tagName === 'CANVAS') {
    event.preventDefault();
  }
}, { passive: false });

document.addEventListener('touchmove', function (event) {
  if (event.target.tagName === 'CANVAS') {
    event.preventDefault();
  }
}, { passive: false });

document.addEventListener('contextmenu', function (event) {
  event.preventDefault();
});



window.addEventListener("resize", function (event) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

window.requestAnimationFrame(animate);


const phrasesByLanguage = {
  ru: [
    "Иди до конца!",
    "Ох уж эти столбики!",
    "Что ж ты, фраер! Газуй давай!",
    "Ты уже слишком далеко зашел",
    "Бодро вперёд! Ты это можешь!",
    "Брось вызов гравитации! Не вздумай падать!",
    "Не сдавайся! Твой путь только начался!",
  ],
  en: [
    "Go all the way!",
    "Oh, these pillars!",
    "Come on, buddy! Step on it!",
    "You have come too far already",
    "Keep going strong! You can do it!",
    "Defy gravity! Don't you dare fall!",
    "Don't give up! Your journey has just begun!",
  ],
  tr: [
    "Sona kadar git!",
    "Oh, bu direkler!",
    "Hadi bakalım! Bas gaza!",
    "Çok uzaklaştın",
    "Devam et! Yapabilirsin!",
    "Yerçekimine meydan oku! Düşme!",
    "Pes etme! Yolun daha başındasın!",
  ]
};
let currentPhraseIndex = 0;

// The main game loop
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  switch (phase) {
    case "waiting":
      return; // Stop the loop
    case "stretching": {
      sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
      break;
    }
    case "turning": {
      sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;

        if (phase === "turning") {
          updatePhrases();
  }

        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          // Increase score
          score += perfectHit ? 2 : 1;
          scoreElement.innerText = score;
          scoreWhenFinish.innerText = score;

          localStorage.setItem('score', score)
            perfectElement.style.display = "block";
            setTimeout(() => (perfectElement.style.display = "block"), 1000);
          if (perfectHit) {
            comboElement.style.display = "block";
            perfectElement.style.display  = "block";
            setTimeout(() => (perfectElement.style.display = "block"), 1000);
          } else  {
            comboElement.style.display = "none";
          }

          generatePlatform();
          generateTree();
          generateTree();
        }

        phase = "walking";
      }
      break;
    }
    case "walking": {
      heroX += (timestamp - lastTimestamp) / walkingSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "transitioning";
          playRandomSound();
        }
      } else {
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;
    }
    case "transitioning": {
      sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        // Add the next step
        sticks.push({
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0
        });
        phase = "waiting";
      }
      break;
    }
    case "falling": {
      if (sticks.last().rotation < 180) 
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      heroY += (timestamp - lastTimestamp) / fallingSpeed;
      const maxHeroY = platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;

      if (heroY > maxHeroY) {
        playRandomFailsSounds();
        restartButton.style.display = "block";
        updateRestartButtonText(); 
        return;
      }
      restartButton.style.display = "block";

      const yandexStop = async () => {
        const ysdk = await YaGames.init();
        ysdk.features.GameplayAPI?.stop()
      }
      yandexStop();
      break;
    }
    default:
      throw Error("Wrong phase");
  }

  draw();
  window.requestAnimationFrame(animate);

  lastTimestamp = timestamp;
}

// Returns the platform the stick hit (if it didn't hit any stick then return undefined)
function thePlatformTheStickHits() {
  if (sticks.last().rotation !== 90)
    throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  // If the stick hits the perfect area
  if (
    platformTheStickHits &&
    platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
      stickFarX &&
    stickFarX <
      platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
  )
    return [platformTheStickHits, true];

  return [platformTheStickHits, false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  drawBackground();

  // Center main canvas area to the middle of the screen
  ctx.translate(
    (window.innerWidth - canvasWidth) / 2 - sceneOffset,
    (window.innerHeight - canvasHeight) / 2
  );

  // Draw scene
  drawPlatforms();
  drawHero();
  drawSticks();

  // Restore transformation
  ctx.restore();
}

restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    // Draw platform
    ctx.fillStyle = "#db9065";
ctx.beginPath();
ctx.moveTo(150, 50);
// ctx.lineTo(100, 75);
// ctx.lineTo(100, 25);
ctx.fill();


// Устанавливаем стиль линии (можете настроить под себя)
ctx.strokeStyle = '#000'; // цвет черный
ctx.lineWidth = 2; // ширина линии 2 пикселя

// Рисуем все линии на Canvas
ctx.stroke();
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );

    // Draw perfect area only if hero did not yet reach the platform
    if (sticks.last().x < x) {

    ctx.fillStyle = "red"
    
      ctx.fillRect(
        x + w / 2 - perfectAreaSize / 2,
        canvasHeight - platformHeight,
        perfectAreaSize,
        perfectAreaSize
      );
      
    }
  });
}

function getRandomColor() {
  // Генерация случайного цвета в формате RGB
  const r = Math.floor(Math.random() * 256); // Красный
  const g = Math.floor(Math.random() * 256); // Зеленый
  const b = Math.floor(Math.random() * 256); // Синий
  return `black`;
}


function drawHero() {
  ctx.save();
  ctx.fillStyle = getRandomColor();
  ctx.translate(
    heroX - heroWidth / 2,
    heroY + canvasHeight - platformHeight - heroHeight / 2
  );

  // Body
  drawRoundedRect(
    -heroWidth / 2,
    -heroHeight / 2,
    heroWidth,
    heroHeight - 4,
    5
  );

  // Legs
  const legDistance = 5;
  ctx.beginPath();
  ctx.arc(legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-legDistance, 11.5, 3, 0, Math.PI * 2, false);
  ctx.fill();

  // Eye
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.arc(5, -7, 3, 0, Math.PI * 2, false);
  ctx.fill();

  // Band
  ctx.fillStyle = "red";
  ctx.fillRect(-heroWidth / 2 - 1, -12, heroWidth + 2, 4.5);
  ctx.beginPath();
  ctx.moveTo(-9, -14.5);
  ctx.lineTo(-17, -18.5);
  ctx.lineTo(-14, -8.5);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-10, -10.5);
  ctx.lineTo(-15, -3.5);
  ctx.lineTo(-5, -7);
  ctx.fill();

  ctx.restore();
}

function drawRoundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x, y + radius);
  ctx.lineTo(x, y + height - radius);
  ctx.arcTo(x, y + height, x + radius, y + height, radius);
  ctx.lineTo(x + width - radius, y + height);
  ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
  ctx.lineTo(x + width, y + radius);
  ctx.arcTo(x + width, y, x + width - radius, y, radius);
  ctx.lineTo(x + radius, y);
  ctx.arcTo(x, y, x, y + radius, radius);
  ctx.fill();
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();

    // Move the anchor point to the start of the stick and rotate
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    // Draw stick
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();

    // Restore transformations
    ctx.restore();
  });
}

function drawBackground() {
  // Draw sky
  var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#87ceeb");
  gradient.addColorStop(1, "#FEF1E1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Draw hills
  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

  // Draw trees
  trees.forEach((tree) => drawTree(tree.x, tree.color));
}

// A hill is a shape under a stretched out sinus wave
function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
  for (let i = 0; i < window.innerWidth; i++) {
    ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
  }
  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTree(x, color) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
    getTreeY(x, hill1BaseHeight, hill1Amplitude)
  );

  const treeTrunkHeight = 5;
  const treeTrunkWidth = 2;
  const treeCrownHeight = 25;
  const treeCrownWidth = 10;

  // Draw trunk
  ctx.fillStyle = "#7D833C";
  ctx.fillRect(
    -treeTrunkWidth / 2,
    -treeTrunkHeight,
    treeTrunkWidth,
    treeTrunkHeight
  );

  // Draw crown
  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
      amplitude +
    sineBaseY
  );
}

function getTreeY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}


