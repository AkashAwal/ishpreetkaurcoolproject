import { NextRequest, NextResponse } from "next/server";

type Trial = {
  trialNumber: number;
  trialType: "outsideToInside" | "insideToOutside";
  chosenLengthPx: number;
  actualLengthPx: number;
  errorPx: number;
  reactionTimeMs: number;
};

function formatMessage(participantId: string, trials: Trial[]) {
  const lines = [
    `Müller-Lyer submission — ${participantId}`,
    `Submitted: ${new Date().toISOString()}`,
    "",
  ];

  for (const t of trials) {
    const label = t.trialType === "outsideToInside" ? "O→I" : "I→O";
    lines.push(
      `#${t.trialNumber} [${label}] chosen=${t.chosenLengthPx}px actual=${t.actualLengthPx}px error=${t.errorPx}px rt=${t.reactionTimeMs}ms`,
    );
  }

  return lines.join("\n");
}

export async function POST(request: NextRequest) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json(
      { error: "Telegram credentials not configured" },
      { status: 500 },
    );
  }

  const body = await request.json();
  const { participantId, trials } = body as {
    participantId: string;
    trials: Trial[];
  };

  if (!participantId || !Array.isArray(trials)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const text = formatMessage(participantId, trials);

  const telegramResponse = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
    },
  );

  if (!telegramResponse.ok) {
    const errorBody = await telegramResponse.text();
    return NextResponse.json(
      { error: "Failed to send to Telegram", details: errorBody },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
