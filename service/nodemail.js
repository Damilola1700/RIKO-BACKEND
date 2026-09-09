const nodeMail = require("nodemailer");
const dotenv = require("dotenv");
dotenv.config()

const transporter = nodeMail.createTransport({
    host: "smtp.gmail.com",    
    port: 587,                 
    secure: false,             
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, 
    },
});

async function sendMail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
      from: `"RIKO" <${process.env.EMAIL_USER}>`,
      to ,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email send failed:", error);
    return { success: false, error: error.message };
  }
}

async function verifyMailTransport() {
  return transporter.verify();
}

function createOtpEmail({ otp, expiresInMinutes, audience = "member" }) {
  const isAdmin = audience === "admin";
  const heading = isAdmin ? "Confirm your admin account" : "Confirm your RIKO account";
  const intro = isAdmin
    ? "Use this code to activate your RIKO admin access."
    : "Use this code to finish creating your RIKO account.";

  return {
    text: `${heading}\n\n${intro}\n\nYour OTP is ${otp}. It expires in ${expiresInMinutes} minutes.\n\nIf you did not request this code, you can safely ignore this email.`,
    html: `
      <div style="margin:0;padding:32px 16px;background:#f8f8ff;font-family:Arial,Helvetica,sans-serif;color:#2a2b3b">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #ececf2">
          <div style="padding:28px 32px;background:#2a2b3b;text-align:center">
            <div style="font-size:28px;font-weight:700;letter-spacing:-.5px;color:#ffffff">RIKO<span style="color:#EF6905">.</span></div>
            <div style="margin-top:8px;color:#ffffff99;font-size:12px;letter-spacing:2px;text-transform:uppercase">See. Read. Write.</div>
          </div>
          <div style="padding:32px">
            <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;color:#2a2b3b">${heading}</h1>
            <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#5e5f6c">${intro}</p>
            <div style="margin:0 0 24px;padding:20px;border-radius:14px;background:#fff4eb;text-align:center">
              <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#9a4a0c">Your verification code</div>
              <div style="font-size:32px;font-weight:700;letter-spacing:10px;color:#EF6905">${otp}</div>
            </div>
            <p style="margin:0;font-size:14px;line-height:1.6;color:#5e5f6c">This code expires in <strong style="color:#2a2b3b">${expiresInMinutes} minutes</strong>. If you did not request it, you can safely ignore this email.</p>
          </div>
          <div style="padding:18px 32px;background:#f8f8ff;text-align:center;font-size:12px;color:#8b8c97">© RIKO</div>
        </div>
      </div>`,
  };
}

module.exports = { sendMail, verifyMailTransport, createOtpEmail };
