import './style.css'


import roslib from 'roslib'

const inputLinearX = document.getElementById("input-linear-x")
const inputLinearY = document.getElementById("input-linear-y")
const inputLinearZ = document.getElementById("input-linear-z")
const inputAngularX = document.getElementById("input-angular-x")
const inputAngularY = document.getElementById("input-angular-y")
const inputAngularZ = document.getElementById("input-angular-z")
const button = document.getElementById("velocity-button")
const buttonAuto = document.getElementById("btn-auto")
const buttonManual = document.getElementById("btn-manual")
const buttonClearLogs = document.getElementById("clear-logs-btn")
const statusText = document.getElementById("status")
const logsEl = document.getElementById("logs")

let connected = false
const ros = new roslib.Ros({
  url: 'ws://localhost:9090'
})
ros.on('error', function (error) {
  console.log(error);
  statusText.innerText = 'Error'
  statusText.classList.add('text-error')
});
ros.on('connection', function () {
  console.log('Connection made!');
  connected = true
  statusText.innerText = 'Connected'
  statusText.classList.add('text-ok')
});

const velocityTopic = new roslib.Topic({
  ros: ros,
  name: '/man_cmd_vel',
  messageType: 'geometry_msgs/Twist'
})

const changeModeService = new roslib.Service({
  ros: ros,
  name: '/change_mode',
  serviceType: 'overlord100_msgs/ChangeMode'
});

const logsTopic = new roslib.Topic({
  ros: ros,
  name: '/logs',
  messageType: 'overlord100_msgs/LogMessage'
})

button.addEventListener("click", () => {
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

  velocityTopic.publish(new roslib.Message(data))
})

buttonAuto.addEventListener("click", () => {
  const req = new roslib.ServiceRequest({ mode: 1 });
  console.log("Setting manual mode...")
  changeModeService.callService(req, (res) => {
    console.log("Set manual mode response:", res)
  });
})

buttonManual.addEventListener("click", () => {
  const req = new roslib.ServiceRequest({ mode: 0 });
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
