import React, { useState, useRef } from "react";

const CYAN = "#00ffb4";
const BLUE = "#00b4ff";
const RED = "#ff4466";
const DARK = "rgba(5,6,12,0.88)";
const BORDER = "rgba(0,255,180,0.15)";
const FONT_MONO = "'Share Tech Mono', monospace";
const FONT_MAIN = "'Rajdhani', sans-serif";

export function LoadingOverlay({ pct }: { pct: number }) {
  const hidden = pct >= 100;
  return React.createElement(
    "div",
    {
      id: "loader",
      className: hidden ? "hidden" : "",
      style: { transition: "opacity 0.8s, visibility 0.8s" },
    },
    React.createElement(
      "div",
      {
        style: {
          fontFamily: FONT_MAIN,
          fontSize: 11,
          letterSpacing: 8,
          color: "rgba(0,255,180,0.5)",
          textTransform: "uppercase",
          marginBottom: 4,
        },
      },
      "3D Character Studio",
    ),
    React.createElement(
      "div",
      {
        style: {
          width: 220,
          height: 1,
          background: "rgba(255,255,255,0.08)",
          marginBottom: 12,
        },
      },
      React.createElement("div", {
        style: {
          height: "100%",
          width: pct + "%",
          background: `linear-gradient(90deg, ${CYAN}, ${BLUE})`,
          transition: "width 0.4s",
          boxShadow: `0 0 10px ${CYAN}`,
        },
      }),
    ),
    React.createElement(
      "div",
      {
        style: {
          fontFamily: FONT_MONO,
          fontSize: 11,
          color: "rgba(0,255,180,0.4)",
          letterSpacing: 2,
        },
      },
      `${Math.round(pct)}%`,
    ),
  );
}

// ═══ KEYBOARD KEY ══════════════════════════════════════════
function Key({
  label,
  active,
  size = 36,
}: {
  label: string;
  active: boolean;
  size?: number;
}) {
  return React.createElement(
    "div",
    {
      style: {
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "rgba(0,255,180,0.2)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${active ? CYAN : "rgba(255,255,255,0.1)"}`,
        borderRadius: 6,
        color: active ? CYAN : "rgba(255,255,255,0.4)",
        fontFamily: FONT_MONO,
        fontSize: 11,
        fontWeight: 700,
        transition: "all 0.08s",
        boxShadow: active ? `0 0 8px ${CYAN}44` : "none",
        userSelect: "none",
      },
    },
    label,
  );
}

// ═══ WASD CONTROL DISPLAY ══════════════════════════════════
export function WASDDisplay({ keys }: { keys: Record<string, boolean> }) {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      },
    },
    // W row
    React.createElement(
      "div",
      { style: { display: "flex", gap: 4 } },
      React.createElement(Key, { label: "W", active: !!keys["KeyW"] }),
    ),
    // A S D row
    React.createElement(
      "div",
      { style: { display: "flex", gap: 4 } },
      React.createElement(Key, { label: "A", active: !!keys["KeyA"] }),
      React.createElement(Key, { label: "S", active: !!keys["KeyS"] }),
      React.createElement(Key, { label: "D", active: !!keys["KeyD"] }),
    ),
    // Space & Shift
    React.createElement(
      "div",
      { style: { display: "flex", gap: 4, marginTop: 4 } },
      React.createElement(Key, {
        label: "SHIFT",
        active: !!(keys["ShiftLeft"] || keys["ShiftRight"]),
        size: 52,
      }),
      React.createElement(Key, {
        label: "SPACE",
        active: !!keys["Space"],
        size: 52,
      }),
    ),
  );
}

// ═══ EMOTE BUTTON ══════════════════════════════════════════
function EmoteBtn({
  icon,
  name,
  keyLabel,
  active,
  onClick,
}: {
  icon: string;
  name: string;
  keyLabel: string;
  active: boolean;
  onClick: () => void;
}) {
  return React.createElement(
    "button",
    {
      onClick,
      style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        background: active ? "rgba(0,255,180,0.15)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${active ? CYAN : "rgba(255,255,255,0.08)"}`,
        borderRadius: 8,
        padding: "8px 10px",
        cursor: "pointer",
        transition: "all 0.12s",
        color: "white",
        minWidth: 58,
        boxShadow: active ? `0 0 12px ${CYAN}33` : "none",
      },
    },
    React.createElement("span", { style: { fontSize: 18 } }, icon),
    React.createElement(
      "span",
      {
        style: {
          fontFamily: FONT_MAIN,
          fontSize: 10,
          fontWeight: 600,
          color: "rgba(255,255,255,0.6)",
          letterSpacing: 1,
        },
      },
      name,
    ),
    React.createElement(
      "span",
      {
        style: {
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: active ? CYAN : "rgba(255,255,255,0.25)",
        },
      },
      `[${keyLabel}]`,
    ),
  );
}

