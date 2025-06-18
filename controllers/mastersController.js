const { models } = require('../db/utils/db');

class MastersController {
    // Получение страницы со списком мастеров
    async getMastersList(req, res) {
        try {
            // Получаем список всех профессий для фильтра
            const professions = await models.professions.findAll({
                attributes: ['ProfessionId', 'ProfessionName'],
                raw: true,
                order: [['ProfessionName', 'ASC']]
            });
    
            // Получаем список мастеров со связанными профессиями
            let masters = await models.masters.findAll({
                include: [{
                    model: models.professions,
                    attributes: ['ProfessionName', 'Description']
                }],
                raw: true,
                nest: true,
                order: [['Name', 'ASC']]
            });
    
            // Преобразуем фото для каждого мастера
            masters = masters.map(master => {
                if (master.Photo) {
                    return {
                        ...master,
                        Photo: master.Photo.toString('base64'),
                        PhotoType: master.PhotoType || 'image/jpeg' // Добавляем тип по умолчанию
                    };
                }
                return master;
            });
    
    
            // Рендерим страницу
            res.render('layouts/masters', {
                masters: masters,
                professions: professions,
                layout: false,
                helpers: {
                    json: function(context) {
                        return JSON.stringify(context);
                    }
                }
            });
        } catch (error) {
            console.error('Ошибка при получении списка мастеров:', error);
            res.status(500).render('error', {
                message: 'Ошибка при получении списка мастеров',
                error: error,
                layout: false
            });
        }
    }

    // Получение страницы конкретного мастера
    async getMasterDetails(req, res) {
        try {
            const masterId = req.params.id;

            const master = await models.masters.findOne({
                where: { MasterId: masterId },
                include: [
                    {
                        model: models.professions,
                        attributes: ['ProfessionName', 'Description']
                    }
                ]
            });

            if (!master) {
                return res.status(404).render('error', {
                    message: 'Специалист не найден',
                    layout: false
                });
            }
             // Преобразуем фото, если оно есть
        if (master.Photo) {
            master.Photo = master.Photo.toString('base64');
            master.PhotoType = master.PhotoType || 'image/jpeg'; // Тип по умолчанию
        }
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

            res.render('layouts/masterDetails', {
                master: master.toJSON(),
                gallery: gallery,
                layout: false
            });
        } catch (error) {
            console.error('Ошибка при получении информации о мастере:', error);
            res.status(500).render('error', {
                message: 'Ошибка при получении информации о мастере',
                layout: false
            });
        }
    }
}

module.exports = new MastersController(); 