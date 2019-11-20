var express = require('express');
var path = require('path');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var config = require('./config/config.js');
var session = require('express-session');
var cookieParser = require('cookie-parser');
require('dotenv').config();
var tvshows = require('./routes/models/tvshows');
var story = require('./routes/models/story');
var movies = require('./routes/models/movies');
var feedback = require('./routes/models/feedback');
var places = require('./routes/models/placesToVisit');
var users = require('./routes/models/users');
var question = require('./routes/models/question');
var jwt = require('jsonwebtoken');

var passport = require("passport");
require('./routes/helper/passport')(passport);
var restraunts = require('./routes/models/restraunts');
var nodemailer = require('nodemailer');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({ secret: config.sessionSecret, saveUninitialized: true, resave: false }));
app.use(cookieParser());

app.set("view engine", "ejs");
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

var url = config.dbURL;
mongoose.Promise = global.Promise;

mongoose.connect(url, { useNewUrlParser: true });
var db = mongoose.connection;
db.on('error', function (err) {
    throw err;
});

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'sujeets307@gmail.com',
        pass: '#1sujeet@NITH'
    }
});

db.once('open', function () {
    console.log('Connected to database!');
})

app.get('/', function (req, res, next) {
    var token = req.cookies['jwt'];
    if (token) {
        var decoded = jwt.decode(token, { complete: true });
        req.session.username = decoded.payload.username;
        req.session.userid = decoded.payload.id;
        console.log(req.session.username);
        res.redirect('/dashboard');
    }
    else
        res.render('index');
})

app.route('/signup')
    .get(function (req, res, next) {
        res.render('signup', { message: '' });
    })
    .post(function (req, res, next) {
        users.userModel.findOne({ username: req.body.username }, function (err, doc) {
            if (err)
                throw err;
            if (doc != null) {
                console.log("Username already exists!");
                res.render('signup', { message: 'Username already exists!' });
            }
            else {
                var myUser = new users.userModel(req.body);
                myUser.save(function (err) {
                    if (err)
                        throw err;
                    else
                        console.log('User added to the Database!');
                })
                res.redirect('/login');
            }
        })
    })

var token = '';
app.route('/login')
    .get(function (req, res, next) {
        var token = req.cookies['jwt'];
        if (token) {
            var decoded = jwt.decode(token, { complete: true });
            req.session.username = decoded.payload.username;
            req.session.userid = decoded.payload.id;
            res.redirect('/dashboard');
        }
        else {
            res.render('login', { message: '' })
        }
    })
    .post(function (req, res, next) {
        console.log(req.body);
        users.userModel.findOne({ username: req.body.username }, function (err, doc) {
            if (err)
                throw err;
            if (doc != null) {
                if (doc.password === req.body.password) {
                    req.session.username = req.body.username;
                    var payload = {
                        id: doc._id,
                        username: doc.username,
                        password: doc.password,
                        email: doc.email
                    }

                    token = jwt.sign(payload, config.secretOrKey);
                    res.cookie('jwt', token);
                    res.redirect('/dashboard');
                }
                else {
                    console.log('Invalid Credentials');
                    res.render('login', { message: 'Invalid Credentials' });
                }
            }
            else {
                console.log('User not found');
                res.render('login', { message: 'User not found ' });
            }
        })
    })

function createOTP() {
    var temp = Math.random();
    temp = temp * 10000;
    temp = Math.floor(temp);
    temp = temp.toString();
    while (temp.length == 1 || temp.length == 2 || temp.length == 3) {
        temp = Math.random();
        temp = temp * 10000;
        temp = Math.floor(temp);
        temp = temp.toString();
    }
    return temp;
}

