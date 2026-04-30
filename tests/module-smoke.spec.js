const { test, expect } = require("@playwright/test");

const baseUrl = "http://localhost:8000";

const user = {
    id: "user_1",
    name: "Test Teacher",
    email: "teacher@example.com",
    password: "secret"
};

const quiz = {
    id: "quiz_1",
    title: "Sample Quiz",
    description: "Smoke test quiz",
    ownerId: user.id,
    ownerName: user.name,
    code: "ABC123",
    isLive: true,
    createdAt: 1,
    updatedAt: 1
};

const questions = [
    {
        id: "question_1",
        quizId: quiz.id,
        question: "2 + 2?",
        option1: "3",
        option2: "4",
        option3: "5",
        option4: "6",
        correctAnswer: 2,
        createdAt: 1
    }
];

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        window.QUIZSPARK_USE_LOCAL_STORAGE = true;
    });
});

function watchForErrors(page) {
    const errors = [];

    page.on("pageerror", (error) => {
        errors.push(error.message);
    });

    page.on("console", (message) => {
        if (message.type() === "error") {
            errors.push(message.text());
        }
    });

    return errors;
}

async function seedApp(page, values = {}) {
    await page.addInitScript((seed) => {
        if (sessionStorage.getItem("quizspark_test_seeded")) {
            return;
        }

        sessionStorage.setItem("quizspark_test_seeded", "true");
        localStorage.clear();
        localStorage.setItem("quizspark_user", JSON.stringify(seed.user));
        localStorage.setItem("quizspark_users", JSON.stringify([seed.user]));
        localStorage.setItem("quizspark_quizzes", JSON.stringify([seed.quiz]));
        localStorage.setItem("quizspark_questions", JSON.stringify(seed.questions));
        localStorage.setItem("quizspark_results", JSON.stringify(seed.results || []));
    }, { user, quiz, questions, ...values });
}

test("storage.js saves, finds, updates, and normalizes localStorage data", async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto(`${baseUrl}/index.html`);

    const result = await page.evaluate(async () => {
        localStorage.clear();
        const storage = await import("/assets/js/storage.js");

        const savedUser = { id: "u1", email: "a@example.com", password: "pw" };
        const savedQuiz = { id: "q1", ownerId: "u1", code: "abc123", isLive: false };
        const savedQuestion = { id: "qq1", quizId: "q1", createdAt: 2 };

        await storage.saveUser(savedUser);
        await storage.saveQuiz(savedQuiz);
        await storage.saveQuestion(savedQuestion);
        await storage.updateQuiz("q1", { isLive: true });
        await storage.updateQuestion("qq1", { question: "Updated?" });

        return {
            userFound: (await storage.findUserByLogin("a@example.com", "pw"))?.id,
            quizFound: (await storage.findQuizByCode(" ABC123 "))?.id,
            quizLive: (await storage.findQuizById("q1"))?.isLive,
            questionText: (await storage.getQuestionsByQuiz("q1"))[0]?.question,
            normalized: storage.normalizeQuizCode(" ab12 ")
        };
    });

    expect(result).toEqual({
        userFound: "u1",
        quizFound: "q1",
        quizLive: true,
        questionText: "Updated?",
        normalized: "AB12"
    });
    expect(errors).toEqual([]);
});

test("common.js handles sessions, escaping, URL params, and messages", async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto(`${baseUrl}/index.html?quizId=q1&quizCode=abc123`);

    const result = await page.evaluate(async () => {
        const common = await import("/assets/js/common.js");
        const message = document.createElement("p");

        common.saveSession({ id: "u1", name: "A" });
        common.showMessage(message, "Saved", true);

        return {
            currentUser: common.getCurrentUser()?.id,
            escaped: common.escapeHtml(`<script>"x"&'</script>`),
            quizId: common.getQuizIdFromUrl(),
            quizCode: common.getQuizCodeFromUrl(),
            messageText: message.textContent,
            successClass: message.classList.contains("success")
        };
    });

    expect(result).toEqual({
        currentUser: "u1",
        escaped: "&lt;script&gt;&quot;x&quot;&amp;&#039;&lt;/script&gt;",
        quizId: "q1",
        quizCode: "abc123",
        messageText: "Saved",
        successClass: true
    });
    expect(errors).toEqual([]);
});

