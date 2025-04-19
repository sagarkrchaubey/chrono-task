// js/stopwatch.js

import { formatTime } from './utils.js';

// DOM Elements
const hourDisplay = document.getElementById('sw-hours');
const minuteDisplay = document.getElementById('sw-minutes');
const secondDisplay = document.getElementById('sw-seconds');
const millisecondDisplay = document.getElementById('sw-milliseconds');
const startStopBtn = document.getElementById('sw-start-stop');
const lapBtn = document.getElementById('sw-lap');
const resetBtn = document.getElementById('sw-reset');
const lapList = document.getElementById('lap-list');
const clearLapsContainer = document.getElementById('clear-laps-container');
const clearLapsBtn = document.getElementById('clear-laps-btn');

// State Variables
let stopwatchInterval = null;
let startTime = 0;
let elapsedTime = 0;
let running = false;
let laps = [];
let lapCounter = 1;

/** Updates the stopwatch display elements */
function updateStopwatchDisplay() {
    const timeNow = Date.now();
    // Calculate time to display based on whether stopwatch is running
    const timeToDisplay = elapsedTime + (running ? timeNow - startTime : 0);
    const formattedTime = formatTime(timeToDisplay);

    hourDisplay.textContent = formattedTime.hours;
    minuteDisplay.textContent = formattedTime.minutes;
    secondDisplay.textContent = formattedTime.seconds;
    millisecondDisplay.textContent = formattedTime.milliseconds;
}

/** Starts or pauses the stopwatch */
function startStopwatch() {
    if (!running) {
        // Start/Resume
        startTime = Date.now(); // Set start time for this run segment
        // Use requestAnimationFrame for potentially smoother updates if needed,
        // but setInterval is fine for hundredths.
        stopwatchInterval = setInterval(updateStopwatchDisplay, 10); // Update every 10ms
        startStopBtn.textContent = 'Pause';
        startStopBtn.classList.remove('btn-primary');
        startStopBtn.classList.add('btn-danger'); // Use danger color for pause
        running = true;
        lapBtn.disabled = false;
        resetBtn.disabled = false;
        resetBtn.classList.remove('btn-disabled'); // Visual enable
    } else {
        // Pause
        clearInterval(stopwatchInterval);
        elapsedTime += Date.now() - startTime; // Add elapsed time from this segment
        startStopBtn.textContent = 'Resume';
        startStopBtn.classList.remove('btn-danger');
        startStopBtn.classList.add('btn-primary'); // Back to primary for resume
        running = false;
    }
}

/** Resets the stopwatch to zero */
function resetStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchInterval = null;
    elapsedTime = 0;
    startTime = 0;
    running = false;
    laps = [];
    lapCounter = 1;
    updateStopwatchDisplay(); // Update display to 00:00:00.00
    startStopBtn.textContent = 'Start';
    startStopBtn.classList.remove('btn-danger');
    startStopBtn.classList.add('btn-primary');
    lapBtn.disabled = true;
    resetBtn.disabled = true;
    resetBtn.classList.add('btn-disabled'); // Visual disable
    lapList.innerHTML = ''; // Clear lap display
    clearLapsContainer.style.display = 'none'; // Hide clear button
}

/** Records a lap time */
function recordLap() {
    if (!running) return; // Can only record laps while running

    const timeNow = Date.now();
    const currentTotalTime = elapsedTime + (timeNow - startTime);

    // Calculate time for this specific lap
    const previousTotalTime = laps.length > 0 ? laps[laps.length - 1].totalTime : 0;
    const lapDuration = currentTotalTime - previousTotalTime;

    const formattedTotal = formatTime(currentTotalTime);
    const formattedLap = formatTime(lapDuration);

    const lapData = {
        lapNumber: lapCounter,
        totalTime: currentTotalTime,
        lapTime: lapDuration,
        formattedTotal: `${formattedTotal.hours}:${formattedTotal.minutes}:${formattedTotal.seconds}.${formattedTotal.milliseconds}`,
        formattedLap: `${formattedLap.hours}:${formattedLap.minutes}:${formattedLap.seconds}.${formattedLap.milliseconds}`
    };
    laps.push(lapData);

    renderLapItem(lapData); // Add the new lap to the list
    lapCounter++;

    if (laps.length > 0) {
        clearLapsContainer.style.display = 'block'; // Show clear button
    }
}

/** Renders a single lap item in the list */
function renderLapItem(lapData) {
    const lapItem = document.createElement('div');
    lapItem.className = 'lap-item';

    // Calculate difference from previous lap *duration* for faster/slower indication
    let diffString = '';
    let diffClass = '';
    if (laps.length >= 2) {
        const prevLapDuration = laps[laps.length - 2].lapTime;
        const timeDiff = lapData.lapTime - prevLapDuration;
        if (timeDiff !== 0) { // Only show diff if there is one
             const formattedDiff = formatTime(Math.abs(timeDiff));
             const sign = timeDiff >= 0 ? '+' : '-';
             diffClass = timeDiff >= 0 ? 'slower' : 'faster';
             diffString = `
                 <span class="lap-diff ${diffClass}">
                     ${sign}${formattedDiff.hours}:${formattedDiff.minutes}:${formattedDiff.seconds}.${formattedDiff.milliseconds}
                 </span>`;
        }
    }


    lapItem.innerHTML = `
        <span class="lap-number">Lap ${lapData.lapNumber}</span>
        <div class="lap-time-details">
            ${diffString} <!-- Show diff first for better layout -->
            <span class="lap-time">${lapData.formattedLap}</span>
        </div>
    `;

    // Prepend to show newest laps at the top
    lapList.prepend(lapItem);
}

/** Clears all recorded laps */
function clearLaps() {
    laps = [];
    lapCounter = 1;
    lapList.innerHTML = '';
    clearLapsContainer.style.display = 'none';
}

/** Sets up event listeners for stopwatch controls */
export function setupStopwatch() {
    startStopBtn.addEventListener('click', startStopwatch);
    lapBtn.addEventListener('click', recordLap);
    resetBtn.addEventListener('click', resetStopwatch);
    clearLapsBtn.addEventListener('click', clearLaps);

    // Initial state
    updateStopwatchDisplay(); // Show 00:00:00.00
    lapBtn.disabled = true;
    resetBtn.disabled = true;
     resetBtn.classList.add('btn-disabled'); // Visual disable
    clearLapsContainer.style.display = 'none';
}