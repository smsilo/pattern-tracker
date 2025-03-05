import { useState, useEffect } from "react";

const parsePattern = (pattern) => {
  const regex = /(\d*)\s*(sc|inc|dec)/g;
  let stitches = [];

  pattern.replace(/\((.*?)\)\s*x\s*(\d+)/g, (_, group, repeat) => {
    const expanded = Array(Number(repeat)).fill(group).join(" ");
    pattern = pattern.replace(`(${group}) x ${repeat}`, expanded);
  });

  let match;
  while ((match = regex.exec(pattern)) !== null) {
    const count = match[1] ? parseInt(match[1]) : 1;
    const stitch = match[2];
    stitches.push(...Array(count).fill(stitch));
  }
  return stitches;
};

function App() {
  const [pattern, setPattern] = useState("(2 sc, inc) x 6");
  const [stitches, setStitches] = useState(parsePattern(pattern));
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setStitches(parsePattern(pattern));
    setCurrentIndex(0);
  }, [pattern]);

  const handleKeyPress = (event) => {
    if (event.key === " ") {
      setCurrentIndex((prev) => Math.min(prev + 1, stitches.length - 1));
    } else if (event.key === "Backspace") {
      setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Crochet Pattern Tracker</h1>
      <textarea
        className="w-96 p-2 mb-4 text-black"
        rows="2"
        value={pattern}
        onChange={(e) => setPattern(e.target.value)}
      />
      <div className="flex flex-wrap justify-center gap-2">
        {stitches.map((stitch, index) => (
          <span
            key={index}
            className={`px-3 py-2 border rounded-lg ${
              index === currentIndex ? "bg-blue-500" : "bg-gray-700"
            }`}
          >
            {stitch}
          </span>
        ))}
      </div>
      <p className="mt-4 text-sm opacity-80">
        Press <strong>Space</strong> to move forward, <strong>Backspace</strong> to undo.
      </p>
    </div>
  );
}

export default App;
