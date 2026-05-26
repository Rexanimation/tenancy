import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Get admin emails
export const getAdminEmails = () => {
    const adminEmailsStr = process.env.ADMIN_EMAILS || '';
    return adminEmailsStr.split(',').map(email => email.trim()).filter(email => email);
};

// Create a highly resilient Gmail transporter that works on both local and Render (bypasses IPv6 DNS resolution)
const createTransporter = (user, pass) => {
    const isGmail = !process.env.SMTP_HOST || process.env.SMTP_HOST === 'smtp.gmail.com';
    const host = isGmail ? '142.251.12.109' : (process.env.SMTP_HOST || 'smtp.gmail.com');
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true';

    return nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure,
        requireTLS: true,
        auth: {
            user: user,
            pass: pass,
        },
        tls: {
            servername: 'smtp.gmail.com', // Matches Gmail's SSL certificate domain when connecting via direct IP
        },
        connectionTimeout: 15000,
        greetingTimeout: 15000,
        socketTimeout: 15000,
    });
};

// Initialize transporters
let transporterSahil = null;
let transporterNick = null;

if (process.env.SMTP_USER_SAHIL && process.env.SMTP_PASS_SAHIL) {
    transporterSahil = createTransporter(process.env.SMTP_USER_SAHIL, process.env.SMTP_PASS_SAHIL);
    console.log('✅ Sahil Gmail SMTP transporter initialized');
}

if (process.env.SMTP_USER_NICK && process.env.SMTP_PASS_NICK) {
    transporterNick = createTransporter(process.env.SMTP_USER_NICK, process.env.SMTP_PASS_NICK);
    console.log('✅ Nick Gmail SMTP transporter initialized');
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
            ? `"${senderName}" <${fromUser}>` 
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


