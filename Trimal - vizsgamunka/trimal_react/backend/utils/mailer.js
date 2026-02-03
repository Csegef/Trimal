const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'info.trimal.rpg@gmail.com',
    pass: '#Taszi20251201852' // Note: storing cleartext passwords is bad practice, but per user instructions.
  }
});

const sendWelcomeEmail = async (to, nickname) => {
  const mailOptions = {
    from: 'info.trimal.rpg@gmail.com',
    to: to,
    subject: 'Welcome to Trimal RPG!',
    text: `Welcome ${nickname}!\n\nThank you for registering to Trimal RPG. We are excited to have you on board.\n\nBest regards,\nThe Trimal Team`,
    html: `<h1>Welcome ${nickname}!</h1><p>Thank you for registering to <strong>Trimal RPG</strong>. We are excited to have you on board.</p><p>Best regards,<br>The Trimal Team</p>`
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = { sendWelcomeEmail };
