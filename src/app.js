import Chart from 'chart.js/auto'

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unidtbqbxtfomrccrisi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaWR0YnFieHRmb21yY2NyaXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTg4MTYsImV4cCI6MjEwNTMzNDgxNn0.rN6NyP05myolqMuDhbMl1b2E-U9igzDuYRIMidck5cs'; // long string, not a secret
const supabase = createClient(supabaseUrl, supabaseAnonKey);


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

const newWeights = await loadSavedWeights();
const allWeights = hardcodedWeights.concat(newWeights); // original hard-coded data plus newly added weight values

/*--- Load weight data ---*/
async function loadSavedWeights() {
  const { data, error } = await supabase
    .from('weight_entries') // weight_entries table in supabase - defined in supabase web portal
    .select('*')
    .order('date')
  if (error) {
    console.error(error);
    return [];
  }
  return data;
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

popupDeleteBtn.addEventListener('click', async () => {
  if (selectedIndex === null) return;
  const newWeightsIndex = selectedIndex - hardcodedWeights.length;

  if (newWeightsIndex >= 0) {
    const entry = newWeights[newWeightsIndex];
    await supabase.from('weight_entries').delete().eq('id', entry.id);
    newWeights.splice(newWeightsIndex, 1);
  }
  removeData(chart, selectedIndex);
  closePopup();
});

/*--- Button for adding a weight and date ---*/
const weightInput = document.getElementById('new-weight');
const dateInput = document.getElementById('new-weight-date');
const addWeightBtn = document.getElementById('add-weight');

dateInput.value = new Date().toISOString().slice(0, 10);

addWeightBtn.addEventListener('click', async () => {
    const value = parseFloat(weightInput.value);
    if (Number.isNaN(value)) return;
    if (!dateInput.value) return;
    const label = new Date(dateInput.value + 'T00:00:00').toLocaleDateString();
    
    const { data, error } = await supabase
      .from('weight_entries')
      .insert({ date: label, weight: value})
      .select();
    
      if (error) {
        console.error(error);
        return;
      }

    newWeights.push(data[0]);
    addData(chart, label, value);
    weightInput.value = '';
});

})();
