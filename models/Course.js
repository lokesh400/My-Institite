const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    description: {
        type: String,
    },
    thumbnail: {
        type: String,
    },
    studentClass: {
        type: String,
    },
    price: {
        type: Number,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    publicId:String,
});

module.exports = mongoose.model("Course", courseSchema);