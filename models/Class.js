const mongoose = require('mongoose');
const Teacher = require('./Teacher')

const ClassSchema = new mongoose.Schema({
    title: String,
    teachers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Teacher" }], // Multiple teachers
    coordinator: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher" } // One coordinator
});

module.exports = mongoose.model("Class", ClassSchema);
