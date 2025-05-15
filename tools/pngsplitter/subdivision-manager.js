/**
 * Subdivision Manager - модуль для дополнительного разделения объектов
 * Содержит функции для ручного и автоматического разделения объектов
 */

// Переменные для дополнительного разделения
let currentSubdivisionIndex = -1;
let isDrawingMode = false;
let currentBrushSize = 5;
let originalObjectImage = null;
let subdivisionMasks = [];

// Открытие модального окна для дополнительного разделения
function openSubdivisionModal(index) {
  currentSubdivisionIndex = index;
  const outputObjects = ImageProcessor.getOutputObjects();
  const obj = outputObjects[index];
  
  // Загружаем изображение объекта
  const img = new Image();
  img.src = obj.dataUrl;
  img.onload = function() {
    // Сохраняем оригинальное изображение
    originalObjectImage = img;
    
    // Получаем DOM элементы
    const subdivisionCanvas = document.getElementById('subdivisionCanvas');
    const brushSizeContainer = document.getElementById('brushSizeContainer');
    const subdivisionModal = document.getElementById('subdivisionModal');
    
    // Настраиваем canvas с прозрачным фоном
    subdivisionCanvas.width = img.width;
    subdivisionCanvas.height = img.height;
    const ctx = subdivisionCanvas.getContext('2d');
    
    // Очищаем canvas с прозрачностью
    ctx.clearRect(0, 0, img.width, img.height);
    
    // Рисуем изображение
    ctx.drawImage(img, 0, 0);
    
    // Сбрасываем режим рисования
    isDrawingMode = false;
    brushSizeContainer.style.display = 'none';
    
    // Показываем модальное окно
    subdivisionModal.classList.add('active');
  };
}

// Закрытие модального окна
function closeSubdivisionModal() {
  const subdivisionModal = document.getElementById('subdivisionModal');
  const saveSubdivisionBtn = document.getElementById('saveSubdivisionBtn');
  
  subdivisionModal.classList.remove('active');
  currentSubdivisionIndex = -1;
  originalObjectImage = null;
  subdivisionMasks = [];
  
  // Скрываем кнопку сохранения
  saveSubdivisionBtn.style.display = 'none';
}

