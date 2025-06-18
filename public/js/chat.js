class Chat {
    constructor() {
        this.state = {
            isOpen: false,
            currentStep: 'initial',
            selectedType: null,
            selectedProfession: null,
            selectedCriteria: [],
            dataLoaded: false,
            isLoading: false
        };

        // Initialize chat UI immediately but load data lazily
        this.initialize();
    }

    initialize() {
        // Create chat button with loading state
        const button = document.createElement('div');
        button.className = 'chat-button';
        button.innerHTML = '<i class="fas fa-comments"></i>';
        document.body.appendChild(button);

        // Create chat window with loading indicator
        const chatWindow = document.createElement('div');
        chatWindow.className = 'chat-window active'; // Show by default
        chatWindow.innerHTML = `
            <div class="chat-header">
                <span>Чат поддержки</span>
                <span class="chat-close">&times;</span>
            </div>
            <div class="chat-messages"></div>
            <div class="chat-input-area">
                <input type="text" class="chat-input" placeholder="Напишите сообщение...">
                <button class="chat-send">Отправить</button>
            </div>
            <div class="chat-loading" style="display: none">
                <div class="loading-spinner"></div>
            </div>
        `;
        document.body.appendChild(chatWindow);

        this.chatWindow = chatWindow;
        this.messagesContainer = chatWindow.querySelector('.chat-messages');
        this.inputField = chatWindow.querySelector('.chat-input');
        this.loadingIndicator = chatWindow.querySelector('.chat-loading');

        // Add event listeners
        button.addEventListener('click', () => this.toggleChat());
        chatWindow.querySelector('.chat-close').addEventListener('click', () => this.toggleChat());
        chatWindow.querySelector('.chat-send').addEventListener('click', () => this.handleUserInput());
        chatWindow.querySelector('.chat-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleUserInput();
        });

        // Start conversation immediately
        this.startConversation();
    }

    showLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'flex';
        }
    }

    hideLoading() {
        if (this.loadingIndicator) {
            this.loadingIndicator.style.display = 'none';
        }
    }

    async loadData() {
        if (this.state.dataLoaded || this.state.isLoading) return;
        
        try {
            this.state.isLoading = true;
            this.showLoading();
            
            const response = await fetch('/chat/data');
            const data = await response.json();
            
            this.types = data.types;
            this.professions = data.professions;
            this.criterias = data.criterias;
            
            this.state.dataLoaded = true;
        } catch (error) {
            console.error('Error loading chat data:', error);
            this.addMessage('Произошла ошибка при загрузке данных. Пожалуйста, попробуйте позже.');
        } finally {
            this.state.isLoading = false;
            this.hideLoading();
        }
    }

    toggleChat() {
        this.state.isOpen = !this.state.isOpen;
        this.chatWindow.classList.toggle('active');
    }

    addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
        messageDiv.textContent = message;
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    addOptions(options, callback, multiSelect = false) {
        const container = document.createElement('div');
        container.className = 'options-container';
        
        if (multiSelect) {
            const selectedOptions = new Set();
            
            options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'option-button';
                button.textContent = option.name;
                if (option.description) {
                    button.innerHTML += `<div class="option-description">${option.description}</div>`;
                }
                button.addEventListener('click', () => {
                    if (selectedOptions.has(option.id)) {
                        selectedOptions.delete(option.id);
                        button.classList.remove('selected');
                    } else {
                        selectedOptions.add(option.id);
                        button.classList.add('selected');
                    }
                });
                container.appendChild(button);
            });

            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'confirm-buttons';

            const confirmButton = document.createElement('button');
            confirmButton.className = 'confirm-button';
            confirmButton.textContent = 'Подтвердить выбор';
            confirmButton.addEventListener('click', () => {
                callback(Array.from(selectedOptions));
            });

            const skipButton = document.createElement('button');
            skipButton.className = 'skip-button';
            skipButton.textContent = 'Пропустить';
            skipButton.addEventListener('click', () => {
                callback([]);
            });

            buttonsContainer.appendChild(confirmButton);
            buttonsContainer.appendChild(skipButton);
            container.appendChild(buttonsContainer);
        } else {
            options.forEach(option => {
                const button = document.createElement('button');
                button.className = 'option-button';
                button.innerHTML = option.name;
                if (option.description) {
                    button.innerHTML += `<div class="option-description">${option.description}</div>`;
                }
                button.addEventListener('click', () => callback(option));
                container.appendChild(button);
            });
        }

        this.messagesContainer.appendChild(container);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    async startConversation() {
        this.addMessage('Здравствуйте! Я помогу вам найти подходящего специалиста для вашего мероприятия. Хотите начать поиск?');
        this.addOptions([
            { id: 'start', name: 'Начать поиск' },
            { id: 'free', name: 'Написать свой запрос' }
        ], async (option) => {
            if (option.id === 'start') {
                await this.loadData(); // Load data only when user starts search
                this.showProfessions();
            } else {
                this.state.currentStep = 'freeInput';
                this.addMessage('Опишите, какая помощь вам требуется:');
            }
        });
    }

    async showProfessions() {
        if (!this.state.dataLoaded) {
            await this.loadData();
        }
        this.state.currentStep = 'profession';
        this.addMessage('Какой специалист вам нужен?');
        this.addOptions(this.professions, (option) => {
            this.state.selectedProfession = option.id;
            this.showEventTypes();
        });
    }

    async showEventTypes() {
        if (!this.state.dataLoaded) {
            await this.loadData();
        }
        this.state.currentStep = 'eventType';
        this.addMessage('Выберите тип мероприятия:');
        this.addOptions(this.types, (option) => {
            this.state.selectedType = option.id;
            this.showCriteria();
        });
    }

    async showCriteria() {
        if (!this.state.dataLoaded) {
            await this.loadData();
        }
        this.state.currentStep = 'criteria';
        this.addMessage('Выберите важные для вас критерии (можно выбрать несколько или пропустить):');
        this.addOptions(this.criterias, (selectedCriteria) => {
            this.state.selectedCriteria = selectedCriteria;
            this.showResults();
        }, true);
    }

    async showResults() {
        this.addMessage('Ищу подходящих специалистов...');
        this.showLoading();
        
        try {
            const response = await fetch('/chat/findMasters', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    professionId: this.state.selectedProfession,
                    typeId: this.state.selectedType,
                    criteriaIds: this.state.selectedCriteria
                })
            });

            const masters = await response.json();
            
            if (masters.length === 0) {
                this.addMessage('К сожалению, не найдено специалистов по вашим критериям. Попробуйте изменить критерии поиска.');
                this.showCriteria();
                return;
            }

            this.addMessage(`Найдено ${masters.length} подходящих специалистов:`);
            
            // Batch DOM updates
            const fragment = document.createDocumentFragment();
            masters.forEach(master => {
                const specialistCard = createMasterCard(master);
                fragment.appendChild(specialistCard);
            });
            this.messagesContainer.appendChild(fragment);

            this.addMessage('Хотите начать новый поиск или изменить критерии?');
            this.addOptions([
                { id: 'new', name: 'Новый поиск' },
                { id: 'criteria', name: 'Изменить критерии' }
            ], (option) => {
                if (option.id === 'new') {
                    this.state = {
                        isOpen: true,
                        currentStep: 'initial',
                        selectedType: null,
                        selectedProfession: null,
                        selectedCriteria: [],
                        dataLoaded: false,
                        isLoading: false
                    };
                    this.startConversation();
                } else {
                    this.showCriteria();
                }
            });

        } catch (error) {
            console.error('Error fetching specialists:', error);
            this.addMessage('Произошла ошибка при поиске специалистов. Пожалуйста, попробуйте позже.');
        } finally {
            this.hideLoading();
        }
    }

    handleUserInput() {
        const message = this.inputField.value.trim();
        if (!message) return;

        this.addMessage(message, true);
        this.inputField.value = '';

        if (this.state.currentStep === 'freeInput') {
            this.addMessage('Спасибо за ваш запрос! Давайте подберем подходящих специалистов.');
            this.showProfessions();
        }
    }
}

function createMasterCard(master) {
    const card = document.createElement('div');
    card.className = 'master-card';
    card.style.cursor = 'pointer';
    
    card.innerHTML = `
        <h3>${master.Name}</h3>
        <p>${master.Description || 'Описание отсутствует'}</p>
        <p class="price">Цена: ${master.PriceForHour} руб/час</p>
    `;

    // Add click handler to navigate to master's page
    card.addEventListener('click', () => {
        window.location.href = `/masters/${master.MasterId}`;
    });

    return card;
}

// Initialize chat when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.chat = new Chat();
}); 