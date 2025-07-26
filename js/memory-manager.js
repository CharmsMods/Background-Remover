// Memory management functionality
import { DOM_ELEMENTS } from './constants.js';
import { showMessage } from './ui-manager.js';

/**
 * Memory manager class for handling RAM optimization
 */
export class MemoryManager {
    constructor(tabManager, backgroundProcessor, imageEditor) {
        this.tabManager = tabManager;
        this.backgroundProcessor = backgroundProcessor;
        this.imageEditor = imageEditor;
        this.currentTab = null;
        this.setupEventListeners();
    }

    /**
     * Sets up event listeners for memory management modal
     */
    setupEventListeners() {
        // Skip memory cleanup
        DOM_ELEMENTS.skipMemoryCleanup.addEventListener('click', () => {
            this.hideMemoryModal();
        });

        // Clear selected tabs
        DOM_ELEMENTS.clearSelectedTabs.addEventListener('click', () => {
            this.clearSelectedTabs();
        });

        // Clear all other tabs
        DOM_ELEMENTS.clearAllOtherTabs.addEventListener('click', () => {
            this.clearAllOtherTabs();
        });

        // Close modal on background click
        DOM_ELEMENTS.memoryManagementModal.addEventListener('click', (e) => {
            if (e.target === DOM_ELEMENTS.memoryManagementModal) {
                this.hideMemoryModal();
            }
        });
    }

    /**
     * Shows the memory management modal after image load
     */
    showMemoryModal(currentTab) {
        this.currentTab = currentTab;
        
        // Calculate and display memory usage
        this.updateMemoryDisplay();
        
        // Populate tab options
        this.populateTabOptions();
        
        // Show modal with animation
        DOM_ELEMENTS.memoryManagementModal.classList.remove('hidden');
        DOM_ELEMENTS.memoryManagementModal.classList.add('opacity-0');
        
        // Trigger reflow
        void DOM_ELEMENTS.memoryManagementModal.offsetWidth;
        
        // Add animation class
        DOM_ELEMENTS.memoryManagementModal.classList.remove('opacity-0');
        DOM_ELEMENTS.memoryManagementModal.classList.add('opacity-100', 'transition-opacity', 'duration-300');
        
        // Focus the skip button for better keyboard navigation
        setTimeout(() => {
            DOM_ELEMENTS.skipMemoryCleanup.focus();
        }, 100);
        
        // Log memory info for debugging
        const memoryInfo = this.calculateMemoryUsage();
        console.log('Memory usage:', {
            total: this.formatBytes(memoryInfo.total),
            tabs: Object.entries(memoryInfo.tabs).reduce((acc, [tab, bytes]) => {
                acc[tab] = this.formatBytes(bytes);
                return acc;
            }, {})
        });
    }

    /**
     * Hides the memory management modal with animation
     */
    hideMemoryModal() {
        // Start fade out animation
        DOM_ELEMENTS.memoryManagementModal.classList.remove('opacity-100');
        DOM_ELEMENTS.memoryManagementModal.classList.add('opacity-0');
        
        // Hide after animation completes
        setTimeout(() => {
            DOM_ELEMENTS.memoryManagementModal.classList.add('hidden');
            DOM_ELEMENTS.memoryManagementModal.classList.remove('opacity-0', 'opacity-100', 'transition-opacity', 'duration-300');
            this.currentTab = null;
        }, 300);
    }

    /**
     * Calculates approximate memory usage
     */
    calculateMemoryUsage() {
        let totalMemory = 0;
        const tabMemory = {};

        // Background removal tab memory
        if (this.backgroundProcessor.originalImageData) {
            const bgMemory = this.backgroundProcessor.originalImageData.data.length * 4; // RGBA bytes
            tabMemory.background = bgMemory;
            totalMemory += bgMemory;
        } else {
            tabMemory.background = 0;
        }

        // Image editing tab memory
        if (this.imageEditor.originalImageData) {
            const editMemory = this.imageEditor.originalImageData.data.length * 4; // RGBA bytes
            tabMemory.editing = editMemory;
            totalMemory += editMemory;
        } else {
            tabMemory.editing = 0;
        }

        return {
            total: totalMemory,
            tabs: tabMemory
        };
    }

    /**
     * Formats bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Updates the memory display in the modal
     */
    updateMemoryDisplay() {
        const memoryInfo = this.calculateMemoryUsage();
        const totalMB = memoryInfo.total / (1024 * 1024);
        
        // Update display
        DOM_ELEMENTS.memoryUsageDisplay.textContent = this.formatBytes(memoryInfo.total);
        
        // Update progress bar (assuming 100MB as "high" usage)
        const percentage = Math.min((totalMB / 100) * 100, 100);
        DOM_ELEMENTS.memoryUsageBar.style.width = `${percentage}%`;
        
        // Change color based on usage
        if (percentage < 30) {
            DOM_ELEMENTS.memoryUsageBar.className = 'bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300';
        } else if (percentage < 70) {
            DOM_ELEMENTS.memoryUsageBar.className = 'bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full transition-all duration-300';
        } else {
            DOM_ELEMENTS.memoryUsageBar.className = 'bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300';
        }
    }

