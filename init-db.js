import pool from './db.js';


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
  console.log("✅ users 테이블 생성 완료");
  
  // 액자 테이블 (이미지 업로드)
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS frames (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      file_path VARCHAR(255) NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ frames 테이블 생성 완료");

  // 친구 요청 테이블
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS friend_requests (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      sender_id INT UNSIGNED NOT NULL,
      receiver_id INT UNSIGNED NOT NULL,
      status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ friend_requests 테이블 생성 완료");

  // 친구 목록 테이블
  await conn.execute(`
    CREATE TABLE IF NOT EXISTS friends (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      friend_id INT NOT NULL,
      friend_nickname VARCHAR(10) NOT NULL UNIQUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log("✅ friends 테이블 생성 완료");

  conn.release();
  return;
}

createTables().catch(console.error);