// Автоматическое разделение объекта
function autoSubdivide(continueErosion = false) {
  if (!originalObjectImage) return;
  
  // Получаем DOM элементы
  const subdivisionStatus = document.getElementById('subdivisionStatus');
  const aggressivenessSlider = document.getElementById('aggressivenessSlider');
  const iterationCounter = document.getElementById('iterationCounter');
  const continueErosionBtn = document.getElementById('continueErosionBtn');
  const subdivisionCanvas = document.getElementById('subdivisionCanvas');
  const colorPicker = document.getElementById('colorPicker');
  const saveSubdivisionBtn = document.getElementById('saveSubdivisionBtn');
  const applySubdivisionBtn = document.getElementById('applySubdivisionBtn');
  const resetSubdivisionBtn = document.getElementById('resetSubdivisionBtn');
  
  // Показываем статус
  subdivisionStatus.style.display = 'flex';
  
  // Получаем значение агрессивности
  const aggressiveness = parseInt(aggressivenessSlider.value);
  
  // Если это продолжение стирания, используем существующие данные
  // Иначе начинаем заново
  if (!continueErosion) {
    // Сбрасываем счетчик итераций
    iterationCounter.textContent = '0';
  }
  
  const width = originalObjectImage.width;
  const height = originalObjectImage.height;
  
  // Создаем невидимый canvas для работы с данными изображения
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true });
  
  // Очищаем offscreen canvas полностью
  offscreenCtx.clearRect(0, 0, width, height);
  
  // Рисуем изображение на offscreen canvas
  offscreenCtx.drawImage(originalObjectImage, 0, 0);
  
  // Получаем данные изображения с offscreen canvas
  const imageData = offscreenCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Отображаем изображение на видимом canvas
  subdivisionCanvas.width = width;
  subdivisionCanvas.height = height;
  const ctx = subdivisionCanvas.getContext('2d', { alpha: true });
  
  // Полностью очищаем видимый canvas
  ctx.clearRect(0, 0, width, height);
  
  // Рисуем изображение на видимом canvas
  ctx.drawImage(originalObjectImage, 0, 0);
  
  // Получаем цвет разделителя
  const [r0, g0, b0] = ColorUtils.hexToRgb(colorPicker.value);
  
  // Создаем копию данных для работы
  let tempData;
  
  // Если это продолжение стирания, используем существующие данные
  if (continueErosion && window.lastTempData) {
    tempData = new Uint8ClampedArray(window.lastTempData);
  } else {
    // Создаем новую копию данных
    tempData = new Uint8ClampedArray(data.buffer.slice(0));
  }
  
  // Функция для получения индекса пикселя
  function getIndex(x, y) {
    return (y * width + x) * 4;
  }
  
  // Функция для проверки, является ли пиксель граничным
  function isBorderPixel(x, y, dataArray) {
    // Проверяем, касается ли пиксель края изображения
    if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
      return true;
    }
    
    // Проверяем, касается ли пиксель фонового цвета
    // Для первой итерации используем минимальную агрессивность
    const checkRadius = iterations === 0 ? 1 : Math.max(1, Math.min(3, aggressiveness));
    
    // Для первой итерации проверяем только непосредственно соседние пиксели
    if (iterations === 0) {
      // Проверяем только 4 соседних пикселя (не по диагонали)
      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (const [dx, dy] of directions) {
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
          const nidx = getIndex(nx, ny);
          // Проверяем совпадение цвета или прозрачность
          if (ColorUtils.colorMatch(dataArray, nidx, r0, g0, b0) || dataArray[nidx + 3] === 0) {
            return true;
          }
        }
      }
    } else {
      // Для последующих итераций используем настроенную агрессивность
      for (let dy = -checkRadius; dy <= checkRadius; dy++) {
        for (let dx = -checkRadius; dx <= checkRadius; dx++) {
          // Пропускаем центральный пиксель
          if (dx === 0 && dy === 0) continue;
          
          // Для агрессивности 1 проверяем только соседние пиксели (не по диагонали)
          if (aggressiveness === 1 && Math.abs(dx) + Math.abs(dy) > 1) continue;
          
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
            const nidx = getIndex(nx, ny);
            // Проверяем совпадение цвета или прозрачность
            if (ColorUtils.colorMatch(dataArray, nidx, r0, g0, b0) || dataArray[nidx + 3] === 0) {
              return true;
            }
          }
        }
      }
    }
    
    return false;
  }
  
  // Функция для закрашивания граничных пикселей
  function eraseBorderPixels() {
    let changed = false;
    
    // Создаем копию данных, чтобы не изменять их во время проверки
    const tempDataCopy = new Uint8ClampedArray(tempData);
    
    // Создаем массив пикселей для стирания, чтобы не менять данные во время итерации
    const pixelsToErase = [];
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = getIndex(x, y);
        
        // Пропускаем пиксели фона или прозрачные пиксели
        if (ColorUtils.colorMatch(tempDataCopy, idx, r0, g0, b0) || tempDataCopy[idx + 3] === 0) {
          continue;
        }
        
        // Если пиксель граничный, добавляем его в список для стирания
        if (isBorderPixel(x, y, tempDataCopy)) {
          pixelsToErase.push([x, y, idx]);
        }
      }
    }
    
    // Ограничиваем количество стираемых пикселей для первой итерации
    // чтобы не стереть всё изображение сразу
    let pixelsToProcess = pixelsToErase;
    if (iterations === 0 && pixelsToErase.length > 0) {
      // Стираем только небольшой процент граничных пикселей на первой итерации
      const maxPixelsFirstIteration = Math.max(10, Math.floor(pixelsToErase.length * 0.1));
      pixelsToProcess = pixelsToErase.slice(0, maxPixelsFirstIteration);
      console.log(`Первая итерация: ограничиваем стирание до ${maxPixelsFirstIteration} пикселей из ${pixelsToErase.length}`);
    }
    
    // Теперь стираем отобранные пиксели, делая их прозрачными
    for (const [x, y, idx] of pixelsToProcess) {
      tempData[idx] = r0;
      tempData[idx + 1] = g0;
      tempData[idx + 2] = b0;
      tempData[idx + 3] = 0; // Делаем пиксель полностью прозрачным
      changed = true;
    }
    
    console.log(`Стерто ${pixelsToProcess.length} пикселей`);
    return changed && pixelsToProcess.length > 0;
  }
  
  // Функция для поиска компонент связности
  function findConnectedComponents() {
    const visited = new Uint8Array(width * height);
    const components = [];
    
    // Функция для получения индекса в массиве visited
    function getVisitedIndex(x, y) {
      return y * width + x;
    }
    
    // Функция заливки для выделения компоненты
    function floodFill(x, y) {
      const queue = [[x, y]];
      const pixels = [];
      
      while (queue.length) {
        const [cx, cy] = queue.pop();
        const vidx = getVisitedIndex(cx, cy);
        if (visited[vidx]) continue;
        
        const idx = getIndex(cx, cy);
        // Пропускаем пиксели фона или прозрачные пиксели
        if (ColorUtils.colorMatch(tempData, idx, r0, g0, b0) || tempData[idx + 3] === 0) continue;
        
        visited[vidx] = 1;
        pixels.push([cx, cy]);
        
        // Проверяем соседние пиксели
        for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
            const nvidx = getVisitedIndex(nx, ny);
            const nidx = getIndex(nx, ny);
            if (!visited[nvidx] && !ColorUtils.colorMatch(tempData, nidx, r0, g0, b0)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
      
      return pixels;
    }
    
    // Находим все компоненты
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const vidx = getVisitedIndex(x, y);
        const idx = getIndex(x, y);
        // Проверяем, что пиксель не посещен, не совпадает с фоновым цветом и не прозрачный
        if (!visited[vidx] && !ColorUtils.colorMatch(tempData, idx, r0, g0, b0) && tempData[idx + 3] !== 0) {
          const component = floodFill(x, y);
          if (component.length > 20) {  // Игнорируем слишком маленькие компоненты
            components.push(component);
          }
        }
      }
    }
    
    return components;
  }
  
  // Функция для создания масок компонент
  function createComponentMasks(components) {
    const masks = [];
    
    for (const component of components) {
      const mask = new Uint8Array(width * height);
      
      // Заполняем маску
      for (const [x, y] of component) {
        const idx = y * width + x;
        mask[idx] = 1;
      }
      
      masks.push(mask);
    }
    
    return masks;
  }
  
  // Функция для расширения масок
  function growMasks(masks) {
    const tempMasks = masks.map(mask => new Uint8Array(mask));
    let changed = true;
    
    while (changed) {
      changed = false;
      
      for (let m = 0; m < masks.length; m++) {
        const mask = masks[m];
        
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = y * width + x;
            
            // Пропускаем уже замаскированные пиксели
            if (mask[idx]) continue;
            
            // Пропускаем пиксели фона или прозрачные пиксели
            const dataIdx = getIndex(x, y);
            if (ColorUtils.colorMatch(data, dataIdx, r0, g0, b0) || data[dataIdx + 3] === 0) continue;
            
            // Проверяем, есть ли соседние пиксели в этой маске
            let hasNeighbor = false;
            for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
              const nx = x + dx, ny = y + dy;
              if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
                const nidx = ny * width + nx;
                if (mask[nidx]) {
                  hasNeighbor = true;
                  break;
                }
              }
            }
            
            // Если есть сосед в этой маске и пиксель не замаскирован другими масками
            if (hasNeighbor) {
              let isFree = true;
              for (let om = 0; om < masks.length; om++) {
                if (om !== m && masks[om][idx]) {
                  isFree = false;
                  break;
                }
              }
              
              if (isFree) {
                tempMasks[m][idx] = 1;
                changed = true;
              }
            }
          }
        }
      }
      
      // Копируем временные маски обратно
      for (let m = 0; m < masks.length; m++) {
        masks[m] = new Uint8Array(tempMasks[m]);
      }
    }
    
    return masks;
  }
  
  // Выполняем автоматическое разделение
  let iterations = continueErosion ? parseInt(iterationCounter.textContent) : 0;
  let components;
  
  // Функция для обновления визуализации
  function updateVisualization() {
    // Сохраняем текущие данные для возможного продолжения
    window.lastTempData = new Uint8ClampedArray(tempData);
    
    // Создаем новый ImageData из текущих данных tempData
    const tempImageData = new ImageData(new Uint8ClampedArray(tempData), width, height);
    
    // Отображаем на offscreen canvas
    offscreenCtx.putImageData(tempImageData, 0, 0);
    
    // Очищаем видимый canvas
    ctx.clearRect(0, 0, width, height);
    
    // Копируем с offscreen canvas на видимый canvas
    ctx.drawImage(offscreenCanvas, 0, 0);
    
    // Обновляем счетчик итераций
    iterationCounter.textContent = iterations.toString();
    
    // Подсчитываем количество непрозрачных пикселей
    let nonBackgroundPixels = 0;
    for (let i = 0; i < tempData.length; i += 4) {
      if (!ColorUtils.colorMatch(tempData, i, r0, g0, b0)) {
        nonBackgroundPixels++;
      }
    }
    
    // Выводим отладочную информацию
    console.log('Итерация ' + iterations + ': компонент - ' + (components ? components.length : 0) +
                ', непрозрачных пикселей: ' + nonBackgroundPixels);
  }
  
  // Функция для выполнения одной итерации стирания
  function performErosionIteration() {
    // Стираем граничные пиксели
    const changed = eraseBorderPixels();
    
    // Ищем компоненты связности
    components = findConnectedComponents();
    
    // Обновляем визуализацию
    updateVisualization();
    
    // Увеличиваем счетчик итераций
    iterations++;
    
    // Если нашли несколько компонент, достигли максимального числа итераций или больше нет изменений, завершаем
    if (components.length >= 2 || iterations >= 20 || !changed) {
      console.log('Завершаем процесс стирания: компонент - ' + components.length +
                  ', итераций - ' + iterations + ', изменения - ' + changed);
      finishErosion();
    } else {
      // Иначе планируем следующую итерацию через небольшую задержку
      setTimeout(performErosionIteration, 200); // Увеличиваем задержку для лучшей визуализации
    }
  }
  
  // Функция для завершения процесса стирания
  function finishErosion() {
    // Если нашли несколько компонент
    if (components.length >= 2) {
      // Создаем маски компонент
      let masks = createComponentMasks(components);
      
      // Расширяем маски
      masks = growMasks(masks);
      
      // Сохраняем маски
      subdivisionMasks = masks;
      
      // Отображаем результат
      displaySubdivisionResult();
      
      // Скрываем кнопку продолжения стирания
      continueErosionBtn.style.display = 'none';
      
      // Показываем кнопку сохранения разделения
      saveSubdivisionBtn.style.display = 'inline-block';
      
      // Скрываем кнопки, которые не нужны в автоматическом режиме
      applySubdivisionBtn.style.display = 'none';
      resetSubdivisionBtn.style.display = 'none';
    } else {
      // Показываем кнопку продолжения стирания
      continueErosionBtn.style.display = 'inline-block';
      
      // Скрываем кнопку сохранения
      saveSubdivisionBtn.style.display = 'none';
      
      // Не показываем сообщение, так как кнопка "продолжить стирание" теперь делает 5 итераций
      console.log('Не удалось автоматически разделить объект за ' + iterations + ' итераций. Можно продолжить стирание или попробовать ручное разделение.');
    }
  }
  
  // Запускаем первую итерацию
  performErosionIteration();
}
// Включение режима ручного разделения
function enableManualSubdivide() {
  if (!originalObjectImage) return;
  
  isDrawingMode = true;
  const brushSizeContainer = document.getElementById('brushSizeContainer');
  const subdivisionCanvas = document.getElementById('subdivisionCanvas');
  const colorPicker = document.getElementById('colorPicker');
  
  brushSizeContainer.style.display = 'flex';
  
  // Настраиваем canvas с прозрачным фоном
  const width = originalObjectImage.width;
  const height = originalObjectImage.height;
  subdivisionCanvas.width = width;
  subdivisionCanvas.height = height;
  const ctx = subdivisionCanvas.getContext('2d');
  
  // Очищаем canvas с прозрачностью
  ctx.clearRect(0, 0, width, height);
  
  // Рисуем изображение
  ctx.drawImage(originalObjectImage, 0, 0);
  
  // Получаем цвет разделителя
  const [r0, g0, b0] = ColorUtils.hexToRgb(colorPicker.value);
  
  // Переменные для рисования
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  
  // Функция для рисования линии
  function drawLine(x1, y1, x2, y2) {
    const ctx = subdivisionCanvas.getContext('2d');
    ctx.beginPath();
    ctx.strokeStyle = colorPicker.value;
    ctx.lineWidth = currentBrushSize;
    ctx.lineCap = 'round';
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  
  // Обработчики событий для рисования
  subdivisionCanvas.addEventListener('mousedown', function(e) {
    if (!isDrawingMode) return;
    
    isDrawing = true;
    const rect = subdivisionCanvas.getBoundingClientRect();
    lastX = (e.clientX - rect.left) / (rect.width / width);
    lastY = (e.clientY - rect.top) / (rect.height / height);
  });
  
  subdivisionCanvas.addEventListener('mousemove', function(e) {
    if (!isDrawingMode || !isDrawing) return;
    
    const rect = subdivisionCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / (rect.width / width);
    const y = (e.clientY - rect.top) / (rect.height / height);
    
    drawLine(lastX, lastY, x, y);
    
    lastX = x;
    lastY = y;
  });
  
  subdivisionCanvas.addEventListener('mouseup', function() {
    isDrawing = false;
  });
  
  subdivisionCanvas.addEventListener('mouseleave', function() {
    isDrawing = false;
  });
}

// Применение ручного разделения
function applyManualSubdivide() {
  if (!originalObjectImage || !isDrawingMode) return;
  
  const width = originalObjectImage.width;
  const height = originalObjectImage.height;
  const subdivisionCanvas = document.getElementById('subdivisionCanvas');
  const colorPicker = document.getElementById('colorPicker');
  
  // Создаем невидимый canvas для работы с данными изображения
  const offscreenCanvas = document.createElement('canvas');
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: true });
  
  // Очищаем offscreen canvas полностью
  offscreenCtx.clearRect(0, 0, width, height);
  
  // Получаем текущее состояние видимого canvas
  const visibleCtx = subdivisionCanvas.getContext('2d');
  const visibleImageData = visibleCtx.getImageData(0, 0, width, height);
  
  // Копируем данные на offscreen canvas
  offscreenCtx.putImageData(visibleImageData, 0, 0);
  
  // Получаем данные изображения с offscreen canvas
  const imageData = offscreenCtx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Получаем цвет разделителя
  const [r0, g0, b0] = ColorUtils.hexToRgb(colorPicker.value);
  
  // Функция для получения индекса пикселя
  function getIndex(x, y) {
    return (y * width + x) * 4;
  }
  
  // Функция для поиска компонент связности
  function findConnectedComponents() {
    const visited = new Uint8Array(width * height);
    const components = [];
    
    // Функция для получения индекса в массиве visited
    function getVisitedIndex(x, y) {
      return y * width + x;
    }
    
    // Функция заливки для выделения компоненты
    function floodFill(x, y) {
      const queue = [[x, y]];
      const pixels = [];
      
      while (queue.length) {
        const [cx, cy] = queue.pop();
        const vidx = getVisitedIndex(cx, cy);
        if (visited[vidx]) continue;
        
        const idx = getIndex(cx, cy);
        if (ColorUtils.colorMatch(data, idx, r0, g0, b0)) continue;
        
        visited[vidx] = 1;
        pixels.push([cx, cy]);
        
        // Проверяем соседние пиксели
        for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx >= 0 && ny >= 0 && nx < width && ny < height) {
            const nvidx = getVisitedIndex(nx, ny);
            const nidx = getIndex(nx, ny);
            if (!visited[nvidx] && !ColorUtils.colorMatch(data, nidx, r0, g0, b0)) {
              queue.push([nx, ny]);
            }
          }
        }
      }
      
      return pixels;
    }
    
    // Находим все компоненты
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const vidx = getVisitedIndex(x, y);
        const idx = getIndex(x, y);
        if (!visited[vidx] && !ColorUtils.colorMatch(data, idx, r0, g0, b0)) {
          const component = floodFill(x, y);
          if (component.length > 20) {  // Игнорируем слишком маленькие компоненты
            components.push(component);
          }
        }
      }
    }
    
    return components;
  }
  
  // Функция для создания масок компонент
  function createComponentMasks(components) {
    const masks = [];
    
    for (const component of components) {
      const mask = new Uint8Array(width * height);
      
      // Заполняем маску
      for (const [x, y] of component) {
        const idx = y * width + x;
        mask[idx] = 1;
      }
      
      masks.push(mask);
    }
    
    return masks;
  }
  
  // Находим компоненты
  const components = findConnectedComponents();
  
  // Если нашли несколько компонент
  if (components.length >= 2) {
    // Создаем маски компонент
    subdivisionMasks = createComponentMasks(components);
    
    // Отображаем результат
    displaySubdivisionResult();
  } else {
    alert('Не удалось разделить объект. Попробуйте нарисовать более четкую линию разделения.');
  }
}

