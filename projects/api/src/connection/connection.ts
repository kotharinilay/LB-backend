import {createConnection} from 'typeorm';
import { join } from 'path';
import CONFIG from '../config'


export const connection = createConnection({
    type: 'postgres',
    host: CONFIG.DB_HOST,
    port:  5432,
    username: CONFIG.DB_USER,
    password: CONFIG.DB_PASSWORD,
    database: CONFIG.DB_NAME,
    synchronize: false,
    logging: false,
    entities: [join(__dirname, '../entities/*{.ts,.js}')]
});