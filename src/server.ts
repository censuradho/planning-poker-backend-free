import { AddressInfo } from 'net'

import app from 'app'
import 'websocket'

import pino from 'lib/pino'

const PORT = (process.env.PORT || 3333 )as number

const server = app.listen(PORT, () => {
	const { address, port } = server.address() as AddressInfo

	pino.info(`Server running on ${address}:${port}`)
})