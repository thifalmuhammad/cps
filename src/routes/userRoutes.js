const express = require('express');
const router = express.Router();
const { registerUser, getAllUsers, getUserByUuid, loginUser } = require('../controllers/userController');

// User routes
router.post('/users/register', registerUser);
router.post('/users/login', loginUser);
router.get('/users', getAllUsers);
router.get('/users/:uuid', getUserByUuid);

module.exports = router;
