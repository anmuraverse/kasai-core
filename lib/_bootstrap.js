/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import ms from 'ms'
import { DEVELOPMENT } from './env'
import { LEVELS, STATES, system } from './system'

/**
 * Gracefully shutdowns service on signal event.
 * @param {'SIGHUP'|'SIGINT'|'SIGTERM'} signal - Signal
 * @returns {Promise<void>}
 * @listens NodeJS.Process~SIGHUP
 * @listens NodeJS.Process~SIGINT
 * @listens NodeJS.Process~SIGTERM
 * @inner
 */
async function shutdown (signal) {
  let message
  switch (signal) {
    case 'SIGHUP': {
      message = `${system} is being interrupted.`
      break
    }
    case 'SIGINT': {
      message = `${system} is being interrupted.`
      break
    }
    case 'SIGTERM': {
      message = `${system} is being interrupted.`
      break
    }
  }
  system.report(message, LEVELS.WARNING)
  if (system.state === STATES.RUNNING) await system.stop()
  await system.close()
}

process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
process.once('SIGHUP', shutdown)

/* istanbul ignore next */
if (DEVELOPMENT) {
  // Emitted by Nodemon to restart process.
  process.once('SIGUSR2', async function handleRestart () {
    system.warn(`${system} is being restarted.`, 'SIGUSR2')
    if (system.state === STATES.RUNNING) await system.stop()
    await system.close()
    process.kill(process.pid, 'SIGUSR2')
  })
}

/* istanbul ignore next */
process.once('beforeExit',
  /**
   * @external NodeJS
   * @ignore
   */
  /**
   * @external Process
   * @memberof NodeJS
   * @ignore
   */
  /**
   * @event beforeExit
   * @memberof NodeJS.Process
   * @ignore
   */
  /**
   * Handles `beforeExit` event.
   * @returns {Promise<void>}
   * @listens NodeJS.Process~event:beforeExit
   * @inner
   */
  async function handleBeforeExit () {
    await system.close()
  })

process.on('warning',
  /**
   * Handles `warning` event.
   * @param {Error} warning - Warning Exception
   * @listens NodeJS.Process~warning
   * @inner
   */
  function handleWarning (warning) {
    system.report(warning, LEVELS.WARNING)
  })

process.on('exit',
  /**
   * Handles `exit` event.
   * @param {number} code - Exit Code
   * @listens NodeJS.Process~exit
   * @inner
   */
  function handleExit (code) {
    const uptime = process.uptime()
    const period = ms(process.uptime() * 1000, { long: true })
    const exited = code ? `exited with code ${code}` : 'exited'
    const message = `${system} has ${exited} after ${period} of uptime.`
    if (code) system.warn({ uptime, code }, message, 'exit')
    else system.info({ uptime }, message, 'exit')
  })
