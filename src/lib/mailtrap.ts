import nodemailer from 'nodemailer';

// Configure email transport - in production, use a real SMTP service
// For hackathon/development, we'll use mailtrap for testing
export async function createTransporter() {
  // For development, create a test account
  if (process.env.NODE_ENV !== 'production') {
    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      secure: false,
      auth: {
        user: "f44d7d6618800c",
        pass: "bc5e89870088c6",
      },
      debug: true, // Enable debugging
    });

    return {
      transporter,
      isTestAccount: true,
    };
  }

  // For production, use real SMTP settings from environment variables
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io",
    port: parseInt(process.env.EMAIL_PORT || "2525"),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || "f44d7d6618800c",
      pass: process.env.EMAIL_PASSWORD || "bc5e89870088c6",
    },
    debug: true, // Enable debugging
  });

  return { 
    transporter, 
    isTestAccount: false,
  };
}

// Send OTP email
export async function sendOTPEmail(email: string, otp: string) {
  try {
    console.log('Creating transporter for email:', email);
    const { transporter, isTestAccount } = await createTransporter();

    console.log('Mailtrap server is ready to send messages');
    console.log('Sending email to:', email, 'with OTP:', otp);

    // Send the email with OTP
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Wonder Beauties Kiosk" <no-reply@wonderbeauties.com>',
      to: email,
      subject: 'Your Login OTP Code',
      text: `Your one-time password is: ${otp}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a5568;">Your Login Code</h2>
          <p>Use the following one-time password to log in:</p>
          <div style="background-color: #edf2f7; padding: 16px; border-radius: 4px; text-align: center; font-size: 24px; letter-spacing: 4px; font-weight: bold;">
            ${otp}
          </div>
          <p style="margin-top: 16px;">This code will expire in 10 minutes.</p>
          <p style="color: #718096; font-size: 14px; margin-top: 24px;">
            If you didn't request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    console.log('Email send response:', info);

    // For test accounts, log additional info
    if (isTestAccount) {
      console.log('OTP Email sent to:', email);
      return {
        success: true,
        messageId: info.messageId,
      };
    }

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return {
      success: false,
      error: error,
    };
  }
}

export const sendPaymentReminder = async (email: string, balance: number, items: any[]) => {
  try {
    const { transporter } = await createTransporter();
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Wonder Beauties" <no-reply@wonderbeauties.com>',
      to: email,
      subject: 'Payment Reminder',
      text: `You have an outstanding balance of $${balance.toFixed(2)}. Please settle your balance soon.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #d63b7d;">Wonder Beauties</h1>
          </div>
          <h2>Payment Reminder</h2>
          <p>You have an outstanding balance of <strong>$${balance.toFixed(2)}</strong>.</p>
          <h3>Recent Purchases:</h3>
          <ul>
            ${items.map(item => `<li>${item.product.name} - $${item.price.toFixed(2)}</li>`).join('')}
          </ul>
          <p>Please settle your balance at your earliest convenience.</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 12px;">
            &copy; ${new Date().getFullYear()} Wonder Beauties. All rights reserved.
          </div>
        </div>
      `,
    });
    
    console.log('Payment reminder email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return { success: false, error };
  }
}; 