// Отображение результата разделения
function displaySubdivisionResult() {
  if (!originalObjectImage || subdivisionMasks.length < 2) return;
  
  const width = originalObjectImage.width;
  const height = originalObjectImage.height;
  const subdivisionCanvas = document.getElementById('subdivisionCanvas');
  const saveSubdivisionBtn = document.getElementById('saveSubdivisionBtn');
  
  // Настраиваем canvas
  subdivisionCanvas.width = width;
  subdivisionCanvas.height = height;
  const ctx = subdivisionCanvas.getContext('2d');
  
  // Рисуем оригинальное изображение
  ctx.drawImage(originalObjectImage, 0, 0);
  
  // Получаем данные изображения
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Функция для обрезки холста до размеров фактического содержимого
  function trimCanvas(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    
    // Находим границы непрозрачного содержимого
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4;
        if (data[idx + 3] > 0) { // Если пиксель не прозрачный
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    
    // Если изображение полностью прозрачное, возвращаем исходный холст
    if (minX > maxX || minY > maxY) {
      return canvas;
    }
    
    // Создаем новый холст с обрезанными размерами
    const trimmedCanvas = document.createElement('canvas');
    const trimmedWidth = maxX - minX + 1;
    const trimmedHeight = maxY - minY + 1;
    trimmedCanvas.width = trimmedWidth;
    trimmedCanvas.height = trimmedHeight;
    
    // Копируем только непрозрачную часть
    const trimmedCtx = trimmedCanvas.getContext('2d');
    trimmedCtx.drawImage(canvas, minX, minY, trimmedWidth, trimmedHeight, 0, 0, trimmedWidth, trimmedHeight);
    
    return trimmedCanvas;
  }
  
  // Создаем временный canvas для каждой маски
  const tempCanvases = subdivisionMasks.map((mask, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const tempCtx = canvas.getContext('2d');
    
    // Создаем новые данные изображения
    const newImageData = new ImageData(width, height);
    const newData = newImageData.data;
    
    // Копируем пиксели из оригинального изображения согласно маске
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const maskIdx = y * width + x;
        
        if (mask[maskIdx]) {
          newData[idx] = data[idx];
          newData[idx + 1] = data[idx + 1];
          newData[idx + 2] = data[idx + 2];
          newData[idx + 3] = data[idx + 3];
        } else {
          newData[idx + 3] = 0;  // Прозрачный пиксель
        }
      }
    }
    
    // Рисуем на временном canvas
    tempCtx.putImageData(newImageData, 0, 0);
    
    // Обрезаем холст до размеров фактического содержимого
    return trimCanvas(canvas);
  });
  
  // Очищаем canvas
  ctx.clearRect(0, 0, width, height);
  
  // Рисуем каждую компоненту с разным оттенком для визуализации
  const colors = ['rgba(255,0,0,0.3)', 'rgba(0,255,0,0.3)', 'rgba(0,0,255,0.3)', 'rgba(255,255,0,0.3)'];
  
  // Сначала рисуем оригинальное изображение
  ctx.drawImage(originalObjectImage, 0, 0);
  
  // Затем рисуем полупрозрачные цветные области для каждой маски
  subdivisionMasks.forEach((mask, index) => {
    const color = colors[index % colors.length];
    ctx.fillStyle = color;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const maskIdx = y * width + x;
        
        if (mask[maskIdx]) {
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  });
  
  // Сохраняем временные canvas для использования при применении разделения
  subdivisionMasks.tempCanvases = tempCanvases;
  
  // Показываем кнопку сохранения
  saveSubdivisionBtn.style.display = 'inline-block';
}

