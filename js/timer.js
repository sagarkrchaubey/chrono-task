// js/timer.js

import { formatTimeFromSeconds, generateId } from './utils.js';
import { openTaskModal } from './modal.js';
import { playTimerSound } from './audio.js';

const timersListContainer = document.getElementById('timers-list');
const addTimerBtn = document.getElementById('add-timer-btn');

// Store all active timer instances and their states
let activeTimers = {}; // { timerId: { intervalId, currentTaskIndex, isRunning, isLooping, tasks: [], element } }

/** Creates the HTML structure for a new timer instance */
function createTimerElement(timerId, name = `Timer ${Object.keys(activeTimers).length + 1}`) {
    const timerInstance = document.createElement('div');
    timerInstance.className = 'timer-instance';
    timerInstance.dataset.timerId = timerId;

    timerInstance.innerHTML = `
        <div class="timer-header">
            <span class="timer-name" title="Click to edit name">${name}</span>
            <input type="text" class="timer-name-input" value="${name}" style="display: none;"> <!-- Hidden input for editing -->
            <div class="timer-header-controls">
                <button class="timer-remove-btn" title="Remove Timer">×</button>
            </div>
        </div>
        <div class="tasks-list">
            <!-- Task items will be added here -->
        </div>
        <button class="add-task-btn btn btn-secondary">+ Add Task</button>
        <div class="timer-controls">
            <div class="timer-main-controls">
                <button class="btn btn-primary start-pause-timer">Start</button>
                <button class="btn btn-secondary reset-timer" disabled>Reset</button>
                <button class="btn btn-warning skip-task-timer" disabled>Skip Task</button>
            </div>
            <div class="timer-options">
                <label class="loop-toggle" title="Toggle Loop">
                    <input type="checkbox" class="loop-checkbox">
                    <span class="loop-icon">🔄</span>
                    <span class="loop-text">Loop Off</span>
                </label>
            </div>
        </div>
    `;

    timersListContainer.appendChild(timerInstance);
    return timerInstance;
}

/** Creates the HTML structure for a task item */
function createTaskElement(task) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.taskId = task.id;

    const time = formatTimeFromSeconds(task.remainingSeconds);
    const initialTime = formatTimeFromSeconds(task.initialSeconds);
    const taskDisplayName = task.name || `Task ${task.index + 1}`; // Use name or default

    taskItem.innerHTML = `
        <div class="task-details">
             <span class="task-index">${task.index + 1}</span>
             <div class="task-info">
                <span class="task-name" title="Initial: ${initialTime.hours}:${initialTime.minutes}:${initialTime.seconds}">${taskDisplayName}</span>
                <span class="task-time">${time.hours}:${time.minutes}:${time.seconds}</span>
            </div>
        </div>
        <div class="task-controls">
            <button class="task-btn task-edit-btn" title="Edit Task">✎</button>
            <button class="task-btn task-remove-btn" title="Remove Task">×</button>
        </div>
    `;
    return taskItem;
}

/** Updates the display of a specific task item */
function updateTaskDisplay(taskElement, taskData) {
    const time = formatTimeFromSeconds(taskData.remainingSeconds);
    const initialTime = formatTimeFromSeconds(taskData.initialSeconds);
    const taskNameEl = taskElement.querySelector('.task-name');
    const taskTimeEl = taskElement.querySelector('.task-time');
    const taskDisplayName = taskData.name || `Task ${taskData.index + 1}`;

    if (taskNameEl) taskNameEl.textContent = taskDisplayName;
    if (taskNameEl) taskNameEl.title = `Initial: ${initialTime.hours}:${initialTime.minutes}:${initialTime.seconds}`; // Update tooltip
    if (taskTimeEl) taskTimeEl.textContent = `${time.hours}:${time.minutes}:${time.seconds}`;

    taskElement.classList.remove('active', 'completed');
    if (taskData.active) taskElement.classList.add('active');
    if (taskData.completed) taskElement.classList.add('completed');
}

/** Adds a new task to a timer instance (data and UI) */
function addTaskToTimer(timerId, taskData) {
    const timer = activeTimers[timerId];
    if (!timer) return;

    const newTask = {
        id: taskData.taskId || generateId(), // Use provided ID or generate new
        name: taskData.name || '', // Store name
        initialSeconds: taskData.totalSeconds,
        remainingSeconds: taskData.totalSeconds,
        index: timer.tasks.length, // Assign index based on current length
        active: false,
        completed: false
    };

    timer.tasks.push(newTask);

    const taskElement = createTaskElement(newTask);
    timer.element.querySelector('.tasks-list').appendChild(taskElement);

    // Re-index tasks visually if needed (after removal etc.) - Optional
    reindexTasks(timerId);
    updateTimerControlsState(timerId); // Enable controls if needed
}

