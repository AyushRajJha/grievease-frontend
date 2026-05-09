import { MongoClient, ObjectId } from 'mongodb';
import { canAccessDepartment, getSessionFromRequest, isAdmin, isDepartmentUser } from '@/lib/auth';

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

// PATCH - Update complaint status
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    const session = getSessionFromRequest(request);
    if (!session) {
      return Response.json({
        success: false,
        error: 'Unauthorized'
      }, { status: 401 });
    }

    if (!isAdmin(session) && !isDepartmentUser(session)) {
      return Response.json({
        success: false,
        error: 'Forbidden'
      }, { status: 403 });
    }

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

    const existingComplaint = await complaints.findOne({ _id: new ObjectId(id) });

    if (!existingComplaint) {
      return Response.json({
        success: false,
        error: 'Complaint not found'
      }, { status: 404 });
    }

    if (!canAccessDepartment(session, existingComplaint.department)) {
      return Response.json({
        success: false,
        error: 'You are not allowed to update this complaint'
      }, { status: 403 });
    }

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
