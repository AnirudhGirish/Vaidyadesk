interface PageHeaderProps {
    title: string
    subtitle?: string
    action?: React.ReactNode
    breadcrumb?: string
}

export function PageHeader({ title, subtitle, action, breadcrumb }: PageHeaderProps) {
    return (
        <div className="flex items-start justify-between mb-8">
            <div>
                {breadcrumb && (
                    <p
                        className="text-xs uppercase tracking-wider mb-1"
                        style={{ color: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}
                    >
                        {breadcrumb}
                    </p>
                )}
                <h1
                    className="text-3xl font-semibold"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)' }}
                >
                    {title}
                </h1>
                {subtitle && (
                    <p
                        className="text-sm mt-1"
                        style={{ color: 'rgba(44,44,44,0.6)', fontFamily: 'var(--font-sans)' }}
                    >
                        {subtitle}
                    </p>
                )}
            </div>
            {action && <div className="flex items-center gap-3">{action}</div>}
        </div>
    )
}
