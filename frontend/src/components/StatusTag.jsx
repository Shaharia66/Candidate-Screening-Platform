export function JobStatusTag({ status }) {
  const cls = status === 'open' ? 'tag-open' : 'tag-closed'
  return (
    <span className={`tag ${cls}`}>
      <span className="dot" />
      {status}
    </span>
  )
}

export function ApplicationStatusTag({ status }) {
  return (
    <span className={`tag status-${status}`}>
      <span className="dot" />
      {status}
    </span>
  )
}
