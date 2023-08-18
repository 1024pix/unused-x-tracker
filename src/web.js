import Chart from 'chart.js/auto'
import DataTable from 'datatables.net-bs'
import 'datatables.net-bs/css/dataTables.bootstrap.css'
import * as data from '../data/**/*.json'

let table
let notUsedChart

function displayNav(features) {
  const nav = document.getElementById('nav')
  features.forEach((feature) => {
    const li = document.createElement('li')
    li.classList.add('nav-item')
    const link = document.createElement('a')
    link.classList.add('nav-link', 'd-flex')
    const line = feature
    link.setAttribute('href', `#${line}`)
    link.dataset.line = line
    link.textContent = feature
    link.addEventListener('click', () => {
      displayResult(feature)
      selectButton(feature)
    })
    li.appendChild(link)
    nav.appendChild(li)
  })
}

function selectButton(feature) {
  const links = document.querySelectorAll('[data-line]')
  links.forEach((link) => {
    link.classList.remove('active')
  })
  const link = document.querySelector(`[data-line="${feature}"]`)
  link.classList.add('active')
}

async function displayLastRun(data) {
  if (table)
    table.destroy()

  table = new DataTable('#rawResult', {
    paging: false,
    searching: true,
    info: false,
    columns: [
      { data: 'callNames', title: 'CallName', render: renderStringArray },
      { data: 'functions', title: 'Functions', render: renderStringArray },
    ],
    data,
  })
}

function renderStringArray(data, type) {
  if (type !== 'display')
    return data

  return data.join('<br>')
}

async function displayResult(feature) {
  displayTitle(feature)
  displaySummary(data[feature].history.at(-1))
  await displayLastRun(data[feature]['last-run'])
  displayChart(data[feature].history)
}

function displayTitle(feature) {
  const title = document.getElementById('title')
  title.textContent = feature
}

function displaySummary(history) {
  const result = document.getElementById('result')
  result.textContent = history.notUsedCount
}

function displayChart(history) {
  const notUsedCtx = document.getElementById('notUsedChart')
  if (notUsedChart)
    notUsedChart.destroy()

  const labels = history.map((d, i) => new Date(d.date).toLocaleDateString())
  const baseColor = [0, 63, 92]
  notUsedChart = new Chart(notUsedCtx, {
    data: {
      labels,
      datasets: [
        {
          type: 'line',
          label: 'Not used',
          data: history.map(d => d.notUsedCount),
          backgroundColor: `rgba(${baseColor.join()}, 0.2)`,
          borderColor: `rgba(${baseColor.join()}, 1)`,
          borderWidth: 1,
        },
      ],
    },
    options: {
      scales: {
        y: {
          position: 'left',
          beginAtZero: true,
          suggestedMin: 0,
        },
      },
    },
  })
}

function main() {
  const features = Object.keys(data).sort((a, b) => a.localeCompare(b))
  displayNav(features)
  let selectedFeature = features[0]
  if (location.hash.length > 0) {
    const hash = location.hash.slice(1)
    features.forEach((feature) => {
      if (feature === hash)
        selectedFeature = feature
    })
  }
  displayResult(selectedFeature)
  selectButton(selectedFeature)
}

main()
