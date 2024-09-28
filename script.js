const gameBoard = document.getElementById("game-board");
const scoreDisplay = document.getElementById("score");
const recordDisplay = document.getElementById("record"); // Elemento para mostrar o recorde
const pauseBtn = document.getElementById("pause-btn");
const restartBtn = document.getElementById("restart-btn");
const modalRestartBtn = document.getElementById("modal-restart-btn");

const boardWidth = 10;
const boardHeight = 20;
let board = Array.from({ length: boardHeight }, () =>
  Array(boardWidth).fill(0)
);
let currentPiece,
  nextPiece,
  gameInterval,
  paused = false,
  score = 0;
const dropInterval = 800; // Velocidade de descida ajustada (800ms)

// Função para obter o recorde salvo no localStorage
function getRecord() {
  const record = localStorage.getItem("tetrisRecord");
  return record ? parseInt(record, 10) : 0; // Retorna 0 se não houver recorde
}

// Função para salvar o recorde no localStorage
function setRecord(newRecord) {
  localStorage.setItem("tetrisRecord", newRecord);
}

// Função para atualizar o recorde na tela
function updateRecordDisplay() {
  const record = getRecord();
  recordDisplay.textContent = record; // Atualiza o texto com o recorde atual
}

// Atualizar a pontuação e verificar se é um novo recorde
function updateScore() {
  scoreDisplay.textContent = score; // Atualiza o placar atual
  const currentRecord = getRecord();
  if (score > currentRecord) {
    setRecord(score); // Salva o novo recorde
    updateRecordDisplay(); // Atualiza o display de recorde
  }
}

// Exibe o recorde salvo ao iniciar o jogo
updateRecordDisplay();

// Tetriminos (Peças)
const tetriminos = {
  I: [[1, 1, 1, 1]],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
  ],
};

// Cores das peças
const colors = {
  I: "cyan",
  O: "yellow",
  T: "purple",
  J: "blue",
  L: "orange",
  S: "green",
  Z: "red",
};

// Função para criar o tabuleiro
function createBoard() {
  gameBoard.innerHTML = ""; // Limpar o tabuleiro visual antes de recriar
  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      const block = document.createElement("div");
      block.dataset.row = row;
      block.dataset.col = col;
      gameBoard.appendChild(block);
    }
  }
}

// Função para desenhar a peça no tabuleiro
function drawPiece(piece, pos) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const block = gameBoard.querySelector(
          `[data-row="${pos.y + y}"][data-col="${pos.x + x}"]`
        );
        block.style.backgroundColor = colors[piece.type];
      }
    });
  });
}

// Função para limpar a peça do tabuleiro
function clearPiece(piece, pos) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const block = gameBoard.querySelector(
          `[data-row="${pos.y + y}"][data-col="${pos.x + x}"]`
        );
        block.style.backgroundColor = "";
      }
    });
  });
}

// Função para desenhar a próxima peça no quadrado de exibição
function drawNextPiece(piece) {
  const nextPieceDisplay = document.getElementById("next-piece-display");
  nextPieceDisplay.innerHTML = ""; // Limpar o quadrado antes de desenhar

  const gridSize = 4; // Definir o grid de exibição como 4x4

  // Centralizar a peça dentro do grid de 4x4
  const offsetX = Math.floor((gridSize - piece.shape[0].length) / 2);
  const offsetY = Math.floor((gridSize - piece.shape.length) / 2);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const block = document.createElement("div");
      block.style.backgroundColor = ""; // Células vazias

      if (
        y >= offsetY &&
        y < offsetY + piece.shape.length &&
        x >= offsetX &&
        x < offsetX + piece.shape[0].length
      ) {
        const pieceX = x - offsetX;
        const pieceY = y - offsetY;
        if (piece.shape[pieceY][pieceX]) {
          block.style.backgroundColor = colors[piece.type]; // Desenhar a cor da peça
        }
      }

      nextPieceDisplay.appendChild(block); // Adicionar a célula ao grid de exibição
    }
  }
}

// Função para rotacionar uma peça 90 graus no sentido horário
function rotatePiece(piece) {
  const rotatedShape = piece.shape[0]
    .map((_, index) => piece.shape.map((row) => row[index]))
    .reverse();

  const newPiece = { ...piece, shape: rotatedShape };

  // Verificar se a rotação causaria uma colisão
  if (!detectCollision(newPiece, piece.pos)) {
    return newPiece; // Retornar a peça rotacionada se não houver colisão
  } else {
    return piece; // Se houver colisão, manter a peça na rotação atual
  }
}

