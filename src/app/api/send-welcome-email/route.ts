import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const userName = name || 'utilizator';

    // Send beautiful welcome email with Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Vindu <noreply@vindu.ro>',
        to: email,
        subject: 'Bine ai venit pe Vindu! 🎉',
        html: getWelcomeEmailTemplate(userName),
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
    console.error('Welcome email error:', error);
    return NextResponse.json(
      { error: 'Failed to send welcome email', details: error.message },
      { status: 500 }
    );
  }
}

function getWelcomeEmailTemplate(name: string) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bine ai venit pe Vindu!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="padding: 40px 40px 30px; background: linear-gradient(135deg, #13C1AC 0%, #0a8f7f 100%); border-radius: 24px 24px 0 0; text-align: center;">
              <h1 style="margin: 0; font-size: 36px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
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
              
              <!-- Welcome Icon -->
              <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 64px;">🎉</span>
              </div>
              
              <h2 style="margin: 0 0 16px; font-size: 28px; font-weight: 600; color: #1f2937; text-align: center;">
                Bine ai venit, ${name}!
              </h2>
              
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4b5563; text-align: center;">
                Îți mulțumim că te-ai alăturat comunității Vindu! 
                Acum poți să cumperi și să vinzi produse în siguranță.
              </p>
              
              <!-- Features -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 32px 0;">
                <tr>
                  <td style="padding: 16px; background-color: #f0fdf4; border-radius: 12px; margin-bottom: 12px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 24px;">📦</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <strong style="color: #1f2937;">Publică anunțuri gratuit</strong>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">
                            Listează produsele tale și găsește cumpărători rapid.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 16px; background-color: #f0fdf4; border-radius: 12px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 24px;">💬</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <strong style="color: #1f2937;">Chat integrat</strong>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">
                            Comunică direct cu vânzătorii sau cumpărătorii.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 16px; background-color: #f0fdf4; border-radius: 12px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="width: 40px; vertical-align: top;">
                          <span style="font-size: 24px;">🔒</span>
                        </td>
                        <td style="padding-left: 12px;">
                          <strong style="color: #1f2937;">Tranzacții sigure</strong>
                          <p style="margin: 4px 0 0; font-size: 14px; color: #6b7280;">
                            Verificăm utilizatorii pentru siguranța ta.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0 32px;">
                    <a href="https://vindu.ro/publish" 
                       style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #13C1AC 0%, #0a8f7f 100%); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px rgba(19, 193, 172, 0.4);">
                      Publică primul anunț
                    </a>
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
              
              <!-- Help Section -->
              <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6b7280; text-align: center;">
                Ai întrebări? Suntem aici să te ajutăm!<br>
                <a href="https://vindu.ro/ajutor" style="color: #13C1AC; text-decoration: none;">Centru de ajutor</a> · 
                <a href="https://vindu.ro/contact" style="color: #13C1AC; text-decoration: none;">Contactează-ne</a>
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
