(function () {
  const SESSION_KEY = "ngc-cc-session";

  async function sha256(text) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (Date.now() > session.expires) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  }

  function setSession(user) {
    const hours = window.NGC_AUTH?.sessionHours || 24;
    sessionStorage.setItem(
      SESSION_KEY,
      JSON.stringify({
        user,
        expires: Date.now() + hours * 60 * 60 * 1000,
      })
    );
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.reload();
  }

  function isAuthed() {
    return !!getSession();
  }

  async function login(password, user) {
    const config = window.NGC_AUTH;
    if (!config?.passwordHash) {
      return { ok: false, error: "Auth not configured." };
    }
    if (!config.configured) {
      return {
        ok: false,
        error: "Command Center password not set. Add NGC_COMMAND_CENTER_PASSWORD to GitHub Actions secrets.",
      };
    }
    const hash = await sha256(password);
    if (hash !== config.passwordHash) {
      return { ok: false, error: "Access denied." };
    }
    setSession(user || "Owner");
    return { ok: true };
  }

  function requireAuth() {
    if (isAuthed()) return true;
    showLoginGate();
    return false;
  }

  function showLoginGate() {
    const gate = document.getElementById("login-gate");
    if (gate) gate.classList.remove("hidden");
    document.body.classList.add("locked");
  }

  function hideLoginGate() {
    const gate = document.getElementById("login-gate");
    if (gate) gate.classList.add("hidden");
    document.body.classList.remove("locked");
  }

  function initLoginForm() {
    const form = document.getElementById("login-form");
    if (!form) return;

    const config = window.NGC_AUTH;
    const notice = document.getElementById("login-notice");
    if (notice && config && !config.configured) {
      notice.textContent =
        "Password not configured yet. Set the NGC_COMMAND_CENTER_PASSWORD secret in GitHub repo settings, then redeploy.";
    }

    if (isAuthed()) {
      hideLoginGate();
      return;
    }

    showLoginGate();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = document.getElementById("login-password")?.value || "";
      const user = document.getElementById("login-user")?.value || "Owner";
      const errorEl = document.getElementById("login-error");
      const result = await login(password, user);
      if (result.ok) {
        hideLoginGate();
        if (typeof window.onAuthSuccess === "function") window.onAuthSuccess();
      } else if (errorEl) {
        errorEl.textContent = result.error;
      }
    });
  }

  window.NGCAuth = {
    isAuthed,
    requireAuth,
    logout,
    getSession,
    initLoginForm,
    hideLoginGate,
  };

  document.addEventListener("DOMContentLoaded", initLoginForm);
})();
