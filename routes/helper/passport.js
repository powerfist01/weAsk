var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
var users = require('../models/users');
var config = require('../../config/config');

var cookieExtractor = function(req) {
    var token = null;
    if (req && req.cookies) {
        token = req.cookies['jwt'];
    }
    return token;
};

module.exports = function(passport) {
    var jwtOptions = {
        secretOrKey: config.secretOrKey
    }
    jwtOptions.jwtFromRequest = cookieExtractor;
    passport.use(new JwtStrategy(jwtOptions, function (jwt_payload, done) {
        users.userModel.findOne({username:jwt_payload.username},function(err,user){
            if(err)
                throw err;
            if(!user){
                console.log('No User!');
                return done(null, false);
            }
            else{
                console.log('User Found!');
                return done(null,user);
            }
        })
    }));
}
