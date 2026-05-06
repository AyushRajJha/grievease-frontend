import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'grievease';
let cachedClient = null;
const VALID_STATUSES = ['Pending', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

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
    const { id } = params;

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

// PATCH - Update complaint status
export async function PATCH(request, { params }) {
  try {
    const { id } = params;

    if (!ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        error: 'Invalid complaint ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const status = String(body.status || '').trim();

    if (!VALID_STATUSES.includes(status)) {
      return Response.json({
        success: false,
        error: 'Invalid status value'
      }, { status: 400 });
    }

    const client = await connectToDatabase();
    const db = client.db(dbName);
    const complaints = db.collection('complaints');

    const result = await complaints.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          statusUpdatedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return Response.json({
        success: false,
        error: 'Complaint not found'
      }, { status: 404 });
    }

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });

    return Response.json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return Response.json({
      success: false,
      error: 'Failed to update complaint status'
    }, { status: 500 });
  }
}
