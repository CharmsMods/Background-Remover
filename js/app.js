// Main application initialization and coordination
import { DOM_ELEMENTS, ctx, DEFAULTS } from './constants.js';
import { updateResolutionDisplay, initializeCanvasWithPlaceholder } from './ui-manager.js';
import { TabManager } from './tab-manager.js';
import { ImageEditor } from './image-editor.js';
import { BackgroundRemovalProcessor } from './background-removal.js';
import { setupBackgroundRemovalEvents } from './background-removal-events.js';
import { setupImageEditingEvents } from './image-editing-events.js';
import { MemoryManager } from './memory-manager.js';

/**
 * Main application class that coordinates all modules.
 */
class ImageEditorProApp {
    constructor() {
        this.tabManager = new TabManager();
        this.backgroundProcessor = new BackgroundRemovalProcessor();
        this.imageEditor = new ImageEditor('imageCanvasEdit');
        this.memoryManager = new MemoryManager(this.tabManager, this.backgroundProcessor, this.imageEditor);
        this.initializeApp();
    }

    /**
     * Initializes the application.
     */
    initializeApp() {
        // Setup event listeners for both tabs
        setupBackgroundRemovalEvents(this.backgroundProcessor, this.tabManager, this.memoryManager);
        setupImageEditingEvents(this.imageEditor, this.tabManager, this.memoryManager);

        // Initialize canvases with placeholders
        this.initializePlaceholders();

        // Setup tab upload modal handlers
        this.setupTabUploadModal();

        console.log('Image Editor Pro application initialized');
    }

    /**
     * Initializes both canvases with placeholders when no images are loaded.
     */
    initializePlaceholders() {
        // Initialize background removal canvas with placeholder
        initializeCanvasWithPlaceholder(
            DOM_ELEMENTS.imageCanvas,
            'Upload an image to get started',
            {
                bgColor: DEFAULTS.PLACEHOLDER_BG,
                textColor: DEFAULTS.PLACEHOLDER_TEXT,
                width: DEFAULTS.CANVAS_WIDTH,
                height: DEFAULTS.CANVAS_HEIGHT
            }
        );

        // Initialize image editing canvas with placeholder
        initializeCanvasWithPlaceholder(
            DOM_ELEMENTS.imageCanvasEdit,
            'Upload an image to get started',
            {
                bgColor: DEFAULTS.PLACEHOLDER_BG,
                textColor: DEFAULTS.PLACEHOLDER_TEXT,
                width: DEFAULTS.CANVAS_WIDTH,
                height: DEFAULTS.CANVAS_HEIGHT
            }
        );
    }

    /**
     * Sets up the tab upload modal functionality
     */
    setupTabUploadModal() {
        // Upload from tab buttons
        DOM_ELEMENTS.uploadFromTabBg.addEventListener('click', () => {
            this.showTabUploadModal('background');
        });

        DOM_ELEMENTS.uploadFromTabEdit.addEventListener('click', () => {
            this.showTabUploadModal('editing');
        });

        // Modal buttons
        DOM_ELEMENTS.importFromBackground.addEventListener('click', () => {
            this.importFromTab('background');
        });

        DOM_ELEMENTS.importFromEditing.addEventListener('click', () => {
            this.importFromTab('editing');
        });

        DOM_ELEMENTS.cancelTabUpload.addEventListener('click', () => {
            this.hideTabUploadModal();
        });

        // Close modal on background click
        DOM_ELEMENTS.tabUploadModal.addEventListener('click', (e) => {
            if (e.target === DOM_ELEMENTS.tabUploadModal) {
                this.hideTabUploadModal();
            }
        });
    }

    /**
     * Shows the tab upload modal
     */
    showTabUploadModal(currentTab) {
        this.currentUploadTarget = currentTab;
        
        // Update button states based on available images
        const hasBackgroundImage = this.tabManager.hasImage('background');
        const hasEditingImage = this.tabManager.hasImage('editing');

        DOM_ELEMENTS.importFromBackground.disabled = !hasBackgroundImage || currentTab === 'background';
        DOM_ELEMENTS.importFromEditing.disabled = !hasEditingImage || currentTab === 'editing';

        // Update button text to show availability
        DOM_ELEMENTS.importFromBackground.textContent = hasBackgroundImage ? 
            'Background Removal Tab' : 'Background Removal Tab (No Image)';
        DOM_ELEMENTS.importFromEditing.textContent = hasEditingImage ? 
            'Image Editing Tab' : 'Image Editing Tab (No Image)';

        DOM_ELEMENTS.tabUploadModal.classList.remove('hidden');
    }

