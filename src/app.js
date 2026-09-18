import Chart from 'chart.js/auto'

(async function() {
  const hardcodedWeights = [
    { date: 2010, weight: 10 },
    { date: 2011, weight: 20 },
    { date: 2012, weight: 15 },
    { date: 2013, weight: 25 },
    { date: 2014, weight: 22 },
    { date: 2015, weight: 30 },
    { date: 2016, weight: 28 },
  ];

const storageKey = 'weightEntries';

const newWeights = loadNewWeights();
const allWeights = hardcodedWeights.concat(newWeights); // original hard-coded data plus newly added weight values

/*--- Load weight data ---*/
function loadNewWeights() {
  // try-catch block starts fresh w hard-coded data if the user-added entries are corrupted
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return []; 
  }
}

function saveNewWeights(entries) {
  localStorage.setItem(storageKey, JSON.stringify(entries));
}

/*--- Add or remove data to the chart ---*/
function addData(chart, label, newData) {
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push(newData);
    });
    chart.update();
}

function removeData(chart, index) {
    chart.data.labels.splice(index, 1);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.splice(index, 1);
    });
    chart.update();
}

/*--- Define the chart ---*/
const chart = new Chart(
    document.getElementById('weight'),
    {
      type: 'line',
      options: {
        animation: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            enabled: false
          }
        },
      },
      data: {
        labels: allWeights.map(row => row.date),
        datasets: [
          {
            label: 'Weight over time',
            data: allWeights.map(row => row.weight)
          }
        ]
      }
    }
  );

/*--- Define a popup overlay for when a point is clicked ---*/
const popupOverlay = document.getElementById('popup-overlay');
const popupLabel = document.getElementById('popup-label');
const popupWeight = document.getElementById('popup-weight')
const popupDeleteBtn = document.getElementById('popup-delete-btn');
const popupCloseBtn = document.getElementById('popup-close-btn');

let selectedIndex = null;

function openPopup(index, x, y) {
  selectedIndex = index;
  popupLabel.textContent = `${chart.data.labels[index]}`;
  popupWeight.textContent = `${chart.data.datasets[0].data[index]} lbs`;
  popupOverlay.style.left = `${x}px`;
  popupOverlay.style.top = `${y}px`;
  popupOverlay.classList.remove('hidden');
}

function closePopup() {
  popupOverlay.classList.add('hidden');
  selectedIndex = null;
}

chart.canvas.onclick = (evt) => {
  const clickedPoint = chart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, true);
  if (clickedPoint.length === 0) return;
  const rect = chart.canvas.getBoundingClientRect();
  const point = clickedPoint[0].element;
  openPopup(clickedPoint[0].index, rect.left + point.x, rect.top + point.y);
};

popupCloseBtn.addEventListener('click', closePopup);

popupDeleteBtn.addEventListener('click', () => {
  if (selectedIndex === null) return;
  const newWeightsIndex = selectedIndex - hardcodedWeights.length;
  if (newWeightsIndex >= 0) {
    newWeights.splice(newWeightsIndex, 1);
    saveNewWeights(newWeights);
  }
  removeData(chart, selectedIndex);
  closePopup();
});

/*--- Button for adding a weight and date ---*/
const weightInput = document.getElementById('new-weight');
const dateInput = document.getElementById('new-weight-date');
const addWeightBtn = document.getElementById('add-weight');

dateInput.value = new Date().toISOString().slice(0, 10);

addWeightBtn.addEventListener('click', () => {
    const value = parseFloat(weightInput.value);
    if (Number.isNaN(value)) return;
    if (!dateInput.value) return;
    const label = new Date(dateInput.value + 'T00:00:00').toLocaleDateString();
    newWeights.push({ date: label, weight: value});
    saveNewWeights(newWeights);
    addData(chart, label, value);
    weightInput.value = '';
});

})();
