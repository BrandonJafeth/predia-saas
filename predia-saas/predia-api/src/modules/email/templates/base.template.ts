export function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="es" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>* { font-family: Arial, sans-serif !important; }</style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;word-spacing:normal;background-color:#f8f9fa;">
  <!-- Preview text -->
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>

  <table width="100%" cellpadding="0" cellspacing="0" border="0" role="presentation" style="background-color:#f8f9fa;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!--[if mso]><table width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
        <table width="600" cellpadding="0" cellspacing="0" border="0" role="presentation"
          style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e5e7eb;">

          <!-- ── HEADER ──────────────────────────────────────────── -->
          <tr>
            <td align="left" style="background-color:#111111;padding:24px 32px;border-radius:12px 12px 0 0;">
              <table cellpadding="0" cellspacing="0" border="0" role="presentation">
                <tr>
                  <td style="width:32px;height:32px;background-color:#10b981;border-radius:6px;text-align:center;vertical-align:middle;">
                    <span style="font-size:16px;font-weight:700;color:#ffffff;line-height:32px;font-family:Arial,sans-serif;">P</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;font-family:Inter,Arial,sans-serif;">Predia</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── CONTENT ─────────────────────────────────────────── -->
          <tr>
            <td style="padding:36px 32px 28px;font-family:Inter,Arial,'Helvetica Neue',sans-serif;">
              ${content}
            </td>
          </tr>

          <!-- ── FOOTER ──────────────────────────────────────────── -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;background-color:#f8f9fa;border-radius:0 0 12px 12px;">
              <p style="margin:0;font-size:12px;color:#898989;text-align:center;line-height:1.7;font-family:Inter,Arial,sans-serif;">
                © 2025 Predia · Plataforma inmobiliaria SaaS<br>
                Este correo es automático — por favor no respondas a este mensaje.
              </p>
            </td>
          </tr>

        </table>
        <!--[if mso]></td></tr></table><![endif]-->

      </td>
    </tr>
  </table>
</body>
</html>`;
}
