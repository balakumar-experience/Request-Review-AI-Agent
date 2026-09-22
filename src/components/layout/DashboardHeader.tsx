interface DashboardHeaderProps {
  title: string
  subtitle: string
}

export function DashboardHeader({ title, subtitle }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </header>
  )
}
