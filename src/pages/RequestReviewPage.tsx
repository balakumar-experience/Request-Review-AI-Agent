import { useAgentSimulator } from '../agent/useAgentSimulator'
import { isActivityVisible } from '../agent/activity'
import { AgentActivityPanel } from '../components/assistant/AgentActivityPanel'
import { AssistantPanel } from '../components/assistant/AssistantPanel'
import { ActiveProfileCard } from '../components/layout/ActiveProfileCard'
import { DashboardHeader } from '../components/layout/DashboardHeader'
import { RequestHistory } from '../components/request/RequestHistory'
import { getProfile } from '../data/mockData'

interface RequestReviewPageProps {
  profileId: string
}

export function RequestReviewPage({ profileId }: RequestReviewPageProps) {
  const { snapshot, ...actions } = useAgentSimulator(profileId)
  const profile = getProfile(snapshot.profileId)

  return (
    <div className="dashboard">
      <DashboardHeader
        title="Request a Review"
        subtitle="Ask the assistant to prepare a review request."
      />
      {profile ? <ActiveProfileCard profile={profile} /> : null}
      <div
        className={
          isActivityVisible(snapshot.activity) ? 'workbench workbench--split' : 'workbench'
        }
      >
        <AssistantPanel snapshot={snapshot} actions={actions} />
        {isActivityVisible(snapshot.activity) ? (
          <AgentActivityPanel steps={snapshot.activity} />
        ) : null}
      </div>
      <RequestHistory profileId={snapshot.profileId} limit={8} />
    </div>
  )
}
