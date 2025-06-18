const { raw } = require('body-parser');
const { models } = require('../db/utils/db');
const { Op, where } = require('sequelize');

class ProfileController {
    async getPage(req, res) {
        try {
            const master = await models.masters.findByPk(req.session.masterId, { raw: true });
            if (!master) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Мастер не найден! Вы точно мастер?' });
            }
            if (master && master.Photo) {
                master.Photo = master.Photo.toString('base64');
                master.PhotoType = 'image/jpeg';
            }
            res.render("./layouts/profile.hbs", { layout: "profile.hbs", master: master });
        } catch (error) {
            console.error('Ошибка при проверке входе на профиль:', error);
            res.status(500).send('Произошла ошибка при проверке роли администратора');
        }
    }

    async uploadPhoto(req, res) {
        try {
            const master = await models.masters.findByPk(req.session.masterId);

            if (!master) {
                return res.status(404).send('Мастер не найден');
            }

            master.Photo = req.file.buffer;
            await master.save();

            res.redirect('/profile');
        } catch (error) {
            console.error('Ошибка при загрузке фотографии:', error);
            res.status(500).send('Произошла ошибка при загрузке фотографии');
        }
    }

    async uploadPhotoForGallery(req, res) {
        try {
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.masters.findByPk(req.session.masterId);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            if (!req.file) {
                return res.status(400).send('Файл не загружен');
            }
            const photoBuffer = req.file.buffer;
            await models.gallery.create({
                Photo: photoBuffer,
                MasterId: master.MasterId
            });

            res.json({ success: true });
        } catch (error) {
            console.error('Ошибка при загрузке фотографии:', error);
            res.status(500).json({ success: false, message: 'Ошибка при загрузке фотографии' });
        }
    }


    async editProfile(req, res) {
        try {
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const { name, description, price } = req.body;
            const master = await models.masters.findByPk(req.session.masterId);

            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            if(description.length > 100){
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Много написал' });
            }

            await models.masters.update({
                Name: name,
                Description: description,
                PriceForHour: price
            },
                {
                    where: { MasterId: req.session.masterId }
                }
            );

            res.redirect('/profile');
        } catch (error) {
            console.error('Ошибка при редактировании профиля:', error);
            res.status(500).send('Произошла ошибка при редактировании профиля');
        }
    }

    async getServicesPage(req, res) {
        try {
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
    
            const master = await models.masters.findByPk(req.session.masterId);
            if (!master) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Мастер не найден' });
            }
    
            const servicesDetailes = await models.services.findAll({
                include: [
                    {
                        model: models.masters,
                        attributes: ['Name'],
                        required: true
                    },
                    {
                        model: models.types,
                        attributes: ['TypeName']
                    },
                    {
                        model: models.criterias,
                        attributes: ['Name'],
                        through: { attributes: [] } // Исключаем промежуточную таблицу
                    }
                ],
                where: {
                    MasterId: req.session.masterId
                },
                raw: true  // Используем raw: true
            });

            console.log(servicesDetailes)
    
            // Форматируем данные для шаблона
            const services = servicesDetailes.map(courseDetail => ({
                ServiceId: courseDetail.ServiceId,
                Name: courseDetail.Name,
                Description: courseDetail.Description,
                Location: courseDetail.Location,
                Status: courseDetail.Status,
                Master: courseDetail['Master.Name'],
                TypeName: courseDetail['Type.TypeName'], 
                Criterias: servicesDetailes
                    .filter(service => service.ServiceId === courseDetail.ServiceId) 
                    .map(service => service['Criterias.Name']) 
                    .filter(Boolean) 
            }));

            console.log(services)
    
            const uniqueServices = services.filter((service, index, self) =>
                index === self.findIndex(s => s.ServiceId === service.ServiceId)
            );
    
            const criterias = await models.criterias.findAll({ raw: true });
            const types = await models.types.findAll({ raw: true });
    
            res.render("./layouts/profileServices.hbs", {
                layout: "profileServices.hbs",
                services: uniqueServices,
                types: types,
                criterias: criterias
            });
        } catch (error) {
            console.error('Ошибка при открытии страницы с классами:', error);
            res.status(500).send('Произошла ошибка при открытии страницы с классами');
        }
    }

    async addService(req, res) {
        try {
            const { name, type, description, location, otherLocation, criteriaIds } = req.body;
    
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            if (description.length > 100) {
                req.session.previousUrl = req.headers.referer;
                return res.status(400).render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Много написал' });
            }
            const master = await models.masters.findByPk(req.session.masterId);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
    
            const newService = await models.services.create({
                Name: name,
                TypeId: type,
                Description: description,
                Location: location || otherLocation,
                MasterId: req.session.masterId,
                Status: 3
            });
    
            if (criteriaIds && criteriaIds.length > 0) {
                await newService.addCriterias(criteriaIds); // Используем метод addCriterias для связи
            }
    
            res.redirect('/profile/services');
        } catch (error) {
            console.error('Ошибка при добавлении услуги:', error);
            res.status(500).send('Произошла ошибка при добавлении услуги');
        }
    }

    async editService(req, res) {
        try {
            const { serviceId, name, type, description, location, criteriaIds } = req.body;
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
    
            if (description.length > 100) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Много написал' });
            }

            const master = await models.masters.findByPk(req.session.masterId);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
    
            await models.services.update(
                {
                    Name: name,
                    TypeId: type,
                    Description: description,
                    Location: location
                },
                {
                    where: {
                        MasterId: req.session.masterId,
                        ServiceId: serviceId
                    }
                }
            );

            const service = await models.services.findByPk(serviceId, {
                include: [models.criterias]
            });
    
            if (service) {
                await service.setCriterias([]);
                if (criteriaIds && criteriaIds.length > 0) {
                    await service.addCriterias(criteriaIds);
                }
            }
    
            res.redirect('/profile/services');
        } catch (error) {
            console.error('Ошибка при редактировании услуги:', error);
            res.status(500).send('Произошла ошибка при редактировании услуги');
        }
    }

    async getService(req, res) {
        try {
            const serviceId = req.params.serviceId;
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.masters.findByPk(req.session.masterId);

            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            const serviseData = await models.services.findByPk(serviceId, { raw: true });
            if (!serviseData) {
                return res.status(404).send('Услуга не найдена');
            }
            res.json(serviseData);
        } catch (error) {
            res.status(500).send('Ошибка при получении данных услуги');
        }
    }

    async deleteService(req, res) {
        const { id } = req.params;
        try {
            const serviseInstance = await models.services.findByPk(id);
            if (!serviseInstance) {
                return res.status(404).send('Класс не найден');
            }
            await serviseInstance.destroy();
            res.send('Класс успешно удален');
        } catch (error) {
            console.error('Ошибка при удалении услуги:', error);
            res.status(500).send('Произошла ошибка при удалении услуги');
        }
    }
    async deleteGallery(req, res) {
        try {
            const galleryId = req.params.galleryId;
            const masterId = req.session.masterId;

            if (!masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.masters.findByPk(masterId);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }

            const photo = await models.gallery.findOne({
                where: {
                    GalleryId: galleryId,
                    MasterId: master.MasterId
                }
            });

            if (!photo) {
                return res.status(404).send('Фотография не найдена');
            }

            await photo.destroy();
            res.json({ success: true });
        } catch (error) {
            console.error('Ошибка при удалении фотографии:', error);
            res.status(500).json({ success: false, message: 'Ошибка при удалении фотографии' });
        }
    }

    async getGallery(req, res) {
        try {
            const serviseId = req.params.serviseId;
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.masters.findByPk(req.session.masterId);

            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            const gallery = await models.gallery.findAll({ where: { MasterId: master.MasterId }, raw: true })

            for (let photo of gallery) {
                if (photo && photo.Photo) {
                    photo.Photo = photo.Photo.toString('base64');
                    photo.PhotoType = 'image/jpeg'; // или 'image/png', если нужно
                }
            }
            res.render("./layouts/gallery.hbs", { layout: "gallery.hbs", gallery: gallery });
        } catch (error) {
            console.error('Ошибка при получении данных коллекции фото:', error);
            res.status(500).send('Ошибка при получении данных коллекции фото');
        }
    }

    async getOrderPage(req, res) {
        try {
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.masters.findByPk(req.session.masterId);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            const enrollments = await models.enrollment.findAll({
                where: {
                    Status: [0, 2, 1], // Проверка на status 0 или 1
                },
                include: [
                    {
                        model: models.services,
                        attributes: ["ServiceId", "Name", "MasterId"],
                        where: {
                            MasterId: req.session.masterId,
                        },
                        include: [
                            {
                                model: models.types,
                                attributes: ["TypeName", "TypeId"], // Атрибуты из Types
                            },
                            {
                                model: models.masters,
                                attributes: ["MasterId", "Name"], // Атрибуты из Masters
                            },
                        ],
                    },
                ],
                raw: true,
            });
            
            const enrollmentsWithDetails = enrollments.map(enrollment => {
                return {
                    EnrollmentId: enrollment.EnrollmentId,
                    ServiceName: enrollment['Service.Name'],
                    Name: enrollment['Service.Type.TypeName'],
                    TypeId: enrollment['Service.Type.TypeId'],
                    MasterName: enrollment['Service.Master.Name'],
                    MasterId: enrollment['Service.Master.MasterId'],
                    Date: enrollment.Date,
                    Time: enrollment.Time,
                    Duration: enrollment.Duration,
                    Status: enrollment.Status,
                    Address: enrollment.Address
                };
            });

            return res.render("./layouts/masterOrder.hbs", { layout: "masterOrder.hbs", enrollments: enrollmentsWithDetails });

        } catch (error) {
            console.error('Ошибка при открытии страницы с услугами:', error);
            res.status(500).send('Произошла ошибка при открытии страницы с услугами');
        }

    }

    async editOrder(req, res) { 
        const { enrollmentId, actionType, comment } = req.body;
        let startDate;
        try {
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.masters.findByPk(req.session.masterId);
            const enrl = await models.enrollment.findByPk(enrollmentId);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            if (!enrl.Date || !enrl.Time) {
                throw new Error("Дата или время не указаны");
            }

            // Получаем дату и время из записи
            const datePart = enrl.Date;
            const timePart = enrl.Time;

            // Преобразуем время в строку, если оно не строка
            const timeStr = typeof timePart === 'string' ? timePart : 
                          (timePart instanceof Date ? 
                            `${timePart.getHours().toString().padStart(2, '0')}:${timePart.getMinutes().toString().padStart(2, '0')}` : 
                            '00:00');

            const [hours, minutes] = timeStr.split(':');
            
            // Создаем дату в локальном часовом поясе
            startDate = new Date(datePart);
            startDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);

            if (isNaN(startDate)) {
                console.error('Debug - Date:', datePart);
                console.error('Debug - Time:', timeStr);
                throw new Error("Некорректная дата или время");
            }

            // Создаем дату окончания, добавляя часы вместо минут
            const durationInHours = enrl.Duration;
            const endDate = new Date(startDate.getTime() + (durationInHours * 60 * 60 * 1000));

            // Для отладки
            console.log("StartDate:", startDate.toISOString());
            console.log("EndDate:", endDate.toISOString());

            if (actionType === 'reject') {
                await models.enrollment.update(
                    { Status: 2, Comments: comment }, 
                    { where: { EnrollmentId: enrollmentId } }
                );
            } else if (actionType === 'approve') {
                await models.enrollment.update(
                    { Status: 1, Comments: comment },
                    { where: { EnrollmentId: enrollmentId } }
                );

                await models.events.create({
                    MasterId: req.session.masterId,
                    StartDate: startDate,
                    EndDate: endDate,
                    Status: 1
                });
            }  
            res.status(200).send('Успешно обновлено');
        } catch (error) {
            console.error('Ошибка при обновлении расписания:', error);
            res.status(500).send('Произошла ошибка при обновлении расписания');
        }
    }

    async getShedulePage(req, res) {
        try {
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            
            const master = await models.masters.findByPk(req.session.masterId);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
    
            // Получаем события мастера
            const events = await models.events.findAll({
                where: { MasterId: req.session.masterId },
                raw: false
            });
    
            // Получаем все подтвержденные записи мастера
            const enrollments = await models.enrollment.findAll({
                include: [
                    {
                        model: models.services,
                        where: { MasterId: req.session.masterId },
                        attributes: ["Name", "Description"]
                    },
                    {
                        model: models.users,
                        attributes: ["Login", "Email"]
                    }
                ],
                where: { Status: 1 }, // Только подтвержденные записи
                raw: false
            });

            // Сопоставляем события и записи по дате/времени
            const formattedEvents = events.map(event => {
                // Находим соответствующую запись
                const matchingEnrollment = enrollments.find(enrl => {
                    const enrollmentDateTime = new Date(enrl.Date + 'T' + enrl.Time);
                    const enrollmentEndTime = new Date(enrollmentDateTime.getTime() + enrl.Duration * 60 * 60 * 1000);
                    
                    return event.StartDate.getTime() === enrollmentDateTime.getTime() &&
                           event.EndDate.getTime() === enrollmentEndTime.getTime();
                });

                // Форматируем даты
                const startDate = event.StartDate instanceof Date ? event.StartDate : new Date(event.StartDate);
                const endDate = event.EndDate instanceof Date ? event.EndDate : new Date(event.EndDate);

                // Для отладки
                console.log('Event:', {
                    EventId: event.EventId,
                    StartDate: startDate,
                    EndDate: endDate,
                    MatchingEnrollment: matchingEnrollment ? {
                        EnrollmentId: matchingEnrollment.EnrollmentId,
                        Date: matchingEnrollment.Date,
                        Time: matchingEnrollment.Time,
                        Duration: matchingEnrollment.Duration
                    } : null
                });

                return {
                    EventId: event.EventId,
                    StartDate: startDate.toISOString(),
                    EndDate: endDate.toISOString(),
                    Service: matchingEnrollment?.service ? {
                        Name: matchingEnrollment.service.Name,
                        Description: matchingEnrollment.service.Description
                    } : null,
                    User: matchingEnrollment?.user ? {
                        Login: matchingEnrollment.user.Login,
                        Email: matchingEnrollment.user.Email
                    } : null,
                    Enrollment: matchingEnrollment ? {
                        Comments: matchingEnrollment.Comments,
                        Address: matchingEnrollment.Address
                    } : null
                };
            });

            // Для отладки
            console.log('Formatted Events:', JSON.stringify(formattedEvents, null, 2));
    
            res.render("./layouts/profileShedules.hbs", {
                layout: "profileShedules.hbs",
                shedulesDetailes: formattedEvents,
                masterName: master.Name
            });
        } catch (error) {
            console.error('Ошибка при открытии страницы расписания:', error);
            res.status(500).send('Произошла ошибка при открытии страницы расписания');
        }
    }

    async addCriteria(req, res) {
        try {
            const { criteriaName } = req.body;

            if (!criteriaName) {
                return res.status(400).json({ error: 'Название критерия обязательно' });
            }

            const newCriteria = await models.criterias.create({
                Name: criteriaName 
            });
            res.status(201).json(newCriteria);
        } catch (error) {
            console.error('Ошибка при добавлении критерия:', error);
            res.status(500).json({ error: 'Произошла ошибка при добавлении критерия' });
        }
    }

    async resubmitService(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // 1. Валидация входных параметров
            if (isNaN(status) || !Number.isInteger(status)) {
                return res.status(400).json({ error: 'Неверный формат статуса' });
            }

            // 2. Поиск услуги
            const service = await models.services.findByPk(id);
            if (!service) {
                return res.status(404).json({ error: 'Услуга не найдена' });
            }

            // 3. Проверка переходов статусов
            const allowedTransitions = {
                3: [0], // Черновик -> На рассмотрении
                0: [1, 2], // На рассмотрении -> Одобрено/Отклонено
                1: [], // Одобрено - финальный статус
                2: [0] // Отклонено -> На рассмотрении
            };

            const currentStatus = service.Status;
            
            // Проверка существующего статуса
            if (!(currentStatus in allowedTransitions)) {
                return res.status(400).json({ error: 'Недопустимый текущий статус' });
            }

            // Проверка допустимости перехода
            if (!allowedTransitions[currentStatus].includes(status)) {
                return res.status(400).json({ 
                    error: `Запрещен переход из статуса ${currentStatus} в ${status}`
                });
            }

            const [updated] = await models.services.update(
                { Status: status },
                { 
                    where: { ServiceId: id },
                    returning: true 
                }
            );

            if (!updated) {
                return res.status(500).json({ error: 'Не удалось обновить статус' });
            }

            // 5. Успешный ответ
            return res.json({ 
                message: 'Статус обновлен',
                newStatus: status,
                serviceId: id
            });

        } catch (error) {
            console.error(`Ошибка обновления статуса: ${error.message}`);
            return res.status(500).json({ 
                error: 'Внутренняя ошибка сервера',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    async getSpecialistRequestsPage(req, res) {
        try {
            const masterId = req.session.masterId;
            
            if (!masterId) {
                return res.status(403).render('./layouts/error.hbs', { 
                    layout: "error.hbs", 
                    errorMessage: 'Доступ запрещен' 
                });
            }

            // Получаем информацию о специалисте с его профессиями
            const master = await models.masters.findOne({
                where: { MasterId: masterId },
                include: [
                    {
                        model: models.professions,
                        attributes: ['ProfessionId', 'ProfessionName'],
                        through: { attributes: [] }
                    },
                    {
                        model: models.services,
                        attributes: ['ServiceId', 'TypeId'],
                        include: [{
                            model: models.types,
                            attributes: ['TypeId', 'TypeName']
                        }]
                    }
                ]
            });

            if (!master) {
                return res.status(404).render('./layouts/error.hbs', { 
                    layout: "error.hbs", 
                    errorMessage: 'Специалист не найден' 
                });
            }

            // Получаем ID профессий специалиста
            const masterProfessionIds = master.professions.map(p => p.ProfessionId);
            
            // Получаем уникальные TypeId из услуг специалиста
            const masterTypeIds = [...new Set(master.services.map(service => service.TypeId))];

            // Получаем заявки, соответствующие типам услуг и профессиям специалиста
            const requests = await models.requests.findAll({
                where: {
                    TypeId: { [Op.in]: masterTypeIds },
                    Status: { [Op.in]: ['pending', 'in_progress'] }
                },
                include: [
                    { 
                        model: models.types,
                        required: true,
                        attributes: ['TypeId', 'TypeName']
                    },
                    {
                        model: models.professions,
                        required: true,
                        attributes: ['ProfessionId', 'ProfessionName'],
                        through: {
                            model: models.requestProfession,
                            where: {
                                ProfessionId: { [Op.in]: masterProfessionIds },
                                // Проверяем, что еще требуются специалисты
                                [Op.or]: [
                                    { status: 'pending' },
                                    {
                                        status: 'partially_approved',
                                        approved: {
                                            [Op.lt]: models.Sequelize.col('required')
                                        }
                                    }
                                ]
                            },
                            attributes: ['required', 'approved', 'status']
                        }
                    },
                    {
                        model: models.users,
                        attributes: ['UserId', 'Name', 'Email']
                    },
                    {
                        model: models.responses,
                        required: false,
                        where: {
                            MasterId: masterId
                        },
                        attributes: ['ResponseId', 'status']
                    }
                ],
                order: [['Date', 'DESC']]
            });

            // Форматируем данные для отображения
            const requestsWithDetails = requests.map(request => {
                const professions = request.professions || [];
                const hasResponded = request.responses && request.responses.length > 0;
                
                return {
                    requestId: request.RequestId,
                    date: request.Date,
                    location: request.Location || 'Место не указано',
                    address: request.Address || 'Адрес не указан',
                    status: request.Status,
                    type: request.type.TypeName,
                    typeId: request.type.TypeId,
                    clientName: request.user.Name,
                    clientEmail: request.user.Email,
                    hasResponded: hasResponded,
                    responseStatus: hasResponded ? request.responses[0].status : null,
                    professions: professions.map(profession => ({
                        professionId: profession.ProfessionId,
                        name: profession.ProfessionName,
                        needed: profession.RequestProfession.required || 0,
                        approved: profession.RequestProfession.approved || 0,
                        status: profession.RequestProfession.status || 'pending'
                    }))
                };
            });

            // Рендерим страницу
            return res.render("./layouts/specialistRequests.hbs", { 
                layout: "specialistRequests.hbs", 
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
                            return 'Дата не указана';
                        }
                    },
                    eq: function(v1, v2) {
                        return v1 === v2;
                    }
                }
            });

        } catch (error) {
            console.error('Ошибка при получении заявок:', error);
            return res.status(500).render('./layouts/error.hbs', { 
                layout: "error.hbs", 
                errorMessage: 'Произошла ошибка при получении заявок' 
            });
        }
    }

    async respondToRequest(req, res) {
        const transaction = await models.sequelize.transaction();
        try {
            const { requestId, professionId } = req.body;
            const masterId = req.session.masterId;

            if (!masterId) {
                await transaction.rollback();
                return res.status(403).json({ 
                    success: false, 
                    message: 'Доступ запрещен' 
                });
            }

            // Проверяем, не откликался ли уже специалист на эту заявку
            const existingResponse = await models.responses.findOne({
                where: {
                    RequestId: requestId,
                    MasterId: masterId,
                    ProfessionId: professionId
                },
                transaction
            });

            if (existingResponse) {
                await transaction.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: 'Вы уже откликнулись на эту заявку' 
                });
            }

            // Проверяем существование заявки и профессии
            const request = await models.requests.findOne({
                where: { RequestId: requestId },
                include: [{
                    model: models.professions,
                    through: {
                        model: models.requestProfession,
                        where: { 
                            ProfessionId: professionId,
                            [Op.or]: [
                                { status: 'pending' },
                                {
                                    status: 'partially_approved',
                                    approved: {
                                        [Op.lt]: models.Sequelize.col('required')
                                    }
                                }
                            ]
                        }
                    }
                }],
                transaction
            });

            if (!request) {
                await transaction.rollback();
                return res.status(404).json({ 
                    success: false, 
                    message: 'Заявка не найдена или уже не принимает откликов' 
                });
            }

            // Создаем отклик
            const response = await models.responses.create({
                RequestId: requestId,
                MasterId: masterId,
                ProfessionId: professionId,
                status: 'pending'
            }, { transaction });

            // Обновляем статус заявки на in_progress
            await request.update({ 
                Status: 'in_progress' 
            }, { transaction });

            // Создаем уведомление для клиента
            await models.notifications.create({
                UserId: request.UserId,
                Type: 'new_response',
                Message: `Новый отклик на вашу заявку от специалиста`,
                Metadata: JSON.stringify({
                    requestId,
                    responseId: response.ResponseId,
                    masterId
                }),
                isRead: false
            }, { transaction });

            await transaction.commit();

            return res.json({ 
                success: true, 
                message: 'Отклик успешно создан' 
            });

        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка при создании отклика:', error);
            return res.status(500).json({ 
                success: false, 
                message: 'Произошла ошибка при создании отклика' 
            });
        }
    }
}

module.exports = new ProfileController();
