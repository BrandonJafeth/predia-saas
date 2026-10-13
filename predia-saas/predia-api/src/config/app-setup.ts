import { ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { ApiKeysService } from '../modules/api-keys/api-keys.service';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cookieParser = require('cookie-parser') as typeof import('cookie-parser');

const PUBLIC_PREFIX = '/public/';

/**
 * Configuración HTTP compartida por main.ts y los tests e2e (para que lo que
 * se prueba sea lo que corre).
 */
export function configureApp(app: NestExpressApplication): void {
  // OWASP API8 (misconfiguración): no anunciar el stack.
  app.disable('x-powered-by');

  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy) {
    const hops = Number(trustProxy);
    app.set('trust proxy', Number.isNaN(hops) ? trustProxy : hops);
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (process.env.NODE_ENV === 'production') {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }
    if (req.path.startsWith(PUBLIC_PREFIX)) {
      // Las respuestas dependen de la key y del origen: que ningún caché
      // compartido sirva la de un sitio a otro.
      res.setHeader('Vary', 'Origin, X-API-Key');
    }
    next();
  });

  const crmOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
  const apiKeys = app.get(ApiKeysService);

  // CORS en dos niveles:
  // - CRM (/api, /auth...): solo CORS_ORIGIN, con cookies (refresh token).
  // - API pública (/public): orígenes registrados en alguna key publishable
  //   activa, sin cookies. El preflight no trae la key, así que acá se
  //   valida contra el conjunto; ApiKeyGuard exige después que el origen
  //   sea de la key concreta.
  app.enableCors(
    (
      req: Request,
      callback: (err: Error | null, options: CorsOptions) => void,
    ) => {
      if (req.url.startsWith(PUBLIC_PREFIX)) {
        callback(null, {
          origin: (
            origin: string | undefined,
            done: (err: Error | null, allow?: boolean) => void,
          ) => {
            if (!origin) return done(null, false);
            apiKeys
              .isRegisteredOrigin(origin)
              .then((allowed) => done(null, allowed))
              .catch(() => done(null, false));
          },
          methods: ['GET', 'POST', 'OPTIONS'],
          allowedHeaders: ['Content-Type', 'X-API-Key'],
          // El throttler nombrado 'public' responde Retry-After-public.
          exposedHeaders: ['Retry-After', 'Retry-After-public'],
          credentials: false,
          maxAge: 600,
        });
        return;
      }
      callback(null, {
        origin: crmOrigins,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Tenant-ID',
          'Cache-Control',
          'Pragma',
        ],
        credentials: true,
      });
    },
  );

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
