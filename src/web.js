import DataTable from 'datatables.net-bs'
import 'datatables.net-bs/css/dataTables.bootstrap.css'
import lastRun from '../data/last-run-usecases-for-repositories.json'

let table

async function displayLastRun() {
  if (table)
    table.destroy()

  table = new DataTable('#rawResult', {
    paging: false,
    searching: false,
    info: false,
    columns: [
      { data: 'fileName', title: 'Repositories' },
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
