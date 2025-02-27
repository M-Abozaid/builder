import { gql } from 'apollo-server-micro'

export const pageSchema = gql`
  type Page {
    id: ID! @id(autogenerate: false)
    name: String!
    slug: String!
    rootElement: Element!
      @relationship(type: "ROOT_PAGE_ELEMENT", direction: OUT)
    app: App! @relationship(type: "PAGES", direction: IN)
    getServerSideProps: String
    isProvider: Boolean! @default(value: false)
  }

  extend type Page
    @auth(
      rules: [
        {
          operations: [CREATE, UPDATE]
          roles: ["User"]
          where: { app: { owner: { auth0Id: "$jwt.sub" } } }
          bind: { app: { owner: { auth0Id: "$jwt.sub" } } }
        }
        { operations: [CREATE, UPDATE], roles: ["Admin"] }
      ]
    )
`
