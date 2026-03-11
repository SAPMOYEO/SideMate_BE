const logoUrl =
  "https://res.cloudinary.com/dxbvpedtt/image/upload/v1773013390/SideMateLogo_csitpi.png";

const logoTag = `
  <div style="padding: 40px 40px 10px 40px; text-align: center">
    <a href="http://localhost:5173" target="_blank" style="text-decoration: none; display: inline-block;">
      <img
        src="${logoUrl}"
        alt="SideMate"
        style="width: 160px; height: auto; display: inline-block; border: 0; cursor: pointer;"
      />
    </a>
  </div>
`;

const footerTag = `
  <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
    <p style="font-size: 12px; color: #94a3b8; margin: 0">
      © 2026 SideMate. All rights reserved.
    </p>
  </div>
`;

const wrapLayout = (content) => `
  <div style="background-color: #f8fafc; padding: 50px 20px; font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
      ${logoTag}
      <div style="padding: 10px 40px 40px 40px">
        ${content}
      </div>
      ${footerTag}
    </div>
  </div>
`;

module.exports = {
  getResetPasswordTemplate: (resetUrl) =>
    wrapLayout(`
    <div style="text-align: center; margin-bottom: 30px">
      <h2 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 36px;">비밀번호 재설정 안내</h2>
      <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">
        안녕하세요, SideMate를 이용해 주셔서 감사합니다.<br />
        아래 버튼을 클릭하여 새로운 비밀번호를 설정하실 수 있습니다.
      </p>
    </div>
    <div style="text-align: center; margin: 40px 0">
      <a href="${resetUrl}" style="background-color: #18181b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block;">
        비밀번호 재설정하기
      </a>
    </div>
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-top: 20px;">
      <ul style="margin: 0; padding: 0; list-style: none; font-size: 13px; color: #64748b; line-height: 1.8;">
        <li>• 본 링크는 보안을 위해 <strong>10분 동안</strong>만 유효합니다.</li>
        <li>• 링크가 만료되었다면 다시 재설정 요청해 주세요.</li>
        <li>• 본인이 요청하지 않았다면 이 메일을 안전하게 무시하셔도 됩니다.</li>
        <li>• 문의사항이 있으시면 고객센터로 연락해 주세요.</li>
      </ul>
    </div>
  `),

  getGoogleGuideTemplate: () =>
    wrapLayout(`
    <div style="text-align: center; margin-bottom: 30px">
      <h2 style="font-size: 22px; font-weight: 700; color: #1e293b; margin-bottom: 36px;">구글 계정 연결 안내</h2>
      <p style="font-size: 15px; color: #64748b; line-height: 1.6; margin: 0;">
        안녕하세요, SideMate입니다.<br />
        입력하신 이메일은 <strong>구글 계정</strong>으로 연결되어 있습니다.<br />
        비밀번호 재설정 대신 구글 로그인을 이용해 주세요.
      </p>
    </div>
    <div style="text-align: center; margin: 40px 0">
      <a href="http://localhost:5173/login" style="background-color: #18181b; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; display: inline-block;">
        로그인 하러 가기
      </a>
    </div>
    <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin-top: 20px;">
      <ul style="margin: 0; padding: 0; list-style: none; font-size: 13px; color: #64748b; line-height: 1.8;">
        <li>• 본인이 요청하지 않았다면 이 메일을 안전하게 무시하셔도 됩니다.</li>
        <li>• 문의사항이 있으시면 고객센터로 연락해 주세요.</li>
      </ul>
    </div>
  `),
};
