require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /book — handles booking form submission
app.post('/book', async (req, res) => {
  const { name, email, phone, address, date, time, notes } = req.body;

  if (!name || !email || !phone || !address || !date || !time) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  const formattedDate = new Date(date).toLocaleDateString('en-NZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Email to OWNER
  const ownerMail = {
    from: `"GB Lawn Care Master" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: `New Booking — GB Lawn Care Master — ${formattedDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2e7d32; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">New Booking Request</h1>
          <p style="color: #a5d6a7; margin: 6px 0 0;">GB Lawn Care Master</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #333;">Hi <strong>Owner</strong>,</p>
          <p style="color: #333;">You have a new lawn mowing booking. Here are the details:</p>
          <div style="background: #f1f8e9; border-left: 4px solid #2e7d32; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 6px 0; color: #333;"><strong>Customer Name:</strong> ${name}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Phone:</strong> ${phone}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Address:</strong> ${address}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Time:</strong> ${time}</p>
            ${notes ? `<p style="margin: 6px 0; color: #333;"><strong>Notes:</strong> ${notes}</p>` : ''}
          </div>
          <p style="color: #555; font-size: 14px;">Reply to this email or contact the customer directly at ${email}.</p>
        </div>
        <div style="background: #f9f9f9; padding: 16px 24px; text-align: center; color: #888; font-size: 13px;">
          GB Lawn Care Master — Professional &amp; Reliable
        </div>
      </div>
    `,
  };

  // Confirmation email to CUSTOMER
  const customerMail = {
    from: `"GB Lawn Care Master" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Booking Confirmed — ${formattedDate}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2e7d32; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">Booking Confirmed!</h1>
          <p style="color: #a5d6a7; margin: 6px 0 0;">Thanks for booking with us</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #333;">Hi <strong>${name}</strong>,</p>
          <p style="color: #333;">We've received your lawn mowing booking. Here are your details:</p>
          <div style="background: #f1f8e9; border-left: 4px solid #2e7d32; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 6px 0; color: #333;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Time:</strong> ${time}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Address:</strong> ${address}</p>
          </div>
          <p style="color: #555; font-size: 14px;">We'll be in touch shortly to confirm. If you need to make any changes, please reply to this email.</p>
        </div>
        <div style="background: #f9f9f9; padding: 16px 24px; text-align: center; color: #888; font-size: 13px;">
          GB Lawn Care Master — Professional &amp; Reliable
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(ownerMail);
    await transporter.sendMail(customerMail);
    res.json({ success: true, message: 'Booking confirmed! Check your email.' });
  } catch (err) {
    console.error('Email error full:', JSON.stringify(err, null, 2));
    console.error('Email error message:', err.message);
    console.error('Email config — USER:', process.env.EMAIL_USER, '| OWNER:', process.env.OWNER_EMAIL, '| PASS length:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
    res.status(500).json({ success: false, message: 'Booking saved but email failed. Please check server config.' });
  }
});

app.listen(PORT, () => {
  console.log(`Lawn Booking server running at http://localhost:${PORT}`);
});
