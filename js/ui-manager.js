// UI management functions for messages, performance warnings, and display updates
import { DOM_ELEMENTS } from './constants.js';

/**
 * Displays a message in the message box.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', or 'info'.
 */
export function showMessage(message, type) {
    DOM_ELEMENTS.messageBox.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
    DOM_ELEMENTS.messageText.textContent = message;

    if (type === 'success') {
        DOM_ELEMENTS.messageBox.classList.add('bg-green-100', 'text-green-800');
    } else if (type === 'error') {
        DOM_ELEMENTS.messageBox.classList.add('bg-red-100', 'text-red-800');
    } else { // default to info
        DOM_ELEMENTS.messageBox.classList.add('bg-blue-100', 'text-blue-800');
    }

    // Hide message after 5 seconds
    setTimeout(() => {
        DOM_ELEMENTS.messageBox.classList.add('hidden');
    }, 5000);
}

/**
 * Shows the performance warning and disables real-time preview.
 * @param {object} state - Application state object
 */
export function showPerformanceWarning(state) {
    console.log('showPerformanceWarning called, isPerformanceModeActive:', state.isPerformanceModeActive);
    if (!state.isPerformanceModeActive) {
        console.log('Activating performance mode');
        state.isPerformanceModeActive = true;
        DOM_ELEMENTS.performanceWarning.classList.remove('hidden');

        // Disable real-time preview
        state.isRealtimePreviewEnabled = false;
        DOM_ELEMENTS.realtimePreviewToggle.checked = false;
        DOM_ELEMENTS.realtimePreviewToggle.classList.add('disabled');
        DOM_ELEMENTS.realtimePreviewToggle.parentElement.classList.add('disabled');

        // Show preview button
        DOM_ELEMENTS.previewButton.classList.remove('hidden');

        showMessage('Real-time preview disabled due to performance', 'info');
    }
}

/**
 * Hides the performance warning.
 */
export function hidePerformanceWarning() {
    DOM_ELEMENTS.performanceWarning.classList.add('hidden');
}

/**
 * Enables or disables real-time preview mode.
 * @param {boolean} enabled - Whether to enable real-time preview
 * @param {object} state - Application state object
 */
export function toggleRealtimePreview(enabled, state) {
    state.isRealtimePreviewEnabled = enabled;
    if (enabled) {
        DOM_ELEMENTS.previewButton.classList.add('hidden');
        DOM_ELEMENTS.realtimePreviewToggle.classList.remove('disabled');
        DOM_ELEMENTS.realtimePreviewToggle.parentElement.classList.remove('disabled');
        // Reset performance tracking when re-enabled
        state.performanceCheckCount = 0;
        state.totalProcessingTime = 0;
        state.isPerformanceModeActive = false;
    } else {
        DOM_ELEMENTS.previewButton.classList.remove('hidden');
    }
}

/**
 * Updates the color display elements with selected color information.
 * @param {object} color - RGB color object {r, g, b}
 * @param {Function} rgbToHex - RGB to hex conversion function
 */
export function updateColorDisplay(color, rgbToHex) {
    DOM_ELEMENTS.hexDisplay.textContent = rgbToHex(color.r, color.g, color.b);
    DOM_ELEMENTS.rgbDisplay.textContent = `rgb(${color.r}, ${color.g}, ${color.b})`;
    DOM_ELEMENTS.colorSwatch.style.backgroundColor = `rgb(${color.r}, ${color.g}, ${color.b})`;
}

/**
 * Updates the resolution display.
 * @param {number} width - Image width
 * @param {number} height - Image height
 */
export function updateResolutionDisplay(width, height) {
    DOM_ELEMENTS.resolutionDisplay.textContent = `${width} × ${height}`;
}

/**
 * Resets all UI controls to their default state.
 */
export function resetUIControls() {
    DOM_ELEMENTS.opacitySlider.value = 0;
    DOM_ELEMENTS.toleranceToggle.checked = true;
    DOM_ELEMENTS.toleranceSliderContainer.classList.remove('hidden');
    DOM_ELEMENTS.toleranceStrengthSlider.value = 20;
    DOM_ELEMENTS.antiAliasingToggle.checked = true;
    DOM_ELEMENTS.smoothingSliderContainer.classList.remove('hidden');
    DOM_ELEMENTS.smoothingFactorSlider.value = 1.0;
    DOM_ELEMENTS.colorReplacementToggle.checked = false;
    DOM_ELEMENTS.colorPickerContainer.classList.add('hidden');
    DOM_ELEMENTS.replacementColorPicker.value = '#ff0000';
    DOM_ELEMENTS.replacementColorDisplay.textContent = '#FF0000';
    DOM_ELEMENTS.hexDisplay.textContent = '#FFFFFF';
    DOM_ELEMENTS.rgbDisplay.textContent = 'rgb(255, 255, 255)';
    DOM_ELEMENTS.colorSwatch.style.backgroundColor = '#FFFFFF';
    
    // Reset value displays
    if (DOM_ELEMENTS.opacityValue) DOM_ELEMENTS.opacityValue.textContent = '0.0%';
    if (DOM_ELEMENTS.toleranceValue) DOM_ELEMENTS.toleranceValue.textContent = '20.0';
    if (DOM_ELEMENTS.smoothingValue) DOM_ELEMENTS.smoothingValue.textContent = '1.00';
}

/**
 * Resets preview settings to default state.
 * @param {object} state - Application state object
 */
export function resetPreviewSettings(state) {
    state.isRealtimePreviewEnabled = true;
    DOM_ELEMENTS.realtimePreviewToggle.checked = true;
    DOM_ELEMENTS.realtimePreviewToggle.classList.remove('disabled');
    DOM_ELEMENTS.realtimePreviewToggle.parentElement.classList.remove('disabled');
    DOM_ELEMENTS.previewButton.classList.add('hidden');
    hidePerformanceWarning();
    state.performanceCheckCount = 0;
    state.totalProcessingTime = 0;
    state.isPerformanceModeActive = false;
}

/**
 * Initializes a canvas with a placeholder message
 * @param {HTMLCanvasElement} canvas - The canvas element to initialize
 * @param {string} message - The message to display
 * @param {object} options - Optional styling options
 * @param {string} options.bgColor - Background color (default: '#e2e8f0')
 * @param {string} options.textColor - Text color (default: '#64748b')
 * @param {number} options.width - Canvas width (default: 600)
 * @param {number} options.height - Canvas height (default: 400)
 */
export function initializeCanvasWithPlaceholder(canvas, message = 'Upload an image to get started', 
    { bgColor = '#e2e8f0', textColor = '#64748b', width = 600, height = 400 } = {}) {
    
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = width;
    canvas.height = height;
    
    // Draw background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    
    // Draw text
    ctx.font = '24px Inter';
    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    ctx.fillText(message, width / 2, height / 2);
    
    return canvas;
}