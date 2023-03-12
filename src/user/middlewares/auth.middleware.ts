import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { IExpressRequest } from 'src/types/expressRequest.interface';
import { UserService } from '../user.service';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
   constructor(
      private readonly userService: UserService,
      private readonly jwtService: JwtService
   ) {}

   async use(req: IExpressRequest, res: Response, next: NextFunction) {
      if (!req.headers.authorization) {
         req.user = null;
         next();
         return;
      }
      
      const token = req.headers.authorization.split(' ')[1];

      try {
         const decode = this.jwtService.verify(token);

         const user = await this.userService.findById(decode.id);
         req.user = user;
      } catch {
         req.user = null;
      } finally {
         next();
      }
   }
}