/** Edits an existing task (data and UI) */
function editTaskInTimer(timerId, taskData) {
     const timer = activeTimers[timerId];
    if (!timer) return;

    const taskIndex = timer.tasks.findIndex(t => t.id === taskData.taskId);
    if (taskIndex === -1) return; // Task not found

    const task = timer.tasks[taskIndex];
    task.name = taskData.name || '';
    task.initialSeconds = taskData.totalSeconds;
    // Only reset remainingSeconds if the timer is not running
    if (!timer.isRunning) {
        task.remainingSeconds = taskData.totalSeconds;
    }
    // If editing the currently active task while running, update remaining too?
    // Decision: Let's keep remaining time as is if running, user can reset/skip.

    const taskElement = timer.element.querySelector(`.task-item[data-task-id="${task.id}"]`);
    if (taskElement) {
        updateTaskDisplay(taskElement, task); // Update display with new data
    }
    updateTimerControlsState(timerId);
}


/** Removes a task from a timer instance (data and UI) */
function removeTaskFromTimer(timerId, taskId) {
    const timer = activeTimers[timerId];
    if (!timer) return;

    const taskIndex = timer.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return; // Not found

    // If removing the currently running task, stop the timer?
    // Decision: Stop the timer and reset state for simplicity.
    if (timer.isRunning && timer.currentTaskIndex === taskIndex) {
        handleResetTimer(timerId); // Stop and reset
    }

    // Remove from data array
    timer.tasks.splice(taskIndex, 1);

    // Remove from UI
    const taskElement = timer.element.querySelector(`.task-item[data-task-id="${taskId}"]`);
    if (taskElement) taskElement.remove();

    // Adjust currentTaskIndex if needed
    if (taskIndex < timer.currentTaskIndex) {
        timer.currentTaskIndex--;
    }

    // Re-index tasks data and UI
    reindexTasks(timerId);
    updateTimerControlsState(timerId);
}

/** Re-assigns indices to tasks and updates their display */
function reindexTasks(timerId) {
    const timer = activeTimers[timerId];
    if (!timer) return;
    const taskListElement = timer.element.querySelector('.tasks-list');
    const taskElements = taskListElement.querySelectorAll('.task-item');

    timer.tasks.forEach((task, index) => {
        task.index = index; // Update data index
        const taskElement = taskElements[index]; // Assume elements are in order
        if (taskElement) {
            const indexElement = taskElement.querySelector('.task-index');
            if (indexElement) indexElement.textContent = index + 1;
            const taskNameEl = taskElement.querySelector('.task-name');
            if (taskNameEl && !task.name) { // Update default name if no custom name exists
                 taskNameEl.textContent = `Task ${index + 1}`;
            }
        }
    });
}


