// Script to clean up duplicate records in the database
// Run with: node cleanup-duplicates.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Record from './models/Record.js';

dotenv.config();

const cleanupDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find all records grouped by tenant, month, year
        const duplicates = await Record.aggregate([
            {
                $group: {
                    _id: { tenant: '$tenant', month: '$month', year: '$year' },
                    count: { $sum: 1 },
                    ids: { $push: '$_id' },
                    paidStatus: { $push: '$paid' },
                    amounts: { $push: { $add: ['$rent', '$electricity', '$parking'] } }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        console.log(`\nFound ${duplicates.length} sets of duplicate records:\n`);

        for (const dup of duplicates) {
            console.log(`Tenant: ${dup._id.tenant}, Period: ${dup._id.month} ${dup._id.year}`);
            console.log(`  Records: ${dup.count}`);
            console.log(`  IDs: ${dup.ids.join(', ')}`);
            console.log(`  Paid status: ${dup.paidStatus.join(', ')}`);
            console.log(`  Amounts: ${dup.amounts.join(', ')}`);

            // Keep the first paid record, or the first record if none are paid
            const paidIndex = dup.paidStatus.findIndex(p => p === true);
            const keepIndex = paidIndex >= 0 ? paidIndex : 0;
            const keepId = dup.ids[keepIndex];
            const deleteIds = dup.ids.filter((id, i) => i !== keepIndex);

            console.log(`  Keeping: ${keepId}`);
            console.log(`  Deleting: ${deleteIds.join(', ')}`);

            // Delete duplicate records
            await Record.deleteMany({ _id: { $in: deleteIds } });
            console.log(`  ✅ Deleted ${deleteIds.length} duplicate(s)\n`);
        }

        console.log('✅ Cleanup complete!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanupDuplicates();
