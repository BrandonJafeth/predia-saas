import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { welcomeTemplate } from './templates/welcome.template';
import { resetPasswordTemplate } from './templates/reset-password.template';
import { passwordChangedTemplate } from './templates/password-changed.template';
import { subscriptionExpiringTemplate } from './templates/subscription-expiring.template';
import { subscriptionExpiredTemplate } from './templates/subscription-expired.template';
import { paymentReceivedTemplate } from './templates/payment-received.template';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly from: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const apiKey = config.get<string>('RESEND_API_KEY') ?? '';
    const fromEmail = config.get<string>('EMAIL_FROM') ?? 'noreply@predia.com';
    const fromName = config.get<string>('EMAIL_FROM_NAME') ?? 'Predia';
    this.resend = new Resend(apiKey);
    this.from = `${fromName} <${fromEmail}>`;
    this.enabled = config.get<string>('EMAIL_ENABLED') !== 'false';
  }

  private async send(to: string, template: { subject: string; html: string }): Promise<void> {
    if (!this.enabled) {
      this.logger.debug(`[email disabled] skipping "${template.subject}" → ${to}`);
      return;
    }
    try {
      const { error } = await this.resend.emails.send({
        from: this.from,
        to: [to],
        subject: template.subject,
        html: template.html,
      });
      if (error) {
        this.logger.error(`Resend error to ${to}: ${error.message}`);
      }
    } catch (err) {
      this.logger.error(`Failed to send email to ${to}: ${(err as Error).message}`);
    }
  }

  async sendWelcome(
    to: string,
    data: { firstName: string; tenantName: string; appUrl: string; isAdminCreated?: boolean },
  ): Promise<void> {
    await this.send(to, welcomeTemplate(data));
  }

  async sendPasswordReset(
    to: string,
    data: { firstName: string; resetUrl: string; expiresInMinutes?: number },
  ): Promise<void> {
    await this.send(to, resetPasswordTemplate(data));
  }

  async sendPasswordChanged(
    to: string,
    data: { firstName: string; changedAt?: Date },
  ): Promise<void> {
    await this.send(to, passwordChangedTemplate(data));
  }

  async sendSubscriptionExpiring(
    to: string,
    data: { firstName: string; tenantName: string; expiresAt: Date; daysLeft: number; renewUrl: string },
  ): Promise<void> {
    await this.send(to, subscriptionExpiringTemplate(data));
  }

  async sendSubscriptionExpired(
    to: string,
    data: { firstName: string; tenantName: string; renewUrl: string },
  ): Promise<void> {
    await this.send(to, subscriptionExpiredTemplate(data));
  }

  async sendPaymentReceived(
    to: string,
    data: { firstName: string; tenantName: string; amount: string; reference: string; receivedAt?: Date; plan?: string },
  ): Promise<void> {
    await this.send(to, paymentReceivedTemplate(data));
  }
}
