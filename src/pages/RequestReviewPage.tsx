import { useState } from 'react'
import { useAgentSimulator } from '../agent/useAgentSimulator'
import { isActivityVisible } from '../agent/activity'
import { AgentActivityPanel } from '../components/assistant/AgentActivityPanel'
import { AssistantPanel } from '../components/assistant/AssistantPanel'
import { CsvBatchFlow } from '../components/csv/CsvBatchFlow'
import { ActiveProfileCard } from '../components/layout/ActiveProfileCard'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { RequestHistory } from '../components/request/RequestHistory'
import { Modal } from '../components/ui/Modal'
import { getProfile } from '../data/mockData'

interface RequestReviewPageProps {
  profileId: string
  onViewRequests: () => void
}

export function RequestReviewPage({ profileId, onViewRequests }: RequestReviewPageProps) {
  const [csvOpen, setCsvOpen] = useState(false)
  const { snapshot, ...actions } = useAgentSimulator(profileId)
  const profile = getProfile(snapshot.profileId)

  return (
    <div className="dashboard request-page">
      <div className="request-page__header">
        <DashboardHeader
          title="Request a Review"
          subtitle="Ask customers for feedback without the busywork."
        />
        {profile ? <ActiveProfileCard profile={profile} /> : null}
      </div>
      <div
        className={
          isActivityVisible(snapshot.activity) ? 'workbench workbench--split' : 'workbench'
        }
      >
        <AssistantPanel
          snapshot={snapshot}
          actions={actions}
          onUploadCsv={() => setCsvOpen(true)}
        />
        {isActivityVisible(snapshot.activity) ? (
          <AgentActivityPanel steps={snapshot.activity} />
        ) : null}
      </div>
      <RequestHistory profileId={snapshot.profileId} limit={3} title="Recent requests" />

      {profile ? (
        <Modal
          open={csvOpen}
          title="Upload multiple requests"
          description="Add a CSV and the assistant will validate and prepare the list."
          onClose={() => setCsvOpen(false)}
        >
          <CsvBatchFlow
            profile={profile}
            onViewRequests={() => {
              setCsvOpen(false)
              onViewRequests()
            }}
            onTalkToAi={() => setCsvOpen(false)}
          />
        </Modal>
      ) : null}
    </div>
  )
}
