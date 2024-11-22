const boardSize = 30;
const boardElement = document.getElementById("board");
const timerElement = document.getElementById("timer");
const consoleOutput = document.getElementById("console-output");
const variables = {};
const reservedWords = [
  "SE",
  "MOVER",
  "VAR",
  "ROBO NA META",
  "OBSTACULO NA FRENTE",
  "CIMA",
  "CIMA-DIREITA",
  "BAIXO-DIREITA",
  "CIMA-ESQUERDA",
  "BAIXO-ESQUERDA",
  "BAIXO",
  "ESQUERDA",
  "DIREITA",
];

let loadedCommands = [];

let timer = 0;
let obstaclesPositions = [];
let intervalId;
let robot = { x: 0, y: 0 };
let target = { x: boardSize - 1, y: boardSize - 1 };
const board = Array.from({ length: boardSize }, () =>
  Array(boardSize).fill(null)
);
let gameStarted = false;

function createBoard() {
  boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 20px)`;
  boardElement.innerHTML = "";
  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.x = x;
      cell.dataset.y = y;
      boardElement.appendChild(cell);
    }
  }
  updateBoard();
}

function updateBoard() {
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.classList.remove("robot", "target", "obstacle");
    const x = parseInt(cell.dataset.x);
    const y = parseInt(cell.dataset.y);
    if (x === robot.x && y === robot.y) cell.classList.add("robot");
    if (x === target.x && y === target.y) cell.classList.add("target");
    if (board[x][y] === "O") cell.classList.add("obstacle");
  });
  checkWin();
}

function placeObstacles(numObstacles) {
  for (let i = 0; i < numObstacles; i++) {
    const x = Math.floor(Math.random() * boardSize);
    const y = Math.floor(Math.random() * boardSize);
    if (
      (x !== robot.x || y !== robot.y) &&
      (x !== target.x || y !== target.y)
    ) {
      board[x][y] = "O";
      obstaclesPositions.push([x, y]);
    }
  }
  updateBoard();
  console.log(obstaclesPositions);
}

function initializeBoard() {
  const obstacleCount = parseInt(
    document.getElementById("obstacle-count").value,
    10
  );
  board.forEach((row) => row.fill(null));
  placeObstacles(obstacleCount);
  updateBoard();
}

function startTimer() {
  timer = 0;
  intervalId = setInterval(() => {
    timer++;
    timerElement.textContent = "Timer: " + timer + "s";
  }, 1000);
}

function stopTimer() {
  clearInterval(intervalId);
}

function startGame() {
  if (gameStarted) return;

  gameStarted = true;
  startTimer();
  document.getElementById("startGameBtn").disabled = true;
}

function moveRobot(newX, newY) {
  if (newX < 0 || newX >= boardSize || newY < 0 || newY >= boardSize) {
    logToConsole("Movimento fora do tabuleiro!", true);
    return;
  }

  if (board[newX][newY] === "O") {
    logToConsole("Colidiu com um obstáculo!", true);
    return;
  }

  robot.x = newX;
  robot.y = newY;
  logToConsole(`Movendo o robô para posição (${newX}, ${newY})`);
  updateBoard();
}

function logToConsole(message, error = false) {
  const messageElement = document.createElement("div");
  messageElement.classList.add("consoleText");
  if (error) messageElement.classList.add("error");
  messageElement.textContent = message;
  consoleOutput.appendChild(messageElement);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function evaluateExpression(expr, variables) {
  if (isNaN(expr)) {
    return variables[expr] !== undefined ? variables[expr] : 0;
  }
  return parseInt(expr, 10);
}

function checkWin() {
  if (robot.x === target.x && robot.y === target.y) {
    alert("Chegou ao destino");
    location.reload();
  }
}

function processMovement(direction, steps = 1) {
  let newX = robot.x;
  let newY = robot.y;

  for (let step = 1; step <= steps; step++) {
    switch (direction) {
      case "CIMA":
        newX = robot.x - step;
        newY = robot.y;
        break;
      case "BAIXO":
        newX = robot.x + step;
        newY = robot.y;
        break;
      case "ESQUERDA":
        newX = robot.x;
        newY = robot.y - step;
        break;
      case "DIREITA":
        newX = robot.x;
        newY = robot.y + step;
        break;
      case "CIMA-ESQUERDA":
        newX -= step;
        newY -= step;
        break;
      case "CIMA-DIREITA":
        newX -= step;
        newY += step;
        break;
      case "BAIXO-ESQUERDA":
        newX += step;
        newY -= step;
        break;
      case "BAIXO-DIREITA":
        newX += step;
        newY += step;
        break;
      default:
        logToConsole("Direção desconhecida!", true);
        return;
    }

    if (newX < 0 || newX >= boardSize || newY < 0 || newY >= boardSize) {
      logToConsole("Movimento fora do tabuleiro!", true);
      return;
    }

    if (board[newX][newY] === "O") {
      logToConsole("Colidiu com um obstáculo no caminho!", true);
      return;
    }
  }

  robot.x = newX;
  robot.y = newY;
  logToConsole(`Movendo o robô para posição (${newX}, ${newY})`);
  updateBoard();
}

function checkForObstacles() {
  const obstacles = [];
  if (board[robot.x - 1] && board[robot.x - 1][robot.y] === "O")
    obstacles.push("CIMA");
  if (board[robot.x + 1] && board[robot.x + 1][robot.y] === "O")
    obstacles.push("BAIXO");
  if (board[robot.x][robot.y - 1] === "O") obstacles.push("ESQUERDA");
  if (board[robot.x][robot.y + 1] === "O") obstacles.push("DIREITA");

  return obstacles;
}

function interpretCommand(command) {
  const tokens = command.split(" ");
  if (tokens.length === 0) return;

  const mainCommand = tokens[0].toUpperCase();
  switch (mainCommand.toUpperCase()) {
    case "VAR":
      if (tokens.length >= 3) {
        const varName = tokens[1];
        const varValue = evaluateExpression(tokens[2], variables);
        variables[varName] = varValue;

        logToConsole(
          `Variável ${varName} definida com valor ${varValue}`
        );
      }
      break;
    case "MOVER":
      if (tokens.length >= 3) {
        const direction = tokens[1].toUpperCase();
        let steps;

        if (isNaN(tokens[2])) {
          const varName = tokens[2];
          if (variables[varName] !== undefined) {
            steps = variables[varName];
          } else {
            logToConsole(`Variável "${varName}" não definida.`, true);
            return;
          }
        } else {
          steps = parseInt(tokens[2], 10);
        }

        processMovement(direction, steps);
      } else {
        logToConsole("Uso incorreto do comando MOVER", true);
      }
      break;

    case "AJUDA":
      if (tokens.length === 1) {
        logToConsole(
          "-------------------------------------------------------------"
        );
        logToConsole(
          "Utilize as palavras chave * MOVER {DIREÇÂO} {NUMERO DE POSIÇÔES} * para iniciar um comando de movimento "
        );
        logToConsole("AS DIREÇÕES POSSIVEIS SÂO:");
        logToConsole(
          "BAIXO,DIREITA,ESQUERDA,CIMA-DIREIRA,CIMA-ESQUERDA,BAIXO-DIREITA,BAIXO-ESQUERDA"
        );
        logToConsole(
          "-------------------------------------------------------------"
        );
        logToConsole(
          "Tambem é possível a criação de variaveis por meio do comando *VAR*:"
        );
        logToConsole(
          "VAR {Nome da variavel} {Valor da variavel}, ex: VAR TESTE 5"
        );
        logToConsole(
          "-------------------------------------------------------------"
        );

        logToConsole(
          "Utilize a palavra-chave *SE* para criar condições, EX:"
        );
        logToConsole("SE OBSTACULO FRENTE MOVER BAIXO 5");
        logToConsole(
          "-------------------------------------------------------------"
        );

        logToConsole(
          "Utilize o comando *MOSTRAR OBSTACULOS* para saber quais são as posições de cada obstaculo no tabuleiro"
        );
        logToConsole(
          "-------------------------------------------------------------"
        );
      }

    case "MOSTRAR":
      if (
        tokens.length >= 2 &&
        tokens[1].toUpperCase() === "OBSTACULOS"
      ) {
        if (obstaclesPositions.length > 0) {
          logToConsole("Posições dos obstáculos no tabuleiro:");
          obstaclesPositions.forEach(([x, y], index) => {
            logToConsole(`Obstáculo ${index + 1}: (${x}, ${y})`);
          });
        } else {
          logToConsole("Nenhum obstáculo encontrado no tabuleiro.");
        }
      }
      break;
    case "INICIAR":
      if (tokens.length >= 2) {
        const subCommand = tokens[1].toUpperCase();
        if (subCommand === "TIMER") {
          startGame();
        } else {
          logToConsole(
            `Comando INICIAR ${subCommand} desconhecido.`,
            true
          );
        }
      }
      break;

    case "SE":
      if (tokens.length >= 4) {
        const condition = tokens[1].toUpperCase();
        const expectedValue = tokens[2].toUpperCase();
        const action = tokens.slice(3).join(" ");

        let conditionMet = false;

        switch (condition) {
          case "OBSTACULO":
            const obstacles = checkForObstacles();
            conditionMet = obstacles.includes(expectedValue);
            break;

          case "ROBO":
            if (expectedValue === "META") {
              conditionMet = robot.x === target.x && robot.y === target.y;
              checkWin();
            }
            break;

          default:
            logToConsole(`Condição desconhecida: ${condition}`, true);
            return;
        }

        if (conditionMet) {
          logToConsole(
            `Condição "${condition} ${expectedValue}" atendida. Executando: ${action}`
          );
          interpretCommand(action);
        } else {
          logToConsole(
            `Condição "${condition} ${expectedValue}" não atendida.`
          );
        }
      } else {
        logToConsole("Uso incorreto do comando SE", true);
      }
      break;
    default:
      logToConsole("Comando desconhecido", true);
  }
}

function isReservedWord(word) {
  return reservedWords.includes(word.toUpperCase());
}

function loadScript() {
  const fileInput = document.getElementById("file-upload");
  const file = fileInput.files[0];
  if (!file) {
    logToConsole("Nenhum arquivo selecionado.");
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    loadedCommands = event.target.result.split("\n").filter(Boolean);
    logToConsole("Script carregado com sucesso.");
    document.getElementById("startGameBtn").style.display = "block";
    document.getElementById("startGameBtn").disabled = false;
  };
  reader.readAsText(file);
}

function createScriptFile() {
  const scriptContent = document
    .getElementById("commandInput")
    .value.trim();

  if (scriptContent === "") {
    logToConsole(
      "Por favor, digite um código antes de gerar o script.",
      true
    );
    return;
  }

  if (
    scriptContent.toUpperCase() === "AJUDA" ||
    scriptContent.toUpperCase().startsWith("MOSTRAR")
  ) {
    interpretCommand(scriptContent);
    logToConsole("Comando executado diretamente no console.");
    return;
  }

  const blob = new Blob([scriptContent], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "script_do_robo.txt";
  link.click();

  logToConsole("Script gerado e pronto para download.");
}

function executeUserCommand() {
  const commands = document
    .getElementById("commandInput")
    .value.split("\n");

  commands.forEach((command) => {
    command = command.trim();
    if (command) {
      interpretCommand(command);
    }
  });
}

function resetGame() {
  stopTimer();
  gameStarted = false;
  timer = 0;
  timerElement.textContent = "Timer: 0s";

  robot = { x: 0, y: 0 };

  board.forEach((row) => row.fill(null));
  obstaclesPositions = [];
  document.getElementById("console-output").innerHTML = "";

  initializeBoard();

  document.getElementById("startGameBtn").style.display = "none";
  document.getElementById("startGameBtn").disabled = false;

  logToConsole(
    "Jogo reiniciado. Carregue um script ou configure o jogo."
  );
}

function startGame() {
  if (gameStarted) return;

  gameStarted = true;

  if (!intervalId) {
    startTimer();
  }

  logToConsole("Jogo iniciado!");

  let commandIndex = 0;

  const interval = setInterval(() => {
    if (commandIndex >= loadedCommands.length) {
      clearInterval(interval);
      logToConsole("Todos os comandos foram executados.");
      gameStarted = false;
      return;
    }

    const command = loadedCommands[commandIndex].trim();
    interpretCommand(command);
    commandIndex++;
  }, 1000);

  document.getElementById("startGameBtn").disabled = true;
}
createBoard();
placeObstacles(20);