import { ObjectId } from 'mongodb';
import { canAccessDepartment, getSessionFromRequest, isAdmin, isDepartmentUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { verifyVerificationToken } from '@/lib/contactVerification';

const VALID_STATUSES = ['Pending', 'Under Review', 'Assigned', 'In Progress', 'Resolved'];

function hasComplaintAccess({ request, complaint, complaintId }) {
  const session = getSessionFromRequest(request);
  if (session && (isAdmin(session) || (isDepartmentUser(session) && canAccessDepartment(session, complaint.department)))) {
    return { allowed: true, via: 'session', session };
  }

  const trackingAccessToken = request.headers.get('x-tracking-token');
  const payload = verifyVerificationToken(trackingAccessToken);

  if (!payload || payload.type !== 'complaint_tracking') {
    return { allowed: false };
  }

  if (payload.complaintId !== complaintId) {
    return { allowed: false };
  }

  const expectedContact = payload.channel === 'phone' ? complaint.userPhone : complaint.userEmail;
  if (!expectedContact || expectedContact !== payload.contact) {
    return { allowed: false };
  }

  return { allowed: true, via: 'tracking-token' };
}

// GET - Fetch complaint by ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        error: 'Invalid complaint ID',
      }, { status: 400 });
    }

    const db = await getDb();
    const complaints = db.collection('complaints');

    const complaint = await complaints.findOne({ _id: new ObjectId(id) });

    if (!complaint) {
      return Response.json({
        success: false,
        error: 'Complaint not found',
      }, { status: 404 });
    }

    const access = hasComplaintAccess({
      request,
      complaint,
      complaintId: id,
    });

    if (!access.allowed) {
      return Response.json({
        success: false,
        error: 'OTP verification is required to view this complaint.',
      }, { status: 401 });
    }

    return Response.json({
      success: true,
      complaint,
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch complaint',
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
        error: 'Unauthorized',
      }, { status: 401 });
    }

    if (!isAdmin(session) && !isDepartmentUser(session)) {
      return Response.json({
        success: false,
        error: 'Forbidden',
      }, { status: 403 });
    }

    if (!ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        error: 'Invalid complaint ID',
      }, { status: 400 });
    }

    const body = await request.json();
    const status = String(body.status || '').trim();

    if (!VALID_STATUSES.includes(status)) {
      return Response.json({
        success: false,
        error: 'Invalid status value',
      }, { status: 400 });
    }

    const db = await getDb();
    const complaints = db.collection('complaints');

    const existingComplaint = await complaints.findOne({ _id: new ObjectId(id) });

    if (!existingComplaint) {
      return Response.json({
        success: false,
        error: 'Complaint not found',
      }, { status: 404 });
    }

    if (!canAccessDepartment(session, existingComplaint.department)) {
      return Response.json({
        success: false,
        error: 'You are not allowed to update this complaint',
      }, { status: 403 });
    }

    await complaints.updateOne(
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
      complaint,
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return Response.json({
      success: false,
      error: 'Failed to update complaint status',
    }, { status: 500 });
  }
}
