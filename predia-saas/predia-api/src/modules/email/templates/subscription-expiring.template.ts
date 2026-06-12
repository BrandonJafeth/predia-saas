import { baseTemplate } from './base.template';

interface SubscriptionExpiringData {
  firstName: string;
  tenantName: string;
  expiresAt: Date;
  daysLeft: number;
  renewUrl: string;
}

export function subscriptionExpiringTemplate(data: SubscriptionExpiringData): { subject: string; html: string } {
  const expiresStr = data.expiresAt.toLocaleDateString('es-CR', {
    dateStyle: 'long',
    timeZone: 'America/Costa_Rica',
  });

  const isUrgent = data.daysLeft <= 3;
  const accentColor = isUrgent ? '#ef4444' : '#f59e0b';
  const accentBg = isUrgent ? '#fef2f2' : '#fffbeb';
  const accentTextStrong = isUrgent ? '#991b1b' : '#92400e';

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;line-height:1.3;font-family:Inter,Arial,sans-serif;">
      Tu suscripción vence pronto
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      Hola <strong style="color:#111111;font-weight:600;">${escHtml(data.firstName)}</strong>,
      la suscripción de <strong style="color:#111111;font-weight:600;">${escHtml(data.tenantName)}</strong>
      está próxima a vencer.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation"
      style="background-color:${accentBg};border-left:3px solid ${accentColor};border-radius:0 8px 8px 0;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 22px;">
          <p style="margin:0 0 2px;font-size:32px;font-weight:700;color:${accentColor};line-height:1.1;font-family:Inter,Arial,sans-serif;">
            ${data.daysLeft} día${data.daysLeft !== 1 ? 's' : ''}
          </p>
          <p style="margin:0;font-size:13px;color:${accentTextStrong};font-family:Inter,Arial,sans-serif;">
            Vence el <strong>${expiresStr}</strong>
          </p>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      Renueva antes de la fecha límite para mantener el acceso completo a propiedades,
      leads, reportes y todas las funciones de Predia.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        <td style="background-color:#111111;border-radius:8px;mso-padding-alt:0;">
          <a href="${data.renewUrl}"
            style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:Inter,Arial,sans-serif;border-radius:8px;">
            Renovar suscripción →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#898989;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      ¿Preguntas sobre planes o precios? Contáctanos y te ayudamos.
    </p>
  `;

  return {
    subject: `Tu suscripción de Predia vence en ${data.daysLeft} día${data.daysLeft !== 1 ? 's' : ''}`,
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
