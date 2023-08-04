import DataTable from 'datatables.net-bs'
import 'datatables.net-bs/css/dataTables.bootstrap.css'
import lastRun from '../data/unused-repositories-functions-in-lib/last-run.json'

let table

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
    link.addEventListener('click', (e) => {
      displayResult({ repository, path })
      selectButton({ repository, path })
    })
    li.appendChild(link)
    nav.appendChild(li)
  })
}

async function displayLastRun() {
  if (table)
    table.destroy()

  table = new DataTable('#rawResult', {
    paging: false,
    searching: true,
    info: false,
    columns: [
      { data: 'callName', title: 'CallName' },
      {
        data: 'functions',
        title: 'Functions',
        render(data, type) {
          return type === 'display' ? data.join('<br>') : data
        },
      },
    ],
    data: lastRun,
  })
}

function main() {
  displayLastRun()
}

main()
