let canvas = document.getElementById("Display");
let context = canvas.getContext('2d', { willReadFrequently: true });
let size = document.getElementById("size");
let temp = document.getElementById("temp");
let coupling = document.getElementById("coupling");
let field = document.getElementById("field");
let frames = document.getElementById("update");
let button = document.getElementById("Start");
let cur_energy = document.getElementById("Energy")
let energy_var = document.getElementById("Energy_Var")
let cur_mag = document.getElementById("Mag")
let mag_var = document.getElementById("Mag_Var")
let grid = []
let sim_flag = false;
var worker;

worker = new Worker('/js/Ising/IsingGen.js');
worker.postMessage({ msg: "fill", size: size.value, temp: temp.value, frames: frames.value, canvas_w: canvas.width, canvas_h: canvas.height });
worker.onmessage = e => {
  context.putImageData(e.data.image, 0, 0);
  grid = e.data.grid;
}
const ctx = document.getElementById('chart1');
const ctx2 = document.getElementById('chart2');

let next_label = 0;
var EnergyChart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: 'My Energy',
      data: [],
      pointRadius: 0,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    events: [],
    plugins: {
    legend: {
      display: false
    }
  },
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          text: "Energy",
          display: true
        }
      },
      x: {
        display: false
      }
    }
  }
});

var MagnetizationChart = new Chart(ctx2, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: 'Magnetization',
      data: [],
      pointRadius: 0,
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    events: [],
    plugins: {
    legend: {
      display: false
    }
  },
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          text: "Magnetization",
          display: true
        }
      },
      x: {
        display: false
      }
    }
  }
});


// Update tempurature
function update_temp() {
  let val = document.getElementById("temp_disp");
  val.textContent = `Temp: ${document.getElementById("temp").value}`;
  if (sim_flag) {
    
    worker.terminate();
    worker = new Worker('/js/Ising/IsingGen.js');
    var img = context.getImageData(0, 0, canvas.width, canvas.height);
    update(img);
  }
}

// Update coupling
function update_coupling() {
  let val = document.getElementById("coupling_disp");
  val.textContent = `Coupling: ${document.getElementById("coupling").value}`;
  if (sim_flag) {
    
    worker.terminate();
    worker = new Worker('/js/Ising/IsingGen.js');
    var img = context.getImageData(0, 0, canvas.width, canvas.height);
    update(img);
  }
}

// Update field
function update_field() {
  let val = document.getElementById("field_disp");
  val.textContent = `Field: ${document.getElementById("field").value}`;
  if (sim_flag) {
    
    worker.terminate();
    worker = new Worker('/js/Ising/IsingGen.js');
    var img = context.getImageData(0, 0, canvas.width, canvas.height);
    update(img);
  }
}

// Update frames
function update_frames() {
  let val = document.getElementById("update_disp");
  val.textContent = `Steps Per Cycle: ${document.getElementById("update").value}`;
  if (sim_flag) {
    
    worker.terminate();
    worker = new Worker('/js/Ising/IsingGen.js');
    var img = context.getImageData(0, 0, canvas.width, canvas.height);
    update(img);
  }
};

// Update size
function update_size() {
  let val = document.getElementById("size_disp");
  val.textContent = `Size ${document.getElementById("size").value}`;
  worker.terminate();
  worker = new Worker('/js/Ising/IsingGen.js');
  worker.postMessage({ msg: "fill", size: size.value, temp: temp.value, frames: frames.value, canvas_w: canvas.width, canvas_h: canvas.height });
  worker.onmessage = e => {
    context.putImageData(e.data.image, 0, 0);
    grid = e.data.grid;
    worker.terminate();
    worker = new Worker('/js/Ising/IsingGen.js');
    if (sim_flag) {
      
      var img = context.getImageData(0, 0, canvas.width, canvas.height);
      update(img);
    }
  }
};

// Use to toggle simulation on and off
function toggle_button() {
  worker.terminate();
  if (sim_flag) {
    sim_flag = false;
    button.textContent = "Start";
    worker = new Worker('/js/Ising/IsingGen.js');
  }
  else {
    sim_flag = true;
    button.textContent = "Pause";
    worker = new Worker('/js/Ising/IsingGen.js');
    var img = context.getImageData(0, 0, canvas.width, canvas.height);
    update(img);
  }
}

function addData(chart, label, data) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
      dataset.data.push(data);
  });
  chart.update("none");
}

function removeData(chart) {
  chart.data.labels.shift();
  chart.data.datasets.forEach((dataset) => {
      dataset.data.shift();
  });
  chart.update("none");
}

function update(img){
  worker.postMessage({ msg: "sim", image: img, grid: grid, size: size.value, temp: temp.value, coupling: coupling.value, field: parseFloat(field.value), frames: frames.value, canvas_w: canvas.width, canvas_h: canvas.height });
  worker.onmessage = e => {
    context.putImageData(e.data.image, 0, 0);
    grid = e.data.grid;
    let cur_energy = document.getElementById("Energy")
let energy_var = document.getElementById("Energy_Var")
let cur_mag = document.getElementById("Mag")
let mag_var = document.getElementById("Mag_Var")
// update energy chart
    if (EnergyChart.data.labels.length >= 1000){
      removeData(EnergyChart);
    }
    addData(EnergyChart,next_label, e.data.energy);
    cur_energy.textContent = "Energy: "+ e.data.energy.toFixed(3);
    energy_var.textContent = "Variance: "+ e.data.energy_var.toFixed(3);
    cur_mag.textContent = "Magnetization: "+ e.data.mag.toFixed(3);
    mag_var.textContent = "Variance: "+ e.data.mag_var.toFixed(3);

// update Magnetization
  if (MagnetizationChart.data.labels.length >= 1000){
    removeData(MagnetizationChart);
  }
  addData(MagnetizationChart,next_label, e.data.mag);
  next_label+= 1;
  }
}