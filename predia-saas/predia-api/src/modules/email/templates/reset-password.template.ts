import { baseTemplate } from './base.template';

interface ResetPasswordData {
  firstName: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export function resetPasswordTemplate(data: ResetPasswordData): { subject: string; html: string } {
  const expiresText = data.expiresInMinutes
    ? `Este enlace expira en <strong style="color:#111111;">${data.expiresInMinutes} minutos</strong>.`
    : 'Este enlace tiene validez limitada.';

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;line-height:1.3;font-family:Inter,Arial,sans-serif;">
      Restablecer contraseña
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      Hola <strong style="color:#111111;font-weight:600;">${escHtml(data.firstName)}</strong>,
      recibimos una solicitud para restablecer la contraseña de tu cuenta en Predia.
    </p>

    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      Haz clic en el botón para crear una nueva contraseña. ${expiresText}
    </p>

    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:28px;">
      <tr>
        <td style="background-color:#111111;border-radius:8px;mso-padding-alt:0;">
          <a href="${data.resetUrl}"
            style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:Inter,Arial,sans-serif;border-radius:8px;">
            Restablecer contraseña →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 6px;font-size:13px;color:#6b7280;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:
    </p>
    <p style="margin:0 0 24px;font-size:12px;color:#898989;word-break:break-all;line-height:1.6;font-family:'Courier New',monospace;">
      ${data.resetUrl}
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation"
      style="background-color:#fef2f2;border-left:3px solid #ef4444;border-radius:0 6px 6px 0;">
      <tr>
        <td style="padding:14px 18px;font-size:13px;color:#374151;line-height:1.6;font-family:Inter,Arial,sans-serif;">
          <strong style="color:#111111;">¿No solicitaste este cambio?</strong><br>
          Ignora este correo. Tu contraseña no será modificada. Si crees que tu cuenta fue comprometida,
          contáctanos de inmediato.
        </td>
      </tr>
    </table>
  `;

  return {
    subject: 'Restablecer contraseña de Predia',
    html: baseTemplate(content),
  };
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
