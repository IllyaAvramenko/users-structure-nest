import * as dotenv from 'dotenv';
import { DataSourceOptions } from 'typeorm';
import { UserEntity } from '../user/user.entity';
dotenv.config();

export const getDbConfig = (): DataSourceOptions => {

   return ({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [UserEntity],
      synchronize: true,
      migrations: ['src/migrations/**/*{.ts,.js}'],
      migrationsTableName: "migrations_history",
      migrationsRun: true,
      ssl: true,
      extra: {
         ssl: {
            rejectUnauthorized: false
         }
      }
   })
};