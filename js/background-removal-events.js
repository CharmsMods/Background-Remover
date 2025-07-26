// Event handlers for background removal tab
import { DOM_ELEMENTS } from './constants.js';
import { copyToClipboard } from './utils.js';
import { showMessage, toggleRealtimePreview, hidePerformanceWarning, resetUIControls, resetPreviewSettings } from './ui-manager.js';

/**
 * Sets up event listeners for background removal tab
 */
export function setupBackgroundRemovalEvents(backgroundProcessor, tabManager, memoryManager) {
    
    // Value display update functions
    function updateOpacityDisplay() {
        const value = parseFloat(DOM_ELEMENTS.opacitySlider.value);
        const percentage = (value * 100).toFixed(1);
        if (DOM_ELEMENTS.opacityValue) {
            DOM_ELEMENTS.opacityValue.textContent = `${percentage}%`;
        }
    }

    function updateToleranceDisplay() {
        const value = parseFloat(DOM_ELEMENTS.toleranceStrengthSlider.value);
        if (DOM_ELEMENTS.toleranceValue) {
            DOM_ELEMENTS.toleranceValue.textContent = value.toFixed(1);
        }
    }

    function updateSmoothingDisplay() {
        const value = parseFloat(DOM_ELEMENTS.smoothingFactorSlider.value);
        if (DOM_ELEMENTS.smoothingValue) {
            DOM_ELEMENTS.smoothingValue.textContent = value.toFixed(2);
        }
    }

    // Initialize displays
    updateOpacityDisplay();
    updateToleranceDisplay();
    updateSmoothingDisplay();

    // Image upload
    DOM_ELEMENTS.imageUpload.addEventListener('change', async (event) => {
        try {
            const result = await backgroundProcessor.loadImage(event.target.files[0]);
            
            // Save to tab manager
            tabManager.saveTabState('background', result.imageData, result.originalImage);
            
            // Reset UI controls
            resetUIControls();
            resetPreviewSettings(backgroundProcessor);
            
            // Show memory management modal
            setTimeout(() => {
                memoryManager.showMemoryModal('background');
            }, 500); // Small delay to let the image load complete
            
        } catch (error) {
            console.error('Failed to load image:', error);
        }
    });

    // Color picking
    DOM_ELEMENTS.imageCanvas.addEventListener('click', (event) => {
        backgroundProcessor.pickColor(event);
        
        // Save current state
        const currentImageData = backgroundProcessor.getCurrentImageData();
        if (currentImageData) {
            tabManager.saveTabState('background', currentImageData, backgroundProcessor.originalImage);
        }
    });

    // Opacity slider
    DOM_ELEMENTS.opacitySlider.addEventListener('input', () => {
        updateOpacityDisplay();
        if (backgroundProcessor.isRealtimePreviewEnabled) {
            backgroundProcessor.applyFilter();
        }
    });

    // Tolerance toggle
    DOM_ELEMENTS.toleranceToggle.addEventListener('change', () => {
        if (DOM_ELEMENTS.toleranceToggle.checked) {
            DOM_ELEMENTS.toleranceSliderContainer.classList.remove('hidden');
        } else {
            DOM_ELEMENTS.toleranceSliderContainer.classList.add('hidden');
        }
        if (backgroundProcessor.isRealtimePreviewEnabled) {
            backgroundProcessor.applyFilter();
        }
    });

    // Tolerance strength slider
    DOM_ELEMENTS.toleranceStrengthSlider.addEventListener('input', () => {
        updateToleranceDisplay();
        if (backgroundProcessor.isRealtimePreviewEnabled) {
            backgroundProcessor.applyFilter();
        }
    });

    // Anti-aliasing toggle
    DOM_ELEMENTS.antiAliasingToggle.addEventListener('change', () => {
        if (DOM_ELEMENTS.antiAliasingToggle.checked) {
            DOM_ELEMENTS.smoothingSliderContainer.classList.remove('hidden');
        } else {
            DOM_ELEMENTS.smoothingSliderContainer.classList.add('hidden');
        }
        if (backgroundProcessor.isRealtimePreviewEnabled) {
            backgroundProcessor.applyFilter();
        }
    });

    // Smoothing factor slider
    DOM_ELEMENTS.smoothingFactorSlider.addEventListener('input', () => {
        updateSmoothingDisplay();
        if (backgroundProcessor.isRealtimePreviewEnabled) {
            backgroundProcessor.applyFilter();
        }
    });

    // Action buttons
    DOM_ELEMENTS.resetButton.addEventListener('click', () => {
        backgroundProcessor.reset();
        resetUIControls();
        resetPreviewSettings(backgroundProcessor);
        
        // Update tab manager state
        const currentImageData = backgroundProcessor.getCurrentImageData();
        if (currentImageData) {
            tabManager.saveTabState('background', currentImageData, backgroundProcessor.originalImage);
        }
    });

    DOM_ELEMENTS.applyButton.addEventListener('click', () => {
        backgroundProcessor.apply();
        resetUIControls();
        resetPreviewSettings(backgroundProcessor);
        
        // Update tab manager state
        const currentImageData = backgroundProcessor.getCurrentImageData();
        if (currentImageData) {
            tabManager.saveTabState('background', currentImageData, backgroundProcessor.originalImage);
        }
    });

    DOM_ELEMENTS.downloadButton.addEventListener('click', () => {
        backgroundProcessor.download();
    });

    // Copy buttons
    DOM_ELEMENTS.copyHexButton.addEventListener('click', () => {
        const hexValue = DOM_ELEMENTS.hexDisplay.textContent;
        copyToClipboard(hexValue, 'Hex', showMessage);
    });

    DOM_ELEMENTS.copyRgbButton.addEventListener('click', () => {
        const rgbValue = DOM_ELEMENTS.rgbDisplay.textContent;
        copyToClipboard(rgbValue, 'RGB', showMessage);
    });

    // Color replacement toggle
    DOM_ELEMENTS.colorReplacementToggle.addEventListener('change', () => {
        if (DOM_ELEMENTS.colorReplacementToggle.checked) {
            DOM_ELEMENTS.colorPickerContainer.classList.remove('hidden');
        } else {
            DOM_ELEMENTS.colorPickerContainer.classList.add('hidden');
        }
        if (backgroundProcessor.isRealtimePreviewEnabled) {
            backgroundProcessor.applyFilter();
        }
    });

    // Replacement color picker
    DOM_ELEMENTS.replacementColorPicker.addEventListener('input', () => {
        DOM_ELEMENTS.replacementColorDisplay.textContent = DOM_ELEMENTS.replacementColorPicker.value.toUpperCase();
        if (backgroundProcessor.isRealtimePreviewEnabled) {
            backgroundProcessor.applyFilter();
        }
    });

    // Real-time preview toggle
    DOM_ELEMENTS.realtimePreviewToggle.addEventListener('change', () => {
        const enabled = DOM_ELEMENTS.realtimePreviewToggle.checked;
        backgroundProcessor.setRealtimePreview(enabled);
        
        if (enabled) {
            DOM_ELEMENTS.previewButton.classList.add('hidden');
            DOM_ELEMENTS.realtimePreviewToggle.classList.remove('disabled');
            DOM_ELEMENTS.realtimePreviewToggle.parentElement.classList.remove('disabled');
        } else {
            DOM_ELEMENTS.previewButton.classList.remove('hidden');
        }
    });

    // Preview button
    DOM_ELEMENTS.previewButton.addEventListener('click', () => {
        backgroundProcessor.applyFilter(true);
    });

    // Dismiss performance warning
    DOM_ELEMENTS.dismissWarning.addEventListener('click', () => {
        hidePerformanceWarning();
    });

    // Auto-save current state periodically
    setInterval(() => {
        const currentImageData = backgroundProcessor.getCurrentImageData();
        if (currentImageData) {
            tabManager.saveTabState('background', currentImageData, backgroundProcessor.originalImage);
        }
    }, 3000);
}