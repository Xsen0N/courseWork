const { models } = require('../db/utils/db');
const { Sequelize, Op } = require('sequelize');
const sequelize = models.sequelize;

class RequestsController {
    constructor() {
        // Привязываем методы к контексту класса
        this.addRequest = this.addRequest.bind(this);
        this.notifySpecialists = this.notifySpecialists.bind(this);
    }

    async getRequestPage(req, res) {
        const master = req.session.masterId;
        if (master) {
            req.session.previousUrl = req.headers.referer;
            return res.status(403).render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Вы мастер, нельзя записываться!' });
        }

        if (!req.session.userId) {
            req.session.returnUrl = req.originalUrl;
            return res.status(301).redirect('/auth/login');
        }
        
        try {
            const types = await models.types.findAll({ raw: true });
            const professions = await models.professions.findAll({ raw: true });
            const criterias = await models.criterias.findAll({ raw: true });

            res.render("./layouts/requestForm.hbs", { 
                layout: "requestForm.hbs", 
                types: types, 
                professions: professions, 
                criterias: criterias 
            });
        } catch (error) {
            console.error('Ошибка при загрузке страницы заявки:', error);
            res.status(500).render('./layouts/error.hbs', { 
                layout: "error.hbs", 
                errorMessage: 'Ошибка при загрузке формы заявки' 
            });
        }
    };


