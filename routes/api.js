const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');

// Existing routes
router.get('/:id', masterController.getOneMaster);

// New route for chat search
router.post('/masters', async (req, res) => {
    try {
        const { eventType, specialty, criteria } = req.body;
        
        // Get all masters from the controller
        const allMasters = await masterController.getAllMasters();
        
        // Filter masters based on criteria
        let filteredMasters = allMasters.filter(master => {
            // Match specialty
            if (specialty && master.specialty !== specialty) {
                return false;
            }
            
            // Match event type
            if (eventType && !master.eventTypes.includes(eventType)) {
                return false;
            }
            
            // Match criteria
            if (criteria) {
                switch (criteria) {
                    case 'Опыт более 3 лет':
                        if (master.experience < 3) return false;
                        break;
                    case 'Цена до 5000₽/час':
                        if (master.pricePerHour > 5000) return false;
                        break;
                    case 'Цена до 10000₽/час':
                        if (master.pricePerHour > 10000) return false;
                        break;
                    case 'Свободная дата':
                        if (!master.hasAvailableDates) return false;
                        break;
                    case 'Высокий рейтинг':
                        if (master.rating < 4.5) return false;
                        break;
                }
            }
            
            return true;
        });
        
        // Sort by rating
        filteredMasters.sort((a, b) => b.rating - a.rating);
        
        // Limit to top 5 results
        filteredMasters = filteredMasters.slice(0, 5);
        
        res.json(filteredMasters);
    } catch (error) {
        console.error('Error searching masters:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router; 