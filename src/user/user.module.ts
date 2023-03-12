import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { AuthGuard } from './guards/auth.guard';
import { JwtModule } from '@nestjs/jwt';
import { getJwtConfig } from 'src/configs/jwt.config';

@Module({
   imports:[TypeOrmModule.forFeature([UserEntity]), JwtModule.registerAsync(getJwtConfig())],
   controllers: [UserController],
   providers: [UserService, AuthGuard],
   exports: [UserService]
})
export class UserModule {}