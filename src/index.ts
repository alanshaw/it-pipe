import { pushable } from 'it-pushable'
import merge from 'it-merge'
import type * as it from 'it-stream-types'

export const rawPipe = (...fns: any) => {
  let res
  while (fns.length > 0) {
    res = fns.shift()(res)
  }
  return res
}

export const isIterable = (obj: any): obj is it.Source<any> => {
  return obj != null && (
    typeof obj[Symbol.asyncIterator] === 'function' ||
    typeof obj[Symbol.iterator] === 'function' ||
    typeof obj.next === 'function' // Probably, right?
  )
}

export const isDuplex = <TSource, TSink = TSource, RSink = Promise<void>> (obj: any): obj is it.Duplex<TSource, TSink, RSink> => {
  return obj != null && typeof obj.sink === 'function' && isIterable(obj.source)
}

const duplexPipelineFn = <TSource> (duplex: it.Duplex<TSource>) => {
  return (source: any): it.Source<TSource> => {
    const p = duplex.sink(source)

    if (p.then != null) {
      const stream = pushable<TSource>({
        objectMode: true
      })
      p.then(() => {
        stream.end()
      }, (err: Error) => {
        stream.end(err)
      })

      const sourceWrap = async function * () {
        yield * duplex.source
        stream.end()
      }

      return merge(stream, sourceWrap())
    }

    return duplex.source
  }
}

export type Source<A> = it.Source<A> | (() => it.Source<A>) | it.Duplex<A, any, any>
export type Transform<A, B> = it.Transform<A, B> | it.Duplex<B, A, any>
export type Sink<A, B> = it.Sink<A, B> | it.Duplex<any, A, B>

export function pipe<A> (
  first: Source<A>
): it.Source<A>

export function pipe<A, B> (
  first: Source<A>,
  second: Sink<A, B>
): B

export function pipe<A, B, C> (
  first: Source<A>,
  second: Transform<A, B>,
  third: Sink<B, C>
): C

export function pipe<A, B, C, D> (
  first: Source<A>,
  second: Transform<A, B>,
  third: Transform<B, C>,
  fourth: Sink<C, D>
): D

export function pipe<A, B, C, D, E> (
  first: Source<A>,
  second: Transform<A, B>,
  third: Transform<B, C>,
  fourth: Transform<C, D>,
  fifth: Sink<D, E>
): E

export function pipe<A, B, C, D, E, F> (
  first: Source<A>,
  second: Transform<A, B>,
  third: Transform<B, C>,
  fourth: Transform<C, D>,
  fifth: Transform<D, E>,
  sixth: Sink<E, F>
): F

export function pipe<A, B, C, D, E, F, G> (
  first: Source<A>,
  second: Transform<A, B>,
  third: Transform<B, C>,
  fourth: Transform<C, D>,
  fifth: Transform<D, E>,
  sixth: Transform<E, F>,
  seventh: Sink<F, G>
): G

export function pipe<A, B, C, D, E, F, G, H> (
  first: Source<A>,
  second: Transform<A, B>,
  third: Transform<B, C>,
  fourth: Transform<C, D>,
  fifth: Transform<D, E>,
  sixth: Transform<E, F>,
  seventh: Transform<F, G>,
  eighth: Sink<G, H>
): H

export function pipe<A, B, C, D, E, F, G, H, I> (
  first: Source<A>,
  second: Transform<A, B>,
  third: Transform<B, C>,
  fourth: Transform<C, D>,
  fifth: Transform<D, E>,
  sixth: Transform<E, F>,
  seventh: Transform<F, G>,
  eighth: Transform<G, H>,
  ninth: Sink<H, I>
): I

export function pipe<A, B, C, D, E, F, G, H, I, J> (
  first: Source<A>,
  second: Transform<A, B>,
  third: Transform<B, C>,
  fourth: Transform<C, D>,
  fifth: Transform<D, E>,
  sixth: Transform<E, F>,
  seventh: Transform<F, G>,
  eighth: Transform<G, H>,
  ninth: Transform<H, I>,
  tenth: Sink<I, J>
): J

export function pipe (first: any, ...rest: any[]): any {
  // Duplex at start: wrap in function and return duplex source
  if (isDuplex(first)) {
    const duplex = first
    first = () => duplex.source
  // Iterable at start: wrap in function
  } else if (isIterable(first)) {
    const source = first
    first = () => source
  }

  const fns = [first, ...rest]

  if (fns.length > 1) {
    // Duplex at end: use duplex sink
    if (isDuplex(fns[fns.length - 1])) {
      fns[fns.length - 1] = fns[fns.length - 1].sink
    }
  }

  if (fns.length > 2) {
    // Duplex in the middle, consume source with duplex sink and return duplex source
    for (let i = 1; i < fns.length - 1; i++) {
      if (isDuplex(fns[i])) {
        fns[i] = duplexPipelineFn(fns[i])
      }
    }
  }

  return rawPipe(...fns)
}
