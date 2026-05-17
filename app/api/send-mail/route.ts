import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.163.com',
  port: 465,
  secure: true,
  auth: {
    user: 'kunghim@163.com',
    pass: process.env.MAIL_AUTH_CODE,
  },
});

export async function POST(request: NextRequest) {
  try {
    const { email, image, senderName, receiverName } = await request.json();

    if (!email || !image) {
      return NextResponse.json({ error: '缺少邮箱或信件图片' }, { status: 400 });
    }

    await transporter.sendMail({
      from: 'kunghim@163.com',
      to: email,
      subject: `侨批书信 - ${senderName}寄${receiverName}`,
      html: `<p>您收到一封侨批书信。</p><p>寄信人：${senderName}<br>收信人：${receiverName}</p><p>信件见附件。</p>`,
      attachments: [
        {
          filename: '侨批书信.png',
          content: image.split(',')[1],
          encoding: 'base64',
        },
      ],
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '发送失败' },
      { status: 500 },
    );
  }
}
