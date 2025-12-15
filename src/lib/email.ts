import nodemailer from 'nodemailer';

// Email configuration
const getTransporter = () => {
  // Production: Use SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  // Development: Use Ethereal (fake SMTP) or console logging
  if (process.env.NODE_ENV === 'development') {
    // For development, we'll log to console and optionally use Ethereal
    return null;
  }

  throw new Error('Email configuration is missing. Set SENDGRID_API_KEY in production.');
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || 'noreply@triplec.com';

  // Development mode: Log to console
  if (!transporter) {
    console.log('\n========================================');
    console.log('EMAIL (Development Mode)');
    console.log('========================================');
    console.log(`To: ${to}`);
    console.log(`From: ${from}`);
    console.log(`Subject: ${subject}`);
    console.log('----------------------------------------');
    console.log(text || html.replace(/<[^>]*>/g, ''));
    console.log('========================================\n');
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

// Email templates
export function getVerificationEmailTemplate(name: string, verificationUrl: string): { subject: string; html: string; text: string } {
  const subject = '[Triple C] 이메일 인증을 완료해주세요';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>이메일 인증</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <!-- Logo -->
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; font-size: 28px; margin: 0;">Triple C</h1>
        <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px;">AI Marketing Contents Agent</p>
      </div>

      <!-- Content -->
      <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 16px;">
        안녕하세요${name ? `, ${name}님` : ''}! 👋
      </h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        Triple C에 가입해 주셔서 감사합니다.<br>
        아래 버튼을 클릭하여 이메일 인증을 완료해주세요.
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}"
           style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none;
                  padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;
                  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);">
          이메일 인증하기
        </a>
      </div>

      <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
        버튼이 작동하지 않는 경우, 아래 링크를 브라우저에 복사하여 붙여넣어 주세요:
      </p>
      <p style="color: #6366f1; font-size: 14px; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 6px;">
        ${verificationUrl}
      </p>

      <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
        이 링크는 24시간 후에 만료됩니다.<br>
        본인이 가입하지 않으셨다면 이 이메일을 무시해주세요.
      </p>

      <!-- Footer -->
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        © 2024 Triple C. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
안녕하세요${name ? `, ${name}님` : ''}!

Triple C에 가입해 주셔서 감사합니다.
아래 링크를 클릭하여 이메일 인증을 완료해주세요:

${verificationUrl}

이 링크는 24시간 후에 만료됩니다.
본인이 가입하지 않으셨다면 이 이메일을 무시해주세요.

© 2024 Triple C
`;

  return { subject, html, text };
}

export function getPasswordResetEmailTemplate(name: string, resetUrl: string): { subject: string; html: string; text: string } {
  const subject = '[Triple C] 비밀번호 재설정';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <div style="background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #6366f1; font-size: 28px; margin: 0;">Triple C</h1>
      </div>

      <h2 style="color: #1f2937; font-size: 20px; margin-bottom: 16px;">
        비밀번호 재설정 요청
      </h2>

      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
        ${name ? `${name}님, ` : ''}비밀번호 재설정을 요청하셨습니다.<br>
        아래 버튼을 클릭하여 새 비밀번호를 설정해주세요.
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}"
           style="display: inline-block; background-color: #6366f1; color: #ffffff; text-decoration: none;
                  padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
          비밀번호 재설정
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
        이 링크는 1시간 후에 만료됩니다.<br>
        본인이 요청하지 않으셨다면 이 이메일을 무시해주세요.
      </p>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;">
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
        © 2024 Triple C. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
비밀번호 재설정 요청

${name ? `${name}님, ` : ''}비밀번호 재설정을 요청하셨습니다.
아래 링크를 클릭하여 새 비밀번호를 설정해주세요:

${resetUrl}

이 링크는 1시간 후에 만료됩니다.
본인이 요청하지 않으셨다면 이 이메일을 무시해주세요.

© 2024 Triple C
`;

  return { subject, html, text };
}
