import sqlite3
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from PyPDF2 import PdfReader
import google.generativeai as genai

# ... (The init_db function and other parts of the file are unchanged)
def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('CREATE TABLE IF NOT EXISTS jobs (id INTEGER PRIMARY KEY, jobTitle TEXT, company TEXT, location TEXT, description TEXT)')
    c.execute('CREATE TABLE IF NOT EXISTS candidates (id INTEGER PRIMARY KEY AUTOINCREMENT, resume_text TEXT NOT NULL)')
    c.execute('CREATE TABLE IF NOT EXISTS matches (id INTEGER PRIMARY KEY AUTOINCREMENT, candidate_id INTEGER, job_id INTEGER, match_score INTEGER, explanation TEXT, job_skills TEXT, resume_skills TEXT, FOREIGN KEY(candidate_id) REFERENCES candidates(id), FOREIGN KEY(job_id) REFERENCES jobs(id))')
    c.execute("SELECT COUNT(*) FROM jobs")
    if c.fetchone()[0] == 0:
        realistic_jobs = [
            (1, "Senior Software Engineer", "TechFlow Solutions", "San Francisco, CA", "Lead development of microservices architecture using Node.js, Python, and React. Architect and implement real-time data processing pipelines. Requires experience with AWS (EC2, S3, Lambda), Docker, Kubernetes, and PostgreSQL. Mentor junior engineers and establish code review best practices."),
            (2, "Senior Product Manager", "CloudTech Solutions", "San Jose, CA", "Lead product strategy for a SaaS platform. Increase user engagement through data-driven feature prioritization. Requires expertise in product roadmapping, user research, A/B testing, SQL, and agile methodologies. Manage product roadmap across multiple engineering teams."),
            (3, "Senior Data Scientist", "AI Innovations Corp", "Palo Alto, CA", "Lead a machine learning team to build models and data pipelines at scale. Requires expertise in deep learning (TensorFlow, PyTorch), NLP, and computer vision. Develop recommendation systems and fraud detection models. Experience with Spark, Airflow, and AWS Sagemaker is essential."),
            (4, "Marketing Coordinator", "Creative Ads Agency", "New York, NY", "Plan and execute marketing campaigns. Manage social media channels, create content, and analyze campaign performance. Requires strong communication skills and experience with Google Analytics and SEO tools. A degree in Marketing or a related field is preferred."),
            (5, "Junior Software Engineer", "TechFlow Solutions", "Remote", "Assist in developing features for our web applications using React and Node.js. Work with senior engineers to build and test scalable code. Ideal for a recent graduate with a passion for learning new technologies.")
        ]
        c.executemany("INSERT INTO jobs (id, jobTitle, company, location, description) VALUES (?, ?, ?, ?, ?)", realistic_jobs)
    conn.commit()
    conn.close()

app = Flask(__name__)
CORS(app)

API_KEY = "AIzaSyDv49kG8dAmCg4LI2u5dlGSTDC7TdC5RuA" # Make sure your key is still here
genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash-latest')

@app.route('/api/jobs', methods=['GET'])
def get_jobs():
    # ... (this function is unchanged)
    conn = sqlite3.connect('database.db'); conn.row_factory = sqlite3.Row; c = conn.cursor()
    c.execute("SELECT * FROM jobs"); jobs = [dict(row) for row in c.fetchall()]; conn.close()
    return jsonify(jobs)

@app.route('/api/upload', methods=['POST'])
def upload_resume():
    # ... (this function is unchanged)
    if 'resume' not in request.files: return jsonify({"error": "No resume file found"}), 400
    file = request.files['resume']
    if not file.filename.endswith('.pdf'): return jsonify({"error": "Please upload a valid PDF file"}), 400
    try:
        pdf_reader = PdfReader(file.stream)
        text = "".join(page.extract_text() or "" for page in pdf_reader.pages)
        conn = sqlite3.connect('database.db'); c = conn.cursor()
        c.execute("INSERT INTO candidates (resume_text) VALUES (?)", (text,)); candidate_id = c.lastrowid
        conn.commit(); conn.close()
        return jsonify({"extracted_text": text, "candidate_id": candidate_id})
    except Exception as e: return jsonify({"error": f"Failed to process PDF: {str(e)}"}), 500

# --- UPDATED /api/match ENDPOINT ---
@app.route('/api/match', methods=['POST'])
def match_resume_to_job():
    data = request.get_json()
    candidate_id = data.get('candidateId')
    job = data.get('job')

    if not candidate_id or not job:
        return jsonify({"error": "Missing candidateId or job data"}), 400

    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute("SELECT resume_text FROM candidates WHERE id = ?", (candidate_id,))
    result = c.fetchone()
    conn.close()
    if not result:
        return jsonify({"error": "Candidate not found"}), 404
    resume_text = result[0]
    
    prompt = f"""
    Analyze the following resume and job description. Based ONLY on the text provided, perform the following tasks:
    1. Extract up to 5 key skills from the job description.
    2. Extract up to 5 relevant skills from the resume that match the job.
    3. Calculate a match score from 0 to 100, where 100 is a perfect match.
    4. Provide a brief, one-paragraph explanation for the score.
    Return the result in a valid JSON format with no additional text or formatting. The JSON object should have these exact keys: "job_skills", "resume_skills", "match_score", "explanation".
    ---
    JOB DESCRIPTION:
    {job['description']}
    ---
    RESUME:
    {resume_text}
    ---
    """
    
    try:
        response = model.generate_content(prompt)
        # --- NEW DEBUGGING AND ERROR HANDLING ---
        print(f"Raw Gemini Response: '{response.text}'") # This will print the raw response to your terminal
        
        cleaned_response = response.text.strip().replace("```json", "").replace("```", "")
        
        if not cleaned_response:
            # Handle the empty response case
            return jsonify({"error": "The AI returned an empty response, possibly due to safety filters."}), 500

        match_data = json.loads(cleaned_response)
        # --- END OF NEW CODE ---

        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        c.execute('''
            INSERT INTO matches (candidate_id, job_id, match_score, explanation, job_skills, resume_skills)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (candidate_id, job['id'], match_data['match_score'], match_data['explanation'], json.dumps(match_data['job_skills']), json.dumps(match_data['resume_skills'])))
        conn.commit()
        conn.close()

        return jsonify(match_data)
    except Exception as e:
        return jsonify({"error": f"Failed to call API or save match: {str(e)}"}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True)