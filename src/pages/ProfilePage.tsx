import { useNavigate } from "react-router-dom";
import { useUserStore } from "../store/userStore";

const ROLE_COLORS: Record<string, string> = {
  god: "#f59e0b",
  admin: "#f43f5e",
  creator: "#a78bfa",
  student: "#34d399",
};

const ROLE_LABELS: Record<string, string> = {
  god: "⚡ God",
  admin: "🛡️ Admin",
  creator: "✍️ Creator",
  student: "📚 Student",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useUserStore();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initial = user?.username?.[0]?.toUpperCase() ?? "U";
  const roleColor = ROLE_COLORS[user?.role ?? "student"];
  const roleLabel = ROLE_LABELS[user?.role ?? "student"];

  return (
    <div className="min-h-screen bg-ink">
      {/* Header */}
      <div className="glass sticky top-0 z-40 px-6 py-4 flex items-center gap-4 border-b border-white/5">
        <button
          onClick={() => navigate("/home")}
          className="text-white/40 hover:text-white transition font-body text-sm"
        >
          ← Back
        </button>
        <h1 className="font-display font-bold text-white">Profile</h1>
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-10 animate-slide-up">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl font-display font-bold mb-4"
            style={{
              background: `${roleColor}20`,
              border: `2px solid ${roleColor}40`,
              color: roleColor,
            }}
          >
            {initial}
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-1">
            {user?.username}
          </h2>
          <span
            className="text-sm font-body px-3 py-1 rounded-full"
            style={{
              color: roleColor,
              background: `${roleColor}15`,
              border: `1px solid ${roleColor}30`,
            }}
          >
            {roleLabel}
          </span>
        </div>

        {/* Info cards */}
        <div className="space-y-3 mb-8 animate-fade-in">
          <div className="glass rounded-2xl px-5 py-4 flex items-center justify-between">
            <span className="text-white/40 font-body text-sm">User ID</span>
            <span className="text-white/60 font-mono text-xs truncate max-w-[160px]">
              {user?.id}
            </span>
          </div>
          <div className="glass rounded-2xl px-5 py-4 flex items-center justify-between">
            <span className="text-white/40 font-body text-sm">Role</span>
            <span className="font-body text-sm" style={{ color: roleColor }}>
              {roleLabel}
            </span>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/home")}
            className="w-full glass border border-accent/20 hover:border-accent/50 text-accent font-display font-semibold py-3 rounded-2xl transition"
          >
            📚 Go to Library
          </button>

          {(user?.role === "god" ||
            user?.role === "creator" ||
            user?.role === "admin") && (
            <div className="glass rounded-2xl px-5 py-4 border border-gold/20">
              <p className="text-gold text-sm font-body text-center">
                ⚡ You have creator privileges —{" "}
                <span className="text-white/40">admin panel coming soon</span>
              </p>
            </div>
          )}

          <button
            onClick={handleLogout}
            className="w-full border border-rose/20 hover:border-rose/50 text-rose/70 hover:text-rose font-body text-sm py-3 rounded-2xl transition"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
