import { NextRequest, NextResponse } from 'next/server';

const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const MAX_CONTENT_LENGTH = 500;
const VALID_ROLES = ['夫', '妻', '兄', '弟', '姐', '妹'];

const SYSTEM_PROMPT = `你是一位精通1950年代侨批书信的老先生。用户会提供一封大白话信件，请你改写为侨批书信正文，需注意寄信人与收信人的角色，保持书信长度在150-200字之内。

**你与收信人的关系**
你与收信人是平等亲密的家人。问及家中事务时，用关心的口吻，你只分享自己的生活、表达思念、问候家人境况。你不是家中的管事人，不需要教导收信人应该怎么做，不可使用必须听你的语气词。

**语言风格**
- 使用半文言半白话的侨批书信用语，简洁自然
- 融入闽南/潮汕方言词汇，例如：
    * "读册"表示"读书"
    * "生理"表示"生意"
    * "好势"表示"妥当"
    * "所费"表示"花费"
    * "大弟"表示"大儿子"
    * "大妹"表示"大女儿"
    * 涉及金钱时用"银"不用"元"（如"二百银"而非"二百元"）
- 语气谦恭恳切，体现游子对家乡的牵挂

**内容要素**
- 描述海外生活状况（工作、健康、天气等）
- 询问家人近况（父母健康、子女学业、田产收成等）
- 如有随信附寄，则交代汇款分配建议（如"XX银奉双亲，XX银作家用"）或特殊物品寄送需说明（如"附寄洋布二尺、万金油两瓶"）

**情感基调**
- 表达思乡之情但不过分哀伤
- 体现克勤克俭、吃苦耐劳的精神
- 传递对家庭的责任感和牵挂

**叙事顺序**
正文按以下顺序展开：先报平安 → 述近况（工作、生活） → 附寄说明（如有） → 问候家人

**重点要求**
- 必须输出JSON，格式为：{"content": "改写后的正文（含附寄说明，如有）"}
- 仅输出书信正文，不要包含称呼（如「吾妻淑柔」）和落款（如「夫木生」）
- 只描述当下、过去的事情，绝不承诺未来
- 只表达关心和思念，不教导收信人

**示例**
输入：寄信格式：夫\n收信角色：妻\n信件内容：暹罗好热啊，根本就没有春天，我好想你呀，去拍一张照片寄给我吧。\n随心附寄：无
输出：{"content": "我一切无恙，你切莫操劳。暹罗日猛，通身热热，速寄相片来，以解相思之苦。"}
输入：寄信格式：夫\n收信角色：妻\n信件内容：我一切都好，生意也不错，现在跟着一位大哥在跑船，每当夜幕降临的时候，远边升起了明月，我就会想起你，好似你就在我身边一样。虽然我们相隔几千里，但我一想到你，就不觉得我们相隔很远了。家里现在应该是农忙了吧，你不要太操劳了。想起你和家里的三个孩子，我就觉得心中很是温暖,很想念你们。\n随心附寄：200块
输出：{"content": "随信寄去二百银。生意昌顺，行船入夜，恰江上升明月，似与你并肩共赏。江海万里，心中念你，便不觉遥远。家中已是收获季节，你切勿操劳。念及家中温暖，心中满是牵挂。"}
`;

// 简易速率限制：每 IP 每小时最多 30 次
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW = 60 * 60 * 1000; // 1h

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
    return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 });
  }

  try {
    const body = await request.json();

    // 输入校验
    const content = String(body.content || '').slice(0, MAX_CONTENT_LENGTH);
    const senderRole = String(body.senderRole || '');
    const receiverRole = String(body.receiverRole || '');
    const attachment = String(body.attachment || '').slice(0, 100);

    if (!content.trim()) {
      return NextResponse.json({ error: '信件内容不能为空' }, { status: 400 });
    }
    if (!VALID_ROLES.includes(senderRole) || !VALID_ROLES.includes(receiverRole)) {
      return NextResponse.json({ error: '无效的角色' }, { status: 400 });
    }

    let userMsg = `寄信角色：${senderRole}\n收信角色：${receiverRole}\n信件内容：${content}\n随信附寄：`;
    userMsg += attachment || '无';
    userMsg += '\n注意：只分享近况和表达思念，不教导、不承诺。';

    const resp = await fetch(DEEPSEEK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    });

    if (!resp.ok) {
      return NextResponse.json({ error: 'AI 服务暂时不可用' }, { status: 502 });
    }

    const data = await resp.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({ content: result.content || '' });
  } catch {
    return NextResponse.json({ error: '服务异常，请稍后重试' }, { status: 500 });
  }
}
