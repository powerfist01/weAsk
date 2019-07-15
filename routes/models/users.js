var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const user = new Schema({
    username: String,
    rollno: String,
    name:String,
	email: String,
    password: String,
    branch: String,
    story: Array,
    myStories: Array,
    myQuestions: Array,
    myPlaces: Array,
    myMovies: Array,
    myFeedbacks: Array,
    myRestraunts: Array,
    myTVShows: Array
}); 

var userModel = mongoose.model('User', user);

module.exports = {
    userModel : userModel
}