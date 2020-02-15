/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import { hostname } from 'os'
import { DEBUG, DEVELOPMENT, TEST } from './env'
import { ServiceError } from './error'
import uuid from 'uuid/v4'
import * as Sentry from '@sentry/node'
import { STATUS_CODES } from 'http'
import { isLiteral, mergeLists } from './utility'

const { SERVICE_NAME, SENTRY_ID, SENTRY_KEY } = process.env

if (!SERVICE_NAME) {
  throw new Error('Environment variable `SERVICE_NAME` is required.')
}
if (!SENTRY_ID) {
  throw new Error('Environment variable `SENTRY_ID` is required.')
}
if (!SENTRY_KEY) {
  throw new Error('Environment variable `SENTRY_KEY` is required.')
}

/**
 * Service Context
 * @type {{hostname: string, name: string, pid: number}}
 * @ignore
 */
const service = ({
  hostname: hostname(),
  name: SERVICE_NAME.toLowerCase().replace(/\W+/g, '_'),
  pid: process.pid
})

/**
 * Content Security Policy Report URI
 * @type {string}
 * @readonly
 */
export const CSP_REPORT_URI =
  `https://sentry.io/api/${SENTRY_ID}/security/?sentry_key=${SENTRY_KEY}`

/**
 * Log Levels.
 * - Named key returns threshold.
 * - Numerical index returns label.
 * @enum {number|string}
 * @readonly
 */
export const LEVELS = {
  SILENT: 0,
  0: 'SILENT',
  FATAL: 1,
  1: 'FATAL',
  CRITICAL: 2,
  2: 'CRITICAL',
  ERROR: 3,
  3: 'ERROR',
  WARNING: 4,
  4: 'WARNING',
  INFO: 5,
  5: 'INFO',
  DEBUG: 6,
  6: 'DEBUG'
}
Object.freeze(LEVELS)

/**
 * States
 * @enum {string}
 * @readonly
 */
export const STATES = {
  PENDING: 'pending',
  STOPPED: 'stopped',
  STARTUP: 'startup',
  RUNNING: 'running',
  SHUTDOWN: 'shutdown',
  STALLED: 'stalled'
}
Object.freeze(STATES)

/**
 * System
 * @namespace
 */
