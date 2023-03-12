import { JwtModuleAsyncOptions } from '@nestjs/jwt';
import { ConfigService, ConfigModule } from '@nestjs/config';

export const getJwtConfig = (): JwtModuleAsyncOptions => ({
   imports: [ConfigModule],
   inject: [ConfigService],
   useFactory: (configService: ConfigService) => ({
      secret: configService.get('JWT_SECRET')
   })
});