    /**
     * Hides the tab upload modal
     */
    hideTabUploadModal() {
        DOM_ELEMENTS.tabUploadModal.classList.add('hidden');
        this.currentUploadTarget = null;
    }

    /**
     * Imports image from specified tab
     */
    importFromTab(sourceTab) {
        if (!this.currentUploadTarget) {
            console.error('No target tab specified for import');
            return;
        }
        
        console.log(`Importing image from ${sourceTab} to ${this.currentUploadTarget}`);

        // Get the source tab state
        const sourceState = this.tabManager.getTabState(sourceTab === 'background' ? 'backgroundRemoval' : 'imageEditing');
        if (!sourceState || !sourceState.imageData) {
            console.error(`No image data found in ${sourceTab} tab`);
            return;
        }

        // Get the target tab state
        const targetTab = this.currentUploadTarget === 'background' ? 'backgroundRemoval' : 'imageEditing';
        
        // Create a temporary canvas to handle the image data
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        // Set canvas dimensions to match the source image
        tempCanvas.width = sourceState.imageData.width;
        tempCanvas.height = sourceState.imageData.height;
        
        try {
            // Put the source image data onto the temporary canvas
            tempCtx.putImageData(sourceState.imageData, 0, 0);
            
            // Get the target canvas and its context
            const targetCanvas = document.getElementById(targetTab === 'backgroundRemoval' ? 'imageCanvas' : 'imageCanvasEdit');
            const targetCtx = targetCanvas.getContext('2d');
            
            // Set target canvas dimensions to match the source
            targetCanvas.width = tempCanvas.width;
            targetCanvas.height = tempCanvas.height;
            
            // Draw the image from the temporary canvas to the target canvas
            targetCtx.drawImage(tempCanvas, 0, 0);
            
            // Get the image data from the target canvas
            const newImageData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
            
            // Update the target tab state
            this.tabManager.saveTabState(targetTab, newImageData, sourceState.originalImage);
            
            // Update the appropriate editor based on target tab
            if (this.currentUploadTarget === 'background') {
                // Update background processor
                this.backgroundProcessor.setImageData(newImageData, sourceState.originalImage);
                
                // Update UI
                if (sourceState.originalImage) {
                    const width = sourceState.originalImage.width;
                    const height = sourceState.originalImage.height;
                    if (DOM_ELEMENTS.resolutionDisplay) {
                        DOM_ELEMENTS.resolutionDisplay.textContent = `${width} × ${height}`;
                    }
                }
                
                // Switch to background tab
                this.tabManager.switchToTab('backgroundRemoval');
            } else if (this.currentUploadTarget === 'editing') {
                // Update image editor with the new image data
                this.imageEditor.setImageData(
                    newImageData, 
                    sourceState.originalImage,
                    (width, height) => {
                        if (DOM_ELEMENTS.resolutionDisplayEdit) {
                            DOM_ELEMENTS.resolutionDisplayEdit.textContent = `${width} × ${height}`;
                        }
                    }
                );
                
                // Switch to editing tab
                this.tabManager.switchToTab('imageEditing');
            }
            
            console.log(`Successfully transferred image to ${this.currentUploadTarget} tab`);
        } catch (error) {
            console.error('Error during image transfer:', error);
            alert('Failed to transfer image between tabs. Please try again.');
        } finally {
            // Always hide the upload modal
            this.hideTabUploadModal();
        }
    }

    /**
     * Gets the current application state for debugging.
     * @returns {object} Current state
     */
    getState() {
        return {
            background: {
                hasImage: !!this.backgroundProcessor.originalImage.src,
                hasImageData: !!this.backgroundProcessor.originalImageData,
                hasSelectedColor: !!this.backgroundProcessor.selectedColor,
                selectedColor: this.backgroundProcessor.selectedColor,
                isRealtimePreviewEnabled: this.backgroundProcessor.isRealtimePreviewEnabled
            },
            editing: {
                hasImage: !!this.imageEditor.originalImage.src,
                hasImageData: !!this.imageEditor.originalImageData,
                isRealtimePreviewEnabled: this.imageEditor.isRealtimePreviewEnabled
            }
        };
    }

    /**
     * Resets the entire application to initial state.
     */
    resetApp() {
        this.backgroundProcessor.reset();
        this.imageEditor.reset();
        this.initializePlaceholders();
        console.log('Application reset to initial state');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.imageEditorProApp = new ImageEditorProApp();
});

// Also initialize on window load as fallback
window.addEventListener('load', () => {
    if (!window.imageEditorProApp) {
        window.imageEditorProApp = new ImageEditorProApp();
    }
});