import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { getNormalizedContact, maskContact } from '@/lib/contact';
import { createOtpCode, hashValue, OTP_MAX_REQUESTS_PER_WINDOW, OTP_REQUEST_WINDOW_MS, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from '@/lib/contactVerification';
import { isSmsConfigured, sendEmailMessage, sendSmsMessage } from '@/lib/notifications';

function buildTrackingOtpMessage({ channel, otp, complaintId }) {
  if (channel === 'phone') {
    return {
      text: `Your GrievEase tracking OTP for complaint ${complaintId} is ${otp}. It expires in 10 minutes.`,
      html: '',
      subject: '',
    };
  }

  const subject = `GrievEase tracking OTP for complaint ${complaintId}`;
  const text = [
    'Hello,',
    '',
    `Your OTP to access complaint ${complaintId} is ${otp}.`,
    'This code expires in 10 minutes.',
    '',
    'Do not share this code with anyone.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px;color:#2563eb;">Track your GrievEase complaint</h2>
      <p>Use this OTP to access complaint <strong>${complaintId}</strong>:</p>
      <div style="margin:20px 0;padding:18px;border-radius:14px;background:#eef2ff;border:1px solid #c7d2fe;text-align:center;">
        <p style="font-size:28px;font-weight:700;letter-spacing:8px;margin:0;color:#1d4ed8;">${otp}</p>
      </div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
    </div>
  `;

  return { subject, text, html };
}

export async function POST(request, { params }) {
  try {
    const { id } = await params;

    if (!ObjectId.isValid(id)) {
      return Response.json({
        success: false,
        error: 'Invalid complaint ID',
      }, { status: 400 });
    }

    const body = await request.json();
    const channel = String(body.channel || '').trim().toLowerCase();
    const contact = getNormalizedContact({
      channel,
      email: body.email,
      phone: body.phone,
    });

    if (!contact || !['email', 'phone'].includes(channel)) {
      return Response.json({
        success: false,
        error: 'Please provide a valid email address or phone number.',
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

    const expectedContact = channel === 'phone' ? complaint.userPhone : complaint.userEmail;
    if (!expectedContact || expectedContact !== contact) {
      return Response.json({
        success: false,
        error: 'This contact does not match the complaint record.',
      }, { status: 403 });
    }

    const smsConfigured = isSmsConfigured();
    if (channel === 'phone' && !smsConfigured && process.env.NODE_ENV === 'production') {
      return Response.json({
        success: false,
        error: 'Phone OTP is not configured on the server yet. Please use email verification for tracking.',
      }, { status: 503 });
    }

    const otpRequests = db.collection('otp_requests');
    const now = new Date();
    const contactHash = hashValue(`${channel}:${contact}`);
    const scopeKey = `${contactHash}:tracking:${id}`;

    const recentRequestsCount = await otpRequests.countDocuments({
      scopeKey,
      createdAt: { $gte: new Date(now.getTime() - OTP_REQUEST_WINDOW_MS) },
    });

    if (recentRequestsCount >= OTP_MAX_REQUESTS_PER_WINDOW) {
      return Response.json({
        success: false,
        error: 'Too many OTP requests. Please wait a few minutes before trying again.',
      }, { status: 429 });
    }

    const latestRequest = await otpRequests.findOne(
      { scopeKey, purpose: 'tracking_access' },
      { sort: { createdAt: -1 } }
    );

    if (latestRequest?.resendAvailableAt && new Date(latestRequest.resendAvailableAt) > now) {
      const retryAfterSeconds = Math.ceil((new Date(latestRequest.resendAvailableAt).getTime() - now.getTime()) / 1000);
      return Response.json({
        success: false,
        error: `Please wait ${retryAfterSeconds} seconds before requesting another OTP.`,
      }, { status: 429 });
    }

    const otp = createOtpCode();
    const otpHash = hashValue(`${contactHash}:${otp}`);
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
    const resendAvailableAt = new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS);

    const insertResult = await otpRequests.insertOne({
      purpose: 'tracking_access',
      complaintId: id,
      scopeKey,
      channel,
      contact,
      contactHash,
      otpHash,
      attempts: 0,
      verified: false,
      consumedAt: null,
      createdAt: now,
      updatedAt: now,
      expiresAt,
      resendAvailableAt,
    });

    const message = buildTrackingOtpMessage({ channel, otp, complaintId: id });

    if (channel === 'phone' && smsConfigured) {
      await sendSmsMessage({
        to: contact,
        body: message.text,
      });
    } else if (channel === 'email') {
      await sendEmailMessage({
        to: contact,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
    }

    const responsePayload = {
      success: true,
      channel,
      maskedContact: maskContact(channel, contact),
      requestId: insertResult.insertedId.toString(),
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
    };

    if ((process.env.OTP_DEBUG_MODE === 'true' || (channel === 'phone' && !smsConfigured)) && process.env.NODE_ENV !== 'production') {
      responsePayload.debugOtp = otp;
    }

    return Response.json(responsePayload);
  } catch (error) {
    console.error('Tracking OTP request failed:', error);
    return Response.json({
      success: false,
      error: 'Failed to send tracking OTP. Please try again.',
    }, { status: 500 });
  }
}