/** Handles the timer tick logic */
function handleTimerTick(timerId) {
    const timer = activeTimers[timerId];
    if (!timer || !timer.isRunning) return; // Should not happen if interval is cleared properly

    let currentTask = timer.tasks[timer.currentTaskIndex];

    // If no current task or index out of bounds (shouldn't normally happen)
    if (!currentTask || timer.currentTaskIndex >= timer.tasks.length) {
         // Check for loop condition
        if (timer.isLooping && timer.tasks.length > 0) {
            resetTimerTasks(timerId, false); // Reset tasks but keep timer running state
            timer.currentTaskIndex = 0;
            currentTask = timer.tasks[0];
             if(currentTask) currentTask.active = true; // Mark first as active again
        } else {
            stopTimer(timerId); // Stop if no loop or no tasks
            console.log(`Timer ${timerId} finished.`);
            // Maybe add a visual indication the timer finished
            return;
        }
    }

     // If current task just finished (remainingSeconds <= 0)
    if (currentTask.remainingSeconds <= 0) {
        currentTask.completed = true;
        currentTask.active = false;
        playTimerSound(); // Play sound when a task completes

        const currentTaskElement = timer.element.querySelector(`.task-item[data-task-id="${currentTask.id}"]`);
        if (currentTaskElement) updateTaskDisplay(currentTaskElement, currentTask);

        timer.currentTaskIndex++; // Move to the next task index

        // Check if we reached the end
        if (timer.currentTaskIndex >= timer.tasks.length) {
            // End of tasks reached
             if (timer.isLooping) {
                 resetTimerTasks(timerId, false); // Reset tasks
                 timer.currentTaskIndex = 0;
                 currentTask = timer.tasks[0]; // Get the first task again
                 if (currentTask) currentTask.active = true; // Mark as active
             } else {
                 stopTimer(timerId); // Stop if not looping
                 console.log(`Timer ${timerId} fully completed.`);
                 return;
             }
        } else {
             // There's a next task
             currentTask = timer.tasks[timer.currentTaskIndex]; // Get the new current task
             currentTask.active = true; // Mark it active
             const nextTaskElement = timer.element.querySelector(`.task-item[data-task-id="${currentTask.id}"]`);
             if (nextTaskElement) updateTaskDisplay(nextTaskElement, currentTask);
        }

        // If the *new* current task also has 0 duration, skip it immediately in the next tick
        if (currentTask && currentTask.remainingSeconds <= 0) {
             // Update display for the brief moment it's active but 0
             const taskElement = timer.element.querySelector(`.task-item[data-task-id="${currentTask.id}"]`);
             if(taskElement) updateTaskDisplay(taskElement, currentTask);
            // Let the next tick handle its completion
            return;
        }

    }

    // If the current task is valid and has time remaining
    if (currentTask && currentTask.remainingSeconds > 0) {
        currentTask.remainingSeconds--;
        const taskElement = timer.element.querySelector(`.task-item[data-task-id="${currentTask.id}"]`);
        if (taskElement) updateTaskDisplay(taskElement, currentTask); // Update its display
    }
}

/** Stops a specific timer */
function stopTimer(timerId, isPause = false) {
    const timer = activeTimers[timerId];
    if (!timer) return;

    clearInterval(timer.intervalId);
    timer.intervalId = null;
    timer.isRunning = false;

    // Update button text based on whether it's a pause or full stop
    const startPauseBtn = timer.element.querySelector('.start-pause-timer');
    startPauseBtn.textContent = isPause ? 'Resume' : 'Start';
    startPauseBtn.classList.remove('btn-danger');
    startPauseBtn.classList.add('btn-primary');

    // Disable skip button when paused or stopped
    const skipBtn = timer.element.querySelector('.skip-task-timer');
    if(skipBtn) skipBtn.disabled = true;


    // If stopped completely (not paused), mark the last active task as not active
    if (!isPause && timer.currentTaskIndex < timer.tasks.length) {
        const currentTask = timer.tasks[timer.currentTaskIndex];
        if (currentTask) {
            currentTask.active = false;
            const taskElement = timer.element.querySelector(`.task-item[data-task-id="${currentTask.id}"]`);
             if (taskElement) updateTaskDisplay(taskElement, currentTask);
        }
    }

     console.log(`Timer ${timerId} ${isPause ? 'paused' : 'stopped'}.`);
}

/** Starts or pauses a specific timer */
function handleStartPauseTimer(timerId) {
    const timer = activeTimers[timerId];
    if (!timer || timer.tasks.length === 0) {
        if (timer.tasks.length === 0) alert("Please add at least one task to start the timer.");
        return;
    }

    if (timer.isRunning) {
        // Pause
        stopTimer(timerId, true); // True indicates pause
    } else {
        // Start or Resume
        timer.isRunning = true;

        // If resuming, the currentTaskIndex should already be set.
        // If starting from scratch, ensure index is 0.
        if (!timer.intervalId && timer.currentTaskIndex >= timer.tasks.length) {
             timer.currentTaskIndex = 0; // Reset index if starting fresh after completion
        }
         // Ensure the first/current task is marked active if starting/resuming
        if (timer.currentTaskIndex < timer.tasks.length) {
             timer.tasks.forEach(t => t.active = false); // Deactivate others
             timer.tasks[timer.currentTaskIndex].active = true;
             timer.tasks[timer.currentTaskIndex].completed = false; // Ensure not marked completed
             const taskElement = timer.element.querySelector(`.task-item[data-task-id="${timer.tasks[timer.currentTaskIndex].id}"]`);
              if (taskElement) updateTaskDisplay(taskElement, timer.tasks[timer.currentTaskIndex]);
        }


        // Clear existing interval just in case, before starting a new one
        clearInterval(timer.intervalId);
        timer.intervalId = setInterval(() => handleTimerTick(timerId), 1000);

        const startPauseBtn = timer.element.querySelector('.start-pause-timer');
        startPauseBtn.textContent = 'Pause';
        startPauseBtn.classList.remove('btn-primary');
        startPauseBtn.classList.add('btn-danger'); // Red for pause

        updateTimerControlsState(timerId); // Update other buttons
         console.log(`Timer ${timerId} started/resumed.`);
    }
}

/** Resets all tasks in a timer to their initial state */
function resetTimerTasks(timerId, updateDisplay = true) {
    const timer = activeTimers[timerId];
    if (!timer) return;

    timer.tasks.forEach(task => {
        task.remainingSeconds = task.initialSeconds;
        task.active = false;
        task.completed = false;
        if (updateDisplay) {
            const taskElement = timer.element.querySelector(`.task-item[data-task-id="${task.id}"]`);
            if (taskElement) updateTaskDisplay(taskElement, task);
        }
    });
    timer.currentTaskIndex = 0; // Reset index to the beginning
}


/** Handles resetting a specific timer */
function handleResetTimer(timerId) {
    stopTimer(timerId, false); // Stop the timer completely
    resetTimerTasks(timerId, true); // Reset task data and update UI
    updateTimerControlsState(timerId); // Update button states
     console.log(`Timer ${timerId} reset.`);
}

/** Handles skipping the current task */
function handleSkipTask(timerId) {
     const timer = activeTimers[timerId];
    if (!timer || !timer.isRunning || timer.currentTaskIndex >= timer.tasks.length) return;

    const currentTask = timer.tasks[timer.currentTaskIndex];
    currentTask.remainingSeconds = 0; // Set remaining to 0
    currentTask.completed = true; // Mark as completed
    currentTask.active = false;

     const taskElement = timer.element.querySelector(`.task-item[data-task-id="${currentTask.id}"]`);
     if(taskElement) updateTaskDisplay(taskElement, currentTask);

    // Let the next tick handle moving to the next task or looping/stopping
    // handleTimerTick(timerId); // Or call tick immediately? Let interval handle it.
    console.log(`Timer ${timerId} skipped task ${currentTask.index + 1}.`);
}

/** Handles toggling the loop state */
function handleToggleLoop(timerId, checkbox, textElement) {
    const timer = activeTimers[timerId];
    if (!timer) return;

    timer.isLooping = checkbox.checked;
    textElement.textContent = timer.isLooping ? 'Loop On' : 'Loop Off';
    checkbox.closest('.loop-toggle').classList.toggle('active', timer.isLooping);
     console.log(`Timer ${timerId} loop set to ${timer.isLooping}.`);
}

/** Updates the enabled/disabled state of timer control buttons */
function updateTimerControlsState(timerId) {
    const timer = activeTimers[timerId];
    if (!timer) return;

    const hasTasks = timer.tasks.length > 0;
    const isRunning = timer.isRunning;

    const startPauseBtn = timer.element.querySelector('.start-pause-timer');
    const resetBtn = timer.element.querySelector('.reset-timer');
    const skipBtn = timer.element.querySelector('.skip-task-timer');

    if(startPauseBtn) startPauseBtn.disabled = !hasTasks;
    // Reset is enabled if there are tasks and it's either running OR has progress (index > 0 or first task not full)
    if (resetBtn) resetBtn.disabled = !hasTasks || (!isRunning && timer.currentTaskIndex === 0 && timer.tasks[0]?.remainingSeconds === timer.tasks[0]?.initialSeconds);
    if (skipBtn) skipBtn.disabled = !hasTasks || !isRunning;
}


/** Handles removing a timer instance */
function handleRemoveTimer(timerId) {
    const timer = activeTimers[timerId];
    if (!timer) return;

    // Confirm before removing
    if (!confirm(`Are you sure you want to remove timer "${timer.element.querySelector('.timer-name').textContent}"?`)) {
        return;
    }


    stopTimer(timerId); // Stop interval if running
    timer.element.remove(); // Remove from DOM
    delete activeTimers[timerId]; // Remove from active timers object
     console.log(`Timer ${timerId} removed.`);
}

// --- Timer Name Editing ---

function enableTimerNameEditing(timerId, nameSpan, nameInput) {
    nameSpan.style.display = 'none';
    nameInput.style.display = 'inline-block';
    nameInput.value = nameSpan.textContent; // Ensure input has current value
    nameInput.focus();
    nameInput.select();
}

