import io from 'socket.io-client'
import request from 'request'

abstract class Client {
    protected _socket: SocketIOClient.Socket | undefined
    protected _username = ""

    public verbose = false

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

            this.log(error, true)
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
        })

        this._socket.on('game-chat', (messages: any) => {
            this.debugLog('game-chat')
            this.debugLog(messages, true)

            this.log(messages, true)
        })

        this._socket.on('game-state', (state: any) => {
            this.debugLog('game-state')
            this.debugLog(state, true)
        })

        this._socket.on('game-timed-data', (data: any) => {
            this.debugLog('game-timed-data')
            this.debugLog(data, true)
        })
    }
}

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