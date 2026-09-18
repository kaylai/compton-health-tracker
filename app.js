import Chart from 'chart.js/auto'
import 'chartjs-adapter-date-fns';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unidtbqbxtfomrccrisi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVuaWR0YnFieHRmb21yY2NyaXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3NTg4MTYsImV4cCI6MjEwNTMzNDgxNn0.rN6NyP05myolqMuDhbMl1b2E-U9igzDuYRIMidck5cs'; // long string, not a secret
const supabase = createClient(supabaseUrl, supabaseAnonKey);


(async function() {
  const hardcodedWeights = [
    // { date: 2010, weight: 10 }
  ];

const newWeights = await loadSavedWeights();
let sortedWeights = hardcodedWeights
  .concat(newWeights)
  .sort((a, b) => new Date(a.date) - new Date(b.date));

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

/*--- Define the chart ---*/
const chart = new Chart(
    document.getElementById('weight'),
    {
      type: 'line',
      options: {
        animation: false,
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day'
            },
            title: {
              display: true,
              text: 'Date'
            }
          }
        },
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
        datasets: [
          {
            label: 'Weight over time',
            data: sortedWeights.map(row => ({ x: new Date(row.date), y: row.weight }))
          }
        ]
      }
    }
  );

function renderChart() {
  sortedWeights = hardcodedWeights
    .concat(newWeights)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  chart.data.datasets[0].data = sortedWeights.map(row => ({ x: new Date(row.date), y: row.weight }));
  chart.update();
}


/*--- Define a popup overlay for when a point is clicked ---*/
const popupOverlay = document.getElementById('popup-overlay');
const popupLabel = document.getElementById('popup-label');
const popupWeight = document.getElementById('popup-weight')
const popupDeleteBtn = document.getElementById('popup-delete-btn');
const popupCloseBtn = document.getElementById('popup-close-btn');

let selectedIndex = null;

function openPopup(index, x, y) {
  selectedIndex = index;
  const point = chart.data.datasets[0].data[index];
  popupLabel.textContent = `${point.x.toLocaleDateString()}`;
  popupWeight.textContent = `${point.y} lbs`;
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
  const entry = sortedWeights[selectedIndex];

  if (entry.id) {
    await supabase.from('weight_entries').delete().eq('id', entry.id);
    newWeights.splice(newWeights.indexOf(entry), 1);
  }
  renderChart();
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
    renderChart();
    weightInput.value = '';
});

})();
