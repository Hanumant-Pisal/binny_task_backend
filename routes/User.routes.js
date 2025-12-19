const express = require('express');
const router = express.Router()

const { getUserProfile, updateUserProfile } = require('../controllers/User.controller')
const authMiddleware = require('../middleware/Auth.middleware')





router.get("/profile", authMiddleware(), getUserProfile )
router.put("/update/:id", authMiddleware(),updateUserProfile)


module.exports = router;