var express = require('express');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var session = require('express-session');
var MongoStore = require('connect-mongo')(session);
var mid = require('./middleware');
const passport = require('passport');
const passportSetup = require('./config/passport-setup');
var multer = require('multer');
const keys = require('./config/keys');

var routes = require('./routes/index');
var privates = require('./privates/index');
var routesAdmin = require('./routes/admin/index');
const authRoutes = require('./routes/auth-routes');
const profileRoutes = require('./routes/profile-routes');

var app = express();

// set view engine
app.set('view engine', 'pug');

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// connect to mongodb ATLAS
mongoose.set('useNewUrlParser', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
mongoose.connect(keys.mongodb.dbURI, () => { console.log('connected to mongodb') });
var db = mongoose.connection;


// dublicted in app an admin
const storage = multer.diskStorage({
  destination: './privates/index/upLoads',
  filename: function(req,file,cb){
    cb(null,file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});
// init upload
const upload = multer({
  storage: storage
}).single('myFile');

mongoose.set('useNewUrlParser', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);


// mongodb ATLAS connection
// const connectionString = 'mongodb+srv://user02:Aa66787785@cluster0-hmsvk.gcp.mongodb.net/test?retryWrites=true'
// var db = mongoose.connection;
// mongoose.connect(connectionString)


// mongo error
db.on('error', console.error.bind(console, 'connection error:'));



// use sessions for tracking logins
app.use(session({
  secret: 'We loves you',
  resave: true,
  saveUninitialized: false,
  store: new MongoStore({
    mongooseConnection: db
  })
}));

// make user ID available in templates
app.use(function (req, res, next) {
  res.locals.currentUser = req.session.userId;
  next();
});





// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// serve static files from /public
app.use(express.static(__dirname + '/public'));


// include routes
app.use('/', routes);
app.use('/auth', authRoutes);
app.use('/privates', privates);
app.use('/admin', routesAdmin);
app.use('/profile', profileRoutes);
app.set('views', __dirname + '/views');
app.set('views/admin', __dirname + '/views/admin');


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('File Not Found');
  err.status = 404;
  next(err);
});

// error handler
// define as the last app.use callback
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

// listen on port 5000
app.listen(3000, function () {
  console.log('Express app listening on port 3000');
});


app.use(function(err, req, res, next) {
    res.status(err.status || 500)
    // .json(response.error(err.status || 500));
});
