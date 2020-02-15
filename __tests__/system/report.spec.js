/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import * as Sentry from '@sentry/node'
import test from 'ava'
import sinon from 'sinon'
import { ServiceError } from '../../lib/error'
import { CSP_REPORT_URI, LEVELS, system } from '../../lib/system'

test.before(spec => {
  spec.context.withScopeSpy = sinon.spy(Sentry, 'withScope')
  spec.context.captureExceptionSpy = sinon.spy(Sentry, 'captureException')
})

test.beforeEach(spec => {
  spec.context.withScopeSpy.resetHistory()
  spec.context.captureExceptionSpy.resetHistory()
})

test('CSP_REPORT_URI', spec => {
  const { SENTRY_ID, SENTRY_KEY } = process.env
  const uri =
    `https://sentry.io/api/${SENTRY_ID}/security/?sentry_key=${SENTRY_KEY}`
  spec.is(CSP_REPORT_URI, uri)
})

test.serial('system.report', async spec => {
  const {
    withScopeSpy,
    captureExceptionSpy
  } = spec.context

  // Sentry Event ID for status 500 or greater.
  const eventIdPattern = /[0-9a-z]{32}/

  // UUID for status less than 500.
  const uuidPattern =
    /[0-9a-z]{8}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{4}-[0-9a-z]{12}/

  let error = new ServiceError('message')
  let report = system.report(error, LEVELS.CRITICAL)
  spec.is(report.code, 'SRV_ERR')
  spec.is(report.message, 'An undisclosed error has occurred.')
  spec.regex(report.id, eventIdPattern)
  spec.is(report.status, 500)
  spec.is(report.title, 'Internal Server Error')

  error = new ServiceError({ code: 'invalid' })
  report = system.report(error)
  spec.is(report.code, 'invalid')

  error = new ServiceError('message').addLabels('test')
  report = system.report(error)
  spec.is(report.code, 'TEST_ERR')

  error = new ServiceError('message').addLabels('test')
  report = system.report(error, LEVELS.CRITICAL)
  spec.is(report.code, 'TEST_ERR')

  error = new ServiceError('message').addLabels('test')
  const level = LEVELS.FATAL
  report = system.report(error, {
    level,
    extras: { extraKey: 'extraValue' },
    tags: { tagKey: 'tagValue' },
    user: { id: 'id', ip_address: '127.0.0.1' }
  })
  spec.is(report.code, 'TEST_ERR')

  error = new ServiceError('message', 0).addMeta('b', 2)
  report = system.report(error)
  spec.is(report.code, 'NON_ERR')

  error = new ServiceError('message', 400)
  report = system.report(error)
  spec.regex(report.id, uuidPattern)
  spec.is(report.code, 'REQ_ERR')

  error = new ServiceError('message', 404)
  report = system.report(error)
  spec.is(report.code, 'VOID_ERR')

  error = new ServiceError('message', 418)
  report = system.report(error)
  spec.is(report.title, 'Kermit Drinks Tea')

  error = new ServiceError('message', 555).addMeta('a', 1)
  report = system.report(error)
  spec.is(report.code, 'SRV_ERR')
  spec.is(report.title, 'Untitled Track 555')

  error = new ServiceError('message', 600).addMeta('a', 1)
  report = system.report(error)
  spec.is(report.code, 'SYS_ERR')
  spec.is(report.title, 'Untitled Track 600')

  error = new Error('message')
  report = system.report(error)
  spec.is(report.title, 'Internal Server Error')

  // Only called when status is 500 or greater.
  spec.is(withScopeSpy.callCount, 8)
  spec.is(captureExceptionSpy.callCount, 8)
})

test.serial('~_beforeSend - warning', async spec => {
  system.report('message', LEVELS.WARNING)
  spec.pass()
})

test.serial('~_beforeSend - error', async spec => {
  system.report('message', LEVELS.ERROR)
  spec.pass()
})

test.serial('~_beforeSend - critical', async spec => {
  system.report('message', LEVELS.CRITICAL)
  spec.pass()
})

test.serial('~_beforeSend - fatal', async spec => {
  system.report('message', LEVELS.FATAL)
  spec.pass()
})

test.serial('~_beforeSend - other', async spec => {
  const error = new Error('message')
  error.labels = []
  // noinspection JSCheckFunctionSignatures
  system.report(error, 'other')
  spec.pass()
})

test.serial('~_beforeSend - internal', async spec => {
  Sentry.captureException(new Error('message'))
  spec.pass()
})

test.after(async () => {
  await Sentry.close()
})
