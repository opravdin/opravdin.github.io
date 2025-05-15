/**
 * UI Manager - модуль для управления пользовательским интерфейсом
 * Содержит функции для обновления UI, отображения элементов и т.д.
 */

// Функция для обновления списка исходных изображений
function updateSourceImagesList() {
  const sourceImagesContainer = document.getElementById('sourceImagesContainer');
  const sourceImagesList = document.getElementById('sourceImagesList');
  const sourceImages = ImageProcessor.getSourceImages();
  
  if (sourceImages.length === 0) {
    sourceImagesContainer.style.display = 'none';
    return;
  }
  
  sourceImagesContainer.style.display = 'block';
  sourceImagesList.innerHTML = '';
  
  sourceImages.forEach((source, index) => {
    const li = document.createElement('li');
    li.className = 'source-image-item';
    
    const img = document.createElement('img');
    img.className = 'source-image-preview';
    img.src = URL.createObjectURL(source.file);
    img.alt = source.file.name;
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'source-image-info';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'source-image-name';
    nameDiv.textContent = source.file.name;
    
    const metaDiv = document.createElement('div');
    metaDiv.className = 'source-image-meta';
    metaDiv.textContent = `${source.width}x${source.height} | Объектов: ${source.objectCount}`;
    
    infoDiv.appendChild(nameDiv);
    infoDiv.appendChild(metaDiv);
    
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'source-image-actions';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn-add';
    downloadBtn.innerHTML = '<i class="fas fa-download"></i> Скачать объекты';
    downloadBtn.addEventListener('click', () => DownloadManager.downloadSourceObjects(index));
    
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-danger';
    removeBtn.innerHTML = '<i class="fas fa-trash"></i> Удалить';
    removeBtn.addEventListener('click', () => ImageProcessor.removeSourceImage(index));
    
    actionsDiv.appendChild(downloadBtn);
    actionsDiv.appendChild(removeBtn);
    
    li.appendChild(img);
    li.appendChild(infoDiv);
    li.appendChild(actionsDiv);
    
    sourceImagesList.appendChild(li);
  });
}

// Функция для обновления отображения результатов
function updateOutputDisplay() {
  const output = document.getElementById('output');
  const emptyOutput = document.getElementById('emptyOutput');
  const outputActions = document.getElementById('outputActions');
  const outputObjects = ImageProcessor.getOutputObjects();
  
  if (outputObjects.length === 0) {
    output.innerHTML = '';
    output.appendChild(emptyOutput);
    outputActions.style.display = 'none';
    return;
  }
  
  output.innerHTML = '';
  outputActions.style.display = 'flex';
  
  outputObjects.forEach((obj, index) => {
    const div = document.createElement('div');
    div.className = 'output-item';
    div.dataset.index = index;
    
    const img = document.createElement('img');
    img.src = obj.dataUrl;
    img.alt = `Object ${index}`;
    
    const overlay = document.createElement('div');
    overlay.className = 'output-item-overlay';
    overlay.textContent = `${obj.width}x${obj.height}`;
    
    const actions = document.createElement('div');
    actions.className = 'output-item-actions';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.innerHTML = '<i class="fas fa-download"></i>';
    downloadBtn.title = 'Скачать';
    downloadBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      DownloadManager.downloadObject(index);
    });
    
    const splitBtn = document.createElement('button');
    splitBtn.innerHTML = '<i class="fas fa-cut"></i>';
    splitBtn.title = 'Разделить дальше';
    splitBtn.className = 'split-btn';
    splitBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      SubdivisionManager.openSubdivisionModal(index);
    });
    
    actions.appendChild(downloadBtn);
    actions.appendChild(splitBtn);
    
    div.appendChild(img);
    div.appendChild(overlay);
    div.appendChild(actions);
    
    output.appendChild(div);
  });
}

// Функция для показа предпросмотра
function showPreview(img) {
  const previewImage = document.getElementById('previewImage');
  const previewContainer = document.getElementById('previewContainer');
  const eyedropperBtn = document.getElementById('eyedropperBtn');
  const colorPicker = document.getElementById('colorPicker');
  
  previewImage.src = img.src;
  previewContainer.style.display = 'block';
  
  // Настраиваем пипетку
  previewImage.addEventListener('click', function(e) {
    if (!window.isEyedropperActive) return;
    
    const rect = previewImage.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width * img.width;
    const y = (e.clientY - rect.top) / rect.height * img.height;
    
    // Получаем цвет пикселя
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    const [r, g, b] = [pixel[0], pixel[1], pixel[2]];
    const hex = ColorUtils.rgbToHex(r, g, b);
    
    // Устанавливаем цвет в пикер
    colorPicker.value = hex;
    
    // Деактивируем пипетку
    window.isEyedropperActive = false;
    eyedropperBtn.classList.remove('active');
  });
}

