import { baseTemplate } from './base.template';

interface SubscriptionExpiredData {
  firstName: string;
  tenantName: string;
  renewUrl: string;
}

export function subscriptionExpiredTemplate(data: SubscriptionExpiredData): { subject: string; html: string } {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;line-height:1.3;font-family:Inter,Arial,sans-serif;">
      Suscripción vencida — acceso suspendido
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      Hola <strong style="color:#111111;font-weight:600;">${escHtml(data.firstName)}</strong>,
      la suscripción de <strong style="color:#111111;font-weight:600;">${escHtml(data.tenantName)}</strong>
      ha vencido y el acceso está temporalmente suspendido.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation"
      style="background-color:#f5f5f5;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 22px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#111111;text-transform:uppercase;letter-spacing:0.4px;font-family:Inter,Arial,sans-serif;">
            Acceso suspendido
          </p>
          <table cellpadding="0" cellspacing="0" border="0" role="presentation">
            <tr>
              <td style="padding:3px 0;font-size:14px;color:#6b7280;font-family:Inter,Arial,sans-serif;">
                <span style="color:#ef4444;">✗</span>&nbsp;&nbsp;Panel de administración bloqueado
              </td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:14px;color:#6b7280;font-family:Inter,Arial,sans-serif;">
                <span style="color:#ef4444;">✗</span>&nbsp;&nbsp;Propiedades y leads no accesibles
              </td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:14px;color:#6b7280;font-family:Inter,Arial,sans-serif;">
                <span style="color:#ef4444;">✗</span>&nbsp;&nbsp;Reportes y estadísticas no disponibles
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      Tus datos están seguros. Renueva tu suscripción para recuperar el acceso completo de inmediato.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#111111;border-radius:8px;mso-padding-alt:0;">
          <a href="${data.renewUrl}"
            style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:Inter,Arial,sans-serif;border-radius:8px;">
            Reactivar suscripción →
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#898989;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      ¿Necesitas ayuda con el proceso de pago? Contáctanos directamente.
    </p>
  `;

  return {
    subject: `[Acción requerida] Suscripción de ${data.tenantName} vencida`,
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
