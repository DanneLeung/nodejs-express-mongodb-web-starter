var mongoose = require('mongoose');
var LocalStrategy = require('passport-local').Strategy;
var User = mongoose.model('Member');

module.exports = function (app, passport) {
  // serialize sessions
  passport.serializeUser(function (user, done) {
    //console.log("serializeUser:" + user);
    //var type = req.body.userType || req.session.userType;
    done(null, user.id);
  });

  passport.deserializeUser(function (req, id, done) {
    // check user type.
    // admin user
    User.findById(id, function (err, user) {
      //console.log("deserialize User from mongo: " + user);
      done(err, user);
    })
  });

  // use local strategy
  passport.use(new LocalStrategy({
      usernameField: 'username',
      passwordField: 'password',
      passReqToCallback: true
    },
    function (req, username, password, done) {
      User.findOne({
          $or: [
            {email: username.toLowerCase()},
            {mobile: username.toLowerCase()},
            {username: username.toLowerCase()}
          ]
        },
        function (err, user) {
          console.log("user is:", user);
          if (err) {
            return done(err);
          }
          if (!user) {
            console.log("user not found!");
            return done(null, false, {message: '用户不存在！'});
          }
          if (user != null && !user.authenticate(password)) {
            console.log("user input password is incorrect.");
            return done(null, false, {message: '用户名或密码不正确！'});
          }
          return done(null, user);
        }
      )
    }
  ))
}
;
