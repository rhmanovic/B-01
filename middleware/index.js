var User = require('../models/user');
var Chapter = require('../models/chapter');
var path = require('path');
const keys = require('../config/keys');

function loggedOut(req, res, next) {
  if (req.session && req.session.userId) {
    return res.redirect('/profile');
  }
  return next();
}

function requiresLogin(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    var err = new Error('You must be logged in to view this page.');
    err.status = 401;
    return next(err);
  }
}



function requiresAdmin(req, res, next) {
  if (req.session && req.session.email === keys.admin.Id) {
    return next();
  } else {
    // var err = new Error('You are not Mr. Abdulrahman the Admin');
    // err.status = 401;
    // return next(err);
    return res.redirect('/')
  }

}


function requiresSubscription(req, res, next) {
  const {id1} = req.params;
  const {n} = req.query;
  console.log(req.session);


  var userId = req.session.userId

  
  Chapter.findById(id1).exec(function (error, chapter){
    if (error) {
      return next(error);
    } else {
      if (chapter.price > 0){
        if (req.session && userId){
          // not free
          // signed in
          // check if subscribed :)
          User.findById(userId).exec(function (error, user) {
            var subscription = user.subscription
            if (error) {
              return next(error);
            } else {
              function checkSubscription(sub) {
                return sub == chapter._id;
              }        
              var x = subscription.some(checkSubscription);
              if(x){
                // subscribed
                // can see
                return next();
              }else{
                // not subscribed
                // can not see
                res.sendFile(path.join(__dirname, '../privates/upLoads', 'notAllowed.PNG'));
              }
            }
          });
        } else {
          // not free
          // not signed in
          // can not see
          res.sendFile(path.join(__dirname, '../privates/upLoads', 'notAllowed.PNG'));
        }
      } else {
        // free any one can see
        return next();
      }
    }
  });
}



module.exports.loggedOut = loggedOut;
module.exports.requiresLogin = requiresLogin;
module.exports.requiresAdmin = requiresAdmin;
module.exports.requiresSubscription = requiresSubscription;


