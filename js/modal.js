// js/modal.js

import { formatTimeFromSeconds } from './utils.js';

const modalOverlay = document.getElementById('task-modal-overlay');
const modalContent = document.getElementById('task-modal-content');
const modalTitle = document.getElementById('modal-title');
const taskNameInput = document.getElementById('task-name-input');
const hoursInput = document.getElementById('task-hours-input');
const minutesInput = document.getElementById('task-minutes-input');
const secondsInput = document.getElementById('task-seconds-input');
const saveTaskBtn = document.getElementById('save-task-btn');
const cancelTaskBtn = document.getElementById('cancel-task-btn');
const closeModalBtn = document.getElementById('modal-close-btn');
const quickTimeButtons = document.querySelectorAll('.quick-time');

let currentTimerId = null;
let currentTaskId = null; // To know if we are editing or adding
let onSaveCallback = null; // Function to call after saving

/**
 * Opens the modal to add or edit a task.
 * @param {string} timerId - The ID of the parent timer.
 * @param {function} onSave - Callback function when saved (receives task data).
 * @param {object|null} taskData - Existing task data for editing { id, name, initialSeconds }.
 */
export function openTaskModal(timerId, onSave, taskData = null) {
    currentTimerId = timerId;
    onSaveCallback = onSave;

    if (taskData) {
        // Editing existing task
        currentTaskId = taskData.id;
        modalTitle.textContent = 'Edit Task';
        taskNameInput.value = taskData.name || ''; // Use existing name or empty
        const time = formatTimeFromSeconds(taskData.initialSeconds);
        hoursInput.value = time.hours;
        minutesInput.value = time.minutes;
        secondsInput.value = time.seconds;
    } else {
        // Adding new task
        currentTaskId = null; // Indicate new task
        modalTitle.textContent = 'Add New Task';
        taskNameInput.value = ''; // Clear name field
        // Default to 0 time
        hoursInput.value = '00';
        minutesInput.value = '00';
        secondsInput.value = '00';
    }

    // Reset validation/error states if any
    taskNameInput.classList.remove('error');
    // ... reset other input errors if needed

    modalOverlay.classList.add('active');
    taskNameInput.focus(); // Focus name field first
}

/** Closes the modal */
export function closeTaskModal() {
    modalOverlay.classList.remove('active');
    // Clear state
    currentTimerId = null;
    currentTaskId = null;
    onSaveCallback = null;
}

/** Handles saving the task data */
function handleSaveTask() {
    const name = taskNameInput.value.trim(); // Get and trim name
    const hours = parseInt(hoursInput.value, 10) || 0;
    const minutes = parseInt(minutesInput.value, 10) || 0;
    const seconds = parseInt(secondsInput.value, 10) || 0;

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;

    // Basic validation (optional: add more specific feedback)
    if (totalSeconds <= 0 && !name) {
         alert("Please enter a task name or set a duration greater than zero.");
         taskNameInput.focus();
         taskNameInput.classList.add('error'); // Example error indication
         return;
    }
     taskNameInput.classList.remove('error');


    if (onSaveCallback) {
        onSaveCallback({
            timerId: currentTimerId,
            taskId: currentTaskId, // Will be null for new tasks
            name: name, // Send the entered name
            totalSeconds: totalSeconds,
        });
    }
    closeTaskModal();
}

/** Handles quick time button clicks */
function handleQuickTimeClick(event) {
    const button = event.target.closest('.quick-time');
    if (!button) return;

    const minutes = parseInt(button.dataset.minutes, 10) || 0;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    hoursInput.value = hours.toString().padStart(2, '0');
    minutesInput.value = remainingMinutes.toString().padStart(2, '0');
    secondsInput.value = '00';
}

/** Validates numeric input fields */
function validateTimeInput(event) {
    const input = event.target;
    const min = parseInt(input.min, 10) || 0;
    const max = parseInt(input.max, 10); // max can be undefined (e.g., for hours)
    let value = parseInt(input.value, 10) || 0;

    if (value < min) value = min;
    if (max !== undefined && value > max) value = max;

    // Keep leading zero if needed (on blur or change, not input)
    // input.value = value.toString().padStart(2, '0'); -> Do this on blur/change instead
    input.value = value; // Update value during input
}

function formatTimeInputOnBlur(event) {
    const input = event.target;
     let value = parseInt(input.value, 10) || 0;
     const min = parseInt(input.min, 10) || 0;
     const max = parseInt(input.max, 10);

     if (value < min) value = min;
     if (max !== undefined && value > max) value = max;

     input.value = value.toString().padStart(2, '0');
}

/** Initialize modal event listeners */
export function setupModalListeners() {
    saveTaskBtn.addEventListener('click', handleSaveTask);
    cancelTaskBtn.addEventListener('click', closeTaskModal);
    closeModalBtn.addEventListener('click', closeTaskModal);

    // Close modal if clicking outside the content area
    modalOverlay.addEventListener('click', (event) => {
        if (event.target === modalOverlay) {
            closeTaskModal();
        }
    });

    // Quick time button listeners
    quickTimeButtons.forEach(button => {
        button.addEventListener('click', handleQuickTimeClick);
    });

    // Input validation listeners
    [hoursInput, minutesInput, secondsInput].forEach(input => {
        input.addEventListener('input', validateTimeInput);
        input.addEventListener('blur', formatTimeInputOnBlur); // Format on blur
    });
}