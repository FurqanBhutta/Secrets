import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
// import encrypt from "mongoose-encryption";
// import md5 from "md5";
// import bcrypt from "bcrypt";
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose'
/////////// passport local is dependency of passport local mongoose
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import findOrCreate from 'mongoose-findorcreate';


const saltRounds = 10;

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs"); 

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB');
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String,
    googleId: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});
userSchema.plugin( passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", (req,res)=>{
    res.render("home");
})
app.get("/login", (req,res)=>{
    res.render("login");
})
app.get("/register", (req,res)=>{
    res.render("register");
})
app.get("/secrets", (req,res)=>{
    if(req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
})
app.get("/logout", (req, res)=>{
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})
app.get("/auth/google", 
    passport.authenticate('google', {scope: ["profile"]})
)
app.get("/auth/google/secrets", 
    passport.authenticate('google', { failureRedirect: '/login' }),
    function(req, res) {
      // Successful authentication, redirect home.
      res.redirect("/secrets");
    });



app.post("/register", async(req,res)=>{
    try{
        User.register({username: req.body.username}, req.body.password, function(err, user){
            if(!err){
                passport.authenticate("local")(req,res,function(){
                    res.redirect("/secrets");
                })
            }
        })
    }catch(err){
        res.send(err);
    }
})

app.post("/login", async(req,res)=>{
    try{
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });

        req.login(user, function(err){
            if(!err){
                passport.authenticate("local")(req, res, function(){
                    res.redirect("/secrets");
                })

            }
        })
        
    }catch(err){
        res.send(err);
    }
})

app.listen(3000, ()=>{
    console.log("server started on port 3000");
})