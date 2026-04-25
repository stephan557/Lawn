require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

console.log('Testing email with:');
console.log('USER:', process.env.EMAIL_USER);
console.log('PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 'NOT SET');

transporter.verify((error, success) => {
  if (error) {
    console.log('FAILED:', error.message);
  } else {
    console.log('SUCCESS: Email connection works!');
  }
});
