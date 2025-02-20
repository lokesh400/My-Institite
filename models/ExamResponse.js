const mongoose = require("mongoose");

const examresponseSchema = new mongoose.Schema({
    formId: mongoose.Schema.Types.ObjectId,
    data: Object,
});

const ExamResponse = mongoose.model("ExamResponse", examresponseSchema);
module.exports = ExamResponse;