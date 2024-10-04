#!/usr/bin/env node
import 'dotenv/config.js'

import process from 'node:process'

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'

import {startProbe} from './lib/probe.js'

const probeRange = process.env.PROBE_RANGE

const probe = startProbe(probeRange)

const app = express()

app.use(cors({origin: true}))
app.use(morgan('dev'))

function parseIp(str) {
  const result = str.match(/(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/)

  if (result) {
    return result[0]
  }
}

app.get('/info', (req, res) => {
  const ip = req.query.ip || parseIp(req.ip)

  if (!ip) {
    return res.status(500).send({code: 500, message: 'Impossible de déterminer l’adresse IP'})
  }

  const device = probe.devices.find(d => d.ip === ip)
  res.send({device})
})

app.get('/devices', (req, res) => {
  res.send(probe.devices)
})

const port = process.env.PORT || 5000

app.listen(port, () => {
  console.log(`Start listening on port ${port}`)
})
