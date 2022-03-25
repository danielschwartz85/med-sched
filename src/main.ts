import './style.css'

// eslint-disable-next-line no-unused-vars
enum EUnit {
  // eslint-disable-next-line no-unused-vars
  Capsules = 'Capsules',
  // eslint-disable-next-line no-unused-vars
  Drops = 'Drops',
  // eslint-disable-next-line no-unused-vars
  Milliliters = 'Milliliters',
}

const UnitViewMap = Object.freeze({
  [EUnit.Capsules]: "קפ'",
  [EUnit.Drops]: "טיפ'",
  [EUnit.Milliliters]: 'מ"ל',
})

interface IMed {
  name: string
  unit: EUnit
  morningAmount?: number
  noonAmount?: number
  afternoonAmount?: number
  eveningAmount?: number
  onceADayAmount?: number
  type: 'Homeopathy' | 'ProBiotics' | 'Bach' | 'Other'
  description?: string
}

const { medications: Medications, fromDate: FromDate, numOfDays: NumOfDays } = getConfiguration()
loadDates()
loadDay()

/*
 * TODO
 * fix last date
 * add reset
 * tooltip description
 * colours for types of medicine
 * colours for day competed or missing
 * url builder + builder page
 */

function loadDay(): void {
  const currentDate = getSelectedDate()
  const title: HTMLElement = <HTMLElement>document.getElementById('title')
  title.innerText = currentDate.toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'numeric',
    day: 'numeric',
  })

  loadTimeOfDay('morning')
  loadTimeOfDay('noon')
  loadTimeOfDay('afterNoon')
  loadTimeOfDay('evening')
}

function getSelectedDate(): Date {
  const sideBar: HTMLElement = <HTMLElement>document.getElementById('sidenav')
  const a: any = Array.from(sideBar.children).find((day) => day.classList.contains('selected'))
  const current = new Date(<string>a.getAttribute('value'))
  return current
}

function loadTimeOfDay(timeOfDay: string): void {
  const timeOfDayElement: HTMLElement = <HTMLElement>document.getElementById(timeOfDay)
  // If removed since no medications for this time of day
  if (!timeOfDayElement) {
    return
  }
  timeOfDayElement.innerHTML = ''
  const timeOfDayTake = Medications.filter((medication) => !!medication[<keyof IMed>`${timeOfDay}Amount`])
  for (const medicine of timeOfDayTake) {
    const div = loadMedicine({ ...medicine, amount: <number>medicine[<keyof IMed>`${timeOfDay}Amount`] })
    timeOfDayElement.appendChild(div)
    div.children[1].dispatchEvent(new Event('attached'))
  }
  // We remove time of day, since configuration is not suppose to change (on day selection)
  // and we assume each day in each time of day has the same medications
  if (!timeOfDayTake.length) {
    timeOfDayElement.previousElementSibling?.remove()
    timeOfDayElement.remove()
  }
}

function loadMedicine({
  name,
  description,
  amount,
  unit,
}: {
  name: string
  description?: string
  amount: number
  unit: EUnit
}): HTMLElement {
  const nameDiv = document.createElement('div')
  nameDiv.innerText = `${name} `
  if (description) {
    nameDiv.setAttribute('alt', description)
  }
  const unitSpan = document.createElement('span')
  unitSpan.innerText = `${amount} ${UnitViewMap[unit]}`
  unitSpan.className = 'amount'
  unitSpan.setAttribute('dir', 'rtl')
  const container = document.createElement('div')
  const checkbox = getCheckbox()
  container.appendChild(nameDiv)
  container.appendChild(checkbox)
  container.appendChild(unitSpan)
  if (description) {
    // TODO tooltip
  }
  return container
}

function selectMedicine(checkboxLabel: HTMLLabelElement): void {
  // let all attributes change in subtree before checking values..
  window.setTimeout(() => {
    const { currentValue, checkboxKey } = getCheckboxCurrentInfo(checkboxLabel)
    window.localStorage.setItem(checkboxKey, currentValue ? '1' : '0')
  }, 0)
}

