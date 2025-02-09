const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
    formId: mongoose.Schema.Types.ObjectId,
    data: Object,
});

const Response = mongoose.model("Response", responseSchema);
module.exports = Response;