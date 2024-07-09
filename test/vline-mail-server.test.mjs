import { expect } from 'chai'
import VLineMailServer from '../lib/index.mjs'
import fs from 'fs/promises'
import path from 'path'
import url from 'url'

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sampleFullEmail = (await fs.readFile(path.join(__dirname, 'sample-emails', '1555-sss-wvl-amex.eml'))).toString()

describe('The V/Line Inform Mail Server', () => {
  it('Should receive an email and emit an event accordingly')
})