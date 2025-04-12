import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
import encrypt from "mongoose-encryption";

const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set("view engine", "ejs"); 

main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://localhost:27017/userDB');
}

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = mongoose.model("User", userSchema);

app.get("/", (req,res)=>{
    res.render("home");
})
app.get("/login", (req,res)=>{
    res.render("login");
})
app.get("/register", (req,res)=>{
    res.render("register");
})

app.post("/register", async(req,res)=>{
    try{
        const newUser = new User({
            email: req.body.username,
            password: req.body.password
        })
        await newUser.save();
        res.render("secrets");
    }catch(err){
        res.send(err);
    }
})

app.post("/login", async(req,res)=>{
    try{
        const foundUser = await User.findOne({email: req.body.username});
        // console.log(foundUser);
        if(!foundUser){
            res.send("There is no account!");
        }else{
            if(foundUser.password === req.body.password){
                res.render("secrets");
            }else{
                res.send("Wrong Password!");
            }
        }
    }catch(err){
        res.send(err);
    }
})

app.listen(3000, ()=>{
    console.log("server started on port 3000");
})