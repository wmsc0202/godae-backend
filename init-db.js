import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host     : 'localhost',
  port     : '3365',
  user     : 'root',
  password : '123456',
  database : 'godae'
});

async function createTables() {
  const conn = await pool.getConnection();

  // 유저 테이블
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email         VARCHAR(255) NOT NULL UNIQUE,
      nickname      VARCHAR(10)  NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      gender        ENUM('M','F') NOT NULL,
      account_type  ENUM('NORMAL','PROFESSOR') NOT NULL,
      pregnancy_date DATE DEFAULT NULL,
      pregnancy_trimester TINYINT DEFAULT 0,
      pregnancy_weeks TINYINT DEFAULT 0,
      birth_status ENUM('임신전','임신중','출산완료','난임') NOT NULL DEFAULT '임신전',
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // 액자 테이블 (이미지 업로드)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS frames (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  conn.release();
  console.log("✅ users 테이블 생성 완료");
  console.log("✅ frames 테이블 생성 완료");

  return;
}

createTables().catch(console.error);