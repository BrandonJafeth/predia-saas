import { baseTemplate } from './base.template';

interface WelcomeData {
  firstName: string;
  tenantName: string;
  appUrl: string;
  /** True when account was created by an admin, not by self-registration */
  isAdminCreated?: boolean;
}

export function welcomeTemplate(data: WelcomeData): { subject: string; html: string } {
  const isAdmin = data.isAdminCreated ?? false;

  const headline = isAdmin
    ? `¡Bienvenido/a a Predia, ${escHtml(data.firstName)}!`
    : `¡Bienvenido/a a Predia, ${escHtml(data.firstName)}!`;

  const subtext = isAdmin
    ? `Se creó una cuenta para ti en <strong style="color:#111111;font-weight:600;">${escHtml(data.tenantName)}</strong>.
       Ya puedes iniciar sesión con tu correo y la contraseña que te asignaron.`
    : `Tu organización <strong style="color:#111111;font-weight:600;">${escHtml(data.tenantName)}</strong>
       ya está activa y lista para usar.`;

  const items = isAdmin
    ? [
        'Ver y gestionar propiedades',
        'Administrar leads y clientes',
        'Consultar reportes y estadísticas',
        'Actualizar tu perfil de asesor',
      ]
    : [
        'Agregar propiedades a tu catálogo',
        'Invitar agentes a tu equipo',
        'Gestionar leads y clientes',
        'Configurar el perfil de tu empresa',
      ];

  const ctaLabel = isAdmin ? 'Iniciar sesión →' : 'Ir al panel →';

  const securityNote = isAdmin
    ? `<p style="margin:16px 0 0;font-size:13px;color:#898989;line-height:1.6;font-family:Inter,Arial,sans-serif;">
        Si no esperabas esta cuenta o crees que fue un error, ignora este correo o contáctanos.
       </p>`
    : '';

  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111111;line-height:1.3;font-family:Inter,Arial,sans-serif;">
      ${headline}
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      ${subtext}
    </p>

    <table cellpadding="0" cellspacing="0" border="0" width="100%" role="presentation"
      style="background-color:#f5f5f5;border-radius:8px;margin-bottom:28px;">
      <tr>
        <td style="padding:20px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#111111;text-transform:uppercase;letter-spacing:0.4px;font-family:Inter,Arial,sans-serif;">
            ¿Qué puedes hacer ahora?
          </p>
          <table cellpadding="0" cellspacing="0" border="0" role="presentation">
            ${items.map(item => `
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#374151;font-family:Inter,Arial,sans-serif;">
                <span style="color:#10b981;font-weight:700;">✓</span>&nbsp;&nbsp;${item}
              </td>
            </tr>`).join('')}
          </table>
        </td>
      </tr>
    </table>

    <table cellpadding="0" cellspacing="0" border="0" role="presentation">
      <tr>
        <td style="background-color:#111111;border-radius:8px;mso-padding-alt:0;">
          <a href="${data.appUrl}"
            style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;font-family:Inter,Arial,sans-serif;border-radius:8px;letter-spacing:0.1px;">
            ${ctaLabel}
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:28px 0 0;font-size:13px;color:#898989;line-height:1.6;font-family:Inter,Arial,sans-serif;">
      ¿Necesitas ayuda? Visita nuestro centro de soporte o responde a este correo.
    </p>
    ${securityNote}
  `;

  const subject = isAdmin
    ? `Tu cuenta en ${data.tenantName} está lista — Predia`
    : `¡Bienvenido/a a Predia, ${data.firstName}! Tu cuenta está lista`;

  return { subject, html: baseTemplate(content) };
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
