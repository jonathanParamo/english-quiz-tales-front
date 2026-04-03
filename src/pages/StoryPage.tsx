import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiFetch from "../api/apiFetch";
import QuestionItem from "./QuestionItem";
import ResultModal from "./ResultModal";
import AudioPlayer from "../assets/audio/AudioPlayer";
import ParticlesBg from "../components/effects/ParticlesBg";

interface Story {
  _id: string;
  title: string;
  text: string;
  audioUrl: string;
  images: string[];
  level: string;
}
interface Question {
  _id: string;
  question: string;
  type: any;
  options?: any[];
  audioUrl?: string;
  selected?: any;
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "#34d399",
  intermediate: "#f59e0b",
  advanced: "#f43f5e",
};
const LEVEL_CODES: Record<string, string> = {
  beginner: "CLASS·A",
  intermediate: "CLASS·B",
  advanced: "CLASS·S",
};

function SectionLabel({
  icon,
  label,
  color,
  extra,
}: {
  icon: string;
  label: string;
  color: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="font-mono text-xs" style={{ color, fontSize: 11 }}>
        {icon}
      </span>
      <span
        className="font-mono text-xs uppercase tracking-widest"
        style={{ color, fontSize: 9 }}
      >
        {label}
      </span>
      <div
        className="flex-1 h-px"
        style={{ background: `linear-gradient(90deg,${color}30,transparent)` }}
      />
      {extra}
    </div>
  );
}