    /**
     * Populates the tab options in the modal
     */
    populateTabOptions() {
        const memoryInfo = this.calculateMemoryUsage();
        DOM_ELEMENTS.memoryTabOptions.innerHTML = '';

        const tabs = [
            { id: 'background', name: 'Background Removal Tab', memory: memoryInfo.tabs.background },
            { id: 'editing', name: 'Image Editing Tab', memory: memoryInfo.tabs.editing }
        ];

        tabs.forEach(tab => {
            // Don't show current tab or tabs with no data
            if (tab.id === this.currentTab || tab.memory === 0) {
                return;
            }

            const tabOption = document.createElement('label');
            tabOption.className = 'flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-600 cursor-pointer hover:bg-gray-700 transition-colors';
            
            tabOption.innerHTML = `
                <div class="flex items-center">
                    <input type="checkbox" class="memory-tab-checkbox mr-3 w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500" data-tab="${tab.id}">
                    <span class="text-white">${tab.name}</span>
                </div>
                <div class="text-right">
                    <div class="text-sm text-cyan-400 font-mono">${this.formatBytes(tab.memory)}</div>
                    <div class="text-xs text-gray-400">RAM Usage</div>
                </div>
            `;

            DOM_ELEMENTS.memoryTabOptions.appendChild(tabOption);
        });

        // If no other tabs have data, show message
        if (DOM_ELEMENTS.memoryTabOptions.children.length === 0) {
            const noDataMessage = document.createElement('div');
            noDataMessage.className = 'text-center text-gray-400 py-4';
            noDataMessage.textContent = 'No other tabs have image data to clear.';
            DOM_ELEMENTS.memoryTabOptions.appendChild(noDataMessage);
            
            // Disable clear buttons
            DOM_ELEMENTS.clearSelectedTabs.disabled = true;
            DOM_ELEMENTS.clearAllOtherTabs.disabled = true;
        } else {
            // Enable clear buttons
            DOM_ELEMENTS.clearSelectedTabs.disabled = false;
            DOM_ELEMENTS.clearAllOtherTabs.disabled = false;
        }
    }

    /**
     * Clears selected tabs
     */
    clearSelectedTabs() {
        const checkboxes = DOM_ELEMENTS.memoryTabOptions.querySelectorAll('.memory-tab-checkbox:checked');
        const selectedTabs = Array.from(checkboxes).map(cb => cb.dataset.tab);
        
        if (selectedTabs.length === 0) {
            showMessage('Please select at least one tab to clear.', 'info');
            return;
        }

        this.clearTabsData(selectedTabs);
        this.hideMemoryModal();
        
        const tabNames = selectedTabs.map(tab => 
            tab === 'background' ? 'Background Removal' : 'Image Editing'
        ).join(', ');
        
        showMessage(`Cleared data from: ${tabNames}. Memory freed up!`, 'success');
    }

    /**
     * Clears all other tabs
     */
    clearAllOtherTabs() {
        const allTabs = ['background', 'editing'];
        const otherTabs = allTabs.filter(tab => tab !== this.currentTab);
        
        // Only clear tabs that have data
        const tabsToClear = otherTabs.filter(tab => {
            if (tab === 'background') {
                return this.backgroundProcessor.originalImageData !== null;
            } else if (tab === 'editing') {
                return this.imageEditor.originalImageData !== null;
            }
            return false;
        });

        if (tabsToClear.length === 0) {
            showMessage('No other tabs have data to clear.', 'info');
            this.hideMemoryModal();
            return;
        }

        this.clearTabsData(tabsToClear);
        this.hideMemoryModal();
        
        showMessage(`Cleared all other tab data. Memory freed up!`, 'success');
    }

    /**
     * Clears data from specified tabs with visual feedback
     */
    clearTabsData(tabIds) {
        // Show loading state
        const originalButtonText = DOM_ELEMENTS.clearSelectedTabs.textContent;
        DOM_ELEMENTS.clearSelectedTabs.disabled = true;
        DOM_ELEMENTS.clearAllOtherTabs.disabled = true;
        DOM_ELEMENTS.clearSelectedTabs.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Clearing...';
        
        // Process in chunks to avoid blocking the UI
        setTimeout(() => {
            try {
                tabIds.forEach(tabId => {
                    if (tabId === 'background') {
                        this.clearBackgroundTab();
                    } else if (tabId === 'editing') {
                        this.clearEditingTab();
                    }
                    
                    // Clear from tab manager
                    this.tabManager.clearTabState(tabId);
                });
                
                // Update memory display
                this.updateMemoryDisplay();
                
                // Show success message
                showMessage('Memory has been successfully freed up!', 'success');
                
            } catch (error) {
                console.error('Error clearing tabs:', error);
                showMessage('An error occurred while clearing memory', 'error');
            } finally {
                // Reset button states
                DOM_ELEMENTS.clearSelectedTabs.disabled = false;
                DOM_ELEMENTS.clearAllOtherTabs.disabled = false;
                DOM_ELEMENTS.clearSelectedTabs.innerHTML = originalButtonText;
                
                // Re-populate tab options to reflect changes
                this.populateTabOptions();
            }
        }, 100);
    }

