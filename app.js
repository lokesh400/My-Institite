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

const sessionOptions = require("./config/sessionConfig");
// const upload = require("./config/cloudinaryUpload");

const Student = require("./models/Student");
const User = require('./models/User');
const Enquiry = require('./models/Enquiry');
const Information = require('./models/Information');
const Result = require('./models/Result');
const Team = require('./models/Team');
const Class = require('./models/Class');
const Teacher = require('./models/Teacher');

// Connect to MongoDB
mongoose.connect(process.env.mongo_url)
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
const examrouter = require("./routes/exam.js");
const quizrouter = require("./routes/quiz.js");

app.use("/", studentRoutes);
app.use("/", teacherRoutes);
app.use("/", adminRoutes);
app.use("/",userrouter);
app.use("/",courserouter);
app.use("/",examrouter);
app.use("/",quizrouter);

// Home route
app.get("/", async (req, res) => {
    try{

      const information = await Information.findOne();
      const result = await Result.find();
      const team = await Team.find();
      const calendarUpdates = Object.fromEntries(information.updates.calendar);
      res.render("index",{information,calendarUpdates,result,team});
    }catch(error){
      console.log(error)
    }
});

app.get("/admin", async (req, res) => {
    res.render("adminIndex");
});

app.get("/about", (req, res) => {
    res.render("about", { title: "About Page" });
});

app.post("/add/new/enquiry", async (req, res) => {
 try{
  const {name,message,number} = req.body;
  const newEnquiry = new Enquiry({
    name,number,message
  })
  await newEnquiry.save();
  req.flash('success_msg',"enquiry generated successfully")
  res.redirect('/')
 }catch(error){
  console.log(error)
 }
});

//Admit Card

app.get("/admitcard", async (req, res) => {
  res.render("admitCard");
});

app.post("/add/new/class", async (req, res) => {
  try {
      const newClass = new Class(req.body);
      await newClass.save();
      res.status(201).json(newClass);
  } catch (error) {
      res.status(400).json({ message: error.message });
  }
});

app.get("/all/classes", async (req, res) => {
  try {
      const classes = await Class.find();
      res.render('teacher/allClasses.ejs',{classes});
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

app.get("/add/new/class", async (req, res) => {
  res.render('teacher/addClass.ejs')
});

app.get("/show/this/class/:id", async (req, res) => {
  try {
      const {id} = req.params;
      const thisClass = await Class.findById(id);
      const grade = thisClass.title;
      const students = await Student.find({studentClass:grade});
      const teachers = await Teacher.find();
      res.render('teacher/thisClass.ejs',{thisClass,students,teachers});
  } catch (error) {
      res.status(500).json({ message: error.message });
  }
});

app.post("/assign-teachers", async (req, res) => {
    try {
        const { classId, teacherIds, coordinatorId } = req.body;

        // Convert teacherIds to an array and ensure they are valid ObjectIds
        const teacherArray = Array.isArray(teacherIds) 
            ? teacherIds.map(id => new mongoose.Types.ObjectId(id)) 
            : [new mongoose.Types.ObjectId(teacherIds)];

        await Class.findByIdAndUpdate(classId, { 
            teachers: teacherArray, 
            coordinator: coordinatorId ? new mongoose.Types.ObjectId(coordinatorId) : null
        });

        res.redirect(`/show/this/class/${classId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});

app.post("/add-more-teachers", async (req, res) => {
    try {
        const { classId, newTeacherIds } = req.body;

        // Ensure newTeacherIds is an array and convert to ObjectIds
        const newTeacherArray = Array.isArray(newTeacherIds) 
            ? newTeacherIds.map(id => new mongoose.Types.ObjectId(id)) 
            : [new mongoose.Types.ObjectId(newTeacherIds)];

        // Get current class
        const thisClass = await Class.findById(classId);
        
        // Merge old and new teachers, removing duplicates
        const updatedTeachers = [...new Set([...thisClass.teachers.map(id => id.toString()), ...newTeacherArray.map(id => id.toString())])];

        await Class.findByIdAndUpdate(classId, { teachers: updatedTeachers.map(id => new mongoose.Types.ObjectId(id)) });

        res.redirect(`/show/this/class/${classId}`);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message });
    }
});



// Start server
app.listen(777, () => {
    console.log("Server running at http://localhost:777");
});



