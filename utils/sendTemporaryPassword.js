import nodemailer from 'nodemailer';

export async function sendTemporaryPassword(email, tempPassword) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.naver.com',
        port: 465, // SSL 포트
        secure: true, // true면 SSL 연결
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD
        }
    });

    const mailOptions = {
        from: `"고대구로 메타버스" <${process.env.SMTP_EMAIL}>`,
        to: email,
        subject: '[고대구로] 임시 비밀번호 안내',
        text: `임시 비밀번호는 다음과 같습니다: ${tempPassword}\n로그인 후 반드시 비밀번호를 변경해주세요.`,
    };

    await transporter.sendMail(mailOptions);
}