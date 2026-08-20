import { NextRequest, NextResponse } from "next/server";

type Trial = {
  trialNumber: number;
  trialType: "outsideToInside" | "insideToOutside";
  chosenLengthPx: number;
  actualLengthPx: number;
  errorPx: number;
  reactionTimeMs: number;
};

// Calibrated to the actual test device: the reference line (566.93px)
// measured 12.5cm with a physical ruler on screen, rather than the
// generic 96dpi CSS-pixel assumption (which would read ~15cm).
const PX_PER_CM = 566.93 / 12.5;

function pxToCm(px: number) {
  return (px / PX_PER_CM).toFixed(2);
}

function formatSignedCm(px: number) {
  const cm = px / PX_PER_CM;
  const sign = cm >= 0 ? "+" : "";
  return `${sign}${cm.toFixed(2)}cm`;
}

function formatPhase(
  label: string,
  phaseTrials: Trial[],
): string[] {
  if (phaseTrials.length === 0) return [];

  const perfectCm = pxToCm(phaseTrials[0].actualLengthPx);
  const lines = [
    `${label}`,
    "",
    `Perfect value : ${perfectCm}cm`,
    "",
    `${phaseTrials.length} entries`,
    "",
  ];

  phaseTrials.forEach((t, i) => {
    lines.push(
      `Submission ${i + 1} : ${pxToCm(t.chosenLengthPx)}cm, error ${formatSignedCm(t.errorPx)}`,
    );
  });

  return lines;
}

function formatMessage(participantId: string, trials: Trial[]) {
  const phase1 = trials.filter((t) => t.trialType === "outsideToInside");
  const phase2 = trials.filter((t) => t.trialType === "insideToOutside");

  const lines = [
    "Entry - Muller Lyer Experiment",
    `Name : ${participantId}`,
    "",
  ];

  lines.push(...formatPhase("Phase 1 : Outside to Inside", phase1));
  lines.push("");
  lines.push(...formatPhase("Phase 2 : Inside to Outside", phase2));

  return lines.join("\n").trim();
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
