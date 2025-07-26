// Event handlers for image editing tab
import { DOM_ELEMENTS } from './constants.js';
import { showMessage } from './ui-manager.js';

/**
 * Sets up event listeners for image editing tab
 */
export function setupImageEditingEvents(imageEditor, tabManager) {
    
    // Value display update functions
    function updateEditingValueDisplays() {
        if (DOM_ELEMENTS.brightnessValue) DOM_ELEMENTS.brightnessValue.textContent = DOM_ELEMENTS.brightnessSlider.value;
        if (DOM_ELEMENTS.contrastValue) DOM_ELEMENTS.contrastValue.textContent = DOM_ELEMENTS.contrastSlider.value;
        if (DOM_ELEMENTS.saturationValue) DOM_ELEMENTS.saturationValue.textContent = DOM_ELEMENTS.saturationSlider.value;
        if (DOM_ELEMENTS.hueValue) DOM_ELEMENTS.hueValue.textContent = DOM_ELEMENTS.hueSlider.value + '°';
        if (DOM_ELEMENTS.exposureValue) DOM_ELEMENTS.exposureValue.textContent = DOM_ELEMENTS.exposureSlider.value;
        if (DOM_ELEMENTS.highlightsValue) DOM_ELEMENTS.highlightsValue.textContent = DOM_ELEMENTS.highlightsSlider.value;
        if (DOM_ELEMENTS.shadowsValue) DOM_ELEMENTS.shadowsValue.textContent = DOM_ELEMENTS.shadowsSlider.value;
    }

    function getEditingSettings() {
        return {
            brightness: parseInt(DOM_ELEMENTS.brightnessSlider.value),
            contrast: parseInt(DOM_ELEMENTS.contrastSlider.value),
            saturation: parseInt(DOM_ELEMENTS.saturationSlider.value),
            hue: parseInt(DOM_ELEMENTS.hueSlider.value),
            exposure: parseInt(DOM_ELEMENTS.exposureSlider.value),
            highlights: parseInt(DOM_ELEMENTS.highlightsSlider.value),
            shadows: parseInt(DOM_ELEMENTS.shadowsSlider.value)
        };
    }

    function resetEditingSliders() {
        DOM_ELEMENTS.brightnessSlider.value = 0;
        DOM_ELEMENTS.contrastSlider.value = 0;
        DOM_ELEMENTS.saturationSlider.value = 0;
        DOM_ELEMENTS.hueSlider.value = 0;
        DOM_ELEMENTS.exposureSlider.value = 0;
        DOM_ELEMENTS.highlightsSlider.value = 0;
        DOM_ELEMENTS.shadowsSlider.value = 0;
        updateEditingValueDisplays();
    }

    // Initialize displays
    updateEditingValueDisplays();

    // Image upload for editing tab
    DOM_ELEMENTS.imageUploadEdit.addEventListener('change', async (event) => {
        try {
            const result = await imageEditor.loadImage(event.target.files[0], (width, height) => {
                if (DOM_ELEMENTS.resolutionDisplayEdit) {
                    DOM_ELEMENTS.resolutionDisplayEdit.textContent = `${width} × ${height}`;
                }
            });
            
            // Save to tab manager
            tabManager.saveTabState('editing', result.imageData, result.originalImage);
            
            // Reset editing sliders
            resetEditingSliders();
            
        } catch (error) {
            console.error('Failed to load image:', error);
        }
    });

    // Editing sliders with real-time updates
    const sliders = [
        { element: DOM_ELEMENTS.brightnessSlider, name: 'brightness' },
        { element: DOM_ELEMENTS.contrastSlider, name: 'contrast' },
        { element: DOM_ELEMENTS.saturationSlider, name: 'saturation' },
        { element: DOM_ELEMENTS.hueSlider, name: 'hue' },
        { element: DOM_ELEMENTS.exposureSlider, name: 'exposure' },
        { element: DOM_ELEMENTS.highlightsSlider, name: 'highlights' },
        { element: DOM_ELEMENTS.shadowsSlider, name: 'shadows' }
    ];

    sliders.forEach(slider => {
        slider.element.addEventListener('input', () => {
            updateEditingValueDisplays();
            const settings = getEditingSettings();
            if (imageEditor.isRealtimePreviewEnabled) {
                imageEditor.applyFilters(settings);
            }
        });
    });

    // Add reset button click handlers for individual sliders
    document.querySelectorAll('.reset-slider-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const sliderId = button.getAttribute('data-slider');
            const resetValue = parseFloat(button.getAttribute('data-value'));
            const slider = document.getElementById(sliderId);
            
            if (slider) {
                // Set the slider to its default value
                slider.value = resetValue;
                
                // Trigger input event to update the display and apply changes
                const event = new Event('input', {
                    bubbles: true,
                    cancelable: true,
                });
                slider.dispatchEvent(event);
                
                // If real-time preview is enabled, apply the changes
                if (imageEditor.isRealtimePreviewEnabled) {
                    const settings = getEditingSettings();
                    imageEditor.applyFilters(settings);
                }
                
                // Update tab manager state
                const currentImageData = imageEditor.getCurrentImageData();
                if (currentImageData) {
                    tabManager.saveTabState('editing', currentImageData, imageEditor.originalImage);
                }
            }
        });
    });

    // Action buttons
    DOM_ELEMENTS.resetButtonEdit.addEventListener('click', () => {
        imageEditor.reset();
        resetEditingSliders();
        
        // Update tab manager state
        const currentImageData = imageEditor.getCurrentImageData();
        if (currentImageData) {
            tabManager.saveTabState('editing', currentImageData, imageEditor.originalImage);
        }
    });

    DOM_ELEMENTS.applyButtonEdit.addEventListener('click', () => {
        imageEditor.apply();
        
        // Update tab manager state
        const currentImageData = imageEditor.getCurrentImageData();
        if (currentImageData) {
            tabManager.saveTabState('editing', currentImageData, imageEditor.originalImage);
        }
    });

    DOM_ELEMENTS.downloadButtonEdit.addEventListener('click', () => {
        imageEditor.download();
    });

    // Real-time preview toggle
    DOM_ELEMENTS.realtimePreviewToggleEdit.addEventListener('change', () => {
        const enabled = DOM_ELEMENTS.realtimePreviewToggleEdit.checked;
        imageEditor.setRealtimePreview(enabled);
        
        if (enabled) {
            DOM_ELEMENTS.previewButtonEdit.classList.add('hidden');
        } else {
            DOM_ELEMENTS.previewButtonEdit.classList.remove('hidden');
        }
    });

    // Preview button
    DOM_ELEMENTS.previewButtonEdit.addEventListener('click', () => {
        const settings = getEditingSettings();
        imageEditor.applyFilters(settings, true);
    });

    // Invert Colors Button
    const invertColorsBtn = document.getElementById('invertColorsBtn');
    if (invertColorsBtn) {
        invertColorsBtn.addEventListener('click', () => {
            if (!imageEditor.originalImageData) {
                showMessage('Please load an image first.', 'info');
                return;
            }
            
            // Invert the colors
            const newImageData = imageEditor.invertColors();
            
            // Update tab manager state
            if (newImageData) {
                tabManager.saveTabState('editing', newImageData, imageEditor.originalImage);
                showMessage('Colors inverted!', 'success');
            }
        });
    }

    // Auto-save current state periodically
    setInterval(() => {
        const currentImageData = imageEditor.getCurrentImageData();
        if (currentImageData) {
            tabManager.saveTabState('editing', currentImageData, imageEditor.originalImage);
        }
    }, 3000);
}