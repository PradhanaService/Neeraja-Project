import { getCurrentUser, saveSession, showMessage } from "./common.js";
import { createId, findUserByEmail, findUserByLogin, saveUser } from "./storage.js";

const showLogin = document.getElementById("showLogin");
const showRegister = document.getElementById("showRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

showLogin.addEventListener("click", () => switchTab("login"));
showRegister.addEventListener("click", () => switchTab("register"));

if (getCurrentUser()) {
    window.location.href = "dashboard.html";
}

function switchTab(tabName) {
    const loginActive = tabName === "login";

    loginForm.classList.toggle("hidden", !loginActive);
    registerForm.classList.toggle("hidden", loginActive);
    showLogin.classList.toggle("active", loginActive);
    showRegister.classList.toggle("active", !loginActive);
    message.textContent = "";
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;
    const user = await findUserByLogin(email, password);

    if (!user) {
        showMessage(message, "Invalid email or password.");
        return;
    }

    saveSession(user);
    window.location.href = "dashboard.html";
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const password = document.getElementById("registerPassword").value;

    if (!name || !email || !password) {
        showMessage(message, "Please fill all fields.");
        return;
    }

    if (await findUserByEmail(email)) {
        showMessage(message, "This email is already registered. Please login.");
        return;
    }

    const user = {
        id: createId("user"),
        name,
        email,
        password,
        role: "user",
        createdAt: Date.now()
    };

    await saveUser(user);
    saveSession(user);
    window.location.href = "dashboard.html";
});