// Função para gerar uma peça aleatória com posição inicial
function randomPiece() {
  const types = Object.keys(tetriminos);
  const randType = types[Math.floor(Math.random() * types.length)];
  return {
    type: randType,
    shape: tetriminos[randType],
    pos: { x: Math.floor(boardWidth / 2) - 1, y: 0 },
  };
}

// Função para detectar colisões
function detectCollision(piece, pos) {
  return piece.shape.some((row, y) => {
    return row.some((value, x) => {
      if (value) {
        const newX = pos.x + x;
        const newY = pos.y + y;
        return (
          newX < 0 || // Colisão com a borda esquerda
          newX >= boardWidth || // Colisão com a borda direita
          newY >= boardHeight || // Colisão com o fundo
          board[newY][newX] !== 0 // Colisão com outra peça
        );
      }
    });
  });
}

// Função para mapear o tipo de peça para um índice
function getPieceIndex(type) {
  switch (type) {
    case "I":
      return 1;
    case "O":
      return 2;
    case "T":
      return 3;
    case "J":
      return 4;
    case "L":
      return 5;
    case "S":
      return 6;
    case "Z":
      return 7;
    default:
      return 0;
  }
}

// Função auxiliar para obter a cor correta da peça com base no número armazenado no board
function getColor(value) {
  switch (value) {
    case 1:
      return "cyan"; // I
    case 2:
      return "yellow"; // O
    case 3:
      return "purple"; // T
    case 4:
      return "blue"; // J
    case 5:
      return "orange"; // L
    case 6:
      return "green"; // S
    case 7:
      return "red"; // Z
    default:
      return "";
  }
}

// Função para travar a peça no tabuleiro
function lockPiece(piece) {
  piece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        board[piece.pos.y + y][piece.pos.x + x] = getPieceIndex(piece.type); // Salva o índice da peça no board
        const block = gameBoard.querySelector(
          `[data-row="${piece.pos.y + y}"][data-col="${piece.pos.x + x}"]`
        );
        if (block) {
          block.style.backgroundColor = colors[piece.type]; // Aplica a cor correta da peça
        }
      }
    });
  });
}

// Função para limpar linhas completas e fazer as peças de cima descerem
function clearLines() {
  let linesCleared = 0; // Contador de linhas removidas

  // Percorrer o tabuleiro de baixo para cima
  for (let row = boardHeight - 1; row >= 0; row--) {
    if (board[row].every((value) => value !== 0)) {
      linesCleared++; // Incrementa o contador de linhas removidas

      // Remover a linha completa da matriz "board"
      board.splice(row, 1);
      // Adicionar uma linha vazia no topo
      board.unshift(Array(boardWidth).fill(0));

      // Atualizar o tabuleiro visualmente
      updateBoard();

      // Após a remoção, verificar novamente a mesma linha, pois as superiores desceram
      row++;
    }
  }

  if (linesCleared > 0) {
    score += linesCleared * 100; // Incrementa a pontuação com base nas linhas removidas
    scoreDisplay.textContent = score; // Atualiza o placar
  }
}

// Função para atualizar visualmente o tabuleiro
function updateBoard() {
  for (let r = 0; r < boardHeight; r++) {
    for (let c = 0; c < boardWidth; c++) {
      const block = gameBoard.querySelector(
        `[data-row="${r}"][data-col="${c}"]`
      );
      if (block) {
        if (board[r][c] === 0) {
          block.style.backgroundColor = ""; // Limpar célula vazia
        } else {
          block.style.backgroundColor = getColor(board[r][c]); // Aplicar cor correta
        }
      }
    }
  }
}

// Função para mover a peça para baixo
function moveDown() {
  const newPos = { x: currentPiece.pos.x, y: currentPiece.pos.y + 1 };
  if (!detectCollision(currentPiece, newPos)) {
    clearPiece(currentPiece, currentPiece.pos);
    currentPiece.pos = newPos;
    drawPiece(currentPiece, currentPiece.pos);
  } else {
    lockPiece(currentPiece);
    clearLines();
    currentPiece = nextPiece;
    nextPiece = randomPiece();
    drawNextPiece(nextPiece); // Exibir a próxima peça
    if (detectCollision(currentPiece, currentPiece.pos)) {
      gameOver();
    }
  }
}

// Função para controlar o jogo
function gameLoop() {
  if (!paused) {
    moveDown();
  }
}

