import { showMessage, updateResolutionDisplay } from '../ui-manager.js';

export class ImageLoader {
    constructor() {
        this.originalImage = new Image();
        this.originalImageData = null;
    }

    /**
     * Creates a downscaled version of an image
     */
    createDownscaledImage(image, maxDimension) {
        let width = image.width;
        let height = image.height;
        
        // Calculate dimensions to maintain aspect ratio
        if (width > height && width > maxDimension) {
            height = Math.round((height / width) * maxDimension);
            width = maxDimension;
        } else if (height > maxDimension) {
            width = Math.round((width / height) * maxDimension);
            height = maxDimension;
        }
        
        // Create a temporary canvas for downscaling
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw the downscaled image
        tempCtx.imageSmoothingEnabled = true;
        tempCtx.imageSmoothingQuality = 'high';
        tempCtx.drawImage(image, 0, 0, width, height);
        
        // Create a new image from the canvas
        const downscaledImage = new Image();
        downscaledImage.src = tempCanvas.toDataURL('image/jpeg', 0.7);
        return downscaledImage;
    }

    /**
     * Loads an image file with progressive enhancement
     */
    loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    showMessage('Loading preview...', 'info');
                    
                    // Create a downscaled version for initial display
                    const previewImage = this.createDownscaledImage(img, 800);
                    
                    previewImage.onload = () => {
                        this.originalImage = previewImage;
                        this.originalImageData = null; // Will be set after full load
                        
                        showMessage('Preview loaded! Loading full resolution...', 'success');
                        
                        // Start loading the full resolution in the background
                        setTimeout(() => {
                            this.loadFullResolution(e.target.result, resolve, reject);
                        }, 100);
                    };
                    
                    previewImage.onerror = () => {
                        showMessage('Could not create preview.', 'error');
                        reject(new Error('Failed to create preview'));
                    };
                };
                
                img.onerror = () => {
                    showMessage('Could not load image. Please try a different file.', 'error');
                    reject(new Error('Failed to load image'));
                };
                
                img.src = e.target.result;
            };
            
            reader.onerror = () => {
                showMessage('Error reading file. Please try again.', 'error');
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    }

    /**
     * Loads the full resolution image after preview is shown
     */
    loadFullResolution(src, resolve, reject) {
        const fullImage = new Image();
        
        fullImage.onload = () => {
            this.originalImage = fullImage;
            this.originalImageData = null; // Will be set by the caller
            
            // Update resolution display
            updateResolutionDisplay(fullImage.width, fullImage.height);
            
            showMessage('Full resolution loaded!', 'success');
            
            resolve({
                image: fullImage,
                width: fullImage.width,
                height: fullImage.height
            });
        };
        
        fullImage.onerror = () => {
            showMessage('Could not load full resolution image.', 'warning');
            // Still resolve with what we have
            resolve({
                image: this.originalImage,
                width: this.originalImage.width,
                height: this.originalImage.height
            });
        };
        
        fullImage.src = src;
    }

    /**
     * Sets image data directly (for tab transfers)
     */
    setImageData(imageData, originalImage) {
        this.originalImage = originalImage;
        this.originalImageData = imageData;
        
        // Update resolution display
        updateResolutionDisplay(imageData.width, imageData.height);
        
        showMessage('Image imported successfully!', 'success');
        
        return {
            image: originalImage,
            imageData,
            width: imageData.width,
            height: imageData.height
        };
    }
}
