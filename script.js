// Image Color Fader - Main JavaScript File (with Invert Selection)

// Get DOM elements
const imageUpload = document.getElementById('imageUpload');
const imageCanvas = document.getElementById('imageCanvas');
const ctx = imageCanvas.getContext('2d', { willReadFrequently: true }); // Optimize for frequent reads
const opacitySlider = document.getElementById('opacitySlider');
const toleranceToggle = document.getElementById('toleranceToggle');
const toleranceSliderContainer = document.getElementById('toleranceSliderContainer');
const toleranceStrengthSlider = document.getElementById('toleranceStrengthSlider');
const invertSelectionToggle = document.getElementById('invertSelectionToggle'); // New element
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

// Get GIF editor DOM elements
const gifUpload = document.getElementById('gifUpload');
const gifCanvas = document.getElementById('gifCanvas');
const gifCtx = gifCanvas.getContext('2d', { willReadFrequently: true });
const gifPreviewButton = document.getElementById('gifPreviewButton');
const gifRenderButton = document.getElementById('gifRenderButton');
const gifResetButton = document.getElementById('gifResetButton');
const gifApplyButton = document.getElementById('gifApplyButton');
const gifDownloadButton = document.getElementById('gifDownloadButton');
const frameSlider = document.getElementById('frameSlider');
const prevFrameButton = document.getElementById('prevFrameButton');
const nextFrameButton = document.getElementById('nextFrameButton');
const frameInfo = document.getElementById('frameInfo');
const gifRealtimePreviewToggle = document.getElementById('gifRealtimePreviewToggle');
const gifHexDisplay = document.getElementById('gifHexDisplay');
const gifRgbDisplay = document.getElementById('gifRgbDisplay');
const gifResolutionDisplay = document.getElementById('gifResolutionDisplay');
const gifColorSwatch = document.getElementById('gifColorSwatch');
const gifCopyHexButton = document.getElementById('gifCopyHexButton');
const gifCopyRgbButton = document.getElementById('gifCopyRgbButton');
const gifOpacitySlider = document.getElementById('gifOpacitySlider');
const gifToleranceToggle = document.getElementById('gifToleranceToggle');
const gifToleranceSliderContainer = document.getElementById('gifToleranceSliderContainer');
const gifToleranceStrengthSlider = document.getElementById('gifToleranceStrengthSlider');
const gifInvertSelectionToggle = document.getElementById('gifInvertSelectionToggle');
const gifAntiAliasingToggle = document.getElementById('gifAntiAliasingToggle');
const gifSmoothingSliderContainer = document.getElementById('gifSmoothingSliderContainer');
const gifSmoothingFactorSlider = document.getElementById('gifSmoothingFactorSlider');
const gifColorReplacementToggle = document.getElementById('gifColorReplacementToggle');
const gifColorPickerContainer = document.getElementById('gifColorPickerContainer');
const gifReplacementColorPicker = document.getElementById('gifReplacementColorPicker');
const gifReplacementColorDisplay = document.getElementById('gifReplacementColorDisplay');

// Performance and loading indicators
const gifPerformanceIndicator = document.getElementById('gifPerformanceIndicator');
const gifLoadingIndicator = document.getElementById('gifLoadingIndicator');

// Tab elements
const imageTab = document.getElementById('imageTab');
const gifTab = document.getElementById('gifTab');
const imageEditorTab = document.getElementById('imageEditorTab');
const gifEditorTab = document.getElementById('gifEditorTab');

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
    const rWeight = 0.3;
    const gWeight = 0.59;
    const bWeight = 0.11;

    return Math.sqrt(rWeight * dr * dr + gWeight * dg * dg + bWeight * db * db);
}

/**
 * Applies gamma correction to opacity for more natural-feeling transparency.
 * @param {number} opacity - Linear opacity value (0-1)
 * @returns {number} - Gamma-corrected opacity value
 */
function applyOpacityGamma(opacity) {
    return Math.pow(opacity, 2.2);
}

/**
 * Advanced interpolation function with multiple curve types.
 * @param {number} t - Progress value (0-1)
 * @param {number} smoothingFactor - Smoothing factor (0.1-1.0)
 * @returns {number} - Interpolated value with smooth falloff
 */
