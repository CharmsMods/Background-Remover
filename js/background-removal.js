// Background removal tab functionality
import { DOM_ELEMENTS, ctx, PERFORMANCE_CONFIG } from './constants.js';
import { hexToRgb } from './utils.js';
import { showMessage, updateColorDisplay, updateResolutionDisplay } from './ui-manager.js';
import { ImageLoader } from './modules/image-loader.js';
import { ImageProcessor } from './modules/image-processor.js';
import { PerformanceManager } from './modules/performance-manager.js';

/**
 * Background removal processor class
 */
export class BackgroundRemovalProcessor {
    constructor() {
        this.loader = new ImageLoader();
        this.processor = new ImageProcessor();
        this.performance = new PerformanceManager();
        
        // State
        this.originalImage = null;
        this.originalImageData = null;
        this.selectedColor = null; // {r, g, b}
        this.isRealtimePreviewEnabled = true;
    }

    /**
     * Loads an image for background removal with progressive enhancement
     */
    loadImage(file) {
        return this.loader.loadImage(file).then(({ image, width, height }) => {
            // Store the loaded image
            this.originalImage = image;
            
            // Draw the image on canvas
            DOM_ELEMENTS.imageCanvas.width = width;
            DOM_ELEMENTS.imageCanvas.height = height;
            ctx.drawImage(image, 0, 0, width, height);
            
            // Store the original image data
            this.originalImageData = ctx.getImageData(0, 0, width, height);
            
            // Reset state
            this.selectedColor = null;
            this.performance.reset();
            
            showMessage('Image loaded successfully! Click on the image to pick a color.', 'success');
            
            return {
                imageData: this.originalImageData,
                originalImage: this.originalImage
            };
        });
    }

    /**
     * Sets image data directly (for tab transfers)
     */
    setImageData(imageData, originalImage) {
        const result = this.loader.setImageData(imageData, originalImage);
        
        // Update canvas with the new image
        DOM_ELEMENTS.imageCanvas.width = imageData.width;
        DOM_ELEMENTS.imageCanvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        
        // Update internal state
        this.originalImage = originalImage;
        this.originalImageData = imageData;
        this.selectedColor = null;
        this.performance.reset();
        
        return result;
    }
    
    /**
     * Picks a color from the canvas
     */
    pickColor(event) {
        if (!this.originalImageData) {
            showMessage('Please upload an image first.', 'info');
            return;
        }

        // Get mouse coordinates
        const rect = DOM_ELEMENTS.imageCanvas.getBoundingClientRect();
        const scaleX = DOM_ELEMENTS.imageCanvas.width / rect.width;
        const scaleY = DOM_ELEMENTS.imageCanvas.height / rect.height;
        const x = Math.floor((event.clientX - rect.left) * scaleX);
        const y = Math.floor((event.clientY - rect.top) * scaleY);

        // Get pixel data
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        this.selectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

        // Update display
        updateColorDisplay(this.selectedColor, (r, g, b) => {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        });

        // Apply filter immediately
        this.applyFilter(true);
        showMessage('Color picked! Adjust opacity or toggle tolerance.', 'info');
    }

    /**
     * Sets image data directly (for tab transfers)
     */
    setImageData(imageData, originalImage) {
        const result = this.loader.setImageData(imageData, originalImage);
        
        // Update canvas with the new image
        DOM_ELEMENTS.imageCanvas.width = imageData.width;
        DOM_ELEMENTS.imageCanvas.height = imageData.height;
        ctx.putImageData(imageData, 0, 0);
        
        // Update internal state
        this.originalImage = originalImage;
        this.originalImageData = imageData;
        this.selectedColor = null;
        this.performance.reset();
        
        return result;
    }

