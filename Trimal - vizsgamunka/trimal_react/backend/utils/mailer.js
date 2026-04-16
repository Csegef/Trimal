const nodemailer = require('nodemailer');

const fs = require('fs');
fs.appendFileSync('error.log', new Date().toISOString() + ' - MAILER LOAD: User=' + process.env.EMAIL_USER + ', PassLength=' + (process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0) + '\n');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendVerificationEmail = async (to, nickname, token) => {
  const verificationLink = `http://localhost:5173/verify?token=${token}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: 'Trimal RPG - Verify your account',
    text: `Welcome ${nickname}!\n\nPlease verify your account by clicking the link below:\n${verificationLink}\n\nBest regards,\nThe Trimal Team`,
    html: `<h1>Welcome ${nickname}!</h1><p>Please verify your account by clicking the link below:</p><p><a href="${verificationLink}">Verify Account</a></p><p>Best regards,<br>The Trimal Team</p>`
  };

  const fs = require('fs');
  const logError = (msg) => {
    fs.appendFileSync('error.log', new Date().toISOString() + ' - MAILER: ' + msg + '\n');
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logError('Verification email sent: ' + info.response);
    console.log('Verification email sent: ' + info.response);
    return true;
  } catch (error) {
    logError('Error sending email: ' + error.message);
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendVerificationEmail };
