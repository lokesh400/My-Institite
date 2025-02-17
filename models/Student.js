const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true },
    fatherName: { type: String, required: true },
    studentClass: { type: String, required: true },
    mobileNumber: { type: String, required: true },
    rollNumber: { type: String },
    address: { type: String, required: true },
    photo: { type: String, default: "default.jpg" }, // URL or file path
    puvlicId:String,
    result: [
        {
            title: String,
            subjects: [
                {
                    subjectName: String,
                    totalMarks:Number,
                    marks: Number
                }
            ]
        }
    ],
    feeDetails: {
        admissionCharges: { type: Number, required: true },
        annualCharges: { type: Number, required: true },
        developmentCharges: { type: Number, required: true },
        monthlyFees: { type: Number, required: true },
        totalFees: { type: Number } // Will be calculated automatically
    },
    payments: [
        {
            month: { type: String, required: true },
            amount: { type: Number, required: true },
            paid: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

// Pre-save Hook to Calculate Total Fees
studentSchema.pre("save", function (next) {
    this.feeDetails.totalFees =
        this.feeDetails.admissionCharges +
        this.feeDetails.annualCharges +
        this.feeDetails.developmentCharges +
        (12 * this.feeDetails.monthlyFees);
    next();
});

module.exports = mongoose.model("Student", studentSchema);