function loadMedicineCheckbox(checkboxLabel: HTMLLabelElement): void {
  const { currentValue, checkboxKey } = getCheckboxCurrentInfo(checkboxLabel)
  const savedValue = window.localStorage.getItem(checkboxKey) === '1'
  if (savedValue !== currentValue) {
    // eslint-disable-next-line no-extra-semi
    ;(<HTMLInputElement>checkboxLabel.firstElementChild).checked = savedValue
  }
}

function getCheckboxCurrentInfo(checkboxLabel: HTMLLabelElement): {
  currentValue: boolean
  checkboxKey: string
} {
  const currentValue = (<HTMLInputElement>checkboxLabel.firstElementChild).checked
  const medicineName = (<HTMLDivElement>checkboxLabel.previousElementSibling).textContent?.replace(/\s+/g, '')
  const timeOfDay = (<HTMLParagraphElement>checkboxLabel.parentElement?.parentElement).id
  const currentDate = getSelectedDate().getTime()
  const checkboxKey = `${currentDate}:${timeOfDay}:${medicineName}`
  return { currentValue, checkboxKey }
}

function getCheckbox(): HTMLElement {
  const div = document.createElement('div')
  const html = `<label class="switch">
                  <input type="checkbox">
                  <span class="slider round"></span>
                </label>`
  div.innerHTML = html.trim()
  const label = <HTMLLabelElement>div.lastChild
  label.addEventListener('mouseup', () => {
    selectMedicine(label)
  })
  label.addEventListener('attached', () => {
    loadMedicineCheckbox(label)
  })
  return label
}

function loadDates(): void {
  const sideBar = document.getElementById('sidenav')
  const now = new Date()
  for (let day = 1; day <= NumOfDays; ++day) {
    const date = new Date(FromDate)
    date.setDate(date.getDate() + day)
    const a = document.createElement('a')
    a.href = `#${date.getTime()}`

    a.innerHTML = date.toLocaleDateString('en-GB', {
      weekday: 'long',
      month: 'numeric',
      day: 'numeric',
    })
    sideBar?.appendChild(a)
    a.onclick = selectDay
    a.setAttribute('value', date.toISOString())

    if (
      date.getFullYear() <= now.getFullYear() &&
      date.getMonth() <= now.getMonth() &&
      date.getDate() <= now.getDate()
    ) {
      a.className = 'past'
      date.getDate() === now.getDate() && a.classList.add('selected')
    }
  }
}

function selectDay(event: any): void {
  const sideBar: HTMLElement = <HTMLElement>document.getElementById('sidenav')
  const day: any = Array.from(sideBar.children).find((a) => a.classList.contains('selected'))
  day.classList.remove('selected')
  event.target.classList.add('selected')
  loadDay()
}

function getConfiguration(): { fromDate: Date; numOfDays: number; medications: IMed[] } {
  return {
    fromDate: new Date('2022-03-21T00:00:00.000Z'),
    numOfDays: 40,
    medications: [
      {
        name: 'אורגנו',
        morningAmount: 15,
        noonAmount: 15,
        eveningAmount: 15,
        type: 'Other',
        unit: EUnit.Drops,
      },
      {
        name: 'בריא לי - DS',
        morningAmount: 4,
        noonAmount: 4,
        eveningAmount: 4,
        type: 'Other',
        unit: EUnit.Milliliters,
      },
      {
        name: 'Allium Sativa',
        morningAmount: 2,
        noonAmount: 2,
        eveningAmount: 2,
        type: 'Other',
        unit: EUnit.Milliliters,
      },
      {
        name: 'קנדידן',
        morningAmount: 2,
        noonAmount: 2,
        eveningAmount: 2,
        type: 'Other',
        unit: EUnit.Capsules,
      },
      {
        name: 'פרוביוטיקה ביו-קאן',
        noonAmount: 2,
        type: 'ProBiotics',
        unit: EUnit.Capsules,
        description: 'שעה מצמחי המרפא, עם חצי כוס מים',
      },
      {
        name: 'Galphimia',
        morningAmount: 10,
        type: 'Homeopathy',
        unit: EUnit.Drops,
        description: 'לאכול רק אחרי חצי שעה',
      },
      {
        name: 'Nacl',
        eveningAmount: 10,
        type: 'Homeopathy',
        unit: EUnit.Drops,
        description: 'לאכול רק אחרי חצי שעה',
      },
    ],
  }
}
