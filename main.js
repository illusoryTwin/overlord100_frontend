import './style.css'

import ROSLIB from 'roslib'

const inputLinearX = document.getElementById("input-linear-x")
const inputLinearY = document.getElementById("input-linear-y")
const inputLinearZ = document.getElementById("input-linear-z")
const inputAngularX = document.getElementById("input-angular-x")
const inputAngularY = document.getElementById("input-angular-y")
const inputAngularZ = document.getElementById("input-angular-z")
const velocityButton = document.getElementById("velocity-button")
const buttonAuto = document.getElementById("btn-auto")
const buttonManual = document.getElementById("btn-manual")
const buttonClearLogs = document.getElementById("clear-logs-btn")
const statusText = document.getElementById("status")
const logsEl = document.getElementById("logs")

/** @type {HTMLCanvasElement} */
const mapEl = document.getElementById("map")

const joystick = {
  forward: document.getElementById("joystick-btn-forward"),
  left: document.getElementById("joystick-btn-left"),
  right: document.getElementById("joystick-btn-right"),
  backward: document.getElementById("joystick-btn-backward"),
}

for (const [dir, btnEl] of Object.entries(joystick)) {
  console.log(dir, btnEl)
}

let connected = false
const ros = new ROSLIB.Ros({
  url: 'ws://localhost:9090'
})
ros.on('error', function (error) {
  console.log(error);
  statusText.innerText = 'Error'
  statusText.classList.add('text-error')
});
ros.on('connection', function () {
  console.log('Connection established!');
  connected = true
  statusText.innerText = 'Connected'
  statusText.classList.add('text-ok')
});

const velocityTopic = new ROSLIB.Topic({
  ros: ros,
  name: '/man_cmd_vel',
  messageType: 'geometry_msgs/Twist'
})

const changeModeService = new ROSLIB.Service({
  ros: ros,
  name: '/change_mode',
  serviceType: 'overlord100_msgs/ChangeMode'
});

const logsTopic = new ROSLIB.Topic({
  ros: ros,
  name: '/logs',
  messageType: 'overlord100_msgs/LogMessage'
})

var mapTopic = new ROSLIB.Topic({
  ros: ros,
  name: "/map",
  messageType: "nav_msgs/msg/OccupancyGrid",
});

velocityButton.addEventListener("click", () => {
  if (!connected) {
    alert('not connected')
  }

  const data = {
    linear: {
      x: Number(inputLinearX.value),
      y: Number(inputLinearY.value),
      z: Number(inputLinearZ.value),
    },
    angular: {
      x: Number(inputAngularX.value),
      y: Number(inputAngularY.value),
      z: Number(inputAngularZ.value),
    },
  }

  velocityTopic.publish(new ROSLIB.Message(data))
})

buttonAuto.addEventListener("click", () => {
  const req = new ROSLIB.ServiceRequest({ mode: 1 });
  console.log("Setting manual mode...")
  changeModeService.callService(req, (res) => {
    console.log("Set manual mode response:", res)
  });
})

buttonManual.addEventListener("click", () => {
  const req = new ROSLIB.ServiceRequest({ mode: 0 });
  console.log("Setting manual mode...")
  changeModeService.callService(req, (res) => {
    console.log("Set manual mode response:", res)
  });
})

/**
 * @param {({ level: number, node_name: string, message: string })} log 
 */
function receiveLog(log) {
  const entry = document.createElement("div")
  entry.classList.add("log-entry")

  const nodeName = document.createElement("span")
  nodeName.classList.add("log-entry_node")
  nodeName.innerText = `${log.node_name} `

  const level = document.createElement("span")
  level.classList.add("log-entry_level")
  level.innerText = `${log.level}\n`

  const content = document.createElement("span")
  content.innerText = log.message

  entry.appendChild(nodeName)
  entry.appendChild(level)
  entry.appendChild(content)

  logsEl.appendChild(entry)
}

function clearLogs() {
  logsEl.innerHTML = ""
}

logsTopic.subscribe((msg) => {
  receiveLog(msg)
})

buttonClearLogs.addEventListener("click", () => {
  clearLogs()
})

mapTopic.subscribe((message) => {
  console.log("[map] > ", message)
  drawMap(message)
})

function drawMap(map) {
  const canvas = mapEl;
  const ctx = canvas.getContext('2d');

  // Clear the canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const mapWidth = map.info.width;
  const mapHeight = map.info.height;
  const resolution = map.info.resolution;

  const canvasWidth = 800;
  const canvasHeight = 800;
  const scaleX = canvasWidth / mapWidth;
  const scaleY = canvasHeight / mapHeight;

  // Draw map
  const imageData = ctx.createImageData(mapWidth, mapHeight);
  for (let y = 0; y < mapHeight; y++) {
    for (let x = 0; x < mapWidth; x++) {
      const i = y * mapWidth + x;
      const value = map.data[i];
      const color = value === -1 ? 127 : value > 50 ? 0 : 255;
      const index = (y * mapWidth + x) * 4;
      imageData.data[index] = color;
      imageData.data[index + 1] = color;
      imageData.data[index + 2] = color;
      imageData.data[index + 3] = 255;
    }
  }

  // Scale the image data to fit the canvas
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = mapWidth;
  tempCanvas.height = mapHeight;
  const tempCtx = tempCanvas.getContext('2d');
  tempCtx.putImageData(imageData, 0, 0);

  ctx.save();
  ctx.scale(scaleX, scaleY);
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.restore();

  // Draw axes
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(0, canvas.height);
  ctx.strokeStyle = 'black';
  ctx.stroke();

  // Label axes
  ctx.fillStyle = 'black';
  ctx.fillText('X', canvas.width - 20, 20);
  ctx.fillText('Y', 20, canvas.height - 20);
}
