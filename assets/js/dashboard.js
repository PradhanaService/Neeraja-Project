import { requireLogin, setupLogout, showMessage, escapeHtml } from "./common.js";
import { createId, findQuizByCode, getQuizzes, normalizeQuizCode, saveQuiz } from "./storage.js";

const createQuizForm = document.getElementById("createQuizForm");
const quizList = document.getElementById("quizList");
const joinForm = document.getElementById("joinForm");
const joinMessage = document.getElementById("joinMessage");

let currentUser = null;

requireLogin(async (user) => {
    currentUser = user;
    setupLogout();
    await loadMyQuizzes();
});

createQuizForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const title = document.getElementById("quizTitle").value.trim();
    const description = document.getElementById("quizDescription").value.trim();
    const quiz = {
        id: createId("quiz"),
        title,
        description,
        ownerId: currentUser.id,
        ownerName: currentUser.name,
        code: makeCode(),
        isLive: false,
        createdAt: Date.now(),
        updatedAt: Date.now()
    };

    await saveQuiz(quiz);
    window.location.href = `builder.html?quizId=${quiz.id}`;
});

joinForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const code = normalizeQuizCode(document.getElementById("joinCode").value);
    const quiz = await findQuizByCode(code);

    if (!quiz) {
        showMessage(joinMessage, "No live quiz found with this code. Ask the host to refresh and start the quiz again.");
        return;
    }

    if (!quiz.isLive && quiz.ownerId !== currentUser.id) {
        showMessage(joinMessage, "This quiz is not live yet.");
        return;
    }

    window.location.href = `play.html?quizId=${quiz.id}`;
});

async function loadMyQuizzes() {
    const quizzes = (await getQuizzes())
        .filter((quiz) => quiz.ownerId === currentUser.id)
        .sort((a, b) => b.createdAt - a.createdAt);

    if (quizzes.length === 0) {
        quizList.innerHTML = "<p class='muted'>No quizzes yet. Create your first quiz.</p>";
        return;
    }

    quizList.innerHTML = "";
    quizzes.forEach((quiz) => {
        const item = document.createElement("article");
        item.className = "quiz-item";
        item.innerHTML = `
            <div>
                <h3>${escapeHtml(quiz.title)}</h3>
                <p class="muted">${escapeHtml(quiz.description || "No description")}</p>
                <p><strong>Code:</strong> <span class="code-small">${quiz.code}</span></p>
            </div>
            <div class="question-actions">
                <a class="button-link secondary-link" href="builder.html?quizId=${quiz.id}">Edit</a>
                <a class="button-link" href="host.html?quizId=${quiz.id}">Host</a>
            </div>
        `;
        quizList.appendChild(item);
    });
}

function makeCode() {
    return Math.random().toString(36).slice(2, 8).toUpperCase();
}
