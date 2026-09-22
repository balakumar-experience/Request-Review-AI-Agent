import {
  BadgeCheck,
  Bell,
  ChevronRight,
  CircleHelp,
  FileText,
  Info,
  Link2,
  MessageSquare,
  PenLine,
  Play,
  Search,
  UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { User } from '../../auth/mockUsers'
import { getDashboardMetrics } from '../../data/dashboardMetrics'
import { ScoreGauge } from './ScoreGauge'

interface DashboardHomeProps {
  user: User
  onRequestReview: () => void
  onViewRequests: () => void
  onOpenProfile: () => void
  onOpenSettings: () => void
}

export function DashboardHome({
  user,
  onRequestReview,
  onViewRequests,
  onOpenProfile,
  onOpenSettings,
}: DashboardHomeProps) {
  const metrics = getDashboardMetrics(user.profileId)
  const subject = user.profileType === 'location' ? 'This location is' : 'You are'
  const scoreRatio = Math.min(metrics.searchRankScore / metrics.searchRankMax, 1)
  const [notice, setNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!notice) {
      return
    }
    const timer = window.setTimeout(() => setNotice(null), 2800)
    return () => window.clearTimeout(timer)
  }, [notice])

  return (
    <div className="home">
      {notice ? (
        <p className="home-toast" role="status">
          {notice}
        </p>
      ) : null}
      <div className="home-banner">
        <strong>The Next Era of Search Has Arrived</strong>
        <span>Customers are searching right now. Don’t get left out of the AI answers.</span>
        <button type="button" onClick={onOpenSettings}>
          Learn about AI Visibility →
        </button>
      </div>

      <div className="home-topbar">
        <p className="home-topbar__crumb">Dashboard</p>
        <div className="home-topbar__actions">
          <button
            type="button"
            className="home-icon-btn"
            aria-label="Search"
            onClick={() => setNotice('Search is visual-only in this prototype.')}
          >
            <Search size={15} />
          </button>
          <button type="button" className="home-topbar__help" onClick={onOpenSettings}>
            Help
          </button>
          <button
            type="button"
            className="home-icon-btn"
            aria-label="Notifications"
            onClick={onViewRequests}
          >
            <Bell size={15} />
          </button>
          <div className="home-topbar__viewer">
            <span className="home-topbar__avatar">{user.name.charAt(0)}</span>
            <span>
              <small>Viewing as</small>
              <strong>{user.name}</strong>
            </span>
          </div>
        </div>
      </div>

      <div className="home-grid">
        <div className="home-col">
          <section className="claim-card">
            <span className="claim-card__avatar">{user.name.charAt(0)}</span>
            <div>
              <p className="claim-card__title">
                Claimed User <BadgeCheck size={15} />
              </p>
              <p className="claim-card__text">
                {subject} ranked {metrics.rankPosition} of {metrics.rankTotal}{' '}
                {metrics.rankCategory} in {metrics.rankRegion}
              </p>
            </div>
          </section>

          <button
            type="button"
            className="home-ghost-btn"
            onClick={() => setNotice('Play Game is visual-only in this prototype.')}
          >
            <Play size={14} />
            Play Game
          </button>

          <section className="score-card">
            <ScoreGauge score={metrics.searchRankScore} max={metrics.searchRankMax} />
            <button type="button" className="home-primary-btn" onClick={onRequestReview}>
              Request Review
            </button>
          </section>

          <section className="studio-card">
            <p className="studio-card__title">
              Your AI Writing Studio <Info size={13} />
            </p>
            <div className="studio-card__score">
              <strong>{metrics.authorityScore}</strong>
              <span>Authority Score</span>
            </div>
            <div className="studio-card__stats">
              <span>
                <FileText size={14} /> Articles <strong>{metrics.articles}</strong>
              </span>
              <span>
                <MessageSquare size={14} /> Answers <strong>{metrics.answers}</strong>
              </span>
            </div>
            <button
              type="button"
              className="home-primary-btn"
              onClick={() => setNotice('Writing Studio is visual-only in this prototype.')}
            >
              <PenLine size={15} />
              Write Article
            </button>
          </section>
        </div>

        <div className="home-col">
          <section className="announce-card">Event / Feature Announcements</section>

          <section className="overview-card">
            <header className="overview-card__head">
              <p>
                Search Rank Score Overview <Info size={13} />
              </p>
              <p>
                <strong>{metrics.searchRankScore}</strong> of {metrics.searchRankMax} Possible
              </p>
            </header>

            <div className="overview-bar">
              <span style={{ width: `${Math.max(scoreRatio * 100, 4)}%` }} />
            </div>

            <ul className="overview-legend">
              <li className="overview-legend__item overview-legend__item--reviews">
                Reviews &amp; Replies
              </li>
              <li className="overview-legend__item overview-legend__item--profile">
                Profile Completion
              </li>
              <li className="overview-legend__item overview-legend__item--connections">
                Connections
              </li>
            </ul>

            <p className="overview-tip">
              <strong>Pro Tip:</strong> Earn upto <strong>300</strong> points towards your Search
              Rank Score by receiving and replying to reviews.
            </p>

            <div className="metric-cards">
              <button
                type="button"
                className="metric-card metric-card--reviews"
                onClick={onViewRequests}
              >
                <span className="metric-card__icon">
                  <MessageSquare size={15} />
                </span>
                <ChevronRight size={15} className="metric-card__chevron" />
                <p className="metric-card__title">
                  Reviews &amp; Replies <Info size={12} />
                </p>
                <p className="metric-card__value">
                  {metrics.reviewsToReply === 0
                    ? 'No recent reviews to reply'
                    : `${metrics.reviewsToReply} review${metrics.reviewsToReply === 1 ? '' : 's'} to reply`}
                </p>
              </button>

              <button
                type="button"
                className="metric-card metric-card--profile"
                onClick={onOpenProfile}
              >
                <span className="metric-card__icon">
                  <UserRound size={15} />
                </span>
                <ChevronRight size={15} className="metric-card__chevron" />
                <p className="metric-card__title">
                  Profile Completion <Info size={12} />
                </p>
                <p className="metric-card__value">
                  <strong>{metrics.incompleteProfileItems}</strong> incomplete items
                </p>
                <span className="metric-card__bar">
                  <span style={{ width: '38%' }} />
                </span>
              </button>

              <button
                type="button"
                className="metric-card metric-card--connections"
                onClick={() => setNotice('Connections are visual-only in this prototype.')}
              >
                <span className="metric-card__icon">
                  <Link2 size={15} />
                </span>
                <ChevronRight size={15} className="metric-card__chevron" />
                <p className="metric-card__title">
                  Connections <Info size={12} />
                </p>
                <p className="metric-card__value">
                  <strong>{metrics.connections}</strong> of {metrics.connectionsTotal} connections
                </p>
              </button>
            </div>
          </section>

          <div className="promo-cards">
            <article className="promo-card">
              <p className="promo-card__kicker">
                Boost Your Search Rank by up to 250 Points
                <span className="promo-card__points">+250</span>
              </p>
              <h3>Our AI Analysis of Your Personal Website</h3>
              <span className="promo-card__cta">UNLOCK MORE POINTS</span>
            </article>

            <article className="promo-card">
              <p className="promo-card__kicker">
                Earn 100 More Search Rank Points
                <span className="promo-card__points">+100</span>
              </p>
              <h3>Manage 50+ Profiles for Search, Social, Voice &amp; Map</h3>
              <span className="promo-card__cta">UNLOCK MORE POINTS</span>
            </article>
          </div>
        </div>
      </div>

      <button type="button" className="home-ask" onClick={onRequestReview}>
        <CircleHelp size={15} />
        Ask
      </button>
    </div>
  )
}
