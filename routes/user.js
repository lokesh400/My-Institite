const express = require("express");
const router = express.Router();
const User = require('../models/User');
const passport = require("passport");
const nodemailer = require('nodemailer');
const passportLocalMongoose = require('passport-local-mongoose');
const Teacher = require('../models/Teacher')

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }
  function isAdmin(req, res, next) {
    if (req.user.role==='admin') {
      return next();
    }
    res.render('./errors/isAdmin.ejs')
  }  

// Signup route
router.get('/signup', (req, res) => {
    req.flash('error_msg', 'Hello Dear');
    res.render("./users/signup.ejs");
});

router.post('/signup', async (req, res) => {
    const {name,email, password ,confirmpassword,otp,contactNumber} = req.body;
    const role = "student";
    const username = email;
    // let user = await Otp.findOne({ email });
    if(password==confirmpassword&&otp==user.otp){
        const newUser = new User({name,role, email, username,contactNumber });
    try {
        // Attempt to register the new user
        const registeredUser = await User.register(newUser, password);
        //sendimg greeting mail
        const transporter = nodemailer.createTransport({
            service:'gmail',
            host:'smtp.gmail.com',
            secure:false,
            port:587,
            auth:{
             user:"lokeshbadgujjar401@gmail.com",
             pass:process.env.mailpass
            }
           });
        
           try{
              const mailOptions = await transporter.sendMail({
                from:"lokeshbadgujjar401@gmail.com",
                to: `${email}`,
                subject: 'Welcome to TheTestPulseFamily',
                text: `Dear ${name} welcome to TheTestPulse Family.`,
            });
        } catch(error){
            transporter.sendMail(mailOptions,(error,info)=>{
                if(error){
                    console.log(error)
                }
                else{
                    console.log(info+response);
                }
            })
        }
        // Redirect to login page after successful registration
        res.redirect('/login');
    } catch (error) {
       res.send(error)
    }
    }
    else{
        res.render("./users/signup.ejs", {error : "password do not match"});
    } 
});

router.post("/teachers/add", async (req, res) => {
    try {
      const { name, subject, fatherName, mobileNumber, address, photo, email } = req.body;
      const role = "teacher";
      const username = email;
      const password = `${name}@123`;
      const newUser = new User({ name, role, email, username });
      const registeredUser = await User.register(newUser, password);
      const newTeacher = new Teacher({
        name,
        subject,
        fatherName,
        mobileNumber,
        address,
        photo: photo || "default.jpg", // Use default if no photo provided
      });
      await newTeacher.save(); // Ensure teacher record is saved
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        secure: false,
        port: 587,
        auth: {
          user: "lokeshbadgujjar401@gmail.com",
          pass: process.env.mailpass
        }
      });
      const mailOptions = {
        from: "lokeshbadgujjar401@gmail.com",
        to: email,
        subject: 'Welcome to TheTestPulseFamily',
        text: `Dear ${name}, welcome to TheTestPulse Family.`
      };
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`Email sent: ${info.response}`);
      } catch (error) {
        console.error(`Error sending email: ${error.message}`);
      }
      req.flash("success_msg", "Student added successfully!");
      res.redirect('/manage/teachers');
    } catch (error) {
      console.error(error);
      req.flash('error_msg', error.message);
      res.render("./users/signup.ejs");
    }
  });
  

// Login route
router.get("/login", (req, res) => {
    req.flash('error_msg', 'Welcome back');
    res.render("./users/login.ejs");
});

router.post("/user/login", async (req, res, next) => {
    // Passport Authentication manually
    passport.authenticate("local", async (err, user, info) => {
        if (err) {
            console.error("Error during authentication:", err);
            req.flash('error_msg', 'Something went wrong. Please try again.');
            return res.redirect("/user/login"); // Redirect back to login if there was an error
        }
        if (!user) {
            req.flash('error_msg', info.message || 'Invalid credentials. Please check your username and password.');
            return res.redirect("/user/login"); // Invalid login credentials
        }
        // If login is successful, log in the user
        req.login(user, async (err) => {
            if (err) {
                console.error("Login failed:", err);
                req.flash('error_msg', 'Login failed. Please try again.');
                return res.redirect("/user/login");
            }
            // Flash a success message and redirect based on user role
            req.flash('success_msg', 'You have successfully logged in!');
            if (user.role === 'admin') {
                res.redirect("/admin"); // Redirect to admin dashboard
            } else {
                res.redirect("/student"); // Redirect to student page
            }
            // Send login email notification
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                host: 'smtp.gmail.com',
                secure: false,
                port: 587,
                auth: {
                    user: "lokeshbadgujjar401@gmail.com",
                    pass: process.env.mailpass, // Securely store the email password in environment variables
                }
            });

            try {
                const info = await transporter.sendMail({
                    from: "lokeshbadgujjar401@gmail.com",
                    to: user.email,
                    subject: 'Recent Login Activity Noticed',
                    text: `Dear ${user.email}, a recent login has been made from your account on TheTestPulse Platform. If this wasn't you, please change your password.`,
                });
                console.log("Email sent: ", info.response);
            } catch (error) {
                console.error("Error sending email: ", error);
            }
        });
    })(req, res, next);
});


// Logout route
router.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/"); // Redirect to homepage after logout
    });
});

// Forget Password Route

router.get("/forget-password", (req, res, next) => {
    res.render("./users/forgetpassword.ejs")
});

router.post('/forget/password', async (req, res) => {
    const { otp,newPassword, confirmNewPassword,email } = req.body;
    // Validate new passwords match
    let candidate = await Otp.findOne({ email });
    if(newPassword==confirmNewPassword&&otp==candidate.otp){
    try {
        const student = await User.findOne({email});
        // Update to new password
        await student.setPassword(newPassword);
        await student.save();
        req.flash('success_msg', 'Password Reset Successfully');
        req.flash('error_msg', 'Password Reset Successfully');
        res.render('./users/login.ejs');
    } catch (error) {
        console.error("Error updating password:", error);
        req.flash('error_msg', 'Some error occured');
        res.render('./users/login.ejs');
    }}
});

//contactus
router.get("/support", (req, res) => {
    res.render("./users/contactus.ejs");
});

//User Info
router.get('/info',ensureAuthenticated, (req, res) => {
    res.render("./users/userDetails.ejs");
  });


module.exports = router;



