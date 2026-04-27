import { requireLogin, setupLogout, escapeHtml } from "./common.js";
import { getResults } from "./storage.js";

const resultDetails = document.getElementById("resultDetails");

requireLogin((user) => {
    setupLogout();
    loadResults(user.id);
});

function loadResults(userId) {
    const results = getResults()
        .filter((result) => result.userId === userId)
        .sort((a, b) => b.date - a.date);

    if (results.length === 0) {
        resultDetails.innerHTML = `
            <p class="muted">You have not taken the quiz yet.</p>
            <a href="dashboard.html">Go to Dashboard</a>
        `;
        return;
    }

    resultDetails.innerHTML = "";
    results.forEach((result) => {
        const percentage = Math.round((result.score / result.totalQuestions) * 100);
        const item = document.createElement("article");
        item.className = "result-card";
        item.innerHTML = `
            <h3>${escapeHtml(result.quizTitle || "Quiz")}</h3>
            <p class="score">${result.score}/${result.totalQuestions}</p>
            <p>You scored ${percentage}%.</p>
        `;
        resultDetails.appendChild(item);
    });
}
