"use client";
import { Sprout, Tag, Paintbrush, Camera } from "lucide-react";

const STEPS = [
  { label: "Designar din rabatt", desc: "AI:n väljer växter och placerar dem", Icon: Sprout },
  { label: "Hämtar priser", desc: "Söker bland 7 butiker", Icon: Tag },
  { label: "Skapar visualisering", desc: "Målar din framtida rabatt", Icon: Paintbrush },
];

export default function PlanProgress({ currentStep, hasPhoto }: { currentStep: number; hasPhoto: boolean }) {
  const steps = [...STEPS];
  if (hasPhoto) {
    steps[2] = { label: "Visualiserar din yta", desc: "Placerar växter i ditt foto", Icon: Camera };
  }

  return (
    <div style={{ padding: "48px 0", maxWidth: 480, margin: "0 auto" }}>
      {/* Animated icon */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "var(--cream, #f4f0ea)",
          animation: "pulse 2s ease infinite",
        }}>
          {(() => {
            const StepIcon = steps[Math.min(currentStep, steps.length - 1)]?.Icon;
            return StepIcon ? <StepIcon size={32} strokeWidth={1.5} color="var(--brown, #5a4832)" /> : null;
          })()}
        </div>
      </div>

      {/* Steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, i) => {
          const isActive = i === currentStep;
          const isDone = i < currentStep;
          const isPending = i > currentStep;

          return (
            <div key={i} style={{ display: "flex", gap: 16, alignItems: "flex-start", position: "relative" }}>
              {/* Vertical line */}
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute",
                  left: 15,
                  top: 32,
                  width: 2,
                  height: 40,
                  background: isDone ? "var(--sage, #6a7a5b)" : "var(--border, rgba(107,87,64,0.12))",
                  transition: "background 0.5s",
                }} />
              )}

              {/* Circle indicator */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
                transition: "all 0.5s",
                background: isDone ? "var(--sage, #6a7a5b)" : isActive ? "var(--brown, #5a4832)" : "var(--cream, #f4f0ea)",
                color: isDone || isActive ? "#fff" : "var(--taupe, #9a8e7e)",
                border: isActive ? "none" : isPending ? "2px solid var(--border, rgba(107,87,64,0.12))" : "none",
              }}>
                {isDone ? "✓" : i + 1}
              </div>

              {/* Text */}
              <div style={{ paddingBottom: 28 }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: isActive ? 600 : 400,
                  color: isPending ? "var(--taupe, #9a8e7e)" : "var(--text, #2e2a24)",
                  transition: "all 0.3s",
                }}>
                  {step.label}
                </div>
                <div style={{
                  fontSize: 13,
                  color: "var(--text-light, #5e584e)",
                  opacity: isPending ? 0.5 : 1,
                }}>
                  {step.desc}
                </div>

                {/* Active step loading bar */}
                {isActive && (
                  <div style={{
                    marginTop: 8,
                    height: 3,
                    borderRadius: 3,
                    background: "var(--cream, #f4f0ea)",
                    overflow: "hidden",
                    width: 200,
                  }}>
                    <div style={{
                      height: "100%",
                      borderRadius: 3,
                      background: "var(--brown, #5a4832)",
                      animation: "progress 3s ease-in-out infinite",
                    }} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Estimated time */}
      <div style={{
        textAlign: "center",
        marginTop: 16,
        fontSize: 12,
        color: "var(--taupe, #9a8e7e)",
      }}>
        {currentStep === 0 && "Tar ca 30 sekunder..."}
        {currentStep === 1 && "Nästan klart..."}
        {currentStep === 2 && "Sista steget — tar ca 20 sekunder..."}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.8; }
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 80%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