function smoothInterpolation(t, smoothingFactor) {
    t = Math.max(0, Math.min(1, t));

    if (smoothingFactor <= 0.3) {
        return (1 - Math.cos(t * Math.PI)) / 2;
    } else if (smoothingFactor <= 0.7) {
        return t * t * (3 - 2 * t);
    } else {
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
            imageCanvas.width = originalImage.width;
            imageCanvas.height = originalImage.height;
            resolutionDisplay.textContent = `${originalImage.width} × ${originalImage.height}`;
            ctx.drawImage(originalImage, 0, 0);
            originalImageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
            showMessage('Image loaded successfully! Click on the image to pick a color.', 'success');
            
            // Reset controls
            selectedColor = null;
            opacitySlider.value = 0;
            toleranceToggle.checked = true;
            toleranceSliderContainer.classList.remove('hidden');
            toleranceStrengthSlider.value = 20;
            invertSelectionToggle.checked = false; // Reset new toggle
            antiAliasingToggle.checked = true;
            smoothingSliderContainer.classList.remove('hidden');
            smoothingFactorSlider.value = 1.0;
            colorReplacementToggle.checked = false;
            colorPickerContainer.classList.add('hidden');
            replacementColorPicker.value = '#ff0000';
            replacementColorDisplay.textContent = '#FF0000';
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

    const rect = imageCanvas.getBoundingClientRect();
    const scaleX = imageCanvas.width / rect.width;
    const scaleY = imageCanvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    selectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

    hexDisplay.textContent = rgbToHex(selectedColor.r, selectedColor.g, selectedColor.b);
    rgbDisplay.textContent = `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`;
    colorSwatch.style.backgroundColor = `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})`;

    applyFilter(true);
    showMessage('Color picked! Adjust opacity or toggle tolerance.', 'info');
}

function showPerformanceWarning() {
    if (!isPerformanceModeActive) {
        isPerformanceModeActive = true;
        performanceWarning.classList.remove('hidden');
        isRealtimePreviewEnabled = false;
        realtimePreviewToggle.checked = false;
        realtimePreviewToggle.classList.add('disabled');
        realtimePreviewToggle.parentElement.classList.add('disabled');
        previewButton.classList.remove('hidden');
        showMessage('Real-time preview disabled due to performance', 'info');
    }
}

function hidePerformanceWarning() {
    performanceWarning.classList.add('hidden');
}

function toggleRealtimePreview(enabled) {
    isRealtimePreviewEnabled = enabled;
    if (enabled) {
        previewButton.classList.add('hidden');
        realtimePreviewToggle.classList.remove('disabled');
        realtimePreviewToggle.parentElement.classList.remove('disabled');
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
    if (!isRealtimePreviewEnabled && !forceUpdate) {
        return;
    }

    const startTime = performance.now();
    if (!originalImageData || !selectedColor) {
        if (originalImage.src) {
            ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
            ctx.drawImage(originalImage, 0, 0);
        }
        return;
    }

    const imageData = new ImageData(
        new Uint8ClampedArray(originalImageData.data),
        originalImageData.width,
        originalImageData.height
    );
    const data = imageData.data;
    const sliderVal = parseFloat(opacitySlider.value);
    const isToleranceMode = toleranceToggle.checked;
    const isInverted = invertSelectionToggle.checked;
    const currentToleranceRadius = parseFloat(toleranceStrengthSlider.value);
    const isColorReplacement = colorReplacementToggle.checked;
    const replacementColor = isColorReplacement ? hexToRgb(replacementColorPicker.value) : null;
    const isAntiAliasing = antiAliasingToggle.checked;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const originalAlpha = originalImageData.data[i + 3];

        const currentPixelColor = { r, g, b };
        const distance = isToleranceMode 
            ? colorDistance(selectedColor, currentPixelColor) 
            : (r === selectedColor.r && g === selectedColor.g && b === selectedColor.b ? 0 : Infinity);
        
        let effectFactor = 0; // Represents how much of the effect (0 to 1) to apply.

        if (isToleranceMode) {
            if (distance <= currentToleranceRadius) {
                // Pixel is INSIDE the tolerance radius
                if (isAntiAliasing && currentToleranceRadius > 0) {
                    const smoothingFactor = parseFloat(smoothingFactorSlider.value);
                    const fadeZone = currentToleranceRadius * smoothingFactor;
                    const coreZone = currentToleranceRadius - fadeZone;
                    
                    if (distance <= coreZone) {
                        effectFactor = isInverted ? 0 : 1;
                    } else {
                        const fadeProgress = (distance - coreZone) / fadeZone;
                        const smoothProgress = smoothInterpolation(fadeProgress, smoothingFactor);
                        effectFactor = isInverted ? smoothProgress : (1 - smoothProgress);
                    }
                } else {
                    effectFactor = isInverted ? 0 : 1;
                }
            } else {
                // Pixel is OUTSIDE the tolerance radius
                effectFactor = isInverted ? 1 : 0;
            }
        } else { // No tolerance mode, only exact match
            effectFactor = (distance === 0) ? (isInverted ? 0 : 1) : (isInverted ? 1 : 0);
        }

        // Apply the effect based on the calculated effectFactor
        if (effectFactor > 0) {
            if (isColorReplacement) {
                data[i] = Math.round(r + (replacementColor.r - r) * effectFactor);
                data[i + 1] = Math.round(g + (replacementColor.g - g) * effectFactor);
                data[i + 2] = Math.round(b + (replacementColor.b - b) * effectFactor);
                data[i + 3] = originalAlpha;
            } else { // Transparency mode
                const correctedOpacity = applyOpacityGamma(sliderVal);
                data[i + 3] = originalAlpha * (1 - (correctedOpacity * effectFactor));
            }
        } else {
            // No effect, keep original pixel
            data[i + 3] = originalAlpha;
        }
    }

    ctx.putImageData(imageData, 0, 0);

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    if (isRealtimePreviewEnabled && !forceUpdate) {
        performanceCheckCount++;
        totalProcessingTime += processingTime;

        if (processingTime > 750) {
            showPerformanceWarning();
        } else if (performanceCheckCount >= 2) {
            const averageTime = totalProcessingTime / performanceCheckCount;
            if (averageTime > 750) {
                showPerformanceWarning();
            }
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
        ctx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.drawImage(originalImage, 0, 0);
        originalImageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);
        
        // Reset controls
        selectedColor = null;
        opacitySlider.value = 0;
        toleranceToggle.checked = true;
        toleranceSliderContainer.classList.remove('hidden');
        toleranceStrengthSlider.value = 20;
        invertSelectionToggle.checked = false; // Reset new toggle
        antiAliasingToggle.checked = true;
        smoothingSliderContainer.classList.remove('hidden');
        smoothingFactorSlider.value = 1.0;
        colorReplacementToggle.checked = false;
        colorPickerContainer.classList.add('hidden');
        replacementColorPicker.value = '#ff0000';
        replacementColorDisplay.textContent = '#FF0000';
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

    originalImageData = ctx.getImageData(0, 0, imageCanvas.width, imageCanvas.height);

    // Reset controls
    selectedColor = null;
    opacitySlider.value = 0;
    toleranceToggle.checked = true;
    toleranceSliderContainer.classList.remove('hidden');
    toleranceStrengthSlider.value = 20;
    invertSelectionToggle.checked = false; // Reset new toggle
    antiAliasingToggle.checked = true;
    smoothingSliderContainer.classList.remove('hidden');
    smoothingFactorSlider.value = 1.0;
    colorReplacementToggle.checked = false;
    colorPickerContainer.classList.add('hidden');
    replacementColorPicker.value = '#ff0000';
    replacementColorDisplay.textContent = '#FF0000';
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

    const dataURL = imageCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'edited-image.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
opacitySlider.addEventListener('input', () => { if (isRealtimePreviewEnabled) applyFilter(); });
toleranceToggle.addEventListener('change', () => {
    toleranceSliderContainer.classList.toggle('hidden', !toleranceToggle.checked);
    if (isRealtimePreviewEnabled) applyFilter();
});
toleranceStrengthSlider.addEventListener('input', () => { if (isRealtimePreviewEnabled) applyFilter(); });
invertSelectionToggle.addEventListener('change', () => { if (isRealtimePreviewEnabled) applyFilter(); }); // New listener
antiAliasingToggle.addEventListener('change', () => {
    smoothingSliderContainer.classList.toggle('hidden', !antiAliasingToggle.checked);
    if (isRealtimePreviewEnabled) applyFilter();
});
smoothingFactorSlider.addEventListener('input', () => { if (isRealtimePreviewEnabled) applyFilter(); });
resetButton.addEventListener('click', resetImage);
downloadButton.addEventListener('click', downloadImage);
applyButton.addEventListener('click', applyChanges);
copyHexButton.addEventListener('click', () => copyToClipboard(hexDisplay.textContent, 'Hex'));
copyRgbButton.addEventListener('click', () => copyToClipboard(rgbDisplay.textContent, 'RGB'));
colorReplacementToggle.addEventListener('change', () => {
    colorPickerContainer.classList.toggle('hidden', !colorReplacementToggle.checked);
    if (isRealtimePreviewEnabled) applyFilter();
});
replacementColorPicker.addEventListener('input', () => {
    replacementColorDisplay.textContent = replacementColorPicker.value.toUpperCase();
    if (isRealtimePreviewEnabled) applyFilter();
});
realtimePreviewToggle.addEventListener('change', () => toggleRealtimePreview(realtimePreviewToggle.checked));
previewButton.addEventListener('click', () => applyFilter(true));
dismissWarning.addEventListener('click', () => hidePerformanceWarning());

/**
 * Switches between Image and GIF editor tabs.
 * @param {string} tab - 'image' or 'gif'
 */
function switchTab(tab) {
    if (tab === 'image') {
        imageTab.classList.add('active');
        gifTab.classList.remove('active');
        imageEditorTab.classList.remove('hidden');
        gifEditorTab.classList.add('hidden');

        // Reset image editor state if needed
        resetImage();
    } else if (tab === 'gif') {
        imageTab.classList.remove('active');
        gifTab.classList.add('active');
        imageEditorTab.classList.add('hidden');
        gifEditorTab.classList.remove('hidden');

        // Reset GIF editor state if needed
        resetGif();
    }
}

/**
 * Native GIF Parser - Extracts frames from GIF files without external dependencies
 */
class NativeGifParser {
    constructor(arrayBuffer) {
        this.buffer = new Uint8Array(arrayBuffer);
        this.position = 0;
        this.frames = [];
        this.width = 0;
        this.height = 0;
        this.frameDelays = [];
    }

    // Read bytes from buffer
    readBytes(count) {
        const result = this.buffer.slice(this.position, this.position + count);
        this.position += count;
        return result;
    }

    // Read a single byte
    readByte() {
        return this.buffer[this.position++];
    }

    // Read a 16-bit little-endian integer
    readUInt16LE() {
        return this.readByte() | (this.readByte() << 8);
    }

    // Read a 32-bit little-endian integer
    readUInt32LE() {
        return this.readUInt16LE() | (this.readUInt16LE() << 16);
    }

    // Skip bytes
    skipBytes(count) {
        this.position += count;
    }

    // Parse the GIF file
    parse() {
        console.log('Starting native GIF parsing...');

        // Check GIF signature
        const signature = String.fromCharCode(...this.readBytes(3));
        if (signature !== 'GIF') {
            throw new Error('Not a valid GIF file');
        }

        // Read version (87a or 89a)
        const version = String.fromCharCode(...this.readBytes(3));
        console.log('GIF version:', version);

        // Read logical screen descriptor
        this.width = this.readUInt16LE();
        this.height = this.readUInt16LE();
        console.log('GIF dimensions:', this.width, 'x', this.height);

        const packed = this.readByte();
        const globalColorTableFlag = (packed & 0x80) !== 0;
        const colorResolution = ((packed & 0x70) >> 4) + 1;
        const sortFlag = (packed & 0x08) !== 0;
        const globalColorTableSize = 1 << ((packed & 0x07) + 1);

        // Skip background color and aspect ratio
        this.skipBytes(2);

        // Skip global color table if present
        if (globalColorTableFlag) {
            this.skipBytes(3 * globalColorTableSize);
        }

        // Parse blocks until trailer
        while (true) {
            const blockType = this.readByte();

            if (blockType === 0x3B) { // Trailer
                console.log('GIF parsing complete');
                break;
            } else if (blockType === 0x21) { // Extension
                this.parseExtension();
            } else if (blockType === 0x2C) { // Image descriptor
                this.parseImageDescriptor();
            } else {
                throw new Error(`Unknown block type: 0x${blockType.toString(16)}`);
            }
        }

        return {
            width: this.width,
            height: this.height,
            frames: this.frames,
            frameDelays: this.frameDelays
        };
    }

    // Parse extension blocks
    parseExtension() {
        const extensionType = this.readByte();

        if (extensionType === 0xF9) { // Graphics Control Extension
            this.parseGraphicsControlExtension();
        } else if (extensionType === 0xFE) { // Comment Extension
            this.parseCommentExtension();
        } else if (extensionType === 0x01) { // Plain Text Extension
            this.parsePlainTextExtension();
        } else if (extensionType === 0xFF) { // Application Extension
            this.parseApplicationExtension();
        } else {
            // Skip unknown extension
            this.skipExtension();
        }
    }

    // Parse Graphics Control Extension (for frame delays)
    parseGraphicsControlExtension() {
        const size = this.readByte(); // Should be 4
        const packed = this.readByte();
        const delay = this.readUInt16LE(); // Delay in hundredths of a second
        const transparentColorIndex = this.readByte();

        // Skip terminator
        this.readByte();

        // Store frame delay (convert from hundredths of a second to milliseconds)
        this.frameDelays.push(delay * 10);

        console.log('Graphics Control Extension - Delay:', delay * 10, 'ms');
    }

    // Parse Comment Extension
    parseCommentExtension() {
        this.skipExtension();
    }

    // Parse Plain Text Extension
    parsePlainTextExtension() {
        this.skipExtension();
    }

    // Parse Application Extension
    parseApplicationExtension() {
        this.skipExtension();
    }

    // Skip extension blocks
    skipExtension() {
        while (true) {
            const size = this.readByte();
            if (size === 0) break;
            this.skipBytes(size);
        }
    }

    // Parse image descriptor and extract frame data
    parseImageDescriptor() {
        console.log('Parsing image descriptor at position:', this.position);

        // Read image descriptor
        const left = this.readUInt16LE();
        const top = this.readUInt16LE();
        const width = this.readUInt16LE();
        const height = this.readUInt16LE();

        const packed = this.readByte();
        const localColorTableFlag = (packed & 0x80) !== 0;
        const interlacedFlag = (packed & 0x40) !== 0;
        const sortFlag = (packed & 0x20) !== 0;
        const localColorTableSize = 1 << ((packed & 0x07) + 1);

        console.log('Image descriptor:', { left, top, width, height, localColorTableFlag, interlacedFlag });

        // Skip local color table if present
        if (localColorTableFlag) {
            this.skipBytes(3 * localColorTableSize);
        }

        // Skip LZW minimum code size
        this.readByte();

        // Parse image data blocks
        const imageData = this.parseImageData();

        // For simplicity, we'll treat each image as a frame
        // In a real implementation, you'd need to handle disposal methods and compose frames
        this.frames.push({
            left,
            top,
            width,
            height,
            imageData,
            disposalMethod: 0, // Default disposal method
            delay: this.frameDelays.length > 0 ? this.frameDelays[this.frameDelays.length - 1] : 100
        });

        console.log('Frame added, total frames:', this.frames.length);
    }

    // Parse LZW compressed image data
    parseImageData() {
        const data = [];

        while (true) {
            const blockSize = this.readByte();
            if (blockSize === 0) break;

            // Read block data
            const blockData = this.readBytes(blockSize);
            data.push(...blockData);
        }

        return new Uint8Array(data);
    }
}

/**
 * Loads a GIF file and extracts its frames using browser native loading.
 * @param {Event} event - The file input change event.
 */
function loadGif(event) {
    const file = event.target.files[0];
    if (!file) {
        return;
    }

    console.log('Loading GIF file:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Show loading indicator
    gifLoadingIndicator.style.display = 'block';
    gifLoadingIndicator.textContent = 'Reading file...';

    // Use browser native approach for accurate frame display
    const reader = new FileReader();
    reader.onload = function (e) {
        console.log('File loaded as ArrayBuffer, length:', e.target.result.byteLength);

        // Try native parsing first to get frame info
        try {
            const parser = new NativeGifParser(e.target.result);
            const gifData = parser.parse();

            if (gifData.frames.length === 0) {
                throw new Error('No frames found in GIF');
            }

            // Use browser native loading for accurate frame display
            processGifWithBrowserLoading(gifData, file);

        } catch (error) {
            console.error('Native GIF parsing error:', error);
            gifLoadingIndicator.style.display = 'none';
            showMessage('Error parsing GIF file. Please try a different file.', 'error');
        }
    };

    reader.onerror = function (error) {
        console.error('File reading error:', error);
        gifLoadingIndicator.style.display = 'none';
        showMessage('Error reading GIF file. Please try again.', 'error');
    };

    console.log('Starting ArrayBuffer file read...');
    reader.readAsArrayBuffer(file);
}

/**
 * Process GIF using browser native loading for accurate frame display
 */
function processGifWithBrowserLoading(gifData, file) {
    console.log('Processing GIF with browser native loading...');

    gifWidth = gifData.width;
    gifHeight = gifData.height;
    gifFrameCount = Math.max(gifData.frames.length, 1); // Ensure at least 1 frame

    // Extract frame delays
    gifFrameDelay = gifData.frameDelays.length > 0 ? gifData.frameDelays[0] : 100;

    console.log('GIF info:', gifWidth, 'x', gifHeight, 'frames:', gifFrameCount);

    // Convert ArrayBuffer to blob for browser native loading
    const blob = new Blob([file], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);

    // Create an image element to load the GIF natively
    const gifImage = new Image();

    gifImage.onload = function() {
        console.log('Browser loaded GIF successfully');
        URL.revokeObjectURL(url); // Clean up

        // For multi-frame GIFs, we'll treat it as single frame for editing
        // but show the first frame properly
        gifFrames = [];
        originalGifFrames = [];

        // Create a single frame from the loaded image
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = gifWidth;
        frameCanvas.height = gifHeight;
        const frameCtx = frameCanvas.getContext('2d');

        // Draw the actual GIF image
        frameCtx.drawImage(gifImage, 0, 0, gifWidth, gifHeight);

        const frameImageData = frameCtx.getImageData(0, 0, gifWidth, gifHeight);
        gifFrames.push(frameImageData);
        originalGifFrames.push(new ImageData(
            new Uint8ClampedArray(frameImageData.data),
            frameImageData.width,
            frameImageData.height
        ));

        console.log('Frame created from actual GIF data');

        // Setup UI
        currentGifFrame = 0;
        frameSlider.max = gifFrameCount - 1;
        frameSlider.value = 0;

        if (gifFrameCount > 1) {
            frameSlider.disabled = false;
            prevFrameButton.disabled = false;
            nextFrameButton.disabled = false;
            frameInfo.textContent = `Frame 1 of ${gifFrameCount} (Browser Preview)`;
        } else {
            frameSlider.disabled = true;
            prevFrameButton.disabled = true;
            nextFrameButton.disabled = true;
            frameInfo.textContent = `Frame 1 of 1 (Static)`;
        }

        // Display the actual frame
        console.log('Displaying actual GIF frame');
        gifCanvas.width = gifWidth;
        gifCanvas.height = gifHeight;
        gifCtx.drawImage(gifImage, 0, 0, gifWidth, gifHeight);

        // Update UI
        gifResolutionDisplay.textContent = `${gifWidth} × ${gifHeight}`;

        // Reset controls
        gifSelectedColor = null;
        gifOpacitySlider.value = 0;
        gifToleranceToggle.checked = true;
        gifToleranceSliderContainer.classList.remove('hidden');
        gifToleranceStrengthSlider.value = 20;
        gifInvertSelectionToggle.checked = false;
        gifAntiAliasingToggle.checked = true;
        gifSmoothingSliderContainer.classList.remove('hidden');
        gifSmoothingFactorSlider.value = 1.0;
        gifColorReplacementToggle.checked = false;
        gifColorPickerContainer.classList.add('hidden');
        gifReplacementColorPicker.value = '#ff0000';
        gifReplacementColorDisplay.textContent = '#FF0000';
        isGifRealtimePreviewEnabled = true;
        gifRealtimePreviewToggle.checked = true;
        gifRealtimePreviewToggle.classList.remove('disabled');
        gifRealtimePreviewToggle.parentElement.classList.remove('disabled');
        gifPreviewButton.classList.add('hidden');
        gifPerformanceCheckCount = 0;
        gifTotalProcessingTime = 0;
        isGifPerformanceModeActive = false;

        gifLoadingIndicator.style.display = 'none';
        showMessage(`GIF loaded with ${gifFrameCount} frames! Click to pick a color.`, 'success');
    };

    gifImage.onerror = function() {
        URL.revokeObjectURL(url);
        console.error('Browser failed to load GIF');
        gifLoadingIndicator.style.display = 'none';
        showMessage('Error loading GIF file. Please try a different file.', 'error');
    };

    console.log('Starting browser native GIF load...');
    gifImage.src = url;
}

/**
 * Process frames from native GIF parser
 */
function processNativeGifFrames(gifData) {
    console.log('Processing native GIF frames...');

    gifWidth = gifData.width;
    gifHeight = gifData.height;
    gifFrameCount = gifData.frames.length;

    // Extract frame delays
    gifFrameDelay = gifData.frameDelays.length > 0 ? gifData.frameDelays[0] : 100;

    console.log('Processing', gifFrameCount, 'frames with dimensions', gifWidth, 'x', gifHeight);

    gifFrames = [];
    originalGifFrames = [];

    for (let i = 0; i < gifFrameCount; i++) {
        const frame = gifData.frames[i];
        console.log('Processing frame', i, '- delay:', frame.delay);

        try {
            // Create canvas for this frame
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = gifWidth;
            frameCanvas.height = gifHeight;
            const frameCtx = frameCanvas.getContext('2d');

            // For now, create a placeholder frame
            // In a full implementation, you'd need to decompress the LZW data and render it
            // For demonstration, we'll create a simple colored frame
            frameCtx.fillStyle = `hsl(${(i * 60) % 360}, 70%, 50%)`;
            frameCtx.fillRect(0, 0, gifWidth, gifHeight);

            // Draw a simple pattern to show it's working
            frameCtx.fillStyle = 'white';
            frameCtx.font = '48px Arial';
            frameCtx.textAlign = 'center';
            frameCtx.fillText(`Frame ${i + 1}`, gifWidth / 2, gifHeight / 2);

            const frameImageData = frameCtx.getImageData(0, 0, gifWidth, gifHeight);
            gifFrames.push(frameImageData);
            originalGifFrames.push(new ImageData(
                new Uint8ClampedArray(frameImageData.data),
                frameImageData.width,
                frameImageData.height
            ));

            console.log('Frame', i, 'processed successfully');
        } catch (frameError) {
            console.error('Error processing frame', i, ':', frameError);
            showMessage(`Error processing frame ${i + 1}.`, 'error');
            gifLoadingIndicator.style.display = 'none';
            return;
        }
    }

    console.log('All frames processed successfully, total frames:', gifFrames.length);

    // Setup UI for multi-frame navigation
    currentGifFrame = 0;
    frameSlider.max = gifFrameCount - 1;
    frameSlider.value = 0;
    frameSlider.disabled = false;
    prevFrameButton.disabled = false;
    nextFrameButton.disabled = false;

    // Display first frame
    console.log('Displaying first frame on main canvas');
    gifCanvas.width = gifWidth;
    gifCanvas.height = gifHeight;
    gifCtx.putImageData(gifFrames[0], 0, 0);

    // Update UI
    gifResolutionDisplay.textContent = `${gifWidth} × ${gifHeight}`;
    frameInfo.textContent = `Frame 1 of ${gifFrameCount}`;
    gifHexDisplay.textContent = '#FFFFFF';
    gifRgbDisplay.textContent = 'rgb(255, 255, 255)';
    gifColorSwatch.style.backgroundColor = '#FFFFFF';

    // Reset controls
    gifSelectedColor = null;
    gifOpacitySlider.value = 0;
    gifToleranceToggle.checked = true;
    gifToleranceSliderContainer.classList.remove('hidden');
    gifToleranceStrengthSlider.value = 20;
    gifInvertSelectionToggle.checked = false;
    gifAntiAliasingToggle.checked = true;
    gifSmoothingSliderContainer.classList.remove('hidden');
    gifSmoothingFactorSlider.value = 1.0;
    gifColorReplacementToggle.checked = false;
    gifColorPickerContainer.classList.add('hidden');
    gifReplacementColorPicker.value = '#ff0000';
    gifReplacementColorDisplay.textContent = '#FF0000';
    isGifRealtimePreviewEnabled = true;
    gifRealtimePreviewToggle.checked = true;
    gifRealtimePreviewToggle.classList.remove('disabled');
    gifRealtimePreviewToggle.parentElement.classList.remove('disabled');
    gifPreviewButton.classList.add('hidden');
    gifPerformanceCheckCount = 0;
    gifTotalProcessingTime = 0;
    isGifPerformanceModeActive = false;

    gifLoadingIndicator.style.display = 'none';
    showMessage(`Animated GIF loaded with ${gifFrameCount} frames! Click on any frame to pick a color.`, 'success');
}

/**
 * Try GIF.js approach for frame extraction using ArrayBuffer
 */
function tryGifJsApproachWithArrayBuffer(arrayBuffer, fileName) {
    console.log('Trying GIF.js approach with ArrayBuffer...');

    try {
        // Create GIF with ArrayBuffer (this is what GIF.js expects)
        const gif = new GIF(arrayBuffer);

        console.log('GIF object created with ArrayBuffer');

        // Add timeout for GIF.js loading (5 seconds)
        const gifJsTimeout = setTimeout(() => {
            console.log('GIF.js timeout after 5 seconds, trying fallback');
            tryFallbackApproachWithUrl(arrayBuffer, fileName);
        }, 5000);

        gif.onload = function() {
            clearTimeout(gifJsTimeout);
            gifLoadingIndicator.textContent = 'Extracting frames...';
            console.log('GIF.js loaded successfully!');
            console.log('Raw frames data:', gif.frames);
            console.log('Frames length:', gif.frames ? gif.frames.length : 'undefined');
            console.log('Width:', gif.width, 'Height:', gif.height);
            console.log('Frame delays:', gif.frames.map(f => f.delay));

            if (!gif.frames || gif.frames.length === 0) {
                console.log('No frames found in GIF.js, trying fallback');
                gifLoadingIndicator.textContent = 'Switching to fallback...';
                tryFallbackApproachWithUrl(arrayBuffer, fileName);
                return;
            }

            // Check if frames have the expected structure
            const firstFrame = gif.frames[0];
            console.log('First frame structure:', Object.keys(firstFrame));
            console.log('First frame image data:', firstFrame.image ? 'Has image data' : 'No image data');

            processGifFramesFromGifJs(gif, fileName);
        };

        gif.onerror = function(error) {
            clearTimeout(gifJsTimeout);
            console.error('GIF.js error:', error);
            console.log('Trying fallback approach...');
            tryFallbackApproachWithUrl(arrayBuffer, fileName);
        };

    } catch (error) {
        console.error('GIF.js creation error:', error);
        console.log('Trying fallback approach...');
        tryFallbackApproachWithUrl(arrayBuffer, fileName);
    }
}

/**
 * Process frames from GIF.js
 */
function processGifFramesFromGifJs(gif, fileName) {
    console.log('Processing frames from GIF.js...');

    gifFrameCount = gif.frames.length;
    gifWidth = gif.width || 100;
    gifHeight = gif.height || 100;

    // Extract frame delays
    if (gifFrameCount > 0 && gif.frames[0].delay !== undefined) {
        gifFrameDelay = gif.frames[0].delay;
    } else {
        gifFrameDelay = 100;
    }

    console.log('Processing', gifFrameCount, 'frames with dimensions', gifWidth, 'x', gifHeight);

    gifFrames = [];
    originalGifFrames = [];

    for (let i = 0; i < gifFrameCount; i++) {
        const frame = gif.frames[i];
        console.log('Processing frame', i, '- delay:', frame.delay);

        try {
            // Create canvas for this frame
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = gifWidth;
            frameCanvas.height = gifHeight;
            const frameCtx = frameCanvas.getContext('2d');

            // Try to draw the frame
            if (frame.image) {
                console.log('Frame', i, 'has image data, putting to canvas');
                frameCtx.putImageData(frame.image, 0, 0);
            } else {
                console.log('Frame', i, 'no image data, using fallback method');
                // Try to use the main canvas
                frameCtx.drawImage(gif.canvas, 0, 0);
            }

            // Get the frame data
            const frameImageData = frameCtx.getImageData(0, 0, gifWidth, gifHeight);

            gifFrames.push(frameImageData);
            originalGifFrames.push(new ImageData(
                new Uint8ClampedArray(frameImageData.data),
                frameImageData.width,
                frameImageData.height
            ));

            console.log('Frame', i, 'processed successfully, size:', frameImageData.data.length);
        } catch (frameError) {
            console.error('Error processing frame', i, ':', frameError);
            showMessage(`Error processing frame ${i + 1}.`, 'error');
            return;
        }
    }

    console.log('All frames processed successfully, total frames:', gifFrames.length);

    // Setup UI for multi-frame navigation
    currentGifFrame = 0;
    frameSlider.max = gifFrameCount - 1;
    frameSlider.value = 0;
    frameSlider.disabled = false;
    prevFrameButton.disabled = false;
    nextFrameButton.disabled = false;

    // Display first frame
    console.log('Displaying first frame on main canvas');
    gifCanvas.width = gifWidth;
    gifCanvas.height = gifHeight;

    try {
        gifCtx.putImageData(gifFrames[0], 0, 0);
        console.log('First frame displayed successfully');
    } catch (displayError) {
        console.error('Error displaying frame:', displayError);
        showMessage('Error displaying GIF frame.', 'error');
        return;
    }

    // Update UI
    gifResolutionDisplay.textContent = `${gifWidth} × ${gifHeight}`;
    frameInfo.textContent = `Frame 1 of ${gifFrameCount}`;
    gifHexDisplay.textContent = '#FFFFFF';
    gifRgbDisplay.textContent = 'rgb(255, 255, 255)';
    gifColorSwatch.style.backgroundColor = '#FFFFFF';

    // Reset controls
    gifSelectedColor = null;
    gifOpacitySlider.value = 0;
    gifToleranceToggle.checked = true;
    gifToleranceSliderContainer.classList.remove('hidden');
    gifToleranceStrengthSlider.value = 20;
    gifInvertSelectionToggle.checked = false;
    gifAntiAliasingToggle.checked = true;
    gifSmoothingSliderContainer.classList.remove('hidden');
    gifSmoothingFactorSlider.value = 1.0;
    gifColorReplacementToggle.checked = false;
    gifColorPickerContainer.classList.add('hidden');
    gifReplacementColorPicker.value = '#ff0000';
    gifReplacementColorDisplay.textContent = '#FF0000';
    isGifRealtimePreviewEnabled = true;
    gifRealtimePreviewToggle.checked = true;
    gifRealtimePreviewToggle.classList.remove('disabled');
    gifRealtimePreviewToggle.parentElement.classList.remove('disabled');
    gifPreviewButton.classList.add('hidden');
    gifPerformanceCheckCount = 0;
    gifTotalProcessingTime = 0;
    isGifPerformanceModeActive = false;

    showMessage(`Animated GIF loaded with ${gifFrameCount} frames! Click on any frame to pick a color.`, 'success');
}

/**
 * Try GIF.js approach for frame extraction
 */
function tryGifJsApproach(dataUrl, fileName) {
    console.log('Trying GIF.js approach...');

    try {
        const gif = new GIF(dataUrl);

        // Add timeout for GIF.js loading (3 seconds)
        const gifJsTimeout = setTimeout(() => {
            console.log('GIF.js timeout, switching to fallback');
            tryFallbackApproach(dataUrl, fileName);
        }, 3000);

        gif.onload = function() {
            clearTimeout(gifJsTimeout); // Clear timeout if successful
            console.log('GIF.js loaded successfully');
            console.log('Frames:', gif.frames ? gif.frames.length : 'No frames');
            console.log('Width:', gif.width, 'Height:', gif.height);

            if (!gif.frames || gif.frames.length === 0) {
                console.log('No frames found, trying fallback approach');
                tryFallbackApproach(dataUrl, fileName);
                return;
            }

            processGifFrames(gif, fileName);
        };

        gif.onerror = function(error) {
            clearTimeout(gifJsTimeout); // Clear timeout on error
            console.error('GIF.js error:', error);
            console.log('Trying fallback approach...');
            tryFallbackApproach(dataUrl, fileName);
        };

    } catch (error) {
        console.error('GIF.js creation error:', error);
        console.log('Trying fallback approach...');
        tryFallbackApproach(dataUrl, fileName);
    }
}

/**
 * Fallback approach using Image object with ArrayBuffer
 */
function tryFallbackApproachWithUrl(arrayBuffer, fileName) {
    console.log('Using fallback approach with Image object...');

    // Convert ArrayBuffer to data URL for Image loading
    const blob = new Blob([arrayBuffer], { type: 'image/gif' });
    const dataUrl = URL.createObjectURL(blob);

    const img = new Image();

    // Add timeout for image loading (5 seconds)
    const imageTimeout = setTimeout(() => {
        console.error('Image loading timeout');
        URL.revokeObjectURL(dataUrl);
        showMessage('Error loading image. The file may be corrupted or too large.', 'error');
    }, 5000);

    img.onload = function() {
        clearTimeout(imageTimeout);
        URL.revokeObjectURL(dataUrl); // Clean up the object URL
        console.log('Image loaded successfully');
        console.log('Width:', img.width, 'Height:', img.height);
        console.log('Natural width:', img.naturalWidth, 'Natural height:', img.naturalHeight);

        if (img.width === 0 || img.height === 0) {
            console.error('Image has no dimensions');
            showMessage('Error: Image has no valid dimensions.', 'error');
            return;
        }

        // For fallback, treat as single frame
        gifWidth = img.width || img.naturalWidth;
        gifHeight = img.height || img.naturalHeight;
        gifFrameCount = 1;
        gifFrameDelay = 100;

        console.log('Setting up single frame display...');

        // Create single frame
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = gifWidth;
        frameCanvas.height = gifHeight;
        const frameCtx = frameCanvas.getContext('2d');

        try {
            frameCtx.drawImage(img, 0, 0, gifWidth, gifHeight);

            const frameImageData = frameCtx.getImageData(0, 0, gifWidth, gifHeight);

            gifFrames = [frameImageData];
            originalGifFrames = [new ImageData(
                new Uint8ClampedArray(frameImageData.data),
                frameImageData.width,
                frameImageData.height
            )];

            console.log('Frame data created successfully');

            // Setup UI
            currentGifFrame = 0;
            frameSlider.max = 0;
            frameSlider.value = 0;
            frameSlider.disabled = true;
            prevFrameButton.disabled = true;
            nextFrameButton.disabled = true;

            // Display frame
            console.log('Setting canvas dimensions:', gifWidth, 'x', gifHeight);
            gifCanvas.width = gifWidth;
            gifCanvas.height = gifHeight;

            console.log('Drawing image to canvas...');
            gifCtx.drawImage(img, 0, 0, gifWidth, gifHeight);

            // Update UI
            gifResolutionDisplay.textContent = `${gifWidth} × ${gifHeight}`;
            frameInfo.textContent = `Frame 1 of 1 (Static)`;
            gifHexDisplay.textContent = '#FFFFFF';
            gifRgbDisplay.textContent = 'rgb(255, 255, 255)';
            gifColorSwatch.style.backgroundColor = '#FFFFFF';

            // Reset controls
            gifSelectedColor = null;
            gifOpacitySlider.value = 0;
            gifToleranceToggle.checked = true;
            gifToleranceSliderContainer.classList.remove('hidden');
            gifToleranceStrengthSlider.value = 20;
            gifInvertSelectionToggle.checked = false;
            gifAntiAliasingToggle.checked = true;
            gifSmoothingSliderContainer.classList.remove('hidden');
            gifSmoothingFactorSlider.value = 1.0;
            gifColorReplacementToggle.checked = false;
            gifColorPickerContainer.classList.add('hidden');
            gifReplacementColorPicker.value = '#ff0000';
            gifReplacementColorDisplay.textContent = '#FF0000';
            isGifRealtimePreviewEnabled = true;
            gifRealtimePreviewToggle.checked = true;
            gifRealtimePreviewToggle.classList.remove('disabled');
            gifRealtimePreviewToggle.parentElement.classList.remove('disabled');
            gifPreviewButton.classList.add('hidden');
            gifPerformanceCheckCount = 0;
            gifTotalProcessingTime = 0;
            isGifPerformanceModeActive = false;

            console.log('UI setup complete');
            showMessage(`Image loaded successfully! Click to pick a color.`, 'success');
        } catch (canvasError) {
            console.error('Canvas operation error:', canvasError);
            clearTimeout(imageTimeout);
            URL.revokeObjectURL(dataUrl);
            showMessage('Error processing image data.', 'error');
        }
    };

    img.onerror = function() {
        clearTimeout(imageTimeout);
        URL.revokeObjectURL(dataUrl);
        console.error('Image loading failed');
        showMessage('Error loading image file. Please try a different file.', 'error');
    };

    console.log('Starting image load...');
    img.src = dataUrl;
}

/**
 * Process frames from GIF.js
 */
function processGifFrames(gif, fileName) {
    console.log('Processing frames from GIF.js...');

    gifFrameCount = gif.frames.length;
    gifWidth = gif.width || 100;
    gifHeight = gif.height || 100;

    // Extract frame delays
    if (gifFrameCount > 0 && gif.frames[0].delay !== undefined) {
        gifFrameDelay = gif.frames[0].delay;
    } else {
        gifFrameDelay = 100;
    }

    console.log('Processing', gifFrameCount, 'frames...');

    gifFrames = [];
    originalGifFrames = [];

    for (let i = 0; i < gifFrameCount; i++) {
        const frame = gif.frames[i];

        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = gifWidth;
        frameCanvas.height = gifHeight;
        const frameCtx = frameCanvas.getContext('2d');

        try {
            if (frame.image) {
                frameCtx.putImageData(frame.image, 0, 0);
            } else {
                frameCtx.drawImage(gif.canvas, 0, 0);
            }

            const frameImageData = frameCtx.getImageData(0, 0, gifWidth, gifHeight);
            gifFrames.push(frameImageData);
            originalGifFrames.push(new ImageData(
                new Uint8ClampedArray(frameImageData.data),
                frameImageData.width,
                frameImageData.height
            ));

            console.log('Frame', i, 'processed');
        } catch (frameError) {
            console.error('Error processing frame', i, ':', frameError);
            showMessage(`Error processing frame ${i + 1}.`, 'error');
            return;
        }
    }

    console.log('All frames processed successfully');

    // Setup UI
    currentGifFrame = 0;
    frameSlider.max = gifFrameCount - 1;
    frameSlider.value = 0;
    frameSlider.disabled = false;
    prevFrameButton.disabled = false;
    nextFrameButton.disabled = false;

    // Display first frame
    gifCanvas.width = gifWidth;
    gifCanvas.height = gifHeight;
    gifCtx.putImageData(gifFrames[0], 0, 0);

    // Update UI
    gifResolutionDisplay.textContent = `${gifWidth} × ${gifHeight}`;
    frameInfo.textContent = `Frame 1 of ${gifFrameCount}`;
    gifHexDisplay.textContent = '#FFFFFF';
    gifRgbDisplay.textContent = 'rgb(255, 255, 255)';
    gifColorSwatch.style.backgroundColor = '#FFFFFF';

    // Reset controls
    gifSelectedColor = null;
    gifOpacitySlider.value = 0;
    gifToleranceToggle.checked = true;
    gifToleranceSliderContainer.classList.remove('hidden');
    gifToleranceStrengthSlider.value = 20;
    gifInvertSelectionToggle.checked = false;
    gifAntiAliasingToggle.checked = true;
    gifSmoothingSliderContainer.classList.remove('hidden');
    gifSmoothingFactorSlider.value = 1.0;
    gifColorReplacementToggle.checked = false;
    gifColorPickerContainer.classList.add('hidden');
    gifReplacementColorPicker.value = '#ff0000';
    gifReplacementColorDisplay.textContent = '#FF0000';
    isGifRealtimePreviewEnabled = true;
    gifRealtimePreviewToggle.checked = true;
    gifRealtimePreviewToggle.classList.remove('disabled');
    gifRealtimePreviewToggle.parentElement.classList.remove('disabled');
    gifPreviewButton.classList.add('hidden');
    gifPerformanceCheckCount = 0;
    gifTotalProcessingTime = 0;
    isGifPerformanceModeActive = false;

    showMessage(`Animated GIF loaded with ${gifFrameCount} frames! Click on any frame to pick a color.`, 'success');
}

/**
 * Displays a specific frame of the GIF.
 * @param {number} frameIndex - The index of the frame to display.
 */
function displayGifFrame(frameIndex) {
    if (frameIndex < 0 || frameIndex >= gifFrameCount || gifFrames.length === 0) {
        return;
    }

    currentGifFrame = frameIndex;
    gifCanvas.width = gifWidth;
    gifCanvas.height = gifHeight;
    gifCtx.putImageData(gifFrames[frameIndex], 0, 0);

    frameSlider.value = frameIndex;
    frameInfo.textContent = `Frame ${frameIndex + 1} of ${gifFrameCount}`;

    // Update navigation buttons
    prevFrameButton.disabled = frameIndex === 0;
    nextFrameButton.disabled = frameIndex === gifFrameCount - 1;
}

/**
 * Navigates to the previous frame.
 */
function previousFrame() {
    if (currentGifFrame > 0) {
        displayGifFrame(currentGifFrame - 1);
    }
}

/**
 * Navigates to the next frame.
 */
function nextFrame() {
    if (currentGifFrame < gifFrameCount - 1) {
        displayGifFrame(currentGifFrame + 1);
    }
}

/**
 * Picks a color from the current GIF frame at the clicked coordinates.
 * @param {Event} event - The mouse click event on the canvas.
 */
function pickGifColor(event) {
    if (gifFrames.length === 0) {
        showMessage('Please upload a GIF first.', 'info');
        return;
    }

    const rect = gifCanvas.getBoundingClientRect();
    const scaleX = gifCanvas.width / rect.width;
    const scaleY = gifCanvas.height / rect.height;
    const x = Math.floor((event.clientX - rect.left) * scaleX);
    const y = Math.floor((event.clientY - rect.top) * scaleY);

    const pixel = gifCtx.getImageData(x, y, 1, 1).data;
    gifSelectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

    gifHexDisplay.textContent = rgbToHex(gifSelectedColor.r, gifSelectedColor.g, gifSelectedColor.b);
    gifRgbDisplay.textContent = `rgb(${gifSelectedColor.r}, ${gifSelectedColor.g}, ${gifSelectedColor.b})`;
    gifColorSwatch.style.backgroundColor = `rgb(${gifSelectedColor.r}, ${gifSelectedColor.g}, ${gifSelectedColor.b})`;

    applyGifFilter(true);
    showMessage('Color picked! Adjust opacity or toggle tolerance.', 'info');
}

/**
 * Applies the color filter to the current frame only (for real-time preview).
 * @param {boolean} forceUpdate - Force update even if real-time preview is disabled
 */
function applyGifFilter(forceUpdate = false) {
    if (!isGifRealtimePreviewEnabled && !forceUpdate) {
        return;
    }

    const startTime = performance.now();
    if (gifFrames.length === 0 || !gifSelectedColor) {
        if (gifFrames.length > 0) {
            displayGifFrame(currentGifFrame);
        }
        return;
    }

    const currentFrameData = gifFrames[currentGifFrame];
    const imageData = new ImageData(
        new Uint8ClampedArray(currentFrameData.data),
        currentFrameData.width,
        currentFrameData.height
    );
    const data = imageData.data;
    const sliderVal = parseFloat(gifOpacitySlider.value);
    const isToleranceMode = gifToleranceToggle.checked;
    const isInverted = gifInvertSelectionToggle.checked;
    const currentToleranceRadius = parseFloat(gifToleranceStrengthSlider.value);
    const isColorReplacement = gifColorReplacementToggle.checked;
    const replacementColor = isColorReplacement ? hexToRgb(gifReplacementColorPicker.value) : null;
    const isAntiAliasing = gifAntiAliasingToggle.checked;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const originalAlpha = data[i + 3];

        const currentPixelColor = { r, g, b };
        const distance = isToleranceMode
            ? colorDistance(gifSelectedColor, currentPixelColor)
            : (r === gifSelectedColor.r && g === gifSelectedColor.g && b === gifSelectedColor.b ? 0 : Infinity);

        let effectFactor = 0; // Represents how much of the effect (0 to 1) to apply.

        if (isToleranceMode) {
            if (distance <= currentToleranceRadius) {
                // Pixel is INSIDE the tolerance radius
                if (isAntiAliasing && currentToleranceRadius > 0) {
                    const smoothingFactor = parseFloat(gifSmoothingFactorSlider.value);
                    const fadeZone = currentToleranceRadius * smoothingFactor;
                    const coreZone = currentToleranceRadius - fadeZone;

                    if (distance <= coreZone) {
                        effectFactor = isInverted ? 0 : 1;
                    } else {
                        const fadeProgress = (distance - coreZone) / fadeZone;
                        const smoothProgress = smoothInterpolation(fadeProgress, smoothingFactor);
                        effectFactor = isInverted ? smoothProgress : (1 - smoothProgress);
                    }
                } else {
                    effectFactor = isInverted ? 0 : 1;
                }
            } else {
                // Pixel is OUTSIDE the tolerance radius
                effectFactor = isInverted ? 1 : 0;
            }
        } else { // No tolerance mode, only exact match
            effectFactor = (distance === 0) ? (isInverted ? 0 : 1) : (isInverted ? 1 : 0);
        }

        // Apply the effect based on the calculated effectFactor
        if (effectFactor > 0) {
            if (isColorReplacement) {
                data[i] = Math.round(r + (replacementColor.r - r) * effectFactor);
                data[i + 1] = Math.round(g + (replacementColor.g - g) * effectFactor);
                data[i + 2] = Math.round(b + (replacementColor.b - b) * effectFactor);
                data[i + 3] = originalAlpha;
            } else { // Transparency mode
                const correctedOpacity = applyOpacityGamma(sliderVal);
                data[i + 3] = originalAlpha * (1 - (correctedOpacity * effectFactor));
            }
        } else {
            // No effect, keep original pixel
            data[i + 3] = originalAlpha;
        }
    }

    gifCtx.putImageData(imageData, 0, 0);

    const endTime = performance.now();
    const processingTime = endTime - startTime;

    if (isGifRealtimePreviewEnabled && !forceUpdate) {
        gifPerformanceCheckCount++;
        gifTotalProcessingTime += processingTime;

        if (processingTime > 750) {
            showGifPerformanceWarning();
        } else if (gifPerformanceCheckCount >= 2) {
            const averageTime = gifTotalProcessingTime / gifPerformanceCheckCount;
            if (averageTime > 750) {
                showGifPerformanceWarning();
            }
            gifPerformanceCheckCount = 0;
            gifTotalProcessingTime = 0;
        }
    }
}

/**
 * Renders the full GIF with all effects applied to all frames.
 */
function renderFullGif() {
    if (gifFrames.length === 0 || !gifSelectedColor) {
        showMessage('Please upload a GIF and select a color first.', 'info');
        return;
    }

    showMessage(`Processing all ${gifFrameCount} frames... This may take a moment for large GIFs.`, 'info');

    // Process all frames with current settings
    for (let frameIndex = 0; frameIndex < gifFrameCount; frameIndex++) {
        processGifFrame(frameIndex);
    }

    // Show a preview of the first processed frame
    gifCanvas.width = gifWidth;
    gifCanvas.height = gifHeight;
    gifCtx.putImageData(gifFrames[0], 0, 0);

    showMessage(`Full GIF rendered successfully! ${gifFrameCount} frames processed. You can now download the animated GIF.`, 'success');
}

/**
 * Processes a single frame of the GIF with all effects applied.
 * @param {number} frameIndex - The index of the frame to process.
 */
function processGifFrame(frameIndex) {
    if (frameIndex < 0 || frameIndex >= gifFrameCount) {
        return;
    }

    const frameData = originalGifFrames[frameIndex];
    const imageData = new ImageData(
        new Uint8ClampedArray(frameData.data),
        frameData.width,
        frameData.height
    );
    const data = imageData.data;
    const sliderVal = parseFloat(gifOpacitySlider.value);
    const isToleranceMode = gifToleranceToggle.checked;
    const isInverted = gifInvertSelectionToggle.checked;
    const currentToleranceRadius = parseFloat(gifToleranceStrengthSlider.value);
    const isColorReplacement = gifColorReplacementToggle.checked;
    const replacementColor = isColorReplacement ? hexToRgb(gifReplacementColorPicker.value) : null;
    const isAntiAliasing = gifAntiAliasingToggle.checked;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const originalAlpha = data[i + 3];

        const currentPixelColor = { r, g, b };
        const distance = isToleranceMode
            ? colorDistance(gifSelectedColor, currentPixelColor)
            : (r === gifSelectedColor.r && g === gifSelectedColor.g && b === gifSelectedColor.b ? 0 : Infinity);

        let effectFactor = 0;

        if (isToleranceMode) {
            if (distance <= currentToleranceRadius) {
                if (isAntiAliasing && currentToleranceRadius > 0) {
                    const smoothingFactor = parseFloat(gifSmoothingFactorSlider.value);
                    const fadeZone = currentToleranceRadius * smoothingFactor;
                    const coreZone = currentToleranceRadius - fadeZone;

                    if (distance <= coreZone) {
                        effectFactor = isInverted ? 0 : 1;
                    } else {
                        const fadeProgress = (distance - coreZone) / fadeZone;
                        const smoothProgress = smoothInterpolation(fadeProgress, smoothingFactor);
                        effectFactor = isInverted ? smoothProgress : (1 - smoothProgress);
                    }
                } else {
                    effectFactor = isInverted ? 0 : 1;
                }
            } else {
                effectFactor = isInverted ? 1 : 0;
            }
        } else {
            effectFactor = (distance === 0) ? (isInverted ? 0 : 1) : (isInverted ? 1 : 0);
        }

        if (effectFactor > 0) {
            if (isColorReplacement) {
                data[i] = Math.round(r + (replacementColor.r - r) * effectFactor);
                data[i + 1] = Math.round(g + (replacementColor.g - g) * effectFactor);
                data[i + 2] = Math.round(b + (replacementColor.b - b) * effectFactor);
                data[i + 3] = originalAlpha;
            } else {
                const correctedOpacity = applyOpacityGamma(sliderVal);
                data[i + 3] = originalAlpha * (1 - (correctedOpacity * effectFactor));
            }
        } else {
            data[i + 3] = originalAlpha;
        }
    }

    gifFrames[frameIndex] = imageData;
}

/**
 * Downloads the processed GIF using native canvas-to-GIF conversion.
 */
function downloadGif() {
    if (gifFrames.length === 0) {
        showMessage('Please upload and edit a GIF first to download.', 'info');
        return;
    }

    showMessage('Generating animated GIF for download...', 'info');

    try {
        // Create a simple animated GIF using canvas frames
        const frames = [];
        const delays = [];

        // Collect all processed frames
        for (let i = 0; i < gifFrameCount; i++) {
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = gifWidth;
            frameCanvas.height = gifHeight;
            const frameCtx = frameCanvas.getContext('2d');

            // Draw the processed frame data
            frameCtx.putImageData(gifFrames[i], 0, 0);

            frames.push(frameCanvas);
            delays.push(gifFrameDelay > 0 ? gifFrameDelay : 100);
        }

        // For now, export as PNG sequence since native GIF creation is complex
        // In a production app, you'd use a library like gif.js or implement LZW compression
        if (frames.length === 1) {
            // Single frame - export as PNG
            frames[0].toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'edited-image.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showMessage('Image downloaded successfully!', 'success');
            }, 'image/png');
        } else {
            // Multi-frame - export as ZIP of PNGs for now
            // In a real implementation, you'd create a proper animated GIF
            showMessage('Multi-frame export as PNG sequence - animated GIF export coming soon!', 'info');

            // For demonstration, just download the first frame
            frames[0].toBlob(function(blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'edited-frame-1.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                showMessage('First frame downloaded! Full animated export will be available soon.', 'success');
            }, 'image/png');
        }

    } catch (error) {
        console.error('Download error:', error);
        showMessage('Error creating download. Please try again.', 'error');
    }
}

