const { models, connection } = require('../db/utils/db');

class RequestsController {
    async getRequestPage(req, res) {
        const master = req.session.masterId;
        if (master) {
            req.session.previousUrl = req.headers.referer;
            return res.status(403).render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: 'Вы мастер, нельзя записываться!' });
        }

        if (!req.session.userId) {
            req.session.returnUrl = req.originalUrl;
            return res.status(301).redirect('/auth/login');
        }
        
        try {
            const types = await models.types.findAll({ raw: true });
            const professions = await models.professions.findAll({ raw: true });
            const criterias = await models.criterias.findAll({ raw: true });

            res.render("./layouts/requestForm.hbs", { 
                layout: "requestForm.hbs", 
                types: types, 
                professions: professions, 
                criterias: criterias 
            });
        } catch (error) {
            console.error('Ошибка при загрузке страницы заявки:', error);
            res.status(500).render('./layouts/error.hbs', { 
                layout: "error.hbs", 
                errorMessage: 'Ошибка при загрузке формы заявки' 
            });
        }
    };

    async addRequest(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Пользователь не авторизировался" });
        }
        
        const transaction = await connection.transaction();
        try {
  // Получаем сырые данные из формы
  const rawData = req.body;
  console.log('Raw form data:', rawData);

  // Преобразуем данные в удобный формат
  const formData = {
      Date: rawData.Date,
      Location: rawData.Location,
      Address: rawData.Address,
      TypeId: parseInt(rawData.type), 
      Comments: rawData.Comments,
      Professions: Array.isArray(rawData['professions[]']) 
          ? rawData['professions[]'].map(Number) 
          : [parseInt(rawData['professions[]'])], // Всегда массив чисел
      Quantities: {},
      Criterias: rawData.criterias ? [parseInt(rawData.criterias)] : []
  };

  // Обрабатываем количества для профессий
  for (const key in rawData) {
      if (key.startsWith('quantities[')) {
          const professionId = key.match(/\[(\d+)\]/)[1];
          formData.Quantities[professionId] = parseInt(rawData[key]) || 1;
      }
  }

  console.log('Processed form data:', formData);

  // Валидация
  if (!formData.Date || !formData.Location || !formData.TypeId || !formData.Professions.length) {
      await transaction.rollback();
      return res.status(400).json({ error: "Не заполнены обязательные поля" });
  }

  // Создаем заявку
  const newRequest = await models.requests.create({
      Date: new Date(formData.Date),
      Location: formData.Location,
      Address: formData.Address,
      TypeId: formData.TypeId,
      UserId: req.session.userId,
      Comments: formData.Comments,
      Status: 'pending'
  }, { transaction });
        
            await Promise.all(selectedProfessions.map(async professionId => {
                const profession = await models.professions.findByPk(professionId);
                if (!profession) {
                    req.session.previousUrl = req.headers.referer;
                    return res.status(404).render('./layouts/error.hbs', { layout: "error.hbs", errorMessage: `Профессия ${professionId} не найдена` });
               
                }
                
                const quantity = parseInt(quantities[professionId]) || 1;
                
                await models.requestProfession.create({
                    RequestId: newRequest.RequestId,
                    ProfessionId: professionId,
                    required: quantity,
                    approved: 0,
                    status: 'pending'
                }, { transaction });
            }));
        
            // Добавляем критерии отбора
            if (selectedCriterias?.length) {
                const validCriterias = await models.criterias.findAll({
                    where: { CriteriasId: selectedCriterias }
                });
                
                await newRequest.addCriterias(validCriterias, { transaction });
            }
            await transaction.commit();
            await this.notifySpecialists(newRequest.RequestId);
        
            res.status(201).json({
                success: true,
                requestId: newRequest.RequestId
            });
        
        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка создания заявки:', error);
            res.status(500).json({ 
                error: 'Ошибка при создании заявки',
                details: error.message 
            });
        }
    };

    async notifySpecialists(requestId) {
        try {
            const request = await models.requests.findByPk(requestId, {
                include: [
                    { 
                        model: models.professions, 
                        through: { where: { status: 'pending' } } 
                    },
                    { 
                        model: models.criterias 
                    },
                    {
                        model: models.types
                    }
                ]
            });
        
            if (!request) {
              return res.status(404).json({ error: "Заявка не найдена" });
            }
        
            for (const profession of request.professions) {
                // Ищем услуги, которые соответствуют:
                // 1. Типу мероприятия из заявки
                // 2. Профессии из заявки
                // 3. Локации из заявки
                const matchingServices = await models.services.findAll({
                  where: {
                      TypeId: request.TypeId,
                      Location: request.Location,
                      // Status: 1, // Только одобренные услуги
                      ProfessionId: profession.ProfessionId
                  },
                  include: [
                      {
                          model: models.masters
                      },
                      {
                          model: models.serviceCriterias,
                          where: request.criterias.length > 0 ? { 
                              CriteriasId: { 
                                  [Op.in]: request.criterias.map(c => c.CriteriasId) 
                              } 
                          } : undefined,
                          required: request.criterias.length > 0,
                          include: [{
                              model: models.criterias
                          }]
                      }
                  ]
              });
        
                const specialistIds = new Set();
                const notifications = [];
        
                matchingServices.forEach(service => {
                    if (!specialistIds.has(service.MasterId)) {
                        specialistIds.add(service.MasterId);
                        notifications.push(
                            models.notifications.create({
                                UserId: service.MasterId,
                                RequestId: request.RequestId,
                                ProfessionId: profession.ProfessionId,
                                type: 'new_request',
                                message: `Новая заявка по вашей профессии ${profession.ProfessionName}`,
                                isRead: false
                            })
                        );
                    }
                });
        
                await Promise.all(notifications);
            }
        } catch (error) {
            console.error('Ошибка отправки уведомлений:', error);
            throw error;
        }
    }

    async getRequestResponses(req, res) {
        try {
            const { requestId } = req.params;
            
            const request = await models.requests.findByPk(requestId, {
                include: [
                    {
                        model: models.professions,
                        through: { attributes: ['required', 'approved', 'status'] },
                        include: [
                            {
                                model: models.responses,
                                where: { status: 'pending' },
                                required: false,
                                include: [
                                    {
                                        model: models.masters,
                                        attributes: ['MasterId', 'Name']
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        model: models.types
                    }
                ]
            });
        
            if (!request) {
                return res.status(404).json({ error: "Заявка не найдена" });
            }
        
            res.status(200).json({
                requestId: request.RequestId,
                date: request.Date,
                type: request.type.TypeName,
                professions: request.professions.map(prof => ({
                    professionId: prof.ProfessionId,
                    name: prof.ProfessionName,
                    required: prof.RequestProfessions.required,
                    approved: prof.RequestProfessions.approved,
                    status: prof.RequestProfessions.status,
                    responses: prof.responses.map(resp => ({
                        responseId: resp.ResponseId,
                        specialistId: resp.Specialist.UserId,
                        specialistName: resp.Specialist.FullName,
                        rating: resp.Specialist.Rating,
                        status: resp.status,
                        createdAt: resp.createdAt
                    }))
                }))
            });
        } catch (error) {
            console.error('Ошибка получения откликов:', error);
            res.status(500).json({ 
                error: 'Ошибка при получении откликов',
                details: error.message 
            });
        }
    }

    async processResponse(req, res) {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Пользователь не авторизировался" });
        }

        const { responseId, action } = req.body; // action: 'approve' или 'reject'

        const transaction = await connection.transaction();
        try {
            const response = await models.responses.findOne({
                where: { ResponseId: responseId },
                include: [
                    {
                        model: models.requests,
                        where: { UserId: req.session.userId }
                    },
                    {
                        model: models.professions
                    }
                ]
            }, { transaction });

            if (!response) {
                await transaction.rollback();
                return res.status(404).json({ error: "Отклик не найден или у вас нет прав" });
            }
            response.status = action === 'approve' ? 'approved' : 'rejected';
            await response.save({ transaction });

            if (action === 'approve') {
                const [updated] = await models.requestProfession.increment('approved', {
                    where: { 
                        RequestId: response.RequestId, 
                        ProfessionId: response.ProfessionId 
                    },
                    transaction
                });

                const requestProfession = await models.requestProfession.findOne({
                    where: { 
                        RequestId: response.RequestId, 
                        ProfessionId: response.ProfessionId 
                    },
                    transaction
                });

                if (requestProfession.approved >= requestProfession.required) {
                    requestProfession.status = 'completed';
                    await requestProfession.save({ transaction });

                    // Отклоняем все другие pending отклики по этой профессии
                    await models.responses.update(
                        { status: 'rejected' },
                        {
                            where: { 
                                RequestId: response.RequestId,
                                ProfessionId: response.ProfessionId,
                                status: 'pending',
                                ResponseId: { [Op.ne]: response.ResponseId }
                            },
                            transaction
                        }
                    );
                } else {
                    requestProfession.status = 'partially_approved';
                    await requestProfession.save({ transaction });
                }

                const pendingProfessions = await models.requestProfession.count({
                    where: { 
                        RequestId: response.RequestId,
                        status: { [Op.not]: 'completed' }
                    },
                    transaction
                });

                if (pendingProfessions === 0) {
                    await models.requests.update(
                        { Status: 1 },
                        { where: { RequestId: response.RequestId }, transaction }
                    );
                }
            }

            await transaction.commit();
            await models.notifications.create({
                UserId: response.SpecialistId,
                RequestId: response.RequestId,
                type: 'response_' + (action === 'approve' ? 'approved' : 'rejected'),
                message: action === 'approve' 
                    ? 'Ваш отклик был одобрен' 
                    : 'Ваш отклик был отклонен',
                isRead: false
            });

            res.status(200).json({ success: true });

        } catch (error) {
            await transaction.rollback();
            console.error('Ошибка обработки отклика:', error);
            res.status(500).json({ 
                error: 'Ошибка при обработке отклика',
                details: error.message 
            });
        }
    }

    // метод для проверки статуса заявки:
    async checkRequestCompletion(requestId) {
        const request = await models.requests.findByPk(requestId, {
          include: [{
            model: models.professions,
            through: { attributes: ['required', 'approved', 'status'] }
          }]
        });
      
        const allCompleted = request.professions.every(prof => 
          prof.RequestProfessions.approved >= prof.RequestProfessions.required
        );
      
        const someApproved = request.professions.some(prof => 
          prof.RequestProfessions.approved > 0
        );
      
        let newStatus = request.Status;
        if (allCompleted) {
          newStatus = 'completed';
        } else if (someApproved) {
          newStatus = 'in_progress';
        }
      
        if (newStatus !== request.Status) {
          await request.update({ Status: newStatus });
        }
      
        return newStatus;
      }

      //В интерфейсе можно показывать такую информацию:
      async getRequestStatus(req, res) {
        const request = await models.requests.findByPk(req.params.id, {
          include: [{
            model: models.professions,
            attributes: ['ProfessionName'],
            through: { attributes: ['required', 'approved'] }
          }]
        });
      
        const statusInfo = {
          overallStatus: request.Status,
          professions: request.professions.map(prof => ({
            name: prof.ProfessionName,
            required: prof.RequestProfessions.required,
            approved: prof.RequestProfessions.approved,
            completed: prof.RequestProfessions.approved >= prof.RequestProfessions.required
          }))
        };
      
        res.json(statusInfo);
      }

      //При изменении статуса можно отправлять уведомления
      async updateRequestStatus(requestId) {
        const newStatus = await this.checkRequestCompletion(requestId);
        const request = await models.requests.findByPk(requestId);
        
        if (newStatus === 'completed') {
          await models.notifications.create({
            UserId: request.UserId,
            type: 'request_completed',
            message: 'Ваша заявка полностью выполнена!',
            isRead: false
          });
        }
        else if (newStatus === 'in_progress') {
          await models.notifications.create({
            UserId: request.UserId,
            type: 'request_progress',
            message: 'Часть специалистов по вашей заявке одобрена',
            isRead: false
          });
        }
      }
}

module.exports = new RequestsController();