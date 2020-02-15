/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import { isLiteral, merge } from './utility'

/**
 * Standardized error for use with reporting and HTTP responses.
 * @extends Error
 * @param {!*} exception - Exception
 * @param {!number} [status] - HTTP Status Code
 */
export class ServiceError extends Error {
  constructor (exception, status) {
    if (Array.isArray(exception)) {
      throw new TypeError(
        '`ServiceError` does not support an array as an exception.'
      )
    }

    super()

    /**
     * Code
     * @type {string}
     * @instance
     */
    this.code = undefined

    /**
     * Labels
     * @type {Set<string>}
     * @instance
     */
    this.labels = new Set()

    /**
     * Message
     * @type {string}
     * @instance
     */
    this.message = 'An unspecified error has occurred.'

    /**
     * Metadata
     * @type {Object}
     * @instance
     */
    this.meta = {}

    /**
     * Name
     * @type {string}
     * @instance
     */
    this.name = 'ServiceError'

    // Used by AVA (test runner). Closure Compiler inspection throws
    // a warning when property is not implemented.
    this.parent = Error

    /**
     * Stack Trace
     * @type {string}
     * @instance
     */
    this.stack = undefined

    /**
     * HTTP Status Code
     * @type {number}
     * @instance
     */
    this.status = status

    if (exception instanceof Error) {
      Object.defineProperties(this, Object.getOwnPropertyDescriptors(exception))
    } else {
      Error.call(this)
      Error.captureStackTrace(this, this.constructor)
    }

    if (typeof exception === 'object') {
      const { code, message, stack, ...data } = exception
      if (message && typeof message === 'string') this.message = message
      if (stack && typeof stack === 'string') this.stack = stack
      if (code && typeof code === 'string') this.code = code

      const {
        status: _status, statusCode, status_code: _statusCode, ...meta
      } = data
      if (typeof this.status === 'undefined') {
        this.status = typeof _status === 'number' ? _status
          : typeof statusCode === 'number' ? statusCode
            : typeof _statusCode === 'number' ? _statusCode
              : 500
      }
      this.meta = meta
    } else {
      if (exception && typeof exception === 'string') this.message = exception
      if (typeof this.status === 'undefined') this.status = 500
    }
  }

  /**
   * Creates Bad Request error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 400 Error
   */
  static badRequest (exception) {
    return new this(exception, 400)
  }

  /**
   * Creates Unauthorized error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 401 Error
   */
  static unauthorized (exception) {
    return new this(exception, 401)
  }

  /**
   * Creates Payment Required error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 402 Error
   */
  static paymentRequired (exception) {
    return new this(exception, 402)
  }

  /**
   * Creates Forbidden error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 403 Error
   */
  static forbidden (exception) {
    return new this(exception, 403)
  }

  /**
   * Creates Not Found error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 404 Error
   */
  static notFound (exception) {
    return new this(exception, 404)
  }

  /*
   * Method Not Allowed
   * @param {!*} exception - Exception
   * @param {!string[]} allowed - Allowed HTTP Methods
   * @returns {ServiceError} 405 Error
   */
  /**
   * Method Not Allowed
   * @param {!*} exception - Exception
   * @param {string[]} allowed - Allowed HTTP Methods
   * @returns {ServiceError} 405 Error
   */
  static methodNotAllowed (exception, allowed) {
    return new this(exception, 405).addMeta('allowed', allowed)
  }

  /**
   * Creates Not Acceptable error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 406 Error
   */
  static notAcceptable (exception) {
    return new this(exception, 406)
  }

  /**
   * Creates Proxy Authentication Required error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 407 Error
   */
  static proxyAuthRequired (exception) {
    return new this(exception, 407)
  }

  /**
   * Creates Request Timeout error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 408 Error
   */
  static requestTimeout (exception) {
    return new this(exception, 408)
  }

  /**
   * Creates Conflict error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 409 Error
   */
  static conflict (exception) {
    return new this(exception, 409)
  }

  /**
   * Creates Gone error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 410 Error
   */
  static gone (exception) {
    return new this(exception, 410)
  }

  /**
   * Creates Length Required error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 411 Error
   */
  static lengthRequired (exception) {
    return new this(exception, 411)
  }

  /**
   * Creates Precondition Failed error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 412 Error
   */
  static preconditionFailed (exception) {
    return new this(exception, 412)
  }

  /**
   * Creates Payload Too Large error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 413 Error
   */
  static payloadTooLarge (exception) {
    return new this(exception, 413)
  }

  /**
   * Creates URI Too Long error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 414 Error
   */
  static uriTooLong (exception) {
    return new this(exception, 414)
  }

