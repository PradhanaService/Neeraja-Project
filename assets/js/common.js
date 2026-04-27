const SESSION_KEY = "quizspark_user";

// This mini project uses a simple browser session instead of Firebase Auth.
export function requireLogin(callback) {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = "index.html";
        return;
    }

    callback(user, user);
}

export function getCurrentUser() {
    const savedUser = localStorage.getItem(SESSION_KEY);

    if (!savedUser) {
        return null;
    }

    try {
        return JSON.parse(savedUser);
    } catch (error) {
        localStorage.removeItem(SESSION_KEY);
        return null;
    }
}

export function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function setupLogout(buttonId = "logoutBtn") {
    const logoutBtn = document.getElementById(buttonId);

    if (!logoutBtn) {
        return;
    }

    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "index.html";
    });
}

export function showMessage(element, text, success = false) {
    element.textContent = text;
    element.classList.toggle("success", success);
}

export function escapeHtml(value) {
    return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

export function getQuizIdFromUrl() {
    return new URLSearchParams(window.location.search).get("quizId");
}
