import io from 'socket.io-client'
import request from 'request'

abstract class Client {
    protected _socket: SocketIOClient.Socket | undefined
    protected _username = ""
    protected _lastError: any

    public verbose = false

    public get lastError() {
        return this._lastError
    }

    public initWithCookie(cookie: string, gameId: string) {
        this.initSocket(cookie, gameId)
    }

    public initWithCredentials(username: string, password: string, gameId: string) {
        this._username = username
        
        request.post('https://binm.at/login', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36',
                'Content-Type': 'application/json'
            },
            body: `{"username":"${username}","password":"${password}"}`
        }, (error, response, body) => {
            let setCookieHeader = response.headers["set-cookie"]
            if (!setCookieHeader) {
                throw Error("setCookieHeader is null")
            }

            let firstCookieHeader = setCookieHeader[0]
            if (!firstCookieHeader) {
                throw Error("setCookieHeader is empty")
            }

            let match = /(binmat_session=[^;]+);/.exec(firstCookieHeader)
            if (!match) {
                throw Error("no match for binmat session cookie")
            }
            
            this.initSocket(match[1], gameId)
        })
    }

    public exit() {
        if (this._socket) {
            this._socket.emit('disconnect')
        }
    }

    protected debugLog(message: string, isObject?: boolean) {
        if (this.verbose) {
            if (isObject) {
                console.log(`[${this._username}]:`)
                console.log(message)
            } else {
                console.log(`[${this._username}]: ${message}`)
            }
        }
    }

    protected log(message: string, isObject?: boolean) {
        if (isObject) {
            console.log(`[${this._username}]:`)
            console.log(message)
        } else {
            console.log(`[${this._username}]: ${message}`)
        }
    }

    protected abstract initSocket(cookie: string, gameId: string):void
}

export class GameClient extends Client {
    private _lastGameChat: any
    private _lastGameState: any
    private _lastTimedData: any

    public get lastGameChat() {
        return this._lastGameChat
    }

    public get lastGameState() {
        return this._lastGameState
    }

    public get lastTimedData() {
        return this._lastTimedData
    }

    protected initSocket(cookie: string, gameId: string) {
        this._socket = io('https://binm.at/game', {
            query: { 'game_id': gameId },
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'Cookie': cookie
                    }
                }
            }
        })

        this._socket.on('generic-error', (error: any) => {
            this.debugLog('generic-error')
            this.debugLog(error, true)

            this._lastError = error
        })

        this._socket.on('connect', () => {
            this.debugLog('connect')
        })

        this._socket.on('disconnect', () => {
            this.debugLog('disconnect')
        })

        this._socket.on('game-username', (username: any) => {
            this.debugLog('game-username')
            this.debugLog(username, true)

            this.log(username, true)
        })

        this._socket.on('game-chat', (messages: any) => {
            this.debugLog('game-chat')
            this.debugLog(messages, true)

            this._lastGameChat = messages

            this.log(messages, true)
        })

        this._socket.on('game-state', (state: any) => {
            this.debugLog('game-state')
            this.debugLog(state, true)

            if (!this._lastGameState && this._username === "prism_bot") {
                this.drawFromLane(2)
            }

            this._lastGameState = state
        })

        this._socket.on('game-timed-data', (data: any) => {
            this.debugLog('game-timed-data')
            this.debugLog(data, true)

            this._lastTimedData = data
        })
    }

    public pass() {
        this.act('pass', {})
    }

    public drawFromLane(index: number) {
        this.act('draw_from_deck', { deck_type: 'lane_deck', deck_index: index })
    }

    public drawFromAttack() {
        this.act('draw_from_deck', { deck_type: 'attacker_deck' })
    }

    private act(action: string, params:any) {
        if (!this._socket) {
            return
        }

        params.action = action

        this._socket.emit('game-play', params)
    }
}

/*
client->server key: action

hand_to_stack:
card        - suit/value pair
owner       - owner of stack card was dropped onto
stack_index - index of stack card was dropped onto
button      - left for face down, right for face up.

hand_to_discard:
card          - suit/value pair
discard_type  - attacker_discard/lane_discard
discard_index - index of discard if lane_discard

draw_from_deck:
deck_type   - "lane_deck" or "attacker_deck",
deck_index  - index of lane deck if lane deck

initiate_combat:
owner       - owner of stack combat initiated with
stack_index - index of stack combat initiated with

pass


{action:"hand_to_stack",card:["&",3],owner:"defender",stack_index:2}
*/

export class LobbyClient extends Client {
    protected initSocket(cookie: string, gameId: string) {
        this._socket = io('https://binm.at/lobby', {
            transportOptions: {
                polling: {
                    extraHeaders: {
                        'Cookie': cookie
                    }
                }
            }
        })

        this._socket.on('generic-error', (error: any) => {
            this.debugLog('generic-error')
            this.debugLog(error, true)

            this.log(error, true)
        })

        this._socket.on('connect', () => {
            this.debugLog('connect')
        })

        this._socket.on('disconnect', () => {
            this.debugLog('disconnect')
        })

        this._socket.on('lobby-users', (users: any) => {
            this.debugLog('lobby-users')
            this.debugLog(users, true)
        })

        this._socket.on('lobby-chat', (messages: any) => {
            this.debugLog('lobby-chat')
            this.debugLog(messages, true)

            this.log(messages, true)
        })

        this._socket.on('lobby-state', (state: any) => {
            this.debugLog('lobby-state')
            this.debugLog(state, true)
        })

        this._socket.on('lobby-refresh', () => {
            this.debugLog('lobby-refresh')
        })
    }
}