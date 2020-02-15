/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import test from 'ava'
import { STATES, system } from '../../lib/system'

function Plugin (spec, name, options) {
  const { initializer, activator, terminator } = options || {}

  this.initialized = false
  this.activated = false
  this.terminated = false
  this.optionsProcessed = false

  if (initializer !== false) {
    this.initialize = (options) => {
      if (initializer === 'throw') {
        throw new Error('Initializer failed.')
      }
      this.optionsProcessed = !!options
      this.initialized = true
    }
  }

  if (activator !== false) {
    this.activate = async () => {
      spec.log(`Activating ${name}...`)
      await new Promise((resolve, reject) => {
        if (activator === 'throw') {
          spec.log(`Activator for ${name} failed.`)
          return reject(new Error(`Activator for ${name} failed.`))
        }
        this.activated = true
        spec.log(`Activated ${name}!`)
        return resolve()
      })
    }
  }

  if (terminator !== false) {
    this.terminate = async () => {
      spec.log(`Terminating ${name}...`)
      await new Promise((resolve, reject) => {
        if (terminator === 'throw') {
          spec.log(`Terminator for ${name} failed.`)
          return reject(new Error(`Terminator for ${name} failed.`))
        }
        this.terminated = true
        spec.log(`Terminated ${name}!`)
        return resolve()
      })
    }
  }
}

test.afterEach(() => {
  system._plugins.clear()
  system._state = STATES.STOPPED
})

test('.toString', async spec => {
  const { SERVICE_NAME } = process.env
  spec.is(system.toString(), SERVICE_NAME)
  spec.is(`Name: ${system}`, `Name: ${SERVICE_NAME}`)
})

test.serial('.state', async spec => {
  spec.is(system.state, STATES.STOPPED)
})


test.serial('.register', async spec => {
  const plugin = new Plugin(spec, 'Echo')
  spec.false(plugin.initialized)
  spec.false(plugin.optionsProcessed)
  spec.false(plugin.activated)
  spec.false(plugin.terminated)

  spec.is(system.register(plugin, {}), system)
  spec.true(plugin.initialized)
  spec.true(plugin.optionsProcessed)
  spec.false(plugin.activated)
  spec.false(plugin.terminated)

  await spec.notThrowsAsync(system.start())
  spec.is(system.state, STATES.RUNNING)
  spec.true(plugin.activated)
  spec.false(plugin.terminated)

  await spec.notThrowsAsync(system.stop())
  spec.is(system.state, STATES.STOPPED)
  spec.true(plugin.terminated)
})

test.serial('.register without options', async spec => {
  const plugin = new Plugin(spec, 'Alpha')
  spec.false(plugin.initialized)
  spec.false(plugin.optionsProcessed)

  spec.is(system.register(plugin), system)
  spec.true(plugin.initialized)
  spec.false(plugin.optionsProcessed)
})

test.serial('.register without initializer', async spec => {
  const plugin = new Plugin(spec, 'Bravo', { initializer: false })
  spec.false(plugin.initialized)
  spec.false(plugin.optionsProcessed)

  spec.throws(() => system.register(plugin, {}))
  spec.is(system.register(plugin), system)
  spec.false(plugin.initialized)
  spec.false(plugin.optionsProcessed)
})

test.serial('.register without activator', async spec => {
  const plugin = new Plugin(spec, 'Foxtrot', { activator: false })
  spec.false(plugin.activated)

  spec.is(system.register(plugin), system)
  await spec.notThrowsAsync(system.start())
  spec.is(system.state, STATES.RUNNING)
  spec.false(plugin.activated)
})

test.serial('.register without terminator', async spec => {
  const plugin = new Plugin(spec, 'Golf', { terminator: false })
  spec.false(plugin.terminated)

  spec.is(system.register(plugin), system)
  await spec.notThrowsAsync(system.start())
  spec.is(system.state, STATES.RUNNING)
  await spec.notThrowsAsync(system.stop())
  spec.is(system.state, STATES.STOPPED)
  spec.false(plugin.terminated)
})

test.serial('.register with only initializer', async spec => {
  const plugin = new Plugin(spec, 'Hotel', { activator: false, terminator: false })

  spec.is(system.register(plugin), system)
  spec.false(system._plugins.has(plugin))
})

test.serial('.register without valid methods', async spec => {
  const plugin = new Plugin(spec, 'Charlie', { initializer: false, activator: false })
  spec.throws(() => system.register(plugin))
})

test.serial('.register where initializer throws', async spec => {
  const plugin = new Plugin(spec, 'Delta', { initializer: 'throw' })
  spec.throws(() => system.register(plugin))
})

test.serial('.register where activator throws', async spec => {
  const pluginA = new Plugin(spec, 'Indiana A')
  const pluginB = new Plugin(spec, 'Indiana B', { terminator: false })
  const pluginC = new Plugin(spec, 'Indiana C', { activator: 'throw' })
  spec.is(system.register(pluginA).register(pluginB).register(pluginC), system)
  await spec.notThrowsAsync(system.start())
  spec.is(system.state, STATES.STOPPED)
})

test.serial('.register where terminator throws', async spec => {
  const plugin = new Plugin(spec, 'Juliet', { terminator: 'throw' })
  spec.is(system.register(plugin), system)
  await spec.notThrowsAsync(system.start())
  spec.is(system.state, STATES.RUNNING)
  await spec.notThrowsAsync(system.stop())
  spec.is(system.state, STATES.STALLED)
})

test.serial('.register where activator then terminator throws', async spec => {
  const pluginA = new Plugin(spec, 'Kilo A', { terminator: 'throw' })
  const pluginB = new Plugin(spec, 'Kilo B', { activator: 'throw' })
  spec.is(system.register(pluginA).register(pluginB), system)
  await spec.notThrowsAsync(system.start())
  spec.is(system.state, STATES.STALLED)
})

test.serial('.start(); .stop(); close()', async spec => {
  spec.is(system.register(new Plugin(spec, 'Lima')), system)
  await spec.notThrowsAsync(system.start())
  spec.is(system.state, STATES.RUNNING)
  await spec.notThrowsAsync(system.start())
  spec.is(system.state, STATES.RUNNING)
  await spec.notThrowsAsync(system.stop())
  spec.is(system.state, STATES.STOPPED)
  await spec.notThrowsAsync(system.stop())
  spec.is(system.state, STATES.STOPPED)
  await spec.notThrowsAsync(system.close())
})
