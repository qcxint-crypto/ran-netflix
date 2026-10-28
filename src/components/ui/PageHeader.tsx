export default function PageHeader({
  title,
  subtitle,
  meta,
  children,
}: {
  title: string
  subtitle?: string
  /** Small count/annotation shown next to the title. */
  meta?: string
  children?: React.ReactNode
}) {
  return (
    <header className="mb-7 md:mb-9">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="rule-accent font-display text-2xl md:text-4xl font-extrabold text-text-primary">
            {title}
            {meta && <span className="ml-3 text-sm font-medium text-text-muted">{meta}</span>}
          </h1>
          {subtitle && <p className="text-sm text-text-secondary mt-2 max-w-2xl">{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  )
}