function saveTimerName(timerId, nameSpan, nameInput) {
    const newName = nameInput.value.trim();
    const timer = activeTimers[timerId];

    if (newName && timer) {
        nameSpan.textContent = newName;
        // Optionally: save the name to timer data if needed elsewhere
        // timer.name = newName;
    } else {
        // Revert to original if empty or invalid
        nameInput.value = nameSpan.textContent;
    }

    nameSpan.style.display = 'inline-block';
    nameInput.style.display = 'none';
}


/** Main setup function for the timer section */
export function setupTimerSection() {
    // Add new timer button
    addTimerBtn.addEventListener('click', () => {
        const newTimerId = generateId();
        const defaultName = `Timer ${Object.keys(activeTimers).length + 1}`;
        const timerElement = createTimerElement(newTimerId, defaultName);

        // Store timer state
        activeTimers[newTimerId] = {
            intervalId: null,
            currentTaskIndex: 0,
            isRunning: false,
            isLooping: false,
            tasks: [],
            element: timerElement,
        };
        updateTimerControlsState(newTimerId); // Initially disable most controls
    });

    // Event delegation for dynamically added timers and tasks
    timersListContainer.addEventListener('click', (event) => {
        const target = event.target;
        const timerInstance = target.closest('.timer-instance');
        if (!timerInstance) return;
        const timerId = timerInstance.dataset.timerId;

        // Timer Controls
        if (target.matches('.start-pause-timer')) {
            handleStartPauseTimer(timerId);
        } else if (target.matches('.reset-timer')) {
            handleResetTimer(timerId);
        } else if (target.matches('.skip-task-timer')) {
             handleSkipTask(timerId);
        } else if (target.matches('.timer-remove-btn')) {
            handleRemoveTimer(timerId);
        } else if (target.matches('.add-task-btn')) {
            openTaskModal(timerId, (taskData) => {
                // Callback after modal save
                addTaskToTimer(taskData.timerId, taskData);
            });
        } else if (target.closest('.loop-toggle')) {
            const checkbox = timerInstance.querySelector('.loop-checkbox');
             const textElement = timerInstance.querySelector('.loop-text');
             // If the click wasn't directly on the checkbox, toggle it
             if (!target.matches('.loop-checkbox')) {
                  checkbox.checked = !checkbox.checked;
             }
            handleToggleLoop(timerId, checkbox, textElement);
        } else if (target.matches('.timer-name')) {
            const nameSpan = target;
            const nameInput = timerInstance.querySelector('.timer-name-input');
            enableTimerNameEditing(timerId, nameSpan, nameInput);
        }

        // Task Controls
        const taskItem = target.closest('.task-item');
        if (taskItem) {
             const taskId = taskItem.dataset.taskId;
             if (target.matches('.task-edit-btn')) {
                 const timer = activeTimers[timerId];
                 const task = timer?.tasks.find(t => t.id === taskId);
                 if (task) {
                     openTaskModal(timerId, (taskData) => {
                          editTaskInTimer(taskData.timerId, taskData);
                     }, { id: task.id, name: task.name, initialSeconds: task.initialSeconds });
                 }
             } else if (target.matches('.task-remove-btn')) {
                 if (confirm('Are you sure you want to remove this task?')) {
                    removeTaskFromTimer(timerId, taskId);
                 }
             }
        }
    });

     // Handle saving timer name on Enter or Blur
     timersListContainer.addEventListener('focusout', (event) => {
        if (event.target.matches('.timer-name-input')) {
             const timerInstance = event.target.closest('.timer-instance');
             const timerId = timerInstance.dataset.timerId;
             const nameSpan = timerInstance.querySelector('.timer-name');
             saveTimerName(timerId, nameSpan, event.target);
        }
    });
     timersListContainer.addEventListener('keydown', (event) => {
         if (event.key === 'Enter' && event.target.matches('.timer-name-input')) {
             event.preventDefault(); // Prevent form submission if inside form
             const timerInstance = event.target.closest('.timer-instance');
             const timerId = timerInstance.dataset.timerId;
             const nameSpan = timerInstance.querySelector('.timer-name');
             saveTimerName(timerId, nameSpan, event.target);
             event.target.blur(); // Remove focus
         } else if (event.key === 'Escape' && event.target.matches('.timer-name-input')) {
             // Cancel editing on Escape
             const timerInstance = event.target.closest('.timer-instance');
             const nameSpan = timerInstance.querySelector('.timer-name');
             event.target.value = nameSpan.textContent; // Revert value
             nameSpan.style.display = 'inline-block';
             event.target.style.display = 'none';
             event.target.blur();
         }
     });

     // TODO: Add persistence (localStorage) if needed later
}