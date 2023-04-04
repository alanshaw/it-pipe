import { expect } from 'aegir/chai'
import { pipe } from '../src/index.js'
import all from 'it-all'
import drain from 'it-drain'
import map from 'it-map'
import { filter, collect, consume } from 'streaming-iterables'
import delay from 'delay'
import defer from 'p-defer'
import type { Source, Duplex } from 'it-stream-types'

const oneTwoThree = (): number[] => [1, 2, 3]

const asyncOneTwoThree = async function * (): AsyncGenerator<number, void, undefined> {
  yield * oneTwoThree()
}

type IsAny<T> = unknown extends T ? T extends {} ? T : never : never
type NotAny<T> = T extends IsAny<T> ? never : T

/**
 * Utility function to assert that tsc has not derived the type of
 * the passed argument as 'any'
 */
function assertNotAny<T> (x: NotAny<T>): void {

}

/**
 * Utility function to assert that tsc has not derived the type of
 * the passed argument as 'never'
 */
function assertNotNever (x: never): void {

}

describe('it-pipe', () => {
  describe('one item pipeline', () => {
    it('should pipe iterable source', () => {
      const result = pipe(oneTwoThree())

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result[Symbol.iterator]).to.be.ok()
      expect(result).to.deep.equal([1, 2, 3])
    })

    it('should pipe function source', () => {
      const result = pipe(oneTwoThree)

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result[Symbol.iterator]).to.be.ok()
      expect(result).to.deep.equal([1, 2, 3])
    })

    it('should pipe async iterable source', async () => {
      const result = pipe(asyncOneTwoThree())

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result[Symbol.asyncIterator]).to.be.ok()
      await expect(all(result)).to.eventually.deep.equal([1, 2, 3])
    })

    it('should pipe async function source', async () => {
      const result = pipe(asyncOneTwoThree)

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result[Symbol.asyncIterator]).to.be.ok()
      await expect(all(result)).to.eventually.deep.equal([1, 2, 3])
    })

    it('should allow single duplex', async () => {
      const duplex: Duplex<number[], number[], string[]> = {
        source: oneTwoThree(),
        sink: (source) => {
          return all(source).map(n => n.toString())
        }
      }

      const result = pipe(
        duplex
      )

      // @ts-expect-error - result should not be assignable to never
      assertNotNever(result)
      assertNotAny(result)

      expect(result[Symbol.iterator]).to.be.ok()
      expect(result).to.deep.equal(oneTwoThree())
    })

    it('should allow single async duplex', async () => {
      const duplex: Duplex<AsyncGenerator<number>, AsyncGenerator<number>, AsyncGenerator<string>> = {
        source: asyncOneTwoThree(),
        sink: (source) => {
          return map(source, n => n.toString())
        }
      }

      const result = pipe(
        duplex
      )

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result[Symbol.asyncIterator]).to.be.ok()
      await expect(all(result)).to.eventually.deep.equal(oneTwoThree())
    })
  })

  describe('two item pipeline', () => {
    it('should pipe iterable source -> sink function', () => {
      const result = pipe(
        oneTwoThree(),
        (source) => all(source)
      )

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result).to.deep.equal([1, 2, 3])
    })

    it('should pipe iterable function source -> sink function', () => {
      const result = pipe(
        oneTwoThree,
        (source) => all(source)
      )

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result).to.deep.equal([1, 2, 3])
    })

    it('should pipe async iterable source -> sink function', async () => {
      const result = await pipe(
        asyncOneTwoThree(),
        async (source) => await all(source)
      )

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result).to.deep.equal([1, 2, 3])
    })

    it('should pipe async iterable function source -> sink function', async () => {
      const result = await pipe(
        asyncOneTwoThree,
        async (source) => await all(source)
      )

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result).to.deep.equal([1, 2, 3])
    })
  })

  describe('three item pipeline', () => {
    it('should pipe iterable source -> transform -> sink function', () => {
      const result = pipe(
        oneTwoThree(),
        function * (source) {
          for (const n of source) {
            yield n.toString()
          }
        },
        (source) => all(source)
      )

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result).to.deep.equal(['1', '2', '3'])
    })

    it('should pipe async iterable source -> async transform -> sink function', async () => {
      const result = await pipe(
        asyncOneTwoThree(),
        async function * (source) {
          for await (const n of source) {
            yield n.toString()
          }
        },
        async (source) => await all(source)
      )

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result).to.deep.equal(['1', '2', '3'])
    })

    it('should pipe iterable source -> duplex -> sink function', () => {
      const duplex: Duplex<number[], number[]> = {
        sink: source => { duplex.source = source },
        source: []
      }

      const result = pipe(
        oneTwoThree,
        duplex,
        (source) => all(source)
      )

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result[Symbol.iterator]).to.be.ok()
      expect(result).to.deep.equal([1, 2, 3])
    })

    it('should pipe async iterable source -> duplex -> sink function', async () => {
      const duplex: Duplex<AsyncGenerator<number>, AsyncGenerator<number>, void> = {
        sink: source => { duplex.source = source },
        source: (async function * () {}())
      }

      const result = await pipe(
        asyncOneTwoThree(),
        duplex,
        async (source) => await all(source)
      )

      // @ts-expect-error - result should not be assignable to never - if it is
      // then we've broken the types and this comment will cause tsc to fail
      assertNotNever(result)
      assertNotAny(result)

      expect(result).to.deep.equal([1, 2, 3])
    })
  })

  it('should pipe source -> transform -> sink', () => {
    const result = pipe(
      oneTwoThree,
      function * transform (source) {
        for (const val of source) {
          yield val * 2
        }
      },
      (source) => all(source)
    )

    expect(result[Symbol.iterator]).to.be.ok()
    expect(result).to.deep.equal([2, 4, 6])
  })

  it('should pipe source -> async transform -> sink', async () => {
    const result = await pipe(
      oneTwoThree,
      async function * transform (source) {
        for await (const val of source) {
          yield val * 2
        }
      },
      async (source) => await all(source)
    )

    expect(result[Symbol.iterator]).to.be.ok()
    expect(result).to.deep.equal([2, 4, 6])
  })

  it('should allow iterable first param', () => {
    const result = pipe(
      oneTwoThree(),
      (source) => all(source)
    )

    expect(result[Symbol.iterator]).to.be.ok()
    expect(result).to.deep.equal([1, 2, 3])
  })

  it('should allow async iterable first param', async () => {
    const result = pipe(
      (async function * () {
        yield * oneTwoThree()
      }()),
      async (source) => await all(source)
    )

    expect(result.then).to.be.ok()
    await expect(result).to.eventually.deep.equal([1, 2, 3])
  })

  it('should allow duplex at start', async () => {
    const duplex = {
      sink: all,
      source: oneTwoThree()
    }

    const result = pipe(
      duplex,
      (source) => all(source)
    )

    expect(result[Symbol.iterator]).to.be.ok()
    expect(result).to.deep.equal([1, 2, 3])
  })

  it('should allow async duplex at start', async () => {
    const duplex: Duplex<AsyncIterable<number>, number[]> = {
      sink: all,
      source: asyncOneTwoThree()
    }

    const result = pipe(
      duplex,
      async (source) => await all(source)
    )

    expect(result.then).to.be.ok()
    await expect(result).to.eventually.deep.equal([1, 2, 3])
  })

  it('should allow duplex at end', async () => {
    const duplex = {
      sink: (source: number[]) => all(source),
      source: oneTwoThree()
    }

    const result = pipe(oneTwoThree, duplex)

    expect(result[Symbol.iterator]).to.be.ok()
    expect(result).to.deep.equal([1, 2, 3])
  })

  it('should allow it-all', async () => {
    const input = [0, 1, 2, 3]

    const result = await pipe(
      input,
      filter((val: number) => val > 1),
      async (source) => await all(source)
    )

    expect(result).to.deep.equal([2, 3])
  })

  it('should allow it-drain', async () => {
    const input = [0, 1, 2, 3]

    const result = await pipe( // eslint-disable-line @typescript-eslint/no-confusing-void-expression
      input,
      (source) => source,
      filter((val: number) => val > 1),
      drain
    )

    expect(result).to.be.undefined()
  })

  it('should allow streaming iterables collect', async () => {
    const input = [0, 1, 2, 3]

    const result = await pipe(
      input,
      filter((val: number) => val > 1),
      async (source) => await collect(source)
    )

    expect(result).to.deep.equal([2, 3])
  })

  it('should allow streaming iterables consume', async () => {
    const input = [0, 1, 2, 3]

    const result = await pipe( // eslint-disable-line @typescript-eslint/no-confusing-void-expression
      input,
      filter((val: number) => val > 1),
      async (source) => { await consume(source) }
    )

    expect(result).to.be.undefined()
  })

  it('should propagate duplex transform sink errors', async () => {
    const err = new Error('Aaargh')

    await expect(
      pipe(
        oneTwoThree, {
          source: (async function * (): AsyncGenerator<number> {
            await delay(1000)
            yield 5
          }()),
          sink: async (source: Source<number>) => {
            await delay(20)
            throw err
          }
        },
        async (source) => { await drain(source) }
      )
    ).to.eventually.be.rejected.with.property('message', err.message)
  })

  it('should support goodbye-style source', async () => {
    const deferred = defer()
    const end = 5
    let otherEnded = false

    await pipe(
      async function * () {
        for (let i = 0; i < end + 1; i++) {
          yield i
        }

        while (!otherEnded) { // eslint-disable-line no-unmodified-loop-condition
          await delay(10)
        }
      }, {
        sink: async (source: Source<number>) => {
          for await (const val of source) {
            if (val === end) {
              deferred.resolve()
            }
          }
        },
        source: (async function * () {
          yield * [1, 2, 3]
          yield end
          await deferred.promise
        }())
      },
      async (source) => {
        await drain(source)
        otherEnded = true
      }
    )
  })

  it('should pipe to a duplex with a different source type to sink type', async () => {
    const data = [0, 1, 2, 3, 4]
    const collected = defer<number[]>()
    const input: Source<number> = (async function * () {
      await delay(1)
      yield * data
    }())
    const output: Duplex<string[], AsyncIterable<number>, Promise<void>> = {
      source: ['hello', 'world'],
      sink: async (source) => {
        collected.resolve(await all(source))
      }
    }

    await pipe(
      input,
      output
    )

    const result = await collected.promise

    expect(result).to.deep.equal(data)
  })
})
