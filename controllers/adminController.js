const { models } = require('../db/utils/db');

async function isAdmin(req, res, next) {
    const id = req.session.userId;
    if (id) {
        const user = await models.users.findByPk(id, { raw: true });
        if (user && user.Role === 1) {
            next();
        } else {
            req.session.previousUrl = req.headers.referer;
            return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Доступ ограничен!' });
        }
    } else {
        req.session.previousUrl = req.headers.referer;
        return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Ты точно админ?!' });
    }
}

class AdminController {

    async getAdminPage(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const classesDetailes = await models.services.findAll({
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
                    raw: true
                });
                const classes = classesDetailes.map(courseDetail => ({
                    ClassId: courseDetail.ClassId,
                    Name:courseDetail.Name,
                    Description: courseDetail.Description,
                    Master: courseDetail['Master.Name'],
                    TypeName: courseDetail['Type.TypeName'],
        
                }));

                res.render("./layouts/admin.hbs", { layout: "admin.hbs", classes:classes });
            });
        } catch (error) {
            console.error('Ошибка при проверке роли администратора:', error);
            res.status(500).send('Произошла ошибка при проверке роли администратора');
        }
    }

    async getAllUsers(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const users = await models.users.findAll({ raw: true });
                res.render("./layouts/users.hbs", { layout: "users.hbs", users: users });
            });
        } catch (error) {
            console.error('Ошибка при получении пользователей:', error);
            res.status(500).send('Произошла ошибка при получении пользователей');
        }
    }

    async getScheduler(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const schedulerDetails = await models.scheduler.findAll({
                    include: {
                        model: models.services,
                        attributes: ['Name'],
                        required: true
                    }, raw: true
                });
                const schedule = schedulerDetails.map(scheduler => ({
                    SchedulerId: scheduler.SchedulerId,
                    TotalSpots: scheduler.TotalSpots,
                    AvailableSpots: scheduler.AvailableSpots,
                    DateClass: scheduler.DateClass,
                    Status: scheduler.Status,
                    ClassId: scheduler.ClassId,
                    ClassName: scheduler['Class.Name']
                }))
                res.render("./layouts/schedule.hbs", { layout: "schedule.hbs", schedule: schedule });
            });
        } catch (error) {
            console.error('Ошибка при получении расписания:', error);
            res.status(500).send('Произошла ошибка при получении расписания');
        }
    }

    async getEnrollment(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const enrollment = await models.enrollment.findAll({ raw: true });

                res.render("./layouts/entry.hbs", { layout: "entry.hbs", enrollment: enrollment });
            });
        } catch (error) {
            console.error('Ошибка при получении записей на курсы:', error);
            res.status(500).send('Произошла ошибка при получении записей на курсы');
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
                res.render("./layouts/changingMasters.hbs", { layout: "changingMasters.hbs", masters: masters });
            });
        } catch (error) {
            console.error('Ошибка при получении записей на курсы:', error);
            res.status(500).send('Произошла ошибка при получении записей на курсы');
        }
    }

    async getAllTypes(req, res) {
        try {
            await isAdmin(req, res, async () => {
                const types = await models.types.findAll({ raw: true });
                res.render("./layouts/types.hbs", { layout: "types.hbs", types: types });
            });
        } catch (error) {
            console.error('Ошибка при получении записей на курсы:', error);
            res.status(500).send('Произошла ошибка при получении записей на курсы');
        }
    }

    // masters

    async editMasterView(req, res) {
        try {
            const masterId = req.params.id;
            await isAdmin(req, res, async () => {
                const masters = await models.masters.findByPk(masterId, { raw: true });
                res.render("./layouts/editMaster.hbs", { layout: "editMaster.hbs", master: masters });
            });
        } catch (error) {
            console.error('Ошибка при получении записей на курсы:', error);
            res.status(500).send('Произошла ошибка при получении записей на курсы');
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
            console.error('Ошибка при получении записей на курсы:', error);
            res.status(500).send('Произошла ошибка при получении записей на курсы');
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
                res.status(201).send('Тип успешно добавлен ');
            });
        } catch (error) {
            console.error('Ошибка при добавлении типа:', error);
            res.status(500).send('Произошла ошибка при добавлении типа');
        }
    }

    async editTypeView(req, res) {
        const { id } = req.params;
        await isAdmin(req, res, async () => {
            const type = await models.types.findByPk(id, { raw: true })
            res.render("./layouts/editType.hbs", { layout: "editType.hbs", type: type });
        })
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
        console.log(id)
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

    async editClassView(req, res) {
        const { id } = req.params;
        await isAdmin(req, res, async () => {
            const type = await models.services.findByPk(id, { raw: true })
            res.render("./layouts/editClass.hbs", { layout: "editClass.hbs", type: type });
        })
    }

    async editClass(req, res) {
        const { id } = req.params;
        try {
            await isAdmin(req, res, async () => {
                const { name, description, artType } = req.body;
                const classInstance = await models.services.findByPk(id, { raw: true });
                if (!classInstance) {
                    return res.status(404).send('Класс не найден');
                }
                await models.services.update({
                    Name: name,
                    Description: description,
                    ArtType: artType
                },
                    {
                        where: { ClassId: id }
                    });
                return res.render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Информация о классе успешно обновлена' });

            })
        } catch (error) {
            console.error('Ошибка при обновлении класса:', error);
            res.status(500).send('Произошла ошибка при обновлении класса');
        }
    }

    async deleteClass(req, res) {
        const { id } = req.params;
        try {
            const classInstance = await models.services.findByPk(id);
            if (!classInstance) {
                return res.status(404).send('Класс не найден');
            }
            await classInstance.destroy();
            return res.render('./layouts/infoAdmin.hbs', {layout: "infoAdmin.hbs", message: 'Класс успешно удален' });

        } catch (error) {
            console.error('Ошибка при удалении класса:', error);
            res.status(500).send('Произошла ошибка при удалении класса');
        }
    }

    //Scheduler

    async editSchedulerView(req, res) {
        await isAdmin(req, res, async () => {
            res.render("./layouts/editSchedule.hbs", { layout: "editSchedule.hbs", type: type });
        })
    }

    async editScheduler(req, res) { //подумать как сделать, надо может передавать статус
        const { scheduleId, statusId } = req.params;

        try {
            const schedule = await models.scheduler.findByPk(scheduleId, { raw: true });

            if (!schedule) {
                return res.status(404).json({ success: false, message: 'Расписание не найдено.' });
            }
            await models.scheduler.update({
                Status: statusId,
            },
                {
                    where: { SchedulerId: scheduleId }
                });

            res.status(200).json({ success: true, message: 'Статус расписания успешно изменен.' });
        } catch (error) {
            console.error('Ошибка при изменении статуса расписания:', error);
            res.status(500).json({ success: false, message: 'Ошибка при изменении статуса расписания.' });
        }
    }

    async deleteEnrollment(req, res) {
        const { id } = req.params;
        try {
            await isAdmin(req, res, async () => {
                const enrollment = await models.enrollment.findByPk(id);
                if (!enrollment) {
                    return res.status(404).send('Запись на курс не найдена');
                }
                await enrollment.destroy();
                res.send('Запись на курс успешно удалена');
            });
        } catch (error) {
            console.error('Ошибка при удалении записи на курс:', error);
            res.status(500).send('Произошла ошибка при удалении записи на курс');
        }
    }
}



module.exports = new AdminController();