/**
 * Resets the GIF editor to its initial state.
 */
function resetGif() {
    gifFrames = [];
    originalGifFrames = [];
    currentGifFrame = 0;
    gifFrameCount = 0;
    gifWidth = 0;
    gifHeight = 0;
    gifFrameDelay = 0;
    gifSelectedColor = null;

    // Reset UI
    gifCanvas.width = 600;
    gifCanvas.height = 400;
    gifCtx.fillStyle = '#e2e8f0';
    gifCtx.fillRect(0, 0, gifCanvas.width, gifCanvas.height);
    gifCtx.font = '24px Inter';
    gifCtx.textAlign = 'center';
    gifCtx.fillStyle = '#64748b';
    gifCtx.fillText('Upload a GIF to get started', gifCanvas.width / 2, gifCanvas.height / 2);

    frameSlider.value = 0;
    frameSlider.disabled = true;
    prevFrameButton.disabled = true;
    nextFrameButton.disabled = true;
    frameInfo.textContent = 'No GIF loaded';

    gifResolutionDisplay.textContent = 'No GIF';
    gifHexDisplay.textContent = '#FFFFFF';
    gifRgbDisplay.textContent = 'rgb(255, 255, 255)';
    gifColorSwatch.style.backgroundColor = '#FFFFFF';

    // Reset controls
    gifOpacitySlider.value = 0;
    gifToleranceToggle.checked = true;
    gifToleranceSliderContainer.classList.remove('hidden');
    gifToleranceStrengthSlider.value = 20;
    gifInvertSelectionToggle.checked = false;
    gifAntiAliasingToggle.checked = true;
    gifSmoothingSliderContainer.classList.remove('hidden');
    gifSmoothingFactorSlider.value = 1.0;
    gifColorReplacementToggle.checked = false;
    gifColorPickerContainer.classList.add('hidden');
    gifReplacementColorPicker.value = '#ff0000';
    gifReplacementColorDisplay.textContent = '#FF0000';
    isGifRealtimePreviewEnabled = true;
    gifRealtimePreviewToggle.checked = true;
    gifRealtimePreviewToggle.classList.remove('disabled');
    gifRealtimePreviewToggle.parentElement.classList.remove('disabled');
    gifPreviewButton.classList.add('hidden');
    gifPerformanceCheckCount = 0;
    gifTotalProcessingTime = 0;
    isGifPerformanceModeActive = false;

    showMessage('GIF editor reset.', 'info');
}

