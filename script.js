// Image Color Fader - Main JavaScript File

// Get DOM elements
const imageUpload = document.getElementById('imageUpload');
const imageCanvas = document.getElementById('imageCanvas');
const ctx = imageCanvas.getContext('2d', { willReadFrequently: true }); // Optimize for frequent reads
const opacitySlider = document.getElementById('opacitySlider');
const toleranceToggle = document.getElementById('toleranceToggle');
const toleranceSliderContainer = document.getElementById('toleranceSliderContainer');
const toleranceStrengthSlider = document.getElementById('toleranceStrengthSlider');
const antiAliasingToggle = document.getElementById('antiAliasingToggle');
const smoothingSliderContainer = document.getElementById('smoothingSliderContainer');
const smoothingFactorSlider = document.getElementById('smoothingFactorSlider');
const hexDisplay = document.getElementById('hexDisplay');
const rgbDisplay = document.getElementById('rgbDisplay');
const resolutionDisplay = document.getElementById('resolutionDisplay');
const colorSwatch = document.getElementById('colorSwatch');
const resetButton = document.getElementById('resetButton');
const downloadButton = document.getElementById('downloadButton');
const applyButton = document.getElementById('applyButton');
const messageBox = document.getElementById('message-box');
const messageText = document.getElementById('message-text');
const copyHexButton = document.getElementById('copyHexButton');
const copyRgbButton = document.getElementById('copyRgbButton');
const colorReplacementToggle = document.getElementById('colorReplacementToggle');
const colorPickerContainer = document.getElementById('colorPickerContainer');
const replacementColorPicker = document.getElementById('replacementColorPicker');
const replacementColorDisplay = document.getElementById('replacementColorDisplay');
const realtimePreviewToggle = document.getElementById('realtimePreviewToggle');
const previewButton = document.getElementById('previewButton');
const performanceWarning = document.getElementById('performance-warning');
const dismissWarning = document.getElementById('dismiss-warning');

// Global variables to store image data and selected color
let originalImage = new Image();
let originalImageData = null;
let selectedColor = null; // {r, g, b}

// Performance tracking variables
let isRealtimePreviewEnabled = true;
let performanceCheckCount = 0;
let totalProcessingTime = 0;
let isPerformanceModeActive = false;

/**
 * Displays a message in the message box.
 * @param {string} message - The message to display.
 * @param {string} type - 'success', 'error', or 'info'.
 */
function showMessage(message, type) {
    messageBox.classList.remove('hidden', 'bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800', 'bg-blue-100', 'text-blue-800');
    messageText.textContent = message;

    if (type === 'success') {
        messageBox.classList.add('bg-green-100', 'text-green-800');
    } else if (type === 'error') {
        messageBox.classList.add('bg-red-100', 'text-red-800');
    } else { // default to info
        messageBox.classList.add('bg-blue-100', 'text-blue-800');
    }

    // Hide message after 5 seconds
    setTimeout(() => {
        messageBox.classList.add('hidden');
    }, 5000);
}

/**
 * Converts RGB values to a Hexadecimal string.
 * @param {number} r - Red component (0-255).
 * @param {number} g - Green component (0-255).
 * @param {number} b - Blue component (0-255).
 * @returns {string} - Hexadecimal color string (e.g., "#RRGGBB").
 */
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

/**
 * Converts a hexadecimal color string to RGB values.
 * @param {string} hex - Hexadecimal color string (e.g., "#RRGGBB").
 * @returns {object} - RGB color object {r, g, b}.
 */
