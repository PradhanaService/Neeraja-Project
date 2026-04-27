const USERS_KEY = "quizspark_users";
const QUIZZES_KEY = "quizspark_quizzes";
const QUESTIONS_KEY = "quizspark_questions";
const RESULTS_KEY = "quizspark_results";

export function getUsers() {
    return readList(USERS_KEY);
}

export function saveUser(user) {
    const users = getUsers();
    users.push(user);
    saveList(USERS_KEY, users);
}

export function findUserByEmail(email) {
    return getUsers().find((user) => user.email === email) || null;
}

export function findUserByLogin(email, password) {
    return getUsers().find((user) => user.email === email && user.password === password) || null;
}

export function getQuizzes() {
    return readList(QUIZZES_KEY);
}

export function saveQuiz(quiz) {
    const quizzes = getQuizzes();
    quizzes.push(quiz);
    saveList(QUIZZES_KEY, quizzes);
}

export function updateQuiz(quizId, updates) {
    const quizzes = getQuizzes().map((quiz) => {
        if (quiz.id !== quizId) {
            return quiz;
        }

        return {
            ...quiz,
            ...updates,
            updatedAt: Date.now()
        };
    });
    saveList(QUIZZES_KEY, quizzes);
}

export function findQuizById(quizId) {
    return getQuizzes().find((quiz) => quiz.id === quizId) || null;
}

export function findQuizByCode(code) {
    return getQuizzes().find((quiz) => quiz.code === code) || null;
}

export function getQuestions() {
    return readList(QUESTIONS_KEY);
}

export function getQuestionsByQuiz(quizId) {
    return getQuestions()
        .filter((question) => question.quizId === quizId)
        .sort((a, b) => a.createdAt - b.createdAt);
}

export function saveQuestion(question) {
    const questions = getQuestions();
    questions.push(question);
    saveList(QUESTIONS_KEY, questions);
}

export function updateQuestion(questionId, updates) {
    const questions = getQuestions().map((question) => {
        if (question.id !== questionId) {
            return question;
        }

        return {
            ...question,
            ...updates
        };
    });
    saveList(QUESTIONS_KEY, questions);
}

export function deleteQuestionById(questionId) {
    const questions = getQuestions().filter((question) => question.id !== questionId);
    saveList(QUESTIONS_KEY, questions);
}

export function getResults() {
    return readList(RESULTS_KEY);
}

export function saveResult(result) {
    const results = getResults();
    results.push(result);
    saveList(RESULTS_KEY, results);
}

export function createId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function readList(key) {
    const savedValue = localStorage.getItem(key);

    if (!savedValue) {
        return [];
    }

    try {
        return JSON.parse(savedValue);
    } catch (error) {
        return [];
    }
}

function saveList(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}
