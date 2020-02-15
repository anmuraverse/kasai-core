/*
 * Copyright 2020 Robert C Degraffenreaidt
 * Licensed under the MIT License.
 */

import test from 'ava'
import * as utility from '../lib/utility'

test('Value is Literal Object', spec => {
  spec.true(utility.isLiteral({}))
  spec.false(utility.isLiteral(undefined))
  spec.false(utility.isLiteral(null))
  spec.false(utility.isLiteral(false))
  spec.false(utility.isLiteral(true))
  spec.false(utility.isLiteral(0))
  spec.false(utility.isLiteral('0'))
  spec.false(utility.isLiteral([0]))
  spec.false(utility.isLiteral(Symbol('test')))
  spec.false(utility.isLiteral(new Error('test')))
})

test('Value is Primitive', spec => {
  spec.true(utility.isPrimitive(undefined))
  spec.true(utility.isPrimitive(null))
  spec.true(utility.isPrimitive(false))
  spec.true(utility.isPrimitive(true))
  spec.true(utility.isPrimitive(0))
  spec.true(utility.isPrimitive('0'))
  spec.true(utility.isPrimitive(Symbol('test')))
  spec.false(utility.isPrimitive({}))
  spec.false(utility.isPrimitive([0]))
  spec.false(utility.isPrimitive(new Error('test')))
})

test('Merge Objects', spec => {
  const a = {
    c: [1, 2, 3],
    d: { m: 1 },
    e: { o: 3 },
    x: 1,
    y: 2
  }
  const b = {
    c: [3, 4, 5],
    d: { n: 2 },
    e: { o: 3 },
    y: 3,
    z: 4
  }
  spec.deepEqual(
    utility.merge(a, b),
    {
      c: [1, 2, 3, 4, 5],
      d: { m: 1, n: 2 },
      e: { o: 3 },
      x: 1,
      y: 3,
      z: 4
    }
  )
})

test('Merge Arrays', spec => {
  const a = [1, 2, 3, 4, 5]
  const b = [3, 4, 5, 6, 7]
  const c = [5, 6, 7, 8, 9]
  spec.deepEqual(
    utility.mergeLists(a, b, c),
    [1, 2, 3, 4, 5, 6, 7, 8, 9]
  )
})
