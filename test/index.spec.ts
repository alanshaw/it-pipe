import { expect } from 'aegir/utils/chai.js'
import { pipe } from '../src/index.js'
import all from 'it-all'
import drain from 'it-drain'
import { filter, collect, consume } from 'streaming-iterables'
import delay from 'delay'
import type { Duplex, Source } from 'it-stream-types'

const oneTwoThree = () => [1, 2, 3]

describe('it-pipe', () => {
  it('should pipe source', async () => {
    const result = await pipe(oneTwoThree)
    expect(result).to.deep.equal([1, 2, 3])
  })

  it('should pipe source -> sink', async () => {
    const result = await pipe(oneTwoThree, all)
    expect(result).to.deep.equal([1, 2, 3])
  })

  it('should pipe source -> transform -> sink', async () => {
    const result = await pipe(
      oneTwoThree,
      function transform (source) {
        return (async function * () { // A generator is async iterable
          for await (const val of source) yield val * 2
        })()
      },
      all
    )

    expect(result).to.deep.equal([2, 4, 6])
  })

  it('should allow iterable first param', async () => {
    const result = await pipe(oneTwoThree(), all)
    expect(result).to.deep.equal([1, 2, 3])
  })

  it('should allow duplex at start', async () => {
    const duplex: Duplex<number, number, Promise<number[]>> = {
      sink: all,
      source: oneTwoThree()
    }

    const result = await pipe(duplex, all)
    expect(result).to.deep.equal([1, 2, 3])
  })

  it('should allow duplex at end', async () => {
    const duplex: Duplex<number, number, Promise<number[]>> = {
      sink: all,
      source: oneTwoThree()
    }

    const result = await pipe(oneTwoThree, duplex)
    expect(result).to.deep.equal([1, 2, 3])
  })

  it('should allow duplex in the middle', async () => {
    const duplex: Duplex<number, number, Promise<void>> = {
      sink: async source => { duplex.source = source },
      source: []
    }

    const result = await pipe(oneTwoThree, duplex, all)
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

    const result = await pipe(
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
      collect
    )

    expect(result).to.deep.equal([2, 3])
  })

  it('should allow streaming iterables consume', async () => {
    const input = [0, 1, 2, 3]

    const result = await pipe(
      input,
      filter((val: number) => val > 1),
      // @ts-expect-error https://github.com/reconbot/streaming-iterables/issues/232
      (source) => consume(source)
    )

    expect(result).to.be.undefined()
  })

  it('should propagate duplex transform sink errors', async () => {
    const err = new Error('Aaargh')

    await expect(
      pipe(
        oneTwoThree, {
          source: (async function * () {
            await delay(1000)
            yield 5
          }()),
          sink: async (source: Source<number>) => {
            await delay(20)
            throw err
          }
        },
        async (source) => await drain(source)
      )
    ).to.eventually.be.rejected.with.property('message', err.message)
  })
})
