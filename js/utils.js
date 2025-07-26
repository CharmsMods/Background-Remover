// Utility functions for color manipulation and calculations

/**
 * Converts RGB values to a Hexadecimal string.
 * @param {number} r - Red component (0-255).
 * @param {number} g - Green component (0-255).
 * @param {number} b - Blue component (0-255).
 * @returns {string} - Hexadecimal color string (e.g., "#RRGGBB").
 */
export function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Converts a hexadecimal color string to RGB values.
 * @param {string} hex - Hexadecimal color string (e.g., "#RRGGBB").
 * @returns {object} - RGB color object {r, g, b}.
 */
export function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Calculates perceptually uniform color distance between two RGB colors.
 * Uses weighted Euclidean distance that better matches human vision.
 * @param {object} color1 - {r, g, b}
 * @param {object} color2 - {r, g, b}
 * @returns {number} - The perceptual distance between the two colors.
 */
export function colorDistance(color1, color2) {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;

    // Perceptual weights: human eyes are more sensitive to green, less to blue
    // These weights provide better color matching for tolerance
    const rWeight = 0.3;
    const gWeight = 0.59; // Higher weight for green (human eye sensitivity)
    const bWeight = 0.11;

    return Math.sqrt(rWeight * dr * dr + gWeight * dg * dg + bWeight * db * db);
}

/**
 * Applies gamma correction to opacity for more natural-feeling transparency.
 * @param {number} opacity - Linear opacity value (0-1)
 * @returns {number} - Gamma-corrected opacity value
 */
export function applyOpacityGamma(opacity) {
    // Gamma of 2.2 makes opacity changes feel more natural
    return Math.pow(opacity, 2.2);
}

/**
 * Advanced interpolation function with multiple curve types.
 * @param {number} t - Progress value (0-1)
 * @param {number} smoothingFactor - Smoothing factor (0.1-1.0)
 * @returns {number} - Interpolated value with smooth falloff
 */
export function smoothInterpolation(t, smoothingFactor) {
    // Clamp t to [0, 1]
    t = Math.max(0, Math.min(1, t));

    if (smoothingFactor <= 0.3) {
        // Sharp transition - modified cosine
        return (1 - Math.cos(t * Math.PI)) / 2;
    } else if (smoothingFactor <= 0.7) {
        // Smooth transition - smoothstep function
        return t * t * (3 - 2 * t);
    } else {
        // Very smooth transition - smootherstep function
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
}

/**
 * Copies text to clipboard and shows feedback.
 * @param {string} text - The text to copy.
 * @param {string} type - The type of value being copied (for feedback message).
 * @param {Function} showMessage - Message display function
 */
export async function copyToClipboard(text, type, showMessage) {
    try {
        await navigator.clipboard.writeText(text);
        showMessage(`${type} value copied to clipboard!`, 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showMessage(`${type} value copied to clipboard!`, 'success');
        } catch (fallbackErr) {
            showMessage('Failed to copy to clipboard.', 'error');
        }
        document.body.removeChild(textArea);
    }
}