require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const localStrategy = require("passport-local");
const methodOverride = require("method-override");
const { jsPDF } = require('jspdf');


const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { error } = require("console");

const app = express();
const PORT = process.env.PORT || 3000;

const sessionOptions = require("./config/sessionConfig");
// const upload = require("./config/cloudinaryUpload");

const Student = require("./models/Student");
const User = require('./models/User');
const Enquiry = require('./models/Enquiry');
const Information = require('./models/Information');
const Result = require('./models/Result');
const Team = require('./models/Team')

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/myDatabase")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log(err));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.currUser = req.user;
    next();
});

// Configure Cloudinary
cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_secret,
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/user/login');
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.render("./error/accessdenied.ejs");
}

const studentRoutes = require("./routes/studentRoutes");
const teacherRoutes = require("./routes/teacherRoutes");
const adminRoutes = require("./routes/admin");
const userrouter = require("./routes/user.js");
const courserouter = require("./routes/courses.js");

app.use("/", studentRoutes);
app.use("/", teacherRoutes);
app.use("/", adminRoutes);
app.use("/user",userrouter);
app.use("/",courserouter);

// Home route
app.get("/", async (req, res) => {
    // if(req.user){
    //     res.redirect('/admin')
    // }
    const information = await Information.findOne();
    const result = await Result.find();
    const team = await Team.find();
    const calendarUpdates = Object.fromEntries(information.updates.calendar);
    res.render("index",{information,calendarUpdates,result,team});
});

app.get("/admin", async (req, res) => {
    res.render("adminIndex");
});

app.get("/about", (req, res) => {
    res.render("about", { title: "About Page" });
});

app.post("/add/new/enquiry", async (req, res) => {
  const {name,message,number} = req.body;
  const newEnquiry = new Enquiry({
    name,number,message
  })
  await newEnquiry.save();
  req.flash('success_msg',"enquiry generated successfully")
  res.redirect('/')
});

//Admit Card

app.get("/admitcard", async (req, res) => {
  res.render("admitCard");
});


// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});



