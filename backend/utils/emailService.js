import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Get admin emails
export const getAdminEmails = () => {
    const adminEmailsStr = process.env.ADMIN_EMAILS || '';
    return adminEmailsStr.split(',').map(email => email.trim()).filter(email => email);
};

// Create a simple, reliable Gmail transporter
const createTransporter = (user, pass) => {
    return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
            user: user,
            pass: pass,
        },
    });
};

// Initialize transporters
let transporterSahil = null;
let transporterNick = null;

if (process.env.SMTP_USER_SAHIL && process.env.SMTP_PASS_SAHIL) {
    transporterSahil = createTransporter(process.env.SMTP_USER_SAHIL, process.env.SMTP_PASS_SAHIL);
    console.log('✅ Sahil transporter initialized');
}

if (process.env.SMTP_USER_NICK && process.env.SMTP_PASS_NICK) {
    transporterNick = createTransporter(process.env.SMTP_USER_NICK, process.env.SMTP_PASS_NICK);
    console.log('✅ Nick transporter initialized');
}

// Main send email function
export const sendEmail = async ({ to, subject, html, text, adminEmail, senderName, attachments }) => {
    try {
        // Choose transporter based on adminEmail, or default to first available
        let transporter = transporterSahil;
        let fromUser = process.env.SMTP_USER_SAHIL;

        if (adminEmail) {
            const emailLower = adminEmail.toLowerCase();
            if (emailLower.includes('nickleister402@gmail.com') && transporterNick) {
                transporter = transporterNick;
                fromUser = process.env.SMTP_USER_NICK;
            }
        }

        // Fallback
        if (!transporter) {
            transporter = transporterSahil || transporterNick;
            fromUser = transporter ? (transporter === transporterSahil ? process.env.SMTP_USER_SAHIL : process.env.SMTP_USER_NICK) : null;
        }

        if (!transporter) {
            console.warn('⚠️ No email transporter available');
            return null;
        }

        const fromHeader = senderName 
            ? `"${senderName} (via Tenancy Tracker)" <${fromUser}>` 
            : (process.env.EMAIL_FROM || `"Tenancy Tracker" <${fromUser}>`);

        const mailOptions = {
            from: fromHeader,
            to,
            replyTo: adminEmail || fromUser,
            subject,
            html,
            text: text || 'This email requires HTML.',
            attachments: attachments || [],
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✉️ Email sent: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Email failed:', error.message);
        throw error;
    }
};
