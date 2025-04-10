import React, { useState, useEffect, useCallback, useRef } from "react";

const generatePattern = () => {
  let lines = [];
  for (let i = 1; i <= 30; i++) {
    lines.push(`Round ${i}: (${Math.max(1, Math.floor(i / 3))} sc, inc) x 6`);
    if (i === 3) {
      lines.push(`// Sample note between round 3 and 4`);
    }
    if (i === 10 || i === 20) {
      lines.push(`// Note between round ${i} and ${i + 1}`);
    }
  }
  return lines.join("\n");
};

const parsePattern = (pattern) => {
  const lines = pattern.split("\n");
  let roundNumber = 1;
  let noteId = 1;

  return lines.map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) {
      return {
        id: `note-${noteId++}`,
        isNote: true,
        instruction: trimmed.substring(2).trim(),
        stitches: [],
        totalStitches: 0,
      };
    }

    const regex = /(\d*)\s*(sc|inc|dec)/g;
    const expanded = trimmed.replace(/\((.*?)\)\s*x\s*(\d+)/g, (_, group, count) =>
      Array(Number(count)).fill(group).join(" ")
    );

    let match;
    let stitches = [];
    let totalStitches = 0;

    while ((match = regex.exec(expanded)) !== null) {
      const count = match[1] ? parseInt(match[1]) : 1;
      const stitch = match[2];
      stitches.push(...Array(count).fill(stitch));
      totalStitches += count;
    }

    return {
      id: roundNumber++,
      isNote: false,
      instruction: null,
      stitches,
      totalStitches,
      raw: trimmed,
    };
  });
};

function Icon({ type }) {
  const icons = {
    play: (
      <svg className="w-4 h-4 mr-2 fill-white" viewBox="0 0 20 20">
        <path d="M4 4l12 6-12 6z" />
      </svg>
    ),
    pause: (
      <svg className="w-4 h-4 mr-2 fill-white" viewBox="0 0 20 20">
        <path d="M6 4h2v12H6zm6 0h2v12h-2z" />
      </svg>
    ),
    restart: (
      <svg className="w-4 h-4 mr-2 fill-white" viewBox="0 0 24 24">
        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
      </svg>
    ),
  };
  return icons[type] || null;
}

