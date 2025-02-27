import * as Types from '@codelab/shared/abstract/codegen'

import { UserFragment } from '../../../../abstract/core/src/domain/user/user.fragment.graphql.gen'
import { GraphQLClient } from 'graphql-request'
import * as Dom from 'graphql-request/dist/types.dom'
import { gql } from 'graphql-tag'
import { UserFragmentDoc } from '../../../../abstract/core/src/domain/user/user.fragment.graphql.gen'
export type GetUsersQueryVariables = Types.Exact<{ [key: string]: never }>

export type GetUsersQuery = { users: Array<UserFragment> }

export type CreateUserMutationVariables = Types.Exact<{
  input: Array<Types.UserCreateInput> | Types.UserCreateInput
}>

export type CreateUserMutation = {
  createUsers: { users: Array<{ id: string; email: string }> }
}

export const GetUsersDocument = gql`
  query GetUsers {
    users {
      ...User
    }
  }
  ${UserFragmentDoc}
`
export const CreateUserDocument = gql`
  mutation CreateUser($input: [UserCreateInput!]!) {
    createUsers(input: $input) {
      users {
        id
        email
      }
    }
  }
`

export type SdkFunctionWrapper = <T>(
  action: (requestHeaders?: Record<string, string>) => Promise<T>,
  operationName: string,
  operationType?: string,
) => Promise<T>

const defaultWrapper: SdkFunctionWrapper = (
  action,
  _operationName,
  _operationType,
) => action()

export function getSdk(
  client: GraphQLClient,
  withWrapper: SdkFunctionWrapper = defaultWrapper,
) {
  return {
    GetUsers(
      variables?: GetUsersQueryVariables,
      requestHeaders?: Dom.RequestInit['headers'],
    ): Promise<GetUsersQuery> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<GetUsersQuery>(GetUsersDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'GetUsers',
        'query',
      )
    },
    CreateUser(
      variables: CreateUserMutationVariables,
      requestHeaders?: Dom.RequestInit['headers'],
    ): Promise<CreateUserMutation> {
      return withWrapper(
        (wrappedRequestHeaders) =>
          client.request<CreateUserMutation>(CreateUserDocument, variables, {
            ...requestHeaders,
            ...wrappedRequestHeaders,
          }),
        'CreateUser',
        'mutation',
      )
    },
  }
}
export type Sdk = ReturnType<typeof getSdk>
