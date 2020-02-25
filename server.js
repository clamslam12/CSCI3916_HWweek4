var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');
var passport = require('passport');
var authController = require('./auth');
var authJwtController = require('./auth_jwt');
db = require('./db')(); //global hack
var jwt = require('jsonwebtoken');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

function getJSONObject(req) {
    var json = {
        headers : "No Headers",
        key: process.env.UNIQUE_KEY,
        body : "No Body",
        status: 200,
        query: "No query"
    };


    if (req.body != null) {
        json.body = req.body;
    }
    if (req.headers != null) {
        json.headers = req.headers;
    }

    if(req.query != null)
    {
        json.query = req.query
    }

    return json;
}

router.route('/post')
    .post(authController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            var o = getJSONObject(req);
            res.json(o);
        }
    );

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please pass username and password.'});
    } else {
        var newUser = {
            username: req.body.username,
            password: req.body.password
        };
        // save the user
        db.save(newUser); //no duplicate checking
        res.json({success: true, msg: 'Successful created new user.'});
    }
});

router.post('/signin', function(req, res) {

        var user = db.findOne(req.body.username);

        if (!user) {
            res.status(401).send({success: false, msg: 'Authentication failed. User not found.'});
        }
        else {
            // check if password matches
            if (req.body.password == user.password)  {
                var userToken = { id : user.id, username: user.username };
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            }
            else {
                res.status(401).send({success: false, msg: 'Authentication failed. Wrong password.'});
            }
        };
});

router.get('/movies', function(req, res) {
    console.log(req);
    var res1 = getJSONObject(req)
    res.send({status: res1.status, message: "GET movies", headers: res1.headers, query: res1.query, env: res1.key});



});

router.post('/movies', function(req, res) {
    console.log(req);
    var res1 = getJSONObject(req)
    res.send({status: res1.status, message: "movie saved", headers: res1.headers, query: res1.query, env: res1.key});



});

router.route('/movies')
    .put(authJwtController.isAuthenticated, function (req, res) {
        var res1 = getJSONObject(req)
        res.send({status: res1.status, message: "movie updated", headers: res1.headers, query: res1.query, env: res1.key});

        }
    );

router.route('/movies')
    .delete(authJwtController.isAuthenticated, function (req, res) {
            var res1 = getJSONObject(req)
            res.send({status: res1.status, message: "movie deleted", headers: res1.headers, query: res1.query, env: res1.key});

        }
    );

app.use('/', router);
app.listen(process.env.PORT || 8080);

module.exports = app; // for testing