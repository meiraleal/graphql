import { ApolloServer } from "apollo-server";
import Sequelize from "sequelize";
import { gql } from "apollo-server";
import { PubSub } from "apollo-server";
const db = new Sequelize("companies", null, null, {
  dialect: "sqlite",
  storage: "./companies.sqlite",
});

db.define("company", {
  name: { type: Sequelize.STRING },
});

const Company = db.models.company;
const pubsub = new PubSub();

const typeDefs = gql`
  type Company {
    id: Int!
    name: String!
  }

  input ChangeCompanyInput {
    id: Int!
    name: String!
  }

  type Query {
    companies: [Company]
    company(id: Int!): Company
  }

  type Mutation {
    changeCompanyName(input: ChangeCompanyInput!): Company
    deleteCompany(id: Int!): Boolean
    addCompany(name: String!): Company
  }

  type Subscription {
    companyNameChanged: Company
    companyAdded: Company
  }
`;

const resolvers = {
  Query: {
    companies: () => Company.findAll(),
    company: (_, args) => Company.find({ where: args }),
  },

  Mutation: {
    deleteCompany: (_, { id }) => {
      const company = Company.destroy({ where: { id } });
      return true;
    },
    changeCompanyName: async (_, { input }) => {
      const { id, name } = input;
      Company.update({ name }, { where: { id } });
      pubsub.publish("companyNameChanged", {
        companyNameChanged: input,
      });

      return input;
    },
    addCompany: async (_, { name }) => {
      const company = await Company.create({
        name,
      });
      const newCompany = { name: company.name, id: company.id };
      pubsub.publish("companyAdded", {
        companyAdded: { company: newCompany },
      });
      console.log(company);
      return newCompany;
    },
  },

  Subscription: {
    companyNameChanged: {
      subscribe: () => pubsub.asyncIterator(["companyNameChanged"]),
    },
    companyAdded: {
      subscribe: () => pubsub.asyncIterator(["companyAdded"]),
    },
  },
};

let server = new ApolloServer({ typeDefs, resolvers, tracing: true });

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
