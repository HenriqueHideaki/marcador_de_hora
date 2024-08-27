let currentTask = null;
let timerInterval = null;
let totalWorkedSeconds = 0;

document.addEventListener("DOMContentLoaded", loadTasks);  // Carrega as tarefas ao carregar a página
document.getElementById("save-to-localstorage-btn").addEventListener("click", saveAllTasksToLocalStorage);  // Adiciona evento ao botão "Salvar no LocalStorage"

function addTask() {
    const taskName = document.getElementById('task-input').value;
    if (taskName.trim() === '') {
        alert('Por favor, insira um nome para a tarefa.');
        return;
    }

    createTaskCard(taskName);
    saveTaskToLocalStorage(taskName);

    document.getElementById('task-input').value = '';
}

function createTaskCard(taskName, taskData = {}) {
    const taskContainer = document.getElementById('task-container');

    const taskCard = document.createElement('div');
    taskCard.className = 'task-card';
    taskCard.setAttribute('data-task-name', taskName);

    taskCard.innerHTML = `
        <h2>${taskName}</h2>
        <p>Status: <span class="status">${taskData.status || 'Not Started'}</span></p>
        <p>Start Time: <span class="start-time">${taskData.startTime || ''}</span></p>
        <p>End Time: <span class="end-time">${taskData.endTime || ''}</span></p>
        <p>Duration: <span class="duration">${taskData.duration || '00:00:00'}</span></p>
        <p>Timer: <span class="timer">${taskData.timer || '00:00:00'}</span></p>
        <button class="pause-btn" onclick="pauseTask(event, '${taskName}', this)">Pausar</button>
        <button class="finalize-btn" onclick="finalizeTask(event, '${taskName}', this)">Finalizar</button>
        <button class="remove-btn" onclick="removeTask(event, '${taskName}', this)">Remover</button>
    `;

    taskCard.setAttribute('data-accumulated', taskData.accumulated || '0'); // Tempo acumulado

    if (taskData.status === "In Progress") {
        taskCard.classList.add('in-progress');
    } else if (taskData.status === "Finished") {
        taskCard.classList.add('finished');
    }

    taskCard.addEventListener('click', () => startTask(taskName, taskCard));

    taskContainer.appendChild(taskCard);
}

function startTask(taskName, element) {
    if (currentTask === taskName) {
        return; // Não faz nada se a tarefa já está em progresso
    }

    const now = new Date();

    // Pausa a tarefa atual se existir outra em progresso
    if (currentTask && currentTask !== taskName) {
        pauseCurrentTask();
    }

    // Inicia ou retoma a nova tarefa
    currentTask = taskName;
    const accumulatedSeconds = parseInt(element.getAttribute('data-accumulated')) || 0; // Recupera o tempo acumulado
    element.setAttribute("data-start-time", now.getTime()); // Marca o início da nova sessão

    element.querySelector('.status').innerText = "In Progress";
    element.querySelector('.start-time').innerText = element.querySelector('.start-time').innerText || now.toLocaleTimeString();
    element.classList.add('in-progress');

    timerInterval = setInterval(() => updateTimer(element, accumulatedSeconds), 1000);

    updateTaskInLocalStorage(taskName, {
        status: "In Progress",
        startTime: element.querySelector('.start-time').innerText,
    });
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
        const currentTaskCard = document.querySelector(`[data-task-name="${currentTask}"]`);
        const startTime = parseInt(currentTaskCard.getAttribute('data-start-time'));
        const now = new Date().getTime();
        const elapsedTime = Math.floor((now - startTime) / 1000);
        const accumulatedSeconds = parseInt(currentTaskCard.getAttribute('data-accumulated')) || 0;
        const newAccumulatedTime = accumulatedSeconds + elapsedTime;

        currentTaskCard.querySelector('.status').innerText = "Paused";
        currentTaskCard.classList.remove('in-progress');
        currentTaskCard.setAttribute('data-accumulated', newAccumulatedTime); // Salva o tempo acumulado

        updateTaskInLocalStorage(currentTask, {
            status: "Paused",
            timer: currentTaskCard.querySelector('.timer').innerText,
            accumulated: newAccumulatedTime,
        });

        currentTask = null;
    }
}

