import 'dotenv/config';
import express from "express";
import bodyParser from "body-parser";
import ejs from "ejs";
import mongoose from "mongoose";
// import encrypt from "mongoose-encryption";
// import md5 from "md5";
import bcrypt from "bcrypt";

const saltRounds = 10;

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


// userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

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
        const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
            const newUser = new User({
                email: req.body.username,
                password: hashedPassword
            })
            await newUser.save();
            res.render("secrets");
    }catch(err){
        res.send(err);
    }
})

app.post("/login", async(req,res)=>{
    try{
        const givenEmail = req.body.username;
        const givenPassword = req.body.password;
        const foundUser = await User.findOne({email: givenEmail});
        // console.log(foundUser);
        if(!foundUser){
            res.send("There is no account!");
        }else{

            bcrypt.compare(givenPassword, foundUser.password, function(err, result) {
                if(result === true){
                    res.render("secrets");
                }else{
                    res.send("Wrong Password!");
                }
            });
        }
    }catch(err){
        res.send(err);
    }
})

app.listen(3000, ()=>{
    console.log("server started on port 3000");
})