test("auth.js registers a new user", async ({ page }) => {
    const errors = watchForErrors(page);
    await page.goto(`${baseUrl}/index.html`);

    await page.getByRole("button", { name: "Register" }).click();
    await page.locator("#registerName").fill("New User");
    await page.locator("#registerEmail").fill("new@example.com");
    await page.locator("#registerPassword").fill("secret");
    await page.locator("#registerForm").getByRole("button", { name: "Register" }).click();

    await expect(page).toHaveURL(/dashboard\.html$/);
    expect(errors).toEqual([]);
});

test("dashboard.js creates a quiz and opens the builder", async ({ page }) => {
    const errors = watchForErrors(page);
    await seedApp(page, { quiz: { ...quiz, id: "existing_quiz" }, questions: [] });
    await page.goto(`${baseUrl}/dashboard.html`);

    await page.locator("#quizTitle").fill("Created Quiz");
    await page.locator("#quizDescription").fill("Created from test");
    await page.getByRole("button", { name: "Create Quiz" }).click();

    await expect(page).toHaveURL(/builder\.html\?quizId=quiz_/);
    expect(errors).toEqual([]);
});

test("builder.js adds a question for the current quiz", async ({ page }) => {
    const errors = watchForErrors(page);
    await seedApp(page, { questions: [] });
    await page.goto(`${baseUrl}/builder.html?quizId=${quiz.id}`);

    await page.locator("#question").fill("Capital of India?");
    await page.locator("#option1").fill("Mumbai");
    await page.locator("#option2").fill("Delhi");
    await page.locator("#option3").fill("Kolkata");
    await page.locator("#option4").fill("Chennai");
    await page.locator("#correctAnswer").selectOption("2");
    await page.getByRole("button", { name: "Save Question" }).click();

    await expect(page.locator("#message")).toHaveText("Question added.");
    await expect(page.locator("#questionsList")).toContainText("Capital of India?");
    expect(errors).toEqual([]);
});

test("host.js starts and stops a quiz", async ({ page }) => {
    const errors = watchForErrors(page);
    await seedApp(page, { quiz: { ...quiz, isLive: false } });
    await page.goto(`${baseUrl}/host.html?quizId=${quiz.id}`);

    await page.getByRole("button", { name: "Start Quiz" }).click();
    await expect(page.locator("#statusText")).toHaveText("Quiz started. Students can join now.");

    await page.getByRole("button", { name: "Stop Quiz" }).click();
    await expect(page.locator("#statusText")).toHaveText("Quiz stopped.");
    expect(errors).toEqual([]);
});

test("play.js records answers and saves a result", async ({ page }) => {
    const errors = watchForErrors(page);
    await seedApp(page);
    await page.goto(`${baseUrl}/play.html?quizId=${quiz.id}`);

    await page.locator("input[name='answer'][value='2']").check();
    await page.getByRole("button", { name: "Submit Quiz" }).click();

    await expect(page).toHaveURL(/result\.html\?quizId=quiz_1$/);
    const savedResults = await page.evaluate(() => JSON.parse(localStorage.getItem("quizspark_results")));
    expect(savedResults[0].score).toBe(1);
    expect(errors).toEqual([]);
});

test("play.js escapes answer option text before rendering", async ({ page }) => {
    const errors = watchForErrors(page);
    await seedApp(page, {
        questions: [{
            ...questions[0],
            option1: "<img src=x onerror='window.quizsparkInjected = true'>"
        }]
    });
    await page.goto(`${baseUrl}/play.html?quizId=${quiz.id}`);

    await expect(page.locator("#quizForm img")).toHaveCount(0);
    await expect(page.locator("#quizForm")).toContainText("<img src=x onerror='window.quizsparkInjected = true'>");
    await expect.poll(() => page.evaluate(() => window.quizsparkInjected || false)).toBe(false);
    expect(errors).toEqual([]);
});

test("result.js displays saved quiz results", async ({ page }) => {
    const errors = watchForErrors(page);
    await seedApp(page, {
        results: [{
            id: "result_1",
            quizId: quiz.id,
            quizTitle: quiz.title,
            userId: user.id,
            userName: user.name,
            score: 1,
            totalQuestions: 1,
            answers: [],
            date: 1
        }]
    });
    await page.goto(`${baseUrl}/result.html?quizId=${quiz.id}`);

    await expect(page.locator("#resultDetails")).toContainText("Sample Quiz");
    await expect(page.locator("#resultDetails")).toContainText("You scored 100%.");
    expect(errors).toEqual([]);
});
