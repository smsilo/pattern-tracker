import React, { useState, useEffect, useCallback, useRef } from "react";

const generatePattern = () => {
  let lines = [];
  for (let i = 1; i <= 30; i++) {
    lines.push(`Round ${i}: (${Math.max(1, Math.floor(i / 3))} sc, inc) x 6`);
    if (i === 3) lines.push(`// Sample note between round 3 and 4`);
    if (i === 10 || i === 20) lines.push(`// Note between round ${i} and ${i + 1}`);
  }
  return lines.join("\n");
};

const getStitchColor = (stitchType) => {
  const colors = {
    sc: '#7a4fd2',    // Original purple
    inc: '#824fd2',   // Slightly lighter purple
    dec: '#724fd2'    // Slightly darker purple
  };
  return colors[stitchType] || '#7a4fd2';
};

const getDarkerColor = (stitchType) => {
  const colors = {
    sc: '#3d1380',    // Darker version of original
    inc: '#421380',   // Darker version of inc
    dec: '#381380'    // Darker version of dec
  };
  return colors[stitchType] || '#3d1380';
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
    const clusterMatch = trimmed.match(/\((.*?)\)\s*x\s*(\d+)/);
    const expanded = trimmed.replace(/\((.*?)\)\s*x\s*(\d+)/g, (_, group, count) =>
      Array(Number(count)).fill(group).join(" ")
    );

    let match;
    let stitches = [];
    let totalStitches = 0;
    let clusters = [];

    if (clusterMatch) {
      const [_, clusterPattern, repeatCount] = clusterMatch;
      const clusterStitches = [];
      let tempRegex = /(\d*)\s*(sc|inc|dec)/g;
      while ((match = tempRegex.exec(clusterPattern)) !== null) {
        const count = match[1] ? parseInt(match[1]) : 1;
        const stitch = match[2];
        clusterStitches.push(...Array(count).fill(stitch));
      }

      for (let i = 0; i < Number(repeatCount); i++) {
        clusters.push({
          number: i + 1,
          stitches: [...clusterStitches]
        });
        stitches.push(...clusterStitches);
        totalStitches += clusterStitches.length;
      }
    } else {
      while ((match = regex.exec(expanded)) !== null) {
        const count = match[1] ? parseInt(match[1]) : 1;
        const stitch = match[2];
        stitches.push(...Array(count).fill(stitch));
        totalStitches += count;
      }
      clusters = [{number: 1, stitches: stitches}];
    }

    return {
      id: roundNumber++,
      isNote: false,
      instruction: null,
      stitches,
      clusters,
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
  const [trackByRound, setTrackByRound] = useState(false);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('patternTrackerSettings');
    return saved ? JSON.parse(saved) : {
      colorCodeStitches: true,
      groupClusters: true
    };
  });
  const currentRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('patternTrackerSettings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    setSteps(parsePattern(pattern));
  }, [pattern]);

  useEffect(() => {
    if (showAll && currentRef.current) {
      currentRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [showAll, index]);

  const current = steps[index];

  const getDisplaySteps = () => {
    if (showAll) return steps;
    const range = trackByRound ? 2 : 1;
    return steps.slice(Math.max(0, index - range), index + range + 1);
  };

  const displaySteps = getDisplaySteps();

  const totalStitches = steps
    .filter((s) => !s.isNote)
    .reduce((sum, step) => sum + step.totalStitches, 0);

  const completedStitches =
    steps
      .slice(0, index)
      .filter((s) => !s.isNote)
      .reduce((sum, step) => sum + step.totalStitches, 0) +
    (!current?.isNote && !trackByRound
      ? Math.min(stitchIndex, current?.stitches.length)
      : 0);

  const startTracker = () => {
    setSteps(parsePattern(pattern));
    setIndex(0);
    setStitchIndex(0);
    setTrackingStarted(true);
    setTrackingPaused(false);
  };

  const pauseTracker = () => setTrackingPaused(true);

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
        if (trackByRound || current.isNote || stitchIndex + 1 >= current.stitches.length) {
          if (index < steps.length - 1) {
            setIndex((i) => i + 1);
            setStitchIndex(0);
          }
        } else {
          setStitchIndex((s) => s + 1);
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        if (trackByRound || current.isNote || stitchIndex === 0) {
          if (index > 0) {
            const prev = steps[index - 1];
            setIndex((i) => i - 1);
            setStitchIndex(trackByRound || prev.isNote ? 0 : prev.stitches.length - 1);
          }
        } else {
          setStitchIndex((s) => s - 1);
        }
      }
    },
    [trackingStarted, trackingPaused, current, index, stitchIndex, steps, trackByRound]
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

  const renderStatusIcon = (stepIndex) => {
    const isCompleted = stepIndex < index;
    const isCurrent = stepIndex === index;
    return (
      <div className="w-5 h-5 mr-3 flex items-center justify-center">
        {isCompleted ? (
          <div className="w-4 h-4 rounded-full border border-white text-white text-xs flex items-center justify-center">
            ✓
          </div>
        ) : isCurrent ? (
          <div className="w-4 h-4 rounded-full bg-white opacity-70" />
        ) : (
          <div className="w-4 h-4 rounded-full border border-white" />
        )}
      </div>
    );
  };

  const getStitchColor = (stitchType) => {
    if (!settings.colorCodeStitches) return '#7a4fd2';
    const colors = {
      sc: '#7a4fd2',    // Original purple
      inc: '#8e4fd2',   // Slightly pink-purple for increases
      dec: '#724fd2'    // Slightly darker purple
    };
    return colors[stitchType] || '#7a4fd2';
  };

  const getDarkerColor = (stitchType) => {
    if (!settings.colorCodeStitches) return '#3d1380';
    const colors = {
      sc: '#3d1380',    // Darker version of original
      inc: '#451380',   // Darker version of pink-purple
      dec: '#381380'    // Darker version of dec
    };
    return colors[stitchType] || '#3d1380';
  };

  const toggleSetting = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const SettingsMenu = () => {
    const isDisabled = !trackingStarted || trackingPaused;
    const disabledMessage = trackingPaused 
      ? "Resume the tracker to adjust display settings"
      : "Start the tracker to customize how your pattern is displayed";
    
    return (
    <div className={`flex flex-col gap-1.5 ${isDisabled ? 'opacity-50' : ''}`}>
      <button
        onClick={() => !isDisabled && toggleSetting('colorCodeStitches')}
        className={`group flex items-center justify-between w-full px-3 py-1.5 rounded-md transition-colors ${
          !isDisabled && 'hover:bg-white hover:bg-opacity-5'
        } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        title={isDisabled ? disabledMessage : "Use different colors for each stitch type"}
        disabled={isDisabled}
      >
        <span className="text-sm text-white text-opacity-80 group-hover:text-opacity-100">
          Color Code
        </span>
        <div className={`w-7 h-7 rounded-lg transition-all border border-white border-opacity-10 ${
          settings.colorCodeStitches && !isDisabled
            ? 'bg-[#824fd2] shadow-[0_0_12px_rgba(130,79,210,0.3)]'
            : 'bg-white bg-opacity-5'
        }`}>
          <svg 
            viewBox="0 0 24 24" 
            className={`w-full h-full p-1.5 transition-opacity ${
              settings.colorCodeStitches && !isDisabled ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <path 
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" 
              fill="white"
            />
          </svg>
        </div>
      </button>

      <button
        onClick={() => !isDisabled && toggleSetting('groupClusters')}
        className={`group flex items-center justify-between w-full px-3 py-1.5 rounded-md transition-colors ${
          !isDisabled && 'hover:bg-white hover:bg-opacity-5'
        } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        title={isDisabled ? disabledMessage : "Group repeated stitch patterns together"}
        disabled={isDisabled}
      >
        <span className="text-sm text-white text-opacity-80 group-hover:text-opacity-100">
          Group Clusters
        </span>
        <div className={`w-7 h-7 rounded-lg transition-all border border-white border-opacity-10 ${
          settings.groupClusters && !isDisabled
            ? 'bg-[#824fd2] shadow-[0_0_12px_rgba(130,79,210,0.3)]'
            : 'bg-white bg-opacity-5'
        }`}>
          <svg 
            viewBox="0 0 24 24" 
            className={`w-full h-full p-1.5 transition-opacity ${
              settings.groupClusters && !isDisabled ? 'opacity-100' : 'opacity-30'
            }`}
          >
            <path 
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" 
              fill="white"
            />
          </svg>
        </div>
      </button>
    </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#8a54c4] via-[#935ef9] to-[#b35ccc] text-white p-6">
      <div className="w-full px-6 mb-8">
        <h1 className="text-3xl font-bold">Crochet Pattern Tracker</h1>
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
          <button onClick={startTracker} className="bg-[#7a4fd2] px-4 py-2 rounded-lg flex items-center">
            <Icon type="play" />
            Start Tracker
          </button>
        )}

        {trackingStarted && !trackingPaused && (
          <button onClick={pauseTracker} className="bg-[#7a4fd2] px-4 py-2 rounded-lg flex items-center">
            <Icon type="pause" />
            Pause Tracker
          </button>
        )}

        {trackingStarted && trackingPaused && (
          <>
            <button onClick={resumeTracker} className="bg-[#7a4fd2] px-4 py-2 rounded-lg flex items-center">
              <Icon type="play" />
              Resume Tracker
            </button>
            <button onClick={startTracker} className="bg-[#7a4fd2] px-4 py-2 rounded-lg flex items-center">
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

        <button
          disabled={!trackingStarted || trackingPaused}
          onClick={() => setTrackByRound((prev) => !prev)}
          className={`px-4 py-2 rounded-lg ${
            trackingStarted && !trackingPaused
              ? "bg-[#7a4fd2]"
              : "bg-[#7a4fd2] opacity-40 cursor-not-allowed"
          }`}
        >
          {trackByRound ? "Track Stitches" : "Track Rounds"}
        </button>
      </div>

      <div className="fixed right-6 top-32">
        <div className="bg-[#8a54c4] rounded-lg shadow-lg overflow-hidden w-56">
          <div className="px-4 py-3 border-b border-white border-opacity-10">
            <span className="text-xs text-white text-opacity-60">Total Progress</span>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="font-semibold whitespace-nowrap">{completedStitches} / {totalStitches}</span>
              <div className="flex-1 bg-white bg-opacity-10 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-300" 
                  style={{ width: `${(completedStitches / totalStitches) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="px-4 py-3">
            <span className="text-xs text-white text-opacity-60 block mb-1.5">Display Options</span>
            <SettingsMenu />
          </div>
        </div>
      </div>

      {trackingStarted && trackingPaused && (
        <div className="text-sm bg-white bg-opacity-10 text-center text-white py-2 rounded-md mb-4 w-[70%]">
          🧵 Tracker is paused. Click <strong>Resume</strong> or <strong>Restart</strong> to continue.
        </div>
      )}

      <div className={`w-[70%] ${trackByRound ? "space-y-3" : "space-y-6"}`}>
        {displaySteps.map((step, i) => {
          const stepIndex = steps.indexOf(step);
          const isCurrent = stepIndex === index;
          const ref = isCurrent && showAll ? currentRef : null;

          const roundClass = isCurrent
            ? "bg-[#5b1eb8] scale-[1.02] transition-all duration-500 ease-in-out"
            : "bg-[#8a54c4] opacity-50";

          return (
            <div key={step.id} className="space-y-2 relative">
              <div
                ref={ref}
                onClick={() => handleClick(stepIndex, 0)}
                className={`flex items-center px-4 py-2 rounded-lg cursor-pointer ${roundClass}`}
              >
                {renderStatusIcon(stepIndex)}
                <div className="flex justify-between w-full items-center">
                  <h3 className="text-md font-bold">
                    {step.isNote
                      ? `📌 ${step.instruction}`
                      : `Round ${step.id}: ${
                          step.raw.match(/\(.*?\) x \d+/)?.[0] || step.raw
                        } [${step.totalStitches}]`}
                  </h3>
                  {!step.isNote && (
                    <h3 className="text-md font-bold">
                      {trackByRound
                        ? `${step.totalStitches}`
                        : isCurrent
                        ? `${Math.min(stitchIndex, step.stitches.length)}/${step.totalStitches}`
                        : `${step.stitches.length}/${step.totalStitches}`}
                    </h3>
                  )}
                </div>
              </div>

              {!step.isNote && !trackByRound && (
                <div className={`p-4 rounded-lg ${isCurrent ? "opacity-100" : "opacity-50"}`}>
                  <div className={`flex flex-wrap ${settings.groupClusters ? 'gap-4' : 'gap-2'}`}>
                    {settings.groupClusters ? (
                      step.clusters.map((cluster, clusterIndex) => (
                        <div 
                          key={clusterIndex}
                          className="relative flex flex-wrap gap-2 bg-[#ffffff08] rounded-lg p-3 pr-8"
                        >
                          {cluster.stitches.map((s, si) => {
                            const globalStitchIndex = cluster.stitches.slice(0, si).length + 
                              step.clusters.slice(0, clusterIndex).reduce((acc, c) => acc + c.stitches.length, 0);
                            return (
                              <span
                                key={si}
                                onClick={() => handleClick(stepIndex, globalStitchIndex)}
                                className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                                  isCurrent && globalStitchIndex === stitchIndex
                                    ? "text-white border-[#210a4a]"
                                    : "text-gray-200 border-[#7359a1]"
                                }`}
                                style={{
                                  backgroundColor: isCurrent && globalStitchIndex === stitchIndex 
                                    ? getDarkerColor(s)
                                    : getStitchColor(s)
                                }}
                              >
                                {s}
                              </span>
                            );
                          })}
                          <span className="absolute top-1 right-1 text-xs text-gray-400 opacity-60">
                            {cluster.number}
                          </span>
                        </div>
                      ))
                    ) : (
                      step.stitches.map((s, si) => (
                        <span
                          key={si}
                          onClick={() => handleClick(stepIndex, si)}
                          className={`px-3 py-2 border rounded-lg cursor-pointer transition-colors ${
                            isCurrent && si === stitchIndex
                              ? "text-white border-[#210a4a]"
                              : "text-gray-200 border-[#7359a1]"
                          }`}
                          style={{
                            backgroundColor: isCurrent && si === stitchIndex 
                              ? getDarkerColor(s)
                              : getStitchColor(s)
                          }}
                        >
                          {s}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}
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