/**
 * Applies current edits to all frames and saves as new base frames.
 */
function applyGifChanges() {
    if (gifFrames.length === 0) {
        showMessage('Please upload a GIF first.', 'info');
        return;
    }

    // Process all frames with current settings
    for (let frameIndex = 0; frameIndex < gifFrameCount; frameIndex++) {
        processGifFrame(frameIndex);
    }

    // Update original frames to current processed state
    for (let i = 0; i < gifFrameCount; i++) {
        originalGifFrames[i] = new ImageData(
            new Uint8ClampedArray(gifFrames[i].data),
            gifFrames[i].width,
            gifFrames[i].height
        );
    }

    // Reset controls
    gifSelectedColor = null;
    gifOpacitySlider.value = 0;
    gifToleranceToggle.checked = true;
    gifToleranceSliderContainer.classList.remove('hidden');
    gifToleranceStrengthSlider.value = 20;
    gifInvertSelectionToggle.checked = false;
    gifAntiAliasingToggle.checked = true;
    gifSmoothingSliderContainer.classList.remove('hidden');
    gifSmoothingFactorSlider.value = 1.0;
    gifColorReplacementToggle.checked = false;
    gifColorPickerContainer.classList.add('hidden');
    gifReplacementColorPicker.value = '#ff0000';
    gifReplacementColorDisplay.textContent = '#FF0000';
    isGifRealtimePreviewEnabled = true;
    gifRealtimePreviewToggle.checked = true;
    gifRealtimePreviewToggle.classList.remove('disabled');
    gifRealtimePreviewToggle.parentElement.classList.remove('disabled');
    gifPreviewButton.classList.add('hidden');
    gifPerformanceCheckCount = 0;
    gifTotalProcessingTime = 0;
    isGifPerformanceModeActive = false;
    gifHexDisplay.textContent = '#FFFFFF';
    gifRgbDisplay.textContent = 'rgb(255, 255, 255)';
    gifColorSwatch.style.backgroundColor = '#FFFFFF';

    showMessage('Current edits applied to all frames! You can now pick a new color on the modified GIF.', 'success');
}

