// Constants and DOM element references
export const DOM_ELEMENTS = {
    // File input and canvas
    imageUpload: document.getElementById('imageUpload'),
    imageCanvas: document.getElementById('imageCanvas'),
    
    // Control sliders and toggles
    opacitySlider: document.getElementById('opacitySlider'),
    toleranceToggle: document.getElementById('toleranceToggle'),
    toleranceSliderContainer: document.getElementById('toleranceSliderContainer'),
    toleranceStrengthSlider: document.getElementById('toleranceStrengthSlider'),
    antiAliasingToggle: document.getElementById('antiAliasingToggle'),
    smoothingSliderContainer: document.getElementById('smoothingSliderContainer'),
    smoothingFactorSlider: document.getElementById('smoothingFactorSlider'),
    
    // Display elements
    hexDisplay: document.getElementById('hexDisplay'),
    rgbDisplay: document.getElementById('rgbDisplay'),
    resolutionDisplay: document.getElementById('resolutionDisplay'),
    colorSwatch: document.getElementById('colorSwatch'),
    
    // Action buttons
    resetButton: document.getElementById('resetButton'),
    downloadButton: document.getElementById('downloadButton'),
    applyButton: document.getElementById('applyButton'),
    previewButton: document.getElementById('previewButton'),
    
    // Message and warning elements
    messageBox: document.getElementById('message-box'),
    messageText: document.getElementById('message-text'),
    performanceWarning: document.getElementById('performance-warning'),
    dismissWarning: document.getElementById('dismiss-warning'),
    
    // Copy buttons
    copyHexButton: document.getElementById('copyHexButton'),
    copyRgbButton: document.getElementById('copyRgbButton'),
    
    // Color replacement elements
    colorReplacementToggle: document.getElementById('colorReplacementToggle'),
    colorPickerContainer: document.getElementById('colorPickerContainer'),
    replacementColorPicker: document.getElementById('replacementColorPicker'),
    replacementColorDisplay: document.getElementById('replacementColorDisplay'),
    
    // Preview controls
    realtimePreviewToggle: document.getElementById('realtimePreviewToggle'),
    
    // Value displays
    opacityValue: document.getElementById('opacityValue'),
    toleranceValue: document.getElementById('toleranceValue'),
    smoothingValue: document.getElementById('smoothingValue'),
    
    // Image Editing Tab Elements
    imageUploadEdit: document.getElementById('imageUploadEdit'),
    imageCanvasEdit: document.getElementById('imageCanvasEdit'),
    uploadFromTabBg: document.getElementById('uploadFromTabBg'),
    uploadFromTabEdit: document.getElementById('uploadFromTabEdit'),
    previewButtonEdit: document.getElementById('previewButtonEdit'),
    resetButtonEdit: document.getElementById('resetButtonEdit'),
    applyButtonEdit: document.getElementById('applyButtonEdit'),
    downloadButtonEdit: document.getElementById('downloadButtonEdit'),
    realtimePreviewToggleEdit: document.getElementById('realtimePreviewToggleEdit'),
    resolutionDisplayEdit: document.getElementById('resolutionDisplayEdit'),
    
    // Image Editing Sliders
    brightnessSlider: document.getElementById('brightnessSlider'),
    contrastSlider: document.getElementById('contrastSlider'),
    saturationSlider: document.getElementById('saturationSlider'),
    hueSlider: document.getElementById('hueSlider'),
    exposureSlider: document.getElementById('exposureSlider'),
    highlightsSlider: document.getElementById('highlightsSlider'),
    shadowsSlider: document.getElementById('shadowsSlider'),
    
    // Image Editing Value Displays
    brightnessValue: document.getElementById('brightnessValue'),
    contrastValue: document.getElementById('contrastValue'),
    saturationValue: document.getElementById('saturationValue'),
    hueValue: document.getElementById('hueValue'),
    exposureValue: document.getElementById('exposureValue'),
    highlightsValue: document.getElementById('highlightsValue'),
    shadowsValue: document.getElementById('shadowsValue'),
    
    // Tab Upload Modal
    tabUploadModal: document.getElementById('tabUploadModal'),
    importFromBackground: document.getElementById('importFromBackground'),
    importFromEditing: document.getElementById('importFromEditing'),
    cancelTabUpload: document.getElementById('cancelTabUpload'),
    
    // Memory Management Modal
    memoryManagementModal: document.getElementById('memoryManagementModal'),
    memoryUsageDisplay: document.getElementById('memoryUsageDisplay'),
    memoryUsageBar: document.getElementById('memoryUsageBar'),
    memoryTabOptions: document.getElementById('memoryTabOptions'),
    skipMemoryCleanup: document.getElementById('skipMemoryCleanup'),
    clearSelectedTabs: document.getElementById('clearSelectedTabs'),
    clearAllOtherTabs: document.getElementById('clearAllOtherTabs')
};

// Canvas context with optimization
export const ctx = DOM_ELEMENTS.imageCanvas.getContext('2d', { willReadFrequently: true });

// Performance constants
export const PERFORMANCE_CONFIG = {
    THRESHOLD_MS: 750,
    CHECK_COUNT_RESET: 2,
    GAMMA_VALUE: 2.2
};

// Default values
export const DEFAULTS = {
    TOLERANCE_STRENGTH: 20,
    SMOOTHING_FACTOR: 1.0,
    REPLACEMENT_COLOR: '#ff0000',
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
    PLACEHOLDER_BG: '#e2e8f0',
    PLACEHOLDER_TEXT: '#64748b'
};