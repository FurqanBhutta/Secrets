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
    password: String
});

// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});
userSchema.plugin( passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


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