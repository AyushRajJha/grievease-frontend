import { getDb } from '@/lib/mongodb';
import { createOtpCode, hashValue, OTP_MAX_REQUESTS_PER_WINDOW, OTP_REQUEST_WINDOW_MS, OTP_RESEND_COOLDOWN_MS, OTP_TTL_MS } from '@/lib/contactVerification';
import { getNormalizedContact, maskContact } from '@/lib/contact';
import { isSmsConfigured, sendEmailMessage, sendSmsMessage } from '@/lib/notifications';

function buildOtpMessage({ channel, otp, contact }) {
  if (channel === 'phone') {
    return {
      text: `Your GrievEase OTP is ${otp}. It expires in 10 minutes. Do not share this code.`,
      html: '',
      subject: '',
    };
  }

  const safeContact = maskContact(channel, contact);
  const subject = 'Your GrievEase OTP code';
  const text = [
    'Hello,',
    '',
    `Your GrievEase OTP is ${otp}.`,
    'This code expires in 10 minutes.',
    '',
    `Requested for: ${safeContact}`,
    '',
    'Do not share this code with anyone.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px;">
      <h2 style="margin:0 0 12px;color:#2563eb;">GrievEase verification code</h2>
      <p>Your OTP for complaint verification is:</p>
      <div style="margin:20px 0;padding:18px;border-radius:14px;background:#eef2ff;border:1px solid #c7d2fe;text-align:center;">
        <p style="font-size:28px;font-weight:700;letter-spacing:8px;margin:0;color:#1d4ed8;">${otp}</p>
      </div>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      <p style="color:#6b7280;font-size:13px;">Requested for ${safeContact}. Do not share this code with anyone.</p>
    </div>
  `;

  return { subject, text, html };
}

export async function POST(request) {
  try {
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

    const smsConfigured = isSmsConfigured();

    if (channel === 'phone' && !smsConfigured && process.env.NODE_ENV === 'production') {
      return Response.json({
        success: false,
        error: 'Phone OTP is not configured on the server yet. Please use email verification for now.',
      }, { status: 503 });
    }

    const db = await getDb();
    const otpRequests = db.collection('otp_requests');
    const now = new Date();
    const contactHash = hashValue(`${channel}:${contact}`);

    const recentRequestsCount = await otpRequests.countDocuments({
      contactHash,
      createdAt: { $gte: new Date(now.getTime() - OTP_REQUEST_WINDOW_MS) },
    });

    if (recentRequestsCount >= OTP_MAX_REQUESTS_PER_WINDOW) {
      return Response.json({
        success: false,
        error: 'Too many OTP requests. Please wait a few minutes before trying again.',
      }, { status: 429 });
    }

    const latestRequest = await otpRequests.findOne(
      { contactHash },
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

    const message = buildOtpMessage({ channel, otp, contact });

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
      expiresInSeconds: Math.floor(OTP_TTL_MS / 1000),
      requestId: insertResult.insertedId.toString(),
    };

    if ((process.env.OTP_DEBUG_MODE === 'true' || (channel === 'phone' && !smsConfigured)) && process.env.NODE_ENV !== 'production') {
      responsePayload.debugOtp = otp;
    }

    return Response.json(responsePayload, { status: 200 });
  } catch (error) {
    console.error('OTP request failed:', error);
    return Response.json({
      success: false,
      error: 'Failed to send OTP. Please try again.',
    }, { status: 500 });
  }
}
