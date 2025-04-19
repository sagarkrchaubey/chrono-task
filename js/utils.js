// js/utils.js

/**
 * Formats milliseconds into HH:MM:SS.ms
 * @param {number} time - Time in milliseconds
 * @returns {object} - Object with formatted hours, minutes, seconds, milliseconds
 */
export function formatTime(time) {
    const ms = Math.floor((time % 1000) / 10); // Display hundredths
    const totalSeconds = Math.floor(time / 1000);
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    return {
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
        milliseconds: ms.toString().padStart(2, '0') // Pad to 2 digits for hundredths
    };
}

/**
 * Formats total seconds into HH:MM:SS
 * @param {number} totalSeconds - Time in seconds
 * @returns {object} - Object with formatted hours, minutes, seconds
 */
export function formatTimeFromSeconds(totalSeconds) {
    const seconds = Math.floor(totalSeconds % 60);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const hours = Math.floor(totalMinutes / 60);

    return {
        hours: hours.toString().padStart(2, '0'),
        minutes: minutes.toString().padStart(2, '0'),
        seconds: seconds.toString().padStart(2, '0'),
    };
}

/**
 * Parses time string HH:MM:SS into total seconds
 * @param {string} timeString - Formatted time string
 * @returns {number} - Total seconds
 */
export function parseTimeToSeconds(timeString) {
    const parts = timeString.split(':');
    if (parts.length !== 3) return 0;
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    const seconds = parseInt(parts[2], 10) || 0;
    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Generates a simple unique ID
 * @returns {string}
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
}