/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import sinon from 'sinon'
import test from 'ava'
import { LEVELS, system } from '../../lib/system'

test.before(spec => {
  spec.context.debugSpy = sinon.spy(system, 'debug')
  spec.context.infoSpy = sinon.spy(system, 'info')
  spec.context.warnSpy = sinon.spy(system, 'warn')
  spec.context.errorSpy = sinon.spy(system, 'error')
  spec.context.criticalSpy = sinon.spy(system, 'critical')
  spec.context.fatalSpy = sinon.spy(system, 'fatal')
})

test.serial('.level', spec => {
  spec.is(system.level, LEVELS.SILENT)

  system.level = LEVELS.DEBUG
  spec.is(system.level, LEVELS.DEBUG)

  system.level = 'INFO'
  spec.is(system.level, LEVELS.INFO)

  system.level = 999
  spec.is(system.level, LEVELS.INFO)

  system.level = 'astronomical'
  spec.is(system.level, LEVELS.INFO)

  system.level = LEVELS.SILENT
})

test.serial('.debug', spec => {
  system.level = LEVELS.DEBUG
  spec.is(LEVELS.DEBUG, 6)
  spec.notThrows(() => system.debug('message'))
  system.level = LEVELS.SILENT
})

test.serial('.info', spec => {
  system.level = LEVELS.INFO
  spec.is(LEVELS.INFO, 5)
  spec.notThrows(() => system.info('message'))
  system.level = LEVELS.SILENT
})

test.serial('.warn', spec => {
  system.level = LEVELS.WARNING
  spec.is(LEVELS.WARNING, 4)
  spec.notThrows(() => system.warn('message'))
  system.level = LEVELS.SILENT
})

test.serial('.error', spec => {
  system.level = LEVELS.ERROR
  spec.is(LEVELS.ERROR, 3)
  spec.notThrows(() => system.error('message'))
  system.level = LEVELS.SILENT
})

test.serial('.critical', spec => {
  system.level = LEVELS.CRITICAL
  spec.is(LEVELS.CRITICAL, 2)
  spec.notThrows(() => system.critical('message'))
  system.level = LEVELS.SILENT
})

test.serial('.fatal', spec => {
  system.level = LEVELS.FATAL
  spec.is(LEVELS.FATAL, 1)
  spec.notThrows(() => system.fatal('message'))
  system.level = LEVELS.SILENT
})

test.serial('.silent', spec => {
  spec.is(LEVELS.SILENT, 0)
  spec.is(system.level, LEVELS.SILENT)
  spec.notThrows(() => system.debug('message'))
  spec.notThrows(() => system.info('message'))
  spec.notThrows(() => system.warn('message'))
  spec.notThrows(() => system.error('message'))
  spec.notThrows(() => system.critical('message'))
  spec.notThrows(() => system.fatal('message'))
})

test.serial('~log', spec => {
  system.level = LEVELS.DEBUG
  spec.is(
    system.debug('message').message,
    'message'
  )
  spec.deepEqual(
    system.debug('message', 'label').labels,
    ['LABEL']
  )
  spec.deepEqual(
    system.debug('message', ' ').labels,
    undefined
  )
  spec.deepEqual(
    system.debug('message', 'one', ' ', 'two').labels,
    ['ONE', 'TWO']
  )
  spec.is(
    system.debug({ message: 'message' }).message,
    'message'
  )
  spec.deepEqual(
    system.debug({ message: 'message' }, 'label').labels,
    ['LABEL']
  )
  spec.is(
    system.debug({ meta: 'data' }).meta,
    'data'
  )
  spec.is(
    system.debug({ meta: 'data' }, 'message').message,
    'message'
  )
  spec.deepEqual(
    system.debug({ meta: 'data' }, 'message', 'label').labels,
    ['LABEL']
  )
  spec.deepEqual(
    system.debug({ message: 'message', labels: ['one'] }, 'two').labels,
    ['ONE', 'TWO']
  )
  spec.deepEqual(
    system.debug({ labels: ['one', 'two'] }, 'message', 'two', 'three').labels,
    ['ONE', 'TWO', 'THREE']
  )
  system.level = LEVELS.SILENT
})