export const system = {

  /**
   * Log Output Level
   * @type {number<LEVELS>}
   * @private
   */
  _level: /* istanbul ignore next */
    TEST ? LEVELS.SILENT : LEVELS.INFO,

  /**
   * @interface Plugin
   * @property {function(Object=):void} [initialize] - Initializes plugin.
   * @property {function():Promise<void>} [activate] - Activates plugin.
   * @property {function():Promise<void>} [terminate] - Terminates plugin.
   * @memberof system
   * @inner
   */

  /**
   * Registered Plugins
   * @type {Set<Plugin>}
   * @private
   */
  _plugins: new Set(),

  /**
   * State
   * @type {string<STATES>}
   * @private
   */
  _state: STATES.STOPPED,

  /**
   * Log Output Level
   * @type {number<LEVELS>}
   */
  get level () { return this._level },
  set level (level) {
    // Do not allow any arbitrary thresholds or labels.
    if (level in LEVELS) {
      this._level = typeof level === 'string' ? LEVELS[level] : level
    }
  },

  /**
   * State
   * @type {string<STATES>}
   */
  get state () {
    return this._state
  },

  /**
   * Registers a plugin.
   * @param {!Plugin} plugin - Plugin
   * @param {Object} [options] - Options
   * @returns {this} System
   */
  register (plugin, options) {
    const hasInitializer = typeof plugin.initialize === 'function'
    const hasActivator = typeof plugin.activate === 'function'
    const hasTerminator = typeof plugin.terminate === 'function'

    if (!hasInitializer && !hasActivator) {
      throw new Error(
        'Plugin does not implement `initialize` or `activate`.'
      )
    }

    if (!hasInitializer && options) {
      throw new Error(
        'Plugin does not implement `initialize` to process defined `options` parameter.'
      )
    } else if (hasInitializer) {
      plugin.initialize(options)
    }

    if (hasActivator || hasTerminator) {
      this._plugins.add(plugin)
    }

    return this
  },

  /**
   * Starts system.
   * @returns {Promise<string<STATES>>}
   */
  async start () {
    if (this._state !== STATES.STOPPED) {
      this.warn(
        `${this} attempted to start while in ${this._state} state.`,
        'system'
      )
      return this._state
    }

    const activatedPlugins = []
    this._state = STATES.STARTUP
    this.debug(`${this} is starting up.`)
    try {
      // Activate plugins sequentially.
      for (const plugin of this._plugins) {
        if ('activate' in plugin) await plugin.activate()
        activatedPlugins.push(plugin)
      }
      this._state = STATES.RUNNING
      this.debug(`${this} is running.`)
    } catch (exception) {
      this.report(exception, LEVELS.FATAL)
      // On an activation failure, terminate previously activated plugins
      // to gracefully cancel startup. Report any termination failures
      // that
      this._state = STATES.SHUTDOWN
      this.debug(`${this} startup canceled.`)
      let stalledSum = 0
      for (const plugin of activatedPlugins.reverse()) {
        if ('terminate' in plugin) {
          try {
            await plugin.terminate()
          } catch (exception) {
            this.report(exception, LEVELS.CRITICAL)
            stalledSum++
          }
        }
      }
      if (stalledSum) {
        this._state = STATES.STALLED
        this.debug(`${this} failed to completely stop.`, 'system')
      } else {
        this._state = STATES.STOPPED
        this.debug(`${this} has stopped.`, 'system')
      }
    }
    return this._state
  },

  /**
   * Stops system.
   * @returns {Promise<string<STATES>>}
   */
  async stop () {
    if (this._state !== STATES.RUNNING) {
      this.warn(
        `${this} attempted to stop while in ${this._state} state.`,
        'system'
      )
      return this._state
    }
    this._state = STATES.SHUTDOWN
    this.debug(`${this} is shutting down.`, 'system')
    let stalledSum = 0
    for (const plugin of [...this._plugins].reverse()) {
      if ('terminate' in plugin) {
        try {
          await plugin.terminate()
        } catch (exception) {
          this.report(exception, LEVELS.CRITICAL)
          stalledSum++
        }
      }
    }
    if (stalledSum) {
      this._state = STATES.STALLED
      this.debug(`${this} failed to completely stop.`, 'system')
    } else {
      this._state = STATES.STOPPED
      this.debug(`${this} has stopped.`, 'system')
    }
    return this._state
  },

  /**
   * Closes system.
   * @returns {Promise<void>}
   */
  async close () {
    await Sentry.close()
  },

  /**
   * Logs a debug statement.
   * @param {...!Object|string} params - Context, Message, and/or Labels
   */
  debug (...params) {
    if (this._level >= LEVELS.DEBUG) {
      return log(LEVELS.DEBUG, ...params)
    }
  },

  /**
   * Logs a information statement.
   * @param {...!Object|string} params - Context, Message, and/or Labels
   */
  info (...params) {
    if (this._level >= LEVELS.INFO) {
      return log(LEVELS.INFO, ...params)
    }
  },

  /**
   * Logs a warning statement.
   * @param {...!Object|string} params - Context, Message, and/or Labels
   */
  warn (...params) {
    if (this._level >= LEVELS.WARNING) {
      return log(LEVELS.WARNING, ...params)
    }
  },

  /**
   * Logs an error statement.
   * @param {...!Object|string} params - Context, Message, and/or Labels
   */
  error (...params) {
    if (this._level >= LEVELS.ERROR) {
      return log(LEVELS.ERROR, ...params)
    }
  },

  /**
   * Logs a critical statement.
   * @param {...!Object|string} params - Context, Message, and/or Labels
   */
  critical (...params) {
    if (this._level >= LEVELS.CRITICAL) {
      return log(LEVELS.CRITICAL, ...params)
    }
  },

  /**
   * Logs a fatal statement.
   * @param {...!Object|string} params - Context, Message, and/or Labels
   */
  fatal (...params) {
    if (this._level >= LEVELS.FATAL) {
      return log(LEVELS.FATAL, ...params)
    }
  },

  /**
   * The response sent to client.
   * @interface ResponseError
   * @property {string} title - Title
   * @property {string} message - Message
   * @property {number} status - HTTP Status Code
   * @property {string} code - Error Name
   * @property {string} id - Event ID
   * @property {Object} [meta] - Metadata
   * @memberof system
   * @inner
   */

  /**
   * The scope of information to be reported server-side.
   * @typedef {Object} ReportScope
   * @property {!Object} [extras] - Extras
   * @property {string<LEVELS>} [level] - Level
   * @property {!Object<string,string>} [tags] - Tags
   * @property {!Object} [user] - User
   * @property {!string} [user.id] - ID
   * @property {!string} [user.ip_address] - IP Address
   * @memberof system
   * @inner
   */

  /**
   * Reports an exception.
   * @param {!*} exception - Exception
   * @param {!ReportScope|string<LEVELS>} [options] - Full Scope or Level
   * @returns {ResponseError} Reported Error
   */
  report (exception, options) {
    const { code, labels, message, meta, name, stack, status } =
      exception instanceof ServiceError ? exception
        : new ServiceError(exception)

    const error = {}

    error.status = status

    // If code is not set, generate one from labels.
    if (code) {
      error.code = code
    } else {
      // And if there are no labels, use status instead.
      const namespace = [...labels].join('_')
      error.code = namespace ? namespace + '_ERR'
        : status >= 600 ? 'SYS_ERR'
          : status >= 500 ? 'SRV_ERR'
            : status === 418 ? 'TEA_BAG'
              : status === 404 ? 'VOID_ERR'
                : status >= 400 ? 'REQ_ERR'
                  : 'NON_ERR'
    }

    // Server error details should be reported,
    // but redacted from the response sent to client.
    // Request error details should remain
    // in response to be reported by client.
    if (status < 500) {
      error.id = uuid()
      error.message = message
      error.meta = meta
    } else {
      Sentry.withScope(scope => {
        if (typeof options === 'string') options = { level: options }
        const { extras, level = 'error', tags, user } = options || {}
        scope.setLevel(Sentry.Severity.fromString(level))
        if (Object.keys(meta).length) scope.setExtras(meta)
        if (extras) scope.setExtras(extras)
        if (tags) scope.setTags(tags)
        if (user) scope.setUser(user)
        error.id = Sentry.captureException({
          labels: [...labels], message, name, stack
        })
      })
      error.message = 'An undisclosed error has occurred.'
    }

    // Generate a title using status.
    error.title = status === 418 ? 'Kermit Drinks Tea'
      : status in STATUS_CODES ? STATUS_CODES[status]
        : `Untitled Track ${status}`

    return error
  },

  toString () {
    return SERVICE_NAME
  }
}

