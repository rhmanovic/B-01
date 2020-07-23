var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Charge = require('../models/charge');
var Chapter = require('../models/chapter');
var Course = require('../models/course');
var mid = require('../middleware');

var nodemailer = require('nodemailer');



router.get('/forgotPassword', function(req, res, next) {
  // res.render('forgotPassword', { title: 'Reset Password'} )
  return res.render('forgotPassword', { title: 'Reset Password'});
})

router.post('/sendResetEmail', function(req, res, next) {

  const output = 'Email Body';

  // console.log(req.body.email);
  // res.send(req.body.email);

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    // host: 'smtp.ethereal.email',
    // port: 587,
    // secure: false, // true for 465, false for other ports
    auth: {
      user: "add014mam@gmail.com", // generated ethereal user
      pass: "Aldhufiri014" // generated ethereal password
    }
  });

  let mailOptions = {
    from: 'add014mam@gmail.com',
    to: req.body.email,
    subject: 'Resset Password',
    text: 'You are trying to reset your password!'
  }

  transporter.sendMail(mailOptions, function(err, data){
    if (err) {
      console.log(err)
      res.send('error ocurs');
    } else {
      res.send('email sent!!!');
    }
  });

})


// Get  /Course
router.get('/Course/:id', function(req, res, next) {
  const {id} = req.params;
  Course.findOne({_id: id}).exec(function (error, courseData){
    if (error){
      // console.log(error.name);
      if (error.name == 'CastError') {
        var err = new Error('File Not Found');
        err.status = 404;
        next(err);
      }
      return next(error);
    } else {
      var find = Chapter.find({courseID: id}).sort( { order: 1 } ).exec(function (error, ChaptersData){
        try {
          // // console.log(ChaptersData)
          var ChaptersDataEdited = [];

          if (req.session.userId){
            // console.log(req.session.userId);
            var subscriptions = User.findById(req.session.userId)
              .exec(function (error, user) {
                if (error) {
                  return next(error);
                } else {
                  // // console.log( "name:"+ user.name+ " / favorite:"+ user.favoriteBook + " / subscription:" + user.subscription );
                  // console.log('xxx---xxxx')
                  passPermitedLinks(user.subscription);
                }
            })
          } else {
            passPermitedLinks("NoUserSignedIn")
          }

          function passPermitedLinks(subscription){
            try {

              for (const chapter of ChaptersData){
                
                if (chapter.price > 0){
                  // console.log(chapter._id)
                  
                  if (subscription != "NoUserSignedIn"){
                    function checkSubscription(sub) {
                      return sub == chapter._id;
                    }

                    
                    var x = subscription.some(checkSubscription);
                    // console.log(subscription.some(checkSubscription))
                  }
                  

                  if(x){
                    // not free ==> But subscribed
                    chapter.status='subscribed';
                  }else{
                    // not free not subscribed
                    chapter.sectionsLinks= [null];
                  }
                  // chapter is not free the user can not see links unless he has paid
                  
                } else {
                  // chapter is free the user can see links
                  chapter.status='free';
                }
              }
              return res.render('Course', { title: 'Course', courseData: courseData, ChaptersData:ChaptersData});
            } catch (e){
              return next(e);
            }
          } 
        } catch (e){
          return next(e);
        }

      })
    }
  });
});


// GET /redirect
router.get('/redirect', function(req, res, next) {
  // console.log("__________Redirect has been called______");
  
  const {tap_id} = req.query;
  console.log(tap_id);

  var http = require("https");

  var options = {
    "method": "GET",
    "hostname": `api.tap.company`,
    "port": null,
    "path": `/v2/charges/${tap_id}`,
    "headers": {
      "authorization": "Bearer sk_test_XKokBfNWv6FIYuTMg5sLPjhJ"
    }
  };

  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      console.log(body.toString());
    });
  });

  req.write("{}");
  req.end();
  
});