function hexToRgb(hex) {
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
function colorDistance(color1, color2) {
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
function applyOpacityGamma(opacity) {
    // Gamma of 2.2 makes opacity changes feel more natural
    return Math.pow(opacity, 2.2);
}

/**
 * Advanced interpolation function with multiple curve types.
 * @param {number} t - Progress value (0-1)
 * @param {number} smoothingFactor - Smoothing factor (0.1-1.0)
 * @returns {number} - Interpolated value with smooth falloff
 */
function smoothInterpolation(t, smoothingFactor) {
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
 * Loads the selected image onto the canvas.
 * @param {Event} event - The file input change event.
 */
function loadImage(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        originalImage = new Image();
        originalImage.onload = function () {
            // Set canvas dimensions to match image
            imageCanvas.width = originalImage.width;
            imageCanvas.height = originalImage.height;
            // Update resolution display
            // Update resolution display
            resolutionDisplay.textContent = `${originalImage.width} × ${originalImage.height}`;
            // Draw the image
            ctx.drawImage(originalImage, 0, 0);
            // Store the original pixel data
            originalImageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
            showMessage('Image loaded successfully! Click on the image to pick a color.', 'success');
            // Reset selected color and sliders
            selectedColor = null;
            opacitySlider.value = 0;
            toleranceToggle.checked = true; // Enable tolerance toggle by default
            toleranceSliderContainer.classList.remove('hidden'); // Show tolerance slider
            toleranceStrengthSlider.value = 20; // Reset tolerance strength to new default
            antiAliasingToggle.checked = true; // Enable anti-aliasing toggle by default
            smoothingSliderContainer.classList.remove('hidden'); // Show smoothing slider
            smoothingFactorSlider.value = 1.0; // Reset smoothing factor to maximum
            colorReplacementToggle.checked = false; // Reset color replacement toggle
            colorPickerContainer.classList.add('hidden'); // Hide color picker
            replacementColorPicker.value = '#ff0000'; // Reset replacement color
            replacementColorDisplay.textContent = '#FF0000'; // Reset display
            // Reset preview settings
            isRealtimePreviewEnabled = true;
            realtimePreviewToggle.checked = true;
            realtimePreviewToggle.classList.remove('disabled');
            realtimePreviewToggle.parentElement.classList.remove('disabled');
            previewButton.classList.add('hidden');
            hidePerformanceWarning();
            performanceCheckCount = 0;
            totalProcessingTime = 0;
            isPerformanceModeActive = false;
            hexDisplay.textContent = '#FFFFFF';
            rgbDisplay.textContent = 'rgb(255, 255, 255)';
            // Don't reset resolution display here - we want to keep it when image loads
            colorSwatch.style.backgroundColor = '#FFFFFF';
        };
        originalImage.onerror = function () {
            showMessage('Could not load image. Please try a different file.', 'error');
        };
        originalImage.src = e.target.result;
    };
    reader.onerror = function () {
        showMessage('Error reading file. Please try again.', 'error');
    };
    reader.readAsDataURL(file);
}

/**
 * Picks a color from the canvas at the clicked coordinates.
 * @param {Event} event - The mouse click event on the canvas.
 */
function pickColor(event) {
    if (!originalImageData) {
        showMessage('Please upload an image first.', 'info');
        return;
    }

    // Get mouse coordinates relative to the canvas
    const rect = imageCanvas.getBoundingClientRect();
    const scaleX = imageCanvas.width / rect.width;
    const scaleY = imageCanvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    // Get pixel data at the clicked point
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    selectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

    // Display selected color
    hexDisplay.textContent = rgbToHex(selectedColor.r, selectedColor.g, selectedColor.b);
    rgbDisplay.textContent = `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`;
    colorSwatch.style.backgroundColor = `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`;

    // Apply filter immediately after picking color (always show preview for color picking)
    applyFilter(true);
    showMessage('Color picked! Adjust opacity or toggle tolerance.', 'info');
}

/**
 * Shows the performance warning and disables real-time preview.
 */
function showPerformanceWarning() {
    console.log('showPerformanceWarning called, isPerformanceModeActive:', isPerformanceModeActive);
    if (!isPerformanceModeActive) {
        console.log('Activating performance mode');
        isPerformanceModeActive = true;
        performanceWarning.classList.remove('hidden');

        // Disable real-time preview
        isRealtimePreviewEnabled = false;
        realtimePreviewToggle.checked = false;
        realtimePreviewToggle.classList.add('disabled');
        realtimePreviewToggle.parentElement.classList.add('disabled');

        // Show preview button
        previewButton.classList.remove('hidden');

        showMessage('Real-time preview disabled due to performance', 'info');
    }
}

/**
 * Hides the performance warning.
 */
function hidePerformanceWarning() {
    performanceWarning.classList.add('hidden');
}

/**
 * Enables or disables real-time preview mode.
 */
function toggleRealtimePreview(enabled) {
    isRealtimePreviewEnabled = enabled;
    if (enabled) {
        previewButton.classList.add('hidden');
        realtimePreviewToggle.classList.remove('disabled');
        realtimePreviewToggle.parentElement.classList.remove('disabled');
        // Reset performance tracking when re-enabled
        performanceCheckCount = 0;
        totalProcessingTime = 0;
        isPerformanceModeActive = false;
    } else {
        previewButton.classList.remove('hidden');
    }
}

/**
 * Applies the opacity filter to the image based on selected color, slider, and tolerance.
 * @param {boolean} forceUpdate - Force update even if real-time preview is disabled
 */
function applyFilter(forceUpdate = false) {
    // Skip if real-time preview is disabled and not forced
    if (!isRealtimePreviewEnabled && !forceUpdate) {
        return;
    }

    const startTime = performance.now();
    if (!originalImageData || !selectedColor) {
        // If no image or color selected, just draw the original image
        // This case handles initial load or after reset/apply before new color pick
        if (originalImage.src) {
            ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            ctx.drawImage(originalImage, 0, 0);
        }
        return;
    }

    // Create a mutable copy of the original image data
    const imageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
    );
    const data = imageData.data;
    const sliderVal = parseFloat(opacitySlider.value);
    const isToleranceMode = toleranceToggle.checked;
    const currentToleranceRadius = parseFloat(toleranceStrengthSlider.value);
    const isColorReplacement = colorReplacementToggle.checked;
    const replacementColor = isColorReplacement ? hexToRgb(replacementColorPicker.value) : null;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const originalAlpha = originalImageData.data[i + 3];

        if (isToleranceMode) {
            const currentPixelColor = { r, g, b };
            const dist = colorDistance(selectedColor, currentPixelColor);
            const isAntiAliasing = antiAliasingToggle.checked;

            if (dist <= currentToleranceRadius) {
                if (isColorReplacement) {
                    // Color replacement mode
                    if (isAntiAliasing) {
                        // Smooth color blending
                        const smoothingFactor = parseFloat(smoothingFactorSlider.value);
                        const fadeZone = currentToleranceRadius * smoothingFactor;
                        const coreZone = currentToleranceRadius - fadeZone;

                        if (dist <= coreZone) {
                            // Core zone: full color replacement
                            data[i] = replacementColor.r;
                            data[i + 1] = replacementColor.g;
                            data[i + 2] = replacementColor.b;
                            data[i + 3] = originalAlpha; // Keep original alpha
                        } else {
                            // Fade zone: blend between original and replacement color
                            const fadeProgress = (dist - coreZone) / fadeZone;
                            const smoothProgress = smoothInterpolation(fadeProgress, smoothingFactor);
                            const blendFactor = 1 - smoothProgress; // 1 to 0 (smooth falloff)

                            data[i] = Math.round(r + (replacementColor.r - r) * blendFactor);
                            data[i + 1] = Math.round(g + (replacementColor.g - g) * blendFactor);
                            data[i + 2] = Math.round(b + (replacementColor.b - b) * blendFactor);
                            data[i + 3] = originalAlpha;
                        }
                    } else {
                        // Sharp color replacement
                        data[i] = replacementColor.r;
                        data[i + 1] = replacementColor.g;
                        data[i + 2] = replacementColor.b;
                        data[i + 3] = originalAlpha;
                    }
                } else {
                    // Transparency mode (original behavior)
                    if (isAntiAliasing) {
                        const smoothingFactor = parseFloat(smoothingFactorSlider.value);
                        const fadeZone = currentToleranceRadius * smoothingFactor;
                        const coreZone = currentToleranceRadius - fadeZone;

                        if (dist <= coreZone) {
                            // Apply gamma-corrected opacity for more natural feel
                            const correctedOpacity = applyOpacityGamma(sliderVal);
                            data[i + 3] = originalAlpha * (1 - correctedOpacity);
                        } else {
                            const fadeProgress = (dist - coreZone) / fadeZone;
                            const smoothProgress = smoothInterpolation(fadeProgress, smoothingFactor);
                            const fadeFactor = 1 - smoothProgress;
                            const correctedOpacity = applyOpacityGamma(sliderVal);
                            data[i + 3] = originalAlpha * (1 - (correctedOpacity * fadeFactor));
                        }
                    } else {
                        // Apply gamma-corrected opacity for sharp transitions too
                        const correctedOpacity = applyOpacityGamma(sliderVal);
                        data[i + 3] = originalAlpha * (1 - correctedOpacity);
                    }
                }
            } else {
                // Outside tolerance, keep original pixel
                data[i + 3] = originalAlpha;
            }
        } else {
            // No tolerance mode, only affect exact color match
            if (r === selectedColor.r && g === selectedColor.g && b === selectedColor.b) {
                if (isColorReplacement) {
                    data[i] = replacementColor.r;
                    data[i + 1] = replacementColor.g;
                    data[i + 2] = replacementColor.b;
                    data[i + 3] = originalAlpha;
                } else {
                    // Apply gamma-corrected opacity for exact matches too
                    const correctedOpacity = applyOpacityGamma(sliderVal);
                    data[i + 3] = originalAlpha * (1 - correctedOpacity);
                }
            } else {
                data[i + 3] = originalAlpha;
            }
        }
    }

    ctx.putImageData(imageData, 0, 0);

    // Performance monitoring
    const endTime = performance.now();
    const processingTime = endTime - startTime;

    // Track performance only for real-time updates
    if (isRealtimePreviewEnabled && !forceUpdate) {
        performanceCheckCount++;
        totalProcessingTime += processingTime;

        // Debug logging
        console.log(`Processing time: ${processingTime.toFixed(2)}ms (Count: ${performanceCheckCount})`);

        // Check immediately if any single update takes too long
        if (processingTime > 750) {
            console.log('Single update exceeded threshold, disabling real-time preview');
            showPerformanceWarning();
        }
        // Also check average over last 2 updates for consistency
        else if (performanceCheckCount >= 2) {
            const averageTime = totalProcessingTime / performanceCheckCount;
            console.log(`Average processing time: ${averageTime.toFixed(2)}ms`);

            if (averageTime > 750) {
                console.log('Average performance threshold exceeded, disabling real-time preview');
                showPerformanceWarning();
            }
            // Reset counters
            performanceCheckCount = 0;
            totalProcessingTime = 0;
        }
    }
}

