let game = {
    board: [10, 5, 5, 5, 5, 5, 10, 5, 5, 5, 5, 5],
    scores: [0, 0],
    turn: 0,
    mode: 'pve',
    isMoving: false,
    selectedCell: null,
    stonePositions: [],
    musicPlaying: false
};

function initStonePositions() {
    game.stonePositions = [];
    for (let i = 0; i < 200; i++) {
        game.stonePositions.push({
            x: Math.floor(Math.random() * 30) - 15,
            y: Math.floor(Math.random() * 30) - 15,
            r: Math.floor(Math.random() * 360)
        });
    }
}

function toggleMusic() {
    const audio = document.getElementById('bg-music');
    const icon = document.getElementById('music-icon');
    
    // Luôn cố định âm lượng 20%
    audio.volume = 0.2;

    if (game.musicPlaying) {
        audio.pause();
        icon.innerText = "🔇";
    } else {
        audio.play().catch(e => console.log("Cần tương tác để phát nhạc"));
        icon.innerText = "🔊";
    }
    game.musicPlaying = !game.musicPlaying;
}

function render() {
    game.board.forEach((count, i) => {
        const cell = document.getElementById(`cell-${i}`);
        const isSelected = (game.selectedCell === i);
        
        cell.innerHTML = `<span class="stone-count">${count}</span><div class="stone-container" id="stones-${i}"></div>`;
        
        if (isSelected) {
            cell.classList.add('selected');
        } else {
            cell.classList.remove('selected');
        }

        const container = document.getElementById(`stones-${i}`);
        const displayCount = Math.min(count, 30); 
        for (let j = 0; j < displayCount; j++) {
            const img = document.createElement('img');
            img.src = "quanco.png";
            img.className = "stone-img";
            const pos = game.stonePositions[j % 200];
            img.style.left = `calc(50% + ${pos.x}px)`;
            img.style.top = `calc(50% + ${pos.y}px)`;
            img.style.transform = `translate(-50%, -50%) rotate(${pos.r}deg)`;
            container.appendChild(img);
        }
    });

    document.getElementById('score1').innerText = game.scores[0];
    document.getElementById('score2').innerText = game.scores[1];
    
    let p2Name = game.mode === 'pve' ? "BOT" : "KHÁCH";
    document.getElementById('status-text').innerText = game.turn === 0 ? "LƯỢT CỦA BẠN" : `LƯỢT CỦA ${p2Name}`;
}

async function checkGameOver() {
    let startIdx = (game.turn === 0) ? 7 : 1;
    let endIdx = (game.turn === 0) ? 11 : 5;
    let hasStones = false;
    for (let i = startIdx; i <= endIdx; i++) { if (game.board[i] > 0) { hasStones = true; break; } }

    if (!hasStones) {
        for (let i = 1; i <= 5; i++) { game.scores[1] += game.board[i]; game.board[i] = 0; }
        for (let i = 7; i <= 11; i++) { game.scores[0] += game.board[i]; game.board[i] = 0; }
        game.scores[1] += game.board[0]; game.board[0] = 0;
        game.scores[0] += game.board[6]; game.board[6] = 0;
        render();

        let winner = "";
        let p2Name = game.mode === 'pve' ? "BOT" : "KHÁCH";
        if (game.scores[0] > game.scores[1]) winner = "BẠN THẮNG";
        else if (game.scores[1] > game.scores[0]) winner = p2Name + " THẮNG";
        else winner = "HÒA NHAU";

        document.getElementById('winner-text').innerHTML = 
            `<span style="color:#fff3a0; font-size:24px;">${winner}</span><br>` +
            `<div style="margin-top:10px; color:#fff;">Điểm Của Bạn: ${game.scores[0]}<br>` +
            `Điểm Của ${p2Name}: ${game.scores[1]}</div>`;
            
        document.getElementById('game-over-overlay').classList.remove('hidden');
        return true;
    }
    return false;
}

