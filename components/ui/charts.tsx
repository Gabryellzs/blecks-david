"use client"

import React from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import { Line, Bar, Doughnut } from "react-chartjs-2"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
)

/** Paleta padrão (20 cores) — usada como fallback */
const defaultColors = [
  "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981",
  "#EC4899", "#6366F1", "#14B8A6", "#EAB308",
  "#F97316", "#84CC16", "#06B6D4", "#A855F7",
  "#F43F5E", "#22C55E", "#0EA5E9", "#D946EF",
  "#CA8A04", "#4ADE80", "#FACC15", "#2DD4BF",
]

/* =========================
   LineChart
========================= */
export function LineChart({
  data,
  index,
  categories,
  colors = defaultColors,
  valueFormatter = (value: any) => String(value ?? 0),
  className = "",
  showLegend = true,
  legendPosition = "top",
}) {
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return { labels: [], datasets: [] }

    const labels = data.map((item: any) => item[index])

    const datasets = categories.map((category: string, i: number) => ({
      label: category,
      data: data.map((item: any) => item?.[category] ?? 0),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + "33",
      tension: 0.2,
      fill: false,
    }))

    return { labels, datasets }
  }, [data, index, categories, colors])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: !!showLegend, position: legendPosition as any },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ""
            if (label) label += ": "
            if (context.parsed.y !== null) label += valueFormatter(context.parsed.y)
            return label
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: any) => valueFormatter(v) } },
    },
  }

  return (
    <div className={className} style={{ position: "relative", height: "100%", width: "100%" }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

/* =========================
   BarChart
========================= */

type ColorsByLabel = Record<string, string>

export function BarChart({
  data,
  index,
  categories,
  colors = defaultColors,
  /** 👇 NOVO: mapa label->cor (ex.: { Pepper: "#FF4500" }) */
  colorsByLabel,
  valueFormatter = (value: any) => String(value ?? 0),
  className = "",
  showLegend = true,
  legendPosition = "top",
}: {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  colorsByLabel?: ColorsByLabel
  valueFormatter?: (v: any) => string
  className?: string
  showLegend?: boolean
  legendPosition?: "top" | "left" | "bottom" | "right"
}) {
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return { labels: [], datasets: [] }

    const labels: string[] = data.map((item: any) => item[index])

    // 1 categoria → cor por barra
    if (categories && categories.length === 1) {
      const category = categories[0]
      const base = colors && colors.length > 1 ? colors : defaultColors

      const perBarColors = labels.map((label, i) => {
        // 1) prioridade: cores por label (plataforma)
        if (colorsByLabel && colorsByLabel[label]) return colorsByLabel[label]
        // 2) se veio um array de cores do mesmo tamanho, usa direto
        if (Array.isArray(colors) && colors.length === labels.length) return colors[i]
        // 3) fallback cíclico
        return base[i % base.length]
      })

      return {
        labels,
        datasets: [
          {
            label: category,
            data: data.map((item: any) => item?.[category] ?? 0),
            backgroundColor: perBarColors,
            borderColor: perBarColors,
            borderWidth: 1,
          },
        ],
      }
    }

    // várias categorias → 1 cor por categoria
    const datasets = categories.map((category: string, i: number) => ({
      label: category,
      data: data.map((item: any) => item?.[category] ?? 0),
      backgroundColor: colors[i % colors.length],
      borderColor: colors[i % colors.length],
      borderWidth: 1,
    }))

    return { labels, datasets }
  }, [data, index, categories, colors, colorsByLabel])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: !!showLegend, position: legendPosition as any },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || ""
            if (label) label += ": "
            if (context.parsed.y !== null) label += valueFormatter(context.parsed.y)
            return label
          },
        },
      },
    },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: any) => valueFormatter(v) } },
    },
  }

  return (
    <div className={className} style={{ position: "relative", height: "100%", width: "100%" }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

/* =========================
   DonutChart
========================= */
export function DonutChart({
  data,
  index,
  category,
  colors = defaultColors,
  valueFormatter = (value: any) => String(value ?? 0),
  className = "",
  showLegend = true,
  legendPosition = "right",
}) {
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return { labels: [], datasets: [] }

    const labels = data.map((item: any) => item[index])
    const values = data.map((item: any) => item?.[category] ?? 0)
    const palette = colors && colors.length > 1 ? colors : defaultColors

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: values.map((_: any, i: number) => palette[i % palette.length]),
          borderColor: values.map((_: any, i: number) => palette[i % palette.length]),
          borderWidth: 1,
        },
      ],
    }
  }, [data, index, category, colors])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: !!showLegend, position: legendPosition as any },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0)
            const percentage = total ? Math.round((value / total) * 100) : 0
            return `${label}: ${valueFormatter(value)} (${percentage}%)`
          },
        },
      },
    },
    cutout: "70%",
  }

  return (
    <div className={className} style={{ position: "relative", height: "100%", width: "100%" }}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}

export const AreaChart = LineChart