function ProgressRing({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? value / total : 0;
  const r = 20,
    circ = 2 * Math.PI * r;
  return (
    <div className="relative w-12 h-12 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 48 48">
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3"
        />
        <circle
          cx="24"
          cy="24"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${pct * circ} ${circ}`}
          style={{ transition: "stroke-dasharray 0.5s ease" }}
        />
      </svg>
      <span
        className="font-mono font-bold relative z-10"
        style={{ fontSize: 10, color }}
      >
        {value}
      </span>
    </div>
  );
}

function AnimatedQuestion({
  question,
  index,
  onAnswer,
}: {
  question: Question;
  index: number;
  onAnswer: (id: string, val: any) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ans, setAns] = useState(false);

  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) ob.observe(ref.current);
    return () => ob.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translateY(0) scale(1)"
          : "translateY(16px) scale(0.98)",
        transitionDelay: `${Math.min(index * 0.035, 0.25)}s`,
      }}
    >
      {/* Indicador lateral */}
      <div
        className="absolute -left-3 top-4 bottom-4 w-0.5 rounded-full transition-all duration-500"
        style={{ background: ans ? "#34d399" : "rgba(124,92,252,0.25)" }}
      />
      {/* Número */}
      <div
        className="absolute -left-8 top-3 w-5 h-5 rounded flex items-center justify-center"
        style={{
          background: ans ? "rgba(52,211,153,0.12)" : "rgba(124,92,252,0.08)",
          border: `1px solid ${ans ? "rgba(52,211,153,0.25)" : "rgba(124,92,252,0.15)"}`,
          fontSize: 8,
          color: ans ? "#34d399" : "rgba(124,92,252,0.5)",
          fontFamily: "monospace",
          fontWeight: 700,
        }}
      >
        {ans ? "✓" : String(index + 1).padStart(2, "0")}
      </div>
      <QuestionItem
        question={question}
        index={index}
        onAnswer={(id, val) => {
          if (val) setAns(true);
          onAnswer(id, val);
        }}
      />
    </div>
  );
}

export default function StoryPage() {
  const { id: storyId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [story, setStory] = useState<Story | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showStory, setShowStory] = useState(false);
  const [penaltyApplied, setPenaltyApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answered, setAnswered] = useState(0);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [result, setResult] = useState<{
    correct: number;
    incorrect: number;
    totalScore: number;
    generalFeedback: {
      strengths: string;
      improvements: string;
      topicsToStudy: string[];
    };
    details: {
      question: string;
      correct: boolean;
      correctAnswer: string;
      selected: string;
      feedback?: string;
      explanation?: string;
    }[];
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!storyId) return;
    Promise.all([
      apiFetch<Story>(`stories/${storyId}`, { method: "GET" }),
      apiFetch<Question[]>(`questions/${storyId}/random/15`, { method: "GET" }),
    ])
      .then(([sr, qr]) => {
        setStory(sr);
        setQuestions(
          qr.map((q) => {
            let sel = q.selected;
            if (typeof sel === "string") {
              try {
                const p = JSON.parse(sel);
                if (Array.isArray(p)) sel = p;
              } catch {}
            }
            return { ...q, selected: sel || "", type: q.type || "multiple" };
          }),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [storyId]);

  const handleAnswer = (qid: string, val: any) => {
    setAnswers((prev) => {
      if (!prev[qid] && val) setAnswered((a) => a + 1);
      return { ...prev, [qid]: val };
    });
  };

  const submitAnswers = async () => {
    setSubmitting(true);
    try {
      const res = await apiFetch<{
        correct: number;
        incorrect: number;
        totalScore: number;
        generalFeedback: {
          strengths: string;
          improvements: string;
          topicsToStudy: string[];
        };
        details: {
          question: string;
          correct: boolean;
          correctAnswer: string;
          selected: string;
          feedback?: string;
          explanation?: string;
        }[];
      }>("questions/grade", {
        method: "POST",
        body: {
          storyId,
          penalty: penaltyApplied,
          answers: questions.map((q) => {
            let sel = answers[q._id] ?? q.selected;
            if (typeof sel === "string") {
              sel = sel.trim();
              if (!sel || sel.toLowerCase() === "escribe la frase") sel = null;
            }
            return { questionId: q._id, type: q.type, selected: sel };
          }),
        },
      });
      setResult(res);
      setModalOpen(true);
    } catch {
      alert("Error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const lc = LEVEL_COLORS[story?.level ?? "beginner"] ?? "#7c5cfc";
  const lcode = LEVEL_CODES[story?.level ?? "beginner"] ?? "CLASS·?";
  const progress = questions.length > 0 ? answered / questions.length : 0;

  if (loading)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#080810" }}
      >
        <div className="text-center space-y-4">
          <div className="relative w-14 h-14 mx-auto">
            <div
              className="absolute inset-0 rounded-full border border-t-transparent animate-spin"
              style={{
                borderColor: "rgba(124,92,252,0.2)",
                borderTopColor: "#7c5cfc",
              }}
            />
            <div
              className="absolute inset-2 rounded-full border border-b-transparent animate-spin"
              style={{
                borderColor: "rgba(167,139,250,0.1)",
                borderBottomColor: "#a78bfa",
                animationDuration: "0.65s",
                animationDirection: "reverse",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "#7c5cfc", boxShadow: "0 0 8px #7c5cfc" }}
              />
            </div>
          </div>
          <p
            className="font-mono text-xs uppercase tracking-widest animate-pulse"
            style={{ color: "rgba(124,92,252,0.6)", fontSize: 10 }}
          >
            Decrypting mission...
          </p>
        </div>
      </div>
    );

  if (!story)
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: "#080810" }}
      >
        <div className="text-center space-y-3">
          <p
            className="font-mono text-xs"
            style={{ color: "rgba(244,63,94,0.6)", fontSize: 10 }}
          >
            ERR::MISSION_NOT_FOUND
          </p>
          <button
            onClick={() => navigate("/home")}
            className="font-mono text-xs uppercase tracking-widest px-4 py-2 rounded-lg"
            style={{
              color: "#a78bfa",
              border: "1px solid rgba(124,92,252,0.3)",
              background: "rgba(124,92,252,0.08)",
            }}
          >
            ← Return to base
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen relative" style={{ background: "#080810" }}>
      <ParticlesBg />
      <div
        className="sticky top-0 z-40 px-5 py-2.5 flex items-center gap-3"
        style={{
          background: "rgba(8,8,16,0.96)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(124,92,252,0.1)",
        }}
      >
        <button
          onClick={() => navigate("/home")}
          className="font-mono text-xs uppercase tracking-widest transition-all flex items-center gap-1 px-2 py-1 rounded"
          style={{
            color: "rgba(255,255,255,0.25)",
            fontSize: 10,
            border: "1px solid transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#a78bfa";
            e.currentTarget.style.borderColor = "rgba(124,92,252,0.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255,255,255,0.25)";
            e.currentTarget.style.borderColor = "transparent";
          }}
        >
          ← Base
        </button>
        <div
          className="w-px h-4"
          style={{ background: "rgba(255,255,255,0.06)" }}
        />
        {!story.images?.[0] && (
          <h1
            className="font-display font-bold text-white truncate flex-1"
            style={{ fontSize: 14 }}
          >
            {story.title}
          </h1>
        )}
        {story.images?.[0] && <div className="flex-1" />}
        <div className="flex items-center gap-3">
          {questions.length > 0 && (
            <div className="flex items-center gap-2">
              <div
                className="w-20 h-0.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progress * 100}%`,
                    background: `linear-gradient(90deg,#7c5cfc,${lc})`,
                  }}
                />
              </div>
              <span
                className="font-mono text-xs"
                style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}
              >
                {answered}/{questions.length}
              </span>
            </div>
          )}
          <span
            className="font-mono text-xs px-2 py-0.5 rounded"
            style={{
              color: lc,
              background: lc + "12",
              border: `1px solid ${lc}25`,
              fontSize: 9,
            }}
          >
            {story.level.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Contenido */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-7 pb-28">
        {!story.images?.[0] && (
          <div className="pt-2">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: lc, boxShadow: `0 0 5px ${lc}` }}
              />
              <span
                className="font-mono text-xs uppercase"
                style={{ color: lc, fontSize: 9 }}
              >
                {lcode}
              </span>
            </div>
            <h1
              className="font-display font-black text-white"
              style={{ fontSize: 30 }}
            >
              {story.title}
            </h1>
          </div>
        )}

        {/* Audio */}
        {story.audioUrl && (
          <div>
            <SectionLabel icon="◉" label="Mission Audio" color="#7c5cfc" />
            <AudioPlayer
              audioUrl={story.audioUrl}
              title={story.title}
              image={story.images?.[0]}
            />
          </div>
        )}

        {/* Historia */}
        {!showStory ? (
          <div>
            <SectionLabel
              icon="◈"
              label="Story File"
              color="rgba(255,255,255,0.15)"
            />
            <button
              onClick={() => {
                setShowStory(true);
                setPenaltyApplied(true);
              }}
              className="w-full rounded-xl py-5 flex items-center justify-center gap-4 transition-all duration-300 relative overflow-hidden group"
              style={{
                background: "rgba(255,255,255,0.015)",
                border: "1px dashed rgba(124,92,252,0.18)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(124,92,252,0.05)";
                e.currentTarget.style.borderColor = "rgba(124,92,252,0.35)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.015)";
                e.currentTarget.style.borderColor = "rgba(124,92,252,0.18)";
              }}
            >
              <span style={{ fontSize: 20 }}>📖</span>
              <div className="text-left">
                <p
                  className="font-mono text-xs uppercase tracking-widest"
                  style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}
                >
                  Decrypt story file
                </p>
                <p
                  className="font-mono text-xs mt-0.5"
                  style={{ color: "rgba(255,255,255,0.18)", fontSize: 9 }}
                >
                  Read the full narrative
                </p>
              </div>
              <span
                className="ml-auto font-mono text-xs px-2 py-1 rounded"
                style={{
                  color: "rgba(244,63,94,0.65)",
                  background: "rgba(244,63,94,0.07)",
                  border: "1px solid rgba(244,63,94,0.18)",
                  fontSize: 9,
                }}
              >
                −10% SCORE
              </span>
            </button>
          </div>
        ) : (
          <div>
            <SectionLabel
              icon="◈"
              label="Story · Decrypted"
              color="#34d399"
              extra={
                penaltyApplied ? (
                  <span
                    className="font-mono text-xs"
                    style={{ color: "rgba(244,63,94,0.55)", fontSize: 9 }}
                  >
                    PENALTY ACTIVE
                  </span>
                ) : undefined
              }
            />
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(13,13,22,0.88)",
                border: "1px solid rgba(124,92,252,0.1)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div className="p-6">
                {story.images?.slice(1).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    className={`w-2/5 rounded-xl shadow-lg mb-2 ${i % 2 === 0 ? "float-left mr-5 mb-3" : "float-right ml-5 mb-3"}`}
                    style={{ border: `1px solid ${lc}18` }}
                  />
                ))}
                <p
                  className="font-body leading-relaxed text-base
                  first-letter:text-5xl first-letter:font-display first-letter:font-black
                  first-letter:text-accent first-letter:float-left first-letter:mr-2 first-letter:leading-none"
                  style={{ color: "rgba(255,255,255,0.78)" }}
                >
                  {story.text}
                </p>
                <div className="clear-both" />
              </div>
            </div>
          </div>
        )}

        {/* Preguntas */}
        {questions.length > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <ProgressRing
                value={answered}
                total={questions.length}
                color={lc}
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <h2
                    className="font-display font-black text-white"
                    style={{ fontSize: 20 }}
                  >
                    Questions
                  </h2>
                  <span
                    className="font-mono text-xs px-1.5 py-0.5 rounded"
                    style={{
                      color: "rgba(255,255,255,0.25)",
                      background: "rgba(255,255,255,0.04)",
                      fontSize: 9,
                    }}
                  >
                    {questions.length} QST
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="flex-1 h-0.5 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress * 100}%`,
                        background: `linear-gradient(90deg,#7c5cfc,${lc})`,
                      }}
                    />
                  </div>
                  <span
                    className="font-mono text-xs"
                    style={{ color: "rgba(255,255,255,0.2)", fontSize: 9 }}
                  >
                    {Math.round(progress * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="relative pl-10 space-y-4">
              <div
                className="absolute left-4 top-0 bottom-0 w-px"
                style={{
                  background: `linear-gradient(to bottom,${lc}40,rgba(124,92,252,0.1))`,
                }}
              />
              {questions.map((q, i) => (
                <AnimatedQuestion
                  key={q._id}
                  question={q}
                  index={i}
                  onAnswer={handleAnswer}
                />
              ))}
            </div>

            <div className="mt-10 pl-10">
              <button
                onClick={submitAnswers}
                disabled={submitting}
                className="w-full relative overflow-hidden font-display font-black uppercase tracking-widest transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed group"
                style={{
                  background: submitting
                    ? "rgba(124,92,252,0.12)"
                    : "linear-gradient(135deg,#7c5cfc,#5a3fd4)",
                  border: "1px solid rgba(167,139,250,0.2)",
                  borderRadius: 14,
                  padding: "17px",
                  color: "white",
                  fontSize: 14,
                  letterSpacing: "0.12em",
                  boxShadow: submitting
                    ? "none"
                    : "0 0 28px rgba(124,92,252,0.22),0 4px 20px rgba(0,0,0,0.4)",
                }}
              >
                {!submitting && (
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background:
                        "linear-gradient(105deg,transparent 40%,rgba(255,255,255,0.07) 50%,transparent 60%)",
                    }}
                  />
                )}
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{
                    background: `linear-gradient(90deg,transparent,${lc},transparent)`,
                    opacity: 0.4,
                  }}
                />
                {submitting ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="font-mono text-xs tracking-widest">
                      GRADING MISSION...
                    </span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    <span>Complete Mission</span>
                    <span style={{ opacity: 0.6 }}>⟶</span>
                    {answered < questions.length && (
                      <span
                        className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{
                          background: "rgba(244,63,94,0.12)",
                          border: "1px solid rgba(244,63,94,0.2)",
                          color: "rgba(244,63,94,0.75)",
                          fontSize: 9,
                        }}
                      >
                        {questions.length - answered} left
                      </span>
                    )}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {result && (
        <ResultModal
          isOpen={modalOpen}
          correct={result.correct}
          incorrect={result.incorrect}
          totalScore={result.totalScore}
          details={result.details}
          generalFeedback={result.generalFeedback}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Barra inferior */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-2"
        style={{
          background: "rgba(8,8,16,0.96)",
          borderTop: `1px solid ${lc}15`,
        }}
      >
        <span
          className="font-mono text-xs"
          style={{ color: "rgba(124,92,252,0.3)", fontSize: 9 }}
        >
          SYS::MISSION_ACTIVE
        </span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div
              className="w-1 h-1 rounded-full animate-pulse"
              style={{ background: "#34d399", boxShadow: "0 0 4px #34d399" }}
            />
            <span
              className="font-mono text-xs"
              style={{ color: "rgba(52,211,153,0.45)", fontSize: 9 }}
            >
              LIVE
            </span>
          </div>
          <span
            className="font-mono text-xs"
            style={{ color: `${lc}50`, fontSize: 9 }}
          >
            {Math.round(progress * 100)}% COMPLETE
          </span>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
}
