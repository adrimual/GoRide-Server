const session = require("express-session")
const bcrypt = require("bcrypt")
const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const flash = require("connect-flash")
const User = require('../models/user.model')

module.exports = app => {

    app.use(session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true,
        cookie: {
            maxAge: 24 * 600 * 60 * 1000
        }
    })
    )

    passport.serializeUser((user, next) => next(null, user._id))
    passport.deserializeUser((id, next) => {
        User.findById(id)
            .then(theUser => next(null, theUser))
            .catch(err => next(err))
    })

    app.use(flash())

    passport.use(new LocalStrategy({
        passReqToCallback: true
    }, (req, username, password, next) => {
        User.findOne({
                username
            })
            .then(user => {
                if (!user) {
                    return next(null, false, {
                        message: "Invalid username"
                    })
                }
                if (!bcrypt.compareSync(password, user.password)) {
                    return next(null, false, {
                        message: "Invalid password"
                    })
                }
                return next(null, user)
            })
            .catch(err => next(err))
    }))

    app.use(passport.initialize())
    app.use(passport.session())
}