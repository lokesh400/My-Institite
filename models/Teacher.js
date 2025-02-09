const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
    name: { type: String, required: true },
    subject: { type: String, required: true },
    fatherName: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    address: { type: String, required: true },
    photo: { type: String, default: "default.jpg" }, // URL or file path
    payments: [
        {
            month: { type: String, required: true },
            amount: { type: Number, required: true },
            paid: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
});


module.exports = mongoose.model("Teacher", teacherSchema);

