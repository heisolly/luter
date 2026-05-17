import React, { useEffect } from 'react'
import { RiCheckboxCircleLine, RiCloseCircleLine, RiSparklingLine } from 'react-icons/ri'
import { useRealtimeRun } from '@trigger.dev/react-hooks'

export function AITaskProgress({ runId, taskName, onComplete }) {
  const { run } = useRealtimeRun(runId)

  useEffect(() => {
    if (run?.status === 'COMPLETED') onComplete?.(run.output)
  }, [run?.status, run?.output, onComplete])

  if (!run || run.status === 'COMPLETED') return null

  const status = run.metadata?.status ?? 'Starting...'
  const progress = run.metadata?.progress ?? 0
  const isFailed = run.status === 'FAILED'
  const Icon = isFailed ? RiCloseCircleLine : run.status === 'COMPLETED' ? RiCheckboxCircleLine : RiSparklingLine

  return (
    <div className="ws-ai-task-progress">
      <div className="ws-ai-task-header">
        <div className={isFailed ? 'is-failed' : ''}><Icon size={18} /></div>
        <div>
          <strong>{taskName}</strong>
          <span>{isFailed ? 'Something went wrong' : status}</span>
        </div>
      </div>
      <div className="ws-ai-task-bar"><i style={{ width: `${progress}%`, background: isFailed ? '#EF4444' : '#7C3AED' }} /></div>
      <div className="ws-ai-task-meta">
        <span>{isFailed ? 'Failed' : 'In progress'}</span>
        <b style={{ color: isFailed ? '#EF4444' : '#7C3AED' }}>{progress}%</b>
      </div>
    </div>
  )
}
