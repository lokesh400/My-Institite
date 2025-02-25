const mongoose = require("mongoose");

const ExamSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String, required: true },
    address:{ type:String },
    admitCards:{
        type:String,
        default:"not"
    }
});

const Exam = mongoose.model("Exam", ExamSchema);

module.exports = Exam;
