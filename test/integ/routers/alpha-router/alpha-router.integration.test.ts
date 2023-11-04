/**
 * @jest-environment hardhat
 */

import { JsonRpcProvider, JsonRpcSigner } from '@ethersproject/providers';
import { AllowanceTransfer, PermitSingle } from '@uniswap/permit2-sdk';
import { Protocol } from '@baseswapfi/router-sdk';
import {
  ChainId,
  Currency,
  CurrencyAmount,
  Ether,
  Fraction,
  Percent,
  Rounding,
  Token,
  TradeType,
} from '@baseswapfi/sdk-core';
import {
  PERMIT2_ADDRESS,
  UNIVERSAL_ROUTER_ADDRESS as UNIVERSAL_ROUTER_ADDRESS_BY_CHAIN,
} from '@baseswapfi/universal-router-sdk';
import { Permit2Permit } from '@baseswapfi/universal-router-sdk/dist/utils/inputTokens';
import { Pair } from '@baseswapfi/v2-sdk';
import { encodeSqrtRatioX96, FeeAmount, Pool } from '@baseswapfi/v3-sdk2';
import bunyan from 'bunyan';
import { BigNumber, providers, Wallet } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import DEFAULT_TOKEN_LIST from '../../../../src/baseswap-default.tokenlist.json';

import 'jest-environment-hardhat';
import _ from 'lodash';
import NodeCache from 'node-cache';
import {
  AlphaRouter,
  AlphaRouterConfig,
  CachingV2PoolProvider,
  CachingV3PoolProvider,
  DAI_BASE,
  DAI_ON,
  EthEstimateGasSimulator,
  FallbackTenderlySimulator,
  ID_TO_NETWORK_NAME,
  ID_TO_PROVIDER,
  MethodParameters,
  MixedRoute,
  NATIVE_CURRENCY,
  nativeOnChain,
  NodeJSCache,
  OnChainQuoteProvider,
  parseAmount,
  setGlobalLogger,
  SimulationStatus,
  StaticGasPriceProvider,
  SUPPORTED_CHAINS,
  SWAP_ROUTER_02_ADDRESSES,
  SwapOptions,
  SwapType,
  TenderlySimulator,
  TokenPropertiesProvider,
  UniswapMulticallProvider,
  USDC_BASE,
  USDC_ON,
  V2_SUPPORTED,
  V2PoolProvider,
  V2Route,
  V3PoolProvider,
  V3Route,
  WETH9,
  WNATIVE_ON,
} from '../../../../src';
import { PortionProvider } from '../../../../src/providers/portion-provider';
import { OnChainTokenFeeFetcher } from '../../../../src/providers/token-fee-fetcher';
import { DEFAULT_ROUTING_CONFIG_BY_CHAIN } from '../../../../src/routers/alpha-router/config';
import { Permit2__factory } from '../../../../src/types/other/factories/Permit2__factory';
import { getBalanceAndApprove } from '../../../test-util/getBalanceAndApprove';
import {
  FLAT_PORTION,
  GREENLIST_TOKEN_PAIRS,
  Portion,
} from '../../../test-util/mock-data';
import { WHALES } from '../../../test-util/whales';

const chainId = ChainId.BASE;
const FORK_BLOCK = 6160944; // 11/4/23 ~11:30AM EST
const UNIVERSAL_ROUTER_ADDRESS = UNIVERSAL_ROUTER_ADDRESS_BY_CHAIN(chainId);
const SLIPPAGE = new Percent(15, 100); // 5% or 10_000?

const checkQuoteToken = (
  before: CurrencyAmount<Currency>,
  after: CurrencyAmount<Currency>,
  tokensQuoted: CurrencyAmount<Currency>
) => {
  // Check which is bigger to support exactIn and exactOut
  const tokensSwapped = after.greaterThan(before)
    ? after.subtract(before)
    : before.subtract(after);
  const tokensDiff = tokensQuoted.greaterThan(tokensSwapped)
    ? tokensQuoted.subtract(tokensSwapped)
    : tokensSwapped.subtract(tokensQuoted);

  const percentDiff = tokensDiff.asFraction.divide(tokensQuoted.asFraction);
  expect(percentDiff.lessThan(SLIPPAGE.asFraction)).toBe(true);
};

