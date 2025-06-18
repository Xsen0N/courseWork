const { models } = require('../db/utils/db');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const today = new Date();
const twoHoursLater = new Date();
twoHoursLater.setHours(today.getHours() + 2);


async function sendMail(userEmail) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'kseni.zhyk.3@gmail.com',
            pass: 'payc vadv fyfx zuyj' // Рекомендуется использовать безопасные методы хранения паролей
        }
    });

    const mailOptions = {
        from: 'courseproject@gmail.com',
        to: userEmail,
        subject: 'Спасибо за отправку формы!',
        text: `Спасибо за ваш выбор! Вы успешно Записались на услугу!Специалист с вами свяжется  и оставит комментрий под вашей заявкой!`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Письмо отправлено');
    } catch (error) {
        console.error('Ошибка при отправке письма:', error);
        throw new Error('Не удалось отправить письмо');
    }
}


class EnrollmentController {
    constructor() {
        // Привязываем методы к контексту класса
        this.notifySpecialists = this.notifySpecialists.bind(this);
    }

    async addEnrollmentView(req, res) {
        try {
            const userId = req.session.userId;
            const master = req.session.masterId;
            const serviceId = req.query.serviceId;

            // Проверяем авторизацию
            if (!userId) {
                req.session.returnUrl = req.originalUrl;
                return res.redirect('/auth/login');
            }

            // Проверяем, не является ли пользователь мастером
            if (master) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { 
                    layout: "error.hbs", 
                    errorMessage: 'Вы мастер, нельзя записываться!' 
                });
            }

            // Проверяем наличие serviceId
            if (!serviceId) {
                return res.redirect('/services');
            }

            // Получаем данные об услуге со всеми связанными данными
            const servicesWithDetails = await models.services.findOne({
                where: { 
                    ServiceId: serviceId
                },
                include: [
                    {
                        model: models.types,
                        attributes: ['TypeName', 'TypeId'],
                        required: true
                    },
                    {
                        model: models.masters,
                        attributes: ['MasterId', 'Name', 'PriceForHour'],
                        required: true
                    }
                ]
            });

