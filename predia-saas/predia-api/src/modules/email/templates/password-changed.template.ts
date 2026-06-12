import { baseTemplate } from './base.template';

interface PasswordChangedData {
  firstName: string;
  changedAt?: Date;
}

export function passwordChangedTemplate(data: PasswordChangedData): { subject: string; html: string } {
  const dateStr = (data.changedAt ?? new Date()).toLocaleString('es-CR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Costa_Rica',
  });

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;line-height:1.3;font-family:Inter,Arial,sans-serif;">
      Contraseña actualizada
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      Hola <strong style="color:#111111;font-weight:600;">${escHtml(data.firstName)}</strong>,
      la contraseña de tu cuenta en Predia fue cambiada exitosamente.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation"
      style="background-color:#f5f5f5;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:18px 22px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
            <tr>
              <td style="font-size:13px;color:#6b7280;font-family:Inter,Arial,sans-serif;">Estado</td>
              <td align="right">
                <span style="display:inline-block;padding:2px 10px;background-color:#dcfce7;border-radius:9999px;font-size:12px;font-weight:600;color:#15803d;font-family:Inter,Arial,sans-serif;">
                  ✓ Actualizada
                </span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:10px;border-top:1px solid #e5e7eb;padding-top:12px;margin-top:10px;">
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;color:#6b7280;font-family:Inter,Arial,sans-serif;">Fecha y hora</td>
              <td align="right" style="font-size:13px;color:#374151;font-family:Inter,Arial,sans-serif;">${dateStr}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation"
      style="background-color:#fef2f2;border-left:3px solid #ef4444;border-radius:0 6px 6px 0;">
      <tr>
        <td style="padding:14px 18px;font-size:13px;color:#374151;line-height:1.6;font-family:Inter,Arial,sans-serif;">
          <strong style="color:#111111;">¿No realizaste este cambio?</strong><br>
          Tu cuenta puede estar comprometida. Comunícate con nuestro soporte de inmediato.
        </td>
      </tr>
    </table>
  `;

  return {
    subject: 'Tu contraseña de Predia fue actualizada',
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
