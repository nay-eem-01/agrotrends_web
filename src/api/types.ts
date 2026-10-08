import type { components } from './schema'

/** Response and request types generated from the backend's OpenAPI document. */
export type Schemas = components['schemas']

export type UserResponse = Schemas['UserResponse']
export type WebTokenResponse = Schemas['WebTokenResponse']

/** Spring Data's `Page` as the backend serialises it. */
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
  empty: boolean
}

export type BlogResponse = Schemas['BlogResponse']
