const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");
const Result = require("../models/Result");
const Team = require("../models/Team");
const Course = require("../models/Course")

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
    // Use the original file name
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

// Initialize multer with diskStorage
const upload = multer({ storage: storage });

// Function to upload files to Cloudinary
const Upload = {
  uploadFile: async (filePath) => {
    try {
      // Upload the file to Cloudinary
      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: "auto", // Auto-detect file type (image, video, etc.)
      });
      return result;
    } catch (error) {
      throw new Error('Upload failed: ' + error.message);
    }
  }
};

//All Courses
router.get("/admin/show/allcourses", async  (req, res) => {
    const courses = await Course.find();
    res.render("courses/allCourses.ejs",{courses});
});

router.get("/admin/addcourse", async  (req, res) => {
    res.render("courses/addcourse.ejs");
});

router.post("/admin/post/new/course", upload.single("image"), async (req, res) => {
    try {
        const { title, description, duration, price, category } = req.body;
        const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
        const imageUrl = result.secure_url;
        fs.unlink(req.file.path, (err) => {
          if (err) {
            console.error('Error deleting local file:', err);
          } else {
            console.log('Local file deleted successfully');
          }
        });
        const newCourse = new Course({
            title,
            description,
            duration,
            price,
            studentClass:category,
            thumbnail:imageUrl,
            publicId:result.public_id
        });
        await newCourse.save();
        // req.flash('success_msg',"New Result Added Successfully !")
        res.redirect("/admin/show/allcourses")
      } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Upload failed: ' + error.message });
      }
});

// Particular Batch
router.get('/show/this/batch/:id', async(req,res)=>{
    const {id} = req.params;
    const course = await Course.findById(id);
    res.render('courses/thisCourse.ejs',{course});
  })







// Show all result
router.get('/show/all/results', async(req,res)=>{
    const results = await Result.find();
    res.render('admin/allResult.ejs',{results});
  })

//add new result
router.get('/add/new/result', (req,res)=>{
  res.render('admin/newResult.ejs');
})  

//Add Our Result
router.post('/add/new/result', upload.single("file"), async (req, res) => {
  
});  

router.delete("/delete/result/:id", async (req, res) => {
  try {
    const image = await Result.findById(req.params.id);
    if (!image) return res.status(404).json({ message: "Image not found" });
    // Delete from Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.destroy(image.publicId);
    if (cloudinaryResponse.result !== "ok") {
      return res.status(400).json({ message: "Failed to delete from Cloudinary" });
    }
    // Delete from MongoDB
    await Result.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Deletion failed", error: error.message });
  }
});

//Show all Team
router.get('/show/all/team', async(req,res)=>{
  const members = await Team.find();
  res.render('admin/allTeam.ejs',{members});
})

//Add New Member
router.get('/add/new/member', (req,res)=>{
  res.render('admin/newTeam.ejs');
})  

//Post route to add new member
router.post('/add/new/member', upload.single("file"), async (req, res) => {
  try {
    const { name,subject,experience,study } = req.body;
    const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
    const imageUrl = result.secure_url;
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Error deleting local file:', err);
      } else {
        console.log('Local file deleted successfully');
      }
    });
    const newTeam = new Team({
      name,subject,experience,study,imageUrl,publicId:result.public_id
    });
    await newTeam.save();
    req.flash('success_msg',"New Member Added Successfully !")
    res.redirect("/add/new/member")
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Upload failed: ' + error.message });
  }
});  


// Detele team member
router.delete("/delete/team/member/:id", async (req, res) => {
  try {
    const image = await Team.findById(req.params.id);
    if (!image) return res.status(404).json({ message: "Image not found" });
    // Delete from Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.destroy(image.publicId);
    if (cloudinaryResponse.result !== "ok") {
      return res.status(400).json({ message: "Failed to delete from Cloudinary" });
    }
    // Delete from MongoDB
    await Team.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Deletion failed", error: error.message });
  }
});


module.exports = router;
