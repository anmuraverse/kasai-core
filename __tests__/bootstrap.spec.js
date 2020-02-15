/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import test from 'ava'
import sinon from 'sinon'
import { system } from '../lib'

test.before(spec => {
  spec.context.infoSpy = sinon.spy(system, 'info')
  spec.context.warnSpy = sinon.spy(system, 'warn')
  spec.context.stopSpy = sinon.spy(system, 'stop')
  spec.context.closeSpy = sinon.spy(system, 'close')
  spec.context.reportSpy = sinon.spy(system, 'report')
})

test.beforeEach(spec => {
  spec.context.infoSpy.resetHistory()
  spec.context.warnSpy.resetHistory()
  spec.context.stopSpy.resetHistory()
  spec.context.closeSpy.resetHistory()
  spec.context.reportSpy.resetHistory()
})

test.serial('exit', async spec => {
  const { infoSpy, warnSpy } = spec.context

  /**
   * @type {function}
   * @ignore
   */
  const handleExit = process.listeners('exit')
    .find(fn => fn.name === 'handleExit')
  spec.true(typeof handleExit === 'function')

  spec.notThrows(() => handleExit(0))
  spec.true(infoSpy.calledOnce)
  spec.false(warnSpy.called)

  spec.notThrows(() => handleExit(1))
  spec.true(infoSpy.calledOnce)
  spec.true(warnSpy.calledOnce)
})

test.serial('SIGHUP', async spec => {
  const { reportSpy, stopSpy, closeSpy } = spec.context

  /**
   * @type {function}
   * @ignore
   */
  const shutdown = process.listeners('SIGHUP')
    .find(fn => fn.name === 'shutdown')
  spec.true(typeof shutdown === 'function')
  await spec.notThrowsAsync(shutdown('SIGHUP'))
  spec.true(reportSpy.calledOnce)
  spec.false(stopSpy.calledOnce)
  spec.true(closeSpy.calledOnce)
})

test.serial('SIGINT', async spec => {
  const { reportSpy, stopSpy, closeSpy } = spec.context

  /**
   * @type {function}
   * @ignore
   */
  const shutdown = process.listeners('SIGINT')
    .find(fn => fn.name === 'shutdown')
  spec.true(typeof shutdown === 'function')
  await spec.notThrowsAsync(shutdown('SIGINT'))
  spec.true(reportSpy.calledOnce)
  spec.false(stopSpy.calledOnce)
  spec.true(closeSpy.calledOnce)
})

test.serial('SIGTERM', async spec => {
  const { reportSpy, stopSpy, closeSpy } = spec.context

  /**
   * @type {function}
   * @ignore
   */
  const shutdown = process.listeners('SIGTERM')
    .find(fn => fn.name === 'shutdown')
  spec.true(typeof shutdown === 'function')
  await spec.notThrowsAsync(shutdown('SIGTERM'))
  spec.true(reportSpy.calledOnce)
  spec.false(stopSpy.calledOnce)
  spec.true(closeSpy.calledOnce)

  await system.start()
  await spec.notThrowsAsync(shutdown('SIGTERM'))
  spec.true(reportSpy.calledTwice)
  spec.true(stopSpy.calledOnce)
  spec.true(closeSpy.calledTwice)
})

test.serial('warning', async spec => {
  const { reportSpy } = spec.context

  /**
   * @type {function}
   * @ignore
   */
  const handleWarning = process.listeners('warning')
    .find(fn => fn.name === 'handleWarning')
  spec.true(typeof handleWarning === 'function')
  spec.notThrows(() => handleWarning('warning'))
  spec.true(reportSpy.calledOnce)
})
