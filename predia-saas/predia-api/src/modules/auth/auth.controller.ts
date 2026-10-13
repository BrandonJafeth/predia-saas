import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
// import type: un `import * as express` de valor sobrevive al plugin de
// Swagger del CLI de Nest y emite require('express'), que no es dependencia
// directa del API → el build compilado no arrancaba (Cannot find module).
import type * as express from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { LookupDto } from './dto/lookup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TenantOptionDto } from './dto/tenant-option.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { Public } from 'src/common/decorators/public.decorator';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

@Public()
@ApiTags('Auth')
@SkipThrottle({ 'auth-strict': true })
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  // Verifica contraseñas: mismo límite que login.
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiBody({ type: LookupDto })
  @ApiOkResponse({
    type: [TenantOptionDto],
    description: 'Organizaciones donde email + contraseña son válidos',
  })
  lookupTenants(@Body() dto: LookupDto): Promise<TenantOptionDto[]> {
    return this.authService.lookupTenants(dto);
  }

  @Post('register')
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ type: AuthResponseDto })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return { accessToken };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AuthResponseDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return { accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<void> {
    const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    // Revoca la sesión en DB: antes solo se borraba la cookie y el refresh
    // token seguía sirviendo 7 días si alguien lo había copiado.
    await this.authService.logout(token);
    res.clearCookie(REFRESH_COOKIE, { path: COOKIE_OPTIONS.path });
  }

  @Get('validate-reset-token')
  @ApiOkResponse({ description: 'Token válido y no expirado' })
  validateResetToken(@Query('token') token?: string): Promise<{ valid: true }> {
    return this.authService.validateResetToken(token);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  // El @SkipThrottle de la clase gana sobre @Throttle si no se anula acá
  // explícitamente: sin esto el límite de 3/15min nunca se aplicaba.
  @SkipThrottle({ 'auth-strict': false })
  @Throttle({ 'auth-strict': { ttl: 15 * 60_000, limit: 3 } })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiOkResponse({ description: 'Respuesta idéntica exista o no el email (anti-enumeración)' })
  forgotPassword(@Body() dto: ForgotPasswordDto): Promise<void> {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  // El @SkipThrottle de la clase gana sobre @Throttle si no se anula acá
  // explícitamente: sin esto el límite de 3/15min nunca se aplicaba.
  @SkipThrottle({ 'auth-strict': false })
  @Throttle({ 'auth-strict': { ttl: 15 * 60_000, limit: 3 } })
  @ApiBody({ type: ResetPasswordDto })
  @ApiOkResponse({ description: 'Contraseña actualizada' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AuthResponseDto })
  async refresh(
    @Req() req: express.Request,
    @Res({ passthrough: true }) res: express.Response,
  ): Promise<AuthResponseDto> {
    const token = (req.cookies as Record<string, string> | undefined)?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException('Refresh token no encontrado');
    const { accessToken, refreshToken } = await this.authService.refreshTokens(token);
    res.cookie(REFRESH_COOKIE, refreshToken, COOKIE_OPTIONS);
    return { accessToken };
  }
}
