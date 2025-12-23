const express = require('express');
const router = express.Router()
const { getMovies, addMovie, updateMovie } = require('../controllers/Movie.controller')
const authMiddleware = require('../middleware/Auth.middleware')



router.get("/movies", authMiddleware(), getMovies);
router.post("/movies", authMiddleware(), addMovie);
router.put("/:id", authMiddleware(), updateMovie);

module.exports = router;