// Função para reiniciar o jogo
function restartGame() {
  clearInterval(gameInterval); // Garantir que o intervalo anterior seja limpo
  board = Array.from({ length: boardHeight }, () => Array(boardWidth).fill(0)); // Reiniciar a matriz board
  score = 0; // Reiniciar a pontuação
  scoreDisplay.textContent = score;
  createBoard(); // Recriar o tabuleiro
  currentPiece = randomPiece();
  nextPiece = randomPiece();
  drawNextPiece(nextPiece); // Exibir a nova próxima peça
  gameInterval = setInterval(gameLoop, dropInterval); // Reiniciar o loop do jogo
  document.getElementById("game-over-modal").style.display = "none"; // Fechar modal
}

function gameOver() {
  updateScore(); // Adiciona esta linha para garantir que o recorde seja atualizado
  clearInterval(gameInterval);
  document.getElementById("game-over-modal").style.display = "flex"; // Exibir o modal
}

// Evento de clique para o botão de reiniciar abaixo do botão de pausa
document.getElementById("restart-btn").addEventListener("click", restartGame);

// Evento de clique para o botão de reiniciar no modal de Game Over
document
  .getElementById("modal-restart-btn")
  .addEventListener("click", restartGame);

// Evento de clique para o botão de pausa
pauseBtn.addEventListener("click", togglePause);

// Função para pausar e retomar o jogo
function togglePause() {
  if (paused) {
    gameInterval = setInterval(gameLoop, dropInterval); // Retomar o jogo
    pauseBtn.textContent = "Pausar";
  } else {
    clearInterval(gameInterval); // Pausar o jogo
    pauseBtn.textContent = "Retomar";
  }
  paused = !paused; // Alternar entre pausado e rodando
}

// Função para iniciar o jogo
function startGame() {
  createBoard();
  currentPiece = randomPiece();
  nextPiece = randomPiece();
  drawNextPiece(nextPiece); // Exibir a primeira próxima peça
  gameInterval = setInterval(gameLoop, dropInterval); // Intervalo de 800ms
}

// Controles do teclado
document.addEventListener("keydown", (e) => {
  if (paused) return; // Bloquear movimentos durante a pausa

  const newPos = { ...currentPiece.pos };

  if (e.key === "ArrowLeft") {
    newPos.x -= 1;
  } else if (e.key === "ArrowRight") {
    newPos.x += 1;
  } else if (e.key === "ArrowDown") {
    newPos.y += 1;
  }

  if (!detectCollision(currentPiece, newPos)) {
    clearPiece(currentPiece, currentPiece.pos);
    currentPiece.pos = newPos;
    drawPiece(currentPiece, currentPiece.pos);
  }

  if (e.key === "q" || e.key === "Q") {
    const rotatedPiece = rotatePiece(currentPiece);
    clearPiece(currentPiece, currentPiece.pos);
    currentPiece = rotatedPiece;
    drawPiece(currentPiece, currentPiece.pos);
  }

  if (e.key === " ") {
    togglePause();
  }
});

// Iniciar o jogo ao clicar no ícone de play
document.getElementById("play-icon").addEventListener("click", () => {
  startGame(); // Inicializa o jogo após o clique no ícone de play
  document.getElementById("play-icon").style.display = "none"; // Esconde o ícone de play
});

let startX = 0,
  startY = 0;
let touchStartTime = 0;
let lastTapTime = 0;
const swipeThreshold = 30; // Menor distância para ser considerado um swipe

// Função chamada ao iniciar um toque
function handleTouchStart(event) {
  const touch = event.touches[0];
  startX = touch.clientX;
  startY = touch.clientY;
  touchStartTime = new Date().getTime();
}

// Função chamada ao terminar um toque
function handleTouchEnd(event) {
  const touchEndTime = new Date().getTime();
  const touchDuration = touchEndTime - touchStartTime;

  const touch = event.changedTouches[0];
  const diffX = touch.clientX - startX;
  const diffY = touch.clientY - startY;

  // Detecção de swipe
  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > swipeThreshold) {
      moveRight(); // Swipe para a direita
    } else if (diffX < -swipeThreshold) {
      moveLeft(); // Swipe para a esquerda
    }
  } else {
    if (diffY > swipeThreshold) {
      moveDown(); // Swipe para baixo
    }
  }

  // Detecção de toque duplo
  const currentTime = new Date().getTime();
  const tapGap = currentTime - lastTapTime;

  if (tapGap < 250 && tapGap > 0) {
    // Melhorar o tempo de resposta do toque duplo
    rotatePieceOnTouch();
  }

  lastTapTime = currentTime;
}