const checkPortionRecipientToken = (
  before: CurrencyAmount<Currency>,
  after: CurrencyAmount<Currency>,
  expectedPortionAmountReceived: CurrencyAmount<Currency>
) => {
  const actualPortionAmountReceived = after.subtract(before);

  const tokensDiff = expectedPortionAmountReceived.greaterThan(
    actualPortionAmountReceived
  )
    ? expectedPortionAmountReceived.subtract(actualPortionAmountReceived)
    : actualPortionAmountReceived.subtract(expectedPortionAmountReceived);
  // There will be a slight difference between expected and actual due to slippage during the hardhat fork swap.
  const percentDiff = tokensDiff.asFraction.divide(
    expectedPortionAmountReceived.asFraction
  );
  expect(percentDiff.lessThan(SLIPPAGE.asFraction)).toBe(true);
};

const getQuoteToken = (
  tokenIn: Currency,
  tokenOut: Currency,
  tradeType: TradeType
): Currency => {
  return tradeType == TradeType.EXACT_INPUT ? tokenOut : tokenIn;
};

export function parseDeadline(deadlineOrPreviousBlockhash: number): number {
  return Math.floor(Date.now() / 1000) + deadlineOrPreviousBlockhash;
}

const expandDecimals = (currency: Currency, amount: number): number => {
  return amount * 10 ** currency.decimals;
};

let warnedTenderly = false;
const isTenderlyEnvironmentSet = (): boolean => {
  const isSet =
    !!process.env.TENDERLY_BASE_URL &&
    !!process.env.TENDERLY_USER &&
    !!process.env.TENDERLY_PROJECT &&
    !!process.env.TENDERLY_ACCESS_KEY;
  if (!isSet && !warnedTenderly) {
    console.log(
      'Skipping Tenderly Simulation Tests since env variables for TENDERLY_BASE_URL, TENDERLY_USER, TENDERLY_PROJECT and TENDERLY_ACCESS_KEY are not set.'
    );
    warnedTenderly = true;
  }
  return isSet;
};

let warnedTesterPK = false;
const isTesterPKEnvironmentSet = (): boolean => {
  const isSet = !!process.env.TESTER_PK;
  if (!isSet && !warnedTesterPK) {
    console.log(
      'Skipping Permit Tenderly Simulation Test since env variables for TESTER_PK is not set.'
    );
    warnedTesterPK = true;
  }
  return isSet;
};

// Flag for enabling logs for debugging integ tests
if (process.env.INTEG_TEST_DEBUG) {
  setGlobalLogger(
    bunyan.createLogger({
      name: 'Uniswap Smart Order Router',
      serializers: bunyan.stdSerializers,
      level: bunyan.DEBUG,
    })
  );
}

jest.retryTimes(0);

