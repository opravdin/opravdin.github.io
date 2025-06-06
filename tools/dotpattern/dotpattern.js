class DotPatternGenerator {
    constructor() {
        this.initElements();
        this.attachEventListeners();
        this.aperiodicGenerator = new AperiodicPatternGenerator();
    }

    initElements() {
        this.sheetCountInput = document.getElementById('sheetCount');
        this.dotSizeCheckboxes = document.querySelectorAll('input[name="dotSize"]');
        this.customSizeInput = document.getElementById('customSize');
        this.densitySlider = document.getElementById('density');
        this.densityValue = document.getElementById('densityValue');
        this.approxCount = document.getElementById('approxCount');
        this.invertedCheckbox = document.getElementById('inverted');
        this.generateBtn = document.getElementById('generateBtn');
        this.printBtn = document.getElementById('printBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.previewContainer = document.getElementById('previewContainer');
        this.generatedPoints = [];
    }

    attachEventListeners() {
        this.generateBtn.addEventListener('click', () => this.generatePattern());
        this.printBtn.addEventListener('click', () => this.printPattern());
        this.exportBtn.addEventListener('click', () => this.exportToSVG());
        
        this.densitySlider.addEventListener('input', (e) => {
            this.densityValue.textContent = e.target.value + '%';
            this.updateApproximateCount();
        });
        
        // Update count on page load and when dot sizes change
        this.dotSizeCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => this.updateApproximateCount());
        });
        this.updateApproximateCount();

        // Enable/disable custom size input
        const customCheckbox = document.querySelector('input[value="custom"]');
        customCheckbox.addEventListener('change', (e) => {
            this.customSizeInput.disabled = !e.target.checked;
            if (e.target.checked) {
                this.customSizeInput.focus();
            }
        });
    }

    getSelectedDotSizes() {
        const sizes = [];
        this.dotSizeCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                if (checkbox.value === 'custom') {
                    const customValue = parseFloat(this.customSizeInput.value);
                    if (customValue > 0) {
                        sizes.push(customValue);
                    }
                } else {
                    sizes.push(parseFloat(checkbox.value));
                }
            }
        });
        return sizes;
    }

    generatePattern() {
        const sheetCount = parseInt(this.sheetCountInput.value);
        const dotSizes = this.getSelectedDotSizes();
        const density = parseInt(this.densitySlider.value) / 100;
        const inverted = this.invertedCheckbox.checked;

        if (dotSizes.length === 0) {
            alert('Пожалуйста, выберите хотя бы один размер точек');
            return;
        }

        // Clear preview
        this.previewContainer.innerHTML = '';
        this.generatedPoints = [];

        // Generate sheets
        for (let i = 0; i < sheetCount; i++) {
            const sheet = this.createSheet(dotSizes, density, inverted);
            this.previewContainer.appendChild(sheet);
        }

        // Enable buttons
        this.printBtn.disabled = false;
        this.exportBtn.disabled = false;
    }

    createSheet(dotSizes, density, inverted) {
        const sheet = document.createElement('div');
        sheet.className = 'pattern-sheet' + (inverted ? ' inverted' : '');
        
        // A4 dimensions in pixels (96 DPI)
        const width = 794; // 210mm
        const height = 1123; // 297mm
        
        // Calculate minimum spacing
        const maxDotSize = Math.max(...dotSizes);
        const maxDotSizeMm = maxDotSize;
        const maxDotSizePx = maxDotSizeMm * 3.78; // Convert mm to pixels
        
        // Minimum spacing should be at least 3-4 times the dot diameter
        const minSpacing = maxDotSizePx * 4; // Increased spacing
        
        // Generate aperiodic pattern with proper margins
        // Add margin to ensure dots don't get cut off at edges
        // Convert 5mm to pixels for a minimal margin
        const minMarginMm = 5; // 5mm margin
        const minMarginPx = minMarginMm * 3.78; // Convert to pixels
        
        // Use the larger of minimum margin or half dot size
        const marginX = Math.max(maxDotSizePx / 2, minMarginPx);
        const marginY = Math.max(maxDotSizePx / 2, minMarginPx);
        const effectiveWidth = width - 2 * marginX;
        const effectiveHeight = height - 2 * marginY;
        
        const points = this.aperiodicGenerator.generatePattern(
            effectiveWidth, 
            effectiveHeight, 
            minSpacing, 
            density,
            5 // uniqueness radius (number of neighbors to check)
        );
        
        // Offset all points by the margin and assign sizes
        const offsetPoints = points.map(p => {
            const dotSize = dotSizes[Math.floor(Math.random() * dotSizes.length)];
            return {
                x: p.x + marginX,
                y: p.y + marginY,
                size: dotSize
            };
        });
        
        // Store points for export
        this.generatedPoints.push({
            points: offsetPoints,
            dotSizes: dotSizes,
            inverted: inverted,
            width: width,
            height: height
        });
        
        // Place dots
        for (const point of offsetPoints) {
            const dotSize = point.size;
            
            const dot = document.createElement('div');
            dot.className = 'dot';
            
            // Convert mm to pixels (assuming 96 DPI)
            const dotSizePx = dotSize * 3.78; // 1mm ≈ 3.78px at 96 DPI
            
            dot.style.width = dotSizePx + 'px';
            dot.style.height = dotSizePx + 'px';
            dot.style.left = (point.x - dotSizePx/2) + 'px';
            dot.style.top = (point.y - dotSizePx/2) + 'px';
            
            sheet.appendChild(dot);
        }
        
        // Add pattern info
        const info = document.createElement('div');
        info.className = 'pattern-info';
        info.textContent = `Точек: ${points.length}`;
        sheet.appendChild(info);
        
        return sheet;
    }

    printPattern() {
        window.print();
    }

    updateApproximateCount() {
        const density = parseInt(this.densitySlider.value) / 100;
        const dotSizes = this.getSelectedDotSizes();
        
        if (dotSizes.length === 0) {
            this.approxCount.textContent = '(выберите размер точек)';
            return;
        }
        
        // Calculate approximate count based on A4 dimensions and selected sizes
        const width = 794; // pixels
        const height = 1123; // pixels
        const maxDotSize = Math.max(...dotSizes);
        const maxDotSizePx = maxDotSize * 3.78;
        const minSpacing = maxDotSizePx * 4;
        
        // Account for margins
        const minMarginMm = 5;
        const minMarginPx = minMarginMm * 3.78;
        const marginX = Math.max(maxDotSizePx / 2, minMarginPx);
        const marginY = Math.max(maxDotSizePx / 2, minMarginPx);
        const effectiveWidth = width - 2 * marginX;
        const effectiveHeight = height - 2 * marginY;
        
        // Estimate using hexagonal packing
        const areaPerPoint = (Math.sqrt(3) / 2) * minSpacing * minSpacing;
        const maxPoints = Math.floor((effectiveWidth * effectiveHeight) / areaPerPoint);
        const estimatedCount = Math.floor(maxPoints * density * 0.7);
        
        // Give a range
        const minCount = Math.floor(estimatedCount * 0.8);
        const maxCount = Math.floor(estimatedCount * 1.2);
        
        this.approxCount.textContent = `(~${minCount}-${maxCount} точек)`;
    }

    exportToSVG() {
        if (this.generatedPoints.length === 0) {
            alert('Сначала сгенерируйте паттерн');
            return;
        }

        this.generatedPoints.forEach((sheetData, index) => {
            // Convert points from pixels to mm (96 DPI: 1 inch = 25.4mm = 96px)
            const pxToMm = 25.4 / 96;
            
            // Create SVG manually to support different sizes per dot
            let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="210mm" height="297mm" viewBox="0 0 210 297" xmlns="http://www.w3.org/2000/svg">
    <rect width="210" height="297" fill="${sheetData.inverted ? 'white' : 'black'}"/>`;
            
            for (const point of sheetData.points) {
                const xMm = point.x * pxToMm;
                const yMm = point.y * pxToMm;
                const radiusMm = point.size / 2;
                svg += `\n    <circle cx="${xMm}" cy="${yMm}" r="${radiusMm}" fill="${sheetData.inverted ? 'black' : 'white'}"/>`;
            }
            
            svg += '\n</svg>';

            // Download the SVG
            const blob = new Blob([svg], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `pattern_sheet_${index + 1}.svg`;
            link.click();
            URL.revokeObjectURL(url);
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DotPatternGenerator();
});