var evt;
var context;
onmessage = event => {
  if (event.data.msg == "fill") {
    evt = event;
    fill();
    close();
  }
  if (event.data.msg == "sim") {
    let canvas = new OffscreenCanvas(event.data.canvas_w, event.data.canvas_h);
    context = canvas.getContext('2d', { willReadFrequently: true });
    context.putImageData(event.data.image,0,0);
    evt = event;
    simulate();
  }
}

function fill(){
  let canvas = new OffscreenCanvas(evt.data.canvas_w, evt.data.canvas_h);
  let size = evt.data.size;
  let grid = [];
  let context = canvas.getContext("2d");
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (Math.random() <= .5) {
        grid.push(-1);
      }
      else {
        grid.push(1);
      }
    }
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  let v_width = canvas.width / size;
  let v_height = canvas.height / size;
  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      if (grid[cell(i, j, size)] == 1) {
        context.fillStyle = "Orange";
      }
      else if (grid[cell(i, j, size)] == -1) {
        context.fillStyle = "Black";
      }
      context.fillRect(v_width * i, v_height * j, v_width, v_height);
    }
  }
  var img = context.getImageData(0, 0, canvas.width, canvas.height);
//  let img = canvas.transferToImageBitmap();
this.postMessage({grid: grid,image: img});

}

function cell(row, col, size) {
  return row * size + col;
};

function shade_square(row,col,evt,context){
  let size = evt.data.size;
  let grid = evt.data.grid;
  let v_width = evt.data.canvas_w/size;
  let v_height = evt.data.canvas_h/size;
  if(grid[cell(row,col,size)]==1){
    context.fillStyle = "Orange";
  }
  else if (grid[cell(row,col,size)]==-1){
    context.fillStyle = "Black";
  }
  context.fillRect(v_width*row,v_height*col,v_width,v_height);
}

function delta(row,col,evt){
  let size = evt.data.size;
  let grid = evt.data.grid;
  let top=0;
  let bot=0;
  let left=0;
  let right=0;
  if(row==0){top = grid[cell(size-1,col,size)];}
  else{top = grid[cell(row-1,col,size)];}
  if(row==(size-1)){bot = grid[cell(0,col,size)];}
  else{bot = grid[cell(row+1,col,size)];}
  if(col==0){left = grid[cell(row,size-1,size)];}
  else{left = grid[cell(row,col-1,size)];}
  if(col==(size-1)){right = grid[cell(row,0,size)];}
  else{right = grid[cell(row,col+1,size)];}
  return (2.0*evt.data.coupling*(top+bot+left+right)+evt.data.field)*grid[cell(row,col,size)];
}

function cur_energy(evt){
  let size = evt.data.size;
  let grid = evt.data.grid;
  let energies = new Array(size*size).fill(0);;
  for(let row=0; row< size; row++){
    for(let col=0; col< size; col++){
      if(row==0){top = grid[cell(size-1,col,size)];}
      else{top = grid[cell(row-1,col,size)];}
      if(row==(size-1)){bot = grid[cell(0,col,size)];}
      else{bot = grid[cell(row+1,col,size)];}
      if(col==0){left = grid[cell(row,size-1,size)];}
      else{left = grid[cell(row,col-1,size)];}
      if(col==(size-1)){right = grid[cell(row,0,size)];}
      else{right = grid[cell(row,col+1,size)];}
      energies[cell(row,col,size)] = -evt.data.coupling*grid[cell(row,col,size)]*(top+bot+left+right)-evt.data.field*grid[cell(row,col,size)];
    }
  }
  return energies;
}

function simulate(){
  var start = performance.now();
    for(let step=0;step<evt.data.frames;step++){
      var row = Math.floor(Math.random()*evt.data.size);
      var col = Math.floor(Math.random()*evt.data.size);
      dE = delta(row,col,evt);
      if (dE<=0){
        evt.data.grid[cell(row,col,evt.data.size)] *= -1;
      }
      else{
        if(Math.random()<Math.exp(-dE/evt.data.temp)) {
          evt.data.grid[cell(row,col,evt.data.size)] *= -1;
        }
      }
      shade_square(row,col,evt,context);
    }
    let statistics = calc_stats(evt);
    var end = performance.now();
    var img = context.getImageData(0, 0, evt.data.canvas_w, evt.data.canvas_h);
    this.postMessage({grid: evt.data.grid,image: img, energy: statistics[0], energy_var: statistics[1],mag: statistics[2], mag_var: statistics[3]});
    requestAnimationFrame(simulate);
//    self.setTimeout(simulate,1);
}

function calc_stats(event){
  let energy =  cur_energy(event);
  let avg_energy = 0;
  let energy_var = 0;
  let avg_mag = 0;
  let mag_var = 0;

  // average magnetization calc
  for(let index=0; index<event.data.grid.length; index++){
    avg_mag += event.data.grid[index];
  }
  avg_mag /= event.data.grid.length;

  // magnetization variance calc
  for(let index=0; index< event.data.grid.length; index++){
    let val = event.data.grid[index]-avg_mag;
    mag_var += val*val;
  }
  mag_var /= event.data.grid.length;

  // average energy calc
  for(let index=0; index< energy.length; index++){
    avg_energy += energy[index];
  }
  avg_energy /= energy.length;

  // energy variance calc
  for(let index=0; index< energy.length; index++){
    let inter = energy[index]-avg_energy;
    energy_var += inter*inter;
  }
  energy_var /= (energy.length);
  return [avg_energy,energy_var, avg_mag, mag_var];
}