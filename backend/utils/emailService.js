import { google } from 'googleapis';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Get admin emails list from configuration
 */
export const getAdminEmails = () => {
    const adminEmailsStr = process.env.ADMIN_EMAILS || '';
    return adminEmailsStr.split(',').map(email => email.trim()).filter(email => email);
};

/**
 * Log in admin के अनुसार डायनामिक OAuth2 client तैयार करना
 */
const getOAuth2Client = async (adminEmail) => {
    let refreshToken;

    const emailSahil = process.env.ADMIN_SAHIL_EMAIL || 'rajawatsahil256@gmail.com';
    const emailNick = process.env.ADMIN_NICK_EMAIL || 'nickleister402@gmail.com';

    const emailSahilLower = emailSahil.toLowerCase();
    const emailNickLower = emailNick.toLowerCase();
    const adminEmailLower = adminEmail ? adminEmail.toLowerCase() : '';

    if (adminEmailLower.includes(emailSahilLower)) {
        refreshToken = process.env.ADMIN_SAHIL_REFRESH_TOKEN;
        adminEmail = emailSahil;
    } else if (adminEmailLower.includes(emailNickLower)) {
        refreshToken = process.env.ADMIN_NICK_REFRESH_TOKEN;
        adminEmail = emailNick;
    } else {
        // क्रॉन जॉब या बैकग्राउंड रिमाइंडर के लिए डिफ़ॉल्ट साहिल का टोकन
        refreshToken = process.env.ADMIN_SAHIL_REFRESH_TOKEN;
        adminEmail = emailSahil;
    }

    if (!refreshToken) {
        throw new Error(`Refresh token for ${adminEmail} is not configured in your .env file.`);
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return { oauth2Client, adminEmail };
};

/**
 * ईमेल भेजने का मुख्य फ़ंक्शन (संसार के किसी भी यूजर को मेल भेजने के लिए - Gmail HTTP API के साथ)
 */
export const sendEmail = async ({ to, subject, html, htmlContent, text, adminEmail, fromAdminEmail, senderName, attachments }) => {
    const sender = adminEmail || fromAdminEmail || process.env.ADMIN_SAHIL_EMAIL || 'rajawatsahil256@gmail.com';
    const content = html || htmlContent;

    try {
        // 1. Get OAuth2 client for the specified admin
        const { oauth2Client, adminEmail: finalAdminEmail } = await getOAuth2Client(sender);

        const fromHeader = senderName 
            ? `"${senderName}" <${finalAdminEmail}>` 
            : (process.env.EMAIL_FROM || `"Tenancy Tracker" <${finalAdminEmail}>`);

        // 2. Compose MIME message using MailComposer
        const composer = new MailComposer({
            from: fromHeader,
            to: to,
            replyTo: finalAdminEmail,
            subject: subject,
            html: content,
            text: text || 'This email requires HTML.',
            attachments: attachments || []
        });

        const compiledMessage = await composer.compile().build();

        // 3. Base64url encode the compiled MIME message
        const base64SafeMessage = Buffer.from(compiledMessage)
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 4. Send email using the Gmail REST API (over HTTP)
        const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: base64SafeMessage
            }
        });

        console.log(`🟢 Success! Email sent from ${finalAdminEmail} to ${to}. Message ID: ${res.data.id}`);
        return { success: true, messageId: res.data.id };
    } catch (error) {
        console.error(`🔴 Email delivery failed from ${sender} to ${to}:`, error.message || error);
        throw error;
    }
};
