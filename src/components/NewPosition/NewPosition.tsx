import { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import Slippage from '@components/Modals/Slippage/Slippage'
import Refresher from '@components/Refresher/Refresher'
import { Box, Button, Grid, Hidden, Typography } from '@mui/material'
import backIcon from '@static/svg/back-arrow.svg'
import settingIcon from '@static/svg/settings.svg'
import {
  ALL_FEE_TIERS_DATA,
  NetworkType,
  PositionTokenBlock,
  REFRESHER_INTERVAL
} from '@store/consts/static'
import {
  addressToTicker,
  calcPriceByTickIndex,
  calculateConcentrationRange,
  convertBalanceToBN,
  determinePositionTokenBlock,
  parseFeeToPathFee,
  printBN,
  trimLeadingZeros,
  validConcentrationMidPriceTick
} from '@utils/utils'
import { PlotTickData } from '@store/reducers/positions'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { VariantType } from 'notistack'
import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConcentrationTypeSwitch from './ConcentrationTypeSwitch/ConcentrationTypeSwitch'
import DepositSelector from './DepositSelector/DepositSelector'
import MarketIdLabel from './MarketIdLabel/MarketIdLabel'
import PoolInit from './PoolInit/PoolInit'
import RangeSelector from './RangeSelector/RangeSelector'
import useStyles from './style'
import { BestTier, PositionOpeningMethod, TokenPriceData } from '@store/consts/types'
import { Status } from '@store/reducers/solanaWallet'
import { SwapToken } from '@store/selectors/solanaWallet'
import { InitMidPrice } from '@components/PriceRangePlot/PriceRangePlot'
import { PublicKey } from '@solana/web3.js'
import { BN } from '@project-serum/anchor'
import { Decimal } from '@invariant-labs/sdk/lib/market'
import { INoConnected } from '@components/NoConnected/NoConnected'
import { fromFee, getConcentrationArray, getMinTick } from '@invariant-labs/sdk/lib/utils'
import { getMaxTick } from '@invariant-labs/sdk/src/utils'
import { TooltipHover } from '@components/TooltipHover/TooltipHover'

export interface INewPosition {
  initialTokenFrom: string
  initialTokenTo: string
  initialFee: string
  poolAddress: string
  calculatePoolAddress: () => Promise<string>
  copyPoolAddressHandler: (message: string, variant: VariantType) => void
  tokens: Record<string, SwapToken>
  data: PlotTickData[]
  midPrice: InitMidPrice
  setMidPrice: (mid: InitMidPrice) => void
  addLiquidityHandler: (
    leftTickIndex: number,
    rightTickIndex: number,
    xAmount: number,
    yAmount: number,
    slippage: Decimal
  ) => void
  onChangePositionTokens: (
    tokenA: PublicKey | null,
    tokenB: PublicKey | null,
    feeTierIndex: number
  ) => void
  isCurrentPoolExisting: boolean
  calcAmount: (
    amount: BN,
    leftRangeTickIndex: number,
    rightRangeTickIndex: number,
    tokenAddress: PublicKey
  ) => BN
  feeTiers: Array<{
    feeValue: number
  }>
  ticksLoading: boolean
  loadingTicksAndTickMaps: boolean
  showNoConnected?: boolean
  noConnectedBlockerProps: INoConnected
  progress: ProgressState
  isXtoY: boolean
  xDecimal: number
  yDecimal: number
  tickSpacing: number
  isWaitingForNewPool: boolean
  poolIndex: number | null
  currentPairReversed: boolean | null
  bestTiers: BestTier[]
  currentPriceSqrt: BN
  handleAddToken: (address: string) => void
  commonTokens: PublicKey[]
  initialOpeningPositionMethod: PositionOpeningMethod
  onPositionOpeningMethodChange: (val: PositionOpeningMethod) => void
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
  tokenAPriceData?: TokenPriceData
  tokenBPriceData?: TokenPriceData
  priceALoading?: boolean
  priceBLoading?: boolean
  hasTicksError?: boolean
  reloadHandler: () => void
  plotVolumeRange?: {
    min: number
    max: number
  }
  currentFeeIndex: number
  onSlippageChange: (slippage: string) => void
  initialSlippage: string
  globalPrice: number
  onRefresh: () => void
  isBalanceLoading: boolean
  shouldNotUpdatePriceRange: boolean
  unblockUpdatePriceRange: () => void
  isGetLiquidityError: boolean
  onlyUserPositions: boolean
  setOnlyUserPositions: (val: boolean) => void
  network: NetworkType
  isLoadingTokens: boolean
  solBalance: BN
  walletStatus: Status
  onConnectWallet: () => void
  onDisconnectWallet: () => void
}

export const NewPosition: React.FC<INewPosition> = ({
  initialTokenFrom,
  initialTokenTo,
  initialFee,
  poolAddress,
  calculatePoolAddress,
  copyPoolAddressHandler,
  tokens,
  data,
  midPrice,
  setMidPrice,
  addLiquidityHandler,
  progress = 'progress',
  onChangePositionTokens,
  isCurrentPoolExisting,
  calcAmount,
  feeTiers,
  ticksLoading,
  isXtoY,
  xDecimal,
  yDecimal,
  tickSpacing,
  isWaitingForNewPool,
  poolIndex,
  currentPairReversed,
  bestTiers,
  handleAddToken,
  commonTokens,
  initialOpeningPositionMethod,
  onPositionOpeningMethodChange,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange,
  tokenAPriceData,
  tokenBPriceData,
  priceALoading,
  priceBLoading,
  hasTicksError,
  reloadHandler,
  plotVolumeRange,
  currentFeeIndex,
  onSlippageChange,
  initialSlippage,
  globalPrice,
  currentPriceSqrt,
  onRefresh,
  isBalanceLoading,
  shouldNotUpdatePriceRange,
  unblockUpdatePriceRange,
  isGetLiquidityError,
  onlyUserPositions,
  setOnlyUserPositions,
  network,
  isLoadingTokens,
  solBalance,
  walletStatus,
  onConnectWallet,
  onDisconnectWallet
}) => {
  const { classes } = useStyles()
  const navigate = useNavigate()

  const [positionOpeningMethod, setPositionOpeningMethod] = useState<PositionOpeningMethod>(
    initialOpeningPositionMethod
  )

  const [leftRange, setLeftRange] = useState(getMinTick(tickSpacing))
  const [rightRange, setRightRange] = useState(getMaxTick(tickSpacing))

  const [tokenA, setTokenA] = useState<PublicKey | null>(null)
  const [tokenB, setTokenB] = useState<PublicKey | null>(null)

  const [tokenADeposit, setTokenADeposit] = useState<string>('')
  const [tokenBDeposit, setTokenBDeposit] = useState<string>('')

  const [address, setAddress] = useState<string>(poolAddress)
  const [settings, setSettings] = React.useState<boolean>(false)
  const [slippTolerance, setSlippTolerance] = React.useState<string>(initialSlippage)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const [concentrationIndex, setConcentrationIndex] = useState(0)

  const [minimumSliderIndex, setMinimumSliderIndex] = useState<number>(0)

  const [shouldResetPlot, setShouldResetPlot] = useState(true)

  const [refresherTime, setRefresherTime] = React.useState<number>(REFRESHER_INTERVAL)

  const [shouldReversePlot, setShouldReversePlot] = useState(false)

  const concentrationArray = useMemo(() => {
    const validatedMidPrice = validConcentrationMidPriceTick(midPrice.index, isXtoY, tickSpacing)

    return getConcentrationArray(tickSpacing, 2, validatedMidPrice).sort((a, b) => a - b)
  }, [tickSpacing, midPrice.index])

  const setRangeBlockerInfo = () => {
    if (tokenA === null || tokenB === null) {
      return 'Select tokens to set price range.'
    }

    if (tokenA.equals(tokenB)) {
      return "Token A can't be the same as token B"
    }

    if (isWaitingForNewPool) {
      return 'Loading pool info...'
    }

    return ''
  }

  const noRangePlaceholderProps = {
    data: Array(100)
      .fill(1)
      .map((_e, index) => ({ x: index, y: index, index })),
    midPrice: {
      x: 50,
      index: 0
    },
    tokenASymbol: 'ABC',
    tokenBSymbol: 'XYZ'
  }

  const getOtherTokenAmount = (amount: BN, left: number, right: number, byFirst: boolean) => {
    const printAddress = byFirst ? tokenB : tokenA
    const calcAddress = byFirst ? tokenA : tokenB
    if (printAddress === null || calcAddress === null) {
      return '0.0'
    }

    const result = calcAmount(amount, left, right, calcAddress)

    return trimLeadingZeros(printBN(result, tokens[printAddress.toString()].decimals))
  }

  const getTicksInsideRange = (left: number, right: number, isXtoY: boolean) => {
    const leftMax = isXtoY ? getMinTick(tickSpacing) : getMaxTick(tickSpacing)
    const rightMax = isXtoY ? getMaxTick(tickSpacing) : getMinTick(tickSpacing)

    let leftInRange
    let rightInRange

    if (isXtoY) {
      leftInRange = left < leftMax ? leftMax : left
      rightInRange = right > rightMax ? rightMax : right
    } else {
      leftInRange = left > leftMax ? leftMax : left
      rightInRange = right < rightMax ? rightMax : right
    }

    return { leftInRange, rightInRange }
  }

  const onChangeRange = (left: number, right: number) => {
    let leftRange: number
    let rightRange: number

    if (positionOpeningMethod === 'range') {
      const { leftInRange, rightInRange } = getTicksInsideRange(left, right, isXtoY)
      leftRange = leftInRange
      rightRange = rightInRange
    } else {
      leftRange = left
      rightRange = right
    }

    setLeftRange(leftRange)
    setRightRange(rightRange)

    if (tokenA !== null && (isXtoY ? rightRange > midPrice.index : rightRange < midPrice.index)) {
      const deposit = tokenADeposit
      const amount = getOtherTokenAmount(
        convertBalanceToBN(deposit, tokens[tokenA.toString()].decimals),
        leftRange,
        rightRange,
        true
      )

      if (tokenB !== null && +deposit !== 0) {
        setTokenADeposit(deposit)
        setTokenBDeposit(amount)

        return
      }
    }

    if (tokenB !== null && (isXtoY ? leftRange < midPrice.index : leftRange > midPrice.index)) {
      const deposit = tokenBDeposit
      const amount = getOtherTokenAmount(
        convertBalanceToBN(deposit, tokens[tokenB.toString()].decimals),
        leftRange,
        rightRange,
        false
      )

      if (tokenA !== null && +deposit !== 0) {
        setTokenBDeposit(deposit)
        setTokenADeposit(amount)
      }
    }
  }

  const onChangeMidPrice = (tickIndex: number, sqrtPrice: BN) => {
    setMidPrice({
      index: tickIndex,
      x: calcPriceByTickIndex(tickIndex, isXtoY, xDecimal, yDecimal),
      sqrtPrice: sqrtPrice
    })

    if (tokenA !== null && (isXtoY ? rightRange > tickIndex : rightRange < tickIndex)) {
      const deposit = tokenADeposit
      const amount = getOtherTokenAmount(
        convertBalanceToBN(deposit, tokens[tokenA.toString()].decimals),
        leftRange,
        rightRange,
        true
      )
      if (tokenB !== null && +deposit !== 0) {
        setTokenADeposit(deposit)
        setTokenBDeposit(amount)
        return
      }
    }
    if (tokenB !== null && (isXtoY ? leftRange < tickIndex : leftRange > tickIndex)) {
      const deposit = tokenBDeposit
      const amount = getOtherTokenAmount(
        convertBalanceToBN(deposit, tokens[tokenB.toString()].decimals),
        leftRange,
        rightRange,
        false
      )

      if (tokenA !== null && +deposit !== 0) {
        setTokenBDeposit(deposit)
        setTokenADeposit(amount)
      }
    }
  }

  const bestTierIndex =
    tokenA === null || tokenB === null
      ? undefined
      : bestTiers.find(
          tier =>
            (tier.tokenX.equals(tokenA) && tier.tokenY.equals(tokenB)) ||
            (tier.tokenX.equals(tokenB) && tier.tokenY.equals(tokenA))
        )?.bestTierIndex ?? undefined

  const getMinSliderIndex = () => {
    let minimumSliderIndex = 0

    for (let index = 0; index < concentrationArray.length; index++) {
      const value = concentrationArray[index]

      const { leftRange, rightRange } = calculateConcentrationRange(
        tickSpacing,
        value,
        2,
        midPrice.index,
        isXtoY
      )

      const { leftInRange, rightInRange } = getTicksInsideRange(leftRange, rightRange, isXtoY)

      if (leftInRange !== leftRange || rightInRange !== rightRange) {
        minimumSliderIndex = index + 1
      } else {
        break
      }
    }

    return minimumSliderIndex
  }

  useEffect(() => {
    if (positionOpeningMethod === 'concentration') {
      const minimumSliderIndex = getMinSliderIndex()

      setMinimumSliderIndex(minimumSliderIndex)
    }
  }, [poolIndex, positionOpeningMethod, midPrice.index])

  useEffect(() => {
    if (!ticksLoading && positionOpeningMethod === 'range') {
      onChangeRange(leftRange, rightRange)
    }
  }, [midPrice.index, leftRange, rightRange])
  // useEffect(() => {
  //   if (positionOpeningMethod === 'range') {
  //     onChangeRange(leftRange, rightRange)
  //   }
  // }, [currentPriceSqrt])

  useEffect(() => {
    const configurePoolAddress = async () => {
      const configuredAddress = poolAddress === '' ? await calculatePoolAddress() : poolAddress
      setAddress(configuredAddress)
    }
    void configurePoolAddress()
  }, [initialTokenFrom, initialTokenTo, initialFee, poolAddress, address])

  const handleClickSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setSettings(true)
  }

  const handleCloseSettings = () => {
    unblurContent()
    setSettings(false)
  }

  const setSlippage = (slippage: string): void => {
    setSlippTolerance(slippage)
    onSlippageChange(slippage)
  }

  const updatePath = (address1: PublicKey | null, address2: PublicKey | null, fee: number) => {
    const parsedFee = parseFeeToPathFee(+ALL_FEE_TIERS_DATA[fee].tier.fee)

    if (address1 != null && address2 != null) {
      const token1Symbol = addressToTicker(
        network,
        tokens[address1.toString()].assetAddress.toString()
      )
      const token2Symbol = addressToTicker(
        network,
        tokens[address2.toString()].assetAddress.toString()
      )
      navigate(`/newPosition/${token1Symbol}/${token2Symbol}/${parsedFee}`, { replace: true })
    } else if (address1 != null) {
      const tokenSymbol = addressToTicker(
        network,
        tokens[address1.toString()].assetAddress.toString()
      )
      navigate(`/newPosition/${tokenSymbol}/${parsedFee}`, { replace: true })
    } else if (address2 != null) {
      const tokenSymbol = addressToTicker(
        network,
        tokens[address2.toString()].assetAddress.toString()
      )
      navigate(`/newPosition/${tokenSymbol}/${parsedFee}`, { replace: true })
    } else if (fee != null) {
      navigate(`/newPosition/${parsedFee}`, { replace: true })
    }
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (refresherTime > 0 && isCurrentPoolExisting) {
        setRefresherTime(refresherTime - 1)
      } else if (isCurrentPoolExisting) {
        onRefresh()
        setRefresherTime(REFRESHER_INTERVAL)
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [refresherTime, poolIndex])

  const [lastPoolIndex, setLastPoolIndex] = useState<number | null>(poolIndex)

  useEffect(() => {
    if (poolIndex != lastPoolIndex) {
      setLastPoolIndex(lastPoolIndex)
      setRefresherTime(REFRESHER_INTERVAL)
    }
  }, [poolIndex])

  const blockedToken = useMemo(
    () =>
      determinePositionTokenBlock(
        currentPriceSqrt,
        Math.min(leftRange, rightRange),
        Math.max(leftRange, rightRange),
        isXtoY
      ),
    [leftRange, rightRange, currentPriceSqrt]
  )

  return (
    <Grid container className={classes.wrapper} direction='column'>
      <Link to='/liquidity' style={{ textDecoration: 'none', maxWidth: 'fit-content' }}>
        <Grid className={classes.back} container item alignItems='center'>
          <img className={classes.backIcon} src={backIcon} alt='back' />
          <Typography className={classes.backText}>Positions</Typography>
        </Grid>
      </Link>

      <Grid
        container
        justifyContent='space-between'
        alignItems='center'
        className={classes.headerContainer}>
        <Box className={classes.titleContainer}>
          <Typography className={classes.title}>Add new position</Typography>
          {poolIndex !== null && tokenA !== tokenB && (
            <TooltipHover text='Refresh'>
              <Box>
                <Refresher
                  currentIndex={refresherTime}
                  maxIndex={REFRESHER_INTERVAL}
                  onClick={() => {
                    onRefresh()
                    setRefresherTime(REFRESHER_INTERVAL)
                  }}
                />
              </Box>
            </TooltipHover>
          )}
        </Box>
        {tokenA !== null && tokenB !== null && (
          <Grid container item alignItems='center' className={classes.options}>
            {poolIndex !== null ? (
              <MarketIdLabel
                displayLength={4}
                marketId={poolAddress}
                copyPoolAddressHandler={copyPoolAddressHandler}
              />
            ) : null}
            <Grid className={classes.optionsWrapper}>
              <Hidden mdDown>
                {tokenA !== null && tokenB !== null && poolIndex !== null && (
                  <ConcentrationTypeSwitch
                    onSwitch={val => {
                      if (val) {
                        setPositionOpeningMethod('concentration')
                        onPositionOpeningMethodChange('concentration')
                      } else {
                        setPositionOpeningMethod('range')
                        onPositionOpeningMethodChange('range')
                      }
                    }}
                    className={classes.switch}
                    currentValue={positionOpeningMethod === 'concentration' ? 0 : 1}
                  />
                )}
              </Hidden>
              {poolIndex !== null && (
                <TooltipHover text='Settings'>
                  <Button
                    onClick={handleClickSettings}
                    className={classes.settingsIconBtn}
                    disableRipple>
                    <img src={settingIcon} className={classes.settingsIcon} alt='settings' />
                  </Button>
                </TooltipHover>
              )}
            </Grid>
          </Grid>
        )}
      </Grid>

      <Slippage
        open={settings}
        setSlippage={setSlippage}
        handleClose={handleCloseSettings}
        anchorEl={anchorEl}
        initialSlippage={initialSlippage}
        infoText='Slippage tolerance is a pricing difference between the price at the confirmation time and the actual price of the transaction users are willing to accept when initializing position.'
        headerText='Position Settings'
      />

      <Grid container className={classes.row} alignItems='stretch'>
        <DepositSelector
          initialTokenFrom={initialTokenFrom}
          initialTokenTo={initialTokenTo}
          initialFee={initialFee}
          className={classes.deposit}
          tokens={tokens}
          setPositionTokens={(address1, address2, fee) => {
            setTokenA(address1)
            setTokenB(address2)
            onChangePositionTokens(address1, address2, fee)

            updatePath(address1, address2, fee)
          }}
          onAddLiquidity={() => {
            if (tokenA !== null && tokenB !== null) {
              const tokenADecimals = tokens[tokenA.toString()].decimals
              const tokenBDecimals = tokens[tokenB.toString()].decimals

              addLiquidityHandler(
                leftRange,
                rightRange,
                isXtoY
                  ? convertBalanceToBN(tokenADeposit, tokenADecimals)
                  : convertBalanceToBN(tokenBDeposit, tokenBDecimals),
                isXtoY
                  ? convertBalanceToBN(tokenBDeposit, tokenBDecimals)
                  : convertBalanceToBN(tokenADeposit, tokenADecimals),
                { v: fromFee(new BN(Number(+slippTolerance * 1000))) }
              )
            }
          }}
          tokenAInputState={{
            value:
              tokenA !== null &&
              tokenB !== null &&
              !isWaitingForNewPool &&
              blockedToken === PositionTokenBlock.A
                ? '0'
                : tokenADeposit,
            setValue: value => {
              if (tokenA === null) {
                return
              }

              setTokenADeposit(value)
              setTokenBDeposit(
                getOtherTokenAmount(
                  convertBalanceToBN(value, tokens[tokenA.toString()].decimals),
                  leftRange,
                  rightRange,
                  true
                )
              )
            },
            blocked:
              tokenA !== null &&
              tokenB !== null &&
              !isWaitingForNewPool &&
              blockedToken === PositionTokenBlock.A,

            blockerInfo: 'Range only for single-asset deposit.',
            decimalsLimit: tokenA !== null ? tokens[tokenA.toString()]?.decimals : 0
          }}
          tokenBInputState={{
            value:
              tokenA !== null &&
              tokenB !== null &&
              !isWaitingForNewPool &&
              blockedToken === PositionTokenBlock.B
                ? '0'
                : tokenBDeposit,
            setValue: value => {
              if (tokenB === null) {
                return
              }
              setTokenBDeposit(value)
              setTokenADeposit(
                getOtherTokenAmount(
                  convertBalanceToBN(value, tokens[tokenB.toString()].decimals),
                  leftRange,
                  rightRange,
                  false
                )
              )
            },
            blocked:
              tokenA !== null &&
              tokenB !== null &&
              !isWaitingForNewPool &&
              blockedToken === PositionTokenBlock.B,
            blockerInfo: 'Range only for single-asset deposit.',
            decimalsLimit: tokenB !== null ? tokens[tokenB.toString()].decimals : 0
          }}
          feeTiers={feeTiers.map(tier => tier.feeValue)}
          progress={progress}
          onReverseTokens={() => {
            if (tokenA === null || tokenB === null) {
              return
            }
            setShouldReversePlot(true)
            const pom = tokenA
            setTokenA(tokenB)
            setTokenB(pom)
            onChangePositionTokens(tokenB, tokenA, currentFeeIndex)

            if (!isLoadingTokens) {
              updatePath(tokenB, tokenA, currentFeeIndex)
            }
          }}
          poolIndex={poolIndex}
          bestTierIndex={bestTierIndex}
          handleAddToken={handleAddToken}
          commonTokens={commonTokens}
          initialHideUnknownTokensValue={initialHideUnknownTokensValue}
          onHideUnknownTokensChange={onHideUnknownTokensChange}
          priceA={tokenAPriceData?.price}
          priceB={tokenBPriceData?.price}
          priceALoading={priceALoading}
          priceBLoading={priceBLoading}
          feeTierIndex={currentFeeIndex}
          concentrationArray={concentrationArray}
          concentrationIndex={concentrationIndex}
          minimumSliderIndex={minimumSliderIndex}
          positionOpeningMethod={positionOpeningMethod}
          isBalanceLoading={isBalanceLoading}
          isGetLiquidityError={isGetLiquidityError}
          ticksLoading={ticksLoading}
          network={network}
          solBalance={solBalance}
          walletStatus={walletStatus}
          onConnectWallet={onConnectWallet}
          onDisconnectWallet={onDisconnectWallet}
          setShouldResetPlot={setShouldResetPlot}
        />
        <Hidden mdUp>
          <Grid container justifyContent='end' mb={2}>
            {poolIndex !== null && (
              <ConcentrationTypeSwitch
                onSwitch={val => {
                  if (val) {
                    setPositionOpeningMethod('concentration')
                    onPositionOpeningMethodChange('concentration')
                  } else {
                    setPositionOpeningMethod('range')
                    onPositionOpeningMethodChange('range')
                  }
                }}
                className={classes.switch}
                currentValue={positionOpeningMethod === 'concentration' ? 0 : 1}
              />
            )}
          </Grid>
        </Hidden>
        {isCurrentPoolExisting ||
        tokenA === null ||
        tokenB === null ||
        tokenA.equals(tokenB) ||
        isWaitingForNewPool ? (
          <RangeSelector
            poolIndex={poolIndex}
            onChangeRange={onChangeRange}
            blocked={
              tokenA === null ||
              tokenB === null ||
              tokenA.equals(tokenB) ||
              data.length === 0 ||
              isWaitingForNewPool
            }
            blockerInfo={setRangeBlockerInfo()}
            {...(tokenA === null ||
            tokenB === null ||
            !isCurrentPoolExisting ||
            data.length === 0 ||
            isWaitingForNewPool
              ? noRangePlaceholderProps
              : {
                  data,
                  midPrice,
                  globalPrice,
                  tokenASymbol: tokens[tokenA.toString()].symbol,
                  tokenBSymbol: tokens[tokenB.toString()].symbol
                })}
            ticksLoading={ticksLoading}
            isXtoY={isXtoY}
            tickSpacing={tickSpacing}
            xDecimal={xDecimal}
            yDecimal={yDecimal}
            currentPairReversed={currentPairReversed}
            positionOpeningMethod={positionOpeningMethod}
            hasTicksError={hasTicksError}
            reloadHandler={reloadHandler}
            volumeRange={plotVolumeRange}
            concentrationArray={concentrationArray}
            setConcentrationIndex={setConcentrationIndex}
            concentrationIndex={concentrationIndex}
            minimumSliderIndex={minimumSliderIndex}
            getTicksInsideRange={getTicksInsideRange}
            shouldResetPlot={shouldResetPlot}
            setShouldResetPlot={setShouldResetPlot}
            shouldReversePlot={shouldReversePlot}
            setShouldReversePlot={setShouldReversePlot}
            shouldNotUpdatePriceRange={shouldNotUpdatePriceRange}
            unblockUpdatePriceRange={unblockUpdatePriceRange}
            onlyUserPositions={onlyUserPositions}
            setOnlyUserPositions={setOnlyUserPositions}
          />
        ) : (
          <PoolInit
            onChangeRange={onChangeRange}
            isXtoY={isXtoY}
            tickSpacing={tickSpacing}
            xDecimal={xDecimal}
            yDecimal={yDecimal}
            tokenASymbol={tokenA !== null ? tokens[tokenA.toString()].symbol : 'ABC'}
            tokenBSymbol={tokenB !== null ? tokens[tokenB.toString()].symbol : 'XYZ'}
            midPriceIndex={midPrice.index}
            onChangeMidPrice={onChangeMidPrice}
            currentPairReversed={currentPairReversed}
            globalPrice={globalPrice}
            positionOpeningMethod={'range'}
            concentrationArray={concentrationArray}
            concentrationIndex={concentrationIndex}
            setConcentrationIndex={setConcentrationIndex}
            minimumSliderIndex={minimumSliderIndex}
          />
        )}
      </Grid>
    </Grid>
  )
}

export default NewPosition
