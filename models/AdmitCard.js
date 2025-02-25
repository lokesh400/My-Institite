const mongoose = require("mongoose");

const admitCardSchema = new mongoose.Schema({
    formId: { type: mongoose.Schema.Types.ObjectId, ref: "Form", required: true }, // Links to Form (Exam Registration)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Response", required: true }, // Links to Response (Candidate Data)
    rollNumber: { type: String, required: true, unique: true }, // Unique Roll Number
    examDate: { type: Date, required: true }, // Exam Date
    examCenter: { type: String, required: true }, // Exam Center Name
    status: { type: String, enum: ["Pending", "Issued"], default: "Pending" }, // Admit Card Status
    issuedAt: { type: Date, default: null } // When Admit Card was issued
});

const AdmitCard = mongoose.model("AdmitCard", admitCardSchema);
module.exports = AdmitCard;
