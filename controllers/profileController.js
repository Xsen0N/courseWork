const { raw } = require('body-parser');
const { models } = require('../db/utils/db');
const { Op } = require('sequelize');

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

    async getSchedulePage(req, res) {
        try {
            const masterId = req.session.masterId;
            const master = await models.masters.findByPk(masterId, { raw: true });
            if (!master) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Мастер не найден' });
            }
            const services  = await models.services.findAll({
                where: { MasterId: masterId },
                raw: true
            });

            const serviceIds = services .map(cls => cls.ServiceId);
            const schedules = await models.scheduler.findAll({
                where: { ServiceId: serviceIds },
                raw: true
            });
            const schedulesWithServiceNames = schedules.map(schedule => {
                const cls = services .find(c => c.ServiceId === schedule.ServiceId);
                return {
                    ...schedule,
                    ServiceName: cls ? cls.Name : 'Неизвестный класс'
                };
            });

            res.render("./layouts/masterSchedule.hbs", {
                layout: "masterSchedule.hbs",
                schedules: schedulesWithServiceNames,
                services : services 
            });
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
            const { name, description } = req.body;
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
                Description: description
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
                return res.status(404).send('Мастер не найден');
            }
            const servicesDetailes = await models.services.findAll({

                include: [
                    {
                        model: models.masters,
                        attributes: ['Name'], // Указываем, что нам нужно только имя преподавателя
                        required: true // Если преподаватель не указан, классы без преподавателя не будут возвращены
                    },
                    {
                        model: models.types,
                        attributes: ['TypeName'] // Указываем, что нам нужно только название типа
                    }
                ],
                where: {
                    MasterId: req.session.masterId // Добавляем условие на MasterId
                },
                raw: true
            });
            const services  = servicesDetailes.map(courseDetail => ({
                ServiceId: courseDetail.ServiceId,
                Name: courseDetail.Name,
                Description: courseDetail.Description,
                Master: courseDetail['Master.Name'],
                TypeName: courseDetail['Type.TypeName'],
                Location: courseDetail.Location
            }));
            const types = await models.types.findAll({ raw: true })
            res.render("./layouts/profileServices.hbs", { layout: "profileServices.hbs", services : services , types: types });
        } catch (error) {
            console.error('Ошибка при открытии страницы с классами:', error);
            res.status(500).send('Произошла ошибка при открытии страницы с классами');
        }

    }

    async addService(req, res) {
        try {
            const { name, type, description, location, otherLocation } = req.body;
            console.log(req.body);
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.masters.findByPk(req.session.masterId);
            if(description.length > 100){
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Много написал' });
            }
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }

            await models.services.create({
                Name: name,
                TypeId: type,
                Description: description,
                Location: location || otherLocation,
                MasterId: req.session.masterId
            });
            res.redirect('/profile/services');
        }
        catch (error) {
            console.error('Ошибка при добавлении услуги:', error);
            res.status(500).send('Произошла ошибка при добавлении услугм');
        }
    }

    async editService(req, res) {
        try {
            const { serviceId, name, type, description } = req.body; // Изменено на соответствующие имена полей

            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.masters.findByPk(req.session.masterId);
            if(description.length > 100){
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Много написал' });
            }

            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            console.log('id ' + serviceId + 'n' + name)
            await models.services.update({
                Name: name,
                TypeId: type,
                Description: description

            },
                {
                    where: {
                        MasterId: req.session.masterId,
                        ServiceId: serviceId
                    }
                },
                { raw: true }
            );
            res.redirect('/profile/services');
        }
        catch (error) {
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
            console.error('Ошибка при удалении класса:', error);
            res.status(500).send('Произошла ошибка при удалении класса');
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


    async addSchedule(req, res) {
        try {
            const { ClassId, DateClass, TotalSpots, AvailableSpots } = req.body;

            const selectedClass = await models.services.findOne({
                where: {
                    ClassId: ClassId,
                    MasterId: req.session.masterId
                }
            });

            if (!selectedClass) {
                return res.status(403).send('Вы не можете добавлять расписание для этого класса');
            }

            // Проверка на наложение расписания с разницей менее 3 часов
            const startTime = new Date(DateClass);
            startTime.setHours(startTime.getHours() - 3); // Начало окна - 3 часа

            const endTime = new Date(DateClass);
            endTime.setHours(endTime.getHours() + 3); // Конец окна + 3 часа

            const existingSchedules = await models.scheduler.findAll({
                where: {
                    ClassId: ClassId,
                    DateClass: {
                        [Op.between]: [startTime, endTime]
                    }
                }
            });

            if (existingSchedules.length > 0) {

                return res.status(400).send('Расписание накладывается на существующее, должно быть минимум 3 часа между расписаниями');
            }

            const newSchedule = await models.scheduler.create({
                ClassId: ClassId,
                DateClass: DateClass,
                TotalSpots: TotalSpots,
                AvailableSpots: AvailableSpots,
                Status: 2 // Установка статуса "ожидание"
            });

            res.redirect(`/profile/addSchedule`);
        } catch (error) {
            console.error('Ошибка при добавлении расписания:', error);
            res.status(500).send('Произошла ошибка при добавлении расписания');
        }
    }

    async editSchedulerView(req, res) {
        const { id } = req.params;
        const scheduler = await models.scheduler.findByPk(id, {
            include: [
                {
                    model: models.services,
                    attributes: ['Name', 'ServiceId'],
                    required: true
                }
            ],
            raw: true
        });
        const services  = await models.services.findAll({
            where: {
                MasterId: req.session.masterId
            }
        });
        res.render("./layouts/editSchedule.hbs", { layout: "editSchedule.hbs", scheduler: scheduler, services :services  });
    }

    async editSchedule(req, res) { //подумать как сделать, надо может передавать статус
        const { id } = req.params;
        try {
            const { ClassId, DateClass, TotalSpots, AvailableSpots } = req.body;
            const scheduler = await models.scheduler.findByPk(id, { raw: true });

            if (!scheduler) {
                return res.status(404).send('Расписание не найдено');
            }
            // Проверка на наложение расписания с разницей менее 3 часов
            const startTime = new Date(DateClass);
            startTime.setHours(startTime.getHours() - 3); // Начало окна - 3 часа

            const endTime = new Date(DateClass);
            endTime.setHours(endTime.getHours() + 3); // Конец окна + 3 часа

            const existingSchedules = await models.scheduler.findAll({
                where: {
                    ClassId: ClassId,
                    DateClass: {
                        [Op.between]: [startTime, endTime]
                    }
                }
            });

            if (existingSchedules.length > 0) {
                return res.status(400).send('Расписание накладывается на существующее, должно быть минимум 3 часа между расписаниями');
            }

            await models.scheduler.update({
                Status: TotalSpots,
                AvailableSpots: AvailableSpots,
                DateClass: DateClass,
                ClassId: ClassId
            },
                {
                    where: { SchedulerId: id }
                });

            res.redirect(`/profile/addSchedule`);

        } catch (error) {
            console.error('Ошибка при обновлении расписания:', error);
            res.status(500).send('Произошла ошибка при обновлении расписания');
        }
    }

    async deleteSchedule(req, res) {
        const { id } = req.params;
        try {

            const scheduler = await models.scheduler.findByPk(id);
            if (!scheduler) {
                return res.status(404).send('Расписание не найдено');
            }
            await scheduler.destroy();
            res.status(200).send('Расписание успешно удалено');

        } catch (error) {
            console.error('Ошибка при удалении расписания:', error);
            res.status(500).send('Произошла ошибка при удалении расписания');
        }
    }

    //  не подойдет 
    async getOrderPage(req, res) {
        try {
            if (!req.session.masterId) {
                return res.status(403).send('Необходима регистрация');
            }
            const master = await models.enrollment.findByPk(req.session.masterId);

            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            const servicesDetailes = await models.services.findAll({

                include: [
                    {
                        model: models.masters,
                        attributes: ['Name'], // Указываем, что нам нужно только имя преподавателя
                        required: true // Если преподаватель не указан, классы без преподавателя не будут возвращены
                    },
                    {
                        model: models.types,
                        attributes: ['TypeName'] // Указываем, что нам нужно только название типа
                    }
                ],
                where: {
                    MasterId: req.session.masterId // Добавляем условие на MasterId
                },
                raw: true
            });
            const services  = servicesDetailes.map(courseDetail => ({
                ServiceId: courseDetail.ServiceId,
                Name: courseDetail.Name,
                Description: courseDetail.Description,
                Master: courseDetail['Master.Name'],
                TypeName: courseDetail['Type.TypeName'],

            }));
            const types = await models.types.findAll({ raw: true })
            res.render("./layouts/profileServices.hbs", { layout: "profileServices.hbs", services : services , types: types });
        } catch (error) {
            console.error('Ошибка при открытии страницы с классами:', error);
            res.status(500).send('Произошла ошибка при открытии страницы с классами');
        }

    }

    async editOrder(req, res) { //подумать как сделать, надо может передавать статус
        const { id } = req.params;
        try {
            const { ClassId, DateClass, TotalSpots, AvailableSpots } = req.body;
            const scheduler = await models.scheduler.findByPk(id, { raw: true });

            if (!scheduler) {
                return res.status(404).send('Расписание не найдено');
            }
            // Проверка на наложение расписания с разницей менее 3 часов
            const startTime = new Date(DateClass);
            startTime.setHours(startTime.getHours() - 3); // Начало окна - 3 часа

            const endTime = new Date(DateClass);
            endTime.setHours(endTime.getHours() + 3); // Конец окна + 3 часа

            const existingSchedules = await models.scheduler.findAll({
                where: {
                    ClassId: ClassId,
                    DateClass: {
                        [Op.between]: [startTime, endTime]
                    }
                }
            });

            if (existingSchedules.length > 0) {
                return res.status(400).send('Расписание накладывается на существующее, должно быть минимум 3 часа между расписаниями');
            }

            await models.scheduler.update({
                Status: TotalSpots,
                AvailableSpots: AvailableSpots,
                DateClass: DateClass,
                ClassId: ClassId
            },
                {
                    where: { SchedulerId: id }
                });

            res.redirect(`/profile/addSchedule`);

        } catch (error) {
            console.error('Ошибка при обновлении расписания:', error);
            res.status(500).send('Произошла ошибка при обновлении расписания');
        }
    }

}

module.exports = new ProfileController();
