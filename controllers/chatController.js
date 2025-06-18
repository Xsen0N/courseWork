const { models } = require('../db/utils/db');
const { Op } = require('sequelize');

class ChatController {
    constructor() {
        // Cache for static data
        this.cache = {
            types: null,
            professions: null,
            criterias: null,
            lastUpdate: null
        };
        this.CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes cache
    }

    async getData(req, res) {
        try {
            // Check if cache is valid
            if (this.cache.lastUpdate && (Date.now() - this.cache.lastUpdate < this.CACHE_LIFETIME)) {
                return res.json({
                    types: this.cache.types.map(t => ({ 
                        id: t.TypeId, 
                        name: t.TypeName
                    })),
                    professions: this.cache.professions.map(p => ({ 
                        id: p.ProfessionId, 
                        name: p.ProfessionName
                    })),
                    criterias: this.cache.criterias.map(c => ({ 
                        id: c.CriteriasId, 
                        name: c.Name
                    }))
                });
            }

            // If cache is invalid or doesn't exist, fetch new data
            const [types, professions, criterias] = await Promise.all([
                models.types.findAll({ 
                    attributes: ['TypeId', 'TypeName'],
                    raw: true 
                }),
                models.professions.findAll({ 
                    attributes: ['ProfessionId', 'ProfessionName'],
                    raw: true 
                }),
                models.criterias.findAll({ 
                    attributes: ['CriteriasId', 'Name'],
                    raw: true 
                })
            ]);

            // Update cache with raw data
            this.cache = {
                types,
                professions,
                criterias,
                lastUpdate: Date.now()
            };

            // Return formatted data
            return res.json({
                types: types.map(t => ({ 
                    id: t.TypeId, 
                    name: t.TypeName
                })),
                professions: professions.map(p => ({ 
                    id: p.ProfessionId, 
                    name: p.ProfessionName
                })),
                criterias: criterias.map(c => ({ 
                    id: c.CriteriasId, 
                    name: c.Name
                }))
            });
        } catch (error) {
            console.error('Error loading chat data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    async findMasters(req, res) {
        try {
            const { professionId, typeId, criteriaIds } = req.body;
            
            // 1. First find masters by profession
            const masters = await models.masters.findAll({
                attributes: ['MasterId', 'Name', 'Description', 'PriceForHour'],
                include: [
                    {
                        model: models.professions,
                        where: { ProfessionId: professionId },
                        attributes: ['ProfessionName'],
                        required: true
                    },
                    {
                        model: models.services,
                        where: { TypeId: typeId },
                        required: true,
                        include: [
                            {
                                model: models.criterias,
                                where: criteriaIds && criteriaIds.length > 0 ? 
                                    { CriteriasId: { [Op.in]: criteriaIds } } : 
                                    {},
                                required: criteriaIds && criteriaIds.length > 0
                            }
                        ]
                    }
                ],
                raw: false,
                nest: true
            });

            // Format the response to match the existing UI
            const formattedMasters = masters.map(master => {
                const profession = master.professions && master.professions[0];
                const services = master.services || [];

                return {
                    MasterId: master.MasterId,
                    Name: master.Name || 'Без имени',
                    Description: master.Description || '',
                    PriceForHour: master.PriceForHour || 0,
                    'Profession.ProfessionName': profession ? profession.ProfessionName : 'Не указана',
                    Services: services.map(service => ({
                        Name: service.Name || 'Без названия',
                        Location: service.Location || 'Не указано',
                        Criterias: (service.criterias || []).map(c => c.Name || '')
                    }))
                };
            });

            res.json(formattedMasters);
        } catch (error) {
            console.error('Error finding masters:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

module.exports = ChatController;