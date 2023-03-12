import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, TreeRepository } from 'typeorm';
import { compare } from 'bcrypt';
import { CreateUserDto } from './dto/createUser.dto';
import { LoginUserDto } from './dto/loginUser.dto';
import { UserEntity } from './user.entity';
import { IUserResponse } from './types/userResponse.interface';
import { JwtService } from '@nestjs/jwt';
import { UserRoleEnum } from './types/userRole.enum';
import { UserType } from './types/user.type';

@Injectable()
export class UserService {
   constructor(
      @InjectRepository(UserEntity)
      private readonly userRepository: Repository<UserEntity>,
      @InjectRepository(UserEntity)
      private readonly userTreeRepository: TreeRepository<UserEntity>,
      private readonly jwtService: JwtService
   ) {}

   async createUser({ bossId, subordinateIds, ...createUserDto }: CreateUserDto): Promise<UserEntity> {
      
      if (createUserDto.role === UserRoleEnum.User && !bossId) {
         throw new HttpException('User must have boss', HttpStatus.BAD_REQUEST);
      }

      if (createUserDto.role === UserRoleEnum.Admin) {
         throw new HttpException('You can not create user with role Admin', HttpStatus.BAD_REQUEST);
      }

      const userByEmail = await this.userRepository.findOne({
         where: {
            email: createUserDto.email
         }
      });

      const userByUsername = await this.userRepository.findOne({
         where: {
            name: createUserDto.name
         }
      });

      if (userByEmail || userByUsername) {
         throw new HttpException('Email or username are taken', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      const newUser = new UserEntity();
      Object.assign(newUser, createUserDto);

      if (bossId) {
         const bossUser = await this.userRepository.findOne({
            where: {
               id: bossId
            }
         });

         if (bossUser.role === UserRoleEnum.User) {
            throw new HttpException('Boss can not be user with role "User"', HttpStatus.BAD_REQUEST);
         }

         newUser.boss = bossUser;
      }

      if (subordinateIds && subordinateIds.length) {
         const users = await this.userRepository.find({
            where: {
               id: In(subordinateIds)
            },
            relations: ['id', 'name', 'email', 'role', 'boss']
         });
         
         if (users.some(user => user.role === UserRoleEnum.Admin || user.boss)) {
            throw new HttpException('Subordinate user is Admin or already has boss', HttpStatus.BAD_REQUEST);
         }

         newUser.subordinates = users;
      }

      return await this.userRepository.save(newUser);
   }

   async login(loginUserDto: LoginUserDto): Promise<UserEntity> {

      const user = await this.userRepository.findOne({
         where: {
            email: loginUserDto.email
         },
         select: ['id', 'name', 'email', 'password', 'role']
      });

      if (!user) {
         throw new HttpException('Credentials are not valid', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      const isPasswordCorrect = await compare(loginUserDto.password, user.password);

      if (!isPasswordCorrect) {
         throw new HttpException('Credentials are not valid', HttpStatus.UNPROCESSABLE_ENTITY);
      }

      delete user.password;

      return user;
   }

   async findById(id: number): Promise<UserEntity> {
      return await this.userRepository.findOne({ where: { id } });
   }

   async changeBoss(subordinateId: number, currentUserId: number, newBossId: number): Promise<UserType> {

      if (subordinateId === newBossId) {
         throw new HttpException('newBossId and subordinateId can not be equal', HttpStatus.BAD_REQUEST);
      }

      const currentUser = await this.findById(currentUserId);
      
      if (currentUser.role == UserRoleEnum.Admin && currentUser.id === subordinateId) {
         throw new HttpException('You are Admin and you can not have a boss', HttpStatus.BAD_REQUEST);

      }

      const subordinate = await this.userTreeRepository
         .createDescendantsQueryBuilder('user', 'users_closure', currentUser)
         .leftJoinAndSelect('user.subordinates', 'subordinate')
         .leftJoinAndSelect('user.boss', 'boss')
         .where('user.id = :subordinateId', { subordinateId })
         .getOne();

      const newBoss = await this.userTreeRepository
         .createDescendantsQueryBuilder('user', 'users_closure', currentUser)
         .leftJoinAndSelect('user.subordinates', 'subordinate')
         .leftJoinAndSelect('user.boss', 'boss')
         .where('user.id = :newBossId', { newBossId })
         .getOne();

      const descendants = await this.userTreeRepository.findDescendants(currentUser);

      const isNewBossYourDescendant = descendants.find(user => user.id === newBossId);
      
      if (!isNewBossYourDescendant) {
         throw new HttpException(`User with id ${newBossId} is not your subordinate`, HttpStatus.BAD_REQUEST);
      }

      const isSubordinateYourDescendant = descendants.find(user => user.id === subordinateId);
      
      if (!isSubordinateYourDescendant) {
         throw new HttpException(`User with id ${subordinateId} is not your subordinate`, HttpStatus.BAD_REQUEST);
      }

      if (newBoss.boss && newBoss.boss.id === subordinate.id) {
         throw new HttpException(`You can not make boss to be subordinate of he's subbordinate`, HttpStatus.BAD_REQUEST);
      }

      if (newBoss.role !== UserRoleEnum.Admin) {
         newBoss.role = UserRoleEnum.Boss;
      }

      if (subordinate.subordinates.length) {
         subordinate.role = UserRoleEnum.Boss
      } else {
         subordinate.role = UserRoleEnum.User
      }

      const oldBoss = await this.userTreeRepository
         .createQueryBuilder('user')
         .leftJoinAndSelect('user.subordinates', 'subordinate')
         .where('user.id = :oldBossId', { oldBossId: subordinate.boss.id })
         .getOne();


      if (!oldBoss.subordinates.filter(user => user.id !== subordinate.id).length) {
         const oldBoss = await this.findById(subordinate.boss.id);
         oldBoss.role = UserRoleEnum.User;

         await this.userRepository.save(oldBoss);
      }

      subordinate.boss = newBoss;

      const deleteResult = await this.userTreeRepository.manager.query(`
         DELETE FROM users_closure
         WHERE ancestor_id = ${oldBoss.id} 
         AND descendant_id = ${subordinateId}
      `);

      const res = await this.userTreeRepository.manager.query(`
         INSERT INTO users_closure (ancestor_id, descendant_id)
         VALUES (${newBossId}, ${subordinateId})
      `);

      await this.userTreeRepository.save(newBoss);
      await this.userTreeRepository.save(subordinate);

      return await this.userTreeRepository.findDescendantsTree(currentUser);
   }

   async getUsersTree(currentUserId: number): Promise<UserType | UserType[]> {
      const currentUser = await this.findById(currentUserId);

      if (currentUser.role === UserRoleEnum.Admin) {
         return await this.userTreeRepository.findTrees();
      }

      return await this.userTreeRepository.findDescendantsTree(currentUser);
   }

   async buildUserResponse(user: UserEntity): Promise<IUserResponse> {
      return {
         user: {
            ...user,
            token: await this.jwtService.signAsync({ id: user.id, email: user.email })
         }
      }
   }
}