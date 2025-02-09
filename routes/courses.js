const express = require("express");
const router = express.Router();
const Teacher = require("../models/Teacher");

// New form
router.get("/admin/addcourse", async  (req, res) => {
    res.render("admin/addcourse.ejs");
});


module.exports = router;
