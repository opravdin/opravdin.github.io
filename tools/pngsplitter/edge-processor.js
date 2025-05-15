/**
 * Edge Processor - модуль для обработки краев изображений
 * Улучшает качество краев стикеров, удаляя шум и сглаживая границы
 */

// Основная функция обработки изображения
function processEdges(imageData, options = {}) {
    // Параметры по умолчанию
    const defaults = {
        blurRadius: 1,        // Радиус размытия (1-5)
        threshold: 128,       // Порог прозрачности (0-255)
        edgeOnly: true        // Обрабатывать только края (true/false)
    };
    
    // Объединяем параметры по умолчанию с переданными опциями
    const settings = { ...defaults, ...options };
    
    // Создаем копию данных изображения для обработки
    const processedData = new ImageData(
        new Uint8ClampedArray(imageData.data), 
        imageData.width, 
        imageData.height
    );
    
    // Применяем размытие к краям
    blurEdges(processedData, settings.blurRadius, settings.edgeOnly);
    
    // Применяем порог прозрачности
    applyTransparencyThreshold(processedData, settings.threshold);
    
    return processedData;
}

// Функция для размытия краев изображения
function blurEdges(imageData, radius, edgeOnly) {
    const { width, height, data } = imageData;
    const tempData = new Uint8ClampedArray(data);
    
    // Для каждого пикселя
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            
            // Если обрабатываем только края и текущий пиксель не краевой, пропускаем
            if (edgeOnly && !isEdgePixel(imageData, x, y)) {
                continue;
            }
            
            // Применяем размытие (Box Blur)
            let r = 0, g = 0, b = 0, a = 0, count = 0;
            
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        const nidx = (ny * width + nx) * 4;
                        r += data[nidx];
                        g += data[nidx + 1];
                        b += data[nidx + 2];
                        a += data[nidx + 3];
                        count++;
                    }
                }
            }
            
            // Записываем средние значения
            tempData[idx] = Math.round(r / count);
            tempData[idx + 1] = Math.round(g / count);
            tempData[idx + 2] = Math.round(b / count);
            tempData[idx + 3] = Math.round(a / count);
        }
    }
    
    // Копируем обработанные данные обратно
    for (let i = 0; i < data.length; i++) {
        data[i] = tempData[i];
    }
}

// Функция для применения порога прозрачности
function applyTransparencyThreshold(imageData, threshold) {
    const { data } = imageData;
    
    // Для каждого пикселя
    for (let i = 0; i < data.length; i += 4) {
        // Если альфа-канал ниже порога, делаем пиксель полностью прозрачным
        if (data[i + 3] < threshold) {
            data[i + 3] = 0;
        }
    }
}

// Вспомогательная функция для определения, является ли пиксель краевым
function isEdgePixel(imageData, x, y) {
    const { width, height, data } = imageData;
    const idx = (y * width + x) * 4;
    
    // Если пиксель полностью прозрачный, это не край
    if (data[idx + 3] === 0) {
        return false;
    }
    
    // Проверяем соседние пиксели
    for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            const nidx = (ny * width + nx) * 4;
            
            // Если соседний пиксель прозрачный, значит текущий пиксель - край
            if (data[nidx + 3] === 0) {
                return true;
            }
        }
    }
    
    return false;
}

// Экспорт функций
window.EdgeProcessor = {
    processEdges,
    // Экспортируем настройки по умолчанию для использования в UI
    defaultSettings: {
        blurRadius: 1,
        threshold: 128,
        edgeOnly: true
    }
};