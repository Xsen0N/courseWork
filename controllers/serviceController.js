const { models } = require('../db/utils/db');


class ServiceController {
    async getAllServices(req, res) {
        const service = await models.services.findAll();

        const servicesDetailes = await models.services.findAll({
            include: [
                {
                    model: models.masters,
                    attributes: ['Name', 'PriceForHour'], 
                    required: true
                },
                {
                    model: models.types,
                    attributes: ['TypeName']
                }
            ],where: {
                status: 1
            },
            raw: true
        });
        const services = servicesDetailes.map(courseDetail => ({
            ServiceId: courseDetail.ServiceId,
            Name:courseDetail.Name,
            Location: courseDetail.Location, 
            Description: courseDetail.Description,
            Master: courseDetail['Master.Name'],
            PriceForHour: courseDetail['Master.PriceForHour'],
            TypeName: courseDetail['Type.TypeName'],

        }));
        const types = await models.types.findAll({ raw: true})
        res.render("./layouts/services.hbs", { layout: "services.hbs", services: services, types: types  });

    }
    async getOneService(req, res) {
        const { id } = req.params;
        try {
            const sevices = await models.services.findByPk(id);
            if (!sevices) {
                return res.status(404).send('Услуга не найден');
            }
            res.json(sevices);
        } catch (error) {
            console.error('Ошибка при получении мастера:', error);
            res.status(500).send('Произошла ошибка при получении мастера');
        }
    }


}


module.exports = new ServiceController();