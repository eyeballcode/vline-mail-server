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
}