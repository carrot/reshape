const parser = require('reshape-parser')
const generator = require('reshape-code-gen')
const Joi = require('joi')
const W = require('when')
const merge = require('lodash.merge')
const error = require('./error')

/**
 * @class Reshape
 */
class Reshape {
  /**
   * Constructs a new instance of the class, validates and sets options.
   * @constructor
   * @see Reshape#_validate for info on options
   * @param {Object} options - options object
   */
  constructor (options = {}) {
    this.options = this._validate(options)
    this.options.parser = this.options.parser || parser
    this.options.generator = this.options.generator || generator
    this.options.plugins = this.options.plugins || []
    this.options.runtime = this.options.runtime || {}
    this.options.ReshapeError = error
  }

  /**
   * Process the input through the function, return the output as a promise.
   * Accepts options, merged with constructor options with priority.
   * @param {String} input - a string of html to be processed
   * @param {Object} options - full options as in the constructor
   */
  process (input, options = {}) {
    options = merge(this.options, this._validate(options))

    options.PluginError = error.generatePluginError({
      filename: options.filename,
      src: input
    })

    let ast = options.parser(input, options.parserOptions)
    return W.reduce(options.plugins, (m, plugin) => plugin(m, options), ast)
      .then((output) => options.generator(output, options.generatorOptions))
      .then((output) => { return Object.assign({output}, options) })
  }

  /**
   * Validate the options object.
   * @private
   * @param {Object} options - options object
   * @param {Array|Function} [options.plugins] - array of plugin functions
   * @param {Function} [options.parser] - replace the default parser
   * @param {Function} [options.generator] - replace the default code generator
   * @param {Object} [options.parserOptions] - options to pass to the parser
   * @param {Object} [options.generatorOptions] - options to pass to the codegen
   */
  _validate (opts) {
    const schema = Joi.object().keys({
      plugins: Joi.array().single().items(Joi.func()),
      parser: Joi.func(),
      generator: Joi.func(),
      parserOptions: Joi.object(),
      generatorOptions: Joi.object(),
      filename: Joi.string()
    })
    return Joi.validate(opts, schema).value
  }
}

module.exports = (options) => new Reshape(options)
module.exports.ReshapeError = error
