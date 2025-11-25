module.exports = (otp) => `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; padding: 40px;">
  <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; 
              box-shadow: 0 4px 12px rgba(0,0,0,0.1); padding: 30px; text-align: center;">

    <h1 style="color: #2c3e50; margin-bottom: 10px;">LuxCart</h1>
    <p style="color: #888; font-size: 14px; margin-bottom: 25px;">
      Account Security Notification
    </p>

    <h2 style="color: #333; margin-bottom: 15px;">Confirm Email Change</h2>

    <p style="color: #555; font-size: 16px; margin-bottom: 20px;">
      A request was made to change the email address linked to your LuxCart account.
      To confirm this change, enter the OTP below.
    </p>

    <div style="display: inline-block; background: #2c3e50; color: #fff; font-size: 28px; 
                letter-spacing: 4px; font-weight: bold; padding: 12px 24px; 
                border-radius: 8px; margin-bottom: 20px;">
      ${otp}
    </div>

    <p style="color: #999; font-size: 14px; margin-bottom: 30px;">
      The code expires in <b>5 minutes</b>. Do not share it with anyone.
    </p>

    <p style="color: #d9534f; font-size: 14px; margin-bottom: 25px;">
      If <b>you did NOT request</b> this change, someone else may be trying to access your account. 
      Please secure your account immediately.
    </p>

    <hr style="border: none; height: 1px; background: #eee; margin: 20px 0;">
    <p style="color: #888; font-size: 13px;">
      &copy; ${new Date().getFullYear()} <b>LuxCart</b>. All rights reserved.
    </p>
  </div>
</div>
`;
