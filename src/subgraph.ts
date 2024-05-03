import { ApolloServer } from '@apollo/server'
import { startStandaloneServer } from '@apollo/server/standalone'
import { randomUUID } from 'crypto'
import { GraphQLResolveInfo } from 'graphql'

type SubGraphContext = {
  authorization: string
}

const typeDefs = `#graphql
  type Query {
    customers: [Customer]
  }

  type Customer {
    id: ID!
    username: String
    email: String
    token: String
  }
`

const resolvers = {
  Query: {
    customers: (
      parent: any,
      args: Record<string, any>,
      context: SubGraphContext,
      _info: GraphQLResolveInfo,
    ) => [
      {
        id: randomUUID(),
        username: 'alice',
        email: 'alice@email.com',
        token: context.authorization,
      },
      {
        id: randomUUID(),
        username: 'maria',
        email: 'maria@email.com',
        token: context.authorization,
      },
    ],
  },
}

const server = new ApolloServer<SubGraphContext>({
  typeDefs,
  resolvers,
})

;(async () => {
  const { url } = await startStandaloneServer(server, {
    listen: {
      port: +process.env.PORT!,
    },
    context: async ({ req: { headers } }) => ({
      authorization: headers.authorization || '',
    }),
  })

  console.info(`🚀  Server ready at ${url}`)
})()
