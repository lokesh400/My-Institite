const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const Exam = require('../models/Exam')


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

// Manage Teachers
router.get("/manage/teachers",ensureAuthenticated, async  (req, res) => {
    const teachers = await Teacher.find();
    res.render("manageTeachers.ejs",{teachers});
});

// delete teacher
router.delete("/delete/teacher/:id",ensureAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        await Teacher.findByIdAndDelete(id);
        req.flash("success_msg", "Teacher deleted successfully!");
        res.redirect("/manage/teachers");
    } catch (error) {
        console.error("Error deleting Teacher:", error);
        res.status(500).send(error.message);
    }
});

//Teacher Details
router.get("/teacher/payment/:id",ensureAuthenticated, async (req, res) => {
    try {
        const {id} = req.params
        const student = await Teacher.findById(id)
        res.render('salaryDetails.ejs',{student})
    } catch (error) {
        res.status(500).send(error);
    }
});

//Add teacher payments
router.post("/add/new/teacher/payment/:id",ensureAuthenticated, async (req, res) => {
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
        const updated = await Teacher.findByIdAndUpdate(
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
            { new: true }
        );
        res.redirect(`/teacher/payment/${id}`);
    } catch (error) {
        console.log(error);
        res.send(error)
    }
});

router.get("/teacher",ensureAuthenticated, async (req, res) => {
    res.render("./teacher/teacherIndex.ejs");
});

router.post("/submit-grade",ensureAuthenticated, async (req, res) => {
    try {
        const {grade} = req.body;
        const students = await Student.find({ studentClass: grade }); // Find students by class
        if (students.length === 0) {
            return res.status(404).send('No students found in this class.');
        }
        res.render("./teacher/uploadMarks.ejs",{students});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});


router.post("/upload/marks/:count",ensureAuthenticated, async (req, res) => {
    const { count } = req.params;
    const {subject} = req.body;
    const titleName = "Midterm Results";
    for (let i = 0; i < count; i++) {
        const studentId = req.body[`id${i}`];
        const marks = req.body[`marks${i}`];
        const student = await Student.findById(studentId);
        if (!student) {
            console.error(`Student with ID ${studentId} not found`);
            continue;
        }
        const existingResult = student.result.find((res) => res.title === titleName);
        if (existingResult) {
            existingResult.subjects.push({
                subjectName: subject,
                totalMarks: 100,
                marks
            });
        } else {
            const newTitle = new Exam({
                title:titleName,
            })
            await newTitle.save()
            await student.result.push({
                title: titleName,
                subjects: [
                    {
                        subjectName: "Maths",
                        totalMarks: 100,
                        marks
                    }
                ]
            });
        }
        await student.save();
    }
    res.json({ message: "Marks received and updated successfully!" });
});



module.exports = router;
