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

// Registrar os componentes necessários do Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

// Definir cores padrão para os gráficos
const defaultColors = [
  "#4F46E5", // indigo
  "#0EA5E9", // sky
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EC4899", // pink
  "#8B5CF6", // violet
  "#6B7280", // gray
]

// Componente LineChart
export function LineChart({
  data,
  index,
  categories,
  colors = defaultColors,
  valueFormatter = (value) => value.toString(),
  className = "",
}) {
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return { labels: [], datasets: [] }

    const labels = data.map((item) => item[index])

    const datasets = categories.map((category, i) => ({
      label: category,
      data: data.map((item) => item[category] || 0),
      borderColor: colors[i % colors.length],
      backgroundColor: colors[i % colors.length] + "33", // Add transparency
      tension: 0.2,
      fill: false,
    }))

    return { labels, datasets }
  }, [data, index, categories, colors])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += valueFormatter(context.parsed.y)
            }
            return label
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => valueFormatter(value),
        },
      },
    },
  }

  return (
    <div className={className} style={{ position: "relative", height: "100%", width: "100%" }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

// Componente BarChart
export function BarChart({
  data,
  index,
  categories,
  colors = defaultColors,
  valueFormatter = (value) => value.toString(),
  className = "",
}) {
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return { labels: [], datasets: [] }

    const labels = data.map((item) => item[index])

    const datasets = categories.map((category, i) => ({
      label: category,
      data: data.map((item) => item[category] || 0),
      backgroundColor: colors[i % colors.length],
      borderColor: colors[i % colors.length],
      borderWidth: 1,
    }))

    return { labels, datasets }
  }, [data, index, categories, colors])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            let label = context.dataset.label || ""
            if (label) {
              label += ": "
            }
            if (context.parsed.y !== null) {
              label += valueFormatter(context.parsed.y)
            }
            return label
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => valueFormatter(value),
        },
      },
    },
  }

  return (
    <div className={className} style={{ position: "relative", height: "100%", width: "100%" }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}

// Componente DonutChart
export function DonutChart({
  data,
  index,
  category,
  colors = defaultColors,
  valueFormatter = (value) => value.toString(),
  className = "",
}) {
  const chartData = React.useMemo(() => {
    if (!data || !data.length) return { labels: [], datasets: [] }

    const labels = data.map((item) => item[index])
    const values = data.map((item) => item[category] || 0)

    return {
      labels,
      datasets: [
        {
          data: values,
          backgroundColor: colors.slice(0, values.length),
          borderColor: colors.slice(0, values.length),
          borderWidth: 1,
        },
      ],
    }
  }, [data, index, category, colors])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = context.raw || 0
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = Math.round((value / total) * 100)
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

// Manter compatibilidade com a API anterior
export const AreaChart = LineChart
