/**
 * Demonstration of async fastify.close() handling.
 */
import Fastify from 'fastify'

/**
 * @typedef DatabaseConfig
 * @property {string} name database name, identifier
 * @property {number} timeout waiting time
 */

/**
 * Sleeping for seconds
 * @param {number} s sleep time in seconds
 * @returns {Promise}
 */
async function sleep(s) {
  return new Promise(resolve => setTimeout(resolve, s * 1000))
}

const fastify = Fastify({})

/**
 * DB Connection handler.
 * @param {import('fastify').FastifyInstance} fastify
 * @param {object} opts
 */
const dbConnection = async function (fastify, opts) {
  /** @type {DatabaseConfig} */
  const dbConfig = opts.dbConfig
  console.log('Init database connections for ' + dbConfig.name)
  // Missing type definition on FastifyInstance?
  fastify.onClose(async () => {
    console.log(
      `Closing ${dbConfig.name} database... it takes ${dbConfig.timeout} seconds!`
    )
    // simulate error on resource's close
    // throw new Error('DB close error')
    await sleep(dbConfig.timeout)
    console.log('Successful closed all ' + dbConfig.name + ' DB connection.')
  })
}

/** Registering 2 fastify plugin: 2 DB connection handler. */
fastify.register(dbConnection, { dbConfig: { name: 'FirstDB', timeout: 5 } })
fastify.register(dbConnection, { dbConfig: { name: 'SecondDB', timeout: 1 } })

fastify.listen(5000, '127.0.0.1', (error, address) => {
  console.log('Server started at ' + address)
})

/**
 * Customize the code by isAsync constant!
 * If you run close() as synchronous code, then resource connections closing are incidental.
 */
function shutdown(exitCode) {
  const isAsync = false
  if (isAsync) {
    /**
     * Correct!
     * Asynchronous handling of close().
     * Close is Promise.
     */
    fastify
      ?.close()
      .catch(err => {
        console.log('Server shutdown error: ' + err.message)
      })
      .finally(() => {
        console.log('Server stopped.')
        process.exit(exitCode)
      })
  } else {
    /**
     * Wrong!
     * Synchronous running close().
     * You never see the resource closing logs.
     */
    fastify?.close()
    console.log('Server stopped.')
    process.exit(exitCode)
  }
}

process.on('SIGINT', signal => {
  console.log('Server caught ' + signal)
  shutdown(0)
})

process.on('SIGTERM', signal => {
  console.log('Server caught ' + signal)
  shutdown(0)
})

process.on('SIGUSR1', signal => {
  console.log('Server caught ' + signal)
  shutdown(0)
})
