import { MongoClient, ObjectId } from 'mongodb';

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

// GET - Fetch complaint by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        error: 'Invalid complaint ID'
      }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db(dbName);
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });

    if (!complaint) {
      return Response.json({
        success: false,
        error: 'Complaint not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      complaint
    });

  } catch (error) {
    console.error('Error fetching complaint:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch complaint'
    }, { status: 500 });
  }
}