router.get('/redirect2', function(req,res,next){
  var request = require("request");

  // console.log("__________Redirect2 has been called______");
  
  const {tap_id} = req.query;
  // console.log(tap_id);

  var options = { method: 'GET',
    url: `https://api.tap.company/v2/charges/${tap_id}`,
    headers: { authorization: 'Bearer sk_test_XKokBfNWv6FIYuTMg5sLPjhJ' },
    body: '{}' };

  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    
    bodyJSON = JSON.parse(body)
    // console.log(body);
    
    const status = bodyJSON.response.message
    const courseName = bodyJSON.metadata.courseName
    const chapterName = bodyJSON.metadata.chapterName
    const courseId = bodyJSON.metadata.courseId
    const price = bodyJSON.metadata.price
    console.log(`_Redirect2 _______________________________`)
    console.log(`   - Charge Id=${bodyJSON.id}`)
    console.log(`   - status = ${status}`)
    console.log(`   - MetaData = ${JSON.stringify(bodyJSON.metadata)}`)
    // console.log(`   - Chapter Name="${chapterName}"`)
    // console.log(`   - Price =${price} KD`)
    
    console.log(`__________________________________________`)
    // console.log(`   - response =${bodyJSON.response}`)
    

    return res.render('redirect', { title: 'Payment Statment', status:status, courseName:courseName, chapterName:chapterName, status:status, price:price, courseId:courseId})
  });

});

// GET /pay
// router.get('/pay', function(req, res, next) {
//   const {ch} = req.query;
//   // console.log('you are going to pay for:' + ch)
//   return res.render('pay', { title: 'Courses'})
//   // this should be after payment done
//   // arr_update_dict = { "$push": {} }; 
//   // arr_update_dict["$push"]["subscription"] = ch ;
//   // User.findOneAndUpdate({_id: req.session.userId},arr_update_dict).then(function(){
//   //   res.redirect('/')
//   // }).catch(function(e){
//   //   return next(e);
//   // })
// });

// post /pay /// this should connet tap payment
router.post('/pay',async function(req, res1, next) {
  var http = require("https");
  const id = req.body.chapterId;
  const host = req.headers.host;
  const referer = req.headers.referer;
  
  const courseId = referer.slice(-24);
  // console.log(req.session);
  
  Chapter.findOne({_id: id}).exec(function (error, ChaptersData){
    if (error){
      // console.log(error.name);
      if (error.name == 'CastError') {
        var err = new Error('File Not Found');
        err.status = 404;
        next(err);
      }
      return next(error);
    } else {
      payforThis(ChaptersData, req.session.email, req.session.userId)
    }
  })

  function payforThis(ChaptersData, email, userId){
    var options = {
      "method": "POST",
      "hostname": "api.tap.company",
      "port": null,
      "path": "/v2/charges",
      "headers": {
        "authorization": "Bearer sk_test_XKokBfNWv6FIYuTMg5sLPjhJ",
        "content-type": "application/json"
      }
    };

    console.log(ChaptersData)
    var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
        chunks.push(chunk);
      });

      res.on("end", function () {
        var body = Buffer.concat(chunks);
        // // console.log(body.toString());
        var profile = JSON.parse(body);
        transactionUrl = profile.transaction.url;
        // console.log(profile.metadata);
        return res1.redirect(transactionUrl)
      });
    });

    req.write(JSON.stringify({
      amount: ChaptersData.price,
      currency: 'KWD',
      threeDSecure: true,
      save_card: false,
      description: 'chapter payment',
      statement_descriptor: ChaptersData._id,

      metadata: {
        chapterId: ChaptersData._id,
        courseId: ChaptersData.courseID,
        userId: userId,
        teacherId: ChaptersData.user,
        userEmail: email,
        price: ChaptersData.price,
        courseName: ChaptersData.courseName,
        chapterName: ChaptersData.name,
      },

      reference: { transaction: 'txn_0001', order: 'ord_0001' },
      receipt: { email: false, sms: true },
      customer: 
      { first_name: 'test',
        middle_name: userId,
        last_name: 'test',
        email: email,
        phone: { country_code: '965', number: '50000000' } },
      source: { id: 'src_kw.knet' },
      post: { url: `https://${host}/getPay` },
      redirect: { url: `https://${host}/redirect2` } }));
    req.end();
  }
});

// GET /Courses Page /safe
router.get('/', function(req, res, next) {
    Course.find({}).exec(function (error, courseData){
      if (error){
        return next(error);
      } else {   
        return res.render('CoursesPage', { title: 'Home Page', courseData: courseData, length: courseData.length});
      }
    });
});

//////////////////////////////////////////////////////////////////////

// GET /profile /safe
router.get('/profile', mid.requiresLogin, function(req, res, next) {
  User.findById(req.session.userId, {'password':0})
      .exec(function (error, user) {
        if (error) {
          return next(error);
        } else {
          const subscriptions = user.subscription;
          
          subscriptions.forEach(function (value, i) {
            // console.log('%d: %s', i, value);
            // console.log('   charge: %s', user.charge[i]);
            // console.log('   courseName: %s', user.courseName[i], );
            // console.log('   chapterName: %s', user.chapterName[i], );
          });
          return res.render('profile', { title: 'Profile', name: user.name, favorite: user.favoriteBook, subscriptions: user.charge });
        }
      });
});

