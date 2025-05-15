/**
 * Color Utilities - модуль для работы с цветами
 * Содержит функции для сравнения цветов, конвертации между форматами и т.д.
 */

// Функция для проверки совпадения цвета с учетом допуска
function colorMatch(data, idx, r, g, b, tolerance = 10) {
  return Math.abs(data[idx] - r) <= tolerance &&
         Math.abs(data[idx + 1] - g) <= tolerance &&
         Math.abs(data[idx + 2] - b) <= tolerance;
}

// Функция для получения RGB из HEX
function hexToRgb(hex) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return [r, g, b];
}

// Функция для получения HEX из RGB
function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// Экспорт функций
window.ColorUtils = {
  colorMatch,
  hexToRgb,
  rgbToHex
};