/**
 * Resets the image to its original state.
 */
function resetImage() {
    if (originalImage.src) {
        // Redraw original image onto canvas
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.drawImage(originalImage, 0, 0);
        // Re-capture original pixel data
        originalImageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
        // Reset controls and displays
        selectedColor = null;
        opacitySlider.value = 0;
        toleranceToggle.checked = true;
        toleranceSliderContainer.classList.remove('hidden');
        toleranceStrengthSlider.value = 20; // Reset tolerance strength to new default
        antiAliasingToggle.checked = true; // Enable anti-aliasing toggle by default
        smoothingSliderContainer.classList.remove('hidden'); // Show smoothing slider
        smoothingFactorSlider.value = 1.0; // Reset smoothing factor to maximum
        colorReplacementToggle.checked = false; // Reset color replacement toggle
        colorPickerContainer.classList.add('hidden'); // Hide color picker
        replacementColorPicker.value = '#ff0000'; // Reset replacement color
        replacementColorDisplay.textContent = '#FF0000'; // Reset display
        // Reset preview settings
        isRealtimePreviewEnabled = true;
        realtimePreviewToggle.checked = true;
        realtimePreviewToggle.classList.remove('disabled');
        realtimePreviewToggle.parentElement.classList.remove('disabled');
        previewButton.classList.add('hidden');
        hidePerformanceWarning();
        performanceCheckCount = 0;
        totalProcessingTime = 0;
        isPerformanceModeActive = false;
        hexDisplay.textContent = '#FFFFFF';
        rgbDisplay.textContent = 'rgb(255, 255, 255)';
        // Keep resolution display - image is still loaded, just reset to original
        colorSwatch.style.backgroundColor = '#FFFFFF';
        showMessage('Image reset to original state.', 'info');
    } else {
        showMessage('No image loaded to reset.', 'info');
    }
}

