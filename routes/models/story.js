var mongoose = require('mongoose');
var Schema = mongoose.Schema; 
 
const storySchema = new Schema({
    topic: String,
    content: String,
    votes: Number,
    voter: Array,
    author: String,
    timestamp: Date
});

var storyModel = mongoose.model('stories', storySchema);

module.exports = {
    storyModel : storyModel
}