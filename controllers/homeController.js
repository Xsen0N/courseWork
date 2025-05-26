const { models } = require('../db/utils/db');

class HomeController {
    async getMainPage(req, res) {
        const types = await models.types.findAll({ raw: true });
        const professions = await models.professions.findAll({ raw: true });
        res.render("./layouts/home.hbs", { layout: "home.hbs", types:types, professions:professions });
    };

}
module.exports = new HomeController();