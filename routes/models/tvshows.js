var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tvshows = new Schema({
    name : String,
    adder : String,
    votes : Number
})

var tvModel = mongoose.model('tvshows', tvshows);

module.exports = {
    tvModel : tvModel
}