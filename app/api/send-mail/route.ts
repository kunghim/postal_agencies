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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 简易速率限制
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const entry = rateMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  if (!checkRate(ip)) {
    return NextResponse.json({ error: '发送过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const email = String(body.email || '').trim();
    const image = String(body.image || '');
    const senderName = escapeHtml(String(body.senderName || ''));
    const receiverName = escapeHtml(String(body.receiverName || ''));

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 });
    }
    if (!image.startsWith('data:image/')) {
      return NextResponse.json({ error: '无效的图片数据' }, { status: 400 });
    }
    if (image.length > MAX_IMAGE_SIZE) {
      return NextResponse.json({ error: '图片过大' }, { status: 400 });
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
      { error: '发送失败，请稍后重试' },
      { status: 500 },
    );
  }
}
