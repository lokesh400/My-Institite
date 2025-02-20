const mongoose = require("mongoose");

const classSchema = new mongoose.Schema({
    title: {
        type: String,
    },
    coordinator:{
        type:String,
    },
    year: {
        type: String,
    },
    teachers:{
        type:Array,
    },
    students:{
        type:Array,
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Class", classSchema);