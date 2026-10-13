import {
  Body,
  Controller,
  ForbiddenException,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';
import { Roles } from 'src/common/decorators/roles.decorator';
import { EmailService } from './email.service';

class TestEmailDto {
  @ApiProperty({ example: 'dev@example.com' })
  @IsEmail()
  to!: string;

  @ApiProperty({
    example: 'welcome',
    enum: ['welcome', 'reset-password', 'password-changed', 'subscription-expiring', 'subscription-expired', 'payment-received'],
    required: false,
  })
  @IsOptional()
  @IsString()
  template?: string;
}

@ApiTags('Email (dev)')
@Controller('email')
export class EmailController {
  constructor(
    private readonly emailService: EmailService,
    private readonly config: ConfigService,
  ) {}

  // Antes era @Public(): si se desplegaba sin NODE_ENV=production (Joi pone
  // 'development' por defecto) cualquiera podía mandar correos desde el
  // dominio. Ahora además exige un super_admin autenticado.
  @ApiBearerAuth()
  @Roles(UserRole.super_admin)
  @Post('test')
  async sendTest(@Body() dto: TestEmailDto) {
    if (this.config.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Test endpoint disabled in production');
    }

    const template = dto.template ?? 'welcome';

    switch (template) {
      case 'welcome':
        await this.emailService.sendWelcome(dto.to, {
          firstName: 'Brandon',
          tenantName: 'Inmobiliaria Demo S.A.',
          appUrl: this.config.get<string>('APP_URL') ?? 'http://localhost:5173',
        });
        break;
      case 'reset-password':
        await this.emailService.sendPasswordReset(dto.to, {
          firstName: 'Brandon',
          resetUrl: `${this.config.get<string>('APP_URL') ?? 'http://localhost:5173'}/reset-password?token=test-token-abc123`,
          expiresInMinutes: 30,
        });
        break;
      case 'password-changed':
        await this.emailService.sendPasswordChanged(dto.to, {
          firstName: 'Brandon',
          changedAt: new Date(),
        });
        break;
      case 'subscription-expiring':
        await this.emailService.sendSubscriptionExpiring(dto.to, {
          firstName: 'Brandon',
          tenantName: 'Inmobiliaria Demo S.A.',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          daysLeft: 7,
          renewUrl: `${this.config.get<string>('APP_URL') ?? 'http://localhost:5173'}/billing`,
        });
        break;
      case 'subscription-expired':
        await this.emailService.sendSubscriptionExpired(dto.to, {
          firstName: 'Brandon',
          tenantName: 'Inmobiliaria Demo S.A.',
          renewUrl: `${this.config.get<string>('APP_URL') ?? 'http://localhost:5173'}/billing`,
        });
        break;
      case 'payment-received':
        await this.emailService.sendPaymentReceived(dto.to, {
          firstName: 'Brandon',
          tenantName: 'Inmobiliaria Demo S.A.',
          amount: '₡25,000',
          reference: '2374958123',
          receivedAt: new Date(),
          plan: 'Plan Pro — mensual',
        });
        break;
      default:
        throw new ForbiddenException(`Template desconocido: ${template}`);
    }

    return { sent: true, to: dto.to, template };
  }
}
