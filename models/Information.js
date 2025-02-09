const mongoose = require("mongoose");

const InformationSchema = new mongoose.Schema({
  address: {
    type: String,
    default: ""
  },
  city: {
    type: String,
    default: ""
  },
  state: {
    type: String,
    default: ""
  },
  zipCode: {
    type: String,
    default: ""
  },
  phone: {
    type: String,
    default: ""
  },
  establishedYear: {
    type: String,
    default: ""
  },
  principal: {
    name: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      lowercase: true,
      default: ""
    },
    phone: {
      type: String,
      default: ""
    }
  },
  socialMedia: {
    facebook: {
      type: String,
      default: ""
    },
    twitter: {
      type: String,
      default: ""
    },
    instagram: {
      type: String,
      default: ""
    },
    linkedin: {
      type: String,
      default: ""
    },
    email: {
      type: String,
      lowercase: true,
      default: ""
    }
  },
  updates: {
    calander: {
      type: Object, // Corrected from direct string default
      default: { date: "", event: "" }
    },
    latestUpdates: {
      type: Array,
      default: [] // Changed default from string to an empty array
    },
    headerUpdates: {
      type: String,
      default: ""
    }
  }
});

const Information = mongoose.model("Information", InformationSchema);

module.exports = Information;
