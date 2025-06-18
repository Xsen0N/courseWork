const { models } = require('../db/utils/db');
const { Op } = require('sequelize');

async function isAdmin(req, res, next) {
    const id = req.session.userId;
    if (id) {
        const user = await models.users.findByPk(id, { raw: true });
        if (user && user.Role === 1) {
            next();
        } else {
            req.session.previousUrl = req.headers.referer;
            return res.status(403).render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Доступ ограничен!' });
        }
    } else {
        req.session.previousUrl = req.headers.referer;
        return res.status(400).render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Ты точно админ?!' });
    }
}

class AdminController {

    async getAdminPage(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const serviceDetails = await models.services.findAll({
                    include: [
                        {
                            model: models.masters,
                            attributes: ['Name'], 
                            required: true 
                        },
                        {
                            model: models.types,
                            attributes: ['TypeName'] 
                        }
                    ], 
                    where: {
                        Status: {
                            [Op.ne]: 3
                        }
                    },
                    raw: true
                });
    
                const services = serviceDetails.map(service => ({
                    ServiceId: service.ServiceId,
                    Name: service.Name,
                    Description: service.Description,
                    Master: service['Master.Name'],
                    TypeName: service['Type.TypeName'],
                    Location: service.Location,
                    Status: service.Status
                }));
    
                // Разделяем услуги по статусам
                const pendingServices = services.filter(s => s.Status === 0);
                const approvedServices = services.filter(s => s.Status === 1);
                const rejectedServices = services.filter(s => s.Status === 2);
    
                res.status(200).render("./layouts/admin.hbs", { 
                    layout: "admin.hbs", 
                    pendingServices,
                    approvedServices,
                    rejectedServices
                });
            });
        } catch (error) {
            console.error('Ошибка при проверке роли администратора:', error);
            res.status(500).send('Произошла ошибка при проверке роли администратора');
        }
    }

    async getAllUsers(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const users = await models.users.findAll({  where: {
                    Role: 0,
                },
                raw: true });
                res.status(200).render("./layouts/users.hbs", { layout: "users.hbs", users: users});
            });
        } catch (error) {
            console.error('Ошибка при получении пользователей:', error);
            res.status(500).send('Произошла ошибка при получении пользователей');
        }
    }

    async getCriterias(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const criterias = await models.criterias.findAll({
                raw: true });
                res.status(200).render("./layouts/criterias.hbs", { layout: "criterias.hbs", criterias: criterias});
            });
        } catch (error) {
            console.error('Ошибка при получении критериев:', error);
            res.status(500).send('Произошла ошибка при получении критериев');
        }
    }

    async getScheduler(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const shedulesDetailes = await models.scheduler.findAll({
                    include: [
                        {
                            model: models.enrollment,
                            include: [
                                {
                                    model: models.services,
                                    attributes: ["MasterId", "Name",],
                                    include:[
                                        {
                                            model: models.masters,
                                            attributes: ["MasterId", "Name", "Login",],
                                        }
                                    ]
                                }, {
                                    model: models.users,
                                    attributes:["ID", "Login", "Email"]
                                }
                            ],
                        }
                    ],
                    raw: true
                });
                const schedules = shedulesDetailes.map(scheduleDetail => ({
                    ServiceId: scheduleDetail['Enrollment.Service.ServiceId'], // ID услуги
                    Name: scheduleDetail['Enrollment.Service.Name'], // Название услуги
                    ApprovedTime: scheduleDetail.ApprovedTime, // Время утверждения
                    MasterId: scheduleDetail['Enrollment.Service.MasterId'], // ID мастера
                    MasterName: scheduleDetail['Enrollment.Service.Master.Name'],
                    MasterLogin: scheduleDetail['Enrollment.Service.Master.Login'],
                    User: {
                        ID: scheduleDetail['Enrollment.User.ID'], // ID пользователя
                        Login: scheduleDetail['Enrollment.User.Login'], // Логин пользователя
                        Email: scheduleDetail['Enrollment.User.Email'], // Email пользователя
                    },
                    Enrollment: {
                        EnrollmentId: scheduleDetail['Enrollment.EnrollmentId'], // ID записи
                        Status: scheduleDetail['Enrollment.Status'], // Статус записи
                        Date: scheduleDetail['Enrollment.Date'], // Дата услуги
                        Time: scheduleDetail['Enrollment.Time'], // Время услуги
                        Duration: scheduleDetail['Enrollment.Duration'], // Длительность услуги
                        Comments: scheduleDetail['Enrollment.Comments'], // Комментарии
                        Address: scheduleDetail['Enrollment.Address']
                    }
                }));

                const users = await models.users.findAll({  where: {
                    Role: 0,
                },
                raw: true });
                const masters =  await models.masters.findAll({ raw: true });
                res.status(200).render("./layouts/schedule.hbs", { layout: "schedule.hbs", schedule: schedules, users: users,masters: masters  });
            });
        } catch (error) {
            console.error('Ошибка при получении расписания:', error);
            res.status(500).send('Произошла ошибка при получении расписания');
        }
    }

    async getServices(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const servicesDetailes = await models.services.findAll({
                    include: [
                        {
                            model: models.masters,
                            attributes: ['Name', 'PriceForHour', "MasterId","Login"], 
                            required: true
                        },
                        {
                            model: models.types,
                            attributes: ['TypeName', 'TypeId']
                        }
                    ],
                    raw: true
                });
                const services = servicesDetailes.map(courseDetail => ({
                    ServiceId: courseDetail.ServiceId,
                    Name:courseDetail.Name,
                    Location: courseDetail.Location, 
                    Description: courseDetail.Description,
                    Master: courseDetail['Master.Name'],
                    Login: courseDetail['Master.Login'],
                    MasterId: courseDetail['Master.MasterId'],
                    PriceForHour: courseDetail['Master.PriceForHour'],
                    TypeName: courseDetail['Type.TypeName'],
                    TypeId: courseDetail['Type.TypeId'],
                }));
                const types = await models.types.findAll({ raw: true})
                res.status(200).render("./layouts/adminServices.hbs", { layout: "adminServices.hbs", services: services, types: types  });
        
            });
        } catch (error) {
            console.error('Ошибка при получении критериев:', error);
            res.status(500).send('Произошла ошибка при получении критериев');
        }
    }

    async getEnrollment(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const enrollments = await models.enrollment.findAll({
                    include: [
                        {
                            model: models.services,
                            attributes: ["ServiceId", "Name", "MasterId"],
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
                        Comments: enrollment.Comments
                    };
                });

                res.status(200).render("./layouts/entry.hbs", { layout: "entry.hbs", enrollment: enrollmentsWithDetails });
            });
        } catch (error) {
            console.error('Ошибка при получении записей:', error);
            res.status(500).send('Произошла ошибка при получении записей');
        }
    }

    async getMasters(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const masters = await models.masters.findAll({ raw: true });
                for (let master of masters) {
                    if (master && master.Photo) {
                        master.Photo = master.Photo.toString('base64');
                        master.PhotoType = 'image/jpeg'; // или 'image/png', если нужно
                    }
                }
                res.status(200).render("./layouts/changingMasters.hbs", { layout: "changingMasters.hbs", masters: masters });
            });
        } catch (error) {
            console.error('Ошибка при получении специалистов', error);
            res.status(500).send('Произошла ошибка при получении специалистов');
        }
    }

    async getAllTypes(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const types = await models.types.findAll({ raw: true });
                res.status(200).render("./layouts/types.hbs", { layout: "types.hbs", types: types });
            });
        } catch (error) {
            console.error('Ошибка при получении получении типов', error);
            res.status(500).send('Произошла ошибка при получении типов');
        }
    }

    // masters

    async editMasterView(req, res) {
        try {
            const masterId = req.params.id;
            await isAdmin(req, res, async () => {
                const masters = await models.masters.findByPk(masterId, { raw: true });
                res.status(200).render("./layouts/editMaster.hbs", { layout: "editMaster.hbs", master: masters });
            });
        } catch (error) {
            console.error('Ошибка при получении редактировании мастера', error);
            res.status(500).send('Произошла ошибка при редактировании мастера');
        }
    }

    async editMaster(req, res) {
        const { id } = req.params;
        try {
            await isAdmin(req, res, async () => {
                const { name, description, photo } = req.body;
                const master = await models.masters.findByPk(id, { raw: true });
                if(description.length > 100){
                    req.session.previousUrl = req.headers.referer;
                    return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Много написал' });
                }
                if (!master) {
                    return res.status(404).send('Мастер не найден');
                }
                await models.masters.update({
                    Name: name,
                    Description: description
                },
                    {
                        where: { MasterId: id }
                    });

                res.redirect(`/admin/masters`);
            });

        } catch (error) {
            console.error('Ошибка при обновлении мастера:', error);
            res.status(500).send('Произошла ошибка при обновлении мастера');
        }
    }

    // types 

    async addTypeView(req, res) {
        try {
            await isAdmin(req, res, async () => {
                res.render("./layouts/addType.hbs", { layout: "addType.hbs" });
            });
        } catch (error) {
            console.error('Ошибка при показе типов', error);
            res.status(500).send('Произошла ошибка при показе типо');
        }
    }

    async addType(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const { TypeName, Description } = req.body;
                await models.types.create({
                    TypeName: TypeName,
                    Description: Description
                });
                res.redirect(`/admin/types`);
            });
        } catch (error) {
            console.error('Ошибка при добавлении типа:', error);
            res.status(500).send('Произошла ошибка при добавлении типа');
        }
    }

    async editTypeView(req, res) {
        try {
        const { id } = req.params;
        await isAdmin(req, res, async () => {
            const type = await models.types.findByPk(id, { raw: true })
            res.render("./layouts/editType.hbs", { layout: "editType.hbs", type: type });
        })}catch (error) {
            console.error('Ошибка при отображении редактирования типа:', error);
            res.status(500).send('Произошла ошибка при отображении редактирования типа');
        }
    }

    async editType(req, res) {
        const { id } = req.params;
        try {
            await isAdmin(req, res, async () => {
                const { typeName, description } = req.body;
                const type = await models.types.findByPk(id, { raw: true });
                if (!type) {
                    return res.status(404).send('Тип не найден');
                }
                await models.types.update({
                    TypeName: typeName,
                    Description: description
                },
                    {
                        where: { TypeId: id }
                    });
                return res.render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Информация о типе успешно обновлена' });
            });

        } catch (error) {
            console.error('Ошибка при обновлении типа:', error);
            res.status(500).send('Произошла ошибка при обновлении типа');
        }
    }

    async deleteType(req, res) {
        const { id } = req.params;
        try {
            await isAdmin(req, res, async () => {
                const type = await models.types.findByPk(id);
                if (!type) {
                    return res.status(404).send('Тип не найден');
                }
                await type.destroy();
                return res.render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Тип успешно удален' });
            });
        } catch (error) {
            console.error('Ошибка при удалении типа:', error);
            res.status(500).send('Произошла ошибка при удалении типа');
        }
    }

    async deleteUser(req, res) {
        const { id } = req.params;
        console.log(id)
        try {
            await isAdmin(req, res, async () => {
                const user = await models.users.findByPk(id);
                if (!user) {
                    return res.status(404).send('Пользователь не найден');
                }
                await user.destroy();
                return res.render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Пользователь успешно удален' });
            });
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            res.status(500).send('Произошла ошибка при удалении типа');
        }
    }

    async deleteService(req, res) {
        const { id } = req.params;
        try {
            await isAdmin(req, res, async () => {
                const service = await models.services.findByPk(id);
                if (!service) {
                    return res.status(404).send('Услуга не найдена');
                }
                await service.destroy();
                return res.render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Услуга успешно удалена' });
            });
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            res.status(500).send('Произошла ошибка при удалении');
        }
    }

    async deleteMaster(req, res) {
        const { id } = req.params;
        console.log(id)
        try {
            await isAdmin(req, res, async () => {
                const master = await models.masters.findByPk(id);
                if (!master) {
                    return res.status(404).send('Пользователь не найден');
                }
                await master.destroy();
                return res.render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Мастер успешно удален' });
            });
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            res.status(500).send('Произошла ошибка при удалении типа');
        }
    }

    //CREATERIAS

    async deleteCriterion(req, res) {
        const { id } = req.params;
        try {
            await isAdmin(req, res, async () => {
                const criterion = await models.criterias.findByPk(id);
                if (!criterion) {
                    return res.status(404).send('Критерий не найден');
                }
                await criterion.destroy();
                return res.status(200).render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Критерий успешно удален' });
            });
        } catch (error) {
            console.error('Ошибка при удалении:', error);
            res.status(500).send('Произошла ошибка при удалении критерия');
        }
    }

    
    async addCriterias(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const { Name, Description, Status } = req.body;
                await models.criterias.create({
                    Name: Name,
                    Description: Description,
                    Status: Status
                });
                res.status(204).redirect(`/admin/criterias`);
            });
        } catch (error) {
            console.error('Ошибка при добавлении критерия:', error);
            res.status(500).send('Произошла ошибка при добавлении критерия');
        }
    }

    async editCriterias(req, res) {
        const { id } = req.params;
        try {
            await isAdmin(req, res, async () => {
                const { Name, Description, Status } = req.body;
                const criterion = await models.criterias.findByPk(id, { raw: true });
                if (!criterion) {
                    return res.status(404).send('Критерий не найден');
                }
                await models.criterias.update({
                    Name: Name,
                    Description: Description,
                    Status: Status
                },
                    {
                        where: { CriteriasId: id }
                    });
                return res.status(200).render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Информация о критерии успешно обновлена' });
            });

        } catch (error) {
            console.error('Ошибка при обновлении критерия:', error);
            res.status(500).send('Произошла ошибка при обновлении критерия');
        }
    }



        //PROPESSIONS
        async deleteProfession(req, res) {
            const { id } = req.params;
            try {
                await isAdmin(req, res, async () => {
                    const profession = await models.professions.findByPk(id);
                    if (!profession) {
                        return res.status(404).send('Специальность не найдена');
                    }
                    await profession.destroy();
                    return res.status(200).render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Специальность успешно удалена' });
                });
            } catch (error) {
                console.error('Ошибка при удалении:', error);
                res.status(500).send('Произошла ошибка при удалении специальности');
            }
        }
        
        async addProfession(req, res) {
            try {
                await isAdmin(req, res, async () => {
                    const { ProfessionName, Description } = req.body;
                    await models.professions.create({
                        ProfessionName: ProfessionName,
                        Description: Description
                    });
                    res.status(204).redirect(`/admin/professions`);
                });
            } catch (error) {
                console.error('Ошибка при добавлении специализации:', error);
                res.status(500).send('Произошла ошибка при добавлении специализации');
            }
        }

        async editProfession(req, res) {
            const { id } = req.params;
            try {
                await isAdmin(req, res, async () => {
                    const { ProfessionName, Description } = req.body;
                    const profession = await models.professions.findByPk(id, { raw: true });
                    if (!profession) {
                        return res.status(404).send('Специализация не найдена');
                    }
                    await models.professions.update({
                        ProfessionName: ProfessionName,
                        Description: Description
                    },
                        {
                            where: { ProfessionId: id }
                        });
                    return res.status(200).render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Информация успешно обновлена' });
                });
    
            } catch (error) {
                console.error('Ошибка при обновлении специализации:', error);
                res.status(500).send('Произошла ошибка при обновлении специализации');
            }
        }

        async getProfessions(req, res) {
            try {
                await isAdmin(req, res, async () => {
                    const professions = await models.professions.findAll({
                    raw: true });
                    res.status(200).render("./layouts/professions.hbs", { layout: "professions.hbs", professions: professions});
                });
            } catch (error) {
                console.error('Ошибка при получении критериев:', error);
                res.status(500).send('Произошла ошибка при получении критериев');
            }
        }

        async changeStatusOfService(req, res) {
            const { id } = req.params;
            const { status } = req.body;
        
            try {
                if (isNaN(id)) return res.status(400).json({ error: "Неверный ID" });
                if (![0, 1, 2].includes(Number(status))) {
                    return res.status(400).json({ error: "Недопустимый статус" });
                }
        
                const service = await models.services.findByPk(id, {
                    include: [{
                        model: models.masters,
                        attributes: ['MasterId']
                    }],
                    raw: true
                });
                
                if (!service) return res.status(404).json({ error: "Услуга не найдена" });
        
                // Обновляем статус услуги
                await models.services.update(
                    { Status: status },
                    { where: { ServiceId: id } }
                );
                console.log(service)
        
                // Создаем уведомление
                let notificationMessage, notificationType;
                
                switch(status) {
                    case 1: // Одобрено
                        notificationMessage = `Ваша услуга "${service.Name}" была одобрена`;
                        notificationType = 'application_status';
                        break;
                    case 2: // Отклонено
                        notificationMessage = `Ваша услуга "${service.Name}" была отклонена`;
                        notificationType = 'application_status';
                        break;
                    case 0: // На рассмотрении
                        notificationMessage = `Ваша услуга "${service.Name}" отправлена на повторное рассмотрение`;
                        notificationType = 'application_status';
                        break;
                }
        
                // Создаем уведомление в базе данных
                await models.notifications.create({
                    Message: notificationMessage,
                    Type: notificationType,
                    MasterId: service['Master.MasterId'], // Используем MasterId из связанной модели
                    Metadata: JSON.stringify({ // Сериализуем объект в строку
                        serviceId: service.ServiceId,
                        serviceName: service.Name,
                        newStatus: status
                    }),
                    isRead: false
                });
                
                res.json({ message: "Статус успешно обновлен" });
            } catch (error) {
                console.error('Ошибка:', error);
                res.status(500).json({ 
                    error: 'Ошибка обновления статуса',
                    details: error.errors 
                });
            }
        }

    // Метод для отображения страницы со всеми пользователями
    async getUsersPage(req, res) {
        try {
            // Получаем список всех пользователей
            const users = await models.users.findAll({
                raw: true,
                order: [['UserId', 'ASC']]
            });

            // Получаем список всех мастеров
            const masters = await models.masters.findAll({
                include: [{
                    model: models.professions,
                    as: 'Profession',
                    attributes: ['ProfessionName']
                }],
                raw: true,
                nest: true
            });

            // Получаем список всех клиентов
            const clients = await models.clients.findAll({
                raw: true
            });

            console.log("Пользователи:", JSON.stringify(users, null, 2));
            console.log("Мастера:", JSON.stringify(masters, null, 2));
            console.log("Клиенты:", JSON.stringify(clients, null, 2));

            // Рендерим страницу с данными
            res.render('admin/users', {
                users: users,
                masters: masters,
                clients: clients,
                layout: false
            });
        } catch (error) {
            console.error('Ошибка при получении данных пользователей:', error);
            res.status(500).render('error', {
                message: 'Ошибка при получении данных пользователей',
                error: error,
                layout: false
            });
        }
    }
}



module.exports = new AdminController();