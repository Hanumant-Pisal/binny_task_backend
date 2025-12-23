const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    title: { type: String, required: true, index: true },
    genre: [{ type: String, index: true }],
    releaseYear: { type: Number, index: true },
    director: String,
    cast: [String],
    synopsis: String,
    posterUrl: String,
    averageRating: { type: Number, default: 0, index: true }
}, {
    timestamps: true,
    collection: 'movies'
});

movieSchema.index({ title: 'text', director: 'text' });

module.exports = mongoose.model('Movie', movieSchema);
