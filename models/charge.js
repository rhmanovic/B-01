var mongoose = require('mongoose');
var bcrypt = require('bcryptjs');
var ChargeSchema = new mongoose.Schema({
    courseId : String,
    chapterId : String,
    courseName : String, 
    chapterName : String,
    userId : String, 
    teacherId : String, 
    userEmail : String, 
    price : String, 
    charge : String, 
    // this will create date automaticaly so I can qurey by date.
    time : { type : Date, default: Date.now }, 
});

var Charge = mongoose.model('charge', ChargeSchema);
module.exports = Charge;


