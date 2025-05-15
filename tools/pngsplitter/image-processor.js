/**
 * Image Processor - модуль для обработки изображений
 * Содержит функции для разделения изображений на объекты
 */

// Глобальные переменные для хранения данных
let sourceImages = [];
let outputObjects = [];
let lastImageIndex = -1;
let currentTolerance = 10;

// Функция для обработки загруженного изображения
async function processImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  
  try {
    // Создаем объект изображения
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    
    // Добавляем изображение в список источников
    const sourceIndex = sourceImages.length;
    sourceImages.push({
      file: file,
      image: img,
      width: img.width,
      height: img.height,
      objectCount: 0
    });
    
    // Обновляем UI
    UIManager.updateSourceImagesList();
    UIManager.showPreview(img);
    
    // Обрабатываем изображение
    splitImageObjects(sourceIndex);
  } catch (error) {
    console.error('Ошибка при обработке изображения:', error);
    alert('Ошибка при обработке изображения: ' + error.message);
  }
}

// Функция для разделения изображения на объекты
function splitImageObjects(sourceIndex) {
  const sourceImage = sourceImages[sourceIndex];
  const img = sourceImage.image;
  
  // Получаем DOM элементы
  const mainCanvas = document.getElementById('mainCanvas');
  const tempCanvas = document.getElementById('tempCanvas');
  const colorPicker = document.getElementById('colorPicker');
  
  // Настраиваем canvas
  mainCanvas.width = img.width;
  mainCanvas.height = img.height;
  const ctx = mainCanvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  
  // Получаем данные изображения
  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  const visited = new Uint8Array(img.width * img.height);
  const objects = [];
  
  // Получаем цвет разделителя
  const [r0, g0, b0] = ColorUtils.hexToRgb(colorPicker.value);
  
  // Функция для получения индекса пикселя
  function getIndex(x, y) {
    return y * img.width + x;
  }
  
  // Функция заливки для выделения объекта
  function floodFill(x, y) {
    const queue = [[x, y]];
    const pixels = [];
    let minX = x, maxX = x, minY = y, maxY = y;
    
    while (queue.length) {
      const [cx, cy] = queue.pop();
      const idx = getIndex(cx, cy);
      if (visited[idx]) continue;
      
      const i = idx * 4;
      if (ColorUtils.colorMatch(data, i, r0, g0, b0, currentTolerance)) continue;
      
      visited[idx] = 1;
      pixels.push([cx, cy]);
      minX = Math.min(minX, cx);
      maxX = Math.max(maxX, cx);
      minY = Math.min(minY, cy);
      maxY = Math.max(maxY, cy);
      
      // Проверяем соседние пиксели (включая диагональные)
      for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,-1], [1,-1], [-1,1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx >= 0 && ny >= 0 && nx < img.width && ny < img.height) {
          const nidx = getIndex(nx, ny);
          const ni = nidx * 4;
          if (!visited[nidx] && !ColorUtils.colorMatch(data, ni, r0, g0, b0, currentTolerance)) {
            queue.push([nx, ny]);
          }
        }
      }
    }
    
    return { pixels, bounds: [minX, minY, maxX, maxY] };
  }
  
  // Находим все объекты
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = getIndex(x, y);
      const i = idx * 4;
      if (!visited[idx] && !ColorUtils.colorMatch(data, i, r0, g0, b0, currentTolerance)) {
        const obj = floodFill(x, y);
        if (obj.pixels.length > 20) {
          objects.push(obj);
        }
      }
    }
  }
  
  // Обновляем счетчик объектов
  sourceImage.objectCount = objects.length;
  
  // Создаем изображения для каждого объекта
  const newObjects = objects.map((obj, index) => {
    const { bounds } = obj;
    const [minX, minY, maxX, maxY] = bounds;
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    
    // Создаем временный canvas для объекта
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(mainCanvas, minX, minY, w, h, 0, 0, w, h);
    
    // Получаем данные изображения и заменяем фоновый цвет на прозрачность
    const imageData = tempCtx.getImageData(0, 0, w, h);
    const pixelData = imageData.data;
    
    // Заменяем фоновый цвет на прозрачность
    for (let i = 0; i < pixelData.length; i += 4) {
      if (ColorUtils.colorMatch(pixelData, i, r0, g0, b0, currentTolerance)) {
        pixelData[i + 3] = 0; // Устанавливаем альфа-канал в 0 (полная прозрачность)
      }
    }
    
    // Возвращаем изображение с прозрачностью на canvas
    tempCtx.putImageData(imageData, 0, 0);
    
    // Получаем данные изображения с прозрачностью
    const objectDataUrl = tempCanvas.toDataURL('image/png');
    
    return {
      sourceIndex: sourceIndex,
      objectIndex: index,
      width: w,
      height: h,
      dataUrl: objectDataUrl,
      fileName: `object_${sourceIndex}_${index}.png`
    };
  });
  
  // Добавляем новые объекты в общий список
  outputObjects = [...outputObjects, ...newObjects];
  lastImageIndex = sourceIndex;
  
  // Обновляем UI
  UIManager.updateOutputDisplay();
  UIManager.updateSourceImagesList();
}

// Функция для удаления исходного изображения и его объектов
function removeSourceImage(index) {
  // Удаляем объекты этого изображения
  outputObjects = outputObjects.filter(obj => obj.sourceIndex !== index);
  
  // Обновляем индексы для оставшихся объектов
  outputObjects = outputObjects.map(obj => {
    if (obj.sourceIndex > index) {
      return {...obj, sourceIndex: obj.sourceIndex - 1};
    }
    return obj;
  });
  
  // Удаляем изображение из списка
  sourceImages.splice(index, 1);
  
  // Обновляем lastImageIndex
  if (lastImageIndex === index) {
    lastImageIndex = sourceImages.length - 1;
  } else if (lastImageIndex > index) {
    lastImageIndex--;
  }
  
  // Обновляем UI
  UIManager.updateSourceImagesList();
  UIManager.updateOutputDisplay();
}

// Функция для удаления результатов последней загруженной картинки
function clearLastResults() {
  if (lastImageIndex === -1) return;
  
  // Удаляем объекты последнего изображения
  outputObjects = outputObjects.filter(obj => obj.sourceIndex !== lastImageIndex);
  
  // Обновляем счетчик объектов
  if (sourceImages[lastImageIndex]) {
    sourceImages[lastImageIndex].objectCount = 0;
  }
  
  // Обновляем UI
  UIManager.updateSourceImagesList();
  UIManager.updateOutputDisplay();
}

// Функция для очистки всех результатов
function clearAllResults() {
  outputObjects = [];
  
  // Обновляем счетчики объектов
  sourceImages.forEach(source => {
    source.objectCount = 0;
  });
  
  // Обновляем UI
  UIManager.updateSourceImagesList();
  UIManager.updateOutputDisplay();
}

// Экспорт функций и данных
window.ImageProcessor = {
  processImage,
  splitImageObjects,
  removeSourceImage,
  clearLastResults,
  clearAllResults,
  
  // Геттеры для доступа к данным
  getSourceImages: () => sourceImages,
  getOutputObjects: () => outputObjects,
  getLastImageIndex: () => lastImageIndex,
  
  // Сеттеры для обновления данных
  setCurrentTolerance: (tolerance) => {
    currentTolerance = tolerance;
  }
};