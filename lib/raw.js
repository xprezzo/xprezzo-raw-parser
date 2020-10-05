/**
 * xprezzo-raw-parser
 * Copyright(c) Ben Ajenoui <info@seohero.io>
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 */

const bytes = require('xprezzo-raw-body').bytes
const debug = require('xprezzo-raw-body').debug('xprezzo:raw-parser')
const Reader = require('xprezzo-raw-body').Reader
const typeis = require('type-is')
const prop = new WeakMap()

const checkParse = (req, res, next, self) => {
  if (req._body) {
    debug('body already parsed')
    next()
    return false
  }
  // skip requests without bodies
  if (!typeis.hasBody(req)) {
    debug('skip empty body')
    next()
    return false
  }
  debug('content-type %j', req.headers['content-type'])
  // determine if request should be parsed
  if (!self.shouldParse(req)) {
    debug('skip parsing')
    next()
    return false
  }
  return true
}

function createReader () {
  const self = prop.get(this)
  return (req, res, next) => {
    req.body = req.body || {}
    if (!checkParse(req, res, next, self)) {
      return
    }
    // Reader
    Reader(req, res, next, (buf) => {return buf}, debug, {
      encoding: null,
      inflate: self.inflate,
      limit: self.parsedLimit,
      verify: self.parsedVerify
    })
  }
}

class RawParser {
  constructor (options) {
    var opts = options || {}
    opts.parsedLimit = typeof opts.limit !== 'number'
      ? bytes.parse(opts.limit || '100kb')
      : opts.limit
    opts.parsedInflate = opts.inflate !== false
    opts.parsedType = opts.type || 'application/octet-stream'
    opts.parsedVerify = opts.verify || false
    if (opts.parsedVerify !== false && typeof opts.parsedVerify !== 'function') {
      throw new TypeError('option verify must be function')
    }
    // create the appropriate type checking function
    opts.shouldParse = typeof opts.parsedType !== 'function'
      ? typeChecker(opts.parsedType)
      : opts.parsedType
    prop.set(this, opts)
    return createReader.call(this)
  }
}


/**
 * Get the simple type checker.
 *
 * @param {string} type
 * @return {function}
 */
const typeChecker = (type) => {
  return function checkType (req) {
    return Boolean(typeis(req, type))
  }
}

/**
 * Module exports.
 */

module.exports = (options) => { return new RawParser(options) }
