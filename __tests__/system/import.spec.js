/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import test from 'ava'

test.beforeEach(() => {
  delete require.cache[require.resolve('../../lib/system')]
  Object.assign(process.env, {
    SERVICE_NAME: 'NAME',
    SENTRY_ID: 'ID',
    SENTRY_KEY: 'KEY'
  })
})

test.serial('import', async spec => {
  await spec.notThrowsAsync(import('../../lib/system'))
})

test.serial('import without SERVICE_NAME', async spec => {
  delete process.env.SERVICE_NAME
  await spec.throwsAsync(import('../../lib/system'))
})

test.serial('import without SENTRY_ID', async spec => {
  delete process.env.SENTRY_ID
  await spec.throwsAsync(import('../../lib/system'))
})

test.serial('import without SENTRY_KEY', async spec => {
  delete process.env.SENTRY_KEY
  await spec.throwsAsync(import('../../lib/system'))
})
