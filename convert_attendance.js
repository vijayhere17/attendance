// convert_attendance.js
// This script updates all attendance records in MongoDB Atlas.
// It adds a "name" field (derived from an existing field) and converts the "date" field
// from US time (assumed to be stored as UTC) to Indian Standard Time (IST, UTC+5:30).
//
// IMPORTANT: Review and adjust the placeholders marked with <...> before running.
// Run with: node convert_attendance.js

const { MongoClient } = require('mongodb');

// ==== CONFIGURATION ====
// Replace the placeholder with your actual MongoDB Atlas connection string.
const uri = "mongodb+srv://cluster0.mbyss.mongodb.net/attendance";
// Replace with your database and collection names.
const dbName = "attendance";
const collectionName = "radius-check";
// The field that stores the timestamp (as a Date object or ISO string).
const timestampField = "date"; // as provided by the user
// The field from which to derive the new "name" value. Adjust as needed.
const sourceNameField = "username"; // e.g., copy from existing username field
// ========================

function usToIst(date) {
  // Assume the incoming date is UTC. IST = UTC + 5.5 hours.
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + istOffsetMs);
}

async function main() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    const db = client.db(dbName);
    const coll = db.collection(collectionName);

    // Stream through documents to avoid loading everything into memory.
    const cursor = coll.find({});
    const bulkOps = [];
    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = {};

      // Add/overwrite the "name" field based on the source field if it exists.
      if (doc[sourceNameField]) {
        updates.name = doc[sourceNameField];
      } else {
        // If the source field is missing, set a placeholder. Adjust later.
        updates.name = "<NAME_PLACEHOLDER>";
      }

      // Convert the timestamp to IST and replace the original field.
      if (doc[timestampField]) {
        const originalDate = new Date(doc[timestampField]);
        const istDate = usToIst(originalDate);
        updates[timestampField] = istDate;
      }

      if (Object.keys(updates).length > 0) {
        bulkOps.push({
          updateOne: {
            filter: { _id: doc._id },
            update: { $set: updates },
          },
        });
      }

      // Execute in batches of 1000 to limit memory usage.
      if (bulkOps.length === 1000) {
        await coll.bulkWrite(bulkOps);
        bulkOps.length = 0;
      }
    }

    // Write any remaining operations.
    if (bulkOps.length > 0) {
      await coll.bulkWrite(bulkOps);
    }

    console.log('All attendance records have been updated.');
  } catch (err) {
    console.error('Error during migration:', err);
  } finally {
    await client.close();
    console.log('Connection closed.');
  }
}

main();
