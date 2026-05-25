import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Preconfigure Sahil's SMTP Connection (using nodemailer's built-in Gmail service)
let transporterSahil = null;
if (process.env.SMTP_USER_SAHIL && process.env.SMTP_PASS_SAHIL) {
    transporterSahil = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER_SAHIL,
            pass: process.env.SMTP_PASS_SAHIL,
        },
    });

    transporterSahil.verify((error) => {
        if (error) {
            console.error('❌ SMTP Sahil Connection Error:', error.message);
            console.error('❌ SMTP Sahil Error Details:', error);
        } else {
            console.log('✅ SMTP Transporter for Sahil loaded and active.');
        }
    });
}

// Preconfigure Nick's SMTP Connection (using nodemailer's built-in Gmail service)
let transporterNick = null;
if (process.env.SMTP_USER_NICK && process.env.SMTP_PASS_NICK) {
    transporterNick = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER_NICK,
            pass: process.env.SMTP_PASS_NICK,
        },
    });

    transporterNick.verify((error) => {
        if (error) {
            console.error('❌ SMTP Nick Connection Error:', error.message);
            console.error('❌ SMTP Nick Error Details:', error);
        } else {
            console.log('✅ SMTP Transporter for Nick loaded and active.');
        }
    });
}

// Global warning if neither transporter is loaded
if (!transporterSahil && !transporterNick) {
    console.warn('⚠️ Nodemailer SMTP credentials are not configured. Email notifications will fail until configured.');
}

/**
 * Get all admin emails from ADMIN_EMAILS environment variable
 */
export const getAdminEmails = () => {
    const adminEmailsStr = process.env.ADMIN_EMAILS || '';
    return adminEmailsStr.split(',').map(email => email.trim()).filter(email => email);
};

/**
 * Base email dispatch function
 * @param {string} to - Recipient email address(es) (comma-separated or array)
 * @param {string} subject - Email Subject line
 * @param {string} html - Beautiful HTML content
 * @param {string} [text] - Optional plain text fallback
 * @param {string} [adminEmail] - The email of the logged-in admin (Option B)
 * @param {string} [senderName] - Custom admin display name (Option A)
 * @param {Array} [attachments] - Optional array of attachments (nodemailer format)
 */
export const sendEmail = async ({ to, subject, html, text, adminEmail, senderName, attachments }) => {
    try {
        let activeTransporter = transporterSahil;
        let activeUser = process.env.SMTP_USER_SAHIL;

        // Dynamic routing based on the acting admin
        if (adminEmail) {
            const emailLower = adminEmail.toLowerCase();
            if (emailLower.includes('nickleister402@gmail.com') && transporterNick) {
                activeTransporter = transporterNick;
                activeUser = process.env.SMTP_USER_NICK;
            } else if (emailLower.includes('rajawatsahil256@gmail.com') && transporterSahil) {
                activeTransporter = transporterSahil;
                activeUser = process.env.SMTP_USER_SAHIL;
            }
        }

        // Fallback check if the chosen admin transporter isn't initialized
        if (!activeTransporter) {
            activeTransporter = transporterSahil || transporterNick;
            activeUser = activeTransporter ? activeTransporter.options.auth.user : null;
        }

        // If still nothing is loaded, throw an error
        if (!activeTransporter) {
            console.warn('⚠️ Email transmission skipped: SMTP transporters are not configured.');
            return null;
        }

        const fromHeader = senderName 
            ? `"${senderName} (via Tenancy Tracker)" <${activeUser}>` 
            : (process.env.EMAIL_FROM || `"Tenancy Tracker" <${activeUser}>`);

        const mailOptions = {
            from: fromHeader,
            to,
            replyTo: adminEmail || activeUser,
            subject,
            html,
            text: text || 'This email requires an HTML compatible viewer.',
            attachments: attachments || [],
        };

        const info = await activeTransporter.sendMail(mailOptions);
        console.log(`✉️ Email transmitted successfully via ${activeUser}: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error('❌ Failed to transmit email:', error.message);
        throw new Error(`Email transmission failed: ${error.message}`);
    }
};
