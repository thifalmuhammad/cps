const express = require('express');
const router = express.Router();
const { registerUser, getAllUsers, getUserByUuid } = require('../controllers/userController');

// User routes
router.post('/users/register', registerUser);
router.get('/users', getAllUsers);
router.get('/users/:uuid', getUserByUuid);

module.exports = router;
