LLM-Powered Job Portal
This project is a full-stack web application built for a hackathon. It serves as an intelligent job portal that uses a Large Language Model (LLM) to analyze candidate resumes and match them with relevant job listings based on skill overlap.

The application features a React frontend, a Python/Flask backend, and a SQLite database for persistence. The core matching logic is powered by the Google Gemini API.

Core Features
📄 PDF Resume Processing: Users can upload their resumes in PDF format. The backend extracts the text content for analysis.

🧠 LLM-Powered Analysis: The application uses the Google Gemini API to intelligently analyze the text from both the resume and a job description. It extracts key skills, calculates a percentage-based match score, and provides a qualitative explanation for the result.

🔍 Dynamic Job Listings: Job listings are loaded from a persistent database and displayed in a clean, user-friendly list.

🔎 Search & Filtering: Users can instantly search for jobs by title and filter the listings by location.

💾 Match History: The system saves all successful matches to the database, and users can view a history of the jobs they've matched with.

Tech Stack
Frontend: React (with Vite)

Backend: Python (with Flask)

Database: SQLite

LLM: Google Gemini Pro

PDF Parsing: PyPDF2

Setup and Installation
To run this project locally, you will need Python and Node.js installed.

1. Backend Setup
Bash

# Navigate to the backend directory
```bash

cd backend
```
# Install required Python packages
```bash

pip install Flask Flask-Cors PyPDF2 google-generativeai
```
# IMPORTANT: Open app.py and add your Google Gemini API Key
# API_KEY = "YOUR_API_KEY"

# Run the backend server
python app.py
The backend server will run on http://127.0.0.1:5000.

2. Frontend Setup
Bash

# Navigate to the frontend directory
```bash

cd frontend
```
# Install npm dependencies
```bash

npm install
```
# Run the frontend development server
```bash

npm run dev
```
The frontend will be available at http://localhost:5173 (or a similar port).
