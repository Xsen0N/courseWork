const { models, connection } = require('../db/utils/db');

class MastersController {
    async getAllMasters(req, res, sequelize) {
        try {
            const masters = await models.masters.findAll({ raw: true });
    
            for (let master of masters) {
                if (master && master.Photo) {
                    master.Photo = master.Photo.toString('base64');
                    master.PhotoType = 'image/jpeg'; // или 'image/png', если нужно
                }
            }
    
    
            const worksCounts = await models.gallery.findAll({
                attributes: ['MasterId', [connection.fn('COUNT', connection.col('GalleryId')), 'worksCount']],
                group: ['MasterId'],
                raw: true
            });
            
            console.log(worksCounts)
            // Создание объекта для быстрого доступа к количеству работ по MasterId
            const worksCountsMap = worksCounts.reduce((acc, curr) => {
                acc[curr.MasterId] = curr.worksCount;
                return acc;
            }, {});
    
            res.render('./layouts/masters.hbs', { layout: "masters.hbs", masters: masters, worksCountsMap: JSON.stringify(worksCountsMap)});
        } catch (error) {
            console.error('Ошибка при получении всех мастеров:', error);
            res.status(500).send('Произошла ошибка при получении всех мастеров');
        }
    }
    
    


    async getOneMaster(req, res) {
        //const { id } = req.params;
        const masterId = req.params.id;
        try {
            const master = await models.masters.findByPk(masterId, { raw: true });
            if (master && master.Photo) {
                master.Photo = master.Photo.toString('base64');
                master.PhotoType = 'image/jpeg';
            }
            if (!master) {
                req.session.previousUrl = req.headers.referer;
                return res.render('./layouts/error.hbs', {layout: "error.hbs", errorMessage: 'Мастер не найден' });
            }
            const classes = await models.services.findAll({
                where: {
                    MasterId: masterId
                },
                raw: true
            });
            const gallery = await models.gallery.findAll({
                where: {
                    MasterId: masterId
                },
                raw: true
            })
            for (let photo of gallery) {
                if (photo && photo.Photo) {
                    photo.Photo = photo.Photo.toString('base64');
                    photo.PhotoType = 'image/jpeg'; // или 'image/png', если нужно
                }
            }
            res.render('./layouts/masterDetails.hbs', { layout: "masterDetails.hbs", master: master, classes: classes, gallery: gallery });

        } catch (error) {
            console.error('Ошибка при получении мастера:', error);
            res.status(500).send('Произошла ошибка при получении мастера');
        }
    }

    async addNewMaster(req, res) {
        const { name, photo, artType, description } = req.body;
        try {
            const newMaster = await models.masters.create({
                Name: name,
                Photo: photo,
                ArtType: artType,
                Description: description
            });
            res.status(201).json(newMaster);
        } catch (error) {
            console.error('Ошибка при добавлении нового мастера:', error);
            res.status(500).send('Произошла ошибка при добавлении нового мастера');
        }
    }

    async updateMaster(req, res) {
        const { id } = req.params;
        const { name, photo, artType, description } = req.body;
        try {
            const master = await models.masters.findByPk(id);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            await master.update({
                Name: name,
                Photo: photo,
                ArtType: artType,
                Description: description
            });
            res.json(master);
        } catch (error) {
            console.error('Ошибка при обновлении мастера:', error);
            res.status(500).send('Произошла ошибка при обновлении мастера');
        }
    }

    async deleteMaster(req, res) {
        const { id } = req.params;
        try {
            const master = await models.masters.findByPk(id);
            if (!master) {
                return res.status(404).send('Мастер не найден');
            }
            await master.destroy();
            res.status(204).send();
        } catch (error) {
            console.error('Ошибка при удалении мастера:', error);
            res.status(500).send('Произошла ошибка при удалении мастера');
        }
    }

}

module.exports = new MastersController();