describe('alpha router integration', () => {
  let alice: JsonRpcSigner;
  jest.setTimeout(500 * 1000); // 500s

  let curNonce: number = 0;

  let nextPermitNonce: () => string = () => {
    const nonce = curNonce.toString();
    curNonce = curNonce + 1;
    return nonce;
  };

  let alphaRouter: AlphaRouter;
  let customAlphaRouter: AlphaRouter;
  let feeOnTransferAlphaRouter: AlphaRouter;
  const multicall2Provider = new UniswapMulticallProvider(
    chainId,
    hardhat.provider
  );

  const ROUTING_CONFIG: AlphaRouterConfig = {
    // @ts-ignore[TS7053] - complaining about switch being non exhaustive
    ...DEFAULT_ROUTING_CONFIG_BY_CHAIN[chainId],
    protocols: [Protocol.V3, Protocol.V2],
    saveTenderlySimulationIfFailed: true, // save tenderly simulation on integ-test runs, easier for debugging
  };

  const executeSwap = async (
    swapType: SwapType,
    methodParameters: MethodParameters,
    tokenIn: Currency,
    tokenOut: Currency,
    gasLimit?: BigNumber,
    permit?: boolean,
    portion?: Portion
  ): Promise<{
    tokenInAfter: CurrencyAmount<Currency>;
    tokenInBefore: CurrencyAmount<Currency>;
    tokenOutAfter: CurrencyAmount<Currency>;
    tokenOutBefore: CurrencyAmount<Currency>;
    tokenOutPortionRecipientBefore?: CurrencyAmount<Currency>;
    tokenOutPortionRecipientAfter?: CurrencyAmount<Currency>;
  }> => {
    expect(tokenIn.symbol).not.toBe(tokenOut.symbol);
    let transactionResponse: providers.TransactionResponse;

    let tokenInBefore: CurrencyAmount<Currency>;
    let tokenOutBefore: CurrencyAmount<Currency>;
    const tokenOutPortionRecipientBefore = portion
      ? await hardhat.getBalance(portion.recipient, tokenOut)
      : undefined;
    if (swapType == SwapType.UNIVERSAL_ROUTER) {
      // Approve Permit2
      // We use this helper function for approving rather than hardhat.provider.approve
      // because there is custom logic built in for handling USDT and other checks
      tokenInBefore = await getBalanceAndApprove(
        alice,
        PERMIT2_ADDRESS,
        tokenIn
      );
      const MAX_UINT160 = '0xffffffffffffffffffffffffffffffffffffffff';

      // If not using permit do a regular approval allowing narwhal max balance.
      if (!permit) {
        const aliceP2 = Permit2__factory.connect(PERMIT2_ADDRESS, alice);
        const approveNarwhal = await aliceP2.approve(
          tokenIn.wrapped.address,
          UNIVERSAL_ROUTER_ADDRESS,
          MAX_UINT160,
          20_000_000_000_000
        );
        await approveNarwhal.wait();
      }

      tokenOutBefore = await hardhat.getBalance(alice._address, tokenOut);

      const transaction = {
        data: methodParameters.calldata,
        to: methodParameters.to,
        value: BigNumber.from(methodParameters.value),
        from: alice._address,
        gasPrice: BigNumber.from(2000000000000),
        type: 1,
      };

      if (gasLimit) {
        transactionResponse = await alice.sendTransaction({
          ...transaction,
          gasLimit: gasLimit,
        });
      } else {
        transactionResponse = await alice.sendTransaction(transaction);
      }
    } else {
      tokenInBefore = await getBalanceAndApprove(
        alice,
        SWAP_ROUTER_02_ADDRESSES(tokenIn.chainId),
        tokenIn
      );
      tokenOutBefore = await hardhat.getBalance(alice._address, tokenOut);

      const transaction = {
        data: methodParameters.calldata,
        to: methodParameters.to,
        value: BigNumber.from(methodParameters.value),
        from: alice._address,
        gasPrice: BigNumber.from(2000000000000),
        type: 1,
      };

      if (gasLimit) {
        transactionResponse = await alice.sendTransaction({
          ...transaction,
          gasLimit: gasLimit,
        });
      } else {
        transactionResponse = await alice.sendTransaction(transaction);
      }
    }

    const receipt = await transactionResponse.wait();

    expect(receipt.status == 1).toBe(true); // Check for txn success

    const tokenInAfter = await hardhat.getBalance(alice._address, tokenIn);
    const tokenOutAfter = await hardhat.getBalance(alice._address, tokenOut);
    const tokenOutPortionRecipientAfter = portion
      ? await hardhat.getBalance(portion.recipient, tokenOut)
      : undefined;

    return {
      tokenInAfter,
      tokenInBefore,
      tokenOutAfter,
      tokenOutBefore,
      tokenOutPortionRecipientBefore,
      tokenOutPortionRecipientAfter,
    };
  };

  /**
   * Function to validate swapRoute data.
   * @param quote: CurrencyAmount<Currency>
   * @param quoteGasAdjusted: CurrencyAmount<Currency>
   * @param tradeType: TradeType
   * @param targetQuoteDecimalsAmount?: number - if defined, checks that the quoteDecimals is within the range of this +/- acceptableDifference (non inclusive bounds)
   * @param acceptableDifference?: number - see above
   */
  const validateSwapRoute = async (
    quote: CurrencyAmount<Currency>,
    quoteGasAdjusted: CurrencyAmount<Currency>,
    tradeType: TradeType,
    targetQuoteDecimalsAmount?: number,
    acceptableDifference?: number,
    quoteGasAndPortionAdjusted?: CurrencyAmount<Currency>,
    targetQuoteGasAndPortionAdjustedDecimalsAmount?: number,
    acceptablePortionDifference?: number
  ) => {
    // strict undefined checks here to avoid confusion with 0 being a falsy value
    if (targetQuoteDecimalsAmount !== undefined) {
      acceptableDifference =
        acceptableDifference !== undefined ? acceptableDifference : 0;

      expect(
        quote.greaterThan(
          CurrencyAmount.fromRawAmount(
            quote.currency,
            expandDecimals(
              quote.currency,
              targetQuoteDecimalsAmount - acceptableDifference
            )
          )
        )
      ).toBe(true);
      expect(
        quote.lessThan(
          CurrencyAmount.fromRawAmount(
            quote.currency,
            expandDecimals(
              quote.currency,
              targetQuoteDecimalsAmount + acceptableDifference
            )
          )
        )
      ).toBe(true);
    }

    if (
      targetQuoteGasAndPortionAdjustedDecimalsAmount &&
      quoteGasAndPortionAdjusted
    ) {
      acceptablePortionDifference = acceptablePortionDifference ?? 0;

      expect(
        quoteGasAndPortionAdjusted.greaterThan(
          CurrencyAmount.fromRawAmount(
            quoteGasAndPortionAdjusted.currency,
            expandDecimals(
              quoteGasAndPortionAdjusted.currency,
              targetQuoteGasAndPortionAdjustedDecimalsAmount -
                acceptablePortionDifference
            )
          )
        )
      ).toBe(true);
      expect(
        quoteGasAndPortionAdjusted.lessThan(
          CurrencyAmount.fromRawAmount(
            quoteGasAndPortionAdjusted.currency,
            expandDecimals(
              quoteGasAndPortionAdjusted.currency,
              targetQuoteGasAndPortionAdjustedDecimalsAmount +
                acceptablePortionDifference
            )
          )
        )
      ).toBe(true);
    }

    if (tradeType == TradeType.EXACT_INPUT) {
      // == lessThanOrEqualTo
      expect(!quoteGasAdjusted.greaterThan(quote)).toBe(true);

      if (quoteGasAndPortionAdjusted) {
        expect(!quoteGasAndPortionAdjusted.greaterThan(quoteGasAdjusted)).toBe(
          true
        );
      }
    } else {
      // == greaterThanOrEqual
      expect(!quoteGasAdjusted.lessThan(quote)).toBe(true);

      if (quoteGasAndPortionAdjusted) {
        expect(!quoteGasAndPortionAdjusted.lessThan(quoteGasAdjusted)).toBe(
          true
        );
      }
    }
  };

  /**
   * Function to perform a call to executeSwap and validate the response
   * @param quote: CurrencyAmount<Currency>
   * @param tokenIn: Currency
   * @param tokenOut: Currency
   * @param methodParameters: MethodParameters
   * @param tradeType: TradeType
   * @param checkTokenInAmount?: number - if defined, check that the tokenInBefore - tokenInAfter = checkTokenInAmount
   * @param checkTokenOutAmount?: number - if defined, check that the tokenOutBefore - tokenOutAfter = checkTokenOutAmount
   */
  const validateExecuteSwap = async (
    swapType: SwapType,
    quote: CurrencyAmount<Currency>,
    tokenIn: Currency,
    tokenOut: Currency,
    methodParameters: MethodParameters | undefined,
    tradeType: TradeType,
    checkTokenInAmount?: number,
    checkTokenOutAmount?: number,
    estimatedGasUsed?: BigNumber,
    permit?: boolean,
    portion?: Portion,
    checkTokenOutPortionAmount?: number,
    skipQuoteTokenCheck?: boolean
  ) => {
    expect(methodParameters).not.toBeUndefined();
    const {
      tokenInBefore,
      tokenInAfter,
      tokenOutBefore,
      tokenOutAfter,
      tokenOutPortionRecipientBefore,
      tokenOutPortionRecipientAfter,
    } = await executeSwap(
      swapType,
      methodParameters!,
      tokenIn,
      tokenOut!,
      estimatedGasUsed,
      permit,
      portion
    );

    if (tradeType == TradeType.EXACT_INPUT) {
      if (checkTokenInAmount) {
        expect(
          tokenInBefore
            .subtract(tokenInAfter)
            .equalTo(
              CurrencyAmount.fromRawAmount(
                tokenIn,
                expandDecimals(tokenIn, checkTokenInAmount)
              )
            )
        ).toBe(true);
      }
      if (!skipQuoteTokenCheck) {
        checkQuoteToken(
          tokenOutBefore,
          tokenOutAfter,
          /// @dev we need to recreate the CurrencyAmount object here because tokenOut can be different from quote.currency (in the case of ETH vs. WETH)
          CurrencyAmount.fromRawAmount(tokenOut, quote.quotient)
        );
      }
      if (checkTokenOutPortionAmount) {
        checkPortionRecipientToken(
          tokenOutPortionRecipientBefore!,
          tokenOutPortionRecipientAfter!,
          CurrencyAmount.fromRawAmount(
            tokenOut,
            expandDecimals(tokenOut, checkTokenOutPortionAmount)
          )
        );
      }
    } else {
      if (checkTokenOutAmount) {
        expect(
          tokenOutAfter
            .subtract(tokenOutBefore)
            .equalTo(
              CurrencyAmount.fromRawAmount(
                tokenOut,
                expandDecimals(tokenOut, checkTokenOutAmount)
              )
            )
        ).toBe(true);
      }
      if (!skipQuoteTokenCheck) {
        checkQuoteToken(
          tokenInBefore,
          tokenInAfter,
          CurrencyAmount.fromRawAmount(tokenIn, quote.quotient)
        );
      }
      if (checkTokenOutPortionAmount) {
        checkPortionRecipientToken(
          tokenOutPortionRecipientBefore!,
          tokenOutPortionRecipientAfter!,
          CurrencyAmount.fromRawAmount(
            tokenOut,
            expandDecimals(tokenOut, checkTokenOutPortionAmount)
          )
        );
      }
    }
  };

  beforeAll(async () => {
    await hardhat.fork(FORK_BLOCK);

    alice = hardhat.providers[0]!.getSigner();
    const aliceAddress = await alice.getAddress();
    expect(aliceAddress).toBe(alice._address);

    await hardhat.fund(
      alice._address,
      [parseAmount('8000000', USDC_BASE)],
      ['0x8eb8a3b98659cce290402893d0123abb75e3ab28']
    );

    await hardhat.fund(
      alice._address,
      [parseAmount('5000000', DAI_BASE)],
      ['0x8eb8a3b98659cce290402893d0123abb75e3ab28']
    );

    await hardhat.fund(
      alice._address,
      [parseAmount('4000', WETH9[chainId])],
      [
        '0x2fEb1512183545f48f6b9C5b4EbfCaF49CfCa6F3', // WETH whale
      ]
    );

    // alice should always have 10000 ETH
    const aliceEthBalance = await hardhat.provider.getBalance(alice._address);
    /// Since alice is deploying the QuoterV3 contract, expect to have slightly less than 10_000 ETH but not too little
    expect(aliceEthBalance.toBigInt()).toBeGreaterThanOrEqual(
      parseEther('9995').toBigInt()
    );
    const aliceUSDCBalance = await hardhat.getBalance(
      alice._address,
      USDC_BASE
    );
    expect(aliceUSDCBalance).toEqual(parseAmount('8000000', USDC_BASE));

    const aliceWETH9Balance = await hardhat.getBalance(
      alice._address,
      WETH9[1]
    );
    expect(aliceWETH9Balance).toEqual(parseAmount('4000', WETH9[1]));
    const aliceDAIBalance = await hardhat.getBalance(alice._address, DAI_BASE);
    expect(aliceDAIBalance).toEqual(parseAmount('5000000', DAI_BASE));

    const v3PoolProvider = new CachingV3PoolProvider(
      chainId,
      new V3PoolProvider(chainId, multicall2Provider),
      new NodeJSCache(new NodeCache({ stdTTL: 360, useClones: false }))
    );
    // const tokenFeeFetcher = new OnChainTokenFeeFetcher(
    //   chainId,
    //   hardhat.provider
    // );
    const tokenPropertiesProvider = new TokenPropertiesProvider(
      new NodeJSCache(new NodeCache({ stdTTL: 360, useClones: false }))
    );
    const v2PoolProvider = new V2PoolProvider(
      chainId,
      multicall2Provider,
      tokenPropertiesProvider
    );
    // const cachingV2PoolProvider = new CachingV2PoolProvider(
    //   chainId,
    //   v2PoolProvider,
    //   new NodeJSCache(new NodeCache({ stdTTL: 360, useClones: false }))
    // );

    const portionProvider = new PortionProvider();
    const ethEstimateGasSimulator = new EthEstimateGasSimulator(
      chainId,
      hardhat.providers[0]!,
      v2PoolProvider,
      v3PoolProvider,
      portionProvider
    );

    const tenderlySimulator = new TenderlySimulator(
      chainId,
      process.env.TENDERLY_BASE_URL!,
      process.env.TENDERLY_USER!,
      process.env.TENDERLY_PROJECT!,
      process.env.TENDERLY_ACCESS_KEY!,
      v2PoolProvider,
      v3PoolProvider,
      hardhat.providers[0]!,
      portionProvider
    );

    const simulator = new FallbackTenderlySimulator(
      chainId,
      hardhat.providers[0]!,
      new PortionProvider(),
      tenderlySimulator,
      ethEstimateGasSimulator
    );

    alphaRouter = new AlphaRouter({
      chainId: chainId,
      provider: hardhat.providers[0]!,
      multicall2Provider,
      v2PoolProvider,
      v3PoolProvider,
      simulator,
      defaultTokenList: DEFAULT_TOKEN_LIST,
    });

    // this will be used to test gas limit simulation for web flow
    // in the web flow, we won't simulate on tenderly, only through eth estimate gas
    customAlphaRouter = new AlphaRouter({
      chainId: chainId,
      provider: hardhat.providers[0]!,
      multicall2Provider,
      v2PoolProvider,
      v3PoolProvider,
      simulator: ethEstimateGasSimulator,
      defaultTokenList: DEFAULT_TOKEN_LIST,
    });

    // feeOnTransferAlphaRouter = new AlphaRouter({
    //   chainId: chainId,
    //   provider: hardhat.providers[0]!,
    //   multicall2Provider,
    //   v2PoolProvider: cachingV2PoolProvider,
    //   v3PoolProvider,
    //   simulator,
    //   defaultTokenList: DEFAULT_TOKEN_LIST,
    // });
  });

  describe('quote for other networks', () => {
    const TEST_ERC20_1: { [chainId: number]: () => Token } = {
      [ChainId.BASE]: () => USDC_ON(ChainId.BASE),
    };
    const TEST_ERC20_2: { [chainId: number]: () => Token } = {
      [ChainId.BASE]: () => WNATIVE_ON(ChainId.BASE),
    };

    // for (const tradeType of [TradeType.EXACT_INPUT, TradeType.EXACT_OUTPUT]) {
    //   const erc1 = TEST_ERC20_1[chainId]();
    //   const erc2 = TEST_ERC20_2[chainId]();

    //   describe(`${ID_TO_NETWORK_NAME(chainId)} ${tradeType} 2xx`, function() {
    //     const wrappedNative = WNATIVE_ON(chainId);

    //     let alphaRouter: AlphaRouter;

    //     beforeAll(async () => {
    //       const chainProvider = ID_TO_PROVIDER(chainId);
    //       const provider = new JsonRpcProvider(chainProvider, chain);

    //       const multicall2Provider = new UniswapMulticallProvider(
    //         chainId,
    //         provider
    //       );

    //       const v3PoolProvider = new CachingV3PoolProvider(
    //         chainId,
    //         new V3PoolProvider(chainId, multicall2Provider),
    //         new NodeJSCache(new NodeCache({ stdTTL: 360, useClones: false }))
    //       );
    //       const tokenFeeFetcher = new OnChainTokenFeeFetcher(
    //         chainId,
    //         hardhat.provider
    //       )
    //       const tokenPropertiesProvider = new TokenPropertiesProvider(
    //         chainId,
    //         new NodeJSCache(new NodeCache({ stdTTL: 360, useClones: false })),
    //         tokenFeeFetcher
    //       )
    //       const v2PoolProvider = new V2PoolProvider(chain, multicall2Provider, tokenPropertiesProvider);

    //       const portionProvider = new PortionProvider();
    //       const ethEstimateGasSimulator = new EthEstimateGasSimulator(
    //         chain,
    //         provider,
    //         v2PoolProvider,
    //         v3PoolProvider,
    //         portionProvider
    //       );

    //       const tenderlySimulator = new TenderlySimulator(
    //         chain,
    //         process.env.TENDERLY_BASE_URL!,
    //         process.env.TENDERLY_USER!,
    //         process.env.TENDERLY_PROJECT!,
    //         process.env.TENDERLY_ACCESS_KEY!,
    //         v2PoolProvider,
    //         v3PoolProvider,
    //         provider,
    //         portionProvider
    //       );

    //       const simulator = new FallbackTenderlySimulator(
    //         chain,
    //         provider,
    //         new PortionProvider(),
    //         tenderlySimulator,
    //         ethEstimateGasSimulator
    //       );

    //       alphaRouter = new AlphaRouter({
    //         chainId: chain,
    //         provider,
    //         multicall2Provider,
    //         simulator,
    //       });
    //     });

    //   })
    // }
  });
});
