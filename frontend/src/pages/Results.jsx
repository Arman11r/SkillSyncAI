import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getReport } from '../api/client.js'

/* ── Radar Chart ─────────────────────────────────────────────────────────── */
function RadarChart({ skills }) {
  if (!skills || skills.length === 0) return null
  const N      = skills.length
  const cx     = 160
  const cy     = 160
  const maxR   = 120
  const levels = [1, 2, 3, 4, 5]

  const angleFor = (i) => (Math.PI * 2 * i) / N - Math.PI / 2

  const pointAt = (value, i, scale = 1) => {
    const r = (value / 5) * maxR * scale
    return {
      x: cx + r * Math.cos(angleFor(i)),
      y: cy + r * Math.sin(angleFor(i)),
    }
  }

  const toPath = (points) =>
    points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  const requiredPts = skills.map((s, i) => pointAt(s.required_level, i))
  const assessedPts = skills.map((s, i) => pointAt(s.assessed_level, i))

  return (
    <svg viewBox="0 0 320 320" style={{ width: '100%', maxWidth: 320 }}>
      {/* Grid rings */}
      {levels.map(lv => (
        <polygon
          key={lv}
          points={Array.from({ length: N }, (_, i) => {
            const p = pointAt(lv, i)
            return `${p.x},${p.y}`
          }).join(' ')}
          fill="none"
          stroke="var(--border-2)"
          strokeWidth="1"
        />
      ))}

      {/* Axis lines */}
      {skills.map((_, i) => {
        const p = pointAt(5, i)
        return (
          <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y}
            stroke="var(--border-2)" strokeWidth="1" />
        )
      })}

      {/* Required area */}
      <path d={toPath(requiredPts)} fill="rgba(123,47,190,0.15)" stroke="var(--violet)" strokeWidth="1.5" />

      {/* Assessed area */}
      <path d={toPath(assessedPts)} fill="rgba(0,229,255,0.12)" stroke="var(--cyan)" strokeWidth="2" />

      {/* Assessed dots */}
      {assessedPts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--cyan)" />
      ))}

      {/* Labels */}
      {skills.map((s, i) => {
        const p   = pointAt(5.6, i)
        const anchor = p.x < cx - 5 ? 'end' : p.x > cx + 5 ? 'start' : 'middle'
        return (
          <text
            key={i} x={p.x} y={p.y}
            textAnchor={anchor}
            dominantBaseline="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--text-soft)"
          >
            {s.skill.length > 12 ? s.skill.slice(0, 11) + '…' : s.skill}
          </text>
        )
      })}
    </svg>
  )
}

