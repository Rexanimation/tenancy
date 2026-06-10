import Receipt from '../models/Receipt.js';
import fs from 'fs';
import path from 'path';
import { generatePaymentReceiptPDF } from './pdfService.js';

/**
 * Automatically generates a PDF receipt, saves it to disk, stores metadata, and broadcasts a socket event.
 */
export const createReceipt = async (record, tenant, amount, paymentMethod, transactionId, socketIo) => {
    try {
        console.log(`📄 Generating receipt for tenant: ${tenant.name}, record: ${record.month} ${record.year}, amount: ₹${amount}`);
        
        // Generate PDF
        const pdfBuffer = await generatePaymentReceiptPDF({
            tenantName: tenant.name,
            tenantEmail: tenant.email,
            amount: amount,
            transactionId: transactionId || record._id.toString(),
            paymentMethod: paymentMethod || 'cash',
            month: record.month,
            year: record.year
        });

        // Save PDF to file system
        const filename = `receipt-${record._id}-${Date.now()}.pdf`;
        const dirPath = path.join(process.cwd(), 'uploads', 'receipts');
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
        const filepath = path.join(dirPath, filename);
        fs.writeFileSync(filepath, pdfBuffer);

        const pdfUrl = `/uploads/receipts/${filename}`;

        // Create Receipt record
        const receipt = await Receipt.create({
            tenant: tenant._id,
            record: record._id,
            amount: amount,
            paymentMethod: paymentMethod || 'cash',
            transactionId: transactionId || 'MANUAL_REF_' + Date.now(),
            pdfUrl: pdfUrl,
            paidDate: record.paidDate || new Date()
        });

        // Populate receipt and emit socket event
        const populatedReceipt = await Receipt.findById(receipt._id)
            .populate('tenant', 'name email unit')
            .populate('record');

        if (socketIo) {
            socketIo.emit('receipt_created', populatedReceipt);
            console.log('⚡ Socket event emitted: receipt_created');
        }

        return populatedReceipt;
    } catch (error) {
        console.error('🔴 Error in createReceipt:', error);
        return null;
    }
};
