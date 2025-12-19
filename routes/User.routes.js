const express = require('express');
const router = express.Router()

const { getUserProfile } = require('../controllers/User.controller')
const authMiddleware = require('../middleware/Auth.middleware')





router.get("/profile/:id", authMiddleware(), getUserProfile )

module.exports = router;