// Применение разделения
function applySubdivision() {
  if (!originalObjectImage || subdivisionMasks.length < 2 || currentSubdivisionIndex === -1) return;
  
  // Получаем текущий объект
  const outputObjects = ImageProcessor.getOutputObjects();
  const obj = outputObjects[currentSubdivisionIndex];
  
  // Удаляем текущий объект из списка
  outputObjects.splice(currentSubdivisionIndex, 1);
  
  // Добавляем новые объекты
  const newObjects = subdivisionMasks.tempCanvases.map((canvas, index) => {
    const dataUrl = canvas.toDataURL('image/png');
    
    return {
      sourceIndex: obj.sourceIndex,
      objectIndex: obj.objectIndex + '_sub' + index,
      width: canvas.width,
      height: canvas.height,
      dataUrl: dataUrl,
      fileName: `object_${obj.sourceIndex}_${obj.objectIndex}_sub${index}.png`
    };
  });
  
  // Добавляем новые объекты в общий список
  outputObjects.push(...newObjects);
  
  // Обновляем счетчик объектов
  const sourceImages = ImageProcessor.getSourceImages();
  if (sourceImages[obj.sourceIndex]) {
    sourceImages[obj.sourceIndex].objectCount += newObjects.length - 1;
  }
  
  // Обновляем UI
  UIManager.updateOutputDisplay();
  UIManager.updateSourceImagesList();
  
  // Скрываем кнопку сохранения
  const saveSubdivisionBtn = document.getElementById('saveSubdivisionBtn');
  saveSubdivisionBtn.style.display = 'none';
  
  // Закрываем модальное окно
  closeSubdivisionModal();
}