    /**
     * Clears background removal tab data
     */
    clearBackgroundTab() {
        // Reset processor
        this.backgroundProcessor.originalImage = new Image();
        this.backgroundProcessor.originalImageData = null;
        this.backgroundProcessor.selectedColor = null;
        this.backgroundProcessor.resetPerformanceTracking();
        
        // Clear canvas
        const ctx = DOM_ELEMENTS.imageCanvas.getContext('2d');
        ctx.clearRect(0, 0, DOM_ELEMENTS.imageCanvas.width, DOM_ELEMENTS.imageCanvas.height);
        
        // Reset canvas to placeholder
        DOM_ELEMENTS.imageCanvas.width = 600;
        DOM_ELEMENTS.imageCanvas.height = 400;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, DOM_ELEMENTS.imageCanvas.width, DOM_ELEMENTS.imageCanvas.height);
        ctx.font = '24px Inter';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Upload an image to get started', DOM_ELEMENTS.imageCanvas.width / 2, DOM_ELEMENTS.imageCanvas.height / 2);
        
        // Reset UI displays
        if (DOM_ELEMENTS.resolutionDisplay) {
            DOM_ELEMENTS.resolutionDisplay.textContent = 'No image';
        }
        if (DOM_ELEMENTS.hexDisplay) {
            DOM_ELEMENTS.hexDisplay.textContent = '#FFFFFF';
        }
        if (DOM_ELEMENTS.rgbDisplay) {
            DOM_ELEMENTS.rgbDisplay.textContent = 'rgb(255, 255, 255)';
        }
        if (DOM_ELEMENTS.colorSwatch) {
            DOM_ELEMENTS.colorSwatch.style.backgroundColor = '#FFFFFF';
        }
    }

    /**
     * Clears image editing tab data
     */
    clearEditingTab() {
        // Reset editor
        this.imageEditor.originalImage = new Image();
        this.imageEditor.originalImageData = null;
        this.imageEditor.resetPerformanceTracking();
        
        // Clear canvas
        const ctx = DOM_ELEMENTS.imageCanvasEdit.getContext('2d');
        ctx.clearRect(0, 0, DOM_ELEMENTS.imageCanvasEdit.width, DOM_ELEMENTS.imageCanvasEdit.height);
        
        // Reset canvas to placeholder
        DOM_ELEMENTS.imageCanvasEdit.width = 600;
        DOM_ELEMENTS.imageCanvasEdit.height = 400;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(0, 0, DOM_ELEMENTS.imageCanvasEdit.width, DOM_ELEMENTS.imageCanvasEdit.height);
        ctx.font = '24px Inter';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#64748b';
        ctx.fillText('Upload an image to get started', DOM_ELEMENTS.imageCanvasEdit.width / 2, DOM_ELEMENTS.imageCanvasEdit.height / 2);
        
        // Reset UI displays
        if (DOM_ELEMENTS.resolutionDisplayEdit) {
            DOM_ELEMENTS.resolutionDisplayEdit.textContent = 'No image';
        }
        
        // Reset all editing sliders
        DOM_ELEMENTS.brightnessSlider.value = 0;
        DOM_ELEMENTS.contrastSlider.value = 0;
        DOM_ELEMENTS.saturationSlider.value = 0;
        DOM_ELEMENTS.hueSlider.value = 0;
        DOM_ELEMENTS.exposureSlider.value = 0;
        DOM_ELEMENTS.highlightsSlider.value = 0;
        DOM_ELEMENTS.shadowsSlider.value = 0;
        
        // Reset value displays
        if (DOM_ELEMENTS.brightnessValue) DOM_ELEMENTS.brightnessValue.textContent = '0';
        if (DOM_ELEMENTS.contrastValue) DOM_ELEMENTS.contrastValue.textContent = '0';
        if (DOM_ELEMENTS.saturationValue) DOM_ELEMENTS.saturationValue.textContent = '0';
        if (DOM_ELEMENTS.hueValue) DOM_ELEMENTS.hueValue.textContent = '0°';
        if (DOM_ELEMENTS.exposureValue) DOM_ELEMENTS.exposureValue.textContent = '0';
        if (DOM_ELEMENTS.highlightsValue) DOM_ELEMENTS.highlightsValue.textContent = '0';
        if (DOM_ELEMENTS.shadowsValue) DOM_ELEMENTS.shadowsValue.textContent = '0';
    }
}