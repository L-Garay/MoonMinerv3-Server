import 'reflect-metadata';
import { PubSub, withFilter } from 'graphql-subscriptions';
const { prisma } = require('../prisma/prismaClient');

const pubSub = new PubSub();

// Resolvers define the technique for fetching the types defined in the
// schema. This resolver retrieves books from the "books" array above.
export const resolvers = {
  Query: {
    books: () => prisma.book.findMany(),
    authors: () => prisma.author.findMany(),
    customers: () => prisma.customer.findMany(),
    games: () => prisma.game.findMany(),
    userAccount: async (parent: any, args: any) => {
      return await prisma.userAccount.findUnique({
        where: { email: args.email },
      });
    },
  },
  // Get authors and their books
  Author: {
    books: (parent: any) =>
      prisma.book.findMany({ where: { authorId: parent.id } }),
  },
  // Get customers and their books
  Customer: {
    books: (parent: any) =>
      prisma.book.findMany({ where: { customerId: parent.id } }),
  },
  // Get books and their author
  Book: {
    author: (parent: any) =>
      prisma.author.findUnique({ where: { id: parent.authorId } }),
  },
  // Get userAccount and their games
  UserAccount: {
    games: (parent: any) =>
      prisma.game.findMany({ where: { userAccountId: parent.id } }),
  },
  Mutation: {
    createUserAccount: async (parent: any, args: any) => {
      return await prisma.userAccount.create({
        data: { name: args.name, email: args.email },
      });
    },
    createGame: async (parent: any, args: any) => {
      const game = await prisma.game.create({
        data: { name: args.name, userAccountId: args.id },
      });
      const user = await prisma.userAccount.findUnique({
        where: { id: args.id },
      });
      pubSub.publish('GAME_CREATED', user);
      return game;
    },
  },
  Subscription: {
    gameCreated: {
      subscribe: withFilter(
        () => pubSub.asyncIterator(['GAME_CREATED']),
        (payload, variables) => payload.id === variables.id
      ),
      resolve: (payload: any) => payload,
    },
  },
};
