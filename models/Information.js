const mongoose = require("mongoose");

const InformationSchema = new mongoose.Schema({
  address: { type: String, default: "" },
  city: { type: String, default: "" },
  state: { type: String, default: "" },
  zipCode: { type: String, default: "" },
  phone: { type: String, default: "" },
  establishedYear: { type: String, default: "" },
  principal: {
    name: { type: String, default: "" },
    email: { type: String, lowercase: true, default: "" },
    phone: { type: String, default: "" }
  },
  socialMedia: {
    facebook: { type: String, default: "" },
    twitter: { type: String, default: "" },
    instagram: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    email: { type: String, lowercase: true, default: "" }
  },
  updates: {
    calendar: {
      type: Map, // Store multiple events as key-value pairs
      of: new mongoose.Schema({
        instant: { type: String, required: true },
        incident: { type: String, required: true }
      })
    },
    latestUpdates: { type: Array, default: [] },
    headerUpdates: { type: String, default: "" }
  }
});

const Information = mongoose.model("Information", InformationSchema);
module.exports = Information;