/**
 * Saves the current state of the canvas as the new original image data.
 */
function applyChanges() {
    if (!originalImageData) {
        showMessage('Please upload an image first.', 'info');
        return;
    }

    // Get the current image data from the canvas
    originalImageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);

    // Reset controls and displays for new selection
    selectedColor = null;
    opacitySlider.value = 0;
    toleranceToggle.checked = true;
    toleranceSliderContainer.classList.remove('hidden');
    toleranceStrengthSlider.value = 20; // Reset tolerance strength to new default
    antiAliasingToggle.checked = true; // Enable anti-aliasing toggle by default
    smoothingSliderContainer.classList.remove('hidden'); // Show smoothing slider
    smoothingFactorSlider.value = 1.0; // Reset smoothing factor to maximum
    colorReplacementToggle.checked = false; // Reset color replacement toggle
    colorPickerContainer.classList.add('hidden'); // Hide color picker
    replacementColorPicker.value = '#ff0000'; // Reset replacement color
    replacementColorDisplay.textContent = '#FF0000'; // Reset display
    // Reset preview settings
    isRealtimePreviewEnabled = true;
    realtimePreviewToggle.checked = true;
    realtimePreviewToggle.classList.remove('disabled');
    realtimePreviewToggle.parentElement.classList.remove('disabled');
    previewButton.classList.add('hidden');
    hidePerformanceWarning();
    performanceCheckCount = 0;
    totalProcessingTime = 0;
    isPerformanceModeActive = false;
    hexDisplay.textContent = '#FFFFFF';
    rgbDisplay.textContent = 'rgb(255, 255, 255)';
    // Keep resolution display - image is still loaded, just applied changes
    colorSwatch.style.backgroundColor = '#FFFFFF';

    showMessage('Current edits applied! You can now pick a new color on the modified image.', 'success');
}

