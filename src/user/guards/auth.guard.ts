import { CanActivate, ExecutionContext, HttpStatus, HttpException, Injectable } from '@nestjs/common';
import { IExpressRequest } from 'src/types/expressRequest.interface';

@Injectable()
export class AuthGuard implements CanActivate {
   canActivate(context: ExecutionContext): boolean {
      const request = context.switchToHttp().getRequest<IExpressRequest>();

      if (request.user) {
         return true
      }

      throw new HttpException('Not authorized', HttpStatus.UNAUTHORIZED);
   }
}