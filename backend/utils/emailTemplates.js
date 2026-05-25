// Base wrapper styles for a sleek dark/light container card design
const getEmailWrapper = (title, contentHTML) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background-color: #f3f4f6;
            color: #1f2937;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05), 0 10px 15px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%);
            padding: 30px;
            text-align: center;
            color: #ffffff;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }
        .content {
            padding: 40px 30px;
            line-height: 1.6;
        }
        .content h2 {
            margin-top: 0;
            color: #111827;
            font-size: 20px;
        }
        .content p {
            margin-bottom: 20px;
            color: #4b5563;
        }
        .footer {
            background-color: #f9fafb;
            padding: 20px;
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            border-top: 1px solid #f3f4f6;
        }
        .btn {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 15px;
            box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
        }
        .btn:hover {
            background-color: #4338ca;
        }
        .info-card {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px dashed #e5e7eb;
            padding: 8px 0;
        }
        .info-row:last-child {
            border-bottom: none;
        }
        .info-label {
            font-weight: 600;
            color: #4b5563;
        }
        .info-value {
            color: #111827;
        }
        .price {
            font-size: 18px;
            font-weight: 700;
            color: #4f46e5;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Tenancy Tracker</h1>
        </div>
        <div class="content">
            ${contentHTML}
        </div>
        <div class="footer">
            <p>This is an automated notification from your Tenancy Portal.</p>
            <p>&copy; ${new Date().getFullYear()} Tenancy Tracker. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

/**
 * Generates email for approved tenants
 */
export const getApprovalTemplate = (name, frontendUrl) => {
    const htmlContent = `
        <h2>Welcome aboard, ${name}! 🎉</h2>
        <p>Your tenant registration request on <strong>Tenancy Tracker</strong> has been reviewed and successfully <strong>approved</strong> by the administrator.</p>
        <p>You can now log in to the portal to view your dashboard, upload rent payment receipts, check electricity units, and pay rent online.</p>
        <div style="text-align: center;">
            <a href="${frontendUrl}/login" class="btn">Log In to Dashboard</a>
        </div>
        <p style="margin-top: 30px;">If you have any questions or require assistance, please reach out to your property administrator.</p>
    `;
    return getEmailWrapper('Account Approved - Tenancy Tracker', htmlContent);
};

/**
 * Generates email for rejected tenants
 */
export const getRejectionTemplate = (name) => {
    const htmlContent = `
        <h2>Tenant Registration Update</h2>
        <p>Dear ${name},</p>
        <p>We appreciate your interest in registering on <strong>Tenancy Tracker</strong>. After reviewing your request, the administrator was unable to approve your registration at this time.</p>
        <p>This is commonly due to mismatching profile details or incomplete unit assignments.</p>
        <p>Please contact your property administrator directly to clarify or re-submit your registration request.</p>
    `;
    return getEmailWrapper('Registration Update - Tenancy Tracker', htmlContent);
};

/**
 * Generates Monthly Bill Invoice email
 */
export const getInvoiceTemplate = (name, month, year, details) => {
    const { rent, electricity, municipalFee, parking, penalties, dues, advanceCredit } = details;
    const totalBill = Number(rent) + Number(electricity) + Number(parking) + Number(penalties || 0) + Number(dues || 0) + Number(municipalFee || 0) - Number(advanceCredit || 0);

    const htmlContent = `
        <h2>New Bill Invoice Generated 📄</h2>
        <p>Hi ${name},</p>
        <p>Your monthly rent invoice for <strong>${month} ${year}</strong> has been generated by the administrator. Please review the details and proceed with the payment.</p>
        
        <div class="info-card">
            <h3 style="margin-top:0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Invoice Breakdown</h3>
            <div class="info-row">
                <span class="info-label">Base Rent:</span>
                <span class="info-value">₹${rent}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Electricity:</span>
                <span class="info-value">₹${electricity}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Municipal Fee:</span>
                <span class="info-value">₹${municipalFee}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Parking Charges:</span>
                <span class="info-value">₹${parking}</span>
            </div>
            ${penalties ? `
            <div class="info-row">
                <span class="info-label">Penalties:</span>
                <span class="info-value" style="color: #ef4444;">₹${penalties}</span>
            </div>
            ` : ''}
            ${dues ? `
            <div class="info-row">
                <span class="info-label">Previous Dues:</span>
                <span class="info-value" style="color: #ef4444;">₹${dues}</span>
            </div>
            ` : ''}
            ${advanceCredit ? `
            <div class="info-row">
                <span class="info-label">Advance Credit Applied:</span>
                <span class="info-value" style="color: #10b981;">- ₹${advanceCredit}</span>
            </div>
            ` : ''}
            <div class="info-row" style="border-top: 2px solid #111827; padding-top: 12px; margin-top: 8px;">
                <span class="info-label" style="font-size: 16px; color: #111827;">Total Amount:</span>
                <span class="price">₹${totalBill > 0 ? totalBill : 0}</span>
            </div>
        </div>

        <p>Please log in to your tenant account to complete your payment.</p>
        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'https://tenancy-frontend.onrender.com'}/dashboard" class="btn">View & Pay Now</a>
        </div>
    `;
    return getEmailWrapper(`Bill Generated for ${month} ${year}`, htmlContent);
};

/**
 * Generates Payment Confirmation Receipt email
 */
export const getReceiptTemplate = (name, amount, transactionId, method, recordMonth, recordYear) => {
    const htmlContent = `
        <h2>Payment Receipt Confirmed Successfully! ✅</h2>
        <p>Dear ${name},</p>
        <p>Thank you! Your payment of <strong>₹${amount}</strong> towards the rent for <strong>${recordMonth} ${recordYear}</strong> has been successfully received and verified.</p>
        
        <div class="info-card">
            <h3 style="margin-top:0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Transaction Receipt</h3>
            <div class="info-row">
                <span class="info-label">Paid Amount:</span>
                <span class="price">₹${amount}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Payment Mode:</span>
                <span class="info-value" style="text-transform: uppercase;">${method}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Transaction Reference:</span>
                <span class="info-value" style="font-family: monospace; font-size: 13px;">${transactionId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Verification Time:</span>
                <span class="info-value">${new Date().toLocaleString()}</span>
            </div>
        </div>
        
        <p style="margin-top: 30px;">A copy of this digital receipt is stored permanently in your transaction history dashboard and attached as PDF.</p>
    `;
    return getEmailWrapper('Rent Payment Receipt - Tenancy Tracker', htmlContent);
};

export const getAdminLoginNotificationTemplate = (userName, userEmail, userRole) => {
    const htmlContent = `
        <h2>User Login Detected 🔐</h2>
        <p>A user has logged into the Tenancy Tracker system:</p>
        <div class="info-card">
            <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${userName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${userEmail}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Role:</span>
                <span class="info-value">${userRole}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Login Time:</span>
                <span class="info-value">${new Date().toLocaleString()}</span>
            </div>
        </div>
    `;
    return getEmailWrapper('User Login - Tenancy Tracker', htmlContent);
};

export const getAdminBillGeneratedTemplate = (tenantName, tenantEmail, month, year, totalAmount) => {
    const htmlContent = `
        <h2>New Bill Generated 📄</h2>
        <p>A new rent bill has been generated for a tenant:</p>
        <div class="info-card">
            <div class="info-row">
                <span class="info-label">Tenant Name:</span>
                <span class="info-value">${tenantName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tenant Email:</span>
                <span class="info-value">${tenantEmail}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Bill Month:</span>
                <span class="info-value">${month} ${year}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Total Amount:</span>
                <span class="price">₹${totalAmount}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Generated At:</span>
                <span class="info-value">${new Date().toLocaleString()}</span>
            </div>
        </div>
    `;
    return getEmailWrapper('New Bill Generated - Tenancy Tracker', htmlContent);
};

export const getAdminPaymentReceivedTemplate = (tenantName, tenantEmail, amount, transactionId, month, year) => {
    const htmlContent = `
        <h2>Payment Received! 💰</h2>
        <p>A rent payment has been received from a tenant:</p>
        <div class="info-card">
            <div class="info-row">
                <span class="info-label">Tenant Name:</span>
                <span class="info-value">${tenantName}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Tenant Email:</span>
                <span class="info-value">${tenantEmail}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Paid Amount:</span>
                <span class="price">₹${amount}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Transaction ID:</span>
                <span class="info-value" style="font-family: monospace; font-size: 13px;">${transactionId}</span>
            </div>
            <div class="info-row">
                <span class="info-label">For Month:</span>
                <span class="info-value">${month} ${year}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Received At:</span>
                <span class="info-value">${new Date().toLocaleString()}</span>
            </div>
        </div>
    `;
    return getEmailWrapper('Payment Received - Tenancy Tracker', htmlContent);
};

export const getPaymentReminderTemplate = (name, month, year, totalAmount, daysOverdue) => {
    const htmlContent = `
        <h2>Payment Reminder ⏰</h2>
        <p>Dear ${name},</p>
        <p>This is a ${daysOverdue > 0 ? '<strong style="color: #ef4444;">OVERDUE</strong>' : 'friendly'} reminder that your rent payment for <strong>${month} ${year}</strong> is ${daysOverdue > 0 ? `${daysOverdue} day(s) overdue` : 'due soon'}.</p>
        
        <div class="info-card">
            <h3 style="margin-top:0; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">Outstanding Bill</h3>
            <div class="info-row">
                <span class="info-label">Bill Month:</span>
                <span class="info-value">${month} ${year}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Total Amount Due:</span>
                <span class="price">₹${totalAmount}</span>
            </div>
        </div>
        
        <p>Please log in to your account and complete the payment at your earliest convenience to avoid any late penalties.</p>
        
        <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'https://tenancy-frontend.onrender.com'}/dashboard" class="btn">Pay Now</a>
        </div>
    `;
    return getEmailWrapper(`Payment Reminder - ${month} ${year}`, htmlContent);
};
