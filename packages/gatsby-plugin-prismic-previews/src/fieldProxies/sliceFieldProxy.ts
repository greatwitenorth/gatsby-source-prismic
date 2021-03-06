import * as gatsbyPrismic from 'gatsby-source-prismic'
import * as RE from 'fp-ts/ReaderEither'
import * as A from 'fp-ts/Array'
import * as R from 'fp-ts/Record'
import { pipe } from 'fp-ts/function'

import {
  proxyDocumentSubtree,
  ProxyDocumentSubtreeEnv,
} from '../lib/proxyDocumentSubtree'

export const valueRefinement = (
  value: unknown,
): value is gatsbyPrismic.PrismicAPISliceField =>
  typeof value === 'object' && value !== null && 'slice_type' in value

export const proxyValue = (
  path: string[],
  fieldValue: gatsbyPrismic.PrismicAPISliceField,
): RE.ReaderEither<ProxyDocumentSubtreeEnv, Error, unknown> =>
  pipe(
    RE.ask<ProxyDocumentSubtreeEnv>(),
    RE.bind('primary', () =>
      pipe(
        fieldValue.primary ?? {},
        R.mapWithIndex((fieldName, value) =>
          proxyDocumentSubtree([...path, 'primary', fieldName], value),
        ),
        R.sequence(RE.readerEither),
      ),
    ),
    RE.bind('items', () =>
      pipe(
        fieldValue.items ?? [],
        A.map((item) =>
          pipe(
            item,
            R.mapWithIndex((fieldName, value) =>
              proxyDocumentSubtree([...path, 'items', fieldName], value),
            ),
            R.sequence(RE.readerEither),
          ),
        ),
        A.sequence(RE.readerEither),
      ),
    ),
    RE.map((env) => ({
      ...fieldValue,
      primary: env.primary,
      items: env.items,
    })),
  )
