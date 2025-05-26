const { models } = require('../db/utils/db');


class TypesController {
    async getAllTypes(req, res) {
        const types = await models.types.findAll({
            raw: true
        })
        res.render("./layouts/types.hbs", { layout: "types.hbs", types: types });
    }
}

module.exports = new TypesController();