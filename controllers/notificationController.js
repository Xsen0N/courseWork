const { models } = require('../db/utils/db');

class NotificationController {
    async getUserNotifications(req, res) {
        try {
            // Определяем, кто запрашивает: пользователь или мастер
            const isMaster = req.session.masterId !== undefined;
            const userId = isMaster ? req.session.masterId : req.session.userId;
            
            if (!userId) {
                return res.status(401).json({ error: 'Необходима авторизация' });
            }

            // Получаем уведомления для текущего пользователя/мастера
            const whereClause = isMaster ? { MasterId: userId } : { UserId: userId };
            
            const notifications = await models.notifications.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']],
                limit: 50
            });
            
            res.json(notifications);
        } catch (error) {
            console.error('Ошибка при получении уведомлений:', error);
            res.status(500).json({ 
                error: 'Ошибка получения уведомлений',
                details: error.message 
            });
        }
    }

    async markAsRead(req, res) {
        try {
            const { id } = req.params;
            const isMaster = req.session.masterId !== undefined;
            const userId = isMaster ? req.session.masterId : req.session.userId;
            
            if (!userId) {
                return res.status(401).json({ error: 'Необходима авторизация' });
            }

            const whereClause = { 
                NotificationId: id,
                [isMaster ? 'MasterId' : 'UserId']: userId 
            };

            const [updatedCount] = await models.notifications.update(
                { isRead: true },
                { where: whereClause }
            );
            
            if (updatedCount === 0) {
                return res.status(404).json({ error: 'Уведомление не найдено или нет прав' });
            }
            
            res.json({ success: true });
        } catch (error) {
            console.error('Ошибка при обновлении уведомления:', error);
            res.status(500).json({ 
                error: 'Ошибка обновления уведомления',
                details: error.message 
            });
        }
    }

    async markAllAsRead(req, res) {
        try {
            const isMaster = req.session.masterId !== undefined;
            const userId = isMaster ? req.session.masterId : req.session.userId;
            
            if (!userId) {
                return res.status(401).json({ error: 'Необходима авторизация' });
            }
    
            const whereClause = { 
                isRead: false,
                [isMaster ? 'MasterId' : 'UserId']: userId 
            };
    
            const [updatedCount] = await models.notifications.update(
                { isRead: true },
                { where: whereClause }
            );
            
            res.json({ 
                success: true,
                updatedCount 
            });
        } catch (error) {
            console.error('Ошибка при массовом обновлении уведомлений:', error);
            res.status(500).json({ 
                error: 'Ошибка обновления уведомлений',
                details: error.message 
            });
        }
    }

    static async checkAdmin(req, res, next) {
        const id = req.session.userId;
        if (id) {
            const user = await models.users.findByPk(id, { raw: true });
            if (user && user.Role === 1) {
                return next();
            }
        }
        req.session.previousUrl = req.headers.referer;
        return res.status(403).render('./layouts/error.hbs', {
            layout: "error.hbs", 
            errorMessage: 'Доступ ограничен! Ты точно админ?!'
        });
    }
}

module.exports = {
    notificationController: new NotificationController(),
    checkAdmin: NotificationController.checkAdmin
};