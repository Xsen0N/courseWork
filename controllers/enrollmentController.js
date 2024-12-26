const { models } = require('../db/utils/db');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const today = new Date();
const twoHoursLater = new Date();
twoHoursLater.setHours(today.getHours() + 2);


async function sendMail(userEmail, schedulerDate) {
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
        text: `Спасибо за ваш выбор! Вы успешно записались на курс! Ждем вас на мастер-классе по улице Солнечная в ${schedulerDate}!`
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

    async addEnrollmentView(req, res) {
        try {
            const userId = req.session.userId;
            const master = req.session.masterId;
            const serviceId = req.query.serviceId;
            if (master) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Вы мастер, нельзя записываться!' });
            }

            if (!userId) {
                req.session.returnUrl = req.originalUrl;
                return res.redirect('/auth/login');
            }

            if (serviceId) {
                const servicesWithDetails = await models.services.findByPk(serviceId, {
                    include: [
                        {
                            model: models.types,
                            attributes: ['TypeName', 'TypeId'], // Выбираем только атрибут TypeName из модели types
                            raw: true
                        },
                        {
                            model: models.masters,
                            attributes: ['MasterId', 'Name', 'PriceForHour'], // Выбираем только атрибуты MasterId и MasterName из модели masters
                            raw: true
                        }
                    ],
                    raw: true
                });
                const service = {
                    ServiceId: servicesWithDetails.ServiceId,
                    Name: servicesWithDetails.Name,
                    Description: servicesWithDetails.Description,
                    Location: servicesWithDetails.Location,
                    TypeName: servicesWithDetails['Type.TypeName'],
                    TypeId: servicesWithDetails['Type.TypeId'],
                    Master: servicesWithDetails['Master.Name'],
                    MasterId: servicesWithDetails['Master.MasterId'],
                    PriceForHour: servicesWithDetails['Master.PriceForHour']
                };

                const busySlots = await models.scheduler.findAll({
                    include: [
                        {
                            model: models.enrollment,
                            attributes: [ 'Duration', 'Date', 'Time'],
                            include: [
                                {
                                    model: models.services,
                                    where: { MasterId: servicesWithDetails['Master.MasterId'] }
                                }
                            ]
                        }
                    ],
                    attributes: ['ApprovedTime'],
                    raw: true
                });
                
                return res.render("./layouts/addEnrollment.hbs", { layout: "addEnrollment.hbs", services: service });
            } else {
                return res.redirect('/services');
            }
        } catch (error) {
            console.error('Ошибка при получении курсов:', error);
            res.status(500).send('Произошла ошибка при получении курсов');
        }
    }

    async getPersonalOrderView(req, res) {
        try {
            const userId = req.session.userId;
            const master = req.session.masterId;
            const user = await models.users.findByPk(req.session.userId)
            if (master) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'У вас не может быть заявок!' });
            }
            if (user && user.Role == 1) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Эта страница для вас не достапна' });
            }

            if (!userId) {
                req.session.returnUrl = req.originalUrl;
                return res.redirect('/auth/login');
            }

            const enrollments = await models.enrollment.findAll({
                where: {
                    UserId: userId,
                },
                include: [
                    {
                        model: models.services,
                        attributes: ["ServiceId", "Name"], // Явно добавляем нужные атрибуты
                        include: [
                            {
                                model: models.types,
                                attributes: ["TypeName", "TypeId"], // Атрибуты из Types
                            },
                            {
                                model: models.masters,
                                attributes: ["MasterId", "Name", "PriceForHour"], // Атрибуты из Masters
                            },
                        ],
                    },
                ],
                raw: true
            });

            const enrollmentsWithDetails = enrollments.map(enrollment => {
                return {
                    EnrollmentId: enrollment.EnrollmentId,
                    ServiceName: enrollment['Service.Name'],
                    Name: enrollment['Service.Type.TypeName'],
                    TypeId: enrollment['Service.Type.TypeId'],
                    MasterName: enrollment['Service.Master.Name'],
                    PriceForHour: enrollment['Service.Master.PriceForHour'],
                    MasterId: enrollment['Service.Master.MasterId'],
                    Date: enrollment.Date,
                    Time: enrollment.Time,
                    Duration: enrollment.Duration,
                    Status: enrollment.Status,
                    Address: enrollment.Address,
                    Comments: enrollment.Comments,
                };
            });
            return res.render("./layouts/personalOrder.hbs", { layout: "personalOrder.hbs", enrollments: enrollmentsWithDetails });


        } catch (error) {
            console.error('Ошибка при получении курсов:', error);
            res.status(500).send('Произошла ошибка при получении курсов');
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

            // await sendMail(user.Email, scheduler.DateClass);

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

    async deleteEnrollment(req, res) {
        const { id } = req.params;
        try {
            const enrollment = await models.enrollment.findByPk(id);

            if (!enrollment) {
                return res.status(404).send('Запись на курс не найдена');
            }

            await enrollment.destroy();
            res.send('Запись на курс успешно удалена');
        } catch (error) {
            console.error('Ошибка при удалении записи на курс:', error);
            res.status(500).send('Произошла ошибка при удалении записи на курс');
        }
    }

}

module.exports = new EnrollmentController();