var OTP = '';
var emailId = '';
app.route('/forgotPass')
    .get(function (req, res, next) {
        res.render('forgot', { message: '' })
    })
    .post(function (req, res, next) {
        users.userModel.findOne({email:req.body.id},function(err,user){
            if(err)
                throw err;
            if(!user){
                console.log('User not found!');
                var msg = 'User email not found!';
                res.render('forgot', { message: msg });
            }
        })
        OTP = createOTP();
        var mailOptions = {
            from: 'noreply@gmail.com',
            to: req.body.id,
            subject: 'Your OTP will expire in 10 minutes,not really :)',
            text: OTP
        };

        transporter.sendMail(mailOptions, function (err, info) {
            if (error) {
                throw err;
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    })

app.post('/confirmOTP', function (req, res, next) {
    if (req.body.otp == OTP) {
        res.redirect('/changePass')
    } else {
        console.log('Wrong OTP');
        res.render('forgot', { message: 'Wrong OTP' });
    }
})

app.route('/changePass')
    .get(function (req, res, next) {
        res.render('changePassword', { message: '' });
    })
    .post(async function (req, res, next) {
        await users.userModel.where({ email: emailId }, function (err, doc) {
            if (err)
                throw err;
            if (!doc) {
                console.log('User not found!');
                res.render('changePassword', { message: 'User not found!' })
            }
            resolve('done');
        }).updateOne({ $set: { password: req.body.password } }).exec();
        res.redirect('/login');
    })

app.get('/dashboard', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
    var token = req.cookies['jwt'];
    if (token) {
        var decoded = jwt.decode(token, { complete: true });
        req.session.username = decoded.payload.username;
        req.session.userid = decoded.payload.id;
    }
    console.log(decoded.payload)
    var res1 = await new Promise(function (resolve, reject) {
        question.qnaModel.find({}, function (err, ques) {
            if (err)
                throw err;
            else {
                resolve(ques);
            }
        }).sort({ timestamp: -1 });
    })

    var res2 = await new Promise(function (resolve, reject) {
        story.storyModel.find({}, function (err, story) {
            if (err)
                throw err;
            else {
                resolve(story);
            }
        }).sort({ timestamp: -1 }).limit(5);
    })
    res.render('dashboard', { username: req.session.username, data: res1, story: res2, token: token });
})

app.get('/trivia', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
    res.render('comingsoon');
})

app.get('/talktosomeone', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
    res.redirect('http://localhost:3000/rooms');
})

app.get('/story', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
    var res1 = await new Promise(function (resolve, reject) {
        story.storyModel.find({}, function (err, story) {
            if (err)
                throw err;
            else {
                resolve(story);
            }
        }).sort({ votes: -1 }).limit(7);
    })

    res.render('story', { story: res1});
})

app.get('/allStories',  async function (req, res, next) {
    var res1 = await new Promise(function (resolve, reject) {
        story.storyModel.find({}, function (err, story) {
            if (err)
                throw err;
            else {
                resolve(story);
            }
        });
    })
    res.render('allPage', { story: res1});
})

app.post('/upvote',function(req,res,next){
    var issue = req.body.issue;
    if(issue == 'story'){
        story.storyModel.where({ _id: req.session.storyId }).updateMany({ $inc:{ votes: 1}, $push: {voter: req.session.username} }).exec();
        users.userModel.where({_id: req.session.userid}).updateOne({$push: {story: req.session.storyTitle }}).exec();
    }
    res.send('done');
})

app.post('/downvote',function(req,res,next){
    var issue = req.body.issue;
    if(issue == 'story'){
        story.storyModel.where({ _id: req.session.storyId }).updateOne({ $inc:{ votes: -1} }).exec();
    }
    res.send('done');
})


app.post('/getStory', passport.authenticate('jwt', { session: false }), async function (req, res, next) {
    let topic = req.body.storyTitle;
    req.session.storyTitle = topic;
    req.session.storyId = req.body.storyId;

    var res1 = await new Promise(function (resolve, reject) {
        story.storyModel.find({ topic: topic }, function (err, oneStory) {
            if (err)
                throw err;
            if (!oneStory)
                console.log('Not Found');
            resolve(oneStory);
        })
    })
    console.log(res1);
    res1[0].uername = req.session.username;
    console.log(res1);
    res.send(res1);
})

//For Extras Page
app.get('/extras', passport.authenticate('jwt', { session: false }), async function (req, res, next) {

    var res1 = await new Promise((resolve, reject) => {
        tvshows.tvModel.find({}, function (err, tv) {
            if (err)
                throw err;
            else {
                resolve(tv);
            }
        }).sort({ votes: -1 }).limit(5)
    })

    var res2 = await new Promise((resolve, reject) => {
        restraunts.restModel.find({}, function (err, rest) {
            if (err)
                throw err;
            else {
                resolve(rest);
            }
        }).sort({ votes: -1 }).limit(5)
    })

    var res3 = await new Promise((resolve, reject) => {
        places.placesModel.find({}, function (err, place) {
            if (err)
                throw err;
            else {
                resolve(place);
            }
        }).sort({ votes: -1 }).limit(5)
    })

    var res4 = await new Promise((resolve, reject) => {
        movies.movieModel.find({}, function (err, movie) {
            if (err)
                throw err;
            else {
                resolve(movie);
            }
        }).sort({ votes: -1 }).limit(5)
    })

    //console.log(res4);

    res.render('extras', { tvShows: res1, restraunts: res2, places: res3, movies: res4 });
})

app.post('/addTvShow', function (req, res, next) {
    console.log(req.body);
    var tvshow = new tvshows.tvModel({
        name: req.body.showName,
        adder: req.session.username,
        votes: 1
    })
    tvshow.save(function (err) {
        if (err)
            throw err;
        console.log('TV Show added to database!');
    })
    res.redirect('/extras');
})

