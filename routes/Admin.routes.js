const express = require('express');
const router = express.Router()

const { getAdminStats, getAllUsers, deleteUser, deleteMovie } = require('../controllers/Admin.controller')
const authMiddleware = require('../middleware/Auth.middleware')


router.use(authMiddleware('admin'));


router.get('/stats', getAdminStats);


router.get('/users', getAllUsers);
router.delete('/users/:userId', deleteUser);



router.delete('/movies/:movieId', deleteMovie);



module.exports = router;