import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { buildHTTPExecutor } from '@graphql-tools/executor-http'
import { stitchSchemas } from '@graphql-tools/stitch'
import { Executor } from '@graphql-tools/utils'
import { schemaFromExecutor } from '@graphql-tools/wrap'
import { GraphQLSchema } from 'graphql'
import { IncomingMessage } from 'http'

type RemoteSchema = {
  schema: GraphQLSchema
  executor: Executor
}

export type Context = {
  req: IncomingMessage & {
    headers: Partial<{
      authorization: string
    }>
  }
}

const getHeaders = (context: Context): Record<string, string> => {
  const { req } = context || {}

  return {
    authorization: req?.headers.authorization || '',
  }
}

export const getRemoteSchema = async (
  endpoint: string,
): Promise<RemoteSchema> => {
  const executor = buildHTTPExecutor({
    endpoint,
    headers: o => getHeaders(o?.context),
  })

  const schema = await schemaFromExecutor(executor)

  return {
    schema,
    executor,
  }
}

const buildRemoteSchemaService = async (): Promise<RemoteSchema[]> => {
  if (!process.env.GRAPHQL_ENDPOINTS) {
    throw new Error('GRAPHQL_ENDPOINTS não está definido')
  }

  const endpoints = process.env.GRAPHQL_ENDPOINTS?.split(';') || []

  if (!endpoints.length) {
    throw new Error('Nenhum endpoint foi definido')
  }

  return Promise.all(endpoints.map(getRemoteSchema))
}

;(async () => {
  const subschemas = await buildRemoteSchemaService()

  const server = new ApolloServer<Context>({
    introspection: true,
    schema: stitchSchemas({ subschemas }),
  })

  const { url } = await startStandaloneServer(server, {
    listen: {
      port: +process.env.GRAPHQL_PORT! || 5000,
    },
    context: async ({ req, res }) => {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader(
        'Access-Control-Allow-Headers',
        [
          'Origin',
          'X-Requested-With',
          'Content-Type',
          'Accept',
          'Authorization',
        ].join(', '),
      )

      return { req }
    },
  })

  console.info(`🚀 Api Gateway ready at ${url}`)
})()
