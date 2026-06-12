import { baseTemplate } from './base.template';

interface PaymentReceivedData {
  firstName: string;
  tenantName: string;
  amount: string;
  reference: string;
  receivedAt?: Date;
  plan?: string;
}

export function paymentReceivedTemplate(data: PaymentReceivedData): { subject: string; html: string } {
  const dateStr = (data.receivedAt ?? new Date()).toLocaleString('es-CR', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: 'America/Costa_Rica',
  });

  const planRow = data.plan ? `
          <tr>
            <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                <tr>
                  <td style="font-size:13px;color:#6b7280;font-family:Inter,Arial,sans-serif;">Plan</td>
                  <td align="right" style="font-size:13px;color:#374151;font-family:Inter,Arial,sans-serif;">${escHtml(data.plan)}</td>
                </tr>
              </table>
            </td>
          </tr>` : '';

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;line-height:1.3;font-family:Inter,Arial,sans-serif;">
      Pago recibido — ¡gracias!
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      Hola <strong style="color:#111111;font-weight:600;">${escHtml(data.firstName)}</strong>,
      hemos recibido tu pago por SINPE Móvil para
      <strong style="color:#111111;font-weight:600;">${escHtml(data.tenantName)}</strong>.
    </p>

    <!-- Comprobante -->
    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation"
      style="background-color:#f5f5f5;border-radius:8px;margin-bottom:24px;">
      <tr>
        <td style="padding:20px 22px;">
          <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.6px;font-family:Inter,Arial,sans-serif;">
            Comprobante de pago
          </p>

          <!-- Monto -->
          <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                  <tr>
                    <td style="font-size:13px;color:#6b7280;font-family:Inter,Arial,sans-serif;">Monto</td>
                    <td align="right" style="font-size:20px;font-weight:700;color:#111111;font-family:Inter,Arial,sans-serif;">${escHtml(data.amount)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <!-- Referencia -->
            <tr>
              <td style="padding:10px 0;border-bottom:1px solid #e5e7eb;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                  <tr>
                    <td style="font-size:13px;color:#6b7280;font-family:Inter,Arial,sans-serif;">Referencia SINPE</td>
                    <td align="right" style="font-size:14px;font-weight:600;color:#111111;font-family:'Courier New',monospace;">${escHtml(data.reference)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            ${planRow}
            <!-- Fecha -->
            <tr>
              <td style="padding:10px 0 0;">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation">
                  <tr>
                    <td style="font-size:13px;color:#6b7280;font-family:Inter,Arial,sans-serif;">Fecha y hora</td>
                    <td align="right" style="font-size:13px;color:#374151;font-family:Inter,Arial,sans-serif;">${dateStr}</td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation"
      style="background-color:#f0fdf4;border-left:3px solid #10b981;border-radius:0 6px 6px 0;">
      <tr>
        <td style="padding:14px 18px;font-size:13px;color:#374151;line-height:1.6;font-family:Inter,Arial,sans-serif;">
          Tu suscripción será activada o renovada en un máximo de
          <strong style="color:#111111;">24 horas hábiles</strong> una vez verificado el pago.
          Si no ves cambios, contáctanos con tu referencia.
        </td>
      </tr>
    </table>
  `;

  return {
    subject: `Predia — Pago recibido: ${data.amount} (ref. ${data.reference})`,
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
