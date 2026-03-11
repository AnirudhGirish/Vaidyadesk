'use client'
import {
    BarChart, Bar, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts'

interface ChartDataPoint {
    day: string
    revenue: number
}

interface ReportsChartsProps {
    chartData: ChartDataPoint[]
}

export default function ReportsCharts({ chartData }: ReportsChartsProps) {
    if (chartData.length === 0) return null

    return (
        <div className="card p-6 mb-6">
            <h3
                className="font-semibold mb-5"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--color-forest-700)', fontSize: '1.1rem' }}
            >
                Revenue Trend
            </h3>
            <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-warm-200)" vertical={false} />
                    <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}
                        axisLine={false} tickLine={false}
                    />
                    <YAxis
                        tick={{ fontSize: 11, fill: 'rgba(44,44,44,0.5)', fontFamily: 'var(--font-sans)' }}
                        axisLine={false} tickLine={false}
                        tickFormatter={v => `₹${(Number(v) / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                        formatter={(v: unknown) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Revenue']}
                        contentStyle={{ background: 'white', border: '1px solid var(--color-warm-200)', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="revenue" fill="var(--color-forest-600)" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
