const nodemailer = require('nodemailer');
require("dotenv").config()

exports.transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });