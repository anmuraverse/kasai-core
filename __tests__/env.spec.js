/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import test from 'ava'

test.beforeEach(() => {
  delete require.cache[require.resolve('../lib/env')]
})

test.serial('Environment Defined', async spec => {
  process.env.NODE_ENV = 'env'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'env')
  spec.false(env.DEVELOPMENT)
  spec.false(env.TEST)
  spec.false(env.SANDBOX)
  spec.false(env.STAGING)
  spec.false(env.PRODUCTION)
})

test.serial('Environment in Development', async spec => {
  process.env.NODE_ENV = 'development'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'development')
  spec.true(env.DEVELOPMENT)
})

test.serial('Environment in Test', async spec => {
  process.env.NODE_ENV = 'test'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'test')
  spec.true(env.TEST)
})

test.serial('Environment in Sandbox', async spec => {
  process.env.NODE_ENV = 'sandbox'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'sandbox')
  spec.true(env.SANDBOX)
})

test.serial('Environment in Staging', async spec => {
  process.env.NODE_ENV = 'staging'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'staging')
  spec.true(env.STAGING)
})

test.serial('Environment in Production', async spec => {
  process.env.NODE_ENV = 'production'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'production')
  spec.true(env.PRODUCTION)
})

test.serial('Environment Debug Enabled', async spec => {
  const values = ['1', 'active', 'enabled', 'on', 'true', 'y', 'yes']
  for (const value of values) {
    process.env.NODE_DEBUG = value
    const env = await import('../lib/env')
    spec.true(env.DEBUG)
  }
})

test.serial('Environment Debug Disabled', async spec => {
  process.env.NODE_DEBUG = 'other'
  const env = await import('../lib/env')
  spec.false(env.DEBUG)
})