function App() {
  const [pattern, setPattern] = useState(generatePattern());
  const [steps, setSteps] = useState([]);
  const [index, setIndex] = useState(0);
  const [stitchIndex, setStitchIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [trackingStarted, setTrackingStarted] = useState(false);
  const [trackingPaused, setTrackingPaused] = useState(false);
  const currentRef = useRef(null);

  useEffect(() => {
    setSteps(parsePattern(pattern));
  }, [pattern]);

  useEffect(() => {
    if (showAll && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAll, index]);

  const current = steps[index];
  const previous = steps[index - 1];
  const next = steps[index + 1];

  const displaySteps = showAll ? steps : [previous, current, next].filter(Boolean);

  const totalStitches = steps
    .filter((s) => !s.isNote)
    .reduce((sum, step) => sum + step.totalStitches, 0);

  const completedStitches =
    steps
      .slice(0, index)
      .filter((s) => !s.isNote)
      .reduce((sum, step) => sum + step.totalStitches, 0) +
    (!current?.isNote ? Math.min(stitchIndex, current?.stitches.length) : 0);

  const startTracker = () => {
    setSteps(parsePattern(pattern));
    setIndex(0);
    setStitchIndex(0);
    setTrackingStarted(true);
    setTrackingPaused(false);
  };

  const pauseTracker = () => {
    setTrackingPaused(true);
  };

  const resumeTracker = () => {
    const newSteps = parsePattern(pattern);
    const currentStep = steps[index];
    const matchIndex = newSteps.findIndex((step) =>
      currentStep?.isNote
        ? step.isNote && step.instruction === currentStep.instruction
        : !step.isNote && step.raw === currentStep.raw
    );
    setSteps(newSteps);
    setIndex(matchIndex !== -1 ? matchIndex : 0);
    setTrackingPaused(false);
  };

  const handleKeyPress = useCallback(
    (e) => {
      if (!trackingStarted || trackingPaused || !current) return;

      if (e.key === " ") {
        e.preventDefault();
        if (!current.isNote && stitchIndex + 1 < current.stitches.length) {
          setStitchIndex((s) => s + 1);
        } else if (index < steps.length - 1) {
          setIndex((i) => i + 1);
          setStitchIndex(0);
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (!current.isNote && stitchIndex > 0) {
          setStitchIndex((s) => s - 1);
        } else if (index > 0) {
          const prev = steps[index - 1];
          setIndex((i) => i - 1);
          setStitchIndex(prev?.stitches.length || 0);
        }
      }
    },
    [trackingStarted, trackingPaused, current, index, stitchIndex, steps]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const handleClick = (stepIndex, stitchIdx = 0) => {
    if (!trackingStarted || trackingPaused) return;
    setIndex(stepIndex);
    setStitchIndex(stitchIdx);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#8a54c4] via-[#935ef9] to-[#b35ccc] text-white p-6">
      <div className="flex w-full justify-between items-center px-6 mb-4">
        <h1 className="text-3xl font-bold">Crochet Pattern Tracker</h1>
        <h2 className="text-lg font-semibold bg-[#8a54c4] px-4 py-2 rounded-lg">
          Total Progress: {completedStitches} / {totalStitches}
        </h2>
      </div>

      <div className="w-[50%] relative mb-2">
        <textarea
          className={`w-full p-2 text-black rounded-lg resize-y transition-all duration-300 ${
            trackingStarted && !trackingPaused
              ? "opacity-40 shadow-none"
              : "opacity-100 shadow-[0_0_8px_2px_rgba(255,255,255,0.3)]"
          }`}
          rows="6"
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="Paste or type your pattern here..."
        />
      </div>

      <div className="flex gap-4 mb-4 flex-wrap">
        {!trackingStarted && (
          <button
            onClick={startTracker}
            className="bg-[#7a4fd2] px-4 py-2 rounded-lg flex items-center"
          >
            Start Tracker
          </button>
        )}

        {trackingStarted && !trackingPaused && (
          <button
            onClick={pauseTracker}
            className="bg-[#7a4fd2] px-4 py-2 rounded-lg flex items-center"
          >
            <Icon type="pause" />
            Pause Tracker
          </button>
        )}

        {trackingStarted && trackingPaused && (
          <>
            <button
              onClick={resumeTracker}
              className="bg-[#7a4fd2] px-4 py-2 rounded-lg flex items-center"
            >
              <Icon type="play" />
              Resume Tracker
            </button>
            <button
              onClick={startTracker}
              className="bg-[#7a4fd2] px-4 py-2 rounded-lg flex items-center"
            >
              <Icon type="restart" />
              Restart Tracker
            </button>
          </>
        )}

        <button
          disabled={!trackingStarted || trackingPaused}
          onClick={() => setShowAll((v) => !v)}
          className={`px-4 py-2 rounded-lg ${
            trackingStarted && !trackingPaused
              ? "bg-[#7a4fd2]"
              : "bg-[#7a4fd2] opacity-40 cursor-not-allowed"
          }`}
        >
          {showAll ? "Hide Extra Rounds" : "Display All Rounds"}
        </button>
      </div>

      {trackingStarted && trackingPaused && (
        <div className="text-sm bg-white bg-opacity-10 text-center text-white py-2 rounded-md mb-4 w-[70%]">
          🧵 Tracker is paused. Click <strong>Resume</strong> or <strong>Restart</strong> to continue.
        </div>
      )}

      <div className="w-[70%] space-y-6">
        {displaySteps.map((step, i) => {
          const stepIndex = steps.indexOf(step);
          const isCurrent = stepIndex === index;
          const containerClass = isCurrent
            ? "bg-[#5b1eb8] scale-[1.02] transition-all duration-500 ease-in-out"
            : "bg-[#8a54c4]";

          const complete = isCurrent ? Math.min(stitchIndex, step.stitches.length) : 0;

          const ref = isCurrent && showAll ? currentRef : null;

          if (step.isNote) {
            return (
              <div key={step.id} className="space-y-2">
                <div
                  ref={ref}
                  onClick={() => handleClick(stepIndex, 0)}
                  className={`flex justify-between items-center px-4 py-2 rounded-lg cursor-pointer ${containerClass}`}
                >
                  <h3 className="text-md font-bold flex items-center">
                    <span className="mr-2">📌</span> {step.instruction}
                  </h3>
                </div>
              </div>
            );
          }

          return (
            <div key={step.id} className="space-y-2">
              <div
                ref={ref}
                className={`flex justify-between items-center px-4 py-2 rounded-lg ${containerClass}`}
              >
                <h3 className="text-md font-bold">
                  Round {step.id}: {step.raw.match(/\(.*?\) x \d+/)?.[0] || step.raw} [{step.totalStitches}]
                </h3>
                <h3 className="text-md font-bold">
                  {complete}/{step.totalStitches}
                </h3>
              </div>

              <div className={`p-4 rounded-lg ${isCurrent ? "opacity-100" : "opacity-50"}`}>
                <div className="flex flex-wrap gap-2">
                  {step.stitches.map((s, si) => (
                    <span
                      key={si}
                      onClick={() => handleClick(stepIndex, si)}
                      className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        isCurrent && si === stitchIndex
                          ? "bg-[#3d1380] text-white border-[#210a4a]"
                          : "bg-[#8a54c4] text-gray-200 border-[#7359a1]"
                      }`}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-sm opacity-80">
        Paste your pattern and click <strong>Start Tracker</strong> to begin.
      </p>
      <p className="text-sm opacity-80">
        Press <strong>Space</strong> to move forward, <strong>Backspace</strong> to undo, or{" "}
        <strong>click</strong> a stitch or note to select it.
      </p>
      <p className="text-sm opacity-80 mt-1">
        Add text instructions by starting a line with <strong>//</strong>
      </p>
    </div>
  );
}

export default App;
