import type { components } from './schema'

/** Response and request types generated from the backend's OpenAPI document. */
export type Schemas = components['schemas']

export type UserResponse = Schemas['UserResponse']
export type WebTokenResponse = Schemas['WebTokenResponse']
export type AuthorProfileResponse = Schemas['AuthorProfileResponse']

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

/** The optional cover description is supported by newer servers. */
export interface BlogCoverDescription {
  imageAlt?: string
}

export type BlogResponse = Schemas['BlogResponse'] & BlogCoverDescription
/** A story in a list (feeds, search, drafts, bookmarks): `excerpt` instead of `content`. */
export type StorySummary = Schemas['BlogSummaryResponse']
