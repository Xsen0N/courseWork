window.onload = function() {
    // Получаем типы курсов из базы данных
    fetch('/api/types')
        .then(response => response.json())
        .then(types => {
            const select = document.getElementById('sortSelect');
            select.innerHTML = ''; // Очищаем существующие опции
            select.appendChild(createOption('all', 'Все типы')); // Добавляем опцию "Все типы"
            types.forEach(type => {
                select.appendChild(createOption(type.TypeId, type.TypeName)); // Добавляем опции для каждого типа
            });
        })
        .catch(error => {
            console.error('Ошибка при получении типов курсов:', error);
        });
};

function createOption(value, text) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
}

// function searchCourses() {
//     var input, filter, cards, card, title, description, price, type, select, sortValue, i;
//     input = document.getElementById('searchInput');
//     filter = input.value.toUpperCase();
//     cards = document.getElementsByClassName('course-card');
//     select = document.getElementById('sortSelect');
//     sortValue = select.value;

//     for (i = 0; i < cards.length; i++) {
//         card = cards[i];
//         title = card.getElementsByClassName('title')[0].innerText.toUpperCase();
//         description = card.getElementsByClassName('description')[0].innerText.toUpperCase();
//         price = card.getElementsByClassName('price')[0].innerText.toUpperCase();
//         type = card.getElementsByClassName('type')[0].innerText.toUpperCase();

//         if ((title.includes(filter) || description.includes(filter) || price.includes(filter)) &&
//             (sortValue === 'all' || type === sortValue)) {
//             card.style.display = '';
//         } else {
//             card.style.display = 'none';
//         }
//     }
// }


function newSearchCourses() {
    var selectedType = document.getElementById("sortSelect").value;
    
    // Отправляем запрос на сервер
    $.ajax({
        type: 'POST',
        url: '/searchCourses', // Указать правильный маршрут на сервере
        data: { type: selectedType },
        success: function(response) {
            // Обновляем содержимое list-container с отфильтрованными классами
            $('.list-container').html(response);
        },
        error: function(error) {
            console.error('Произошла ошибка при выполнении поиска:', error);
        }
    });
}