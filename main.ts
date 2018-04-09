import {GameClient} from './client'

let credentials = require('./credentials.json')

let gameId = '21e3175c-316f-4782-b7b8-731f39b023ef'

let nobotClient = new GameClient()
let prismClient = new GameClient()

nobotClient.initWithCredentials(credentials[0].user, credentials[0].pass, gameId)
prismClient.initWithCredentials(credentials[1].user, credentials[1].pass, gameId)