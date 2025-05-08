import nodemailer from 'nodemailer';

export const mailtrapTransporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: parseInt(process.env.MAILTRAP_PORT || '2525'),
  auth: {
    user: process.env.MAILTRAP_USERNAME,
    pass: process.env.MAILTRAP_PASSWORD,
  },
});

export const sendOTPEmail = async (email: string, otp: string) => {
  try {
    const info = await mailtrapTransporter.sendMail({
      from: '"Kiosk System" <kiosk@example.com>',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is: ${otp}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Your One-Time Password</h2>
          <p>Use the following code to login to your Kiosk account:</p>
          <div style="background-color: #f4f4f4; padding: 15px; font-size: 24px; text-align: center; letter-spacing: 5px; margin: 20px 0;">
            <strong>${otp}</strong>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

export const sendPaymentReminder = async (email: string, balance: number, items: any[]) => {
  try {
    const info = await mailtrapTransporter.sendMail({
      from: '"Kiosk System" <kiosk@example.com>',
      to: email,
      subject: 'Payment Reminder',
      text: `You have an outstanding balance of $${balance.toFixed(2)}. Please settle your balance soon.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Payment Reminder</h2>
          <p>You have an outstanding balance of <strong>$${balance.toFixed(2)}</strong>.</p>
          <h3>Recent Purchases:</h3>
          <ul>
            ${items.map(item => `<li>${item.product.name} - $${item.price.toFixed(2)}</li>`).join('')}
          </ul>
          <p>Please settle your balance at your earliest convenience.</p>
        </div>
      `,
    });
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}; 