    async addRequest(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false,
                message: "Пользователь не авторизован" 
            });
        }

        try {
            const { 
                TypeId,
                Date: eventDate,
                Location,
                Address,
                Comments,
                Professions,
                Quantities,
                Criterias
            } = req.body;

            // Проверяем обязательные поля
            if (!TypeId || !eventDate || !Location || !Address || !Professions || Professions.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Не все обязательные поля заполнены'
                });
            }

            // Проверяем дату
            const selectedDate = new Date(eventDate);
            if (isNaN(selectedDate.getTime()) || selectedDate < new Date()) {
                return res.status(400).json({
                    success: false,
                    message: 'Некорректная дата мероприятия'
                });
            }

            // Подсчитываем общее количество специалистов
            let serviceCount = 0;
            for (const professionId of Professions) {
                const quantity = parseInt(Quantities[professionId]) || 1;
                if (isNaN(quantity) || quantity < 1) {
                    return res.status(400).json({
                        success: false,
                        message: 'Некорректное количество специалистов'
                    });
                }
                serviceCount += quantity;
            }

            // Создаем заявку
            const request = await models.requests.create({
                UserId: req.session.userId,
                TypeId: parseInt(TypeId),
                Date: selectedDate,
                Location: Location.trim(),
                Address: Address.trim(),
                Comments: Comments ? Comments.trim() : null,
                Status: 'pending',
                ServiceCount: serviceCount
            });

            // Добавляем профессии
            for (const professionId of Professions) {
                await models.requestProfession.create({
                    RequestId: request.RequestId,
                    ProfessionId: parseInt(professionId),
                    required: parseInt(Quantities[professionId]) || 1,
                    approved: 0,
                    status: 'pending'
                });
            }

            // Добавляем критерии, если они есть
            if (Criterias && Criterias.length > 0) {
                for (const criteriaId of Criterias) {
                    await models.requestCriterias.create({
                        RequestId: request.RequestId,
                        CriteriasId: parseInt(criteriaId)
                    });
                }
            }

            // Отправляем уведомления специалистам
            await this.notifySpecialists(request.RequestId);

            res.status(200).json({
                success: true,
                message: 'Заявка успешно создана',
                requestId: request.RequestId
            });

        } catch (error) {
            console.error('Ошибка при создании заявки:', error);
            res.status(500).json({
                success: false,
                message: 'Произошла ошибка при создании заявки',
                details: error.message
            });
        }
    }

    async notifySpecialists(requestId) {
        try {
            console.log('Начинаем поиск специалистов для заявки:', requestId);
            
            // 1. Получаем заявку с профессиями
            const request = await models.requests.findOne({
                where: { RequestId: requestId },
                include: [
                    {
                        model: models.professions,
                        required: true,
                        through: {
                            attributes: ['required', 'approved', 'status']
                        }
                    },
                    {
                        model: models.types,
                        required: true
                    }
                ],
                logging: console.log // Добавляем логирование SQL запроса
            });

            console.log('Результат запроса заявки:', JSON.stringify(request, null, 2));

            if (!request) {
                console.log('Заявка не найдена в базе данных');
                return;
            }

            if (!request.professions) {
                console.log('У заявки нет связанных профессий');
                return;
            }

            if (request.professions.length === 0) {
                console.log('Массив профессий пуст');
                return;
            }

            console.log('Найдена заявка:', {
                id: request.RequestId,
                type: request.type?.TypeName || 'Тип не указан',
                professions: request.professions.map(p => ({
                    id: p.ProfessionId,
                    name: p.ProfessionName,
                    required: p.requestProfession?.required || 0
                }))
            });

            // 2. Получаем ID профессий из заявки
            const professionIds = request.professions.map(p => p.ProfessionId);
            console.log('ID профессий для поиска:', professionIds);

            // 3. Находим всех мастеров с нужными профессиями
            const mastersQuery = {
                include: [{
                    model: models.professions,
                    where: {
                        ProfessionId: {
                            [Op.in]: professionIds
                        }
                    }
                }],
                logging: console.log // Добавляем логирование SQL запроса
            };

            console.log('Параметры запроса мастеров:', JSON.stringify(mastersQuery, null, 2));
            
            const masters = await models.masters.findAll(mastersQuery);

            console.log('Результат запроса мастеров:', 
                masters.map(m => ({
                    id: m.MasterId,
                    name: m.Name,
                    professions: m.professions?.map(p => ({
                        id: p.ProfessionId,
                        name: p.ProfessionName
                    }))
                }))
            );

            if (!masters) {
                console.log('Запрос мастеров вернул null');
                return;
            }

            if (masters.length === 0) {
                console.log('Не найдено мастеров с профессиями:', professionIds);
                
                // Дополнительная проверка - поиск всех мастеров
                const allMasters = await models.masters.findAll({
                    include: [{
                        model: models.professions
                    }],
                    logging: console.log
                });
                
                console.log('Всего мастеров в системе:', allMasters.length);
                console.log('Профессии мастеров:', 
                    allMasters.map(m => ({
                        masterId: m.MasterId,
                        professions: m.professions?.map(p => p.ProfessionId)
                    }))
                );
                return;
            }

            console.log('Найдено мастеров:', masters.length);

            // 4. Формируем текст уведомления
            const professionText = request.professions
                .map(p => `${p.ProfessionName} (${p.requestProfession?.required || 0} чел.)`)
                .join(', ');

            // 5. Создаем уведомления для каждого мастера
            const notifications = masters.map(master => ({
                MasterId: master.MasterId,
                Type: 'new_request',
                Message: `Новая заявка "${request.type.TypeName}" (${request.Location}). Требуются: ${professionText}`,
                Metadata: JSON.stringify({
                    requestId: request.RequestId,
                    location: request.Location,
                    date: request.Date,
                    address: request.Address
                }),
                isRead: false
            }));

            // 6. Сохраняем уведомления
            if (notifications.length > 0) {
                await models.notifications.bulkCreate(notifications);
                console.log(`Отправлено ${notifications.length} уведомлений специалистам:`, 
                    notifications.map(n => ({
                        masterId: n.MasterId,
                        message: n.Message
                    }))
                );
            }

        } catch (error) {
            console.error('Ошибка при отправке уведомлений специалистам:', error);
            console.error('Детали ошибки:', error.message);
            console.error('Стек ошибки:', error.stack);
            throw error;
        }
    }

    async getRequestResponses(req, res) {
        try {
            const { requestId } = req.params;
            
            const request = await models.requests.findByPk(requestId, {
                include: [
                    {
                        model: models.professions,
                        through: { attributes: ['required', 'approved', 'status'] },
                        include: [
                            {
                                model: models.responses,
                                where: { status: 'pending' },
                                required: false,
                                include: [
                                    {
                                        model: models.masters,
                                        attributes: ['MasterId', 'Name']
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: models.types
                    }
                ]
            });
        
            if (!request) {
                return res.status(404).json({ error: "Заявка не найдена" });
            }
        
            res.status(200).json({
                requestId: request.RequestId,
                date: request.Date,
                type: request.type.TypeName,
                professions: request.professions.map(prof => ({
                    professionId: prof.ProfessionId,
                    name: prof.ProfessionName,
                    required: prof.RequestProfessions.required,
                    approved: prof.RequestProfessions.approved,
                    status: prof.RequestProfessions.status,
                    responses: prof.responses.map(resp => ({
                        responseId: resp.ResponseId,
                        specialistId: resp.Specialist.UserId,
                        specialistName: resp.Specialist.FullName,
                        rating: resp.Specialist.Rating,
                        status: resp.status,
                        createdAt: resp.createdAt
                    }))
                }))
            });
        } catch (error) {
            console.error('Ошибка получения откликов:', error);
            res.status(500).json({ 
                error: 'Ошибка при получении откликов',
                details: error.message 
            });
        }
    }

    async processResponse(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Пользователь не авторизировался" });
        }

        const { responseId, action } = req.body; // action: 'approve' или 'reject'

        const transaction = await sequelize.transaction();
        try {
            const response = await models.responses.findOne({
                where: { ResponseId: responseId },
                include: [
                    {
                        model: models.requests,
                        where: { UserId: req.session.userId }
                    },
                    {
                        model: models.professions
                    }
                ]
            }, { transaction });

            if (!response) {
                await transaction.rollback();
                return res.status(404).json({ error: "Отклик не найден или у вас нет прав" });
            }
            response.status = action === 'approve' ? 'approved' : 'rejected';
            await response.save({ transaction });

            if (action === 'approve') {
                const [updated] = await models.requestProfession.increment('approved', {
                    where: { 
                        RequestId: response.RequestId, 
                        ProfessionId: response.ProfessionId 
                    },
                    transaction
                });

                const requestProfession = await models.requestProfession.findOne({
                    where: { 
                        RequestId: response.RequestId, 
                        ProfessionId: response.ProfessionId 
                    },
                    transaction
                });

                if (requestProfession.approved >= requestProfession.required) {
                    requestProfession.status = 'completed';
                    await requestProfession.save({ transaction });

                    // Отклоняем все другие pending отклики по этой профессии
                    await models.responses.update(
                        { status: 'rejected' },
                        {
                            where: { 
                                RequestId: response.RequestId,
                                ProfessionId: response.ProfessionId,
                                status: 'pending',
                                ResponseId: { [Op.ne]: response.ResponseId }
                            },
                            transaction
                        }
                    );
                } else {
                    requestProfession.status = 'partially_approved';
                    await requestProfession.save({ transaction });
                }

                const pendingProfessions = await models.requestProfession.count({
                    where: { 
                        RequestId: response.RequestId,
                        status: { [Op.not]: 'completed' }
                    },
                    transaction
                });

                if (pendingProfessions === 0) {
                    await models.requests.update(
                        { Status: 1 },
                        { where: { RequestId: response.RequestId }, transaction }
                    );
                }
            }

            await transaction.commit();
            await models.notifications.create({
                UserId: response.SpecialistId,
                RequestId: response.RequestId,
                type: 'response_' + (action === 'approve' ? 'approved' : 'rejected'),
                message: action === 'approve' 
                    ? 'Ваш отклик был одобрен' 
                    : 'Ваш отклик был отклонен',
                isRead: false
            });

            res.status(200).json({ success: true });

        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка обработки отклика:', error);
            res.status(500).json({ 
                error: 'Ошибка при обработке отклика',
                details: error.message 
            });
        }
    }

    // метод для проверки статуса заявки:
    async checkRequestCompletion(requestId) {
        const request = await models.requests.findByPk(requestId, {
          include: [{
            model: models.professions,
            through: { attributes: ['required', 'approved', 'status'] }
          }]
        });
      
        const allCompleted = request.professions.every(prof => 
          prof.RequestProfessions.approved >= prof.RequestProfessions.required
        );
      
        const someApproved = request.professions.some(prof => 
          prof.RequestProfessions.approved > 0
        );
      
        let newStatus = request.Status;
        if (allCompleted) {
          newStatus = 'completed';
        } else if (someApproved) {
          newStatus = 'in_progress';
        }
      
        if (newStatus !== request.Status) {
          await request.update({ Status: newStatus });
        }
      
        return newStatus;
      }

      //В интерфейсе можно показывать такую информацию:
      async getRequestStatus(req, res) {
        const request = await models.requests.findByPk(req.params.id, {
          include: [{
            model: models.professions,
            attributes: ['ProfessionName'],
            through: { attributes: ['required', 'approved'] }
          }]
        });
      
        const statusInfo = {
          overallStatus: request.Status,
          professions: request.professions.map(prof => ({
            name: prof.ProfessionName,
            required: prof.RequestProfessions.required,
            approved: prof.RequestProfessions.approved,
            completed: prof.RequestProfessions.approved >= prof.RequestProfessions.required
          }))
        };
      
        res.json(statusInfo);
      }

      //При изменении статуса можно отправлять уведомления
      async updateRequestStatus(requestId) {
        const newStatus = await this.checkRequestCompletion(requestId);
        const request = await models.requests.findByPk(requestId);
        
        if (newStatus === 'completed') {
          await models.notifications.create({
            UserId: request.UserId,
            type: 'request_completed',
            message: 'Ваша заявка полностью выполнена!',
            isRead: false
          });
        }
        else if (newStatus === 'in_progress') {
          await models.notifications.create({
            UserId: request.UserId,
            type: 'request_progress',
            message: 'Часть специалистов по вашей заявке одобрена',
            isRead: false
          });
        }
      }

    // Получение всех заявок пользователя с информацией о специалистах
    async getUserRequests(req, res) {
        try {
            const requests = await models.requests.findAll({
                where: { UserId: req.session.userId },
                include: [
                    {
                        model: models.types,
                        attributes: ['TypeId', 'TypeName', 'Description']
                    },
                    {
                        model: models.professions,
                        through: {
                            attributes: ['required', 'approved', 'status']
                        },
                        include: [
                            {
                                model: models.responses,
                                include: [
                                    {
                                        model: models.masters,
                                        attributes: ['MasterId', 'Name', 'Rating', 'Description']
                                    }
                                ]
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            // Форматируем данные для фронтенда
            const formattedRequests = requests.map(request => ({
                requestId: request.RequestId,
                date: new Date(request.Date).toLocaleDateString('ru-RU'),
                location: request.Location,
                address: request.Address,
                status: request.Status,
                comments: request.Comments,
                type: {
                    id: request.type.TypeId,
                    name: request.type.TypeName,
                    description: request.type.Description
                },
                totalSpecialistsNeeded: request.ServiceCount,
                totalSpecialistsApproved: request.professions.reduce((sum, prof) => 
                    sum + (prof.RequestProfessions.approved || 0), 0
                ),
                professions: request.professions.map(prof => ({
                    id: prof.ProfessionId,
                    name: prof.ProfessionName,
                    needed: prof.RequestProfessions.required,
                    approved: prof.RequestProfessions.approved || 0,
                    status: prof.RequestProfessions.status,
                    responses: prof.responses.map(response => ({
                        responseId: response.ResponseId,
                        status: response.status,
                        masterName: response.master.Name,
                        masterDescription: response.master.Description || 'Описание отсутствует'
                    }))
                }))
            }));

            res.render('userRequests', {
                layout: 'main',
                requests: formattedRequests,
                helpers: {
                    formatDate: function(date) {
                        return new Date(date).toLocaleDateString('ru-RU');
                    },
                    getStatusText: function(status) {
                        const statusMap = {
                            'pending': 'На рассмотрении',
                            'in_progress': 'В процессе',
                            'completed': 'Завершена',
                            'cancelled': 'Отменена'
                        };
                        return statusMap[status] || status;
                    },
                    getProfessionStatusText: function(status) {
                        const statusMap = {
                            'pending': 'Ожидает специалистов',
                            'partially_approved': 'Частично укомплектована',
                            'completed': 'Укомплектована',
                            'cancelled': 'Отменена'
                        };
                        return statusMap[status] || status;
                    }
                }
            });
        } catch (error) {
            console.error('Ошибка при получении заявок:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при получении заявок',
                error: error.message
            });
        }
    }

    // Обработка отклика от специалиста
    async handleMasterResponse(req, res) {
        const transaction = await sequelize.transaction();
        try {
            const { requestId, masterId, professionId, status } = req.body;

            // Проверяем, не откликался ли уже мастер на эту заявку
            const existingResponse = await models.responses.findOne({
                where: {
                    RequestId: requestId,
                    MasterId: masterId,
                    ProfessionId: professionId
                }
            });

            if (existingResponse) {
                await transaction.rollback();
                return res.status(400).json({
                    success: false,
                    message: 'Вы уже откликнулись на эту заявку'
                });
            }

            // Создаем отклик
            const response = await models.responses.create({
                RequestId: requestId,
                MasterId: masterId,
                ProfessionId: professionId,
                Status: 'pending'
            }, { transaction });

            // Получаем информацию о заявке и мастере для уведомления
            const [request, master] = await Promise.all([
                models.requests.findByPk(requestId),
                models.masters.findByPk(masterId)
            ]);

            // Создаем уведомление для клиента
            await models.notifications.create({
                UserId: request.UserId,
                Type: 'application_status',
                Message: `Специалист откликнулся на вашу заявку`,
                Metadata: JSON.stringify({
                    requestId,
                    masterId,
                    responseId: response.ResponseId
                }),
                isRead: false
            }, { transaction });

            await transaction.commit();

            res.json({
                success: true,
                message: 'Отклик успешно создан'
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при создании отклика:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при создании отклика',
                error: error.message
            });
        }
    }

    // Подтверждение специалиста пользователем
    async approveSpecialist(req, res) {
        try {
            const { responseId } = req.body;
            
            // Получаем информацию об отклике
            const response = await models.responses.findOne({
                where: { ResponseId: responseId },
                include: [
                    {
                        model: models.requests,
                        where: { UserId: req.session.userId }
                    },
                    {
                        model: models.masters
                    }
                ]
            });

            if (!response) {
                return res.status(404).json({
                    success: false,
                    message: 'Отклик не найден или у вас нет прав для его подтверждения'
                });
            }

            // Обновляем статус отклика
            await response.update({ status: 'approved' });

            // Обновляем количество одобренных специалистов в заявке
            await models.requestProfession.increment('approved', {
                where: {
                    RequestId: response.RequestId,
                    ProfessionId: response.ProfessionId
                }
            });

            const request = await models.requests.findOne({
                where: { RequestId: response.RequestId },
                include: [
                    {
                        model: models.professions,
                        through: {
                            attributes: ['required', 'approved']
                        }
                    }
                ]
            });

            // Проверяем, все ли требуемые специалисты одобрены
            const allProfessionsComplete = request.Professions.every(prof => 
                prof.RequestProfessions.approved >= prof.RequestProfessions.required
            );

            // Проверяем, есть ли хотя бы один одобренный специалист
            const hasAnyApproved = request.Professions.some(prof => 
                prof.RequestProfessions.approved > 0
            );

            let newStatus = request.Status;
            if (allProfessionsComplete) {
                newStatus = 'completed';
            } else if (hasAnyApproved) {
                newStatus = 'in_progress';
            }

            if (newStatus !== request.Status) {
                await request.update({ Status: newStatus });

                // Создаем уведомление о изменении статуса
                await models.notifications.create({
                    UserId: request.UserId,
                    Type: newStatus === 'completed' ? 'request_completed' : 'request_progress',
                    Message: newStatus === 'completed' 
                        ? 'Все специалисты для вашей заявки подтверждены!' 
                        : 'Статус вашей заявки обновлен',
                    Metadata: JSON.stringify({ requestId: request.RequestId }),
                    isRead: false
                });
            }

            // Создаем уведомление для специалиста
            await models.notifications.create({
                MasterId: response.MasterId,
                Type: 'application_status',
                Message: 'Ваш отклик был одобрен',
                Metadata: JSON.stringify({
                    requestId: response.RequestId,
                    responseId
                }),
                isRead: false
            });

            res.json({
                success: true,
                message: 'Специалист успешно подтвержден'
            });

        } catch (error) {
            console.error('Ошибка при подтверждении специалиста:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при подтверждении специалиста',
                error: error.message
            });
        }
    }

    async respondToRequest(req, res) {
        try {
            const { requestId, professionId } = req.body;
            const masterId = req.session.masterId;

            if (!masterId) {
                return res.status(403).json({
                    success: false,
                    message: 'Только специалисты могут откликаться на заявки'
                });
            }

            // Проверяем существование заявки
            const request = await models.requests.findOne({
                where: {
                    RequestId: requestId,
                    Status: {
                        [Op.in]: ['pending', 'in_progress']
                    }
                },
                include: [
                    {
                        model: models.professions,
                        where: { ProfessionId: professionId },
                        through: {
                            attributes: ['required', 'approved', 'status'],
                            where: {
                                status: {
                                    [Op.in]: ['pending', 'partially_approved']
                                }
                            }
                        }
                    }
                ]
            });

            if (!request) {
                return res.status(404).json({
                    success: false,
                    message: 'Заявка не найдена или уже не принимает откликов'
                });
            }

            // Проверяем, не откликался ли уже специалист на эту заявку
            const existingResponse = await models.responses.findOne({
                where: {
                    RequestId: requestId,
                    MasterId: masterId,
                    ProfessionId: professionId
                }
            });

            if (existingResponse) {
                return res.status(400).json({
                    success: false,
                    message: 'Вы уже откликнулись на эту заявку'
                });
            }

            // Создаем отклик
            const response = await models.responses.create({
                RequestId: requestId,
                MasterId: masterId,
                ProfessionId: professionId,
                status: 'pending'
            });

            // Создаем уведомление для клиента
            await models.notifications.create({
                UserId: request.UserId,
                Type: 'application_status',
                Message: `Специалист откликнулся на вашу заявку`,
                Metadata: JSON.stringify({
                    requestId,
                    masterId,
                    responseId: response.ResponseId
                }),
                isRead: false
            });

            res.status(200).json({
                success: true,
                message: 'Отклик успешно создан'
            });

        } catch (error) {
            console.error('Ошибка при создании отклика:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при создании отклика',
                error: error.message
            });
        }
    }

    async getAvailableRequests(req, res) {
        try {
            const masterId = req.session.masterId;
            if (!masterId) {
                return res.status(403).json({ error: "Доступ запрещен" });
            }

            // Получаем информацию о мастере и его профессии
            const master = await models.masters.findOne({
                where: { MasterId: masterId },
                attributes: ['MasterId', 'Name', 'ProfessionId']
            });

            if (!master || !master.ProfessionId) {
                return res.status(404).json({ error: "Профессия специалиста не найдена" });
            }

            const requests = await models.requests.findAll({
                where: {
                    Status: {
                        [Op.in]: ['pending', 'in_progress']
                    }
                },
                include: [
                    {
                        model: models.types,
                        attributes: ['TypeId', 'TypeName']
                    },
                    {
                        model: models.users,
                        attributes: ['ID', 'Login', 'Email']
                    },
                    {
                        model: models.professions,
                        where: {
                            ProfessionId: master.ProfessionId
                        },
                        through: {
                            where: {
                                status: ['pending', 'partially_approved']
                            }
                        }
                    },
                    {
                        model: models.responses,
                        required: false,
                        where: {
                            MasterId: masterId
                        },
                        attributes: ['ResponseId', 'status']
                    }
                ]
            });

            console.log('Найденные заявки:', JSON.stringify(requests, null, 2));

            const formattedRequests = requests.map(request => ({
                requestId: request.RequestId,
                type: request.Type.TypeName,
                client: request.User.Login,
                clientEmail: request.User.Email,
                date: request.Date,
                location: request.Location || 'Место не указано',
                address: request.Address || 'Адрес не указан',
                professionId: master.ProfessionId,
                hasResponded: request.Responses && request.Responses.length > 0,
                responseStatus: request.Responses && request.Responses.length > 0 ? 
                    request.Responses[0].status : null
            }));

            res.render('layouts/availableRequests', {
                requests: formattedRequests,
                layout: false
            });
        } catch (error) {
            console.error('Ошибка при получении доступных заявок:', error);
            res.status(500).json({
                error: 'Ошибка при получении доступных заявок',
                details: error.message
            });
        }
    }

    async getRequestForm(req, res) {
        try {
            if (!req.session.userId) {
                req.session.returnUrl = req.originalUrl;
                return res.redirect('/auth/login');
            }

            // Получаем все типы мероприятий
            const types = await models.types.findAll({
                attributes: ['TypeId', 'TypeName', 'Description']
            });

            // Получаем все профессии
            const professions = await models.professions.findAll({
                attributes: ['ProfessionId', 'ProfessionName', 'Description']
            });

            // Получаем все критерии
            const criterias = await models.criterias.findAll({
                attributes: ['CriteriasId', 'Name', 'Description']
            });

            res.render('layouts/requestForm', {
                layout: false,
                types: types,
                professions: professions,
                criterias: criterias
            });
        } catch (error) {
            console.error('Ошибка при загрузке формы заявки:', error);
            res.status(500).json({
                error: 'Ошибка при загрузке формы заявки',
                details: error.message
            });
        }
    }

    async rejectSpecialist(req, res) {
        try {
            
            const { responseId } = req.body;
            
            // Получаем информацию об отклике
            const response = await models.responses.findOne({
                where: { ResponseId: responseId },
                include: [
                    {
                        model: models.requests,
                        where: { UserId: req.session.userId }
                    },
                    {
                        model: models.masters
                    }
                ]
            });

            if (!response) {
                return res.status(404).json({
                    success: false,
                    message: 'Отклик не найден или у вас нет прав для его отклонения'
                });
            }

            // Обновляем статус отклика
            await response.update({ status: 'rejected' });

            // Создаем уведомление для специалиста
            await models.notifications.create({
                MasterId: response.MasterId,
                Type: 'application_status',
                Message: 'Ваш отклик был отклонен',
                Metadata: JSON.stringify({
                    requestId: response.RequestId,
                    responseId
                }),
                isRead: false
            });


            res.json({
                success: true,
                message: 'Специалист успешно отклонен'
            });
        } catch (error) {
            console.error('Ошибка при отклонении специалиста:', error);
            res.status(500).json({
                success: false,
                message: 'Ошибка при отклонении специалиста',
                error: error.message
            });
        }
    }
}

module.exports = new RequestsController();