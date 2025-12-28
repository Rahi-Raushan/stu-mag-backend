const mongoose = require('mongoose');
require('dotenv').config();

async function fixIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('enrollments');
    
    // List all indexes
    const indexes = await collection.listIndexes().toArray();
    console.log('Current indexes:', indexes.map(i => i.name));
    
    // Drop all indexes except _id_
    for (const index of indexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`Dropped index: ${index.name}`);
        } catch (error) {
          console.log(`Could not drop index ${index.name}:`, error.message);
        }
      }
    }
    
    // Create the new partial index
    await collection.createIndex(
      { student: 1, course: 1, status: 1 }, 
      { 
        unique: true, 
        partialFilterExpression: { status: 'pending' },
        name: 'student_course_status_pending_unique'
      }
    );
    console.log('Created new partial index');
    
    console.log('Index fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing index:', error);
    process.exit(1);
  }
}

fixIndex();