// Função para rotacionar a peça
function rotatePieceOnTouch() {
  const rotatedPiece = rotatePiece(currentPiece); // Gira a peça
  clearPiece(currentPiece, currentPiece.pos);
  currentPiece = rotatedPiece;
  drawPiece(currentPiece, currentPiece.pos);
}

// Funções para mover a peça
function moveLeft() {
  const newPos = { ...currentPiece.pos, x: currentPiece.pos.x - 1 };
  if (!detectCollision(currentPiece, newPos)) {
    clearPiece(currentPiece, currentPiece.pos);
    currentPiece.pos = newPos;
    drawPiece(currentPiece, currentPiece.pos);
  }
}

function moveRight() {
  const newPos = { ...currentPiece.pos, x: currentPiece.pos.x + 1 };
  if (!detectCollision(currentPiece, newPos)) {
    clearPiece(currentPiece, currentPiece.pos);
    currentPiece.pos = newPos;
    drawPiece(currentPiece, currentPiece.pos);
  }
}

function moveDown() {
  const newPos = { x: currentPiece.pos.x, y: currentPiece.pos.y + 1 };
  if (!detectCollision(currentPiece, newPos)) {
    clearPiece(currentPiece, currentPiece.pos);
    currentPiece.pos = newPos;
    drawPiece(currentPiece, currentPiece.pos);
  } else {
    lockPiece(currentPiece);
    clearLines();
    currentPiece = nextPiece;
    nextPiece = randomPiece();
    drawNextPiece(nextPiece); // Exibir a próxima peça
    if (detectCollision(currentPiece, currentPiece.pos)) {
      gameOver();
    }
  }
}

// Adicionar os eventos de toque para celulares
document.addEventListener("touchstart", handleTouchStart);
document.addEventListener("touchend", handleTouchEnd);

// Função para bloquear o zoom no celular
function preventZoom(event) {
  if (event.touches.length > 1) {
    // Bloquear pinch-to-zoom (zoom com dois dedos)
    event.preventDefault();
  }
}

function preventDoubleTapZoom(event) {
  const currentTime = new Date().getTime();
  const tapGap = currentTime - lastTapTime;

  if (tapGap < 300 && tapGap > 0) {
    // Se dois toques ocorrerem em menos de 300ms, impedir o zoom
    event.preventDefault();
  }

  lastTapTime = currentTime;
}

// Impedir o comportamento de zoom com dois dedos
document.addEventListener("touchstart", preventZoom, { passive: false });

// Impedir o comportamento de zoom com dois toques
document.addEventListener("touchend", preventDoubleTapZoom);

let fastDropInterval = null; // Variável para armazenar o intervalo de descida rápida

// Função para mover a peça para baixo mais rapidamente (enquanto o jogador desliza para baixo)
function fastMoveDown() {
  clearInterval(fastDropInterval); // Limpar qualquer intervalo existente
  fastDropInterval = setInterval(() => {
    moveDown();
  }, 50); // Intervalo rápido (50ms)
}

// Função chamada ao terminar o toque (inclusive deslize)
function handleTouchEnd(event) {
  const touchEndTime = new Date().getTime();
  const touchDuration = touchEndTime - touchStartTime;

  const touch = event.changedTouches[0];
  const diffX = touch.clientX - startX;
  const diffY = touch.clientY - startY;

  // Detecção de swipe
  if (Math.abs(diffX) > Math.abs(diffY)) {
    if (diffX > swipeThreshold) {
      moveRight(); // Swipe para a direita
    } else if (diffX < -swipeThreshold) {
      moveLeft(); // Swipe para a esquerda
    }
  } else {
    if (diffY > swipeThreshold) {
      fastMoveDown(); // Swipe para baixo (descer rapidamente)
    }
  }

  // Parar descida rápida ao terminar o deslize
  clearInterval(fastDropInterval);

  // Detecção de toque duplo
  const currentTime = new Date().getTime();
  const tapGap = currentTime - lastTapTime;

  if (tapGap < 250 && tapGap > 0) {
    // Melhorar o tempo de resposta do toque duplo
    rotatePieceOnTouch();
  }

  lastTapTime = currentTime;
}

// Impedir o comportamento de zoom com dois dedos
document.addEventListener("touchstart", handleTouchStart);
document.addEventListener("touchend", handleTouchEnd);