function updateTimer(element, accumulatedSeconds) {
    const startTime = parseInt(element.getAttribute('data-start-time'));
    const now = new Date().getTime();
    const elapsedTime = Math.floor((now - startTime) / 1000);
    const totalElapsedSeconds = accumulatedSeconds + elapsedTime;

    const hours = String(Math.floor(totalElapsedSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalElapsedSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalElapsedSeconds % 60).padStart(2, '0');
    element.querySelector('.timer').innerText = `${hours}:${minutes}:${seconds}`;
}

function finalizeTask(event, taskName, element) {
    event.stopPropagation();
    clearInterval(timerInterval); // Interrompe a contagem do cronômetro

    const taskCard = element.closest('.task-card');
    const finalTime = taskCard.querySelector('.timer').innerText; // Pega o tempo final do cronômetro
    const elapsedSeconds = parseInt(taskCard.getAttribute('data-accumulated')) + Math.floor((new Date().getTime() - parseInt(taskCard.getAttribute('data-start-time'))) / 1000);

    // Incrementa o tempo total trabalhado
    totalWorkedSeconds += elapsedSeconds;
    updateTotalHoursWorked();

    taskCard.querySelector('.status').innerText = "Finished";
    taskCard.querySelector('.end-time').innerText = new Date().toLocaleTimeString(); // Tempo final agora
    taskCard.classList.remove('in-progress');
    taskCard.classList.add('finished');

    taskCard.querySelector('.duration').innerText = finalTime; // Define a duração como o tempo final do cronômetro

    updateTaskInLocalStorage(taskName, {
        status: "Finished",
        endTime: taskCard.querySelector('.end-time').innerText,
        duration: finalTime,
        accumulated: 0, // Resetar tempo acumulado após finalizar
    });

    currentTask = null;
}

function removeTask(event, taskName, element) {
    event.stopPropagation();
    const taskCard = element.closest('.task-card');
    taskCard.remove(); // Remove o card da interface

    removeTaskFromLocalStorage(taskName); // Remove a tarefa do localStorage
}

function removeTaskFromLocalStorage(taskName) {
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks = tasks.filter(task => task.name !== taskName);
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateTotalHoursWorked() {
    const totalHours = String(Math.floor(totalWorkedSeconds / 3600)).padStart(2, '0');
    const totalMinutes = String(Math.floor((totalWorkedSeconds % 3600) / 60)).padStart(2, '0');
    const totalSeconds = String(totalWorkedSeconds % 60).padStart(2, '0');
    document.getElementById('total-hours').innerText = `${totalHours}:${totalMinutes}:${totalSeconds}`;
}

function saveTaskToLocalStorage(taskName) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.push({ name: taskName });
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function updateTaskInLocalStorage(taskName, updates) {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    const taskIndex = tasks.findIndex(task => task.name === taskName);
    if (taskIndex > -1) {
        tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
    }
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasks() {
    const tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    tasks.forEach(task => createTaskCard(task.name, task));
}

function saveAllTasksToLocalStorage() {
    const taskCards = document.querySelectorAll('.task-card');
    const tasks = [];

    taskCards.forEach(card => {
        const taskName = card.querySelector('h2').innerText;
        const status = card.querySelector('.status').innerText;
        const startTime = card.querySelector('.start-time').innerText;
        const endTime = card.querySelector('.end-time').innerText;
        const duration = card.querySelector('.duration').innerText;
        const accumulated = card.getAttribute('data-accumulated') || 0;

        tasks.push({
            name: taskName,
            status: status,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            accumulated: accumulated
        });
    });

    localStorage.setItem('tasks', JSON.stringify(tasks));
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
