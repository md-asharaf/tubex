export const getEmailTemplate = (name,resetLink)=>{
return  `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <p>Hello ${name},</p>
    <p>
      We received a request to reset your password for your TubeX account.<br>
      To reset your password, please click the button below:
    </p>
    <p>
      <a href="${resetLink}" 
         style="display: inline-block; padding: 12px 24px; background-color: #007bff; color: #fff; text-decoration: none; border-radius: 4px; font-weight: bold;">
        Reset Password
      </a>
    </p>
    <p>
      <small>
        This link will expire in 10 minutes for your security.<br>
        If the button above does not work, copy and paste the following URL into your browser:<br>
        <a href="${resetLink}">${resetLink}</a>
      </small>
    </p>
    <p>
      If you did not request a password reset, please ignore this email or contact support.
    </p>
    <p>Thank you,<br>The TubeX Team</p>
  </body>
</html>
`;
}

export const getOtpEmailTemplate = (name, otp) => {
return `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #333;">
    <p>Hello ${name},</p>
    <p>
      You requested to set a password for your TubeX account.<br>
      Please use the following OTP to verify your request:
    </p>
    <p>
      <span style="display: inline-block; padding: 12px 24px; background-color: #f4f4f4; border: 1px solid #ddd; font-size: 24px; letter-spacing: 4px; font-weight: bold; border-radius: 4px;">
        ${otp}
      </span>
    </p>
    <p>
      <small>
        This OTP is valid for 10 minutes.<br>
        If you did not request this, please ignore this email.
      </small>
    </p>
    <p>Thank you,<br>The TubeX Team</p>
  </body>
</html>
`;
}
