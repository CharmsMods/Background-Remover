// Tab management functionality

/**
 * Tab manager class to handle tab switching and state persistence
 */
export class TabManager {
    constructor() {
        this.currentTab = 'backgroundRemoval';
        this.tabStates = {
            backgroundRemoval: {
                imageData: null,
                originalImage: null,
                canvasId: 'imageCanvas',
                tabId: 'backgroundRemovalTab',
                tabButton: null
            },
            imageEditing: {
                imageData: null,
                originalImage: null,
                canvasId: 'imageCanvasEdit',
                tabId: 'imageEditingTab',
                tabButton: null
            }
        };
        this.initializeTabs();
    }

    /**
     * Initialize tabs and set up event listeners
     */
    initializeTabs() {
        // Set up tab buttons
        document.querySelectorAll('[data-tab]').forEach(button => {
            const tabName = button.getAttribute('data-tab');
            if (this.tabStates[tabName]) {
                this.tabStates[tabName].tabButton = button;
                
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.switchToTab(tabName);
                });
            }
        });
        
        // Show the initial tab
        this.switchToTab('backgroundRemoval');
    }
    
    /**
     * Switch to a specific tab by name
     */
    switchToTab(tabName) {
        const tabState = this.tabStates[tabName];
        if (!tabState) return;
        
        // Hide all tab contents and deactivate all buttons
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.classList.add('hidden');
        });
        
        document.querySelectorAll('[data-tab]').forEach(button => {
            button.classList.remove('active', 'bg-cyan-900');
        });
        
        // Show the selected tab and activate its button
        const tabElement = document.getElementById(tabState.tabId);
        if (tabElement) {
            tabElement.classList.remove('hidden');
            tabElement.classList.add('active');
            
            const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
            if (activeButton) {
                activeButton.classList.add('active', 'bg-cyan-900');
            }
            
            this.currentTab = tabName;
            
            // Dispatch a custom event for any tab change listeners
            document.dispatchEvent(new CustomEvent('tabChanged', { 
                detail: { tab: tabName }
            }));
            
            console.log(`Switched to ${tabName} tab`);
        }
    }

    /**
     * Saves the current state of a tab
     */
    saveTabState(tabName, imageData, originalImage) {
        if (this.tabStates[tabName]) {
            this.tabStates[tabName].imageData = imageData;
            this.tabStates[tabName].originalImage = originalImage;
            console.log(`Saved state for ${tabName} tab`);
        }
    }

    /**
     * Gets the saved state of a tab
     */
    getTabState(tabName) {
        return this.tabStates[tabName] || null;
    }

    /**
     * Transfers image from one tab to another
     */
    transferImage(fromTab, toTab) {
        // Map the simplified tab names to full tab names
        const tabNameMap = {
            'background': 'backgroundRemoval',
            'editing': 'imageEditing'
        };

        const fromTabFull = tabNameMap[fromTab] || fromTab;
        const toTabFull = tabNameMap[toTab] || toTab;

        const fromState = this.getTabState(fromTabFull);
        if (!fromState || !fromState.imageData) {
            console.log(`No image data in ${fromTab} tab to transfer`);
            return null;
        }

        // Get the canvas for the target tab
        const targetCanvas = document.getElementById(this.tabStates[toTabFull].canvasId);
        const targetCtx = targetCanvas.getContext('2d');

        // Create a temporary canvas to reconstruct the image
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = fromState.imageData.width;
        tempCanvas.height = fromState.imageData.height;
        
        // If we have an original image, use that for better quality
        if (fromState.originalImage) {
            tempCanvas.width = fromState.originalImage.width;
            tempCanvas.height = fromState.originalImage.height;
            tempCtx.drawImage(fromState.originalImage, 0, 0);
        } else {
            tempCtx.putImageData(fromState.imageData, 0, 0);
        }

        // Set target canvas dimensions and draw the image
        targetCanvas.width = tempCanvas.width;
        targetCanvas.height = tempCanvas.height;
        targetCtx.drawImage(tempCanvas, 0, 0);

        // Create new image data for the target tab
        const newImageData = targetCtx.getImageData(0, 0, targetCanvas.width, targetCanvas.height);
        
        // Save to target tab state
        this.saveTabState(toTabFull, newImageData, fromState.originalImage);

        console.log(`Transferred image from ${fromTabFull} to ${toTabFull}`);
        return {
            imageData: newImageData,
            originalImage: fromState.originalImage
        };
    }

    /**
     * Gets the current active tab
     */
    getCurrentTab() {
        return this.currentTab;
    }

    /**
     * Checks if a tab has an image
     */
    hasImage(tabName) {
        const state = this.getTabState(tabName);
        return state && state.imageData !== null;
    }

    /**
     * Clears the state of a specific tab
     */
    clearTabState(tabName) {
        if (this.tabStates[tabName]) {
            this.tabStates[tabName].imageData = null;
            this.tabStates[tabName].originalImage = null;
            console.log(`Cleared state for ${tabName} tab`);
        }
    }
}