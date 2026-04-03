import { useState } from "react";
import CelebrationEffect from "../components/effects/CelebrationEffect";
import { useNavigate } from "react-router-dom";

interface Props {
  isOpen: boolean;
  correct: number;
  incorrect: number;
  totalScore: number;
  details?: AnswerDetail[];
  generalFeedback?: GeneralFeedback;
  onClose: () => void;
}

interface AnswerDetail {
  question: string;
  correct: boolean;
  correctAnswer: string;
  selected: string;
  feedback?: string;
  explanation?: string;
}
interface GeneralFeedback {
  strengths: string;
  improvements: string;
  topicsToStudy: string[];
}

export default function ResultModal({
  isOpen,
  correct,
  incorrect,
  totalScore,
  details,
  generalFeedback,
  onClose,
}: Props) {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const total = correct + incorrect;
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  const circumference = 2 * Math.PI * 38; // r=38
  const dashOffset = circumference * (1 - pct / 100);
  const [showMistakes, setShowMistakes] = useState(false);
  const mistakes = (details ?? []).filter((d) => !d.correct);

  const grade =
    pct >= 90
      ? { label: "Excellent Fate", cls: "text-gold", ring: "#f59e0b" }
      : pct >= 70
        ? { label: "Great Journey", cls: "text-mint", ring: "#34d399" }
        : pct >= 50
          ? { label: "Good Try", cls: "text-accent", ring: "#7c5cfc" }
          : { label: "Keep Going", cls: "text-rose", ring: "#f87171" };

  return (
    <>
      <CelebrationEffect score={pct} active={isOpen} />

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal gótico */}
        <div
          className="relative w-full max-w-sm animate-slide-up"
          style={{
            background:
              "linear-gradient(160deg, #12101a 0%, #0d0b14 60%, #110d1a 100%)",
            border: "1px solid rgba(124,92,252,0.35)",
            borderRadius: "4px",
          }}
        >
          {/* Ornamentos de esquina */}
          {["tl", "tr", "bl", "br"].map((pos) => (
            <CornerOrnament key={pos} position={pos} />
          ))}

          {/* Header */}
          <div className="pt-7 px-7 pb-0 text-center">
            <span
              className={`inline-block text-xs tracking-widest uppercase px-3 py-1 mb-3 ${grade.cls}`}
              style={{
                fontFamily: "serif",
                border: `1px solid currentColor`,
                borderRadius: "2px",
                opacity: 0.9,
              }}
            >
              {grade.label}
            </span>
            <h2
              className="text-white text-xl font-bold tracking-widest mb-1"
              style={{ fontFamily: "serif", letterSpacing: "0.15em" }}
            >
              Arcane Results
            </h2>
            <p className="text-xs italic mb-3" style={{ color: "#6b5a8a" }}>
              The tome reveals your fate
            </p>
          </div>

          {/* Divider */}
          <RuneDivider symbol="✦ ᚱ ✦" />

          {/* Score ring */}
          <div className="flex justify-center py-4">
            <div className="relative w-28 h-28">
              <svg
                className="w-full h-full"
                style={{ transform: "rotate(-90deg)" }}
                viewBox="0 0 100 100"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="rgba(58,42,90,0.5)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={grade.ring}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={dashOffset}
                  style={{ transition: "stroke-dashoffset 1s ease-out" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-white font-bold text-2xl"
                  style={{ fontFamily: "serif" }}
                >
                  {pct}%
                </span>
                <span
                  className="text-xs tracking-widest"
                  style={{ color: "#6b5a8a", fontStyle: "italic" }}
                >
                  verum
                </span>
              </div>
            </div>
          </div>

          {/* Divider 2 */}
          <RuneDivider symbol="— ᚷ ᚨ ᛚ —" dim />

          {/* Stats */}
          <div className="px-6 pb-4 flex flex-col gap-2">
            <StatRow
              color="#34d399"
              label="Correct"
              value={correct}
              symbol="⬥"
            />
            <StatRow
              color="#f87171"
              label="Incorrect"
              value={incorrect}
              symbol="⬦"
            />
            <StatRow
              color="#f59e0b"
              label="Points earned"
              value={totalScore}
              symbol="◈"
            />
          </div>

          <RuneDivider symbol="✦ ✦ ✦" dim />

          {generalFeedback && (
            <div
              style={{
                margin: "0 22px 8px",
                padding: "9px 12px",
                background: "rgba(124,92,252,0.06)",
                border: "0.5px solid rgba(124,92,252,0.25)",
                borderLeft: "2px solid rgba(124,92,252,0.5)",
                borderRadius: "2px",
              }}
            >
              <p
                style={{
                  fontFamily: "serif",
                  fontSize: 9,
                  letterSpacing: "2px",
                  color: "#7c5cfc",
                  textTransform: "uppercase",
                  margin: "0 0 4px",
                }}
              >
                ✦ Arcane Counsel
              </p>
              <p
                style={{
                  fontFamily: "serif",
                  fontStyle: "italic",
                  fontSize: 12,
                  color: "#9a8ab0",
                  margin: 0,
                }}
              >
                {generalFeedback.improvements}
              </p>
            </div>
          )}

          {/* Divider 3 */}
          <RuneDivider symbol="✦ ✦ ✦" dim />

          {mistakes.length > 0 && (
            <>
              <button
                onClick={() => setShowMistakes((p) => !p)}
                style={{
                  margin: "0 22px 8px",
                  padding: "8px 14px",
                  width: "calc(100% - 44px)",
                  background: "rgba(124,92,252,0.07)",
                  border: "0.5px solid rgba(124,92,252,0.3)",
                  borderRadius: "2px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontFamily: "serif",
                    fontSize: 10,
                    letterSpacing: "2px",
                    color: "#a78bfa",
                    textTransform: "uppercase",
                  }}
                >
                  ⬦ Review mistakes ({mistakes.length})
                </span>
                <span
                  style={{
                    color: "#7c5cfc",
                    transform: showMistakes ? "rotate(180deg)" : "none",
                    transition: "transform 0.3s",
                  }}
                >
                  ▼
                </span>
              </button>

              {showMistakes && (
                <div
                  style={{
                    margin: "0 22px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    maxHeight: 320,
                    overflowY: "auto",
                  }}
                >
                  {mistakes.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        border: "0.5px solid rgba(248,113,113,0.2)",
                        background: "rgba(248,113,113,0.03)",
                        borderLeft: "2px solid rgba(248,113,113,0.5)",
                        borderRadius: "2px",
                        padding: "10px 12px",
                      }}
                    >
                      <p
                        style={{
                          fontFamily: "serif",
                          fontStyle: "italic",
                          fontSize: 12,
                          color: "#9a8ab0",
                          margin: "0 0 6px",
                        }}
                      >
                        "{m.question}"
                      </p>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                          marginBottom: 7,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "serif",
                            fontSize: 11,
                            color: "#f87171",
                          }}
                        >
                          ✗ {m.selected}
                        </span>
                        <span
                          style={{
                            fontFamily: "serif",
                            fontSize: 11,
                            color: "#34d399",
                          }}
                        >
                          ✓ {m.correctAnswer}
                        </span>
                      </div>
                      <div
                        style={{
                          height: "0.5px",
                          background: "rgba(124,92,252,0.15)",
                          margin: "6px 0",
                        }}
                      />
                      {m.feedback && (
                        <p
                          style={{
                            fontFamily: "serif",
                            fontStyle: "italic",
                            fontSize: 12,
                            color: "#c4b5fd",
                            margin: "0 0 4px",
                          }}
                        >
                          "{m.feedback}"
                        </p>
                      )}
                      {m.explanation && (
                        <p
                          style={{
                            fontFamily: "serif",
                            fontSize: 11,
                            color: "#6b5a8a",
                            margin: 0,
                          }}
                        >
                          {m.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <RuneDivider symbol="✦ ✦ ✦" dim />

          {/* Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => {
                onClose();
                navigate("/home");
              }}
              className="flex-1 py-3 text-xs tracking-wider transition"
              style={{
                fontFamily: "serif",
                background: "transparent",
                border: "0.5px solid rgba(107,90,138,0.4)",
                borderRadius: "2px",
                color: "#6b5a8a",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLButtonElement).style.color = "#a78bfa";
                (e.target as HTMLButtonElement).style.borderColor =
                  "rgba(124,92,252,0.6)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLButtonElement).style.color = "#6b5a8a";
                (e.target as HTMLButtonElement).style.borderColor =
                  "rgba(107,90,138,0.4)";
              }}
            >
              Return
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-3 text-xs tracking-wider transition"
              style={{
                fontFamily: "serif",
                background: "rgba(124,92,252,0.12)",
                border: "0.5px solid rgba(124,92,252,0.5)",
                borderRadius: "2px",
                color: "#c4b5fd",
              }}
            >
              Try Again ᚱ
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Sub-componentes ───────────────────────────────────────────────────────
function CornerOrnament({ position }: { position: string }) {
  const transforms: Record<string, string> = {
    tl: "",
    tr: "scaleX(-1)",
    bl: "scaleY(-1)",
    br: "scale(-1)",
  };
  const positions: Record<string, React.CSSProperties> = {
    tl: { top: 8, left: 8 },
    tr: { top: 8, right: 8 },
    bl: { bottom: 8, left: 8 },
    br: { bottom: 8, right: 8 },
  };
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      style={{
        position: "absolute",
        width: 28,
        height: 28,
        opacity: 0.55,
        transform: transforms[position],
        ...positions[position],
      }}
    >
      <path d="M2 26 L2 2 L26 2" stroke="#7c5cfc" strokeWidth="1" />
      <path
        d="M2 14 L7 14 M14 2 L14 7"
        stroke="#7c5cfc"
        strokeWidth="0.7"
        opacity="0.5"
      />
      <circle cx="2" cy="2" r="1.5" fill="#7c5cfc" />
    </svg>
  );
}

function RuneDivider({ symbol, dim }: { symbol: string; dim?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "0 28px",
        padding: "8px 0",
      }}
    >
      <div
        style={{
          flex: 1,
          height: "0.5px",
          background:
            "linear-gradient(90deg, transparent, rgba(124,92,252,0.3), transparent)",
        }}
      />
      <span
        style={{
          fontSize: 12,
          letterSpacing: 4,
          color: dim ? "#4a3870" : "#7c5cfc",
          opacity: dim ? 0.6 : 0.8,
        }}
      >
        {symbol}
      </span>
      <div
        style={{
          flex: 1,
          height: "0.5px",
          background:
            "linear-gradient(90deg, transparent, rgba(124,92,252,0.3), transparent)",
        }}
      />
    </div>
  );
}

function StatRow({
  color,
  label,
  value,
  symbol,
}: {
  color: string;
  label: string;
  value: number;
  symbol: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        border: `0.5px solid ${color}33`,
        background: `${color}08`,
        borderRadius: "2px",
        position: "relative",
        borderLeft: `2px solid ${color}80`,
      }}
    >
      <span style={{ color, fontSize: 13, fontStyle: "italic", opacity: 0.85 }}>
        <span style={{ marginRight: 6, opacity: 0.5 }}>{symbol}</span>
        {label}
      </span>
      <span
        style={{ color, fontFamily: "serif", fontSize: 18, fontWeight: 600 }}
      >
        {value}
      </span>
    </div>
  );
}
