import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'grievease';
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

// POST - Create new complaint
export async function POST(request) {
  try {
    const body = await request.json();
    
    const client = await connectToDatabase();
    const db = client.db(dbName);
    const complaints = db.collection('complaints');

    const complaint = {
      ...body,
      createdAt: new Date(),
      status: 'Pending',
      updatedAt: new Date(),
    };

    const result = await complaints.insertOne(complaint);

    return Response.json({
      success: true,
      complaintId: result.insertedId,
      message: 'Complaint submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error submitting complaint:', error);
    return Response.json({
      success: false,
      error: 'Failed to submit complaint'
    }, { status: 500 });
  }
}

// GET - Fetch all complaints
export async function GET(request) {
  try {
    const client = await connectToDatabase();
    const db = client.db(dbName);
    const complaints = db.collection('complaints');

    const allComplaints = await complaints
      .find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return Response.json({
      success: true,
      complaints: allComplaints
    });

  } catch (error) {
    console.error('Error fetching complaints:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch complaints'
    }, { status: 500 });
  }
}