type EmoteKey = {
  key: string;
  icon: string;
  name: string;
  label: string;
  anim: string;
};
// ═══ EMOTE BUTTON ══════════════════════════════════════════

// ═══ EMOTE PANEL ═══════════════════════════════════════════
export function EmotePanel({
  emoteKeys,
  currentAnim,
  onEmote,
}: {
  emoteKeys: EmoteKey[];
  currentAnim: string;
  onEmote: (anim: string) => void;
}) {
  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        justifyContent: "center",
        maxWidth: 440,
      },
    },
    emoteKeys.map((ek) =>
      React.createElement(EmoteBtn, {
        key: ek.key,
        icon: ek.icon,
        name: ek.name,
        keyLabel: ek.label,
        active: currentAnim === ek.anim,
        onClick: () => onEmote(ek.anim),
      }),
    ),
  );
}

// ═══ STAT LINE ═════════════════════════════════════════════
function StatLine({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color?: string;
}) {
  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
      },
    },
    React.createElement(
      "span",
      {
        style: {
          fontFamily: FONT_MAIN,
          fontSize: 10,
          letterSpacing: 2,
          color: "rgba(255,255,255,0.3)",
          textTransform: "uppercase",
        },
      },
      label,
    ),
    React.createElement(
      "span",
      { style: { fontFamily: FONT_MONO, fontSize: 11, color: color || CYAN } },
      value,
    ),
  );
}

// ═══ TOP LEFT INFO PANEL ═══════════════════════════════════
export function InfoPanel({
  state,
}: {
  state: {
    currentAnim: string;
    onGround: boolean;
    position?: { x: number; y: number; z: number };
  };
}) {
  const animColor = state.currentAnim?.includes("dance")
    ? "#ff88ff"
    : state.currentAnim === "run"
      ? RED
      : state.currentAnim === "jump"
        ? BLUE
        : CYAN;

  return React.createElement(
    "div",
    {
      style: {
        position: "fixed",
        top: 20,
        left: 20,
        background: DARK,
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        padding: "12px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        backdropFilter: "blur(12px)",
        minWidth: 160,
      },
    },
    React.createElement(
      "div",
      {
        style: {
          fontFamily: FONT_MAIN,
          fontSize: 11,
          letterSpacing: 4,
          color: "rgba(0,255,180,0.4)",
          textTransform: "uppercase",
          marginBottom: 4,
          borderBottom: `1px solid ${BORDER}`,
          paddingBottom: 8,
        },
      },
      "Character",
    ),

    React.createElement(StatLine, {
      label: "State",
      value: (state.currentAnim || "idle").toUpperCase(),
      color: animColor,
    }),
    state.position &&
      React.createElement(StatLine, {
        label: "Pos",
        value: `${state.position.x} / ${state.position.y} / ${state.position.z}`,
        color: "rgba(255,255,255,0.5)",
      }),
    React.createElement(StatLine, {
      label: "Ground",
      value: state.onGround ? "YES" : "NO",
      color: state.onGround ? CYAN : BLUE,
    }),
  );
}

// ═══ TOP RIGHT — Controls reference ════════════════════════
export function ControlsHelp() {
  const [open, setOpen] = useState(false);

  return React.createElement(
    "div",
    {
      style: { position: "fixed", top: 20, right: 20 },
    },
    // Toggle button
    React.createElement(
      "button",
      {
        onClick: () => setOpen((o) => !o),
        style: {
          background: DARK,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          color: "rgba(255,255,255,0.5)",
          fontFamily: FONT_MONO,
          fontSize: 11,
          padding: "6px 12px",
          cursor: "pointer",
          letterSpacing: 2,
          backdropFilter: "blur(10px)",
        },
      },
      open ? "✕ CLOSE" : "? HELP",
    ),

    // Panel
    open &&
      React.createElement(
        "div",
        {
          style: {
            marginTop: 8,
            background: DARK,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: "14px 18px",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            gap: 6,
            minWidth: 220,
          },
        },
        React.createElement(
          "div",
          {
            style: {
              fontFamily: FONT_MAIN,
              fontSize: 10,
              letterSpacing: 3,
              color: "rgba(255,255,255,0.3)",
              marginBottom: 4,
              textTransform: "uppercase",
            },
          },
          "Controls",
        ),

        ...[
          ["WASD / ↑↓←→", "Move", CYAN],
          ["SHIFT", "Run", CYAN],
          ["SPACE", "Jump", BLUE],
          ["Left click drag", "Rotate camera", "rgba(255,255,255,0.5)"],
          ["Scroll / Pinch", "Zoom", "rgba(255,255,255,0.5)"],
          ["B", "Dance 1", "#ff88ff"],
          ["G", "Dance 2", "#ff88ff"],
          ["H", "Wave", "#ffcc44"],
          ["F", "Attack", RED],
          ["C", "Sit", "#88ffcc"],
          ["V", "Cheer", "#ffaa44"],
        ].map(([k, v, c]) =>
          React.createElement(StatLine, {
            key: k,
            label: k,
            value: v,
            color: c,
          }),
        ),
      ),
  );
}

