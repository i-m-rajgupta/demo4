const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const counsellorSchema =new Schema(
     {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9]{10}$/, "Please enter a valid 10-digit phone number"],
    },
    qualification: {
      type: String,
      required: true,
      trim: true,
    },
    experience: {
      type: Number,
      required: true,
      min: 1,
      max: 40,
    },
      password: { type: String, required: true }, 
  },
  { timestamps: true }
);


module.exports = mongoose.model("Counsellor",counsellorSchema);