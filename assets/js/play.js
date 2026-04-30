import { requireLogin, setupLogout, showMessage, escapeHtml, getQuizCodeFromUrl, getQuizIdFromUrl } from "./common.js";
import { createId, findQuizByCode, findQuizById, getQuestionsByQuiz, saveResult } from "./storage.js";

let quizId = getQuizIdFromUrl();
const quizCode = getQuizCodeFromUrl();
const quizTitle = document.getElementById("quizTitle");
const progressText = document.getElementById("progressText");
const questionText = document.getElementById("questionText");
const quizForm = document.getElementById("quizForm");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const message = document.getElementById("message");

let currentUser = null;
let quiz = null;
let questions = [];
let currentIndex = 0;
let selectedAnswers = {};

requireLogin(async (user) => {
    currentUser = user;
    setupLogout();

    if (!quizId && !quizCode) {
        window.location.href = "dashboard.html";
        return;
    }

    quiz = await findQuizById(quizId);

    if (!quiz && quizCode) {
        quiz = await findQuizByCode(quizCode);
        quizId = quiz ? quiz.id : quizId;
    }

    questions = await getQuestionsByQuiz(quizId);

    if (quiz) {
        quizTitle.textContent = quiz.title;
    }

    showQuestion();
});

prevBtn.addEventListener("click", () => {
    saveCurrentAnswer();

    if (currentIndex > 0) {
        currentIndex--;
        showQuestion();
    }
});

nextBtn.addEventListener("click", () => {
    saveCurrentAnswer();

    if (currentIndex < questions.length - 1) {
        currentIndex++;
        showQuestion();
    }
});

submitBtn.addEventListener("click", async () => {
    saveCurrentAnswer();

    if (!quiz) {
        showMessage(message, "Unable to submit because the quiz was not found.");
        return;
    }

    if (Object.keys(selectedAnswers).length < questions.length) {
        showMessage(message, "Please answer all questions before submitting.");
        return;
    }

    let score = 0;
    const answers = questions.map((question) => {
        const selectedAnswer = selectedAnswers[question.id];
        const isCorrect = selectedAnswer === question.correctAnswer;

        if (isCorrect) {
            score++;
        }

        return {
            questionId: question.id,
            selectedAnswer,
            correctAnswer: question.correctAnswer,
            isCorrect
        };
    });

    await saveResult({
        id: createId("result"),
        quizId,
        quizTitle: quiz.title,
        userId: currentUser.id,
        userName: currentUser.name,
        score,
        totalQuestions: questions.length,
        answers,
        date: Date.now()
    });

    window.location.href = `result.html?quizId=${quizId}`;
});

function showQuestion() {
    message.textContent = "";

    if (!quiz) {
        questionText.textContent = "Quiz not found.";
        quizForm.innerHTML = `
            <p class="muted">
                This quiz is not available in this browser. The current version stores quizzes in browser localStorage, so participants must use the same browser data or the app needs a shared database for online hosting.
            </p>
        `;
        hideControls();
        return;
    }

    if (questions.length === 0) {
        questionText.textContent = "No questions available.";
        quizForm.innerHTML = "<p class='muted'>The host has not added questions yet.</p>";
        hideControls();
        return;
    }

    const question = questions[currentIndex];
    progressText.textContent = `Question ${currentIndex + 1} of ${questions.length}`;
    questionText.textContent = question.question;

    quizForm.innerHTML = [1, 2, 3, 4].map((optionNumber) => {
        const optionText = escapeHtml(question[`option${optionNumber}`]);
        const checked = selectedAnswers[question.id] === optionNumber ? "checked" : "";

        return `
            <label class="option">
                <input type="radio" name="answer" value="${optionNumber}" ${checked}>
                <span>${optionText}</span>
            </label>
        `;
    }).join("");

    prevBtn.classList.toggle("hidden", currentIndex === 0);
    nextBtn.classList.toggle("hidden", currentIndex === questions.length - 1);
    submitBtn.classList.toggle("hidden", currentIndex !== questions.length - 1);
}

function saveCurrentAnswer() {
    const selectedOption = document.querySelector("input[name='answer']:checked");

    if (selectedOption && questions[currentIndex]) {
        selectedAnswers[questions[currentIndex].id] = Number(selectedOption.value);
    }
}

function hideControls() {
    progressText.textContent = "";
    prevBtn.classList.add("hidden");
    nextBtn.classList.add("hidden");
    submitBtn.classList.add("hidden");
}