// GET /logout
router.get('/logout', function(req, res, next) {
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
});

// GET /login
router.get('/login', mid.loggedOut, function(req, res, next) {
  return res.render('login', { title: 'Log In'});
});

// POST /login
router.post('/login', function(req, res, next) {
  console.log(req)
  // console.log('login from main')
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email.toLowerCase(), req.body.password, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        return next(err);
      }  else {
        req.session.userId = user._id;
        req.session.email = user.email;
        // return res.redirect('/');
        req.session.save(function(err) {
          // session saved
          res.redirect('/')
        })
      }
    });
  } else {
    var err = new Error('Email and password are required.');
    err.status = 401;
    return next(err);
  }
});

// GET /register
router.get('/register', mid.loggedOut, function(req, res, next) {
  return res.render('register', { title: 'Sign Up' });
});

// POST /register
router.post('/register', function(req, res, next) {
  console.log(req)
  if (req.body.email &&
    req.body.name &&
    req.body.password &&
    req.body.confirmPassword) {

      // confirm that user typed same password twice
      if (req.body.password !== req.body.confirmPassword) {
        var err = new Error('Passwords do not match.');
        err.status = 400;
        return next(err);
      }

      // create object with form input
      var userData = {
        email: req.body.email.toLowerCase(),
        name: req.body.name,
        favoriteBook: req.body.favoriteBook,
        password: req.body.password,
      };

      // use schema's `create` method to insert document into Mongo
      User.create(userData, function (error, user) {
        if (error) {
          console.log(error.code);
          if (error.code === 11000){
            // res.redirect('back')
            var err = new Error('Email already registered.');
            // err.status = 400;
            return next(err);
          }
          return next(error);
        } else {
          req.session.userId = user._id;
          req.session.email = user.email;
          req.session.save(function(err) {
            // session saved
            res.redirect('/')
          })
          // return res.redirect('/');
        }
      });

    } else {
      var err = new Error('All fields required.');
      err.status = 400;
      return next(err);
    }
})

// GET / /safe
// router.get('/' , function(req, res, next) {
//   return res.render('index', { title: 'Home' });
// });


// POST /
router.post('/getPay' , function(req, res, next) {
  // 
  // console.log(req.body.status)

  if (req.body.status == 'FAILED'){
    console.log('Payment has been failed')
    return res.send('Payment has been failed');
  }


  var chargeData = {
    courseId : req.body.metadata.courseId,
    chapterId : req.body.metadata.chapterId,
    courseName : req.body.metadata.courseName,
    chapterName : req.body.metadata.chapterName,
    userId : req.body.metadata.userId,
    teacherId : req.body.metadata.teacherId,
    userEmail : req.body.metadata.userEmail,
    price : req.body.metadata.price,
    charge : req.body.id,
  }

  console.log(`*getPay***********************************`)
  console.log(`   - courseId = ${chargeData.courseId}`)
  console.log(`   - chapterId = ${chargeData.chapterId}`)
  console.log(`   - userEmail = ${chargeData.userEmail}`)
  console.log(`   - userId = ${chargeData.userId}`)
  console.log(`   - charge = ${chargeData.charge}`)
  console.log(`   - teacherId = ${chargeData.teacherId}`)
  console.log(`   - price = ${chargeData.price}`)
  console.log(`******************************************`)

  User.findOneAndUpdate({_id: chargeData.userId},
    {$push:
      {
        subscription: chargeData.chapterId,
        charge: chargeData.charge,
        courseName: chargeData.courseName,
        chapterName: chargeData.chapterName,
      }
    }).then(function(){

      Charge.create(chargeData, function (error, user) {
        if (error) {
          console.log(error.code);
        } else {
          return res.send('getPay has been called -1');
        }
      });
    
  }).catch(function(error){
    return next(error);
  });
  
  // return res.send('getPay has been called -2');
});



// GET /about /safe
router.get('/about', function(req, res, next) {
  return res.render('about', { title: 'About' });
});

// GET /contact /safe
router.get('/contact', function(req, res, next) {
  return res.render('contact', { title: 'Contact' });
});



module.exports = router;
