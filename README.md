# AI Interviewer

An AI-powered mock interview platform. Upload your resume, get interviewed by an AI interviewer based on your own skills and projects, and receive detailed, honest feedback at the end.

This repository contains the **frontend**. The backend (Node.js, Express, MongoDB, Gemini API) lives in a separate repository: `<backend repo link>`.

## Features

- **Authentication:** signup and login with JWT, protected pages, and automatic logout when the token expires
- **Resume upload:** PDF resume with drag and drop; the AI analyzes your skills, projects and experience
- **Resume-based interview:** questions are generated from your own resume
- **Voice and text answers:** answer by speaking (English or Hindi) or by typing
- **Interview room:** live camera preview, animated AI interviewer, live captions and a side chat panel
- **Instant scoring:** every answer is scored out of 10 with feedback
- **Final report:** overall score, strengths, areas for improvement, skill radar chart, question-by-question review and full transcript
- **Dashboard:** stats, last interview, simple progress view and interview history with delete option
- **Dark and light mode**, saved across visits
- **Resume where you left off:** refreshing the interview page continues from the next unanswered question

## Tech Stack

| Area | Technology |
|---|---|
| Framework | React (Vite) |
| Routing | React Router |
| API calls | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Styling | Plain CSS with CSS variables (theming and animations) |
| Voice and camera | Browser APIs (Web Speech API, `getUserMedia`) |

## Project Structure

```
src/
├── api/            Axios setup and API functions (auth, resume, interview, mock)
├── components/     Navbar, ProtectedRoute, ResumeUploader, NewInterview
├── context/        AuthContext (login state)
├── hooks/          useTheme (dark and light mode)
├── pages/          Landing, Login, Signup, Dashboard, Interview, Feedback, UploadResume
├── styles/         room.css (interview room and feedback styles)
├── App.jsx         Routes
├── main.jsx        App entry point
└── index.css       Global styles and themes
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- The backend running locally or deployed (see the backend repository)

### Installation

```bash
git clone  https://github.com/tanyasen930/ai-interviewer-.git
cd client
npm install
```

### Environment variables

Create a `.env` file in the `client` folder:

```
VITE_API_URL=http://localhost:5000
VITE_USE_MOCK=false
```

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API (no trailing slash) |
| `VITE_USE_MOCK` | Set to `true` to run the app without a backend using built-in mock data |

### Run

```bash
npm run dev
```

Open `http://localhost:5173`.

### Build

```bash
npm run build
```

## Mock mode

To try the full app without a backend, set `VITE_USE_MOCK=true` in `.env` and restart the dev server. Users, interviews and scores are then stored in your browser's `localStorage`. This mode is for development only.

## API endpoints used

| Purpose | Endpoint |
|---|---|
| Sign up | `POST /api/auth/register` |
| Log in | `POST /api/auth/login` |
| Upload resume | `POST /api/resume/upload` |
| Create interview | `POST /api/interview/generate` |
| Get interview | `GET /api/interview/:id` |
| Submit answer | `POST /api/interview/answer` |
| Generate report | `POST /api/report/generate` |
| List interviews | `GET /api/interview/my` |
| Delete interview | `DELETE /api/interview/:id` |

All endpoints except signup and login need an `Authorization: Bearer <token>` header, which is added automatically.

## Browser support and notes

- **Voice input** works in Google Chrome and Microsoft Edge only. It needs an internet connection and does not work in Brave or Firefox. Typing always works.
- **Camera and microphone** need `https` or `localhost`.
- The camera feed is only shown on your own screen. Video and audio are **not recorded or uploaded**. Only the text of your answer is sent to the server.
- Resume upload currently supports **PDF only**.

## Deployment

The frontend can be deployed on Vercel or Netlify:

1. Set the root directory to `client`.
2. Add the environment variables `VITE_API_URL` and `VITE_USE_MOCK=false`.
3. Add a rewrite so that page refreshes do not return 404 (for Vercel, a `vercel.json` with a rewrite to `/index.html`).

## Roadmap

- Text and link based resume input
- Realistic talking AI avatar
- Better voice recognition for Hinglish
- Face and confidence analysis

## Authors

- `<your name>`: Frontend
- `<partner name>`: Backend