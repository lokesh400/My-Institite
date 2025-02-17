const express = require("express");
const Student = require("../models/Student");
const Exam = require('../models/Exam')
const router = express.Router();



const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { error } = require("console");

cloudinary.config({
    cloud_name:process.env.cloud_name, 
    api_key:process.env.api_key, 
    api_secret:process.env.api_secret
});

// Multer disk storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save files to 'uploads/' folder
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  }  
});

// Initialize multer with diskStorage
const upload = multer({ storage: storage });

// Function to upload files to Cloudinary
// const Upload = {
//   uploadFile: async (filePath) => {
//     try {
//       // Upload the file to Cloudinary
//       const result = await cloudinary.uploader.upload(filePath, {
//         resource_type: "auto", // Auto-detect file type (image, video, etc.)
//       });
//       return result;
//     } catch (error) {
//       throw new Error('Upload failed: ' + error.message);
//     }
//   }
// };

const Upload = {
    uploadFile: async (filePath) => {
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          resource_type: "auto",
        });
  
        // Delete local file after successful upload
        fs.unlink(filePath, (err) => {
          if (err) console.error("Error deleting local file:", err);
        });
  
        return result;
      } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw new Error("Upload failed: " + error.message);
      }
    }
  };
  

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


// Get all students
router.get("/students",ensureAuthenticated, async (req, res) => {
    try {
        const students = await Student.find(); // Fetch all students from MongoDB
        req.flash('success',"Hello Dear")
        res.render("allStudents.ejs", { students }); // Pass data to the EJS template
    } catch (error) {
        res.status(500).send("Error fetching students: " + error.message);
    }
});

//Add Student
router.get("/add/new/student",ensureAuthenticated, async (req, res) => {
    try {
        res.render("addStudent.ejs"); // Pass data to the EJS template
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post("/add/new/student",ensureAuthenticated,upload.single("image"), async (req, res) => {
    try {
        const { name, fatherName, studentClass, mobileNumber, address, admissionCharges, annualCharges, developmentCharges, monthlyFees } = req.body;
        const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
        const photo = result.secure_url;
        const publicId = result.public_id
        const student = new Student({
            name,
            fatherName,
            studentClass,
            mobileNumber,
            photo,
            publicId,
            address,
            feeDetails: {
                admissionCharges,
                annualCharges,
                developmentCharges,
                monthlyFees
            }
        });
        await student.save();
        req.flash("success_msg", "Student added successfully!");
        res.redirect('/students');
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});




// Add fee details
router.get("/student/edit/fees/:id",ensureAuthenticated, async (req, res) => {
    try {
        const {id} = req.params
        const student = await Student.findById(id)
        res.render('feeDetails.ejs',{student})
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post("/add/new/payment/:id",ensureAuthenticated, async (req, res) => {
    try {
        const{amount} = req.body;
        const {id} = req.params;
        const now = new Date();
        const i = now.getMonth();
        const monthNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        const monthName = monthNames[i]
        const updatedStudent = await Student.findByIdAndUpdate(
            id,
            {
                $push: {
                    payments: {
                        amount: amount,
                        createdAt: new Date(),
                        month:monthName,
                    },
                },
            },
            { new: true } // Return the updated document
        );

        if (!updatedStudent) {
            console.log("Student not found");
            return null;
        }
        res.redirect(`/student/edit/fees/${id}`);
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});

// Delete Student
router.delete("/delete/student/:id",ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);
        if (!student) {
            console.log("No student found with this ID.");
            return res.status(404).send("No such student found");
        }
        await Student.findByIdAndDelete(id);
        req.flash("success_msg", "Student deleted successfully!");
        res.redirect("/students");
    } catch (error) {
        console.error("Error deleting student:", error);
        res.status(500).send(error.message);
    }
});

//Result Routes
router.get("/result", async (req, res) => {
    try {
        const exams = await Exam.find({}, "title");
        const examTitles = exams.map(exam => exam.title);
        res.render("./student/result.ejs", { examTitles });
    } catch (error) {
        console.error("Error fetching exams:", error);
        res.status(500).send("Internal Server Error");
    }
});


router.get("/view-result", async (req, res) => {
    const { rollNumber, examTitle } = req.query;
    try {
        const student = await Student.findOne({ rollNumber });
        if (!student) {
            return res.render('./errors/studentNotFound.ejs')
        }

        const result = student.result.find(r => r.title === examTitle);
        if (!result) {
            return res.render('./errors/studentNotFound.ejs')
        }
        res.render("./student/studentResult.ejs", { student, result });
    } catch (error) {
        console.error("Error fetching student result:", error);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
