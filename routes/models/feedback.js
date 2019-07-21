var mongoose = require('mongoose');
var Schema = mongoose.Schema; 
 
const feedbackSchema = new Schema({
    name: String,
    feedback: String,
    email: String,
    timestamp: Date 
});

var feedbackModel = mongoose.model('feedback', feedbackSchema);

module.exports = {
    feedbackModel : feedbackModel
}