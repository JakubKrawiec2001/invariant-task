import { actions } from '@store/reducers/stats'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { network } from '@store/selectors/solanaConnection'
import { getFullSnap } from '@utils/utils'
import { PublicKey } from '@solana/web3.js'
import { handleRpcError } from './connection'

export function* getStats(): Generator {
  try {
    const currentNetwork = yield* select(network)

    const fullSnap = yield* call(getFullSnap, currentNetwork.toLowerCase())
    const parsedFullSnap = {
      ...fullSnap,
      tokensData: fullSnap.tokensData.map(token => ({
        ...token,
        address: new PublicKey(token.address)
      })),
      poolsData: fullSnap.poolsData.map(pool => ({
        ...pool,
        poolAddress: new PublicKey(pool.poolAddress),
        tokenX: new PublicKey(pool.tokenX),
        tokenY: new PublicKey(pool.tokenY)
      }))
    }

    yield* put(actions.setCurrentStats(parsedFullSnap))
  } catch (error) {
    console.log(error)
    yield* call(handleRpcError, (error as Error).message)
    throw error
  }
}

export function* statsHandler(): Generator {
  yield* takeEvery(actions.getCurrentStats, getStats)
}
