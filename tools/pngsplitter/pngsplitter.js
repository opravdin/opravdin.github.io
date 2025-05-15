/**
 * PNG Splitter - основной модуль приложения
 * Инициализирует все компоненты и содержит глобальные настройки
 */

// Глобальные переменные
window.isEyedropperActive = false;

// Настройки обработки краев
window.edgeProcessingSettings = {
  enabled: true,
  blurRadius: 1,
  threshold: 128,
  edgeOnly: true
};

// Функция инициализации приложения
function initApp() {
  console.log('Инициализация PNG Splitter...');
  
  // Инициализируем обработчики событий UI
  UIManager.initUIEventHandlers();
  
  // Инициализируем обработчики событий для дополнительного разделения
  SubdivisionManager.initSubdivisionEventHandlers();
  
  // Инициализируем настройки обработки краев
  const edgeProcessingOptions = document.getElementById('edgeProcessingOptions');
  edgeProcessingOptions.style.display = window.edgeProcessingSettings.enabled ? 'block' : 'none';
  
  console.log('PNG Splitter инициализирован успешно');
}

// Запускаем инициализацию после загрузки DOM
document.addEventListener('DOMContentLoaded', initApp);