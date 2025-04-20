const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const backgroundMusic = document.getElementById('backgroundMusic');
const handRaiseSound = document.getElementById('handRaiseSound');
const startButton = document.getElementById('startButton');
const replayButton = document.getElementById('replayButton');
const loadingMessage = document.getElementById('loadingMessage');
const endMessage = document.getElementById('endMessage');
const leaderboard = document.getElementById('leaderboard');
const infoBox = document.getElementById('infoBox');

const saarnaImage = new Image();
saarnaImage.src = 'kirkko.png'; // Korvaa oikealla polulla saarnatuoli-kuvaan

const characters = [];
const gameDuration = 120; // 2 minuuttia
let lastFrameTime = 0;
let gameStartTime = null;

class Character {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.handRaised = false;
        this.raiseHandTime = this.getRandomHandRaiseTime();
        this.handRaisedDuration = 0;
    }

    getRandomHandRaiseTime() {
        return Math.random() * 13000 + 2000; // 2-15 sekuntia
    }

    getRandomPosition() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height
        };
    }

    update(deltaTime) {
        if (this.handRaised) {
            this.handRaisedDuration += deltaTime;
            if (this.handRaisedDuration >= this.raiseHandTime) {
                this.handRaised = false;
                this.handRaisedDuration = 0;
                const newPosition = this.getRandomPosition();
                this.x = newPosition.x;
                this.y = newPosition.y;
            }
        } else {
            this.raiseHandTime -= deltaTime;
            if (this.raiseHandTime <= 0) {
                this.handRaised = true;
                this.raiseHandTime = this.getRandomHandRaiseTime();
            }
        }
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 20, 0, Math.PI * 2);
        ctx.fillStyle = this.handRaised ? 'red' : 'blue';
        ctx.fill();
        ctx.closePath();
    }

    isClicked(mouseX, mouseY) {
        const distance = Math.sqrt((mouseX - this.x) ** 2 + (mouseY - this.y) ** 2);
        return distance < 20;
    }
}

function initGame() {
    characters.length = 0;
    for (let i = 0; i < 5; i++) {
        const position = new Character(Math.random() * canvas.width, Math.random() * canvas.height);
        characters.push(position);
    }
    gameStartTime = performance.now();
    lastFrameTime = gameStartTime;
    backgroundMusic.play().catch(error => {
        console.error('Taustamusiikin toisto epäonnistui:', error);
    });
    requestAnimationFrame(gameLoop);
}

function gameLoop(timestamp) {
    if (!gameStartTime) {
        gameStartTime = timestamp;
    }
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    const elapsedTime = timestamp - gameStartTime;
    if (elapsedTime >= gameDuration * 1000) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
        endMessage.style.display = 'block';
        replayButton.style.display = 'block'; // Näytä "Pidä toinen puhe" nappi
        saveLeaderboard(elapsedTime); // Tallenna tulos
        displayLeaderboard(); // Näytä tuloslista
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(saarnaImage, 0, 0, canvas.width, canvas.height);

    characters.forEach(character => {
        character.update(deltaTime);
        character.draw();
    });

    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    characters.forEach(character => {
        if (character.isClicked(mouseX, mouseY) && character.handRaised) {
            handRaiseSound.play().then(() => {
                console.log('Ääni toistettu onnistuneesti.');
            }).catch(error => {
                console.error('Äänen toisto epäonnistui:', error);
            });
            const newPosition = character.getRandomPosition();
            character.x = newPosition.x;
            character.y = newPosition.y;
            character.handRaised = false;
            character.handRaisedDuration = 0;
        }
    });
});

function saveLeaderboard(score) {
    let leaderboardData = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboardData.push({ score: score });
    leaderboardData.sort((a, b) => b.score - a.score);
    leaderboardData = leaderboardData.slice(0, 10); // Tallennetaan vain 10 parasta
    localStorage.setItem('leaderboard', JSON.stringify(leaderboardData));
}

function displayLeaderboard() {
    const leaderboardData = JSON.parse(localStorage.getItem('leaderboard')) || [];
    leaderboard.innerHTML = '<h3>Parannuksen armon tehneitä:</h3>';
    leaderboardData.forEach((entry, index) => {
        const div = document.createElement('div');
        div.textContent = `${index + 1}. ${entry.score}`;
        leaderboard.appendChild(div);
    });
    leaderboard.style.display = 'block';
}

startButton.addEventListener('click', () => {
    backgroundMusic.muted = false;
    startButton.style.display = 'none'; // Piilota nappi pelin alkaessa
    endMessage.style.display = 'none'; // Piilota lopputuloksen viesti
    replayButton.style.display = 'none'; // Piilota "Pelaa uudelleen" nappi
    leaderboard.style.display = 'none'; // Piilota tuloslista
    initGame();
});

replayButton.addEventListener('click', () => {
    endMessage.style.display = 'none'; // Piilota lopputuloksen viesti
    replayButton.style.display = 'none'; // Piilota "Pelaa uudelleen" nappi
    leaderboard.style.display = 'none'; // Piilota tuloslista
    initGame(); // Käynnistä peli uudestaan
});

saarnaImage.onload = () => {
    loadingMessage.style.display = 'none';
    startButton.style.display = 'block'; // Näytä nappi, kun kuva on ladattu
};

saarnaImage.onerror = () => {
    loadingMessage.textContent = 'Kuvaa ei voitu ladata.';
};

backgroundMusic.onerror = () => {
    loadingMessage.textContent = 'Taustamusiikkia ei voitu ladata.';
};

handRaiseSound.onerror = () => {
    loadingMessage.textContent = 'Ääniefektiä ei voitu ladata.';
};

handRaiseSound.addEventListener('canplaythrough', () => {
    console.log('Äänitiedosto on ladattu ja valmis toistoon.');
});
