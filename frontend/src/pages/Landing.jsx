import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadFiles, startAssessment } from '../api/client.js'

const SAMPLE_JD = `Senior Frontend Engineer

We are looking for a Senior Frontend Engineer to join our product team.

Requirements:
- 4+ years of experience with React.js and modern JavaScript (ES6+)
- Strong proficiency in TypeScript
- Experience with REST APIs and state management (Redux or Zustand)
- Proficiency in CSS/Tailwind and responsive design
- Familiarity with CI/CD pipelines and Git workflows
- Strong problem-solving skills and ability to work in an agile team`

export default function Landing() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [jdText,   setJdText]   = useState('')
  const [resume,   setResume]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [dragging, setDragging] = useState(false)

  const handleFile = (file) => {
    if (!file) return
    if (!['application/pdf', 'text/plain'].includes(file.type) && !file.name.endsWith('.pdf')) {
      setError('Please upload a PDF or plain-text resume.')
      return
    }
    setError('')
    setResume(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = async () => {
    if (!jdText.trim())   return setError('Please paste a job description.')
    if (!resume)          return setError('Please upload your resume.')
    setError('')
    setLoading(true)
    try {
      const { data: uploaded } = await uploadFiles(jdText, resume)
      const { data: started  } = await startAssessment(uploaded.session_id)
      navigate(`/assessment/${started.session_id}`, { state: started })
    } catch (e) {
      setError(e?.response?.data?.detail || 'Something went wrong. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 61px)', padding: '60px 24px 80px' }}>
      {/* ── Hero ── */}
      <div className="container" style={{ textAlign: 'center', marginBottom: 64 }}>
        <div className="animate-fade-up" style={{ animationDelay: '0s' }}>
          <span className="tag tag-cyan" style={{ marginBottom: 20, display: 'inline-flex' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', animation: 'pulse-ring 2s infinite' }} />
            AI-Powered Assessment
          </span>
        </div>

        <h1
          className="animate-fade-up"
          style={{
            fontSize: 'clamp(36px, 6vw, 72px)',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            animationDelay: '0.05s',
            marginBottom: 20,
          }}
        >
          Your resume claims it.<br />
          <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>We verify it.</span>
        </h1>

        <p
          className="animate-fade-up"
          style={{
            color: 'var(--text-soft)',
            fontSize: 18,
            maxWidth: 520,
            margin: '0 auto 40px',
            animationDelay: '0.1s',
          }}
        >
          Paste a job description, upload your resume — our AI agent
          will conversationally assess your real skills and build a
          personalised learning plan to close the gap.
        </p>

        {/* Stats Row */}
        <div
          className="animate-fade-up"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 32,
            marginBottom: 60,
            flexWrap: 'wrap',
            animationDelay: '0.15s',
          }}
        >
          {[
            { val: '4–6',   label: 'Skills Assessed' },
            { val: '3×',    label: 'Questions Per Skill' },
            { val: '100%',  label: 'AI-Powered' },
            { val: '<2 min',label: 'To Complete' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, fontWeight: 700, color: 'var(--cyan)' }}>
                {s.val}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500, marginTop: 2 }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form ── */}
      <div className="container animate-fade-up" style={{ animationDelay: '0.2s' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            maxWidth: 960,
            margin: '0 auto',
          }}
          className="upload-grid"
        >
          {/* JD Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Step 01
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 700 }}>Job Description</h2>
              </div>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 12, padding: '6px 14px' }}
                onClick={() => setJdText(SAMPLE_JD)}
              >
                Use Sample
              </button>
            </div>

            <textarea
              id="jd-input"
              className="input"
              style={{ flex: 1, minHeight: 280, fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7 }}
              placeholder="Paste the full job description here..."
              value={jdText}
              onChange={e => setJdText(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {jdText.trim().split(/\s+/).filter(Boolean).length} words
              </span>
              {jdText.length > 0 && (
                <span className="tag tag-green">✓ Ready</span>
              )}
            </div>
          </div>

          {/* Resume Panel */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Step 02
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Your Resume</h2>
            </div>

            <div
              id="resume-dropzone"
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                flex: 1,
                minHeight: 280,
                border: `2px dashed ${dragging ? 'var(--cyan)' : resume ? 'var(--green)' : 'var(--border-2)'}`,
                borderRadius: 'var(--radius)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: dragging ? 'rgba(0,229,255,0.04)' : resume ? 'rgba(0,200,150,0.04)' : 'transparent',
              }}
            >
              <input
                ref={fileRef}
                type="file"
                id="resume-file"
                accept=".pdf,.txt"
                style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])}
              />

              {resume ? (
                <>
                  <div style={{ fontSize: 40 }}>📄</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, color: 'var(--green)', fontSize: 14 }}>{resume.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      {(resume.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12, padding: '6px 14px' }}
                    onClick={e => { e.stopPropagation(); setResume(null) }}
                  >
                    Change file
                  </button>
                </>
              ) : (
                <>
                  <div style={{
                    width: 56, height: 56,
                    border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 24,
                  }}>
                    ↑
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>Drop your resume here</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      PDF or TXT — up to 10 MB
                    </div>
                  </div>
                  <span className="tag tag-cyan">Click to browse</span>
                </>
              )}
            </div>

            {resume && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <span className="tag tag-green">✓ Ready</span>
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            maxWidth: 960, margin: '16px auto 0',
            background: 'rgba(255,69,96,0.08)',
            border: '1px solid rgba(255,69,96,0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 16px',
            color: 'var(--red)',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
          }}>
            ⚠ {error}
          </div>
        )}

        {/* CTA */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
          <button
            id="start-assessment-btn"
            className="btn btn-primary btn-lg"
            onClick={handleSubmit}
            disabled={loading}
            style={{ minWidth: 240, justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Analysing with AI...
              </>
            ) : (
              <>
                <span>⚡</span>
                Start Assessment
              </>
            )}
          </button>
        </div>

        {/* How it works */}
        <div style={{ maxWidth: 960, margin: '64px auto 0' }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
              How it works
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>Three steps to clarity</h2>
          </div>

          <div className="grid-3">
            {[
              {
                step: '01',
                icon: '🔍',
                title: 'Skill Extraction',
                desc: 'AI reads the job description and identifies the 4–6 critical skills required for the role.',
                color: 'var(--cyan)',
              },
              {
                step: '02',
                icon: '💬',
                title: 'Conversational Assessment',
                desc: 'You\'re asked 3 adaptive, scenario-based questions per skill — no MCQs, just real conversation.',
                color: 'var(--violet)',
              },
              {
                step: '03',
                icon: '🗺️',
                title: 'Learning Plan',
                desc: 'Get a personalised roadmap with curated resources and realistic time estimates for every gap.',
                color: 'var(--green)',
              },
            ].map(item => (
              <div
                key={item.step}
                className="card"
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: item.color,
                    letterSpacing: '0.08em',
                  }}>
                    {item.step}
                  </span>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700 }}>{item.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-soft)', lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .upload-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </main>
  )
}
