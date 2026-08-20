"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value.replace(/[^a-zA-Z ]/g, ""));
  }

  function handleSubmit() {
    if (!name.trim()) {
      setError("Please enter your name to continue.");
      return;
    }
    sessionStorage.setItem("mullerLyerParticipantName", name.trim());
    sessionStorage.setItem("mullerLyerSessionStarted", "true");
    router.push("/experiment");
  }

  return (
    <div className="relative flex flex-1 flex-col items-center px-4">
      <div className="flex flex-col items-center gap-2 pt-6 text-center sm:pt-8">
        <h1 className="text-2xl font-bold text-black sm:text-3xl">
          The Müller-Lyer Illusion Experiment
        </h1>
        <p className="text-center text-lg font-bold text-black sm:text-xl">
          Ishpreet Kaur
          <br />
          25213811
          <br />
          Christ University
        </p>
      </div>

      <div className="mt-8 max-w-3xl text-black sm:mt-12 sm:px-8">
        <h2 className="text-2xl font-bold">Experiment Overview</h2>
        <p className="mt-3">
          The Müller-Lyer Illusion is a visual perception test where two
          lines of equal length appear different due to arrow markers at
          their ends. One line has arrows pointing inward, making it look
          shorter, while the other has arrows pointing outward, making it
          look longer. Your task is to adjust the arrows to match what you
          perceive as equal line lengths. This reveals how your brain gets
          tricked by visual cues even though both lines are actually the
          same.
        </p>

        <h2 className="mt-10 text-2xl font-bold">Instructions</h2>
        <ul className="mt-3 list-disc space-y-4 pl-6">
          <li>
            <strong>Enter your name</strong> at the start of the experiment
          </li>
          <li>
            You will complete <strong>20 observations in total</strong>:
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>10 observations for Outside to Inside trials</li>
              <li>10 observations for Inside to Outside trials</li>
            </ul>
          </li>
          <li>
            There are <strong>2 trial types</strong>:
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>
                Outside to Inside: Arrows start pointing outward, you adjust
                them inward
              </li>
              <li>
                Inside to Outside: Arrows start pointing inward, you adjust
                them outward
              </li>
            </ul>
          </li>
          <li>
            <strong>How to perform each observation</strong>:
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Look at the two lines displayed on screen</li>
              <li>One reference line will stay fixed</li>
              <li>
                Use the slider to adjust the second line&apos;s arrows until
                both lines appear equal in length to you
              </li>
              <li>Make your best judgment based on visual perception alone</li>
            </ul>
          </li>
          <li>
            <strong>Important constraint</strong>: Once you scroll the
            arrows to a certain point, <strong>you cannot go back</strong>.
            Make deliberate adjustments.
          </li>
          <li>
            <strong>Your data will not be shown to you</strong> after
            submission. Results are for research analysis only.
          </li>
          <li>
            After completing all 20 observations,{" "}
            <strong>click the Submit button</strong> to send your readings
          </li>
        </ul>
      </div>

      <div className="mt-10 flex w-full max-w-xs flex-col items-center gap-4 pb-16 sm:max-w-none">
        <input
          type="text"
          placeholder="Your name"
          value={name}
          onChange={handleNameChange}
          className="w-full max-w-64 border border-black/20 px-3 py-2 text-black"
        />
        {error && (
          <p className="text-center text-sm text-red-600">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          className="w-full max-w-64 rounded bg-black px-6 py-2 font-bold text-white sm:w-auto"
        >
          Submit
        </button>
      </div>
    </div>
  );
}
