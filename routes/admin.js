const express = require("express");
const router = express.Router();
const Form = require("../models/Form");
const Response = require("../models/Response");
const Teacher = require("../models/Teacher");
const Enquiry = require("../models/Enquiry");
const Information = require("../models/Information");
const Result = require("../models/Result");

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

// New form
router.get("/create/newform", async  (req, res) => {
    res.render("./admin/forms/createForm.ejs");
});

// All Forms
router.get("/get/allforms", async  (req, res) => {
    const forms = await Form.find();
    res.render("./admin/forms/viewForms.ejs",{forms});
});

// Save New Form
router.post("/create-form", async (req, res) => {
    const { title, labels, types, required, options } = req.body;
    const fields = labels.map((label, index) => ({
        label,
        type: types[index],
        required: required.includes(String(index)),
        options: options[index] ? options[index].split(",") : [],
    }));

    const newForm = new Form({ title, fields });
    await newForm.save();
    res.redirect("/get/allforms");
});

// Show a Specific Form to Submit
router.get("/forms/:id", async (req, res) => {
    const form = await Form.findById(req.params.id);
    res.render("./admin/forms/submitForm", { form });
});

// Handle Form Submission
router.post("/forms/:id", async (req, res) => {
    const formId = req.params.id;
    const data = req.body;
    const response = new Response({ formId, data });
    await response.save();
    res.send("Form Submitted Successfully!");
});

//Particular Form Data
router.get("/forms/:formId/responses", async (req, res) => {
    try {
        const formId = req.params.formId;
        const responses = await Response.find({ formId });

        res.render("./admin/forms/response.ejs", { responses });
    } catch (error) {
        res.status(500).send("Error fetching responses");
    }
});

// Delete Form & Its Responses
router.delete("/forms/:id/delete", async (req, res) => {
    try {
        const form = await Form.findByIdAndDelete(req.params.id);
        if (!form) {
            return res.status(404).json({ success: false, message: "Form not found" });
        }
        await Response.deleteMany({ formId: req.params.id });
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

// Route to add a new teacher
router.get("/add/new/teacher", async  (req, res) => {
    res.render("./admin/addTeacher.ejs");
});

router.post("/teachers/add/new", async (req, res) => {
    try {
        const { name, subject, fatherName, mobileNumber, address, photo } = req.body;

        const newTeacher = new Teacher({
            name,
            subject,
            fatherName,
            mobileNumber,
            address,
            photo: photo || "default.jpg", // Use default if no photo provided
        });

        await newTeacher.save();
        res.status(201).json({ success: true, message: "Teacher added successfully!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

//get all enquiries
router.get("/get/all/enquiry", async (req, res) => {
    try {
      const enquiries = await Enquiry.find();
      res.render("admin/Enquiry.ejs",{enquiries})
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
// update status of enquiry
router.patch('/update-enquiry/:id', async (req, res) => {
    try {
        const enquiry = await Enquiry.findById(req.params.id);
        if (!enquiry) return res.status(404).json({ message: 'Enquiry not found' });

        // Toggle status
        enquiry.openStatus = !enquiry.openStatus;
        await enquiry.save();

        res.json(enquiry);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});  

//Information
router.get("/admin/information", async (req, res) => {
    try {
    const info = await Information.find();
    
      res.render("admin/information.ejs",{information:info[0]})
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

// Update Address
router.put("/update-address/:id", async (req, res) => {
  try {
    const { address, city, state, zipCode, phone,establishedYear } = req.body;
    const updatedInfo = await Information.findByIdAndUpdate(
      req.params.id,
      { address, city, state, zipCode, phone, establishedYear },
      { new: true }
    );
    req.flash('success_msg',"Address Details Updated Successfully")
    res.redirect('/admin/information')
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Principal Details
router.put("/update-principal/:id", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const updatedInfo = await Information.findByIdAndUpdate(
      req.params.id,
      { principal: { name, email, phone } },
      { new: true }
    );
    res.json(updatedInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Social Media Links
router.put("/update/social-media/:id", async (req, res) => {
  try {
    const { facebook, twitter, instagram, linkedin, email } = req.body;
    const updatedInfo = await Information.findByIdAndUpdate(
      req.params.id,
      { socialMedia: { facebook, twitter, instagram, linkedin, email } },
      { new: true }
    );
    req.flash('success_msg',"Link Details Updated Successfully")
    res.redirect('/admin/information')
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Calendar and Latest Updates
router.put("/update-updates/:id", async (req, res) => {
  try {
    const { calander, latestUpdates, headerUpdates } = req.body;
    const updatedInfo = await Information.findByIdAndUpdate(
      req.params.id,
      { updates: { calander, latestUpdates, headerUpdates } },
      { new: true }
    );
    res.json(updatedInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Header
router.put("/update/header/:id", async (req, res) => {
    try {
      const {id} = req.params; 
      const{ update } = req.body;
      const updatedInfo = await Information.findByIdAndUpdate(
        id,
        { updates: { headerUpdates: update } },
        { new: true }
      );
      req.flash('success_msg',"Header Details Updated Successfully")
    res.redirect('/admin/information')
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

router.get('/add/new/result', (req,res)=>{
  res.render('admin/newResult.ejs');
})  

//Add Our Result
router.post('/add/new/result', upload.single("file"), async (req, res) => {
  try {
    const { name,exam,year } = req.body;
    const result = await Upload.uploadFile(req.file.path);  // Use the path for Cloudinary upload
    const imageUrl = result.secure_url;
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error('Error deleting local file:', err);
      } else {
        console.log('Local file deleted successfully');
      }
    });
    const newResult = new Result({
      name,exam,year,imageUrl,publicId:result.public_id
    });
    await newResult.save();
    req.flash('success_msg',"New Result Added Successfully !")
    res.redirect("/add/new/result")
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Upload failed: ' + error.message });
  }
});  

router.get('/show/all/results', async(req,res)=>{
  const results = await Result.find();
  res.render('admin/allResult.ejs',{results});
})

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


module.exports = router;