  /**
   * Creates Unsupported Media Type error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 415 Error
   */
  static unsupportedMediaType (exception) {
    return new this(exception, 415)
  }

  /**
   * Creates Range Not Satisfiable error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 416 Error
   */
  static rangeNotSatisfiable (exception) {
    return new this(exception, 416)
  }

  /**
   * Creates Expectation Failed error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 417 Error
   */
  static expectationFailed (exception) {
    return new this(exception, 417)
  }

  /**
   * Creates Kermit Drinks Tea ("I'm a Teapot") error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 418 Error
   */
  static kermitDrinksTea (exception) {
    return new this(exception, 418)
  }

  /**
   * Creates Misdirected Request error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 421 Error
   */
  static misdirectedRequest (exception) {
    return new this(exception, 421)
  }

  /**
   * Creates Unprocessable Entity error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 422 Error
   */
  static unprocessableEntity (exception) {
    return new this(exception, 422)
  }

  /**
   * Creates Locked error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 423 Error
   */
  static locked (exception) {
    return new this(exception, 423)
  }

  /**
   * Creates Failed Dependency error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 424 Error
   */
  static failedDependency (exception) {
    return new this(exception, 424)
  }

  /**
   * Creates Unordered Collection error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 425 Error
   */
  static unorderedCollection (exception) {
    return new this(exception, 425)
  }

  /**
   * Creates Upgrade Required error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 426 Error
   */
  static upgradeRequired (exception) {
    return new this(exception, 426)
  }

  /**
   * Creates Precondition Required error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 428 Error
   */
  static preconditionRequired (exception) {
    return new this(exception, 428)
  }

  /**
   * Creates Too Many Requests error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 429 Error
   */
  static tooManyRequests (exception) {
    return new this(exception, 429)
  }

  /**
   * Creates Request Header Fields Too Large error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 431 Error
   */
  static fieldsTooLarge (exception) {
    return new this(exception, 431)
  }

  /**
   * Creates Unavailable For Legal Reasons error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 451 Error
   */
  static legallyUnavailable (exception) {
    return new this(exception, 451)
  }

  /**
   * Creates Internal Server Error error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 500 Error
   */
  static internalServerError (exception) {
    return new this(exception, 500)
  }

  /**
   * Creates Not Implemented error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 501 Error
   */
  static notImplemented (exception) {
    return new this(exception, 501)
  }

  /**
   * Creates Bad Gateway error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 502 Error
   */
  static badGateway (exception) {
    return new this(exception, 502)
  }

  /**
   * Creates Service Unavailable error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 503 Error
   */
  static serviceUnavailable (exception) {
    return new this(exception, 503)
  }

  /**
   * Creates Gateway Timeout error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 504 Error
   */
  static gatewayTimeout (exception) {
    return new this(exception, 504)
  }

  /**
   * Creates HTTP Version Not Supported error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 505 Error
   */
  static unsupportedHttpVersion (exception) {
    return new this(exception, 505)
  }

  /**
   * Creates Variant Also Negotiates error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 506 Error
   */
  static variantAlsoNegotiates (exception) {
    return new this(exception, 506)
  }

  /**
   * Creates Insufficient Storage error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 507 Error
   */
  static insufficientStorage (exception) {
    return new this(exception, 507)
  }

  /**
   * Creates Loop Detected error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 508 Error
   */
  static loopDetected (exception) {
    return new this(exception, 508)
  }

  /**
   * Creates Bandwidth Limit Exceeded error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 509 Error
   */
  static bandwidthExceeded (exception) {
    return new this(exception, 509)
  }

  /**
   * Creates Not Extended error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 510 Error
   */
  static notExtended (exception) {
    return new this(exception, 510)
  }

  /**
   * Creates Network Authentication Required error.
   * @param {!*} exception - Exception
   * @returns {ServiceError} 511 Error
   */
  static networkAuthRequired (exception) {
    return new this(exception, 511)
  }

  /**
   * Adds labels.
   * @param {...!string} keywords - Keywords
   * @returns {ServiceError} Self
   */
  addLabels (...keywords) {
    keywords = keywords.map(keyword => {
      return keyword.trim().toUpperCase().replace(/\W+/g, '_')
    })
    keywords.forEach(keyword => this.labels.add(keyword))
    return this
  }

  /**
   * Adds metadata.
   * @param {!string} name - Name
   * @param {!*} data - Data
   * @returns {ServiceError} Self
   */
  addMeta (name, data) {
    if (name in this.meta && isLiteral(this.meta[name]) && isLiteral(data)) {
      this.meta[name] = merge(this.meta[name], data)
    } else {
      this.meta[name] = data
    }
    return this
  }
}
