const nodemailer = require("nodemailer");

const getTransporter = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER and EMAIL_PASS must be set");
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });
};

const sendVerificationEmail = async ({ to, token }) => {
  const transporter = getTransporter();
  const verifyUrl = `http://localhost:3000/verify/${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject: "Verify your BGSU Marketplace email",
    html: `
      <h2>Welcome to BGSU Marketplace</h2>
      <p>Please verify your email to activate your account.</p>
      <p>
        <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer">
          Click here to verify your account
        </a>
      </p>
      <p>This link expires in 5 minutes.</p>
    `,
  });
};

module.exports = {
  sendVerificationEmail,
};
