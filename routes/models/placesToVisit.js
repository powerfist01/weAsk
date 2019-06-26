var mongoose = require('mongoose');
var Schema = mongoose.Schema; 
 
const placesSchema = new Schema({
    name: String,
    adder: String,
    votes: Number,
    voter: Array
});

var placesModel = mongoose.model('PlacesToVisit', placesSchema);

module.exports = {
    placesModel : placesModel
}