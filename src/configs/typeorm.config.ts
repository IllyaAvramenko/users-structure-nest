import { getDbConfig } from './database.config';
import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { UserEntity } from '../user/user.entity';

dotenv.config();

const typeormConfig = getDbConfig();
export default new DataSource({ ...typeormConfig });