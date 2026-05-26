import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

// Get admin emails
export const getAdminEmails = () => {
    const adminEmailsStr = process.env.ADMIN_EMAILS || '';
    return adminEmailsStr.split(',').map(email => email.trim()).filter(email => email);
};

// Initialize Resend
let resend = null;
if (process.env.RESEND_API_KEY) {
    resend = new Resend(process.env.RESEND_API_KEY);
    console.log('✅ Resend email service initialized');
} else {
    console.warn('⚠️ RESEND_API_KEY is not defined in environment variables. Email sending will be skipped.');
}

// Main send email function
export const sendEmail = async ({ to, subject, html, text, adminEmail, senderName, attachments }) => {
    try {
        if (!resend) {
            console.warn('⚠️ Resend is not initialized. Skipping email send.');
            return null;
        }

        // Process 'to' list
        // Resend supports passing an array of emails or a single string email.
        // We will normalize it to an array of strings. If 'to' is a comma-separated string, split it.
        let recipients = [];
        if (Array.isArray(to)) {
            recipients = to;
        } else if (typeof to === 'string') {
            recipients = to.split(',').map(email => email.trim()).filter(email => email);
        }

        if (recipients.length === 0) {
            console.warn('⚠️ No recipients specified for email.');
            return null;
        }

        // Resend display name formatting.
        // If EMAIL_FROM is specified (e.g. 'onboarding@resend.dev' or a custom domain), we use it.
        // Otherwise, default to 'onboarding@resend.dev'.
        const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
        const fromHeader = senderName 
            ? `${senderName} <${fromEmail}>` 
            : `Tenancy Tracker <${fromEmail}>`;

        // Format attachments:
        // Nodemailer has { filename, content (buffer), contentType }
        // Resend has { filename, content (buffer) }
        const resendAttachments = attachments?.map(att => ({
            filename: att.filename,
            content: att.content,
        })) || [];

        // Build Resend request options
        const mailOptions = {
            from: fromHeader,
            to: recipients,
            subject: subject || 'Tenancy Tracker Notification',
            html: html || text || 'This email requires HTML.',
        };

        if (text) {
            mailOptions.text = text;
        }

        if (resendAttachments.length > 0) {
            mailOptions.attachments = resendAttachments;
        }

        // Handle Reply-To
        if (adminEmail) {
            mailOptions.replyTo = adminEmail;
        }

        console.log(`✉️ Sending email via Resend to ${recipients.join(', ')}: "${subject}"`);
        const response = await resend.emails.send(mailOptions);

        if (response.error) {
            console.error('❌ Resend API Error:', response.error);
            throw new Error(response.error.message || 'Unknown Resend error');
        }

        console.log(`✉️ Email sent successfully via Resend. ID: ${response.data?.id}`);
        return response.data;
    } catch (error) {
        console.error('❌ Resend Email failed:', error.message);
        throw error;
    }
};