// Сброс разделения
function resetSubdivision() {
  if (!originalObjectImage) return;
  
  // Сбрасываем маски
  subdivisionMasks = [];
  
  // Получаем DOM элементы
  const subdivisionCanvas = document.getElementById('subdivisionCanvas');
  const brushSizeContainer = document.getElementById('brushSizeContainer');
  const saveSubdivisionBtn = document.getElementById('saveSubdivisionBtn');
  
  // Настраиваем canvas с прозрачным фоном
  subdivisionCanvas.width = originalObjectImage.width;
  subdivisionCanvas.height = originalObjectImage.height;
  const ctx = subdivisionCanvas.getContext('2d');
  
  // Очищаем canvas с прозрачностью
  ctx.clearRect(0, 0, originalObjectImage.width, originalObjectImage.height);
  
  // Рисуем изображение
  ctx.drawImage(originalObjectImage, 0, 0);
  
  // Если в режиме рисования, оставляем его активным
  if (isDrawingMode) {
    brushSizeContainer.style.display = 'flex';
  } else {
    brushSizeContainer.style.display = 'none';
  }
  
  // Скрываем кнопку сохранения
  saveSubdivisionBtn.style.display = 'none';
}

// Функция для выполнения нескольких итераций стирания
function continueBatchErosion(batchSize) {
  let currentBatch = 0;
  
  function runNextIteration() {
    if (currentBatch < batchSize) {
      autoSubdivide(true); // true означает продолжение стирания
      currentBatch++;
      setTimeout(runNextIteration, 300); // Небольшая задержка между итерациями
    }
  }
  
  runNextIteration();
}

