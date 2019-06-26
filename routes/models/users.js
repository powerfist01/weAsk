var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const user = new Schema({
    username: String,
    rollno: String,
    name:String,
	email: String,
    password: String,
    branch: String
}); 

var userModel = mongoose.model('User', user);

module.exports = {
    userModel : userModel
}