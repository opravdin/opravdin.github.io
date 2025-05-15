/**
 * Download Manager - модуль для скачивания объектов
 * Содержит функции для скачивания отдельных объектов, групп объектов и ZIP-архивов
 */

// Функция для скачивания одного объекта
function downloadObject(index) {
  const outputObjects = ImageProcessor.getOutputObjects();
  const obj = outputObjects[index];
  
  // Если обработка краев отключена, скачиваем оригинальное изображение
  if (!window.edgeProcessingSettings.enabled) {
    const link = document.createElement('a');
    link.href = obj.dataUrl;
    link.download = obj.fileName;
    link.click();
    return;
  }
  
  // Создаем временный canvas для обработки
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
    const processedDataUrl = tempCanvas.toDataURL('image/png');
    
    // Скачиваем обработанное изображение
    const link = document.createElement('a');
    link.href = processedDataUrl;
    link.download = obj.fileName;
    link.click();
  };
  
  img.src = obj.dataUrl;
}

// Функция для скачивания всех объектов одного изображения
function downloadSourceObjects(sourceIndex) {
  const outputObjects = ImageProcessor.getOutputObjects();
  const objects = outputObjects.filter(obj => obj.sourceIndex === sourceIndex);
  
  // Если обработка краев отключена, скачиваем оригинальные изображения
  if (!window.edgeProcessingSettings.enabled) {
    objects.forEach(obj => {
      const link = document.createElement('a');
      link.href = obj.dataUrl;
      link.download = obj.fileName;
      setTimeout(() => link.click(), 100 * obj.objectIndex);
    });
    return;
  }
  
  // Обрабатываем и скачиваем каждое изображение
  objects.forEach((obj, idx) => {
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
      const processedDataUrl = tempCanvas.toDataURL('image/png');
      
      // Скачиваем обработанное изображение
      const link = document.createElement('a');
      link.href = processedDataUrl;
      link.download = obj.fileName;
      setTimeout(() => link.click(), 100 * idx);
    };
    
    img.src = obj.dataUrl;
  });
}

// Функция для скачивания всех объектов
function downloadAllObjects() {
  const outputObjects = ImageProcessor.getOutputObjects();
  
  // Если обработка краев отключена, скачиваем оригинальные изображения
  if (!window.edgeProcessingSettings.enabled) {
    outputObjects.forEach((obj, index) => {
      const link = document.createElement('a');
      link.href = obj.dataUrl;
      link.download = obj.fileName;
      setTimeout(() => link.click(), 100 * index);
    });
    return;
  }
  
  // Обрабатываем и скачиваем каждое изображение
  outputObjects.forEach((obj, idx) => {
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
      const processedDataUrl = tempCanvas.toDataURL('image/png');
      
      // Скачиваем обработанное изображение
      const link = document.createElement('a');
      link.href = processedDataUrl;
      link.download = obj.fileName;
      setTimeout(() => link.click(), 100 * idx);
    };
    
    img.src = obj.dataUrl;
  });
}

// Функция для скачивания ZIP-архива
async function downloadZip() {
  const outputObjects = ImageProcessor.getOutputObjects();
  const zip = new JSZip();
  
  // Если обработка краев отключена, добавляем оригинальные изображения в архив
  if (!window.edgeProcessingSettings.enabled) {
    // Добавляем все объекты в архив
    for (let i = 0; i < outputObjects.length; i++) {
      const obj = outputObjects[i];
      
      // Конвертируем dataUrl в blob
      const response = await fetch(obj.dataUrl);
      const blob = await response.blob();
      
      // Добавляем в архив
      zip.file(obj.fileName, blob);
    }
  } else {
    // Обрабатываем каждое изображение перед добавлением в архив
    for (let i = 0; i < outputObjects.length; i++) {
      const obj = outputObjects[i];
      
      // Создаем временный canvas для обработки
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      const img = new Image();
      
      // Загружаем изображение и обрабатываем его
      await new Promise(resolve => {
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
          
          resolve();
        };
        
        img.src = obj.dataUrl;
      });
      
      // Получаем blob из обработанного изображения
      const blob = await new Promise(resolve => {
        tempCanvas.toBlob(resolve, 'image/png');
      });
      
      // Добавляем в архив
      zip.file(obj.fileName, blob);
    }
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