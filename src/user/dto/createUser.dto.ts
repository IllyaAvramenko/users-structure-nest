import { IsNotEmpty, IsEmail, IsEmpty, IsEnum, IsOptional } from 'class-validator';
import { UserRoleEnum } from '../types/userRole.enum';

export class CreateUserDto {
   @IsNotEmpty()
   readonly name: string;
   
   @IsNotEmpty()
   @IsEmail()
   readonly email: string;
   
   @IsNotEmpty()
   readonly password: string;

   @IsOptional()
   @IsEnum(UserRoleEnum)
   readonly role: UserRoleEnum;

   @IsOptional()
   readonly bossId: number;

   @IsOptional()
   readonly subordinateIds: number[];
}