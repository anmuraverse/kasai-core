/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

/**
 * Returns whether value is a literal object or not.
 * @param {*} any - Any Value
 * @returns {boolean} Result
 */
export function isLiteral (any) {
  return Object.prototype.toString.call(any) === '[object Object]'
}

/**
 * Returns whether value is a primitive or not.
 * @param {*} any - Any Value
 * @returns {boolean} Result
 */
export function isPrimitive (any) {
  return any === null ||
    (typeof any !== 'object' && typeof any !== 'function')
}

/**
 * Merges two object literals.
 * @param {!Object} a - First Object
 * @param {!Object} b - Second Object
 * @returns {Object} Merged Object
 */
export function merge (a, b) {
  const n = {}
  mergeLists(Object.keys(a), Object.keys(b)).forEach(k => {
    if (k in a && !(k in b)) {
      n[k] = a[k]
      return
    }
    if (k in b && !(k in a)) {
      n[k] = b[k]
      return
    }
    const vA = a[k]
    const vB = b[k]
    if (vA === vB) {
      n[k] = vA
      return
    }
    if (Array.isArray(vA) && Array.isArray(vB)) {
      n[k] = mergeLists(vA, vB)
      return
    }
    if (isLiteral(vA) && isLiteral(vB)) {
      n[k] = merge(vA, vB)
      return
    }
    n[k] = vB
  })
  return n
}

/**
 * Merges arrays or takes single array and returns one
 * without duplicate primitives or references.
 * @param {...!Array} lists - Lists
 * @returns {Array} Merged List
 */
export function mergeLists (...lists) {
  return [...new Set([].concat(...lists))]
}
