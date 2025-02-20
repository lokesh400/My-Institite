const express = require("express");
const router = express.Router();
const Form = require("../models/Form");
const Response = require("../models/Response");
const Teacher = require("../models/Teacher");
const Enquiry = require("../models/Enquiry");
const Information = require("../models/Information");
const Result = require("../models/Result");
const Team = require("../models/Team");
const Student = require('../models/Student')

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
router.get("/create/newform",ensureAuthenticated,isAdmin, async  (req, res) => {
    res.render("./admin/forms/createForm.ejs");
});

// All Forms
router.get("/get/allforms", ensureAuthenticated,isAdmin,async  (req, res) => {
    const forms = await Form.find();
    res.render("./admin/forms/viewForms.ejs",{forms});
});

// Save New Form
router.post("/create-form",ensureAuthenticated,isAdmin, async (req, res) => {
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
    const form = await Form.findById(req.params.id);
    res.render("./admin/forms/submitForm", { form });
});

// Handle Form Submission
router.post("/forms/:id",ensureAuthenticated,isAdmin, async (req, res) => {
    const formId = req.params.id;
    const data = req.body;
    const response = new Response({ formId, data });
    await response.save();
    res.send("Form Submitted Successfully!");
});

//Particular Form Data
router.get("/forms/:formId/responses",ensureAuthenticated,isAdmin, async (req, res) => {
    try {
        const formId = req.params.formId;
        const responses = await Response.find({ formId });

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

// Route to add a new teacher
router.get("/add/new/teacher",ensureAuthenticated,isAdmin, async  (req, res) => {
    res.render("./admin/addTeacher.ejs");
});

// router.post("/teachers/add",ensureAuthenticated,isAdmin, async (req, res) => {
//     try {
//         const { name, subject, fatherName, mobileNumber, address, photo } = req.body;

//         const newTeacher = new Teacher({
//             name,
//             subject,
//             fatherName,
//             mobileNumber,
//             address,
//             photo: photo || "default.jpg", // Use default if no photo provided
//         });

//         await newTeacher.save();
//         res.status(201).json({ success: true, message: "Teacher added successfully!" });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ success: false, message: "Server error" });
//     }
// });

//get all enquiries
router.get("/get/all/enquiry",ensureAuthenticated,isAdmin, async (req, res) => {
    try {
      const enquiries = await Enquiry.find();
      res.render("admin/Enquiry.ejs",{enquiries})
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  
// update status of enquiry
router.patch('/update-enquiry/:id',ensureAuthenticated,isAdmin, async (req, res) => {
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
router.get("/admin/information",ensureAuthenticated,isAdmin, async (req, res) => {
    try {
    const info = await Information.findOne();
    const calendarUpdates = Object.fromEntries(info.updates.calendar);
      res.render("admin/information.ejs",{information:info,calendarUpdates})
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });

// Update Address
router.put("/update-address/:id",ensureAuthenticated,isAdmin, async (req, res) => {
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
router.put("/update-principal", async (req, res) => {
  try {
      console.log("Received Request Body:", req.body); // Debugging log
      const { name, email, phone } = req.body;
      if (!name || !email || !phone) {
          return res.status(400).json({ message: "All principal fields (name, email, phone) are required" });
      }
      const updatedInfo = await Information.findOneAndUpdate(
          {}, // Find any document (assuming there's only one)
          {
              $set: {
                  "principal.name": name,
                  "principal.email": email.toLowerCase(), // Ensure email is lowercase
                  "principal.phone": phone
              }
          },
          { new: true, upsert: true } // Return updated document, create if not exists
      );
      req.flash('success_msg',"Principal Details Updated Successfully")
      res.redirect('/admin/information')

  } catch (error) {
      console.error("Error updating principal:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update Social Media Links
router.put("/update/social-media/:id",ensureAuthenticated,isAdmin, async (req, res) => {
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

// Update headerUpdates
router.put("/update/header/:id", async (req, res) => {
    try {
      const{ update } = req.body;
      console.log(update)
        if (!update) {
            return res.status(400).json({ message: "Header updates cannot be empty" });
        }
        const updatedInfo = await Information.findOneAndUpdate(
            {}, // Find any document (assuming there's only one)
            { $set: { "updates.headerUpdates": update } },
            { new: true, upsert: true } // Return updated document, create if not exists
        );
        req.flash('success_msg',"Header Details Updated Successfully")
        res.redirect('/admin/information')
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
});


// POST route to add an event to the calendar
router.post("/updates/add/new", async (req, res) => {
  try {
    const { incident, instant } = req.body;
    if (!incident || !instant) {
      return res.status(400).json({ message: "Both eventDate and eventDescription are required!" });
    }
    const eventId = `incident_${Date.now()}`;
    // Construct update object
    const update = {};
    update[`updates.calendar.${eventId}`] = { instant, incident };
    // Update the only document in Information collection
    const result = await Information.findOneAndUpdate(
      {}, // Find the only document
      { $set: update }, // Add event
      { new: true, upsert: true } // Create if not found
    );
        req.flash('success_msg',"Calander Details Updated Successfully")
        res.redirect('/admin/information')
  } catch (error) {
    console.error("Error adding event:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE Route to remove a calendar event
router.delete("/calendar/:eventId", async (req, res) => {
    try {
        const { eventId } = req.params;
        const updatedInfo = await Information.findOneAndUpdate(
            {}, // Assuming a single document
            { $unset: { [`updates.calendar.${eventId}`]: "" } }, // Remove event
            { new: true } // Return updated document
        );
        if (!updatedInfo) {
            return res.status(404).json({ message: "No document found" });
        }
        req.flash('success_msg',"Calander Details Deleted Successfully")
        res.redirect('/admin/information')
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});




// router.post("/updates/add/new", async (req, res) => {
//     try {
//       const { instant, incident } = req.body;
//         let info = await Information.findOne(); // Get the first document
//         const updatedCalander = info.updates.calander.push({instant, incident})
//         // info.updates.calendar = {  }; // Overwrites existing calendar data
//         await updatedCalander.save();
//         req.flash('success_msg',"Latest Updates Updated Successfully")
//         res.redirect('/admin/information')
//     } catch (error) {
//         res.status(500).json({ message: "Error adding update", error });
//     }
// });

router.delete("/updates/delete/:index", async (req, res) => {
    try {
        const { index } = req.params;

        const info = await Information.findOne();
        if (!info || info.updates.latestUpdates.length === 0) {
            return res.status(404).json({ message: "No updates found to delete" });
        }

        const updateIndex = parseInt(index);
        if (updateIndex < 0 || updateIndex >= info.updates.latestUpdates.length) {
            return res.status(400).json({ message: "Invalid index" });
        }

        info.updates.latestUpdates.splice(updateIndex, 1);
        await info.save();

        res.status(200).json({ message: "Update deleted successfully", latestUpdates: info.updates.latestUpdates });
    } catch (error) {
        res.status(500).json({ message: "Error deleting update", error });
    }
});

// Add or Update Calendar Entry**
// router.post("/updates/add/new", async (req, res) => {
//   console.log("hello")
//     try {
//         const { instant, incident } = req.body;
//         if (!instant || !incident) {
//             return res.status(400).json({ message: "Both instant and incident are required" });
//         }
//         let info = await Information.findOne();
//         if (!info) {
//             info = new Information({ updates: { calendar: {} } });
//         }
//         info.updates.calendar = { instant, incident }; // Overwrites existing calendar data
//         await info.save();
//         res.status(200).json({ message: "Calendar updated successfully", calendar: info.updates.calendar });
//     } catch (error) {
//         console.log(error)
//         res.status(500).json({ message: "Error updating calendar", error });
//     }
// });

//Delete Calendar Entry**
// app.delete("/updates/calendar/delete", async (req, res) => {
//     try {
//         let info = await Information.findOne();
//         if (!info || !info.updates.calendar) {
//             return res.status(404).json({ message: "No calendar entry found to delete" });
//         }
//         info.updates.calendar = { instant: "", incident: "" }; // Reset calendar
//         await info.save();
//         res.status(200).json({ message: "Calendar entry deleted successfully", calendar: info.updates.calendar });
//     } catch (error) {
//         res.status(500).json({ message: "Error deleting calendar entry", error });
//     }
// });

// ✅ **3. Add an Update to latestUpdates**
router.post("/updates/latest/add", async (req, res) => {
    try {
        const { update } = req.body;
        if (!update) {
            return res.status(400).json({ message: "Update text is required" });
        }
        let info = await Information.findOne();
        if (!info) {
            info = new Information({ updates: { latestUpdates: [] } });
        }
        info.updates.latestUpdates.push(update);
        await info.save();
        res.status(200).json({ message: "Update added successfully", latestUpdates: info.updates.latestUpdates });
    } catch (error) {
        res.status(500).json({ message: "Error adding update", error });
    }
});

// ✅ **4. Delete an Update from latestUpdates by Index**
router.delete("/updates/latest/delete/:index", async (req, res) => {
    try {
        const { index } = req.params;

        const info = await Information.findOne();
        if (!info || info.updates.latestUpdates.length === 0) {
            return res.status(404).json({ message: "No updates found to delete" });
        }

        const updateIndex = parseInt(index);
        if (updateIndex < 0 || updateIndex >= info.updates.latestUpdates.length) {
            return res.status(400).json({ message: "Invalid index" });
        }

        info.updates.latestUpdates.splice(updateIndex, 1);
        await info.save();

        res.status(200).json({ message: "Update deleted successfully", latestUpdates: info.updates.latestUpdates });
    } catch (error) {
        res.status(500).json({ message: "Error deleting update", error });
    }
});

// Show all result
router.get('/show/all/results',ensureAuthenticated,isAdmin, async(req,res)=>{
    const results = await Result.find();
    res.render('admin/allResult.ejs',{results});
  })

//add new result
router.get('/add/new/result',ensureAuthenticated,isAdmin, (req,res)=>{
  res.render('admin/newResult.ejs');
})  

//Add Our Result
router.post('/add/new/result',ensureAuthenticated,isAdmin, upload.single("file"), async (req, res) => {
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

router.delete("/delete/result/:id",ensureAuthenticated,isAdmin, async (req, res) => {
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
router.get('/show/all/team',ensureAuthenticated,isAdmin, async(req,res)=>{
  const members = await Team.find();
  res.render('admin/allTeam.ejs',{members});
})

//Add New Member
router.get('/add/new/member',ensureAuthenticated,isAdmin, (req,res)=>{
  res.render('admin/newTeam.ejs');
})  

//Post route to add new member
router.post('/add/new/member',ensureAuthenticated,isAdmin, upload.single("file"), async (req, res) => {
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
router.delete("/delete/team/member/:id",ensureAuthenticated,isAdmin, async (req, res) => {
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





//ID card
router.get("/print",ensureAuthenticated,isAdmin, async (req, res) => {
  try {
      // const formId = req.params.formId;
      // const responses = await Response.find({ formId });
      res.render("./admin/printIdcard.ejs");
  } catch (error) {
      res.status(500).send("Error fetching responses");
  }
});


router.post("/print/id", upload.none(), async (req, res) => {
  try {
      const students = await Student.find({ studentClass: req.body.grade });
      res.json(students);
  } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).send('Server Error');
  }
});




module.exports = router;
