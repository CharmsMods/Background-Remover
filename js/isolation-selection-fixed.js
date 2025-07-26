export class IsolationSelection {
    constructor() {
        // Initialize properties
        this.canvas = document.getElementById('imageCanvasIsolation');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.originalImageData = null;
        this.currentImageData = null;
        this.selectedColor = null;
        this.tolerance = 30;
        this.replacementColor = '#ff0000';
        this.opacity = 1.0;
        this.isPreviewMode = false;
        this.isRealtimePreviewEnabled = true;
        this.isToleranceEnabled = true;
        this.originalPixels = null;
        this.selectedPixels = null;
        
        // UI Elements
        this.ui = {
            toleranceSlider: document.getElementById('toleranceSliderIsolation'),
            toleranceValue: document.getElementById('toleranceValueIsolation'),
            toleranceToggle: document.getElementById('toleranceToggleIsolation'),
            toleranceContainer: document.getElementById('toleranceSliderContainerIsolation'),
            opacitySlider: document.getElementById('opacitySliderIsolation'),
            opacityValue: document.getElementById('opacityValueIsolation'),
            realtimePreviewToggle: document.getElementById('realtimePreviewToggleIsolation'),
            colorPicker: document.getElementById('replacementColorPicker'),
            previewButton: document.getElementById('previewButtonIsolation'),
            applyButton: document.getElementById('applyChangesButton'),
            resetButton: document.getElementById('resetButtonIsolation')
        };
        
        // Bind methods
        this.handleTabChange = this.handleTabChange.bind(this);
        this.loadImage = this.loadImage.bind(this);
        this.initializeEventListeners = this.initializeEventListeners.bind(this);
        this.handleToleranceChange = this.handleToleranceChange.bind(this);
        this.handleOpacityChange = this.handleOpacityChange.bind(this);
        this.handleRealtimePreviewToggle = this.handleRealtimePreviewToggle.bind(this);
        this.handleToleranceToggle = this.handleToleranceToggle.bind(this);
        this.applyColorReplacement = this.applyColorReplacement.bind(this);
        this.togglePreview = this.togglePreview.bind(this);
        this.confirmChanges = this.confirmChanges.bind(this);
        this.resetToOriginal = this.resetToOriginal.bind(this);
        
        // Initialize the component
        this.initialize();
    }
    
    /**
     * Initialize the component
     */
    initialize() {
        // Set initial canvas size and placeholder
        this.initializeCanvas();
        
        // Set up event listeners
        this.initializeEventListeners();
        
        // Listen for tab changes
        document.addEventListener('tabChanged', this.handleTabChange);
    }
    
    /**
     * Initialize the canvas with a placeholder
     */
    initializeCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.ctx.fillStyle = '#2d3748';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = '24px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#a0aec0';
        this.ctx.fillText('Upload an image to get started', this.canvas.width / 2, this.canvas.height / 2);
    }

    /**
     * Initialize all event listeners
     */
    initializeEventListeners() {
        // Canvas click event for color selection
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        
        // Tolerance slider
        if (this.ui.toleranceSlider && this.ui.toleranceValue) {
            this.ui.toleranceSlider.addEventListener('input', this.handleToleranceChange);
        }
        
        // Opacity slider
        if (this.ui.opacitySlider && this.ui.opacityValue) {
            this.ui.opacitySlider.addEventListener('input', this.handleOpacityChange);
        }
        
        // Real-time preview toggle
        if (this.ui.realtimePreviewToggle) {
            this.ui.realtimePreviewToggle.addEventListener('change', this.handleRealtimePreviewToggle);
        }
        
        // Tolerance toggle
        if (this.ui.toleranceToggle) {
            this.ui.toleranceToggle.addEventListener('change', this.handleToleranceToggle);
        }
        
        // Replacement color picker
        if (this.ui.colorPicker) {
            this.ui.colorPicker.addEventListener('input', (e) => {
                this.replacementColor = e.target.value;
                if (this.isRealtimePreviewEnabled) {
                    this.applyColorReplacement();
                }
            });
        }
        
        // Preview button
        if (this.ui.previewButton) {
            this.ui.previewButton.addEventListener('click', this.togglePreview);
        }
        
        // Apply changes button
        if (this.ui.applyButton) {
            this.ui.applyButton.addEventListener('click', this.confirmChanges);
        }
        
        // Reset button
        if (this.ui.resetButton) {
            this.ui.resetButton.addEventListener('click', this.resetToOriginal);
        }
        
        // Image upload
        const imageUpload = document.getElementById('imageUploadIsolation');
        if (imageUpload) {
            imageUpload.addEventListener('change', this.loadImage);
        }
    }
    
    /**
     * Handle canvas click to select color and find connected pixels
     */
    handleCanvasClick(e) {
        if (!this.originalImageData) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((e.clientX - rect.left) * (this.canvas.width / rect.width));
        const y = Math.floor((e.clientY - rect.top) * (this.canvas.height / rect.height));
        
        // Get the color of the clicked pixel
        const pixelIndex = (y * this.canvas.width + x) * 4;
        const r = this.originalImageData.data[pixelIndex];
        const g = this.originalImageData.data[pixelIndex + 1];
        const b = this.originalImageData.data[pixelIndex + 2];
        
        // Ignore transparent pixels
        if (this.originalImageData.data[pixelIndex + 3] === 0) return;
        
        this.selectedColor = { r, g, b };
        this.updateColorDisplay();
        
        // Find connected pixels with similar color
        this.findConnectedPixels(x, y);
        
        // Apply color replacement if in real-time preview mode
        if (this.isRealtimePreviewEnabled) {
            this.applyColorReplacement();
        }
    }
    
    /**
     * Show a message to the user
     */
    showMessage(message, type = 'info') {
        const messageBox = document.getElementById('message-box');
        const messageText = document.getElementById('message-text');
        
        if (messageBox && messageText) {
            messageBox.className = `fixed top-4 left-4 z-50 p-4 text-sm rounded-lg shadow-lg max-w-sm ${this.getMessageTypeClass(type)}`;
            messageText.textContent = message;
            messageBox.classList.remove('hidden');
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                messageBox.classList.add('hidden');
            }, 3000);
        }
    }
    
    /**
     * Get CSS class for message type
     */
    getMessageTypeClass(type) {
        const types = {
            'success': 'bg-green-900 text-green-100 border border-green-700',
            'error': 'bg-red-900 text-red-100 border border-red-700',
            'warning': 'bg-yellow-900 text-yellow-100 border border-yellow-700',
            'info': 'bg-blue-900 text-blue-100 border border-blue-700'
        };
        return types[type] || types.info;
    }
    
    /**
     * Update the UI with the selected color
     */
    updateColorDisplay() {
        if (!this.selectedColor) return;
        
        const { r, g, b } = this.selectedColor;
        const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
        
        // Update UI elements
        const colorPreview = document.getElementById('selectedColorPreview');
        const rgbDisplay = document.getElementById('selectedColorRGB');
        const hexDisplay = document.getElementById('selectedColorHEX');
        
        if (colorPreview) colorPreview.style.backgroundColor = hex;
        if (rgbDisplay) rgbDisplay.textContent = `rgb(${r}, ${g}, ${b})`;
        if (hexDisplay) hexDisplay.textContent = hex.toUpperCase();
    }
    
    /**
     * Find all connected pixels with similar color using flood fill algorithm
     * @param {number} startX - Starting X coordinate
     * @param {number} startY - Starting Y coordinate
     */
    findConnectedPixels(startX, startY) {
        if (!this.selectedColor || !this.originalImageData) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const imageData = this.originalImageData.data;
        
        // Create a copy of the original pixels if not exists
        if (!this.originalPixels) {
            this.originalPixels = new Uint8ClampedArray(imageData);
        }
        
        // Initialize selected pixels array if not exists
        this.selectedPixels = new Uint8ClampedArray(imageData.length).fill(0);
        
        // Stack for flood fill
        const stack = [[startX, startY]];
        const visited = new Set();
        
        // Target color
        const targetR = this.selectedColor.r;
        const targetG = this.selectedColor.g;
        const targetB = this.selectedColor.b;
        
        // Process the stack
        while (stack.length > 0) {
            const [x, y] = stack.pop();
            const pixelIndex = (y * width + x) * 4;
            
            // Skip if out of bounds or already visited
            if (x < 0 || x >= width || y < 0 || y >= height || visited.has(pixelIndex)) {
                continue;
            }
            
            // Mark as visited
            visited.add(pixelIndex);
            
            // Get current pixel color
            const r = imageData[pixelIndex];
            const g = imageData[pixelIndex + 1];
            const b = imageData[pixelIndex + 2];
            
            // Calculate color distance
            const distance = this.calculateColorDistance(
                { r, g, b },
                { r: targetR, g: targetG, b: targetB }
            );
            
            // If color is within tolerance, select it and check neighbors
            if (distance <= this.tolerance) {
                this.selectedPixels[pixelIndex] = 1;
                this.selectedPixels[pixelIndex + 1] = 1;
                this.selectedPixels[pixelIndex + 2] = 1;
                this.selectedPixels[pixelIndex + 3] = 1;
                
                // Add neighbors to stack
                stack.push([x + 1, y]);
                stack.push([x - 1, y]);
                stack.push([x, y + 1]);
                stack.push([x, y - 1]);
            }
        }
    }
    
    /**
     * Apply color replacement to the selected pixels
     */
    applyColorReplacement() {
        if (!this.selectedPixels || !this.originalImageData) return;
        
        // Create a working copy of the image data
        const imageData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            this.originalImageData.width,
            this.originalImageData.height
        );
        
        const data = imageData.data;
        const targetRgb = this.hexToRgb(this.replacementColor) || { r: 0, g: 0, b: 0 };
        
        // Only modify selected pixels
        for (let i = 0; i < data.length; i += 4) {
            if (this.selectedPixels[i] === 1) {
                // Blend with original color based on opacity
                const blendAmount = this.opacity;
                data[i] = Math.round(data[i] * (1 - blendAmount) + targetRgb.r * blendAmount);     // R
                data[i + 1] = Math.round(data[i + 1] * (1 - blendAmount) + targetRgb.g * blendAmount); // G
                data[i + 2] = Math.round(data[i + 2] * (1 - blendAmount) + targetRgb.b * blendAmount); // B
                // Keep original alpha
            }
        }
        
        // Update the canvas
        this.ctx.putImageData(imageData, 0, 0);
        this.currentImageData = imageData;
    }
    
    /**
     * Toggle preview mode
     */
    togglePreview() {
        if (this.isPreviewMode) {
            // Revert to original
            this.resetToOriginal();
            this.ui.previewButton.textContent = 'Preview';
            this.ui.previewButton.classList.remove('bg-amber-600');
        } else {
            // Apply changes
            this.applyColorReplacement();
            this.ui.previewButton.textContent = 'Cancel';
            this.ui.previewButton.classList.add('bg-amber-600');
        }
        this.isPreviewMode = !this.isPreviewMode;
    }
    
    /**
     * Confirm the changes (exit preview mode and update original)
     */
    confirmChanges() {
        if (this.isPreviewMode) {
            this.isPreviewMode = false;
            this.originalImageData = this.currentImageData;
            this.ui.previewButton.textContent = 'Preview';
            this.ui.previewButton.classList.remove('bg-amber-600');
        }
    }
    
    /**
     * Reset to original image
     */
    resetToOriginal() {
        if (this.originalImageData) {
            this.ctx.putImageData(this.originalImageData, 0, 0);
            this.currentImageData = this.originalImageData;
            this.selectedColor = null;
            this.selectedPixels = null;
            this.isPreviewMode = false;
            
            if (this.ui.previewButton) {
                this.ui.previewButton.textContent = 'Preview';
                this.ui.previewButton.classList.remove('bg-amber-600');
            }
            
            this.updateColorDisplay();
        }
    }
    
    /**
     * Handle tolerance slider change
     */
    handleToleranceChange(e) {
        this.tolerance = parseInt(e.target.value);
        if (this.ui.toleranceValue) {
            this.ui.toleranceValue.textContent = this.tolerance;
        }
        if (this.isRealtimePreviewEnabled && this.selectedPixels) {
            this.applyColorReplacement();
        }
    }
    
    /**
     * Handle opacity slider change
     */
    handleOpacityChange(e) {
        this.opacity = parseFloat(e.target.value);
        if (this.ui.opacityValue) {
            this.ui.opacityValue.textContent = `${Math.round(this.opacity * 100)}%`;
        }
        if (this.isRealtimePreviewEnabled && this.selectedPixels) {
            this.applyColorReplacement();
        }
    }
    
    /**
     * Toggle real-time preview
     */
    handleRealtimePreviewToggle(e) {
        this.isRealtimePreviewEnabled = e.target.checked;
        if (this.isRealtimePreviewEnabled && this.selectedPixels) {
            this.applyColorReplacement();
        }
    }
    
    /**
     * Toggle tolerance mode
     */
    handleToleranceToggle(e) {
        this.isToleranceEnabled = e.target.checked;
        if (this.ui.toleranceContainer) {
            this.ui.toleranceContainer.style.display = this.isToleranceEnabled ? 'block' : 'none';
        }
        if (this.isRealtimePreviewEnabled && this.selectedPixels) {
            this.applyColorReplacement();
        }
    }
    
    /**
     * Loads an image from a file input
     * @param {Event} event - The file input change event
     */
    loadImage(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            
            img.onload = () => {
                // Set canvas dimensions
                this.canvas.width = img.width;
                this.canvas.height = img.height;
                
                // Draw image on canvas
                this.ctx.drawImage(img, 0, 0);
                
                // Store original image data
                this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                this.currentImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                this.originalPixels = new Uint8ClampedArray(this.originalImageData.data);
                
                // Reset selection
                this.selectedColor = null;
                this.selectedPixels = null;
                
                // Update UI
                const rgbDisplay = document.getElementById('selectedColorRGB');
                const hexDisplay = document.getElementById('selectedColorHEX');
                const colorPreview = document.getElementById('selectedColorPreview');
                
                if (rgbDisplay) rgbDisplay.textContent = '-';
                if (hexDisplay) hexDisplay.textContent = '-';
                if (colorPreview) colorPreview.style.backgroundColor = 'transparent';
            };
            
            img.onerror = () => {
                console.error('Error loading image');
                this.showMessage('Error loading image', 'error');
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            console.error('Error reading file');
            this.showMessage('Error reading file', 'error');
        };
        
        reader.readAsDataURL(file);
    }
    
    /**
     * Handle tab change events
     */
    handleTabChange(event) {
        const tabName = event.detail.tab;
        if (tabName === 'isolationSelection' && this.originalImageData) {
            // Update the canvas when switching to this tab
            this.ctx.putImageData(this.currentImageData || this.originalImageData, 0, 0);
        }
    }
    
    /**
     * Calculate color distance between two RGB colors
     */
    calculateColorDistance(color1, color2) {
        const rMean = (color1.r + color2.r) / 2;
        const r = color1.r - color2.r;
        const g = color1.g - color2.g;
        const b = color1.b - color2.b;
        return Math.sqrt((2 + rMean/256) * r*r + 4 * g*g + (2 + (255 - rMean)/256) * b*b);
    }
    
    /**
     * Convert RGB to HEX
     */
    rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }
    
    /**
     * Convert HEX to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}
