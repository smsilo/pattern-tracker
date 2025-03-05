import { useState, useEffect, useCallback } from "react";

const generatePattern = () => {
  let pattern = [];
  for (let i = 1; i <= 30; i++) {
    const increaseEvery = Math.max(1, Math.floor(i / 3));
    pattern.push(`Round ${i}: (${increaseEvery} sc, inc) x 6`);
  }
  return pattern.join("\n");
};

const parsePattern = (pattern) => {
  return pattern.split("\n").map((round, roundIndex) => {
    const regex = /(\d*)\s*(sc|inc|dec)/g;
    let stitches = [];
    let totalStitches = 0;
    let formattedPattern = round.match(/\(.*?\) x \d+/)?.[0] || round;

    round.replace(/\((.*?)\)\s*x\s*(\d+)/g, (_, group, repeat) => {
      const expanded = Array(Number(repeat)).fill(group).join(" ");
      round = round.replace(`(${group}) x ${repeat}`, expanded);
    });

    let match;
    while ((match = regex.exec(round)) !== null) {
      const count = match[1] ? parseInt(match[1]) : 1;
      const stitch = match[2];
      stitches.push(...Array(count).fill(stitch));
      totalStitches += count;
    }

    return {
      id: roundIndex + 1, // Ensure round IDs start from 1
      stitches,
      totalStitches,
      formattedPattern,
    };
  });
};

// Hardcoded round transition map
const roundMap = {};
for (let i = 1; i <= 100; i++) {
  roundMap[i] = i + 1;
}

function App() {
  const [pattern, setPattern] = useState(generatePattern());
  const [rounds, setRounds] = useState(parsePattern(pattern));
  const [currentRound, setCurrentRound] = useState(1); // Start at round 1
  const [currentStitch, setCurrentStitch] = useState(0);
  const [showAllRounds, setShowAllRounds] = useState(false);

  useEffect(() => {
    const parsedRounds = parsePattern(pattern);
    setRounds(parsedRounds);
    setCurrentRound(1);
    setCurrentStitch(0);
  }, [pattern]);

  const totalStitches = rounds.reduce((acc, round) => acc + round.totalStitches, 0);
  const totalCompleted = rounds
    .filter((round) => round.id < currentRound)
    .reduce((acc, round) => acc + round.totalStitches, 0) + currentStitch;

  // ✅ Ensures spacebar transition remains correct
  const handleKeyPress = useCallback((event) => {
    if (event.key === " ") {
      event.preventDefault(); // Prevent scrolling

      setCurrentStitch((prevStitch) => {
        const nextStitch = prevStitch + 1;

        if (nextStitch >= rounds.find((r) => r.id === currentRound)?.stitches.length) {
          const nextRound = roundMap[currentRound] || currentRound;

          if (rounds.some((r) => r.id === nextRound)) {
            setCurrentRound(nextRound);
            return 0;
          }
        }

        return nextStitch;
      });
    } else if (event.key === "Backspace") {
      event.preventDefault();
      setCurrentStitch((prev) => Math.max(prev - 1, 0));
    }
  }, [rounds, currentRound]);

  const handleClick = (roundIndex, stitchIndex) => {
    setCurrentRound(rounds[roundIndex]?.id || 1);
    setCurrentStitch(stitchIndex);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#8a54c4] via-[#935ef9] to-[#b35ccc] text-white p-6">
      {/* Header */}
      <div className="flex w-full justify-between items-center px-6 mb-4">
        <h1 className="text-3xl font-bold">Crochet Pattern Tracker</h1>
        <h2 className="text-lg font-semibold bg-[#8a54c4] px-4 py-2 rounded-lg">
          Total Progress: {totalCompleted} / {totalStitches}
        </h2>
      </div>

      {/* Input Box */}
      <textarea
        className="w-[50%] p-2 mb-4 text-black rounded-lg resize-y"
        rows="4"
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
      />

      {/* Show All Rounds Toggle */}
      <button
        onClick={() => setShowAllRounds(!showAllRounds)}
        className="bg-[#5b1eb8] px-4 py-2 rounded-lg mb-4"
      >
        {showAllRounds ? "Show Focused View" : "Show All Rounds"}
      </button>

      {/* Round Titles & Counters */}
      <div className="w-[70%] space-y-6">
        {rounds.map((round) => {
          if (!showAllRounds && (round.id < currentRound - 1 || round.id > currentRound + 1)) {
            return null;
          }

          const isCompleted = round.id < currentRound;
          const isCurrent = round.id === currentRound;
          const opacityClass = isCompleted ? "opacity-50" : "opacity-100";

          return (
            <div key={round.id} className="space-y-2">
              {/* Round Title & Counter */}
              <div
                className={`flex justify-between items-center px-4 py-2 rounded-lg transition-opacity ${opacityClass} ${
                  isCurrent ? "bg-[#5b1eb8]" : "bg-[#8a54c4]"
                }`}
              >
                <h3 className="text-md font-bold">
                  Round {round.id}: {round.formattedPattern} [{round.totalStitches}]
                </h3>
                <h3 className="text-md font-bold">
                  {isCompleted
                    ? `${round.totalStitches}/${round.totalStitches} ✔️`
                    : isCurrent
                    ? `${currentStitch}/${round.totalStitches}`
                    : `0/${round.totalStitches}`} {/* ✅ Future rounds now always show 0 */}
                </h3>
              </div>

              {/* Stitch Tracker */}
              <div className={`p-4 rounded-lg transition-opacity ${opacityClass}`}>
                <div className="flex flex-wrap justify-start gap-2">
                  {round.stitches.map((stitch, stitchIndex) => (
                    <span
                      key={stitchIndex}
                      onClick={() => handleClick(round.id - 1, stitchIndex)}
                      className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        isCompleted
                          ? "bg-[#725394] text-gray-300 border-[#5a3c74] opacity-50"
                          : isCurrent && stitchIndex === currentStitch
                          ? "bg-[#3d1380] text-white border-[#210a4a]"
                          : "bg-[#8a54c4] text-gray-200 border-[#7359a1]"
                      }`}
                    >
                      {stitch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <p className="mt-6 text-sm opacity-80">
        Press <strong>Space</strong> to move forward, <strong>Backspace</strong> to undo, or{" "}
        <strong>click</strong> a stitch to select it.
      </p>
    </div>
  );
}

export default App;
