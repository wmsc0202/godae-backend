import 'dotenv/config';
import mysql from 'mysql2/promise';

//DB 풀 설정
const pool = mysql.createPool({
    host: 'localhost',
    port: 3365,
    user: 'root',
    password: '123456',
    database: 'godae'
});

export default pool;