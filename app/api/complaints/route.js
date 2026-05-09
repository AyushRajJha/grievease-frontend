import nodemailer from 'nodemailer';
import { MongoClient } from 'mongodb';
import { getSessionFromRequest, isAdmin, isDepartmentUser } from '@/lib/auth';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'grievease';
let cachedClient = null;

function isValidEmail(value) {
  const email = String(value || '').trim();
  return /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(email);
}

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
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;
  const resendApiKey = process.env.RESEND_API_KEY;

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

  if (gmailUser && gmailAppPassword) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });

    return transporter.sendMail({
      from: `GrievEase <${gmailUser}>`,
      to: complaint.userEmail,
      subject: `GrievEase complaint submitted: ${complaintId}`,
      text,
      html,
    });
  }

  if (resendApiKey) {
    const from = process.env.RESEND_FROM_EMAIL || 'GrievEase <onboarding@resend.dev>';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'grievease/1.0',
      },
      body: JSON.stringify({
        from,
        to: [complaint.userEmail],
        subject: `GrievEase complaint submitted: ${complaintId}`,
        text,
        html,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend failed with ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  return { skipped: true };
}

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

    const userName = String(body.userName || '').trim();
    const userEmail = String(body.userEmail || '').trim().toLowerCase();
    const location = String(body.location || '').trim();

    if (!userName || !location || !isValidEmail(userEmail)) {
      return Response.json({
        success: false,
        error: 'Valid name, email, and location are required'
      }, { status: 400 });
    }
    
    const client = await connectToDatabase();
    const db = client.db(dbName);
    const complaints = db.collection('complaints');

    const complaint = {
      ...body,
      userName,
      userEmail,
      location,
      createdAt: new Date(),
      status: 'Pending',
      statusUpdatedAt: null,
      updatedAt: new Date(),
    };

    const result = await complaints.insertOne(complaint);
    const complaintId = result.insertedId.toString();
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

    const client = await connectToDatabase();
    const db = client.db(dbName);
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
