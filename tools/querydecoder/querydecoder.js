function parseQueryString(queryString) {
    const params = {};
    
    if (!queryString || queryString.length === 0) {
        return params;
    }
    
    // Удаляем начальный '?' если есть
    if (queryString.startsWith('?')) {
        queryString = queryString.substring(1);
    }
    
    // Разделяем по '&' чтобы получить отдельные параметры
    const pairs = queryString.split('&');
    
    pairs.forEach(pair => {
        if (pair) {
            const [key, value] = pair.split('=');
            
            if (key) {
                // Декодируем ключ и значение
                const decodedKey = decodeURIComponent(key.replace(/\+/g, ' '));
                const decodedValue = value ? decodeURIComponent(value.replace(/\+/g, ' ')) : '';
                
                // Обрабатываем нотацию массива (например, filters[])
                if (decodedKey.endsWith('[]')) {
                    const arrayKey = decodedKey.slice(0, -2);
                    if (!params[arrayKey]) {
                        params[arrayKey] = [];
                    }
                    params[arrayKey].push(decodedValue);
                }
                // Обрабатываем нотацию объекта (например, search[query])
                else if (decodedKey.includes('[') && decodedKey.includes(']')) {
                    const match = decodedKey.match(/^([^\[]+)\[([^\]]+)\]$/);
                    if (match) {
                        const objectKey = match[1];
                        const propertyKey = match[2];
                        if (!params[objectKey]) {
                            params[objectKey] = {};
                        }
                        params[objectKey][propertyKey] = decodedValue;
                    } else {
                        params[decodedKey] = decodedValue;
                    }
                }
                // Обычный параметр
                else {
                    params[decodedKey] = decodedValue;
                }
            }
        }
    });
    
    return params;
}

function displayParameters(params, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    if (Object.keys(params).length === 0) {
        container.innerHTML = '<p class="no-params">Параметры запроса не найдены.</p>';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'params-table';
    
    const thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
            <th>Имя параметра</th>
            <th>Значение</th>
            <th>Тип</th>
            <th>Закодированное значение</th>
        </tr>
    `;
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                const row = createTableRow(`${key}[${index}]`, item, 'массив', `${encodeURIComponent(key)}[]=${encodeURIComponent(item)}`);
                tbody.appendChild(row);
            });
        } else if (typeof value === 'object' && value !== null) {
            Object.entries(value).forEach(([subKey, subValue]) => {
                const row = createTableRow(`${key}.${subKey}`, subValue, 'объект', `${encodeURIComponent(key)}[${encodeURIComponent(subKey)}]=${encodeURIComponent(subValue)}`);
                tbody.appendChild(row);
            });
        } else {
            const row = createTableRow(key, value, 'строка', `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
            tbody.appendChild(row);
        }
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}

function createTableRow(name, value, type, encoded) {
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="param-name">${escapeHtml(name)}</td>
        <td class="param-value">${escapeHtml(value)}</td>
        <td class="param-type">${type}</td>
        <td class="param-encoded">${escapeHtml(encoded)}</td>
    `;
    return row;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateCurrentURL() {
    const currentURL = window.location.href;
    const urlDisplay = document.getElementById('current-url');
    urlDisplay.textContent = currentURL;
    
    const queryString = window.location.search;
    const params = parseQueryString(queryString);
    displayParameters(params, 'params-display');
}

function decodeManualURL() {
    const input = document.getElementById('manual-url');
    const url = input.value.trim();
    
    if (!url) {
        alert('Пожалуйста, введите URL');
        return;
    }
    
    try {
        const urlObj = new URL(url);
        const params = parseQueryString(urlObj.search);
        
        const container = document.getElementById('manual-params-display');
        container.classList.remove('hidden');
        
        // Отображаем информацию о URL
        container.innerHTML = `
            <h3>Декодированные параметры URL</h3>
            <div class="url-info">
                <p><strong>Полный URL:</strong> <span class="url-display">${escapeHtml(url)}</span></p>
                <p><strong>Базовый URL:</strong> ${escapeHtml(urlObj.origin + urlObj.pathname)}</p>
                <p><strong>Строка запроса:</strong> ${escapeHtml(urlObj.search || '(нет)')}</p>
            </div>
            <div id="manual-params-table"></div>
        `;
        
        displayParameters(params, 'manual-params-table');
    } catch (e) {
        alert('Неверный формат URL. Пожалуйста, введите корректный URL.');
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    updateCurrentURL();
    
    // Обновляем при изменении URL (например, после отправки формы)
    window.addEventListener('popstate', updateCurrentURL);
    
    // Добавляем поддержку клавиши Enter для ручного ввода URL
    document.getElementById('manual-url').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            decodeManualURL();
        }
    });
});