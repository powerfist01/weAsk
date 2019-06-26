var mongoose = require('mongoose');
var Schema = mongoose.Schema; 
 
const qna = new Schema({
    questioner: String,
    answerer:Array,
    question:String,
    timestamp: Date,
    answer: Array,
    upvotes: Number
});

var qnaModel = mongoose.model('Questions', qna);

module.exports = {
    qnaModel : qnaModel
}