// Инициализация обработчиков событий для дополнительного разделения
function initSubdivisionEventHandlers() {
  // DOM элементы для дополнительного разделения
  const closeSubdivisionBtn = document.getElementById('closeSubdivisionBtn');
  const autoSubdivideBtn = document.getElementById('autoSubdivideBtn');
  const manualSubdivideBtn = document.getElementById('manualSubdivideBtn');
  const autoSubdivideParams = document.getElementById('autoSubdivideParams');
  const aggressivenessSlider = document.getElementById('aggressivenessSlider');
  const aggressivenessValue = document.getElementById('aggressivenessValue');
  const subdivisionStatus = document.getElementById('subdivisionStatus');
  const iterationCounter = document.getElementById('iterationCounter');
  const continueErosionBtn = document.getElementById('continueErosionBtn');
  const applySubdivisionBtn = document.getElementById('applySubdivisionBtn');
  const saveSubdivisionBtn = document.getElementById('saveSubdivisionBtn');
  const resetSubdivisionBtn = document.getElementById('resetSubdivisionBtn');
  const brushSizeSlider = document.getElementById('brushSizeSlider');
  const brushSizeValue = document.getElementById('brushSizeValue');
  const brushSizeContainer = document.getElementById('brushSizeContainer');
  
  // Обработчики событий для дополнительного разделения
  closeSubdivisionBtn.addEventListener('click', closeSubdivisionModal);
  
  autoSubdivideBtn.addEventListener('click', () => {
    // Показываем параметры автоматического разделения
    autoSubdivideParams.style.display = 'block';
    brushSizeContainer.style.display = 'none';
    isDrawingMode = false;
    
    // Сбрасываем статус
    subdivisionStatus.style.display = 'none';
    iterationCounter.textContent = '0';
    continueErosionBtn.style.display = 'none';
    
    // Скрываем кнопки, которые не нужны в автоматическом режиме
    applySubdivisionBtn.style.display = 'none';
    resetSubdivisionBtn.style.display = 'none';
    
    // Запускаем автоматическое разделение
    autoSubdivide();
  });
  
  manualSubdivideBtn.addEventListener('click', () => {
    // Скрываем параметры автоматического разделения
    autoSubdivideParams.style.display = 'none';
    
    // Показываем кнопки для ручного режима
    applySubdivisionBtn.style.display = 'inline-block';
    resetSubdivisionBtn.style.display = 'inline-block';
    
    // Скрываем кнопку сохранения до применения разделения
    saveSubdivisionBtn.style.display = 'none';
    
    // Включаем режим ручного разделения
    enableManualSubdivide();
  });
  
  // Обработчик для ползунка агрессивности
  aggressivenessSlider.addEventListener('input', (e) => {
    aggressivenessValue.textContent = e.target.value;
  });
  
  // Обработчик для кнопки продолжения стирания
  continueErosionBtn.addEventListener('click', () => {
    // Запускаем 5 итераций стирания
    continueBatchErosion(5);
  });
  
  applySubdivisionBtn.addEventListener('click', () => {
    if (isDrawingMode) {
      applyManualSubdivide();
    } else {
      autoSubdivide();
    }
    
    // Если успешно разделили объект (есть маски), показываем кнопку сохранения
    if (subdivisionMasks.length >= 2) {
      saveSubdivisionBtn.style.display = 'inline-block';
    }
  });
  
  saveSubdivisionBtn.addEventListener('click', () => {
    applySubdivision();
  });
  
  resetSubdivisionBtn.addEventListener('click', resetSubdivision);
  
  brushSizeSlider.addEventListener('input', (e) => {
    currentBrushSize = parseInt(e.target.value);
    brushSizeValue.textContent = currentBrushSize;
  });
}

// Экспорт функций
window.SubdivisionManager = {
  openSubdivisionModal,
  closeSubdivisionModal,
  autoSubdivide,
  enableManualSubdivide,
  applyManualSubdivide,
  displaySubdivisionResult,
  applySubdivision,
  resetSubdivision,
  continueBatchErosion,
  initSubdivisionEventHandlers,
  
  // Геттеры для доступа к данным
  getCurrentSubdivisionIndex: () => currentSubdivisionIndex,
  getIsDrawingMode: () => isDrawingMode,
  getCurrentBrushSize: () => currentBrushSize,
  
  // Сеттеры для обновления данных
  setCurrentBrushSize: (size) => {
    currentBrushSize = size;
  }
};