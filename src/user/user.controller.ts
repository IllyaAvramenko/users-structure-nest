import { Body, Controller, Post, Patch, Get, UseGuards, ValidationPipe, UsePipes } from '@nestjs/common';
import { User } from './decorators/user.decorator';
import { CreateUserDto } from './dto/createUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { AuthGuard } from './guards/auth.guard';
import { UserType } from './types/user.type';
import { IUserResponse } from './types/userResponse.interface';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
   constructor(private readonly userService: UserService) {}

   @Post('/register')
   @UsePipes(new ValidationPipe())
   async register(@Body('user') createUserDto: CreateUserDto): Promise<IUserResponse> {
      const newUser = await this.userService.createUser(createUserDto);

      return await this.userService.buildUserResponse(newUser);
   }
   
   @Post('/login')
   @UsePipes(new ValidationPipe())
   async login(@Body('user') loginUserDto: LoginUserDto): Promise<IUserResponse> {
      const user = await this.userService.login(loginUserDto);

      return await this.userService.buildUserResponse(user);
   }

   @UseGuards(AuthGuard)
   @Patch('/boss')
   @UsePipes(new ValidationPipe())
   async changeBoss(
      @User('id') currentUserId: number,
      @Body('subordinateId') subordinateId: number,
      @Body('newBossId') newBossId: number
   ): Promise<UserType> {
      return await this.userService.changeBoss(subordinateId, currentUserId, newBossId);
   }

   @UseGuards(AuthGuard)
   @Get()
   @UsePipes(new ValidationPipe())
   async getUsersTree(@User('id') currentUserId: number): Promise<UserType | UserType[]> {
      return await this.userService.getUsersTree(currentUserId);
   }
}