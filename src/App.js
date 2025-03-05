import { useState, useEffect } from "react";

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
      id: roundIndex,
      stitches,
      totalStitches,
      formattedPattern,
    };
  });
};

function App() {
  const [pattern, setPattern] = useState(generatePattern());
  const [rounds, setRounds] = useState(parsePattern(pattern));
  const [currentRound, setCurrentRound] = useState(0);
  const [currentStitch, setCurrentStitch] = useState(0);
  const [showAllRounds, setShowAllRounds] = useState(false);

  useEffect(() => {
    const parsedRounds = parsePattern(pattern);
    setRounds(parsedRounds);
    setCurrentRound(0);
    setCurrentStitch(0);
  }, [pattern]);

  const totalStitches = rounds.reduce((acc, round) => acc + round.totalStitches, 0);
  const totalCompleted = rounds
    .slice(0, currentRound)
    .reduce((acc, round) => acc + round.totalStitches, 0) + currentStitch;

  const handleKeyPress = (event) => {
    if (event.key === " ") {
      event.preventDefault(); // Prevents unwanted scrolling
      setCurrentStitch((prev) => {
        const nextStitch = prev + 1;
        if (nextStitch >= rounds[currentRound].stitches.length) {
          if (currentRound + 1 < rounds.length) {
            setCurrentRound((prevRound) => prevRound + 1);
            return 0;
          }
        }
        return nextStitch;
      });
    } else if (event.key === "Backspace") {
      event.preventDefault(); // Prevents unwanted scrolling
      setCurrentStitch((prev) => Math.max(prev - 1, 0));
    }
  };

  const handleClick = (roundIndex, stitchIndex) => {
    setCurrentRound(roundIndex);
    setCurrentStitch(stitchIndex);
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

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
        {rounds.map((round, roundIndex) => {
          if (!showAllRounds && (roundIndex < currentRound - 1 || roundIndex > currentRound + 1)) {
            return null; // Hide rounds except the previous, current, and next
          }

          const isCompleted = roundIndex < currentRound;
          const isCurrent = roundIndex === currentRound;

          return (
            <div key={roundIndex} className="space-y-2">
              {/* Round Title & Counter */}
              <div
                className={`flex justify-between items-center px-4 py-2 rounded-lg transition-opacity ${
                  isCompleted ? "bg-green-600 opacity-50" : isCurrent ? "bg-[#5b1eb8]" : "bg-[#8a54c4]"
                }`}
              >
                <h3 className="text-md font-bold flex items-center">
                  Round {roundIndex + 1}: {round.formattedPattern} [{round.totalStitches}]
                  {isCompleted && <span className="ml-2">✔️</span>}
                </h3>
                <h3 className={`text-md font-bold ${isCompleted ? "opacity-50" : ""}`}>
                  {isCompleted
                    ? `${round.totalStitches}/${round.totalStitches}`
                    : isCurrent
                    ? `${currentStitch}/${round.totalStitches}`
                    : ""}
                </h3>
              </div>

              {/* Stitch Tracker */}
              <div className={`p-4 rounded-lg transition-opacity ${isCompleted ? "opacity-50" : "opacity-100"}`}>
                <div className="flex flex-wrap justify-start gap-2">
                  {round.stitches.map((stitch, stitchIndex) => (
                    <span
                      key={stitchIndex}
                      onClick={() => handleClick(roundIndex, stitchIndex)}
                      className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                        isCompleted
                          ? "bg-green-700 text-white border-green-500"
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
