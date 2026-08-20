"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const LEFT_WIDTH_PX = 791.15;
const REFERENCE_WIDTH_PX_BY_TYPE = {
  outsideToInside: 566.93,
  insideToOutside: 566.93,
};
const CONTACT_OVERLAP_PX = 79.12;
const APPARATUS_HEIGHT_PX = LEFT_WIDTH_PX / 4;
const SLIDER_MIN = 20;
const SLIDER_MAX = 235;
const TRIALS_PER_TYPE = 10;
const TOTAL_TRIALS = TRIALS_PER_TYPE * 2;

function trialTypeForCount(
  count: number,
): "outsideToInside" | "insideToOutside" {
  return count < TRIALS_PER_TYPE ? "outsideToInside" : "insideToOutside";
}

function referenceWidthPxForType(
  type: "outsideToInside" | "insideToOutside",
) {
  return REFERENCE_WIDTH_PX_BY_TYPE[type];
}

function startingVertexXForType(
  type: "outsideToInside" | "insideToOutside",
) {
  return type === "outsideToInside" ? SLIDER_MIN : SLIDER_MAX;
}

function lockedDirectionForType(
  type: "outsideToInside" | "insideToOutside",
): "increase" | "decrease" {
  return type === "outsideToInside" ? "increase" : "decrease";
}

