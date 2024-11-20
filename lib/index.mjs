import { SMTPServer } from 'smtp-server'
import { simpleParser } from 'mailparser'
import { htmlToText } from 'html-to-text'
import EventEmitter from 'stream'
import { WritableStream } from 'memory-streams'
import getMessageType from './message-classification.mjs'
import { identifyReduction } from './parsers/identify-reduction.mjs'

import identifyChanges from './parsers/service-change.mjs'
import identifyDelay from './parsers/identify-delay.mjs'
import identifyService, { removeServiceData } from './parsers/identify-service.mjs'

export default class VLineMailServer extends EventEmitter {

  static #MESSAGE_PARSERS = {
    'REDUCTION': identifyReduction,
    'CANCELLED': null,
    'REINSTATED': null,
    'NON_STOP': null,
    'ADD_STOP': null,
    'NO_BUFFET': null,
    'CHANGED': identifyChanges,
    'DELAYED': identifyDelay
  }

  static #DEFAULT_OPTIONS = {
    port: 25,
    banner: 'V/Line Inform Email Server',
    logger: true
  }

  #mailerOptions
  #mailer
  #addressValidator = () => true
  #networkData

  constructor(mailerOptions, networkData) {
    super()
    this.#mailerOptions = {
      ...VLineMailServer.#DEFAULT_OPTIONS,
      ...(mailerOptions || {})
    }
    this.#networkData = networkData
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

  onValidateRecipient(addressData, session, callback) {
    let { address } = addressData
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
        html: mail.textAsHtml || mail.html || mail.text || ''
      })
      callback()
    })
  }

  onMessage(data) {
    let { subject, message } = VLineMailServer.getMessageContent(data)
    let messageType = getMessageType(subject, message)

    if (messageType === 'NON_SPECIFIC') return this.emit('non_specific', message)

    let processed = VLineMailServer.processMessage(message)

    let serviceData = identifyService(processed, this.#networkData)
    let changeText = removeServiceData(processed, serviceData)

    let messageParser = VLineMailServer.#MESSAGE_PARSERS[messageType]
    let specificData = messageParser ? messageParser(changeText, serviceData, this.#networkData) : null

    this.emit(messageType.toLowerCase(), serviceData, specificData)
  }

  static getMessageContent(data) {
    let { subject, html } = data

    let message = htmlToText(html, {
      wordwrap: false,
      selectors: [
        { selector: 'img', format: 'skip' }
      ]
    }).replace(/More information at.+/s, '')
      .replace(/^[^\w]+/, '')
      .trim()

    return {
      subject: subject || '',
      message
    }
  }

  close() {
    this.#mailer.close()
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