import { SMTPServer } from 'smtp-server'
import { simpleParser } from 'mailparser'
import { load as parseHTML } from 'cheerio'
import EventEmitter from 'stream'
import { WritableStream } from 'memory-streams'

export default class VLineMailServer extends EventEmitter {

  #DEFAULT_OPTIONS = {
    port: 25,
    banner: 'V/Line Inform Email Server',
    logger: true
  }

  #mailerOptions
  #mailer
  #addressValidator = () => true

  constructor(mailerOptions) {
    super()
    this.#mailerOptions = {
      ...this.#DEFAULT_OPTIONS,
      ...(mailerOptions || {})
    }
  }

  setup() {
    this.#mailer = new SMTPServer({
      logger: this.#mailerOptions.logger,
      banner: this.#mailerOptions.banner,
      disabledCommands: ['STARTTLS', 'AUTH'],
      authMethods: ['PLAIN'],
      onRcptTo: this.onValidateRecipient.bind(this),
      onData: this.onData.bind(this)
    })

    this.#addHooks()
    this.#mailer.listen(this.#mailerOptions.port, '127.0.0.1')
  }

  setAddressValidator(validator) {
    this.#addressValidator = validator
  }

  #addHooks() {
    this.#mailer.on('error', err => this.emit('error', err))
  }

  onValidateRecipient(address, session, callback) {
    if (this.#addressValidator(address)) return callback()

    let error = new Error(`5.1.1 <${address}>: Requested action not taken: mailbox unavailable`)
    error.responseCode = 550

    return callback(error)
  }

  onData(stream, session, callback) {
    let memoryStream = new WritableStream()
    stream.pipe(memoryStream)
    stream.on('end', async () => {
      let streamContents = memoryStream.toString()
      let mail = await simpleParser(streamContents)

      this.onMessage({
        subject: mail.subject,
        html:  mail.textAsHtml
      })
      callback()
    })
  }

  onMessage(data) {
    let { subject, message } = VLineMailServer.getMessageContent(data)
    console.log('Got mail!', subject, message)
  }

  static getMessageContent(data) {
    let {subject, html} = data
    let $ = parseHTML(`<vline-message>${html}</vline-message>`)

    let message = $('vline-message').text()
      .replace(/More information at.+/, '')
      .replace(/^[^\w]+/, '')
      .trim()

    return {
      subject: subject || '',
      message
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
      .replace(/Café/i, 'Cafe')
  }

  static processMessage(message) {
    return this.cleanupMessage(this.standardiseMessage(message))
  }
}