function MullerLyerLine({
  leftVertexX = 40,
  rightVertexX = 360,
  showRightArrow = true,
  outward = false,
  widthPx = LEFT_WIDTH_PX,
}: {
  leftVertexX?: number;
  rightVertexX?: number;
  showRightArrow?: boolean;
  outward?: boolean;
  widthPx?: number;
}) {
  const armLength = (44.42 * 400) / widthPx;
  const leftArmX = leftVertexX + (outward ? -armLength : armLength);
  const rightArmX = rightVertexX + (outward ? armLength : -armLength);
  const armY1 = 50 - armLength;
  const armY2 = 50 + armLength;
  const strokeWidth = (6 * 400) / widthPx;
  return (
    <svg
      width={`${widthPx}px`}
      height={`${widthPx / 4}px`}
      viewBox="0 0 400 100"
      overflow="visible"
    >
      <line
        x1={leftVertexX}
        y1="50"
        x2={rightVertexX}
        y2="50"
        stroke="black"
        strokeWidth={strokeWidth}
      />
      <line
        x1={leftVertexX}
        y1="50"
        x2={leftArmX}
        y2={armY1}
        stroke="black"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      <line
        x1={leftVertexX}
        y1="50"
        x2={leftArmX}
        y2={armY2}
        stroke="black"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
      {showRightArrow && (
        <>
          <line
            x1={rightVertexX}
            y1="50"
            x2={rightArmX}
            y2={armY1}
            stroke="black"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <line
            x1={rightVertexX}
            y1="50"
            x2={rightArmX}
            y2={armY2}
            stroke="black"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

type Trial = {
  trialNumber: number;
  participantId: string;
  trialType: "outsideToInside" | "insideToOutside";
  chosenLengthPx: number;
  actualLengthPx: number;
  errorPx: number;
  reactionTimeMs: number;
  timestamp: string;
};

function ExperimentContent() {
  const router = useRouter();
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [leftVertexX, setLeftVertexX] = useState(() =>
    startingVertexXForType(trialTypeForCount(0)),
  );
  const [trials, setTrials] = useState<Trial[]>([]);
  const [trialStart, setTrialStart] = useState(() => Date.now());
  const [popup, setPopup] = useState<string | null>(null);
  const [lockedDirection, setLockedDirection] = useState<
    "increase" | "decrease"
  >(() => lockedDirectionForType(trialTypeForCount(0)));
  const [submittedToTelegram, setSubmittedToTelegram] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number | null>(() =>
    typeof window === "undefined" ? null : window.innerWidth,
  );

  const trialType: Trial["trialType"] = trialTypeForCount(trials.length);
  const trialInType =
    trials.length < TRIALS_PER_TYPE
      ? trials.length
      : trials.length - TRIALS_PER_TYPE;
  const isComplete = trials.length >= TOTAL_TRIALS;

  const adjustableOutward = trialType === "outsideToInside";
  const referenceOutward = trialType === "insideToOutside";

  const referenceWidthPx = referenceWidthPxForType(trialType);
  const apparatusWidthPx = LEFT_WIDTH_PX + referenceWidthPx - CONTACT_OVERLAP_PX;
  const apparatusScale =
    viewportWidth === null
      ? 1
      : Math.min(1, (viewportWidth - 32) / apparatusWidthPx);

  const chosenLengthPx = (360 - leftVertexX) * (LEFT_WIDTH_PX / 400);
  const actualLengthPx = referenceWidthPx;

  useEffect(() => {
    const started = sessionStorage.getItem("mullerLyerSessionStarted");
    const name = sessionStorage.getItem("mullerLyerParticipantName");
    if (started !== "true" || !name) {
      router.replace("/");
      return;
    }
    setParticipantId(name);
  }, [router]);

  useEffect(() => {
    function updateViewportWidth() {
      setViewportWidth(window.innerWidth);
    }
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  useEffect(() => {
    if (!popup) return;
    const timeout = setTimeout(() => setPopup(null), 2200);
    return () => clearTimeout(timeout);
  }, [popup]);

  useEffect(() => {
    if (!isComplete || !participantId || submittedToTelegram) return;
    setSubmittedToTelegram(true);
    fetch("/api/submit-experiment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, trials }),
    }).catch(() => {});
  }, [isComplete, participantId, submittedToTelegram, trials]);

  function handleSubmit() {
    if (isComplete || !participantId) return;

    const trial: Trial = {
      trialNumber: trials.length + 1,
      participantId,
      trialType,
      chosenLengthPx: Math.round(chosenLengthPx * 100) / 100,
      actualLengthPx: Math.round(actualLengthPx * 100) / 100,
      errorPx: Math.round((chosenLengthPx - actualLengthPx) * 100) / 100,
      reactionTimeMs: Date.now() - trialStart,
      timestamp: new Date().toISOString(),
    };

    setTrials((prev) => [...prev, trial]);
    const justFinishedBlock1 =
      trialType === "outsideToInside" && trialInType + 1 === TRIALS_PER_TYPE;
    setPopup(
      justFinishedBlock1
        ? "Outside to Inside complete! Starting Inside to Outside trials."
        : `Recorded ${trialInType + 1}/${TRIALS_PER_TYPE}`,
    );
    const nextType = trialTypeForCount(trials.length + 1);
    setLeftVertexX(startingVertexXForType(nextType));
    setLockedDirection(lockedDirectionForType(nextType));
    setTrialStart(Date.now());
  }

  function handleSliderChange(newValue: number) {
    if (lockedDirection === "increase") {
      setLeftVertexX(Math.max(newValue, leftVertexX));
    } else {
      setLeftVertexX(Math.min(newValue, leftVertexX));
    }
  }

  if (!participantId) {
    return null;
  }

  if (isComplete) {
    return (
      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
        <h1 className="text-xl font-bold text-black sm:absolute sm:top-8 sm:left-8 sm:text-3xl">
          The Müller-Lyer Illusion Experiment
        </h1>
        <p className="text-xl font-bold text-black sm:text-2xl">
          All {TOTAL_TRIALS} observations recorded. Thank you,{" "}
          {participantId}!
        </p>
        <p className="text-black">
          Your responses have been submitted for research analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <h1 className="text-xl font-bold text-black sm:absolute sm:top-8 sm:left-8 sm:text-3xl">
        The Müller-Lyer Illusion Experiment
      </h1>

      <p className="text-center text-black">
        Trial {trialInType + 1} of {TRIALS_PER_TYPE}:{" "}
        {trialType === "outsideToInside" ? "Outside to Inside" : "Inside to Outside"}
      </p>

      <div
        style={{
          width: apparatusWidthPx * apparatusScale,
          height: APPARATUS_HEIGHT_PX * apparatusScale,
          overflow: "hidden",
        }}
      >
        <div
          className="flex flex-row items-center"
          style={{
            width: apparatusWidthPx,
            transform: `scale(${apparatusScale})`,
            transformOrigin: "top left",
          }}
        >
          <MullerLyerLine
            leftVertexX={leftVertexX}
            showRightArrow={false}
            outward={adjustableOutward}
            widthPx={LEFT_WIDTH_PX}
          />
          <div style={{ marginLeft: -CONTACT_OVERLAP_PX }}>
            <MullerLyerLine
              leftVertexX={0}
              rightVertexX={400}
              outward={referenceOutward}
              widthPx={referenceWidthPx}
            />
          </div>
        </div>
      </div>

      <input
        type="range"
        min={SLIDER_MIN}
        max={SLIDER_MAX}
        value={leftVertexX}
        onChange={(e) => handleSliderChange(Number(e.target.value))}
        className="w-full max-w-[558.46px]"
      />

      <button
        onClick={handleSubmit}
        className="w-full max-w-64 rounded bg-black px-6 py-2 font-bold text-white sm:w-auto"
      >
        Record Observation
      </button>

      {popup && (
        <div className="fixed bottom-10 left-1/2 max-w-[90vw] -translate-x-1/2 rounded bg-black px-5 py-3 text-center font-bold text-white shadow-lg">
          {popup}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <ExperimentContent />
    </Suspense>
  );
}
