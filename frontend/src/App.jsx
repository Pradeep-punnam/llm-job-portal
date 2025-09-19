import { useState, useEffect } from 'react';
import './App.css';

const styles = {
  container: { fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' },
  header: { fontSize: '2em', marginBottom: '20px', textAlign: 'center' },
  uploadSection: { background: '#f9f9f9', padding: '20px', borderRadius: '5px', border: '1px solid #ddd', marginBottom: '30px', textAlign: 'center' },
  uploadInput: { marginBottom: '10px' },
  uploadButton: { padding: '10px 20px', cursor: 'pointer' },
  extractedText: { marginTop: '20px', background: '#fff', padding: '15px', border: '1px solid #ccc', borderRadius: '5px', whiteSpace: 'pre-wrap', textAlign: 'left' },
  filtersContainer: { display: 'flex', gap: '20px', marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '5px' },
  jobList: { listStyle: 'none', padding: 0 },
  jobItem: { border: '1px solid #ddd', borderRadius: '5px', padding: '15px', marginBottom: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  jobTitle: { margin: '0 0 5px 0', fontSize: '1.2em', color: '#333' },
  companyInfo: { margin: '0 0 10px 0', color: '#555', fontWeight: 'bold' },
  jobBody: { marginTop: '10px', color: '#666' },
  matchButton: { marginTop: '15px', padding: '8px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
  matchResult: { marginTop: '15px', background: '#e9f7ef', padding: '10px', borderRadius: '4px', borderLeft: '4px solid #28a745' },
  skillList: { display: 'flex', flexWrap: 'wrap', gap: '8px', padding: 0, listStyle: 'none' },
  skill: { background: '#ddd', padding: '5px 10px', borderRadius: '12px', fontSize: '0.9em' }
};

function App() {
  const [jobs, setJobs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [candidateId, setCandidateId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [matchingJobId, setMatchingJobId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("All Locations");

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/jobs');
        const data = await response.json();
        const jobsWithMatchData = data.map(job => ({ ...job, matchResult: null }));
        setJobs(jobsWithMatchData);
      } catch (error) {
        console.error("Failed to fetch jobs from backend:", error);
      }
    };
    fetchJobs();
  }, []);

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Please select a PDF file first.");
      return;
    }
    setIsLoading(true);
    setResumeText("");
    setCandidateId(null);
    const formData = new FormData();
    formData.append('resume', selectedFile);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setResumeText(data.extracted_text);
        setCandidateId(data.candidate_id);
      } else {
        alert(data.error || "An error occurred during upload.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to connect to the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMatch = async (jobId) => {
    if (!candidateId) {
      alert("Please upload a resume first.");
      return;
    }
    setMatchingJobId(jobId);
    const jobToMatch = jobs.find(job => job.id === jobId);
    try {
      const response = await fetch('http://127.0.0.1:5000/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId: candidateId, job: jobToMatch }),
      });
      const matchData = await response.json();
      if (response.ok) {
        setJobs(jobs.map(job => (job.id === jobId ? { ...job, matchResult: matchData } : job)));
      } else {
        alert(matchData.error || "An error occurred during matching.");
      }
    } catch (error) {
      alert("Failed to get match result.");
    } finally {
      setMatchingJobId(null);
    }
  };

  const uniqueLocations = ["All Locations", ...new Set(jobs.map(job => job.location))];

  const filteredJobs = jobs.filter(job => {
    const titleMatch = job.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const locationMatch = locationFilter === "All Locations" || job.location === locationFilter;
    return titleMatch && locationMatch;
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>LLM Job Portal</h1>

      <div style={styles.uploadSection}>
        <h2>1. Upload Your Resume</h2>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={styles.uploadInput}
        />
        <button onClick={handleUpload} disabled={isLoading} style={styles.uploadButton}>
          {isLoading ? 'Processing...' : 'Upload & Extract Text'}
        </button>
        {resumeText && (
          <div style={styles.extractedText}>
            <strong>Resume text extracted successfully! (Candidate ID: {candidateId})</strong>
          </div>
        )}
      </div>

      <h1 style={styles.header}>2. Find Your Match</h1>

      <div style={styles.filtersContainer}>
        <input
          type="text"
          placeholder="Search by job title..."
          style={{ flex: 2, padding: '10px' }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          style={{ flex: 1, padding: '10px' }}
          onChange={(e) => setLocationFilter(e.target.value)}
        >
          {uniqueLocations.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>

      <ul style={styles.jobList}>
        {filteredJobs.map(job => (
          <li key={job.id} style={styles.jobItem}>
            <h2 style={styles.jobTitle}>{job.jobTitle}</h2>
            <p style={styles.companyInfo}>{job.company} - {job.location}</p>
            <p style={styles.jobBody}>{job.description}</p>
            <button onClick={() => handleMatch(job.id)} disabled={matchingJobId === job.id} style={styles.matchButton}>
              {matchingJobId === job.id ? 'Analyzing...' : 'Check Match'}
            </button>
            {job.matchResult && (
              <div style={styles.matchResult}>
                <h3>Match Score: {job.matchResult.match_score}%</h3>
                <p><strong>Explanation:</strong> {job.matchResult.explanation}</p>
                <strong>Your Skills:</strong>
                <ul style={styles.skillList}>
                  {job.matchResult.resume_skills.map(skill => <li key={skill} style={styles.skill}>{skill}</li>)}
                </ul>
                <strong style={{ marginTop: '10px', display: 'block' }}>Required Skills:</strong>
                <ul style={styles.skillList}>
                  {job.matchResult.job_skills.map(skill => <li key={skill} style={styles.skill}>{skill}</li>)}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;