function setupCellEvents() {
    document.querySelectorAll('.dan-cell').forEach(cell => {
        const handler = (e) => {
            e.preventDefault();
            if (game.isMoving) return;
            const id = parseInt(cell.id.split('-')[1]);
            const canP1 = (game.turn === 0 && id >= 7 && id <= 11);
            const canP2 = (game.turn === 1 && game.mode === 'pvp' && id >= 1 && id <= 5);

            if ((canP1 || canP2) && game.board[id] > 0) {
                if (game.selectedCell === id) {
                    game.selectedCell = null;
                    cell.classList.remove('selected');
                    document.getElementById('direction-picker').classList.add('hidden');
                } else {
                    document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected'));
                    game.selectedCell = id;
                    cell.classList.add('selected');
                    document.getElementById('direction-picker').classList.remove('hidden');
                }
            }
        };
        cell.addEventListener('click', handler);
        cell.addEventListener('touchstart', handler);
    });
}

document.getElementById('btn-left').onclick = () => handleDirection((game.selectedCell >= 7) ? 1 : -1);
document.getElementById('btn-right').onclick = () => handleDirection((game.selectedCell >= 7) ? -1 : 1);

async function handleDirection(dir) {
    const startIdx = game.selectedCell;
    game.selectedCell = null;
    document.querySelectorAll('.cell').forEach(c => c.classList.remove('selected'));
    document.getElementById('direction-picker').classList.add('hidden');
    await executeMove(startIdx, dir);
}

async function executeMove(idx, dir) {
    game.isMoving = true;
    let hand = game.board[idx];
    game.board[idx] = 0;
    let curr = idx;
    render();
    await new Promise(r => setTimeout(r, 400));

    while (hand > 0) {
        while (hand > 0) {
            curr = (curr + dir + 12) % 12;
            game.board[curr]++;
            hand--;
            render();
            await new Promise(r => setTimeout(r, 300));
        }
        let next = (curr + dir + 12) % 12;
        if (game.board[next] > 0 && next !== 0 && next !== 6) {
            hand = game.board[next];
            game.board[next] = 0;
            curr = next;
            render();
            await new Promise(r => setTimeout(r, 500));
        } else if (game.board[next] === 0) {
            let target = (next + dir + 12) % 12;
            while (game.board[target] > 0 && game.board[next] === 0) {
                game.scores[game.turn] += game.board[target];
                game.board[target] = 0;
                render();
                next = (target + dir + 12) % 12;
                target = (next + dir + 12) % 12;
                await new Promise(r => setTimeout(r, 700));
            }
            break;
        } else { break; }
    }

    game.isMoving = false;
    game.turn = 1 - game.turn;
    const isOver = await checkGameOver();
    if (!isOver) {
        render();
        if (game.turn === 1 && game.mode === 'pve') runAI();
    }
}

function runAI() {
    setTimeout(() => {
        let moves = [];
        for (let i = 1; i <= 5; i++) {
            if (game.board[i] > 0) {
                moves.push({idx: i, dir: 1, s: simulate(i, 1)});
                moves.push({idx: i, dir: -1, s: simulate(i, -1)});
            }
        }
        moves.sort((a, b) => b.s - a.s);
        const best = moves[0] || {idx: 1, dir: 1};
        executeMove(best.idx, best.dir);
    }, 1000);
}

function simulate(idx, dir) {
    let count = game.board[idx];
    let last = (idx + count * dir + 120) % 12;
    let n = (last + dir + 12) % 12;
    let t = (n + dir + 12) % 12;
    if (game.board[n] === 0) return game.board[t] || 0;
    return 0;
}

function startGame(mode) {
    game.mode = mode;
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('label-p1').innerText = "Bạn";
    document.getElementById('label-p2').innerText = (mode === 'pve' ? "Bot" : "Khách");
    initStonePositions();
    setupCellEvents();
    render();
    
    const audio = document.getElementById('bg-music');
    audio.volume = 0.3; 
    audio.play().then(() => {
        game.musicPlaying = true;
        document.getElementById('music-icon').innerText = "🔊";
    }).catch(() => {});
}