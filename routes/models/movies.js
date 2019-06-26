var mongoose = require('mongoose');
var Schema = mongoose.Schema; 
 
const movieSchema = new Schema({
    name: String,
    adder: String,
    votes: Number,
    voter: Array
});

var movieModel = mongoose.model('movies', movieSchema);

module.exports = {
    movieModel : movieModel
}