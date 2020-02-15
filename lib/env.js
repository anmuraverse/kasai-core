/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

const {
  NODE_ENV,
  NODE_DEBUG
} = process.env

/**
 * Parses environment variable as boolean.
 * @param {?string} env - Environment Variable
 * @returns {boolean} Result
 * @inner
 */
function parseBoolean (env) {
  const values = ['1', 'active', 'enabled', 'on', 'true', 'y', 'yes']
  return values.includes(String(env).toLowerCase())
}

/**
 * Represents current environment.
 * @type {string}
 */
export const ENV = NODE_ENV

/**
 * Represents if environment is in debug mode.
 * @type {boolean}
 */
export const DEBUG = parseBoolean(NODE_DEBUG)

/**
 * Represents if environment is in development.
 * @type {boolean}
 */
export const DEVELOPMENT = NODE_ENV === 'development'

/**
 * Represents if environment is in testing.
 * @type {boolean}
 */
export const TEST = NODE_ENV === 'test'

/**
 * Represents if environment is in a sandbox.
 * @type {boolean}
 */
export const SANDBOX = NODE_ENV === 'sandbox'

/**
 * Represents if environment is in staging.
 * @type {boolean}
 */
export const STAGING = NODE_ENV === 'staging'

/**
 * Represents if environment is in production.
 * @type {boolean}
 */
export const PRODUCTION = NODE_ENV === 'production'
