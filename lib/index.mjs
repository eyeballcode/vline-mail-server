import NodeMailin from 'node-mailin'
import path from 'path'
import os from 'os'
import { load as parseHTML } from 'cheerio'

export default class VLineMailServer {

  #DEFAULT_OPTIONS = {
    port: 25,
    logLevel: 'error',
    debug: true,
    smtpOptions: {
      banner: 'V/Line Inform Email Server',
      debug: true
    },
    tmp: path.join(os.tmpdir(), '.node_mail'),
    verbose: true
  }
  #mailerOptions
  #mailer
  #addressValidator = () => true
  #onError = () => {}

  constructor(mailerOptions) {
    this.#mailerOptions = mailerOptions || this.#DEFAULT_OPTIONS
  }

  setup() {
    this.#mailer = new NodeMailin()
    this.#mailer.start(this.#mailerOptions)
    this.#addHooks()
  }

  setAddressValidator(validator) {
    this.#addressValidator = validator
  }

  setErrorHandler(onError) {
    this.#onError = onError
  }

  #addHooks() {
    this.#mailer.on('validateRecipient', this.onValidateRecipient)
    this.#mailer.on('error', this.#onError)
    this.#mailer.on('message', this.onMessage)
  }

  onValidateRecipient(session, address, callback) {
    if (this.#addressValidator(address)) return callback()

    let error = new Error(`5.1.1 <${address}>: Requested action not taken: mailbox unavailable`)
    error.responseCode = 550

    return callback(error)
  }

  onMessage(connection, data) {
    let { subject, message } = getMessageContent(data)
  }

  static getMessageContent(data) {
    let {subject, html} = data
    let $ = parseHTML(`<vline-message>${html}</vline-message>`)
  
    return {
      subject: subject || '',
      message: $('vline-message').text().replace(/More information at.+/, '').trim()
    }
  }

  static cleanupMessage(message) {
    return message.replace(/[\u002D\u2010\u2011\u2012\u2013\u2014\u2015\uFE58\uFE63\uFF0D]/g, ' to ')
      .replace(/[\u00A0\u2009\u200A\u200B\u205F]/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/  +/g, ' ').trim()
  }

  static standardiseMessage(message) {
    return message.replace(/(SCS|SXS|SSS)/, 'Southern Cross')
      .replace(/Nth/, 'North')
      .replace(/(?<!North )Melb(ourne)?/, 'Southern Cross')
      .replace(/Flinders St\.?(reet)?/, 'Flinders Street')
      .replace(/Junc?t?(\b)/i, 'Junction$1')
      .replace(/(Jct|Jcn|Jun)(\b)/i, 'Junction$2')
      .replace(/Junction\./i, 'Junction')
      .replace(/(service|train) /, '')
      .replace(/ due .*/, '')
  }

  static processMessage(message) {
    return this.cleanupMessage(this.standardiseMessage(message))
  }
}