// ═══ MOBILE JOYSTICK ═══════════════════════════════════════
export function MobileJoystick({
  onInput,
}: {
  onInput: (axis: { x: number; y: number }) => void;
}) {
  const baseRef = useRef(null);
  const originRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const RADIUS = 55;
  const stickRef = useRef<HTMLDivElement | null>(null);

  function handleStart(x: number, y: number) {
    activeRef.current = true;
    originRef.current = { x, y };
  }

  function handleMove(x: number, y: number) {
    if (!activeRef.current) return;
    const dx = x - originRef.current.x;
    const dy = y - originRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clamp = Math.min(dist, RADIUS);
    const angle = Math.atan2(dy, dx);
    const nx = Math.cos(angle) * clamp;
    const ny = Math.sin(angle) * clamp;

    if (stickRef.current) {
      stickRef.current.style.transform = `translate(${nx}px, ${ny}px)`;
    }

    onInput({ x: nx / RADIUS, y: ny / RADIUS });
  }

  function handleEnd() {
    activeRef.current = false;
    if (stickRef.current) {
      stickRef.current.style.transform = "translate(0,0)";
    }
    onInput({ x: 0, y: 0 });
  }

  return React.createElement(
    "div",
    {
      ref: baseRef,
      onMouseDown: (e) => handleStart(e.clientX, e.clientY),
      onMouseMove: (e) => handleMove(e.clientX, e.clientY),
      onMouseUp: () => handleEnd(),
      onTouchStart: (e) => {
        const t = e.touches[0];
        handleStart(t.clientX, t.clientY);
      },
      onTouchMove: (e) => {
        const t = e.touches[0];
        handleMove(t.clientX, t.clientY);
      },
      onTouchEnd: () => handleEnd(),
      style: {
        position: "fixed",
        bottom: 120,
        left: 40,
        width: RADIUS * 2 + 20,
        height: RADIUS * 2 + 20,
        borderRadius: "50%",
        background: "rgba(0,255,180,0.05)",
        border: "1px solid rgba(0,255,180,0.15)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
        userSelect: "none",
      },
    },
    React.createElement("div", {
      ref: stickRef,
      style: {
        width: 36,
        height: 36,
        borderRadius: "50%",
        background: "rgba(0,255,180,0.25)",
        border: "1px solid rgba(0,255,180,0.4)",
        transition: "transform 0.05s",
        willChange: "transform",
        boxShadow: "0 0 12px rgba(0,255,180,0.2)",
      },
    }),
  );
}

// ═══ MAIN HUD WRAPPER ══════════════════════════════════════
export function HUD({
  state,
  pressedKeys,
  onEmote,
  isMobile,
  onMobileInput,
  emoteKeys,
}: {
  state: {
    currentAnim: string;
    onGround: boolean;
    position?: { x: number; y: number; z: number };
  };
  pressedKeys: Record<string, boolean>;
  onEmote: (anim: string) => void;
  isMobile: boolean;
  onMobileInput: (axis: { x: number; y: number }) => void;
  emoteKeys: EmoteKey[];
}) {
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(InfoPanel, { state }),
    React.createElement(ControlsHelp),
    React.createElement(EmotePanel, {
      emoteKeys,
      currentAnim: state.currentAnim,
      onEmote,
    }),

    // WASD display (only desktop)
    !isMobile &&
      React.createElement(
        "div",
        {
          style: { position: "fixed", bottom: 24, right: 24 },
        },
        React.createElement(WASDDisplay, { keys: pressedKeys }),
      ),

    // Mobile joystick
    isMobile && React.createElement(MobileJoystick, { onInput: onMobileInput }),

    // Corner watermark
    React.createElement(
      "div",
      {
        style: {
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: FONT_MONO,
          fontSize: 9,
          color: "rgba(255,255,255,0.1)",
          letterSpacing: 3,
          pointerEvents: "none",
          // Push above emote buttons on desktop:
          marginBottom: 110,
        },
      },
      "3D CHARACTER STUDIO",
    ),
  );
}