// Функция для инициализации обработчиков событий UI
function initUIEventHandlers() {
  // DOM элементы
  const fileInput = document.getElementById('fileInput');
  const dropArea = document.getElementById('dropArea');
  const colorPicker = document.getElementById('colorPicker');
  const eyedropperBtn = document.getElementById('eyedropperBtn');
  const toleranceSlider = document.getElementById('toleranceSlider');
  const toleranceValue = document.getElementById('toleranceValue');
  
  // DOM элементы для настроек обработки краев
  const enableEdgeProcessingCheckbox = document.getElementById('enableEdgeProcessingCheckbox');
  const edgeProcessingOptions = document.getElementById('edgeProcessingOptions');
  const blurRadiusSlider = document.getElementById('blurRadiusSlider');
  const blurRadiusValue = document.getElementById('blurRadiusValue');
  const thresholdSlider = document.getElementById('thresholdSlider');
  const thresholdValue = document.getElementById('thresholdValue');
  const edgeOnlyCheckbox = document.getElementById('edgeOnlyCheckbox');
  
  // Кнопки действий
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const downloadZipBtn = document.getElementById('downloadZipBtn');
  const clearLastBtn = document.getElementById('clearLastBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
  // Загрузка файлов через input
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => ImageProcessor.processImage(file));
  });
  
  // Drag and drop
  dropArea.addEventListener('click', () => fileInput.click());
  
  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });
  
  dropArea.addEventListener('dragleave', () => {
    dropArea.classList.remove('drag-over');
  });
  
  dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    files.forEach(file => ImageProcessor.processImage(file));
  });
  
  // Вставка из буфера обмена
  document.addEventListener('paste', (e) => {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    
    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        const file = item.getAsFile();
        ImageProcessor.processImage(file);
        break;
      }
    }
  });
  
  // Изменение цвета
  colorPicker.addEventListener('change', () => {
    // Если есть загруженные изображения, пересчитываем объекты
    const lastImageIndex = ImageProcessor.getLastImageIndex();
    if (lastImageIndex !== -1) {
      ImageProcessor.clearAllResults();
      const sourceImages = ImageProcessor.getSourceImages();
      sourceImages.forEach((_, index) => ImageProcessor.splitImageObjects(index));
    }
  });
  
  // Пипетка
  eyedropperBtn.addEventListener('click', () => {
    window.isEyedropperActive = !window.isEyedropperActive;
    eyedropperBtn.classList.toggle('active', window.isEyedropperActive);
  });
  
  // Изменение допуска
  toleranceSlider.addEventListener('input', (e) => {
    const tolerance = parseInt(e.target.value);
    toleranceValue.textContent = tolerance;
    ImageProcessor.setCurrentTolerance(tolerance);
    
    // Если есть загруженные изображения, пересчитываем объекты
    const lastImageIndex = ImageProcessor.getLastImageIndex();
    if (lastImageIndex !== -1) {
      ImageProcessor.clearAllResults();
      const sourceImages = ImageProcessor.getSourceImages();
      sourceImages.forEach((_, index) => ImageProcessor.splitImageObjects(index));
    }
  });
  
  // Обработчики событий для настроек обработки краев
  enableEdgeProcessingCheckbox.addEventListener('change', function(e) {
    window.edgeProcessingSettings.enabled = e.target.checked;
    edgeProcessingOptions.style.display = e.target.checked ? 'block' : 'none';
  });
  
  blurRadiusSlider.addEventListener('input', function(e) {
    window.edgeProcessingSettings.blurRadius = parseInt(e.target.value);
    blurRadiusValue.textContent = e.target.value;
  });
  
  thresholdSlider.addEventListener('input', function(e) {
    window.edgeProcessingSettings.threshold = parseInt(e.target.value);
    thresholdValue.textContent = e.target.value;
  });
  
  edgeOnlyCheckbox.addEventListener('change', function(e) {
    window.edgeProcessingSettings.edgeOnly = e.target.checked;
  });
  
  // Кнопки действий
  downloadAllBtn.addEventListener('click', DownloadManager.downloadAllObjects);
  downloadZipBtn.addEventListener('click', DownloadManager.downloadZip);
  clearLastBtn.addEventListener('click', ImageProcessor.clearLastResults);
  clearAllBtn.addEventListener('click', ImageProcessor.clearAllResults);
}

// Экспорт функций
window.UIManager = {
  updateSourceImagesList,
  updateOutputDisplay,
  showPreview,
  initUIEventHandlers
};