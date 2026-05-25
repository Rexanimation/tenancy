import cron from 'node-cron';
import Record from '../models/Record.js';
import User from '../models/User.js';
import { sendEmail } from './emailService.js';
import { getPaymentReminderTemplate } from './emailTemplates.js';

export const startPaymentReminderCron = () => {
    // Run every day at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
        console.log('⏰ Running daily payment reminder cron job...');
        try {
            // Find all unpaid records
            const unpaidRecords = await Record.find({ paid: false }).populate('tenant', 'name email');

            for (const record of unpaidRecords) {
                if (!record.tenant || !record.tenant.email) continue;

                // Calculate days overdue or due soon
                const dueDate = new Date(record.date);
                const today = new Date();
                const timeDiff = dueDate.getTime() - today.getTime();
                const daysOverdue = Math.ceil(-timeDiff / (1000 * 3600 * 24));

                // Calculate total amount
                const totalAmount = Number(record.rent) + Number(record.electricity) + Number(record.parking) + Number(record.penalties || 0) + Number(record.dues || 0) + Number(record.municipalFee || 0) - Number(record.advanceCredit || 0);

                // Send reminder
                sendEmail({
                    to: record.tenant.email,
                    subject: `Reminder: Rent Payment - ${record.month} ${record.year}`,
                    html: getPaymentReminderTemplate(
                        record.tenant.name,
                        record.month,
                        record.year,
                        totalAmount > 0 ? totalAmount : 0,
                        daysOverdue
                    ),
                    senderName: 'Tenancy Tracker System'
                }).catch(err => console.error(`Silent Email Error (Reminder for ${record.tenant.name}):`, err));
            }

            console.log(`✅ Sent ${unpaidRecords.length} payment reminders`);
        } catch (error) {
            console.error('❌ Error in payment reminder cron job:', error);
        }
    }, {
        timezone: 'Asia/Kolkata' // Set to your timezone
    });

    console.log('📅 Payment reminder cron job scheduled (daily at 9:00 AM IST)');
};