    /**
     * Picks a color from the canvas
     */
    pickColor(event) {
        if (!this.originalImageData) {
            showMessage('Please upload an image first.', 'info');
            return;
        }

        // Get mouse coordinates
        const rect = DOM_ELEMENTS.imageCanvas.getBoundingClientRect();
        const scaleX = DOM_ELEMENTS.imageCanvas.width / rect.width;
        const scaleY = DOM_ELEMENTS.imageCanvas.height / rect.height;
        const x = Math.floor((event.clientX - rect.left) * scaleX);
        const y = Math.floor((event.clientY - rect.top) * scaleY);

        // Get pixel data
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        this.selectedColor = { r: pixel[0], g: pixel[1], b: pixel[2] };

        // Update display
        updateColorDisplay(this.selectedColor, (r, g, b) => {
            return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
        });

        // Apply filter immediately
        this.applyFilter(true);
        showMessage('Color picked! Adjust opacity or toggle tolerance.', 'info');
    }

    /**
     * Processes a chunk of pixels for background removal
     */
    /**
     * Gets a Uint8ClampedArray from the pool or creates a new one
     */
    getArrayFromPool(length) {
        // Try to find a suitable array in the pool
        const poolIndex = this.arrayPool.findIndex(arr => arr.length >= length);
        
        if (poolIndex !== -1) {
            // Return array from pool and remove it from the pool
            const array = this.arrayPool.splice(poolIndex, 1)[0];
            return array;
        }
        
        // No suitable array found, create a new one
        return new Uint8ClampedArray(length);
    }

    /**
     * Returns a Uint8ClampedArray to the pool for reuse
     */
    returnArrayToPool(array) {
        if (this.arrayPool.length < this.maxPoolSize) {
            this.arrayPool.push(array);
        }
    }

    /**
     * Processes a chunk of pixels for background removal
     */
    processPixelsChunked(data, startIndex, endIndex, settings, originalData, callback) {
        const { 
            isToleranceMode, 
            currentToleranceRadius, 
            isColorReplacement, 
            replacementColor, 
            sliderVal,
            isAntiAliasing,
            smoothingFactor,
            fadeZone,
            coreZone
        } = settings;

        for (let i = startIndex; i < endIndex && i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const originalAlpha = originalData ? originalData[i + 3] : 255;

            if (!isToleranceMode) continue;

            const currentPixelColor = { r, g, b };
            const dist = colorDistance(this.selectedColor, currentPixelColor);

            if (dist <= currentToleranceRadius) {
                if (isColorReplacement) {
                    const correctedOpacity = applyOpacityGamma(sliderVal);
                    
                    if (isAntiAliasing) {
                        if (dist <= coreZone) {
                            data[i] = Math.round(r + (replacementColor.r - r) * correctedOpacity);
                            data[i + 1] = Math.round(g + (replacementColor.g - g) * correctedOpacity);
                            data[i + 2] = Math.round(b + (replacementColor.b - b) * correctedOpacity);
                        } else {
                            const fadeProgress = (dist - coreZone) / fadeZone;
                            const smoothProgress = smoothInterpolation(fadeProgress, smoothingFactor);
                            const distanceFactor = 1 - smoothProgress;
                            const finalBlendFactor = correctedOpacity * distanceFactor;

                            data[i] = Math.round(r + (replacementColor.r - r) * finalBlendFactor);
                            data[i + 1] = Math.round(g + (replacementColor.g - g) * finalBlendFactor);
                            data[i + 2] = Math.round(b + (replacementColor.b - b) * finalBlendFactor);
                        }
                    } else {
                        data[i] = Math.round(r + (replacementColor.r - r) * correctedOpacity);
                        data[i + 1] = Math.round(g + (replacementColor.g - g) * correctedOpacity);
                        data[i + 2] = Math.round(b + (replacementColor.b - b) * correctedOpacity);
                    }
                    data[i + 3] = originalAlpha;
                } else {
                    // Transparency mode
                    if (isAntiAliasing) {
                        if (dist <= coreZone) {
                            data[i + 3] = 0;
                        } else {
                            const fadeProgress = (dist - coreZone) / fadeZone;
                            const smoothProgress = smoothInterpolation(fadeProgress, smoothingFactor);
                            data[i + 3] = Math.round(originalAlpha * smoothProgress);
                        }
                    } else {
                        data[i + 3] = 0;
                    }
                }
            } else {
                data[i + 3] = originalAlpha;
            }
        }
        
        // Execute callback when done
        if (callback) callback();
    }

