import { requireLogin, setupLogout, showMessage, escapeHtml, getQuizIdFromUrl } from "./common.js";
import { findQuizById, getResults, updateQuiz } from "./storage.js";

const quizId = getQuizIdFromUrl();
const hostQuizTitle = document.getElementById("hostQuizTitle");
const quizCode = document.getElementById("quizCode");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const playLink = document.getElementById("playLink");
const statusText = document.getElementById("statusText");
const leaderboard = document.getElementById("leaderboard");

let currentUser = null;
let quiz = null;

requireLogin((user) => {
    currentUser = user;
    setupLogout();
    loadQuiz();
    loadLeaderboard();
});

startBtn.addEventListener("click", () => {
    setLiveStatus(true);
});

stopBtn.addEventListener("click", () => {
    setLiveStatus(false);
});

function loadQuiz() {
    if (!quizId) {
        window.location.href = "dashboard.html";
        return;
    }

    quiz = findQuizById(quizId);

    if (!quiz || quiz.ownerId !== currentUser.id) {
        hostQuizTitle.textContent = "Quiz not found";
        leaderboard.innerHTML = "<p class='muted'>You can only host quizzes created by you.</p>";
        return;
    }

    hostQuizTitle.textContent = quiz.title;
    quizCode.textContent = quiz.code;
    playLink.href = `play.html?quizId=${quizId}`;
    showMessage(statusText, quiz.isLive ? "Quiz is live." : "Quiz is stopped.", quiz.isLive);
}

function setLiveStatus(isLive) {
    updateQuiz(quizId, { isLive });
    quiz = {
        ...quiz,
        isLive
    };
    showMessage(statusText, isLive ? "Quiz started. Students can join now." : "Quiz stopped.", isLive);
}

function loadLeaderboard() {
    const results = getResults()
        .filter((result) => result.quizId === quizId)
        .sort((a, b) => b.score - a.score);

    if (results.length === 0) {
        leaderboard.innerHTML = "<p class='muted'>No attempts yet. Start the quiz and share the code.</p>";
        return;
    }

    leaderboard.innerHTML = "";
    results.forEach((result, index) => {
        const item = document.createElement("article");
        item.className = "leader-row";
        item.innerHTML = `
            <strong>#${index + 1} ${escapeHtml(result.userName)}</strong>
            <span>${result.score}/${result.totalQuestions}</span>
        `;
        leaderboard.appendChild(item);
    });
}
