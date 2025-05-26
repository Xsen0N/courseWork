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
        try {
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.masters.findByPk(req.session.masterId);
            const enrl = await models.menrollmentasters.findByPk(enrollmentId);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            const startDate = new Date(`${enrl.Date}T${enrl.Time}`);
            const endDate = new Date(startDate.getTime() + enrl.Duration * 60000);
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

            // await models.scheduler.create({
            //     EnrollmentId: enrollmentId,
            //     ApprovedTime: new Date()
            // });

            await models.events.create({
                MasterId: req.session.masterId,
                StartDate: startDate,
                EndDate: endDate,
                Status: 0
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
            const events = await models.events.findAll({where :{
                MasterId:req.session.masterId
            }, raw: true});
            // const shedulesDetailes = await models.scheduler.findAll({
            //     include: [
            //         {
            //             model: models.enrollment,
            //             where: {
            //                 Status: 1 
            //             },
            //             include: [
            //                 {
            //                     model: models.services,
            //                     attributes: ["MasterId", "Name"],
            //                     where:{
            //                         MasterId:req.session.masterId
            //                     }
            //                 }, {
            //                     model: models.users,
            //                     attributes:["ID", "Login", "Email"]
            //                 }
            //             ],
            //         }
            //     ],
            //     raw: true
            // });
            // const schedules = shedulesDetailes.map(scheduleDetail => ({
            //     ServiceId: scheduleDetail['Enrollment.Service.ServiceId'], // ID услуги
            //     Name: scheduleDetail['Enrollment.Service.Name'], // Название услуги
            //     ApprovedTime: scheduleDetail.ApprovedTime, // Время утверждения
            //     MasterId: scheduleDetail['Enrollment.Service.MasterId'], // ID мастера
            //     User: {
            //         ID: scheduleDetail['Enrollment.User.ID'], // ID пользователя
            //         Login: scheduleDetail['Enrollment.User.Login'], // Логин пользователя
            //         Email: scheduleDetail['Enrollment.User.Email'], // Email пользователя
            //     },
            //     Enrollment: {
            //         EnrollmentId: scheduleDetail['Enrollment.EnrollmentId'], // ID записи
            //         Status: scheduleDetail['Enrollment.Status'], // Статус записи
            //         Date: scheduleDetail['Enrollment.Date'], // Дата услуги
            //         Time: scheduleDetail['Enrollment.Time'], // Время услуги
            //         Duration: scheduleDetail['Enrollment.Duration'], // Длительность услуги
            //         Comments: scheduleDetail['Enrollment.Comments'], // Комментарии
            //         Address: scheduleDetail['Enrollment.Address']
            //     }
            // }));
            res.render("./layouts/profileShedules.hbs", { layout: "profileShedules.hbs", shedulesDetailes: events });
        } catch (error) {
            console.error('Ошибка при открытии страницы с классами:', error);
            res.status(500).send('Произошла ошибка при открытии страницы с классами');
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
}

module.exports = new ProfileController();
