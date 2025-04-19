// js/audio.js

let audioContext;
let timerSoundBuffer;
let isAudioInitialized = false;

// Load the sound file
async function loadSound() {
    if (timerSoundBuffer) return; // Already loaded

    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const response = await fetch('audio/timer_complete.mp3');
        const arrayBuffer = await response.arrayBuffer();
        timerSoundBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("Timer sound loaded successfully.");
    } catch (error) {
        console.error("Error loading or decoding audio file:", error);
        // Optionally notify the user or disable sound features
    }
}

// Initialize audio on first user interaction (required by browsers)
export function initializeAudio() {
    if (isAudioInitialized || !window.AudioContext && !window.webkitAudioContext) return;

    const initAudio = async () => {
        if (audioContext && audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        await loadSound();
        isAudioInitialized = true;
        // Remove the event listener once initialized
        document.removeEventListener('click', initAudio, true);
        document.removeEventListener('keydown', initAudio, true);
         console.log("AudioContext resumed/initialized.");
    };

    // Add listeners for common interactions
    document.addEventListener('click', initAudio, { once: true, capture: true });
    document.addEventListener('keydown', initAudio, { once: true, capture: true });
}


/**
 * Plays the loaded timer completion sound.
 */
export function playTimerSound() {
    if (!isAudioInitialized || !audioContext || !timerSoundBuffer) {
        console.warn("Audio not initialized or sound not loaded. Cannot play sound.");
        // Attempt to initialize now if possible (might still fail if not user-initiated)
        if (!isAudioInitialized) initializeAudio();
        return;
    }

    // Ensure context is running (might be suspended)
    if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
            playSoundBuffer();
        });
    } else {
        playSoundBuffer();
    }
}

function playSoundBuffer() {
     try {
        const source = audioContext.createBufferSource();
        source.buffer = timerSoundBuffer;
        source.connect(audioContext.destination);
        source.start(0); // Play immediately
        console.log("Playing timer sound.");
    } catch (error) {
        console.error("Error playing sound:", error);
    }
}