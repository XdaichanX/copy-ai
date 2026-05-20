
import { Resend } from 'resend';

const resend = new Resend('re_cdcMNBwg_4aiBUQWQA1FNaw93cC4184PN');

// アクセスコードをランダム生成
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'COPYAI-';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const payload = req.body;
  const event = typeof payload === 'string' ? JSON.parse(payload) : payload;

  // 支払い完了イベントを検知
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.payment_succeeded') {
    const customerEmail = 
      event.data.object.customer_email || 
      event.data.object.customer_details?.email ||
      event.data.object.receipt_email;

    if (!customerEmail) {
      return res.status(200).json({ received: true });
    }

    const accessCode = generateCode();

    try {
      await resend.emails.send({
        from: 'CopyAI <onboarding@resend.dev>',
        to: customerEmail,
        subject: '【CopyAI】Proプランのアクセスコードをお送りします',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0e0e0f; color: #f0f0f0; border-radius: 12px;">
            <h1 style="color: #6ee7b7; font-size: 24px; margin-bottom: 8px;">CopyAI</h1>
            <p style="color: #909090; margin-bottom: 24px;">SNS投稿文ジェネレーター</p>
            
            <p>この度はCopyAI Proプランにご登録いただきありがとうございます！</p>
            
            <p style="margin-top: 24px;">以下のアクセスコードをアプリに入力してください：</p>
            
            <div style="background: #18181a; border: 1px solid rgba(110,231,183,0.25); border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
              <p style="color: #6ee7b7; font-size: 28px; font-weight: bold; letter-spacing: 0.1em; margin: 0;">${accessCode}</p>
            </div>
            
            <p><strong>使い方：</strong></p>
            <ol style="color: #909090; line-height: 1.8;">
              <li><a href="https://copy-ai-henna.vercel.app" style="color: #6ee7b7;">copy-ai-henna.vercel.app</a> を開く</li>
              <li>「✦ Proプラン」タブをクリック</li>
              <li>上記のアクセスコードを入力</li>
              <li>APIキー不要で無制限に使えます！</li>
            </ol>
            
            <p style="margin-top: 24px; color: #909090; font-size: 12px;">
              ご不明な点はこのメールに返信してください。<br>
              © 2026 CopyAI
            </p>
          </div>
        `
      });

      console.log(`アクセスコード送信完了: ${customerEmail} → ${accessCode}`);
      return res.status(200).json({ received: true, code: accessCode });
    } catch (error) {
      console.error('メール送信エラー:', error);
      return res.status(500).json({ error: 'メール送信失敗' });
    }
  }

  return res.status(200).json({ received: true });
}
