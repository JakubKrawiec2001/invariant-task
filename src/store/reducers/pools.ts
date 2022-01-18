import { Token } from '@consts/static'
import { Pair } from '@invariant-labs/sdk'
import { PoolStructure } from '@invariant-labs/sdk/lib/market'
import { Tick } from '@invariant-labs/sdk/src/market'
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { PublicKey } from '@solana/web3.js'
import { PayloadType } from './types'

export interface PoolWithAddress extends PoolStructure {
  address: PublicKey
}

export interface IPoolsStore {
  tokens: Record<string, Token>
  pools: PoolWithAddress[]
  poolTicks: Tick[]
  initPool: boolean
}

export interface UpdatePool {
  index: number
  poolStructure: PoolStructure
}

export const defaultState: IPoolsStore = {
  tokens: {},
  pools: [],
  poolTicks: [],
  initPool: false
}

export const poolsSliceName = 'pools'
const poolsSlice = createSlice({
  name: poolsSliceName,
  initialState: defaultState,
  reducers: {
    initPool(state, action: PayloadAction<boolean>) {
      state.initPool = action.payload
      return state
    },
    setTokens(state, action: PayloadAction<Record<string, Token>>) {
      state.tokens = action.payload
      return state
    },
    setPools(state, action: PayloadAction<PoolWithAddress[]>) {
      state.pools = action.payload
      return state
    },
    setTicks(state, action: PayloadAction<Tick[]>) {
      state.poolTicks = action.payload
      return state
    },
    updatePool(state, action: PayloadAction<UpdatePool>) {
      state.pools[action.payload.index] = {
        address: state.pools[action.payload.index].address,
        ...action.payload.poolStructure
      }
      return state
    },
    getPoolsData(_state, _action: PayloadAction<Pair[]>) {}
  }
})

export const actions = poolsSlice.actions
export const reducer = poolsSlice.reducer
export type PayloadTypes = PayloadType<typeof actions>
