import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    setDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const USERS_KEY = "quizspark_users";
const QUIZZES_KEY = "quizspark_quizzes";
const QUESTIONS_KEY = "quizspark_questions";
const RESULTS_KEY = "quizspark_results";

const firebaseConfig = {
    apiKey: "AIzaSyCj8miTUIuVz-UIqFAu6jpOhebTcaxLWFM",
    authDomain: "quiz-application-41e55.firebaseapp.com",
    projectId: "quiz-application-41e55",
    storageBucket: "quiz-application-41e55.firebasestorage.app",
    messagingSenderId: "854876257022",
    appId: "1:854876257022:web:22481191aa1fe370bc03af",
    measurementId: "G-QWLTR1VJ2D"
};

const app = initializeApp(firebaseConfig);

let firestoreDb = null;
let migrationPromise = null;

async function getDb() {
    if (useLocalStorage()) {
        return null;
    }

    if (!firestoreDb) {
        const firestore = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
        firestoreDb = firestore.getFirestore(app);
    }

    await migrateLocalStorageData();

    return firestoreDb;
}

export async function getUsers() {
    return readList(USERS_KEY, "users");
}

export async function saveUser(user) {
    return saveItem(USERS_KEY, "users", user);
}

export async function findUserByEmail(email) {
    return (await getUsers()).find((user) => user.email === email) || null;
}

export async function findUserByLogin(email, password) {
    return (await getUsers()).find((user) => user.email === email && user.password === password) || null;
}

export async function getQuizzes() {
    return readList(QUIZZES_KEY, "quizzes");
}

export async function saveQuiz(quiz) {
    return saveItem(QUIZZES_KEY, "quizzes", quiz);
}

export async function updateQuiz(quizId, updates) {
    if (useLocalStorage()) {
        const quizzes = (await getQuizzes()).map((quiz) => {
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
        return;
    }

    const db = await getDb();
    await updateDoc(doc(db, "quizzes", quizId), {
        ...updates,
        updatedAt: Date.now()
    });
}

export async function findQuizById(quizId) {
    return (await getQuizzes()).find((quiz) => quiz.id === quizId) || null;
}

export async function findQuizByCode(code) {
    const normalizedCode = normalizeQuizCode(code);
    return (await getQuizzes()).find((quiz) => normalizeQuizCode(quiz.code) === normalizedCode) || null;
}

export async function getQuestions() {
    return readList(QUESTIONS_KEY, "questions");
}

export async function getQuestionsByQuiz(quizId) {
    return (await getQuestions())
        .filter((question) => question.quizId === quizId)
        .sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveQuestion(question) {
    return saveItem(QUESTIONS_KEY, "questions", question);
}

export async function updateQuestion(questionId, updates) {
    if (useLocalStorage()) {
        const questions = (await getQuestions()).map((question) => {
            if (question.id !== questionId) {
                return question;
            }

            return {
                ...question,
                ...updates
            };
        });
        saveList(QUESTIONS_KEY, questions);
        return;
    }

    const db = await getDb();
    await updateDoc(doc(db, "questions", questionId), updates);
}

export async function deleteQuestionById(questionId) {
    if (useLocalStorage()) {
        const questions = (await getQuestions()).filter((question) => question.id !== questionId);
        saveList(QUESTIONS_KEY, questions);
        return;
    }

    const db = await getDb();
    await deleteDoc(doc(db, "questions", questionId));
}

export async function getResults() {
    return readList(RESULTS_KEY, "results");
}

export async function saveResult(result) {
    return saveItem(RESULTS_KEY, "results", result);
}

export function createId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeQuizCode(code) {
    return String(code || "").trim().toUpperCase();
}

async function readList(localKey, collectionName) {
    if (useLocalStorage()) {
        return readLocalList(localKey);
    }

    const db = await getDb();
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs.map((document) => document.data());
}

async function saveItem(localKey, collectionName, value) {
    if (useLocalStorage()) {
        const items = readLocalList(localKey);
        items.push(value);
        saveList(localKey, items);
        return;
    }

    const db = await getDb();
    await setDoc(doc(db, collectionName, value.id), value);
}

async function migrateLocalStorageData() {
    if (migrationPromise) {
        return migrationPromise;
    }

    migrationPromise = (async () => {
        const migrationSets = [
            [USERS_KEY, "users"],
            [QUIZZES_KEY, "quizzes"],
            [QUESTIONS_KEY, "questions"],
            [RESULTS_KEY, "results"]
        ];

        for (const [localKey, collectionName] of migrationSets) {
            const items = readLocalList(localKey).filter((item) => item && item.id);

            for (const item of items) {
                await setDoc(doc(firestoreDb, collectionName, item.id), item);
            }
        }
    })();

    return migrationPromise;
}

function useLocalStorage() {
    return window.QUIZSPARK_USE_LOCAL_STORAGE === true;
}

function readLocalList(key) {
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
