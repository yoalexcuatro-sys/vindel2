import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

// Initialize Firebase Admin
let adminApp: App | null = null;

function getAdminApp() {
  if (!adminApp && !getApps().length) {
    try {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      
      if (!privateKey || !clientEmail || !projectId) {
        throw new Error('Missing Firebase Admin credentials');
      }
      
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (error) {
      console.error('Failed to initialize Firebase Admin:', error);
    }
  }
  return adminApp || getApps()[0];
}

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Initialize admin
    getAdminApp();

    // Generate email verification link using Firebase Admin
    const verificationLink = await getAuth().generateEmailVerificationLink(email, {
      url: 'https://vindel-a7069.firebaseapp.com',
    });

    console.log('Generated verification link:', verificationLink);

    // Extract the oobCode from the Firebase link and create our custom link
    const url = new URL(verificationLink);
    const oobCode = url.searchParams.get('oobCode');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const customVerificationLink = `${baseUrl}/verify-email?oobCode=${oobCode}`;

    const userName = name || 'utilizator';

    // Send beautiful email with Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vindu <noreply@vindu.ro>',
        to: email,
        subject: 'Verifică-ți adresa de email - Vindu',
        html: getEmailTemplate(customVerificationLink, userName),
      }),
    });

    if (!resendResponse.ok) {
      const error = await resendResponse.json();
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email verification error:', error);
    
    return NextResponse.json(
      { error: 'Failed to send verification email', details: error.message, code: error.code },
      { status: 500 }
    );
  }
}

function getEmailTemplate(verificationLink: string, name: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifică adresa de email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #13C1AC 0%, #0a8f7f 100%); border-radius: 24px 24px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                Vindu
              </h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: rgba(255,255,255,0.9);">
                Marketplace-ul tău de încredere
              </p>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 48px 40px; background-color: #ffffff;">
              
              <!-- Email Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #13C1AC 0%, #0a8f7f 100%); border-radius: 50%; line-height: 80px;">
                  <span style="font-size: 36px;">✉️</span>
                </div>
              </div>
              
              <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 600; color: #1f2937; text-align: center;">
                Verifică-ți adresa de email
              </h2>
              
              <p style="margin: 0 0 8px; font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                Salut, <strong>${name}</strong>!
              </p>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                Te rugăm să confirmi că aceasta este adresa ta de email 
                apăsând butonul de mai jos.
              </p>
              
              <!-- Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0 32px;">
                    <a href="${verificationLink}" 
                       style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #13C1AC 0%, #0a8f7f 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(19, 193, 172, 0.4);">
                      ✓ Verifică email-ul
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Benefits after verification -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f0fdf4; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 14px; font-weight: 600; color: #1f2937;">
                      🎁 După verificare vei beneficia de:
                    </p>
                    <ul style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8; color: #4b5563;">
                      <li>Securitate sporită pentru contul tău</li>
                      <li>Posibilitatea de a publica anunțuri</li>
                      <li>Notificări importante pe email</li>
                      <li>Badge de utilizator verificat</li>
                    </ul>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0 0 24px;">
                    <div style="height: 1px; background: linear-gradient(to right, transparent, #e5e7eb, transparent);"></div>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #fefce8; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #854d0e;">
                      <strong>⚠️ Notă:</strong><br>
                      Dacă nu ai creat un cont pe Vindu, poți ignora acest email. 
                      Link-ul expiră în 24 de ore.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative Link -->
              <p style="margin: 24px 0 0; font-size: 13px; line-height: 1.5; color: #9ca3af; text-align: center;">
                Dacă butonul nu funcționează, copiază acest link în browser:<br>
                <a href="${verificationLink}" style="color: #13C1AC; word-break: break-all;">
                  ${verificationLink}
                </a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background-color: #f9fafb; border-radius: 0 0 24px 24px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                Cu drag,<br>
                <strong style="color: #13C1AC;">Echipa Vindu</strong>
              </p>
              <p style="margin: 16px 0 0; font-size: 12px; color: #9ca3af;">
                © 2026 Vindu.ro - Toate drepturile rezervate
              </p>
              <p style="margin: 8px 0 0; font-size: 12px; color: #9ca3af;">
                <a href="https://vindu.ro" style="color: #9ca3af; text-decoration: none;">vindu.ro</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