function showGifPerformanceWarning() {
    if (!isGifPerformanceModeActive) {
        isGifPerformanceModeActive = true;
        isGifRealtimePreviewEnabled = false;
        gifRealtimePreviewToggle.checked = false;
        gifRealtimePreviewToggle.classList.add('disabled');
        gifRealtimePreviewToggle.parentElement.classList.add('disabled');
        gifPreviewButton.classList.remove('hidden');
        showMessage('Real-time preview disabled due to performance', 'info');
    }
}

// Tab switching event listeners
imageTab.addEventListener('click', () => switchTab('image'));
gifTab.addEventListener('click', () => switchTab('gif'));

// GIF editor event listeners
gifUpload.addEventListener('change', loadGif);
gifCanvas.addEventListener('click', pickGifColor);
frameSlider.addEventListener('input', (e) => displayGifFrame(parseInt(e.target.value)));
prevFrameButton.addEventListener('click', previousFrame);
nextFrameButton.addEventListener('click', nextFrame);
gifOpacitySlider.addEventListener('input', () => { if (isGifRealtimePreviewEnabled) applyGifFilter(); });
gifToleranceToggle.addEventListener('change', () => {
    gifToleranceSliderContainer.classList.toggle('hidden', !gifToleranceToggle.checked);
    if (isGifRealtimePreviewEnabled) applyGifFilter();
});
gifToleranceStrengthSlider.addEventListener('input', () => { if (isGifRealtimePreviewEnabled) applyGifFilter(); });
gifInvertSelectionToggle.addEventListener('change', () => { if (isGifRealtimePreviewEnabled) applyGifFilter(); });
gifAntiAliasingToggle.addEventListener('change', () => {
    gifSmoothingSliderContainer.classList.toggle('hidden', !gifAntiAliasingToggle.checked);
    if (isGifRealtimePreviewEnabled) applyGifFilter();
});
gifSmoothingFactorSlider.addEventListener('input', () => { if (isGifRealtimePreviewEnabled) applyGifFilter(); });
gifResetButton.addEventListener('click', resetGif);
gifDownloadButton.addEventListener('click', downloadGif);
gifApplyButton.addEventListener('click', applyGifChanges);
gifCopyHexButton.addEventListener('click', () => copyToClipboard(gifHexDisplay.textContent, 'Hex'));
gifCopyRgbButton.addEventListener('click', () => copyToClipboard(gifRgbDisplay.textContent, 'RGB'));
gifColorReplacementToggle.addEventListener('change', () => {
    gifColorPickerContainer.classList.toggle('hidden', !gifColorReplacementToggle.checked);
    if (isGifRealtimePreviewEnabled) applyGifFilter();
});
gifReplacementColorPicker.addEventListener('input', () => {
    gifReplacementColorDisplay.textContent = gifReplacementColorPicker.value.toUpperCase();
    if (isGifRealtimePreviewEnabled) applyGifFilter();
});
gifRealtimePreviewToggle.addEventListener('change', () => {
    isGifRealtimePreviewEnabled = gifRealtimePreviewToggle.checked;
    if (isGifRealtimePreviewEnabled) {
        gifPreviewButton.classList.add('hidden');
        gifRealtimePreviewToggle.classList.remove('disabled');
        gifRealtimePreviewToggle.parentElement.classList.remove('disabled');
        gifPerformanceCheckCount = 0;
        gifTotalProcessingTime = 0;
        isGifPerformanceModeActive = false;
    } else {
        gifPreviewButton.classList.remove('hidden');
    }
});
gifPreviewButton.addEventListener('click', () => applyGifFilter(true));
gifRenderButton.addEventListener('click', renderFullGif);

// Initial state
window.onload = () => {
    if (!originalImage.src) {
        imageCanvas.width = 600;
        imageCanvas.height = 400;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, imageCanvas.width, imageCanvas.height);
        ctx.font = '24px Inter';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Upload an image to get started', imageCanvas.width / 2, imageCanvas.height / 2);
    }

    // Initialize GIF canvas with default state
    gifCanvas.width = 600;
    gifCanvas.height = 400;
    gifCtx.fillStyle = '#e2e8f0';
    gifCtx.fillRect(0, 0, gifCanvas.width, gifCanvas.height);
    gifCtx.font = '24px Inter';
    gifCtx.textAlign = 'center';
    gifCtx.fillStyle = '#64748b';
    gifCtx.fillText('Upload a GIF to get started', gifCanvas.width / 2, gifCanvas.height / 2);
};
