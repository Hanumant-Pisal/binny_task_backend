const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true },
    genre: [String],
    releaseYear: Number,
    director: String,
    cast: [String],
    synopsis: String,
    posterUrl: String,
    averageRating: { type: Number, default: 0 }
});

module.exports = mongoose.model('Movie', movieSchema);