/* ── Score Ring ──────────────────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const r          = 54
  const circ       = 2 * Math.PI * r
  const offset     = circ - (score / 100) * circ
  const color      = score >= 70 ? 'var(--green)' : score >= 45 ? 'var(--orange)' : 'var(--red)'

  return (
    <div className="score-ring" style={{ width: 140, height: 140 }}>
      <svg viewBox="0 0 120 120" width="140" height="140">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border-2)" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)', transform: 'rotate(-90deg)', transformOrigin: '60px 60px' }}
        />
      </svg>
      <div className="score-ring-value" style={{ color }}>
        {score}
        <div className="score-ring-label">Match</div>
      </div>
    </div>
  )
}

/* ── Skill Assessment Card ───────────────────────────────────────────────── */
function SkillCard({ assessment }) {
  const { skill, required_level, assessed_level, gap, notes } = assessment
  const barColor = gap === 0 ? 'var(--green)' : gap <= 1 ? 'var(--orange)' : 'var(--red)'

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{skill}</h3>
        <span className={`tag ${gap === 0 ? 'tag-green' : gap <= 1 ? 'tag-orange' : 'tag-red'}`}>
          {gap === 0 ? '✓ Match' : `Gap: ${gap}`}
        </span>
      </div>

      {/* Level bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[
          { label: 'Required', value: required_level, color: 'var(--violet)' },
          { label: 'Assessed', value: assessed_level, color: barColor },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{label}</span>
              <span style={{ fontSize: 11, color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{value}/5</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(value / 5) * 100}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-soft)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: 10 }}>
        {notes}
      </p>
    </div>
  )
}

/* ── Learning Plan Card ──────────────────────────────────────────────────── */
function LearningCard({ plan, index }) {
  const [open, setOpen] = useState(index === 0)

  const priorityMap = {
    high:   { label: 'HIGH PRIORITY',   cls: 'tag-red'    },
    medium: { label: 'MED PRIORITY',    cls: 'tag-orange' },
    low:    { label: 'LOW PRIORITY',    cls: 'tag-cyan'   },
  }
  const p = priorityMap[plan.priority] || priorityMap.medium

  const typeIcon = { course: '🎓', documentation: '📚', book: '📖', project: '🛠', video: '🎬' }

  return (
    <div className="card" style={{ border: open ? '1px solid var(--border-2)' : '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none', color: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', padding: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--text-muted)', minWidth: 20,
          }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-mono)' }}>{plan.skill}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              {plan.total_time_estimate} · {plan.resources.length} resources
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className={`tag ${p.cls}`}>{p.label}</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 18, transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>
            ⌄
          </span>
        </div>
      </button>

      {open && (
        <div className="animate-fade-in" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plan.resources.map((res, i) => (
            <a
              key={i}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                textDecoration: 'none',
                transition: 'border-color 0.18s, transform 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--cyan)'; e.currentTarget.style.transform = 'translateX(4px)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
            >
              <span style={{ fontSize: 22, flexShrink: 0 }}>
                {typeIcon[res.type] || '🔗'}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {res.title}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <span className="tag tag-cyan" style={{ fontSize: 10, padding: '2px 7px' }}>{res.type}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ⏱ {res.time_estimate}
                  </span>
                </div>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 16, flexShrink: 0 }}>↗</span>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Results Page ────────────────────────────────────────────────────────── */
export default function Results() {
  const { sessionId } = useParams()
  const navigate      = useNavigate()

  const [report,  setReport]  = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  useEffect(() => {
    getReport(sessionId)
      .then(({ data }) => setReport(data))
      .catch(e => setError(e?.response?.data?.detail || 'Failed to load report.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 61px)', gap: 16 }}>
      <span className="spinner" style={{ width: 40, height: 40, borderWidth: 3 }} />
      <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
        Generating your personalised report…
      </p>
    </div>
  )

  if (error) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 61px)', gap: 12 }}>
      <div style={{ color: 'var(--red)', fontSize: 14, fontFamily: 'var(--font-mono)' }}>⚠ {error}</div>
      <button className="btn btn-ghost" onClick={() => navigate('/')}>← Start Over</button>
    </div>
  )

  const { candidate_summary, overall_match_score, skills_assessment, learning_plan } = report

  return (
    <main style={{ padding: '48px 24px 80px' }}>
      <div className="container">

        {/* ── Header ── */}
        <div className="animate-fade-up" style={{ marginBottom: 48 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
            Assessment Complete
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            Your Skill Report
          </h1>
          <p style={{ color: 'var(--text-soft)', maxWidth: 560, fontSize: 15, lineHeight: 1.7 }}>
            {candidate_summary}
          </p>
        </div>

        {/* ── Overview Row ── */}
        <div
          className="animate-fade-up"
          style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: 24,
            marginBottom: 48,
            alignItems: 'start',
          }}
        >
          {/* Score */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: 32 }}>
            <ScoreRing score={overall_match_score} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Job Match Score</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                {overall_match_score >= 70 ? 'Strong fit' : overall_match_score >= 45 ? 'Moderate fit' : 'Needs work'}
              </div>
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
              onClick={() => navigate('/')}
            >
              ← New Assessment
            </button>
          </div>

          {/* Radar */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700 }}>Skill Radar</h2>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--violet)' }}>
                  <span style={{ width: 12, height: 2, background: 'var(--violet)', display: 'inline-block' }} />
                  Required
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--cyan)' }}>
                  <span style={{ width: 12, height: 2, background: 'var(--cyan)', display: 'inline-block' }} />
                  Assessed
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RadarChart skills={skills_assessment} />
            </div>
          </div>
        </div>

        {/* ── Skill Cards ── */}
        <div className="animate-fade-up" style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>
            Skill-by-Skill Breakdown
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 12 }}>
              {skills_assessment.length} skills assessed
            </span>
          </h2>
          <div className="grid-2">
            {skills_assessment.map(s => (
              <SkillCard key={s.skill} assessment={s} />
            ))}
          </div>
        </div>

        {/* ── Learning Plan ── */}
        <div className="animate-fade-up">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
              Personalised Learning Plan
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-muted)', fontWeight: 400, marginLeft: 12 }}>
                {learning_plan.length} skills to develop
              </span>
            </h2>
            {learning_plan.length === 0 && (
              <span className="tag tag-green">✓ No gaps found!</span>
            )}
          </div>

          {learning_plan.length === 0 ? (
            <div className="card card-accent" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
              <h3 style={{ fontSize: 18, color: 'var(--green)', marginBottom: 8 }}>Excellent match!</h3>
              <p style={{ color: 'var(--text-soft)', fontSize: 14 }}>
                Your assessed skills meet all the requirements for this role.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {learning_plan
                .sort((a, b) => {
                  const order = { high: 0, medium: 1, low: 2 }
                  return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
                })
                .map((plan, i) => (
                  <LearningCard key={plan.skill} plan={plan} index={i} />
                ))}
            </div>
          )}
        </div>

        {/* ── Footer CTA ── */}
        <div style={{ marginTop: 64, padding: '32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Ready to apply for another role?</h3>
            <p style={{ fontSize: 13, color: 'var(--text-soft)' }}>Run a new assessment with a different job description.</p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('/')}>
            ⚡ New Assessment
          </button>
        </div>

      </div>
    </main>
  )
}
