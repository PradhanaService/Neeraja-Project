# Online Quiz System

A simple mini project for a BCA 2nd year student using:

- Frontend: HTML, CSS, JavaScript
- Database: Browser localStorage
- No frontend framework

## Project Structure

```text
online-quiz-system/
  assets/
    css/
      style.css
    js/
      auth.js
      builder.js
      common.js
      dashboard.js
      host.js
      play.js
      result.js
      storage.js
  builder.html
  dashboard.html
  host.html
  index.html
  play.html
  result.html
```

## Storage

This simple mini-project stores data in browser `localStorage`:

```text
users
quizzes
questions
results
```

No Firebase setup or rules are required.

## How to Run Locally

### Option 1: XAMPP

1. Copy this folder into:

```text
C:\xampp\htdocs\
```

2. Start Apache from XAMPP.
3. Open:

```text
http://localhost/online-quiz-system/
```

### Option 2: Simple Local Server

From the project folder, run:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/
```

## First Use

1. Register with any email and password.
2. Create a quiz from the dashboard.
3. Add questions in the quiz builder.
4. Host the quiz and share the join code.
5. Students join using the code, play the quiz, and see results.