    /**
     * Applies the background removal filter using requestAnimationFrame for smooth UI
     */
    applyFilter(forceUpdate = false) {
        if (!this.isRealtimePreviewEnabled && !forceUpdate) {
            return;
        }

        const startTime = performance.now();
        
        if (!this.originalImageData || !this.selectedColor) {
            if (this.originalImage && this.originalImage.src) {
                ctx.clearRect(0, 0, DOM_ELEMENTS.imageCanvas.width, DOM_ELEMENTS.imageCanvas.height);
                ctx.drawImage(this.originalImage, 0, 0);
            }
            return;
        }

        // Get or create image data with pooling
        let imageData, data;
        
        if (this.imageDataPool.length > 0) {
            // Reuse existing ImageData from pool
            imageData = this.imageDataPool.pop();
            data = this.getArrayFromPool(this.originalImageData.data.length);
            data.set(this.originalImageData.data); // Copy original data
        } else {
            // Create new image data if pool is empty
            imageData = ctx.createImageData(this.originalImageData.width, this.originalImageData.height);
            data = new Uint8ClampedArray(this.originalImageData.data);
        }
        
        try {
            // Process the image data
            this.processor.processImageData(data, this.selectedColor, {
                tolerance: parseFloat(DOM_ELEMENTS.toleranceStrengthSlider?.value) || 20,
                smoothness: parseFloat(DOM_ELEMENTS.smoothingFactorSlider?.value) || 1.0,
                isAntiAliasing: DOM_ELEMENTS.antiAliasingToggle?.checked !== false
            });
            
            // Put the processed data back to the canvas
            imageData.data.set(data);
            ctx.putImageData(imageData, 0, 0);
            
            // Measure performance
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            this.trackPerformance(processingTime, forceUpdate);
            
            // Return the processed data to the pool for reuse
            this.returnArrayToPool(data);
            this.imageDataPool.push(imageData);
            
        } catch (error) {
            console.error('Error applying filter:', error);
            // Make sure to clean up in case of error
            if (data) this.returnArrayToPool(data);
            if (imageData) this.imageDataPool.push(imageData);
        }
    }
    
    /**
     * Toggles the real-time preview feature
     * @param {boolean} enabled - Whether real-time preview should be enabled
     */
    toggleRealtimePreview(enabled) {
        this.isRealtimePreviewEnabled = enabled;
        
        // If enabling and we have an image and color, apply the filter
        if (enabled && this.originalImageData && this.selectedColor) {
            this.applyFilter();
        }
        
        return this.isRealtimePreviewEnabled;
    }
    
    /**
     * Resets the processor to its initial state
     */
    reset() {
        this.originalImage = null;
        this.originalImageData = null;
        this.selectedColor = null;
        this.performance.reset();
        
        // Clear the canvas
        const canvas = DOM_ELEMENTS.imageCanvas;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Reset canvas dimensions
        canvas.width = 0;
        canvas.height = 0;
        
        // Clear any existing image data from the pool
        this.processor.clearPools();
    }
    
