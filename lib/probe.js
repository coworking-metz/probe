import {execa} from 'execa'
import ms from 'ms'

function parseScanReportLine(line) {
  const withParenthesisResult = line.match(/Nmap scan report for (.+) \((.+)\)$/)

  if (withParenthesisResult) {
    return {ip: withParenthesisResult[2], name: withParenthesisResult[1]}
  }

  const withoutParenthesisResult = line.match(/Nmap scan report for (.+)$/)

  if (withoutParenthesisResult) {
    return {ip: withoutParenthesisResult[1]}
  }

  throw new Error('Unable to parse line')
}

function parseMACAddressLine(line) {
  const result = line.match(/MAC Address: (.+) \((.+)\)$/)

  if (result) {
    return {macAddress: result[1], vendor: result[2]}
  }

  throw new Error('Unable to parse line')
}

function parseDevices(string) {
  const devices = []
  let currentDevice

  string.split('\n').forEach(line => {
    if (line.startsWith('Nmap scan report')) {
      if (currentDevice) {
        devices.push(currentDevice)
      }

      const {ip, name} = parseScanReportLine(line)
      currentDevice = {ip, name}
    }

    if (line.startsWith('MAC Address:')) {
      const {macAddress, vendor} = parseMACAddressLine(line)
      Object.assign(currentDevice, {macAddress, vendor})
    }
  })

  if (currentDevice) {
    devices.push(currentDevice)
  }

  return devices
}

async function execNmap(range) {
  const result = await execa('nmap', ['-sP', range])

  if (result.exitCode !== 0) {
    throw new Error(`nmap returned code ${result.exitCode }`)
  }

  return parseDevices(result.stdout)
}

async function wrappedExecNmap(range) {
  try {
    return await execNmap(range)
  } catch (error) {
    console.error('Unable to run execNmap properly')
    console.error(error)
  }
}

export function startProbe(range) {
  const ctx = {range}

  async function updateDevices() {
    const devices = await wrappedExecNmap(range)
    if (devices) {
      console.log(`${devices.length} periphériques connectés`)
      ctx.devices = devices
    }
  }

  updateDevices()

  setInterval(() => {
    updateDevices()
  }, ms('1m'))

  return ctx
}
