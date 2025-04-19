// js/main.js

import { setupStopwatch } from './stopwatch.js';
import { setupTimerSection } from './timer.js';
import { setupModalListeners } from './modal.js';
import { initializeAudio } from './audio.js';

// DOM Elements
const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.app-section');
const themeToggleBtn = document.getElementById('theme-toggle');
const currentTimeDisplay = document.getElementById('current-time');
const body = document.body;

// --- Tab Switching ---
function setActiveTab(tabId) {
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    sections.forEach(section => {
        section.classList.toggle('active', section.id === `${tabId}-section`);
    });
    // Store active tab in localStorage
    localStorage.setItem('activeTab', tabId);
}

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        setActiveTab(tab.dataset.tab);
    });
});

// --- Theme Toggling ---
function applyTheme(isDark) {
    body.classList.toggle('dark-mode', isDark);
    themeToggleBtn.innerHTML = isDark ? '☀️' : '🌙'; // Update icon
    // Store theme preference
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

themeToggleBtn.addEventListener('click', () => {
    const isDarkMode = body.classList.contains('dark-mode');
    applyTheme(!isDarkMode); // Toggle the theme
});

// --- Current Time Display ---
function updateCurrentTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    currentTimeDisplay.textContent = `${hours}:${minutes}:${seconds}`;
}

// --- Initialization ---
function initializeApp() {
    console.log("Initializing ChronoTask App...");

    // Set initial theme based on localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme === 'dark' || (!savedTheme && prefersDark));

    // Set initial active tab based on localStorage or default to 'stopwatch'
    const savedTab = localStorage.getItem('activeTab') || 'stopwatch';
    setActiveTab(savedTab);

    // Setup features for each section
    setupStopwatch();
    setupTimerSection();
    setupModalListeners();

    // Initialize audio - requires user interaction first
    initializeAudio();

    // Start the current time clock
    updateCurrentTime(); // Initial display
    setInterval(updateCurrentTime, 1000); // Update every second

     // Handle keyboard shortcuts (optional)
     // document.addEventListener('keydown', handleShortcuts);

    console.log("App Initialized.");
}

// --- Keyboard Shortcuts (Example) ---
/*
function handleShortcuts(e) {
    // Example: Spacebar to start/stop active stopwatch/timer
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        const activeSection = document.querySelector('.app-section.active');
        if (activeSection.id === 'stopwatch-section') {
            document.getElementById('sw-start-stop').click();
        } else if (activeSection.id === 'timer-section') {
            // Find the first timer and toggle it (more complex logic needed for multiple timers)
             const firstTimerStartBtn = document.querySelector('#timers-list .start-pause-timer');
             if (firstTimerStartBtn) firstTimerStartBtn.click();
        }
    }
    // Add more shortcuts as needed (e.g., 'L' for lap, 'R' for reset)
}
*/

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', initializeApp);