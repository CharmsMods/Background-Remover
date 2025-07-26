import { colorDistance, applyOpacityGamma, smoothInterpolation } from '../utils.js';

export class ImageProcessor {
    constructor() {
        // Object pool for ImageData and Uint8ClampedArray reuse
        this.imageDataPool = [];
        this.arrayPool = [];
        this.maxPoolSize = 5;
    }

    /**
     * Gets a Uint8ClampedArray from the pool or creates a new one
     */
    getArrayFromPool(length) {
        const poolIndex = this.arrayPool.findIndex(arr => arr.length >= length);
        if (poolIndex !== -1) {
            return this.arrayPool.splice(poolIndex, 1)[0];
        }
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
            coreZone,
            selectedColor
        } = settings;

        for (let i = startIndex; i < endIndex && i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const originalAlpha = originalData ? originalData[i + 3] : 255;

            if (!isToleranceMode) continue;

            const currentPixelColor = { r, g, b };
            const dist = colorDistance(selectedColor, currentPixelColor);

            if (dist <= currentToleranceRadius) {
                if (isColorReplacement) {
                    this.applyColorReplacement(data, i, r, g, b, originalAlpha, dist, {
                        replacementColor, sliderVal, isAntiAliasing, smoothingFactor, fadeZone, coreZone
                    });
                } else {
                    this.applyTransparency(data, i, originalAlpha, dist, {
                        sliderVal, isAntiAliasing, smoothingFactor, fadeZone, coreZone
                    });
                }
            } else {
                data[i + 3] = originalAlpha;
            }
        }
        
        if (callback) callback();
    }

    /**
     * Applies color replacement to a pixel
     */
    applyColorReplacement(data, i, r, g, b, originalAlpha, dist, settings) {
        const { replacementColor, sliderVal, isAntiAliasing, smoothingFactor, fadeZone, coreZone } = settings;
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
    }

    /**
     * Applies transparency to a pixel
     */
    applyTransparency(data, i, originalAlpha, dist, settings) {
        const { sliderVal, isAntiAliasing, smoothingFactor, fadeZone, coreZone } = settings;
        
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
}
