require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Multer — keep uploads in memory and limit to 5 photos / 5MB each
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed.'));
  },
});

// Email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /book — handles booking AND quotation submissions
app.post('/book', upload.array('photos', 5), async (req, res) => {
  const { name, email, phone, address, date, time, notes, requestType } = req.body;
  const isQuote = requestType === 'quotation';

  if (!name || !email || !phone || !address || !date || !time) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  const formattedDate = new Date(date).toLocaleDateString('en-NZ', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // Build attachments from uploaded files (quotation only)
  const attachments = (req.files || []).map((f, i) => ({
    filename: f.originalname || `photo-${i + 1}.jpg`,
    content: f.buffer,
    contentType: f.mimetype,
  }));

  const heading       = isQuote ? 'New Quotation Request'      : 'New Booking Request';
  const customerTitle = isQuote ? 'Quotation Received!'        : 'Booking Confirmed!';
  const customerSub   = isQuote ? 'Thanks for requesting a quote' : 'Thanks for booking with us';
  const ownerSubject  = isQuote
    ? `New Quotation Request — GB Lawnmowing — ${formattedDate}`
    : `New Booking — GB Lawnmowing — ${formattedDate}`;
  const customerSubject = isQuote
    ? `Quotation Request Received — ${formattedDate}`
    : `Booking Confirmed — ${formattedDate}`;
  const customerBody = isQuote
    ? `We've received your quotation request${attachments.length ? ` (with ${attachments.length} photo${attachments.length > 1 ? 's' : ''} attached)` : ''}. We'll review the details and get back to you within 24 hours with a fair quote.`
    : `We've received your lawn mowing booking. Here are your details:`;

  // Email to OWNER
  const ownerMail = {
    from: `"GB Lawnmowing" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: ownerSubject,
    attachments,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2e7d32; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">${heading}</h1>
          <p style="color: #a5d6a7; margin: 6px 0 0;">GB Lawnmowing</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #333;">Hi <strong>Owner</strong>,</p>
          <p style="color: #333;">You have a new ${isQuote ? 'quotation request' : 'lawn mowing booking'}. Here are the details:</p>
          <div style="background: #f1f8e9; border-left: 4px solid #2e7d32; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 6px 0; color: #333;"><strong>Request Type:</strong> ${isQuote ? 'Quotation' : 'Booking'}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Customer Name:</strong> ${name}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Phone:</strong> ${phone}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Address:</strong> ${address}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Preferred Date:</strong> ${formattedDate}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Preferred Time:</strong> ${time}</p>
            ${notes ? `<p style="margin: 6px 0; color: #333;"><strong>Notes:</strong> ${notes}</p>` : ''}
            ${attachments.length ? `<p style="margin: 6px 0; color: #333;"><strong>Photos attached:</strong> ${attachments.length}</p>` : ''}
          </div>
          <p style="color: #555; font-size: 14px;">Reply to this email or contact the customer directly at ${email}.</p>
        </div>
        <div style="background: #f9f9f9; padding: 16px 24px; text-align: center; color: #888; font-size: 13px;">
          GB Lawnmowing — Professional &amp; Reliable
        </div>
      </div>
    `,
  };

  // Confirmation email to CUSTOMER
  const customerMail = {
    from: `"GB Lawnmowing" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: customerSubject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #2e7d32; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 22px;">${customerTitle}</h1>
          <p style="color: #a5d6a7; margin: 6px 0 0;">${customerSub}</p>
        </div>
        <div style="padding: 24px;">
          <p style="color: #333;">Hi <strong>${name}</strong>,</p>
          <p style="color: #333;">${customerBody}</p>
          <div style="background: #f1f8e9; border-left: 4px solid #2e7d32; padding: 16px; border-radius: 4px; margin: 16px 0;">
            <p style="margin: 6px 0; color: #333;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Time:</strong> ${time}</p>
            <p style="margin: 6px 0; color: #333;"><strong>Address:</strong> ${address}</p>
          </div>
          <p style="color: #555; font-size: 14px;">${isQuote ? "We'll be in touch shortly with your quote." : "We'll be in touch shortly to confirm."} If you need to make any changes, just reply to this email.</p>
        </div>
        <div style="background: #f9f9f9; padding: 16px 24px; text-align: center; color: #888; font-size: 13px;">
          GB Lawnmowing — Professional &amp; Reliable
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(ownerMail);
    await transporter.sendMail(customerMail);
    res.json({
      success: true,
      message: isQuote
        ? 'Quotation request sent! Check your email — we\'ll get back to you with a quote shortly.'
        : 'Booking confirmed! Check your email for details.',
    });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ success: false, message: 'Saved but email failed. Please check server config.' });
  }
});

// Friendly multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || /image files/.test(err.message || '')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Lawn Booking server running at http://localhost:${PORT}`);
});
