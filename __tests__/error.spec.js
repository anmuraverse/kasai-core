/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import test from 'ava'
import { ServiceError } from '../lib/error'

test('Create Service Error', spec => {
  let error = new ServiceError('message')
  const { code, stack } = error
  spec.true(error instanceof Error)
  spec.true(typeof stack === 'string')
  spec.is(code, undefined)
  spec.is(error.message, 'message')

  let exception = new Error('exception')
  error = new ServiceError(exception)
  spec.true(error instanceof Error)
  spec.is(error.message, 'exception')

  exception = { message: 'literal' }
  error = new ServiceError(exception)
  spec.true(error instanceof Error)
  spec.is(error.message, 'literal')

  exception = { source: 'test' }
  error = new ServiceError(exception)
  spec.true(error instanceof Error)
  spec.is(error.message, 'An unspecified error has occurred.')

  spec.true(new ServiceError('message', 400) instanceof Error)

  spec.true(new ServiceError('message', 500) instanceof Error)

  exception = { code: 'INVALID_REQUEST' }
  spec.true(new ServiceError(exception, 400) instanceof Error)

  exception = { stack: 'stack' }
  spec.true(new ServiceError(exception) instanceof Error)

  exception = { status: 500 }
  spec.true(new ServiceError(exception) instanceof Error)

  exception = { statusCode: 500 }
  spec.true(new ServiceError(exception) instanceof Error)

  exception = { status_code: 500 }
  spec.true(new ServiceError(exception) instanceof Error)

  spec.true(new ServiceError(false) instanceof Error)

  spec.throws(() => new ServiceError([1, 2]))
})

test('Adding Labels', spec => {
  const error = new ServiceError('message')
    .addLabels('A', 'B')
    .addLabels('c', 'D')
    .addLabels('d', 'b')
  const labels = Array.from(error.labels)
  spec.deepEqual(labels, ['A', 'B', 'C', 'D'])
})

test('Adding Meta', spec => {
  const error = new ServiceError('message')
    .addMeta('alpha', { one: 1 })
    .addMeta('alpha', { two: 2 })
    .addMeta('bravo', 'first')
    .addMeta('bravo', 'second')
  spec.deepEqual(error.meta, { alpha: { one: 1, two: 2 }, bravo: 'second' })
})

test('Bad Request', spec => {
  const error = ServiceError.badRequest('message')
  spec.is(error.status, 400)
})

test('Unauthorized', spec => {
  const error = ServiceError.unauthorized('message')
  spec.is(error.status, 401)
})

test('Payment Required', spec => {
  const error = ServiceError.paymentRequired('message')
  spec.is(error.status, 402)
})

test('Forbidden', spec => {
  const error = ServiceError.forbidden('message')
  spec.is(error.status, 403)
})

test('Not Found', spec => {
  const error = ServiceError.notFound('message')
  spec.is(error.status, 404)
})

test('Method Not Allowed', spec => {
  const error = ServiceError.methodNotAllowed('message', ['GET', 'POST'])
  const { allowed } = error.meta
  spec.is(error.status, 405)
  spec.deepEqual(allowed, ['GET', 'POST'])
})

test('Not Acceptable', spec => {
  const error = ServiceError.notAcceptable('message')
  spec.is(error.status, 406)
})

test('Proxy Auth Required', spec => {
  const error = ServiceError.proxyAuthRequired('message')
  spec.is(error.status, 407)
})

test('Request Timeout', spec => {
  const error = ServiceError.requestTimeout('message')
  spec.is(error.status, 408)
})

test('Conflict', spec => {
  const error = ServiceError.conflict('message')
  spec.is(error.status, 409)
})

test('Gone', spec => {
  const error = ServiceError.gone('message')
  spec.is(error.status, 410)
})

test('Length Required', spec => {
  const error = ServiceError.lengthRequired('message')
  spec.is(error.status, 411)
})

test('Precondition Failed', spec => {
  const error = ServiceError.preconditionFailed('message')
  spec.is(error.status, 412)
})

test('Payload Too Large', spec => {
  const error = ServiceError.payloadTooLarge('message')
  spec.is(error.status, 413)
})

test('URI Too Long', spec => {
  const error = ServiceError.uriTooLong('message')
  spec.is(error.status, 414)
})

test('Unsupported Media Type', spec => {
  const error = ServiceError.unsupportedMediaType('message')
  spec.is(error.status, 415)
})

test('Range Not Satisfiable', spec => {
  const error = ServiceError.rangeNotSatisfiable('message')
  spec.is(error.status, 416)
})

test('Expectation Failed', spec => {
  const error = ServiceError.expectationFailed('message')
  spec.is(error.status, 417)
})

test('Kermit Drinks Tea', spec => {
  const error = ServiceError.kermitDrinksTea('message')
  spec.is(error.status, 418)
})

test('Misdirected Request', spec => {
  const error = ServiceError.misdirectedRequest('message')
  spec.is(error.status, 421)
})

test('Unprocessable Entity', spec => {
  const error = ServiceError.unprocessableEntity('message')
  spec.is(error.status, 422)
})

test('Locked', spec => {
  const error = ServiceError.locked('message')
  spec.is(error.status, 423)
})

test('Failed Dependency', spec => {
  const error = ServiceError.failedDependency('message')
  spec.is(error.status, 424)
})

test('Unordered Collection', spec => {
  const error = ServiceError.unorderedCollection('message')
  spec.is(error.status, 425)
})

test('Upgrade Required', spec => {
  const error = ServiceError.upgradeRequired('message')
  spec.is(error.status, 426)
})

test('Precondition Required', spec => {
  const error = ServiceError.preconditionRequired('message')
  spec.is(error.status, 428)
})

test('Too Many Requests', spec => {
  const error = ServiceError.tooManyRequests('message')
  spec.is(error.status, 429)
})

test('Fields Too Large', spec => {
  const error = ServiceError.fieldsTooLarge('message')
  spec.is(error.status, 431)
})

test('Legally Unavailable', spec => {
  const error = ServiceError.legallyUnavailable('message')
  spec.is(error.status, 451)
})

test('Internal Server Error', spec => {
  const error = ServiceError.internalServerError('message')
  spec.is(error.status, 500)
})

test('Not Implemented', spec => {
  const error = ServiceError.notImplemented('message')
  spec.is(error.status, 501)
})

test('Bad Gateway', spec => {
  const error = ServiceError.badGateway('message')
  spec.is(error.status, 502)
})

test('Service Unavailable', spec => {
  const error = ServiceError.serviceUnavailable('message')
  spec.is(error.status, 503)
})

test('Gateway Timeout', spec => {
  const error = ServiceError.gatewayTimeout('message')
  spec.is(error.status, 504)
})

test('.unsupportedHttpVersion', spec => {
  const error = ServiceError.unsupportedHttpVersion('message')
  spec.is(error.status, 505)
})

test('Variant Also Negotiates', spec => {
  const error = ServiceError.variantAlsoNegotiates('message')
  spec.is(error.status, 506)
})

test('Insufficient Storage', spec => {
  const error = ServiceError.insufficientStorage('message')
  spec.is(error.status, 507)
})

test('Loop Detected', spec => {
  const error = ServiceError.loopDetected('message')
  spec.is(error.status, 508)
})

test('Bandwidth Exceeded', spec => {
  const error = ServiceError.bandwidthExceeded('message')
  spec.is(error.status, 509)
})

test('Not Extended', spec => {
  const error = ServiceError.notExtended('message')
  spec.is(error.status, 510)
})

test('Network Auth Required', spec => {
  const error = ServiceError.networkAuthRequired('message')
  spec.is(error.status, 511)
})
