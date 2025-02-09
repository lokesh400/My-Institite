const mongoose = require("mongoose");

const EnquirySchema = new mongoose.Schema({
    name:String,
    number:String,
    message:String,
    openStatus:{
        type:Boolean,
        default:1,
    }
});

const Enquiry = mongoose.model("Enquiry", EnquirySchema);
module.exports = Enquiry;
