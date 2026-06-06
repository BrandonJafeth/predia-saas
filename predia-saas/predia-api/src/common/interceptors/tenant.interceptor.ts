import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tenantAls } from '../als/tenant.als';
import { JwtPayload } from '../../modules/auth/interfaces/jwt-payload.interface';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;
    const tenantId = user?.tenantId;

    if (tenantId) {
      return tenantAls.run({ tenantId }, () => {
        return next.handle();
      });
    }

    return next.handle();
  }
}
