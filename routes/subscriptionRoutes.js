const router = require('express').Router();
const subscriptionController = require('../controller/subscriptionController');

// Add a new subscriber with fullname, email, and message
router.post('/addQueries', subscriptionController.addSubscription);

// Get all subscribers
router.get('/getAllQueries', subscriptionController.getAllSubscriptions);

module.exports = router;
