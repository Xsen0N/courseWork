const { models } = require('../db/utils/db');


class TypesController {
    async getAllTypes(req, res) {
        const types = await models.types.findAll({
            raw: true
        })
        res.render("./layouts/types.hbs", { layout: "types.hbs", types: types });
    }
    async getMasterType(req, res){
        try {
            const masterId = req.params.masterId;
            const master = await models.masters.findOne({
                where: { MasterId: masterId },
                include: models.services
            });
            const type = master.classes ? master.classes.ArtType : null;
            res.json({ type: type });
        } catch (error) {
            console.error('Ошибка при получении типа мастера:', error);
            res.status(500).send('Произошла ошибка при получении типа мастера');
        }
    }

}

module.exports = new TypesController();