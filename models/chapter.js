var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var ChapterSchema = new mongoose.Schema({
    name: String,
    sections: Array,
    sectionsLinks: Array,
    user: String,
    courseID: String,
    courseName: String,
    description: String,
    order: Number,
    price: Number,
    status: String
});

var Chapter = mongoose.model('chapter', ChapterSchema);
module.exports = Chapter;
