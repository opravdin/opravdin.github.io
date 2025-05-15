/**
 * Download Manager - модуль для скачивания объектов
 * Содержит функции для скачивания отдельных объектов, групп объектов и ZIP-архивов
 */

/**
 * Создает и активирует ссылку для скачивания файла
 * @param {string} url - URL для скачивания
 * @param {string} filename - Имя файла
 * @param {number} delay - Задержка перед скачиванием в мс
 */
function createDownloadLink(url, filename, delay = 0) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  if (delay > 0) {
    setTimeout(() => link.click(), delay);
  } else {
    link.click();
  }
}

/**
 * Обрабатывает изображение с помощью EdgeProcessor
 * @param {string} dataUrl - Data URL изображения
 * @returns {Promise<string>} - Promise с обработанным Data URL
 */
function processImageWithEdges(dataUrl) {
  return new Promise((resolve) => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const img = new Image();
    
    img.onload = function() {
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);
      
      // Получаем данные изображения
      const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
      
      // Обрабатываем края
      const processedData = EdgeProcessor.processEdges(imageData, {
        blurRadius: window.edgeProcessingSettings.blurRadius,
        threshold: window.edgeProcessingSettings.threshold,
        edgeOnly: window.edgeProcessingSettings.edgeOnly
      });
      
      // Возвращаем обработанные данные на canvas
      tempCtx.putImageData(processedData, 0, 0);
      
      // Создаем новый dataUrl
      resolve(tempCanvas.toDataURL('image/png'));
    };
    
    img.src = dataUrl;
  });
}

/**
 * Получает Blob из Data URL изображения
 * @param {string} dataUrl - Data URL изображения
 * @returns {Promise<Blob>} - Promise с Blob
 */
async function getImageBlob(dataUrl) {
  if (window.edgeProcessingSettings.enabled) {
    // Если обработка краев включена, сначала обрабатываем изображение
    const processedDataUrl = await processImageWithEdges(dataUrl);
    const response = await fetch(processedDataUrl);
    return await response.blob();
  } else {
    // Иначе просто конвертируем dataUrl в blob
    const response = await fetch(dataUrl);
    return await response.blob();
  }
}

/**
 * Скачивает одно изображение с обработкой краев при необходимости
 * @param {Object} obj - Объект изображения
 * @param {number} delay - Задержка перед скачиванием в мс
 */
async function downloadProcessedImage(obj, delay = 0) {
  if (window.edgeProcessingSettings.enabled) {
    // Если обработка краев включена, обрабатываем изображение
    const processedDataUrl = await processImageWithEdges(obj.dataUrl);
    createDownloadLink(processedDataUrl, obj.fileName, delay);
  } else {
    // Иначе скачиваем оригинальное изображение
    createDownloadLink(obj.dataUrl, obj.fileName, delay);
  }
}

/**
 * Скачивает один объект
 * @param {number} index - Индекс объекта
 */
async function downloadObject(index) {
  const outputObjects = ImageProcessor.getOutputObjects();
  const obj = outputObjects[index];
  await downloadProcessedImage(obj);
}

/**
 * Скачивает все объекты одного изображения
 * @param {number} sourceIndex - Индекс исходного изображения
 */
async function downloadSourceObjects(sourceIndex) {
  const outputObjects = ImageProcessor.getOutputObjects();
  const objects = outputObjects.filter(obj => obj.sourceIndex === sourceIndex);
  
  // Скачиваем каждый объект с задержкой
  objects.forEach((obj, idx) => {
    downloadProcessedImage(obj, 100 * idx);
  });
}

/**
 * Скачивает все объекты
 */
async function downloadAllObjects() {
  const outputObjects = ImageProcessor.getOutputObjects();
  
  // Скачиваем каждый объект с задержкой
  outputObjects.forEach((obj, idx) => {
    downloadProcessedImage(obj, 100 * idx);
  });
}

/**
 * Скачивает ZIP-архив со всеми объектами
 */
async function downloadZip() {
  const outputObjects = ImageProcessor.getOutputObjects();
  const zip = new JSZip();
  
  // Добавляем все объекты в архив
  for (let i = 0; i < outputObjects.length; i++) {
    const obj = outputObjects[i];
    const blob = await getImageBlob(obj.dataUrl);
    zip.file(obj.fileName, blob);
  }
  
  // Генерируем архив и скачиваем
  zip.generateAsync({type: 'blob'}).then(function(content) {
    saveAs(content, 'png_objects.zip');
  });
}

// Экспорт функций
window.DownloadManager = {
  downloadObject,
  downloadSourceObjects,
  downloadAllObjects,
  downloadZip
};