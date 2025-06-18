const { models } = require('../db/utils/db');
const { Op } = require('sequelize');

class HomeController {
    async getMainPage(req, res) {
        try {
            const types = await models.types.findAll({ raw: true });
            const criterias = await models.criterias.findAll({ raw: true });
            const masters = await models.masters.findAll({ 
                raw: true,
                where: {
                    Description: {
                        [Op.not]: null
                    },
                    PriceForHour: {
                        [Op.not]: null
                    }
                }
            });

            res.render("./layouts/home.hbs", { 
                layout: "home.hbs", 
                types: types,
                masters: masters,
                criterias: criterias
            });
        } catch (error) {
            console.error('Error fetching home page data:', error);
            res.status(500).render('./layouts/error.hbs', { 
                layout: "error.hbs",
                message: 'Произошла ошибка при загрузке данных',
                error: process.env.NODE_ENV === 'development' ? error : {}
            });
        }
    }

    async filterMasters(req, res) {
        try {
            const { typeId } = req.body;
            
            const where = {
                Description: {
                    [Op.not]: null
                },
                PriceForHour: {
                    [Op.not]: null
                }
            };

            if (typeId) {
                where.TypeId = typeId;
            }

            const masters = await models.masters.findAll({ 
                raw: true,
                where: where
            });

            res.json(masters);
        } catch (error) {
            console.error('Error filtering masters:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = new HomeController();