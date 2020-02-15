/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import test from 'ava'

test.beforeEach(() => {
  delete require.cache[require.resolve('../lib/env')]
})

test.serial('.ENV', async spec => {
  process.env.NODE_ENV = 'env'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'env')
  spec.false(env.DEVELOPMENT)
  spec.false(env.TEST)
  spec.false(env.SANDBOX)
  spec.false(env.STAGING)
  spec.false(env.PRODUCTION)
})

test.serial('.DEVELOPMENT', async spec => {
  process.env.NODE_ENV = 'development'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'development')
  spec.true(env.DEVELOPMENT)
})

test.serial('.TEST', async spec => {
  process.env.NODE_ENV = 'test'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'test')
  spec.true(env.TEST)
})

test.serial('.SANDBOX', async spec => {
  process.env.NODE_ENV = 'sandbox'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'sandbox')
  spec.true(env.SANDBOX)
})

test.serial('.STAGING', async spec => {
  process.env.NODE_ENV = 'staging'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'staging')
  spec.true(env.STAGING)
})

test.serial('.PRODUCTION', async spec => {
  process.env.NODE_ENV = 'production'
  const env = await import('../lib/env')
  spec.is(env.ENV, 'production')
  spec.true(env.PRODUCTION)
})

test.serial('.DEBUG when true', async spec => {
  const values = ['1', 'active', 'enabled', 'on', 'true', 'y', 'yes']
  for (const value of values) {
    process.env.NODE_DEBUG = value
    const env = await import('../lib/env')
    spec.true(env.DEBUG)
  }
})

test.serial('.DEBUG when false', async spec => {
  process.env.NODE_DEBUG = 'other'
  const env = await import('../lib/env')
  spec.false(env.DEBUG)
})
