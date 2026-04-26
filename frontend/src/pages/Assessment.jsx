import { useState, useEffect, useRef } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { sendAnswer } from '../api/client.js'

function TypingText({ text, onDone }) {
  const [displayed, setDisplayed] = useState('')
  const [done, setDone]           = useState(false)
  const i = useRef(0)

  useEffect(() => {
    setDisplayed('')
    setDone(false)
    i.current = 0
    const interval = setInterval(() => {
      i.current++
      setDisplayed(text.slice(0, i.current))
      if (i.current >= text.length) {
        clearInterval(interval)
        setDone(true)
        onDone?.()
      }
    }, 18)
    return () => clearInterval(interval)
  }, [text])

  return (
    <span>
      {displayed}
      {!done && <span className="cursor" />}
    </span>
  )
}

export default function Assessment() {
  const { sessionId } = useParams()
  const location      = useLocation()
  const navigate      = useNavigate()
  const chatEndRef    = useRef(null)

  const initial = location.state || {}

  const [skills,       setSkills]       = useState(initial.skills || [])
  const [skillIndex,   setSkillIndex]   = useState(initial.skill_index ?? 0)
  const [totalSkills,  setTotalSkills]  = useState(initial.total_skills ?? 0)
  const [currentSkill, setCurrentSkill] = useState(initial.current_skill || '')
  const [messages,     setMessages]     = useState([])
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [isComplete,   setIsComplete]   = useState(false)
  const [typingDone,   setTypingDone]   = useState(false)

  // Seed the first question
  useEffect(() => {
    if (initial.first_question) {
      setMessages([{ role: 'ai', text: initial.first_question, skill: initial.current_skill }])
    }
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading || !typingDone) return

    setInput('')
    setTypingDone(false)
    const userMsg = { role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      const { data } = await sendAnswer(sessionId, trimmed)

      const aiMessages = []

      if (data.message) {
        aiMessages.push({ role: 'ai', text: data.message, skill: currentSkill })
      }
      if (data.next_question) {
        aiMessages.push({ role: 'ai', text: data.next_question, skill: data.current_skill, isQuestion: true })
      }

      setMessages(prev => [...prev, ...aiMessages])
      setSkillIndex(data.skill_index)
      if (data.current_skill) setCurrentSkill(data.current_skill)

      if (data.is_complete) {
        setIsComplete(true)
        setTimeout(() => navigate(`/results/${sessionId}`), 2800)
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: '⚠ Connection error. Please check the backend and try again.',
        isError: true,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const progressPct = totalSkills > 0 ? Math.round((skillIndex / totalSkills) * 100) : 0

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 61px)',
      maxWidth: 900,
      margin: '0 auto',
      padding: '0 24px',
    }}>

      {/* ── Top Bar ── */}
      <div style={{
        padding: '20px 0 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Now assessing
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>
              {isComplete ? '✓ Complete' : currentSkill || '—'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {skills.map((skill, i) => (
              <div key={skill} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <div
                  className={`dot ${
                    i < skillIndex ? 'dot-done' :
                    i === skillIndex ? 'dot-active' : 'dot-pending'
                  }`}
                />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 9,
                  color: i === skillIndex ? 'var(--cyan)' : i < skillIndex ? 'var(--green)' : 'var(--text-muted)',
                  maxWidth: 60,
                  textAlign: 'center',
                  lineHeight: 1.3,
                }}>
                  {skill.length > 10 ? skill.slice(0, 9) + '…' : skill}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${isComplete ? 100 : progressPct}%` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
            Skill {Math.min(skillIndex + 1, totalSkills)} of {totalSkills}
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)' }}>
            {isComplete ? 100 : progressPct}%
          </span>
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '24px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {/* System header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          color: 'var(--text-muted)',
        }}>
          <span style={{ color: 'var(--green)' }}>●</span>
          SkillSync AI — Session {sessionId?.slice(0, 8)}…
          <span style={{ marginLeft: 'auto', color: 'var(--cyan)' }}>{skills.length} skills loaded</span>
        </div>

        {messages.map((msg, idx) => {
          const isLast = idx === messages.length - 1
          return (
            <div
              key={idx}
              className="animate-fade-up"
              style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 12,
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 12,
                fontWeight: 700,
                background: msg.role === 'ai' ? 'var(--surface)' : 'rgba(0,229,255,0.15)',
                border: `1px solid ${msg.role === 'ai' ? 'var(--border)' : 'var(--cyan)'}`,
                color: msg.role === 'ai' ? 'var(--cyan)' : 'var(--cyan)',
              }}>
                {msg.role === 'ai' ? 'AI' : 'U'}
              </div>

              {/* Bubble */}
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.role === 'user' ? 'rgba(0,229,255,0.1)' : 'var(--surface)',
                border: `1px solid ${
                  msg.isError ? 'rgba(255,69,96,0.3)' :
                  msg.isQuestion ? 'var(--cyan)' :
                  msg.role === 'user' ? 'rgba(0,229,255,0.25)' : 'var(--border)'
                }`,
                boxShadow: msg.isQuestion ? 'var(--shadow-cyan)' : 'none',
              }}>
                {msg.role === 'ai' && msg.skill && msg.isQuestion && (
                  <div style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 10,
                    color: 'var(--cyan)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                    fontWeight: 700,
                  }}>
                    ⚡ {msg.skill}
                  </div>
                )}
                <div style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: msg.isError ? 'var(--red)' : 'var(--text)',
                  fontFamily: msg.role === 'ai' ? 'var(--font-ui)' : 'var(--font-mono)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.role === 'ai' && isLast && !loading ? (
                    <TypingText
                      text={msg.text}
                      onDone={() => setTypingDone(true)}
                    />
                  ) : (
                    msg.text
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Loading indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--cyan)',
            }}>AI</div>
            <div style={{
              padding: '12px 16px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px 12px 12px 4px',
              display: 'flex', gap: 6, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--cyan)',
                  animation: `blink 1.2s ${i * 0.2}s ease-in-out infinite`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Completion */}
        {isComplete && (
          <div className="animate-fade-up card card-accent" style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontSize: 18, marginBottom: 8, color: 'var(--cyan)' }}>Assessment Complete!</h3>
            <p style={{ color: 'var(--text-soft)', fontSize: 14 }}>
              Generating your personalised skill gap report…
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
              <span className="spinner" style={{ width: 24, height: 24 }} />
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* ── Input Bar ── */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: '16px 0 20px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <textarea
            id="chat-input"
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder={isComplete ? 'Assessment complete…' : 'Type your answer… (Enter to send, Shift+Enter for newline)'}
            disabled={loading || isComplete}
            style={{
              flex: 1,
              minHeight: 52,
              maxHeight: 140,
              resize: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              lineHeight: 1.6,
              padding: '14px 16px',
            }}
            rows={1}
          />
          <button
            id="send-btn"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={loading || isComplete || !input.trim()}
            style={{ flexShrink: 0, alignSelf: 'flex-end', height: 52 }}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Send →'}
          </button>
        </div>
        <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
          Be honest — the AI adapts its questions based on your answers
        </div>
      </div>
    </main>
  )
}