app.post('/addRestraunt', function (req, res, next) {
    console.log(req.body);
    var restraunt = new restraunts.restModel({
        name: req.body.restName,
        adder: req.session.username,
        votes: 1
    })
    restraunt.save(function (err) {
        if (err)
            throw err;
        console.log('Restraunt added to database!');
    })
    res.redirect('/extras');
})

app.post('/addPlaces', function (req, res, next) {
    console.log(req.body);
    var place = new places.placesModel({
        name: req.body.placeName,
        adder: req.session.username,
        votes: 1
    })
    place.save(function (err) {
        if (err)
            throw err;
        console.log('Place added to database!');
    })
    res.redirect('/extras');
})

app.post('/addMovies', function (req, res, next) {
    console.log(req.body);
    var movie = new movies.movieModel({
        name: req.body.movieName,
        adder: req.session.username,
        votes: 1
    })
    movie.save(function (err) {
        if (err)
            throw err;
        console.log('Place added to database!');
    })
    res.redirect('/extras');
})


//Posting Questins
app.post('/posting', function (req, res, next) {
    var newQuestion = new question.qnaModel({
        questioner: req.session.username,
        question: req.body.question,
        timestamp: new Date()
    })
    newQuestion.save(function (err) {
        if (err)
            throw err;
        else
            console.log('Question saved to database!');
    })
    res.redirect('/dashboard');
})


//Posting a story
app.post('/storyPost', function (req, res, next) {
    var newStory = new story.storyModel({
        topic: req.body.topic,
        content: req.body.content,
        votes: 1,
        voter: [req.session.username],
        author: req.session.username,
        timestamp: new Date()
    })
    newStory.save(function (err) {
        if (err)
            throw err;
        console.log('Story saved to database!');
    })
    res.redirect('/dashboard');
})

//Answering a Question
app.post('/answering', function (req, res, next) {
    console.log(req.body);
    question.qnaModel.where({ _id: req.body.questionId }).updateOne({ $push: { answer: req.body.answer, answerer: req.session.username } }).exec();
    res.redirect('/dashboard');
})


//For Settings in settings
app.get('/settings', passport.authenticate('jwt', { session: false }), function (req, res, next) {
    res.render('settings', { username: req.session.username, message: '' });
})


app.post('/updateUsername', function (req, res, next) {
    users.userModel.findOne({ username: req.body.username }, function (err, doc) {
        if (err)
            console.log(err);
        if (doc != null) {
            console.log("Username already exists!");
            res.render('settings', { message: 'Username already exists!' });
        }
        else {
            users.userModel.where({ _id: req.session.userid }).updateOne({ $set: { username: req.body.username } }).exec();
            req.session.username = req.body.username;
            res.redirect('/settings')
        }
    })
})

app.post('/updatename', function (req, res, next) {
    console.log(req.body.name);
    users.userModel.where({ _id: req.session.userid }).updateOne({ $set: { name: req.body.name } }).exec();
    res.redirect('/settings');
})

app.post('/updateemail', function (req, res, next) {
    console.log(req.body);
    users.userModel.where({ _id: req.session.userid }).updateOne({ $set: { email: req.body.email } }).exec();
    res.redirect('/settings')
})

app.post('/updatepassword', function (req, res, next) {
    console.log(req.body);
    users.userModel.where({ _id: req.session.userid }).updateOne({ $set: { password: req.body.password } }).exec();
    res.redirect('/settings')
})

//For image Uploads using multer
// const upload = multer({
//     dest: "/home/powerfist01/Dinghy/uploads"
// });
// app.post("/upload",upload.single("file"),function(req, res){
//     const tempPath = req.file.path;
//     const targetPath = path.join(__dirname, "./uploads/"+ req.session.name + path.extname(req.file.originalname));

//     fs.rename(tempPath, targetPath,function(err){
//         if(err)
//             throw err;
//         res.redirect('/settings');
//     });
//     res.redirect('/settings');
// });

app.get('/profile',function(req,res,next){
    res.render('profile',{message: ''});
})

//For logout
app.get('/logout', function (req, res, next) {
    req.session.destroy();
    res.cookie('jwt', '', { maxAge: 0 });
    res.redirect('/');
})

app.route('/feedback')
    .get(passport.authenticate('jwt', { session: false }), function (req, res, next) {
        res.render('feedback');
    })
    .post(function (req, res, next) {
        console.log(req.body);
        var newFeedback = new feedback.feedbackModel({
            name: req.body.name,
            email: req.body.email,
            feedback: req.body.message,
            timestamp: Date()
        })

        newFeedback.save(function (err) {
            if (err)
                console.log(err);
            console.log('Feedback saved in the database!');
        })
        res.redirect('/feedback');
    })

//For running the server
app.set('port', process.env.PORT || 3000);

app.listen(app.get('port'), function (err) {
    if (err)
        console.log(err);
    console.log('Running on http://localhost:%s', app.get('port'));
})