    /**
     * Exports the current image with the applied filters
     * @param {string} format - The export format ('png' or 'jpeg')
     * @param {number} quality - The quality for JPEG (0-1)
     * @returns {Promise<Blob>} A promise that resolves with the exported image blob
     */
    exportImage(format = 'png', quality = 0.92) {
        return new Promise((resolve, reject) => {
            try {
                const canvas = DOM_ELEMENTS.imageCanvas;
                const mimeType = `image/${format}`;
                
                // For JPEG, we need to ensure the background is white
                if (format === 'jpeg') {
                    // Create a temporary canvas with white background
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = canvas.height;
                    const tempCtx = tempCanvas.getContext('2d');
                    
                    // Fill with white background
                    tempCtx.fillStyle = '#FFFFFF';
                    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
                    
                    // Draw the original content on top
                    tempCtx.drawImage(canvas, 0, 0);
                    
                    // Export the temporary canvas
                    tempCanvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Failed to create image blob'));
                            }
                        },
                        mimeType,
                        quality
                    );
                } else {
                    // For PNG, just export as is
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                resolve(blob);
                            } else {
                                reject(new Error('Failed to create image blob'));
                            }
                        },
                        mimeType,
                        format === 'png' ? undefined : quality
                    );
                }
            } catch (error) {
                console.error('Error exporting image:', error);
                reject(error);
            }
        });
    }

    /**
     * Tracks performance and shows warnings if needed
     */
    trackPerformance(processingTime, forceUpdate) {
        if (this.isRealtimePreviewEnabled && !forceUpdate) {
            this.performanceCheckCount++;
            this.totalProcessingTime += processingTime;

            console.log(`Processing time: ${processingTime.toFixed(2)}ms (Count: ${this.performanceCheckCount})`);

            if (processingTime > PERFORMANCE_CONFIG.THRESHOLD_MS) {
                console.log('Single update exceeded threshold, disabling real-time preview');
                showPerformanceWarning(this);
            } else if (this.performanceCheckCount >= PERFORMANCE_CONFIG.CHECK_COUNT_RESET) {
                const averageTime = this.totalProcessingTime / this.performanceCheckCount;
                console.log(`Average processing time: ${averageTime.toFixed(2)}ms`);

                if (averageTime > PERFORMANCE_CONFIG.THRESHOLD_MS) {
                    console.log('Average performance threshold exceeded, disabling real-time preview');
                    showPerformanceWarning(this);
                }
                this.performanceCheckCount = 0;
                this.totalProcessingTime = 0;
            }
        }
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

    /**
     * Resets image to original state
     */
    reset() {
        if (this.originalImage && this.originalImage.src) {
            ctx.clearRect(0, 0, DOM_ELEMENTS.imageCanvas.width, DOM_ELEMENTS.imageCanvas.height);
            ctx.drawImage(this.originalImage, 0, 0);
            this.originalImageData = ctx.getImageData(0, 0, DOM_ELEMENTS.imageCanvas.width, DOM_ELEMENTS.imageCanvas.height);
            this.selectedColor = null;
            this.resetPerformanceTracking();
            showMessage('Image reset to original state.', 'info');
        }
    }

    /**
     * Applies current changes as new baseline
     */
    apply() {
        if (this.originalImageData) {
            this.originalImageData = ctx.getImageData(0, 0, DOM_ELEMENTS.imageCanvas.width, DOM_ELEMENTS.imageCanvas.height);
            this.selectedColor = null;
            this.resetPerformanceTracking();
            showMessage('Current edits applied! You can now pick a new color on the modified image.', 'success');
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

        const dataURL = DOM_ELEMENTS.imageCanvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'background-removed.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showMessage('Image downloaded successfully!', 'success');
    }

    /**
     * Gets current image data
     */
    getCurrentImageData() {
        if (DOM_ELEMENTS.imageCanvas.width > 0 && DOM_ELEMENTS.imageCanvas.height > 0) {
            return ctx.getImageData(0, 0, DOM_ELEMENTS.imageCanvas.width, DOM_ELEMENTS.imageCanvas.height);
        }
        return null;
    }

    /**
     * Sets real-time preview mode
     */
    setRealtimePreview(enabled) {
        this.isRealtimePreviewEnabled = enabled;
    }
}