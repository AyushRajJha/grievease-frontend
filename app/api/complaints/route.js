import { ObjectId } from 'mongodb';
import { getSessionFromRequest, isAdmin, isDepartmentUser } from '@/lib/auth';
import { getDb } from '@/lib/mongodb';
import { getNormalizedContact, isValidEmail, isValidPhone, normalizeEmail, normalizePhone } from '@/lib/contact';
import { hashValue, normalizeTextFingerprint, verifyVerificationToken } from '@/lib/contactVerification';
import { sendEmailMessage } from '@/lib/notifications';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildBaseUrl(request) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (configuredUrl) {
    return configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`;
  }

  const origin = request.headers.get('origin');
  if (origin) return origin;

  const host = request.headers.get('host');
  return host ? `https://${host}` : '';
}

async function sendComplaintAcknowledgement({ complaint, complaintId, trackingUrl }) {
  if (!complaint.userEmail) return { skipped: true };

  const safeName = escapeHtml(complaint.userName || 'Citizen');
  const safeComplaintId = escapeHtml(complaintId);
  const safeTrackingUrl = escapeHtml(trackingUrl);
  const safeCategory = escapeHtml(complaint.category);
  const safeDepartment = escapeHtml(complaint.department);
  const safePriority = escapeHtml(complaint.priority);
  const safeEstimatedTime = escapeHtml(complaint.estimatedTime);
  const safeLocation = escapeHtml(complaint.location);

  const text = [
    `Hello ${complaint.userName || 'Citizen'},`,
    '',
    'Your complaint has been submitted successfully on GrievEase.',
    '',
    `Complaint ID: ${complaintId}`,
    `Category: ${complaint.category || 'N/A'}`,
    `Department: ${complaint.department || 'N/A'}`,
    `Priority: ${complaint.priority || 'N/A'}`,
    `Estimated resolution time: ${complaint.estimatedTime || 'N/A'}`,
    `Location: ${complaint.location || 'N/A'}`,
    '',
    `Track your complaint: ${trackingUrl}`,
    '',
    'Thank you for using GrievEase.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px;color:#2563eb;">Your GrievEase complaint has been submitted</h2>
      <p>Hello ${safeName},</p>
      <p>Your complaint has been recorded successfully. Please keep this complaint ID for tracking.</p>
      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Complaint ID:</strong> ${safeComplaintId}</p>
        <p style="margin:0 0 8px;"><strong>Category:</strong> ${safeCategory || 'N/A'}</p>
        <p style="margin:0 0 8px;"><strong>Department:</strong> ${safeDepartment || 'N/A'}</p>
        <p style="margin:0 0 8px;"><strong>Priority:</strong> ${safePriority || 'N/A'}</p>
        <p style="margin:0 0 8px;"><strong>Estimated resolution time:</strong> ${safeEstimatedTime || 'N/A'}</p>
        <p style="margin:0;"><strong>Location:</strong> ${safeLocation || 'N/A'}</p>
      </div>
      <p>
        <a href="${safeTrackingUrl}" style="display:inline-block;background:#4f46e5;color:white;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
          Track My Complaint
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;">If the button does not open, paste this link in your browser:<br>${safeTrackingUrl}</p>
      <p>Thank you for using GrievEase.</p>
    </div>
  `;

  return sendEmailMessage({
    to: complaint.userEmail,
    subject: `GrievEase complaint submitted: ${complaintId}`,
    text,
    html,
  });
}

async function validateVerification({ db, verificationToken, userEmail, userPhone }) {
  const payload = verifyVerificationToken(verificationToken);
  if (!payload?.verificationId || !payload.channel || !payload.contact) {
    return { error: 'A valid OTP verification is required before submitting the complaint.', status: 401 };
  }

  const expectedContact = getNormalizedContact({
    channel: payload.channel,
    email: userEmail,
    phone: userPhone,
  });

  if (!expectedContact || expectedContact !== payload.contact) {
    return { error: 'Verified contact does not match the complaint details.', status: 401 };
  }

  if (!ObjectId.isValid(payload.verificationId)) {
    return { error: 'Verification session is invalid. Please verify again.', status: 401 };
  }

  const verificationRecord = await db.collection('otp_requests').findOne({
    _id: new ObjectId(payload.verificationId),
    channel: payload.channel,
    contact: payload.contact,
    verified: true,
    consumedAt: null,
  });

  if (!verificationRecord) {
    return { error: 'OTP verification has already been used or is no longer valid.', status: 401 };
  }

  if (new Date(verificationRecord.expiresAt) < new Date()) {
    return { error: 'OTP verification expired. Please request a new OTP.', status: 401 };
  }

  return {
    verificationRecord,
    verifiedChannel: payload.channel,
    verifiedContact: payload.contact,
  };
}

async function enforceComplaintSecurity({ db, verifiedContact, location, description }) {
  const complaints = db.collection('complaints');
  const now = Date.now();
  const contactHash = hashValue(verifiedContact);
  const descriptionFingerprint = normalizeTextFingerprint(description);
  const locationFingerprint = normalizeTextFingerprint(location);

  const recentComplaintCount = await complaints.countDocuments({
    verifiedContactHash: contactHash,
    createdAt: { $gte: new Date(now - (30 * 60 * 1000)) },
  });

  if (recentComplaintCount >= 3) {
    return {
      error: 'Too many complaints were submitted from this verified contact recently. Please wait a while before filing another one.',
      status: 429,
    };
  }

  const duplicateComplaint = await complaints.findOne({
    verifiedContactHash: contactHash,
    descriptionFingerprint,
    locationFingerprint,
    createdAt: { $gte: new Date(now - (12 * 60 * 60 * 1000)) },
  });

  if (duplicateComplaint) {
    return {
      error: 'A very similar complaint from this verified contact was already filed recently. Please track the existing complaint instead of submitting a duplicate.',
      status: 409,
    };
  }

  return {
    contactHash,
    descriptionFingerprint,
    locationFingerprint,
  };
}

// POST - Create new complaint
export async function POST(request) {
  try {
    const body = await request.json();

    const userName = String(body.userName || '').trim();
    const userEmail = normalizeEmail(body.userEmail);
    const userPhone = normalizePhone(body.userPhone);
    const location = String(body.location || '').trim();
    const verificationToken = String(body.verificationToken || '').trim();

    if (!userName || !location) {
      return Response.json({
        success: false,
        error: 'Name and location are required.',
      }, { status: 400 });
    }

    if (!isValidEmail(userEmail) && !isValidPhone(userPhone)) {
      return Response.json({
        success: false,
        error: 'Please provide a valid email address or phone number.',
      }, { status: 400 });
    }

    const db = await getDb();
    const verification = await validateVerification({
      db,
      verificationToken,
      userEmail,
      userPhone,
    });

    if (verification.error) {
      return Response.json({
        success: false,
        error: verification.error,
      }, { status: verification.status });
    }

    const securityCheck = await enforceComplaintSecurity({
      db,
      verifiedContact: verification.verifiedContact,
      location,
      description: body.description,
    });

    if (securityCheck.error) {
      return Response.json({
        success: false,
        error: securityCheck.error,
      }, { status: securityCheck.status });
    }

    const complaints = db.collection('complaints');

    const complaint = {
      ...body,
      userName,
      userEmail: isValidEmail(userEmail) ? userEmail : '',
      userPhone: isValidPhone(userPhone) ? userPhone : '',
      location,
      verifiedContactChannel: verification.verifiedChannel,
      verifiedContact: verification.verifiedContact,
      verifiedContactHash: securityCheck.contactHash,
      verificationId: verification.verificationRecord._id.toString(),
      descriptionFingerprint: securityCheck.descriptionFingerprint,
      locationFingerprint: securityCheck.locationFingerprint,
      createdAt: new Date(),
      status: 'Pending',
      statusUpdatedAt: null,
      updatedAt: new Date(),
    };

    delete complaint.verificationToken;

    const result = await complaints.insertOne(complaint);
    const complaintId = result.insertedId.toString();

    await db.collection('otp_requests').updateOne(
      { _id: verification.verificationRecord._id },
      { $set: { consumedAt: new Date(), updatedAt: new Date() } }
    );

    const baseUrl = buildBaseUrl(request);
    const trackingUrl = baseUrl ? `${baseUrl}/track?id=${encodeURIComponent(complaintId)}` : `/track?id=${encodeURIComponent(complaintId)}`;

    try {
      await sendComplaintAcknowledgement({ complaint, complaintId, trackingUrl });
    } catch (emailError) {
      console.error('Complaint saved, but email acknowledgement failed:', emailError);
    }

    return Response.json({
      success: true,
      complaintId,
      message: 'Complaint submitted successfully',
    }, { status: 201 });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    return Response.json({
      success: false,
      error: 'Failed to submit complaint',
    }, { status: 500 });
  }
}

// GET - Fetch all complaints
export async function GET(request) {
  try {
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

    const db = await getDb();
    const complaints = db.collection('complaints');

    const query = isAdmin(session)
      ? {}
      : { department: session.department };

    const allComplaints = await complaints
      .find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    return Response.json({
      success: true,
      complaints: allComplaints,
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    return Response.json({
      success: false,
      error: 'Failed to fetch complaints',
    }, { status: 500 });
  }
}