/**
 * Normalizes and prints a log statement.
 * @param {!number<LEVELS>|string<LEVELS>} level - Level
 * @param {...!Object|string} params - Context, Message, and/or Labels
 * - Should not contain more than one object; additional entries are discarded.
 * - If object is found and has a `message` property, any string entries are all
 * parsed as labels.  Otherwise, first string is parsed as message and any remaining
 * strings are parsed as labels.
 * @memberof system
 * @inner
 */
function log (level, ...params) {
  // Create context from first object found in parameters
  // or a new object if one is not found.
  const context = params.find(p => isLiteral(p)) || {}

  // Assign level (label) to context.
  context.level = typeof level === 'string' ? level : LEVELS[level]

  // Extract any strings from parameters. If a message is not in
  // context, assign first string as message to context.
  const strings = params.filter(p => typeof p === 'string')
    .map(v => v.trim()).filter(p => !!p)
  if (strings.length && !('message' in context)) {
    context.message = strings.shift()
  }

  // Parse and normalize any remaining strings as labels
  // then merge them into context.
  if (strings.length) {
    const labels = Array.isArray(context.labels)
      ? mergeLists(context.labels, strings)
      : strings
    context.labels = labels.map(v => v.toUpperCase().replace(/\W+/g, '_'))
  }

  // Merge process and host meta into context.
  Object.assign(context, service)

  /* istanbul ignore next */
  if (TEST) return context

  // Prettify log output in development, otherwise use JSON format
  // in other environments.
  /* istanbul ignore next */
  if (DEVELOPMENT) {
    const message = `${context.level}: ${context.message}`
    const output = level === LEVELS.INFO ? message
      // Use cyan for debug logs.
      : level === LEVELS.DEBUG ? `\x1b[36m${message}\x1b[0m`
        // Use yellow for warning logs.
        : level === LEVELS.WARNING ? `\x1b[33m${message}\x1b[0m`
          // Use red for more severe logs.
          : `\x1b[31m${message}\x1b[0m`
    process.stdout.write(output + '\n')
  } else {
    process.stdout.write(JSON.stringify(context) + '\n')
  }
}

Sentry.init({
  debug: DEBUG,
  dsn: `https://${SENTRY_KEY}@sentry.io/${SENTRY_ID}`,

  /**
   * Logs exception message before reporting to Sentry project.
   * @param {{event_id: string, level: string}} event - Event
   * @param {{error: Error}} hint - Hint
   * @returns {Promise<Object|void>}
   * @memberof system
   * @inner
   */
  beforeSend: async (event, hint) => {
    const { originalException: error } = hint
    const { message, stack } = error

    const level = event.level.toUpperCase()
    const context = {
      id: event.event_id,
      message: /* istanbul ignore next */
        DEVELOPMENT ? stack : message
    }
    // const labels = Array.isArray(error.labels) ? error.labels : []
    log(level in LEVELS ? level : LEVELS.ERROR, context, ...error.labels)

    /* istanbul ignore next */
    if (!DEVELOPMENT && !TEST) return event
  }
})
