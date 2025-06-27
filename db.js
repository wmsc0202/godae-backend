import 'dotenv/config';
import mysql from 'mysql2/promise';

//DB 풀 설정
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

export default pool;