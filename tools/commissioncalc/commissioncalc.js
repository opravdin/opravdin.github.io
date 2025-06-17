document.addEventListener('DOMContentLoaded', function() {
    const desiredAmountInput = document.getElementById('desiredAmount');
    const commissionRadios = document.querySelectorAll('input[name="commission"]');
    const customCommissionInput = document.getElementById('customCommission');
    const calculateBtn = document.getElementById('calculateBtn');
    const resultsSection = document.getElementById('results');
    const priceWithCommissionEl = document.getElementById('priceWithCommission');
    const commissionAmountEl = document.getElementById('commissionAmount');
    
    let currentPriceWithCommission = 0;

    // Загрузка сохраненного процента комиссии из localStorage
    const savedCommission = localStorage.getItem('marketplaceCommission');
    const savedCustomCommission = localStorage.getItem('marketplaceCustomCommission');
    
    if (savedCommission) {
        const radioToCheck = document.querySelector(`input[name="commission"][value="${savedCommission}"]`);
        if (radioToCheck) {
            radioToCheck.checked = true;
            if (savedCommission === 'custom' && savedCustomCommission) {
                customCommissionInput.value = savedCustomCommission;
            }
        }
    }

    // Обработчик изменения радиокнопок
    commissionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value !== 'custom') {
                customCommissionInput.value = '';
                localStorage.setItem('marketplaceCommission', this.value);
            } else {
                customCommissionInput.focus();
            }
            // Автоматический пересчет при изменении процента
            if (desiredAmountInput.value) {
                calculate();
            }
        });
    });

    // Обработчик изменения произвольного процента
    customCommissionInput.addEventListener('input', function() {
        const customRadio = document.querySelector('input[name="commission"][value="custom"]');
        if (this.value) {
            customRadio.checked = true;
            localStorage.setItem('marketplaceCommission', 'custom');
            localStorage.setItem('marketplaceCustomCommission', this.value);
            // Автоматический пересчет при изменении произвольного процента
            if (desiredAmountInput.value) {
                calculate();
            }
        }
    });

    // Обработчик клика по кнопке расчета
    calculateBtn.addEventListener('click', function() {
        calculate(true);
    });

    // Обработчик нажатия Enter в поле суммы
    desiredAmountInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            calculate(true);
        }
    });

    // Автоматический пересчет при изменении суммы
    desiredAmountInput.addEventListener('input', function() {
        if (this.value && document.querySelector('input[name="commission"]:checked')) {
            calculate();
        }
    });


    // Функция копирования текста в буфер обмена
    function copyTextToClipboard(text, button) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = button.textContent;
            button.textContent = 'Скопировано!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        }).catch(err => {
            console.error('Ошибка при копировании:', err);
        });
    }

    // Обработчики для дополнительных кнопок копирования
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('copy-text-btn')) {
            const textElement = e.target.previousElementSibling;
            copyTextToClipboard(textElement.textContent, e.target);
        } else if (e.target.classList.contains('copy-price-btn')) {
            copyTextToClipboard(currentPriceWithCommission.toString(), e.target);
        }
    });

    function calculate(shouldScroll = false) {
        const desiredAmount = parseFloat(desiredAmountInput.value);
        
        if (!desiredAmount || desiredAmount <= 0) {
            resultsSection.style.display = 'none';
            return;
        }

        let commissionPercent = null;
        const selectedRadio = document.querySelector('input[name="commission"]:checked');
        
        if (!selectedRadio) {
            resultsSection.style.display = 'none';
            return;
        }

        if (selectedRadio.value === 'custom') {
            commissionPercent = parseFloat(customCommissionInput.value);
            if (!commissionPercent || commissionPercent < 0 || commissionPercent > 100) {
                resultsSection.style.display = 'none';
                return;
            }
        } else {
            commissionPercent = parseFloat(selectedRadio.value);
        }

        // Расчет цены для получения желаемой суммы после вычета комиссии
        // Формула: цена = желаемая_сумма / (1 - комиссия/100)
        const priceWithCommission = Math.ceil(desiredAmount / (1 - commissionPercent / 100));
        const commissionAmount = priceWithCommission - desiredAmount;
        
        // Сохраняем значение для копирования
        currentPriceWithCommission = priceWithCommission;

        // Отображение результатов
        priceWithCommissionEl.textContent = priceWithCommission.toLocaleString('ru-RU') + ' ₽';
        commissionAmountEl.textContent = commissionAmount.toLocaleString('ru-RU') + ' ₽';
        
        // Обновление текстов для разных вариантов
        const pickupPriceFormatted = desiredAmount.toLocaleString('ru-RU');
        document.querySelectorAll('.pickup-price').forEach(el => {
            el.textContent = pickupPriceFormatted;
        });
        
        resultsSection.style.display = 'block';
        if (shouldScroll) {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
});