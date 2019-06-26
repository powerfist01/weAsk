var mongoose = require('mongoose');
var Schema = mongoose.Schema; 
 
const restraunt = new Schema({
    name: String,
    adder: String,
    votes: Number
});

var restModel = mongoose.model('restModel', restraunt);

module.exports = {
    restModel : restModel
}