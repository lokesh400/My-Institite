const mongoose = require("mongoose");

const formSchema = new mongoose.Schema({
    title: { type: String, required: true },
    created: { type: Date, default: Date.now }, // ✅ Fix: Correct date initialization
    fields: [
        {
            label: { type: String, required: true },
            type: { type: String, required: true }, // e.g., text, number, checkbox
            required: { type: Boolean, default: false },
            options: { type: [String], default: [] }, // Array of strings for dropdown, radio, etc.
        },
    ],
});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