/**
 * Downloads the current state of the canvas as a PNG image.
 */
function downloadImage() {
    if (!originalImageData) {
        showMessage('Please upload and edit an image first to download.', 'info');
        return;
    }

    const dataURL = imageCanvas.toDataURL('image/png'); // Get data URL of the canvas content
    const a = document.createElement('a'); // Create a temporary anchor element
    a.href = dataURL; // Set the href to the data URL
    a.download = 'edited-image.png'; // Set the download filename
    document.body.appendChild(a); // Append to body (required for Firefox)
    a.click(); // Programmatically click the anchor to trigger download
    document.body.removeChild(a); // Remove the temporary anchor
    showMessage('Image downloaded successfully!', 'success');
}

/**
 * Copies text to clipboard and shows feedback.
 * @param {string} text - The text to copy.
 * @param {string} type - The type of value being copied (for feedback message).
 */
async function copyToClipboard(text, type) {
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

// Event Listeners
imageUpload.addEventListener('change', loadImage);
imageCanvas.addEventListener('click', pickColor);
opacitySlider.addEventListener('input', () => {
    if (isRealtimePreviewEnabled) {
        applyFilter();
    }
}); // Use 'input' for real-time updates
toleranceToggle.addEventListener('change', () => {
    if (toleranceToggle.checked) {
        toleranceSliderContainer.classList.remove('hidden');
    } else {
        toleranceSliderContainer.classList.add('hidden');
    }
    if (isRealtimePreviewEnabled) {
        applyFilter(); // Apply filter when tolerance mode is toggled
    }
});
toleranceStrengthSlider.addEventListener('input', () => {
    if (isRealtimePreviewEnabled) {
        applyFilter();
    }
}); // New event listener for tolerance strength slider
antiAliasingToggle.addEventListener('change', () => {
    if (antiAliasingToggle.checked) {
        smoothingSliderContainer.classList.remove('hidden');
    } else {
        smoothingSliderContainer.classList.add('hidden');
    }
    if (isRealtimePreviewEnabled) {
        applyFilter(); // Apply filter when anti-aliasing is toggled
    }
});
smoothingFactorSlider.addEventListener('input', () => {
    if (isRealtimePreviewEnabled) {
        applyFilter();
    }
}); // Apply filter when smoothing factor changes
resetButton.addEventListener('click', resetImage);
downloadButton.addEventListener('click', downloadImage);
applyButton.addEventListener('click', applyChanges); // New event listener for apply button
copyHexButton.addEventListener('click', () => {
    const hexValue = hexDisplay.textContent;
    copyToClipboard(hexValue, 'Hex');
});
copyRgbButton.addEventListener('click', () => {
    const rgbValue = rgbDisplay.textContent;
    copyToClipboard(rgbValue, 'RGB');
});
colorReplacementToggle.addEventListener('change', () => {
    if (colorReplacementToggle.checked) {
        colorPickerContainer.classList.remove('hidden');
    } else {
        colorPickerContainer.classList.add('hidden');
    }
    if (isRealtimePreviewEnabled) {
        applyFilter(); // Apply filter when color replacement is toggled
    }
});
replacementColorPicker.addEventListener('input', () => {
    replacementColorDisplay.textContent = replacementColorPicker.value.toUpperCase();
    if (isRealtimePreviewEnabled) {
        applyFilter(); // Apply filter when replacement color changes
    }
});

// Real-time preview toggle
realtimePreviewToggle.addEventListener('change', () => {
    toggleRealtimePreview(realtimePreviewToggle.checked);
});

// Preview button for manual updates
previewButton.addEventListener('click', () => {
    applyFilter(true); // Force update
});

// Dismiss performance warning
dismissWarning.addEventListener('click', () => {
    hidePerformanceWarning();
});

// Initial state: draw a placeholder if no image is loaded
window.onload = () => {
    if (!originalImage.src) {
        imageCanvas.width = 600;
        imageCanvas.height = 400;
        ctx.fillStyle = '#e2e8f0'; // Light gray placeholder background
        ctx.fillRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.font = '24px Inter';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b'; // Darker gray text
        ctx.fillText('Upload an image to get started', imageCanvas.width / 2, imageCanvas.height / 2);
    }
};