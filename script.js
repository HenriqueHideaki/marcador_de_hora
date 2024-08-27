let currentTask = null;
let startTime = null;
let timerInterval = null;
let totalSecondsWorked = 0;
let elapsedSeconds = 0;  // Armazena o tempo decorrido quando pausado
let accumulatedSeconds = 0; // Armazena o tempo acumulado quando a tarefa é finalizada e depois retomada

function addTask() {
    const taskName = document.getElementById('task-input').value;
    if (taskName.trim() === '') {
        alert('Por favor, insira um nome para a tarefa.');
        return;
    }

    const taskContainer = document.getElementById('task-container');

    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.setAttribute('onclick', `startTask('${taskName}', this)`);

    taskCard.innerHTML = `
        <h2>${taskName}</h2>
        <p>Status: <span class="status">Not Started</span></p>
        <p>Start Time: <span class="start-time"></span></p>
        <p>End Time: <span class="end-time"></span></p>
        <p>Duration: <span class="duration">00:00:00</span></p>
        <p>Timer: <span class="timer">00:00:00</span></p>
        <button class="pause-btn" onclick="pauseTask(event, '${taskName}', this)">Pausar</button>
        <button class="finalize-btn" onclick="finalizeTask(event, '${taskName}', this)">Finalizar</button>
    `;

    taskContainer.appendChild(taskCard);
    document.getElementById('task-input').value = '';
}

function startTask(taskName, element) {
    // Verifica se a tarefa já está em progresso
    if (currentTask === taskName) {
        return; // Se estiver, não faz nada
    }

    const now = new Date();

    // Pausar a tarefa atual se existir
    if (currentTask && currentTask !== taskName) {
        pauseCurrentTask(); // Pausar a tarefa atual automaticamente
    }

    // Iniciar ou retomar a nova tarefa
    currentTask = taskName;
    startTime = now;
    accumulatedSeconds = parseInt(element.getAttribute('data-accumulated')) || 0; // Recupera o tempo acumulado, se existir
    elapsedSeconds = parseInt(element.getAttribute('data-elapsed')) || 0; // Recupera o tempo decorrido, se existir

    element.setAttribute("data-task", taskName);
    element.querySelector('.status').innerText = "In Progress";
    element.classList.remove('finished'); // Remove a classe finished se a tarefa foi finalizada antes
    element.classList.add('in-progress');
    timerInterval = setInterval(() => updateTimer(element), 1000);
}

function pauseTask(event, taskName, element) {
    event.stopPropagation();
    if (currentTask === taskName) {
        pauseCurrentTask();
    }
}

function pauseCurrentTask() {
    if (currentTask) {
        clearInterval(timerInterval);
        const currentTaskCard = document.querySelector(`[data-task="${currentTask}"]`);
        currentTaskCard.querySelector('.status').innerText = "Paused";
        currentTaskCard.classList.remove('in-progress');
        currentTaskCard.setAttribute('data-elapsed', elapsedSeconds); // Salva o tempo decorrido
        currentTask = null;
    }
}

function updateTimer(element) {
    elapsedSeconds++;
    const totalElapsedSeconds = accumulatedSeconds + elapsedSeconds;
    const hours = String(Math.floor(totalElapsedSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalElapsedSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalElapsedSeconds % 60).padStart(2, '0');
    element.querySelector('.timer').innerText = `${hours}:${minutes}:${seconds}`;
}

function finalizeTask(event, taskName, element) {
    event.stopPropagation();
    clearInterval(timerInterval); // Interrompe a contagem do cronômetro

    const now = new Date();
    const taskCard = element.closest('.task-card');
    taskCard.querySelector('.status').innerText = "Finished";
    taskCard.querySelector('.end-time').innerText = now.toLocaleTimeString();
    taskCard.classList.remove('in-progress');
    taskCard.classList.add('finished');

    // Calcular e exibir a duração total
    const durationInSeconds = accumulatedSeconds + elapsedSeconds;
    const hours = String(Math.floor(durationInSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((durationInSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(durationInSeconds % 60).padStart(2, '0');
    taskCard.querySelector('.duration').innerText = `${hours}:${minutes}:${seconds}`;

    // Atualizar o tempo total trabalhado
    totalSecondsWorked += elapsedSeconds;
    updateTotalHours();

    // Acumula o tempo decorrido ao tempo acumulado
    accumulatedSeconds += elapsedSeconds;
    element.setAttribute('data-accumulated', accumulatedSeconds); // Salva o tempo acumulado

    currentTask = null;
    elapsedSeconds = 0;  // Redefinir o tempo decorrido para a próxima tarefa
}

function updateTotalHours() {
    const totalHours = String(Math.floor(totalSecondsWorked / 3600)).padStart(2, '0');
    const totalMinutes = String(Math.floor((totalSecondsWorked % 3600) / 60)).padStart(2, '0');
    const totalSeconds = String(totalSecondsWorked % 60).padStart(2, '0');
    document.getElementById('total-hours').innerText = `${totalHours}:${totalMinutes}:${totalSeconds}`;
}

function saveTasks() {
    let tasksData = '';
    const taskCards = document.querySelectorAll('.task-card');
    taskCards.forEach(card => {
        const taskName = card.querySelector('h2').innerText;
        const status = card.querySelector('.status').innerText;
        const startTime = card.querySelector('.start-time').innerText;
        const endTime = card.querySelector('.end-time').innerText;
        const duration = card.querySelector('.duration').innerText;
        tasksData += `Task: ${taskName}\nStatus: ${status}\nStart Time: ${startTime}\nEnd Time: ${endTime}\nDuration: ${duration}\n\n`;
    });

    const blob = new Blob([tasksData], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'tasks_report.txt';
    link.click();
}
