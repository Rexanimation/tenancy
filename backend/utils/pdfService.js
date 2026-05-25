import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export const generatePaymentReceiptPDF = (data) => {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];
        const stream = new PassThrough();

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Header
        doc
            .fillColor('#4f46e5')
            .fontSize(24)
            .text('Tenancy Tracker', { align: 'center' })
            .moveDown();

        doc
            .fillColor('#1f2937')
            .fontSize(18)
            .text('Payment Receipt', { align: 'center' })
            .moveDown(2);

        // Tenant Info
        doc
            .fontSize(14)
            .text('Tenant Name:', { continued: true })
            .font('Helvetica-Bold')
            .text(` ${data.tenantName}`)
            .font('Helvetica');

        doc
            .text('Tenant Email:', { continued: true })
            .font('Helvetica-Bold')
            .text(` ${data.tenantEmail}`)
            .font('Helvetica')
            .moveDown();

        // Receipt Details
        doc
            .text('Receipt Date:', { continued: true })
            .font('Helvetica-Bold')
            .text(` ${new Date().toLocaleDateString()}`)
            .font('Helvetica');

        doc
            .text('For Month:', { continued: true })
            .font('Helvetica-Bold')
            .text(` ${data.month} ${data.year}`)
            .font('Helvetica')
            .moveDown();

        // Payment Info
        doc
            .fillColor('#4f46e5')
            .fontSize(16)
            .text('Payment Details', { underline: true })
            .fillColor('#1f2937')
            .fontSize(14)
            .moveDown();

        doc
            .text('Paid Amount:', { continued: true })
            .font('Helvetica-Bold')
            .fillColor('#10b981')
            .text(` ₹${data.amount}`)
            .fillColor('#1f2937')
            .font('Helvetica');

        doc
            .text('Payment Method:', { continued: true })
            .font('Helvetica-Bold')
            .text(` ${data.paymentMethod.toUpperCase()}`)
            .font('Helvetica');

        doc
            .text('Transaction ID:', { continued: true })
            .font('Helvetica-Bold')
            .text(` ${data.transactionId}`)
            .font('Helvetica')
            .moveDown(2);

        // Footer
        doc
            .fontSize(10)
            .fillColor('#9ca3af')
            .text('This is a system-generated receipt and does not require a signature.', { align: 'center' })
            .moveDown()
            .text(`© ${new Date().getFullYear()} Tenancy Tracker. All rights reserved.`, { align: 'center' });

        doc.end();
    });
};
