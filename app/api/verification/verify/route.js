import { ObjectId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import { createVerificationToken, hashValue, OTP_MAX_ATTEMPTS } from '@/lib/contactVerification';
import { getNormalizedContact, maskContact } from '@/lib/contact';

export async function POST(request) {
  try {
    const body = await request.json();
    const channel = String(body.channel || '').trim().toLowerCase();
    const otp = String(body.otp || '').trim();
    const contact = getNormalizedContact({
      channel,
      email: body.email,
      phone: body.phone,
    });
    const requestId = String(body.requestId || '').trim();

    if (!contact || !['email', 'phone'].includes(channel) || !/^\d{6}$/.test(otp) || !ObjectId.isValid(requestId)) {
      return Response.json({
        success: false,
        error: 'Invalid OTP verification request.',
      }, { status: 400 });
    }

    const db = await getDb();
    const otpRequests = db.collection('otp_requests');
    const verificationRecord = await otpRequests.findOne({
      _id: new ObjectId(requestId),
      channel,
      contact,
    });

    if (!verificationRecord) {
      return Response.json({
        success: false,
        error: 'OTP request was not found. Please request a new OTP.',
      }, { status: 404 });
    }

    if (verificationRecord.consumedAt) {
      return Response.json({
        success: false,
        error: 'This OTP has already been used. Please request a new OTP.',
      }, { status: 409 });
    }

    if (verificationRecord.verified) {
      const verificationToken = createVerificationToken({
        verificationId: verificationRecord._id.toString(),
        channel,
        contact,
      });

      return Response.json({
        success: true,
        verificationToken,
        maskedContact: maskContact(channel, contact),
        channel,
      });
    }

    if (new Date(verificationRecord.expiresAt) < new Date()) {
      return Response.json({
        success: false,
        error: 'OTP expired. Please request a new one.',
      }, { status: 410 });
    }

    if ((verificationRecord.attempts || 0) >= OTP_MAX_ATTEMPTS) {
      return Response.json({
        success: false,
        error: 'Too many invalid attempts. Please request a new OTP.',
      }, { status: 429 });
    }

    const expectedHash = hashValue(`${verificationRecord.contactHash}:${otp}`);

    if (expectedHash !== verificationRecord.otpHash) {
      await otpRequests.updateOne(
        { _id: verificationRecord._id },
        { $inc: { attempts: 1 }, $set: { updatedAt: new Date() } }
      );

      return Response.json({
        success: false,
        error: 'Invalid OTP. Please check the code and try again.',
      }, { status: 400 });
    }

    await otpRequests.updateOne(
      { _id: verificationRecord._id },
      {
        $set: {
          verified: true,
          verifiedAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    const verificationToken = createVerificationToken({
      verificationId: verificationRecord._id.toString(),
      channel,
      contact,
    });

    return Response.json({
      success: true,
      verificationToken,
      maskedContact: maskContact(channel, contact),
      channel,
    });
  } catch (error) {
    console.error('OTP verification failed:', error);
    return Response.json({
      success: false,
      error: 'Failed to verify OTP. Please try again.',
    }, { status: 500 });
  }
}
