LLM-Powered Job Portal
This project is a full-stack web application built for a hackathon. It serves as an intelligent job portal that uses a Large Language Model (LLM) to analyze candidate resumes and match them with relevant job listings based on skill overlap.

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