            // Проверяем наличие услуги
            if (!servicesWithDetails) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { 
                    layout: "error.hbs", 
                    errorMessage: 'Услуга не найдена' 
                });
            }

            // Проверяем статус услуги
            if (servicesWithDetails.Status !== 1) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { 
                    layout: "error.hbs", 
                    errorMessage: 'Услуга временно недоступна' 
                });
            }

            // Форматируем данные для отправки в представление
            const service = {
                ServiceId: servicesWithDetails.ServiceId,
                Name: servicesWithDetails.Name,
                Description: servicesWithDetails.Description,
                Location: servicesWithDetails.Location,
                TypeName: servicesWithDetails.Type.TypeName,
                TypeId: servicesWithDetails.Type.TypeId,
                Master: servicesWithDetails.Master.Name,
                MasterId: servicesWithDetails.Master.MasterId,
                PriceForHour: servicesWithDetails.Master.PriceForHour,
                Status: servicesWithDetails.Status
            };
            
            return res.render("./layouts/addEnrollment.hbs", { 
                layout: "addEnrollment.hbs", 
                services: service 
            });

        } catch (error) {
            console.error('Ошибка при получении данных услуги:', error);
            return res.render('./layouts/error.hbs', { 
                layout: "error.hbs", 
                errorMessage: 'Произошла ошибка при загрузке формы записи' 
            });
        }
    }

    async getPersonalOrderView(req, res) {
        try {
            const userId = req.session.userId;
            const master = req.session.masterId;
            
            // Проверяем пользователя
            const user = await models.users.findByPk(req.session.userId);
            if (!user) {
                return res.redirect('/auth/login');
            }
            
            if (master) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { 
                    layout: "error.hbs", 
                    errorMessage: 'У вас не может быть заявок!' 
                });
            }
            
            if (user.Role === 1) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { 
                    layout: "error.hbs", 
                    errorMessage: 'Эта страница для вас не доступна' 
                });
            }

            // 1. Получаем записи на услуги
            const enrollments = await models.enrollment.findAll({
                where: { UserId: userId },
                include: [{
                    model: models.services,
                    required: false,
                    include: [
                        { 
                            model: models.types,
                            required: false
                        },
                        { 
                            model: models.masters,
                            required: false
                        }
                    ]
                }],
                order: [['Date', 'DESC'], ['Time', 'DESC']]
            });

            const enrollmentsWithDetails = enrollments.map(enrollment => {
                const service = enrollment.Service || {};
                const type = service.Type || {};
                const master = service.Master || {};
                
                return {
                    EnrollmentId: enrollment.EnrollmentId,
                    ServiceName: service.Name || 'Услуга не найдена',
                    Name: type.TypeName || 'Тип не указан',
                    TypeId: type.TypeId,
                    MasterName: master.Name || 'Специалист не указан',
                    PriceForHour: master.PriceForHour || 0,
                    MasterId: master.MasterId,
                    Date: enrollment.Date,
                    Time: enrollment.Time,
                    Duration: enrollment.Duration,
                    Status: enrollment.Status,
                    Address: enrollment.Address,
                    Comments: enrollment.Comments
                };
            });

            // 2. Получаем заявки на поиск специалистов
            const requests = await models.requests.findAll({
                where: { UserId: userId },
                include: [
                    { 
                        model: models.types,
                        required: true,
                        attributes: ['TypeId', 'TypeName', 'Description']
                    },
                    {
                        model: models.professions,
                        required: false,
                        through: {
                            attributes: ['required', 'approved', 'status']
                        }
                    },
                    {
                        model: models.responses,
                        required: false,
                        include: [
                            {
                                model: models.masters,
                                attributes: ['MasterId', 'Name', 'Description']
                            }
                        ]
                    }
                ],
                order: [['Date', 'DESC']]
            });

            console.log('Загруженные заявки:', JSON.stringify(requests, null, 2));

            // 5. Форматируем данные заявок
            const requestsWithDetails = requests.map(request => {
                if (!request) return null;

                const professions = request.Professions || [];
                const type = request.Type || {};
                const responses = request.Responses || [];
                
                console.log('Тип заявки:', type);
                console.log('Профессии заявки:', professions);
                console.log('Отклики заявки:', responses);

                // Создаем мапу откликов по профессиям
                const responsesByProfession = {};
                responses.forEach(response => {
                    if (!responsesByProfession[response.ProfessionId]) {
                        responsesByProfession[response.ProfessionId] = [];
                    }
                    responsesByProfession[response.ProfessionId].push(response);
                });

                const formattedRequest = {
                    requestId: request.RequestId,
                    date: request.Date,
                    location: request.Location || 'Место не указано',
                    address: request.Address || 'Адрес не указан',
                    status: request.Status || 'pending',
                    type: type.TypeName || 'Тип не указан',
                    typeId: type.TypeId,
                    totalSpecialistsNeeded: professions.reduce((sum, prof) => {
                        const required = prof.RequestProfessions?.required || 0;
                        console.log(`Профессия ${prof.ProfessionName}: требуется ${required}`);
                        return sum + required;
                    }, 0),
                    totalSpecialistsApproved: professions.reduce((sum, prof) => {
                        const approved = prof.RequestProfessions?.approved || 0;
                        console.log(`Профессия ${prof.ProfessionName}: одобрено ${approved}`);
                        return sum + approved;
                    }, 0),
                    professions: professions.map(profession => {
                        if (!profession) return null;

                        const professionResponses = responsesByProfession[profession.ProfessionId] || [];
                        console.log(`Отклики для профессии ${profession.ProfessionName}:`, professionResponses);

                        return {
                            professionId: profession.ProfessionId,
                            name: profession.ProfessionName || 'Профессия не указана',
                            needed: profession.RequestProfessions?.required || 0,
                            approved: profession.RequestProfessions?.approved || 0,
                            masters: professionResponses.map(response => ({
                                responseId: response.ResponseId,
                                masterId: response.Master?.MasterId,
                                name: response.Master?.Name || 'Имя не указано',
                                description: response.Master?.Description || 'Описание отсутствует',
                                status: response.status || 'pending'
                            }))
                        };
                    }).filter(Boolean)
                };

                console.log('Отформатированная заявка:', JSON.stringify(formattedRequest, null, 2));
                return formattedRequest;
            }).filter(Boolean);

            // 6. Рендерим страницу
            return res.render("./layouts/personalOrder.hbs", { 
                layout: "personalOrder.hbs", 
                enrollments: enrollmentsWithDetails,
                requests: requestsWithDetails,
                helpers: {
                    formatDate: function(date) {
                        if (!date) return 'Дата не указана';
                        try {
                            const d = new Date(date);
                            return d.toLocaleDateString('ru-RU', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            });
                        } catch (error) {
                            console.error('Ошибка форматирования даты:', error);
                            return 'Дата не указана';
                        }
                    },
                    formatTime: function(time) {
                        if (!time || typeof time !== 'string') return 'Время не указано';
                        try {
                            const [hours, minutes] = time.split(':');
                            if (!hours || !minutes) return 'Время не указано';
                            return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
                        } catch (error) {
                            console.error('Ошибка форматирования времени:', error);
                            return 'Время не указано';
                        }
                    },
                    eq: function(v1, v2) {
                        return v1 === v2;
                    },
                    multiply: function(a, b) {
                        return (!isNaN(a) && !isNaN(b)) ? a * b : 0;
                    },
                    divide: function(a, b) {
                        if (!isNaN(a) && !isNaN(b) && b !== 0) {
                            return a / b;
                        }
                        return 0;
                    }
                }
            });

        } catch (error) {
            console.error('Ошибка при получении данных:', error);
            return res.status(500).render('./layouts/error.hbs', { 
                layout: "error.hbs", 
                errorMessage: 'Произошла ошибка при получении данных заявок' 
            });
        }
    }

    async addEnrollment(req, res) {
        try {
            const { ServiceId, Date, Time, Duration, Address } = req.body;
            const master = req.session.masterId;
            const user = await models.users.findByPk(req.session.userId)
            if (master) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Вы специалист необходиом зайти от обычного пользователя' });
            }
            if (user && user.Role == 1) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Вы не можете подать заявку на услугу' });
            }
            if (!user) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Вы не можете подать заявку на услугу' });
            }

            await models.enrollment.create({
                ServiceId: ServiceId,
                UserId: req.session.userId,
                Status: 0, // 0 -на рассмотрении, 1 - approve, 2 - отказ
                Date: Date,
                Time: Time,
                Duration: Duration,
                Address: Address
            });

            await sendMail(user.Email);

            res.status(201).send(res.redirect('/'));

        } catch (error) {
            console.error('Ошибка при отправке формы на услугу:', error);
            res.status(500).send('Произошла ошибка при отправки вашей заявкм');
        }
    }


    async cancelEnrollment(req, res) {
        const enrollmentId = req.params.id;
        const { status } = req.body;
        try {
            const enrollment = await models.enrollment.findByPk(enrollmentId);
            if (enrollment) {
                enrollment.Status = status;
                await enrollment.save();
                return res.json({ success: true });
            } else {
                return res.status(404).json({ success: false, message: 'Заявка не найдена' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Ошибка сервера' });
        }
    }

    async notifySpecialists(requestId) {
        try {
            // Получаем информацию о заявке
            const request = await models.requests.findOne({
                where: { RequestId: requestId },
                include: [
                    {
                        model: models.professions,
                        through: models.requestProfession
                    },
                    {
                        model: models.types,
                        required: true
                    }
                ]
            });

            if (!request) {
                console.error('Заявка не найдена:', requestId);
                return;
            }

            // Получаем ID профессий из заявки
            const professionIds = request.professions.map(p => p.ProfessionId);

            // Находим всех специалистов с нужными профессиями
            const specialists = await models.masters.findAll({
                include: [{
                    model: models.professions,
                    where: {
                        ProfessionId: {
                            [models.Sequelize.Op.in]: professionIds
                        }
                    }
                }]
            });

            // Создаем уведомления для каждого специалиста
            const notifications = specialists.map(specialist => ({
                MasterId: specialist.MasterId,
                Type: 'new_request',
                Message: `Новая заявка в категории "${request.type.TypeName}". Требуются: ${request.professions.map(p => p.ProfessionName).join(', ')}`,
                Metadata: JSON.stringify({
                    requestId: request.RequestId,
                    location: request.Location,
                    date: request.Date
                }),
                isRead: false
            }));

            // Массово создаем уведомления
            if (notifications.length > 0) {
                await models.notifications.bulkCreate(notifications);
                console.log(`Отправлено ${notifications.length} уведомлений специалистам`);
            }

        } catch (error) {
            console.error('Ошибка при отправке уведомлений специалистам:', error);
        }
    }

    async handleResponse(req, res) {
        const transaction = await models.sequelize.transaction();
        try {
            const { responseId, action } = req.params;
            const userId = req.session.userId;

            if (!userId) {
                await transaction.rollback();
                return res.status(403).json({ 
                    success: false, 
                    message: 'Необходима авторизация' 
                });
            }

            // Находим отклик со всеми связанными данными
            const response = await models.responses.findOne({
                where: { ResponseId: responseId },
                include: [
                    {
                        model: models.requests,
                        where: { UserId: userId },
                        include: [{
                            model: models.professions,
                            through: {
                                model: models.requestProfession,
                                where: {
                                    ProfessionId: models.Sequelize.col('responses.ProfessionId')
                                }
                            }
                        }]
                    },
                    {
                        model: models.masters,
                        attributes: ['MasterId', 'Name', 'Email']
                    }
                ],
                transaction
            });

            if (!response) {
                await transaction.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: 'Отклик не найден или у вас нет прав для его обработки' 
                });
            }

            // Проверяем текущий статус отклика
            if (response.status !== 'pending') {
                await transaction.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: 'Этот отклик уже был обработан' 
                });
            }

            // Обновляем статус отклика
            response.status = action === 'approve' ? 'approved' : 'rejected';
            await response.save({ transaction });

            if (action === 'approve') {
                // Получаем связь request-profession
                const requestProfession = await models.requestProfession.findOne({
                    where: { 
                        RequestId: response.request.RequestId, 
                        ProfessionId: response.ProfessionId 
                    },
                    transaction
                });

                if (requestProfession) {
                    // Увеличиваем количество одобренных специалистов
                    requestProfession.approved = (requestProfession.approved || 0) + 1;
                    
                    // Проверяем, достигнуто ли необходимое количество специалистов
                    if (requestProfession.approved >= requestProfession.required) {
                        requestProfession.status = 'completed';
                        
                        // Отклоняем все остальные отклики для этой профессии
                        await models.responses.update(
                            { status: 'rejected' },
                            {
                                where: {
                                    RequestId: response.request.RequestId,
                                    ProfessionId: response.ProfessionId,
                                    ResponseId: { [Op.ne]: responseId },
                                    status: 'pending'
                                },
                                transaction
                            }
                        );

                        // Создаем уведомления для отклоненных специалистов
                        const rejectedResponses = await models.responses.findAll({
                            where: {
                                RequestId: response.request.RequestId,
                                ProfessionId: response.ProfessionId,
                                ResponseId: { [Op.ne]: responseId },
                                status: 'rejected'
                            },
                            include: [{
                                model: models.masters,
                                attributes: ['MasterId']
                            }],
                            transaction
                        });

                        for (const rejectedResponse of rejectedResponses) {
                            await models.notifications.create({
                                MasterId: rejectedResponse.master.MasterId,
                                Type: 'response_rejected',
                                Message: 'Ваш отклик был отклонен, так как набрано необходимое количество специалистов',
                                Metadata: JSON.stringify({
                                    requestId: response.request.RequestId,
                                    responseId: rejectedResponse.ResponseId
                                }),
                                isRead: false
                            }, { transaction });
                        }
                    } else {
                        requestProfession.status = 'partially_approved';
                    }
                    
                    await requestProfession.save({ transaction });

                    // Проверяем, все ли профессии укомплектованы
                    const pendingProfessions = await models.requestProfession.count({
                        where: {
                            RequestId: response.request.RequestId,
                            status: { [Op.not]: 'completed' }
                        },
                        transaction
                    });

                    // Если все профессии укомплектованы, меняем статус заявки на completed
                    if (pendingProfessions === 0) {
                        await models.requests.update(
                            { Status: 'completed' },
                            { 
                                where: { RequestId: response.request.RequestId },
                                transaction 
                            }
                        );

                        // Создаем уведомление для клиента о завершении подбора специалистов
                        await models.notifications.create({
                            UserId: userId,
                            Type: 'request_completed',
                            Message: 'Подбор специалистов для вашей заявки завершен',
                            Metadata: JSON.stringify({
                                requestId: response.request.RequestId
                            }),
                            isRead: false
                        }, { transaction });
                    }
                }
            }

            // Создаем уведомление для специалиста
            await models.notifications.create({
                MasterId: response.master.MasterId,
                Type: 'response_' + action,
                Message: action === 'approve' 
                    ? 'Ваш отклик был одобрен клиентом' 
                    : 'Ваш отклик был отклонен клиентом',
                Metadata: JSON.stringify({
                    requestId: response.request.RequestId,
                    responseId: response.ResponseId
                }),
                isRead: false
            }, { transaction });

            await transaction.commit();
            
            return res.json({ 
                success: true, 
                message: action === 'approve' 
                    ? 'Специалист успешно подтвержден' 
                    : 'Специалист отклонен' 
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при обработке отклика:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Произошла ошибка при обработке отклика' 
            });
        }
    }

}

module.exports = new EnrollmentController();