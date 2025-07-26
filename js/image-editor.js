// Image editing functionality for the editing tab
import { showMessage } from './ui-manager.js';

/**
 * Image editor class for general image editing operations
 */
export class ImageEditor {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.originalImageData = null;
        this.originalImage = new Image();
        this.isRealtimePreviewEnabled = true;
        
        // Performance tracking
        this.performanceCheckCount = 0;
        this.totalProcessingTime = 0;
        this.isPerformanceModeActive = false;
    }

    /**
     * Loads an image onto the canvas
     */
    loadImage(file, updateResolutionCallback) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.originalImage = new Image();
                this.originalImage.onload = () => {
                    // Set canvas dimensions
                    this.canvas.width = this.originalImage.width;
                    this.canvas.height = this.originalImage.height;
                    
                    // Draw image
                    this.ctx.drawImage(this.originalImage, 0, 0);
                    
                    // Store original data
                    this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                    
                    // Update resolution display
                    if (updateResolutionCallback) {
                        updateResolutionCallback(this.originalImage.width, this.originalImage.height);
                    }
                    
                    showMessage('Image loaded successfully!', 'success');
                    resolve({
                        imageData: this.originalImageData,
                        originalImage: this.originalImage
                    });
                };
                this.originalImage.onerror = () => {
                    showMessage('Could not load image. Please try a different file.', 'error');
                    reject(new Error('Failed to load image'));
                };
                this.originalImage.src = e.target.result;
            };
            reader.onerror = () => {
                showMessage('Error reading file. Please try again.', 'error');
                reject(new Error('Failed to read file'));
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * Sets image data directly (for tab transfers)
     */
    setImageData(imageData, originalImage, updateResolutionCallback) {
        this.originalImageData = imageData;
        this.originalImage = originalImage;
        
        this.canvas.width = imageData.width;
        this.canvas.height = imageData.height;
        this.ctx.putImageData(imageData, 0, 0);
        
        if (updateResolutionCallback) {
            updateResolutionCallback(imageData.width, imageData.height);
        }
        
        showMessage('Image imported from tab successfully!', 'success');
    }

    /**
     * Inverts the colors of the image
     */
    invertColors() {
        if (!this.originalImageData) return;

        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            // Skip transparent pixels
            if (data[i + 3] === 0) continue;
            
            // Invert each color channel
            data[i] = 255 - data[i];         // Red
            data[i + 1] = 255 - data[i + 1]; // Green
            data[i + 2] = 255 - data[i + 2]; // Blue
        }

        // Apply the inverted colors to the canvas
        this.ctx.putImageData(imageData, 0, 0);
        
        // Update the original image data if in real-time preview mode
        if (this.isRealtimePreviewEnabled) {
            this.originalImageData = imageData;
        }
        
        return imageData;
    }

    /**
     * Applies image editing filters based on current slider values
     */
    applyFilters(settings, isPreview = false) {
        if (!this.originalImageData) return;

        // Start performance timer
        const startTime = performance.now();

        // Create a copy of the original image data
        const imageData = new ImageData(
            new Uint8ClampedArray(this.originalImageData.data),
            this.originalImageData.width,
            this.originalImageData.height
        );
        const data = imageData.data;

        // Apply brightness, contrast, etc.
        for (let i = 0; i < data.length; i += 4) {
            // Skip transparent pixels (alpha channel = 0)
            if (data[i + 3] === 0) continue;

            // Apply brightness
            if (settings.brightness !== 0) {
                data[i] = Math.max(0, Math.min(255, data[i] + settings.brightness * 2.55));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + settings.brightness * 2.55));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + settings.brightness * 2.55));
            }

            // Apply contrast
            if (settings.contrast !== 0) {
                const factor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
                data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
                data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
                data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
            }

            // Apply saturation
            if (settings.saturation !== 0) {
                const gray = 0.2989 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                data[i] = Math.max(0, Math.min(255, gray + (data[i] - gray) * (1 + settings.saturation / 100)));
                data[i + 1] = Math.max(0, Math.min(255, gray + (data[i + 1] - gray) * (1 + settings.saturation / 100)));
                data[i + 2] = Math.max(0, Math.min(255, gray + (data[i + 2] - gray) * (1 + settings.saturation / 100)));
            }

            // Apply hue rotation
            if (settings.hue !== 0) {
                const h = settings.hue * (Math.PI / 180);
                const cos = Math.cos(h);
                const sin = Math.sin(h);
                
                // RGB to YIQ
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                
                const y = 0.299 * r + 0.587 * g + 0.114 * b;
                const iq = 0.595716 * r - 0.274453 * g - 0.321263 * b;
                const q = 0.211456 * r - 0.522591 * g + 0.311135 * b;
                
                // Apply hue rotation
                const newI = cos * iq - sin * q;
                const newQ = sin * iq + cos * q;
                
                // YIQ to RGB
                data[i] = Math.max(0, Math.min(255, y + 0.9563 * newI + 0.6210 * newQ));
                data[i + 1] = Math.max(0, Math.min(255, y - 0.2721 * newI - 0.6474 * newQ));
                data[i + 2] = Math.max(0, Math.min(255, y - 1.1070 * newI + 1.7046 * newQ));
            }

            // Apply exposure
            if (settings.exposure !== 0) {
                const exposure = 1 + (settings.exposure / 100);
                data[i] = Math.max(0, Math.min(255, data[i] * exposure));
                data[i + 1] = Math.max(0, Math.min(255, data[i + 1] * exposure));
                data[i + 2] = Math.max(0, Math.min(255, data[i + 2] * exposure));
            }
        }

        // Apply highlights and shadows
        // ... (existing highlights and shadows code)

        // Apply the processed image data to the canvas
        this.ctx.putImageData(imageData, 0, 0);

        // Calculate and log performance
        const endTime = performance.now();
        const processingTime = endTime - startTime;
        this.totalProcessingTime += processingTime;
        this.performanceCheckCount++;

        // Log performance every 10 operations
        if (this.performanceCheckCount >= 10) {
            const avgTime = this.totalProcessingTime / this.performanceCheckCount;
            console.log(`Average filter processing time: ${avgTime.toFixed(2)}ms`);
            this.performanceCheckCount = 0;
            this.totalProcessingTime = 0;

            // If average time is too high, suggest performance mode
            if (avgTime > 100 && !this.isPerformanceModeActive) {
                showMessage(
                    'Performance Notice: Image processing is taking longer than usual. Consider using Performance Mode for better responsiveness.',
                    'warning'
                );
            }
        }

        // If this is just a preview, don't update the original image data
        if (!isPreview) {
            this.originalImageData = imageData;
        }
        
        return imageData;
    }

    /**
     * Converts RGB to HSL
     */
    rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return { h, s, l };
    }

    /**
     * Converts HSL to RGB
     */
    hslToRgb(h, s, l) {
        let r, g, b;

        if (s === 0) {
            r = g = b = l; // achromatic
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return { r: r * 255, g: g * 255, b: b * 255 };
    }

    /**
     * Resets the image to original state
     */
    reset() {
        if (this.originalImage && this.originalImage.src) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(this.originalImage, 0, 0);
            this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            showMessage('Image reset to original state.', 'info');
        }
    }

    /**
     * Applies current changes as new baseline
     */
    apply() {
        if (this.originalImageData) {
            this.originalImageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
            showMessage('Current edits applied!', 'success');
        }
    }

    /**
     * Downloads the current image
     */
    download() {
        if (!this.originalImageData) {
            showMessage('Please upload and edit an image first to download.', 'info');
            return;
        }

        const dataURL = this.canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'edited-image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showMessage('Image downloaded successfully!', 'success');
    }

    /**
     * Gets current image data for tab state saving
     */
    getCurrentImageData() {
        if (this.canvas.width > 0 && this.canvas.height > 0) {
            return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        }
        return null;
    }

    /**
     * Sets real-time preview mode
     */
    setRealtimePreview(enabled) {
        this.isRealtimePreviewEnabled = enabled;
    }

    /**
     * Resets performance tracking
     */
    resetPerformanceTracking() {
        this.isRealtimePreviewEnabled = true;
        this.performanceCheckCount = 0;
        this.totalProcessingTime = 0;
        this.isPerformanceModeActive = false;
    }
}