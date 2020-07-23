var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var CourseSchema = new mongoose.Schema({
    name: String,
    img: String,
    chapters: Array,
    chaptersLinks: Array,
    user: String,
    teacherName: String,
    teacherID: String
});

var Course = mongoose.model('course', CourseSchema);
module.exports = Course;
