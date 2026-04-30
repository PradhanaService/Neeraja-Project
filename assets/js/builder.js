import { requireLogin, setupLogout, showMessage, escapeHtml, getQuizIdFromUrl } from "./common.js";
import {
    createId,
    deleteQuestionById,
    findQuizById,
    getQuestionsByQuiz,
    saveQuestion,
    updateQuestion
} from "./storage.js";

const quizId = getQuizIdFromUrl();
const quizTitleText = document.getElementById("quizTitleText");
const hostLink = document.getElementById("hostLink");
const questionForm = document.getElementById("questionForm");
const questionsList = document.getElementById("questionsList");
const message = document.getElementById("message");
const formTitle = document.getElementById("formTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");

let currentUser = null;
let quiz = null;

requireLogin(async (user) => {
    currentUser = user;
    setupLogout();

    if (!quizId) {
        window.location.href = "dashboard.html";
        return;
    }

    quiz = await findQuizById(quizId);

    if (!quiz || quiz.ownerId !== currentUser.id) {
        quizTitleText.textContent = "Quiz not found";
        questionsList.innerHTML = "<p class='muted'>You can only edit quizzes created by you.</p>";
        questionForm.classList.add("hidden");
        return;
    }

    quizTitleText.textContent = quiz.title;
    hostLink.href = `host.html?quizId=${quizId}`;
    await loadQuestions();
});

questionForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const questionId = document.getElementById("questionId").value;
    const questionData = {
        quizId,
        question: document.getElementById("question").value.trim(),
        option1: document.getElementById("option1").value.trim(),
        option2: document.getElementById("option2").value.trim(),
        option3: document.getElementById("option3").value.trim(),
        option4: document.getElementById("option4").value.trim(),
        correctAnswer: Number(document.getElementById("correctAnswer").value)
    };

    if (questionId) {
        await updateQuestion(questionId, questionData);
        showMessage(message, "Question updated.", true);
    } else {
        await saveQuestion({
            id: createId("question"),
            ...questionData,
            createdAt: Date.now()
        });
        showMessage(message, "Question added.", true);
    }

    resetForm();
    await loadQuestions();
});

cancelEditBtn.addEventListener("click", resetForm);

async function loadQuestions() {
    const questions = await getQuestionsByQuiz(quizId);

    if (questions.length === 0) {
        questionsList.innerHTML = "<p class='muted'>No questions yet. Add one to make this quiz playable.</p>";
        return;
    }

    questionsList.innerHTML = "";
    questions.forEach((question, index) => {
        const item = document.createElement("article");
        item.className = "question-item";
        item.innerHTML = `
            <h3>${index + 1}. ${escapeHtml(question.question)}</h3>
            <p>1. ${escapeHtml(question.option1)}</p>
            <p>2. ${escapeHtml(question.option2)}</p>
            <p>3. ${escapeHtml(question.option3)}</p>
            <p>4. ${escapeHtml(question.option4)}</p>
            <p><strong>Correct:</strong> Option ${question.correctAnswer}</p>
            <div class="question-actions">
                <button class="edit-btn" type="button">Edit</button>
                <button class="danger delete-btn" type="button">Delete</button>
            </div>
        `;

        item.querySelector(".edit-btn").addEventListener("click", () => fillForm(question));
        item.querySelector(".delete-btn").addEventListener("click", () => deleteQuestion(question.id));
        questionsList.appendChild(item);
    });
}

function fillForm(question) {
    document.getElementById("questionId").value = question.id;
    document.getElementById("question").value = question.question;
    document.getElementById("option1").value = question.option1;
    document.getElementById("option2").value = question.option2;
    document.getElementById("option3").value = question.option3;
    document.getElementById("option4").value = question.option4;
    document.getElementById("correctAnswer").value = question.correctAnswer;
    formTitle.textContent = "Edit Question";
    cancelEditBtn.classList.remove("hidden");
}

async function deleteQuestion(id) {
    if (!confirm("Delete this question?")) {
        return;
    }

    await deleteQuestionById(id);
    await loadQuestions();
}

function resetForm() {
    questionForm.reset();
    document.getElementById("questionId").value = "";
    formTitle.textContent = "Add Question";
    cancelEditBtn.classList.add("hidden");
}
