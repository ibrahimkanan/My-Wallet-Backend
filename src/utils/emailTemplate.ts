export const OTP_EMAIL_TEMPLATE = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Code</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 40px 20px;">
  <div style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 30px; text-align: center;">
    <h2 style="color: #111827; margin-top: 0;">My Wallet</h2>
    <p style="color: #374151;">Your login code is:</p>
    <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827; background-color: #f4f4f5; padding: 12px 20px; border-radius: 6px; margin: 20px 0; display: inline-block;">
      {code}
    </div>
    <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes. If you didn't request it, ignore this email.</p>
  </div>
</body>
</html>
`;
