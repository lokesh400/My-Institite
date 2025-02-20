const express = require("express");
const router = express.Router();
const ExamRegistration = require("../models/ExamRegistration");
const ExamResponse = require("../models/ExamResponse");

const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { error } = require("console");
router.use(express.urlencoded({ extended: true })); 

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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.render("./error/accessdenied.ejs");
}

// New form
router.get("/create/new/exam/registration",ensureAuthenticated,isAdmin, async  (req, res) => {
    res.render("./admin/forms/examRegistration.ejs");
});

// All Forms
router.get("/get/all/exam/registration", ensureAuthenticated,isAdmin,async  (req, res) => {
    const forms = await ExamRegistration.find();
    res.render("./admin/forms/viewForms.ejs",{forms});
});

// Save New Form
router.post("/exam/new/registration",ensureAuthenticated,isAdmin, async (req, res) => {
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
router.get("/forms/:id",ensureAuthenticated,isAdmin, async (req, res) => {
    const form = await ExamRegistration.findById(req.params.id);
    res.render("./admin/forms/submitRegistration.ejs", { form });
});

// Handle Form Submission
router.post("/new/exam/form/:id",ensureAuthenticated,isAdmin, async (req, res) => {
    const formId = req.params.id;
    const data = req.body;
    const response = new ExamResponse({ formId, data });
    await response.save();
    res.send("Form Submitted Successfully!");
});

//Particular Form Data
router.get("/forms/:formId/responses",ensureAuthenticated,isAdmin, async (req, res) => {
    try {
        const formId = req.params.formId;
        const responses = await ExamResponse.find({ formId });

        res.render("./admin/forms/response.ejs", { responses });
    } catch (error) {
        res.status(500).send("Error fetching responses");
    }
});

// Delete Form & Its Responses
router.delete("/forms/:id/delete",ensureAuthenticated,isAdmin, async (req, res) => {
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

module.exports = router;
