import { useState, useEffect, useCallback } from "react";

const generatePattern = () => {
  return [
    "Round 1: (sc, inc) x 6",
    "Round 2: (2 sc, inc) x 6",
    "Round 3: (3 sc, inc) x 6",
    "// Insert safety eyes between rounds 3 and 4",
    "Round 4: (4 sc, inc) x 6",
    "Round 5: (5 sc, inc) x 6"
  ].join("\n");
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

function App() {
  const [pattern, setPattern] = useState(generatePattern());
  const [steps, setSteps] = useState([]);
  const [index, setIndex] = useState(0);
  const [stitchIndex, setStitchIndex] = useState(0);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const parsed = parsePattern(pattern);
    setSteps(parsed);
    setIndex(0);
    setStitchIndex(0);
  }, [pattern]);

  const current = steps[index];
  const previous = steps[index - 1];
  const next = steps[index + 1];

  const displaySteps = showAll
    ? steps
    : [previous, current, next].filter(Boolean);

  const totalStitches = steps
    .filter((s) => !s.isNote)
    .reduce((sum, step) => sum + step.totalStitches, 0);

  const completedStitches =
    steps
      .slice(0, index)
      .filter((s) => !s.isNote)
      .reduce((sum, step) => sum + step.totalStitches, 0) +
    (!current?.isNote ? Math.min(stitchIndex, current?.stitches.length) : 0);

  const handleKeyPress = useCallback(
    (e) => {
      if (!current) return;

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
    [current, index, stitchIndex, steps]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const handleClick = (stepIndex, stitchIdx) => {
    setIndex(stepIndex);
    setStitchIndex(stitchIdx);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#8a54c4] via-[#935ef9] to-[#b35ccc] text-white p-6">
      {/* Header */}
      <div className="flex w-full justify-between items-center px-6 mb-4">
        <h1 className="text-3xl font-bold">Crochet Pattern Tracker</h1>
        <h2 className="text-lg font-semibold bg-[#8a54c4] px-4 py-2 rounded-lg">
          Total Progress: {completedStitches} / {totalStitches}
        </h2>
      </div>

      {/* Pattern Input */}
      <textarea
        className="w-[50%] p-2 mb-4 text-black rounded-lg resize-y"
        rows="4"
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
      />

      <button
        onClick={() => setShowAll((v) => !v)}
        className="bg-[#5b1eb8] px-4 py-2 rounded-lg mb-4"
      >
        {showAll ? "Show Focused View" : "Show All Rounds"}
      </button>

      {/* Step Display */}
      <div className="w-[70%] space-y-6">
        {displaySteps.map((step, i) => {
          const stepIndex = steps.indexOf(step);
          const isCompleted = stepIndex < index;
          const isCurrent = stepIndex === index;
          const opacity = isCompleted ? "opacity-50" : "opacity-100";

          if (step.isNote) {
            return (
              <div key={step.id} className="space-y-2">
                <div
                  className={`flex justify-between items-center px-4 py-2 rounded-lg ${isCurrent ? "bg-[#5b1eb8]" : "bg-[#8a54c4]"} ${opacity}`}
                >
                  <h3 className="text-md font-bold flex items-center">
                    <span className="mr-2">📌</span> {step.instruction}
                  </h3>
                </div>
              </div>
            );
          }

          const complete = isCompleted
            ? step.totalStitches
            : isCurrent
            ? Math.min(stitchIndex, step.stitches.length)
            : 0;

          return (
            <div key={step.id} className="space-y-2">
              <div
                className={`flex justify-between items-center px-4 py-2 rounded-lg ${isCurrent ? "bg-[#5b1eb8]" : "bg-[#8a54c4]"} ${opacity}`}
              >
                <h3 className="text-md font-bold">
                  Round {step.id}: {step.raw.match(/\(.*?\) x \d+/)?.[0] || step.raw} [{step.totalStitches}]
                </h3>
                <h3 className="text-md font-bold">
                  {complete}/{step.totalStitches} {isCompleted && "✔️"}
                </h3>
              </div>

              <div className={`p-4 rounded-lg ${opacity}`}>
                <div className="flex flex-wrap gap-2">
                  {step.stitches.map((s, si) => (
                    <span
                      key={si}
                      onClick={() => handleClick(stepIndex, si)}
                      className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        isCompleted
                          ? "bg-[#725394] text-gray-300 border-[#5a3c74]"
                          : isCurrent && si === stitchIndex
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
        Press <strong>Space</strong> to move forward, <strong>Backspace</strong> to undo, or <strong>click</strong> a stitch to select it.
      </p>
      <p className="mt-2 text-sm opacity-80">
        Add text instructions by starting a line with <strong>//</strong>
      </p>
    </div>
  );
}

export default App;
