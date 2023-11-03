import { BigNumber } from '@ethersproject/bignumber';
import { BaseProvider } from '@ethersproject/providers';
// import { Protocol, SwapRouter } from '@baseswapfi/router-sdk';
import { ChainId, Fraction, TradeType } from '@baseswapfi/sdk-core';
import { Pair } from '@baseswapfi/v2-sdk';
import { encodeSqrtRatioX96, Pool } from '@baseswapfi/v3-sdk2';
// import JSBI from 'jsbi';
import _ from 'lodash';
import sinon from 'sinon';
import {
  AlphaRouter,
  AlphaRouterConfig,
  AmountQuote,
  CacheMode,
  CachingTokenListProvider,
  CurrencyAmount,
  DAI_BASE as DAI,
  DEFAULT_TOKEN_PROPERTIES_RESULT,
  ETHGasStationInfoProvider,
  FallbackTenderlySimulator,
  MixedRoute,
  MixedRouteWithValidQuote,
  OnChainQuoteProvider,
  // parseAmount,
  RouteWithQuotes,
  // SwapAndAddConfig,
  // SwapAndAddOptions,
  SwapRouterProvider,
  // SwapToRatioStatus,
  // SwapType,
  TokenPropertiesProvider,
  TokenProvider,
  UniswapMulticallProvider,
  USDC_BASE as USDC,
  V2AmountQuote,
  V2QuoteProvider,
  V2Route,
  V2RouteWithQuotes,
  V2RouteWithValidQuote,
  V2SubgraphPool,
  V2SubgraphProvider,
  V3HeuristicGasModelFactory,
  V3PoolProvider,
  V3Route,
  V3RouteWithValidQuote,
  V3SubgraphPool,
  V3SubgraphProvider,
  WRAPPED_NATIVE_CURRENCY,
} from '../../../../src';
import { ProviderConfig } from '../../../../src/providers/provider';
import {
  TokenValidationResult,
  TokenValidatorProvider,
} from '../../../../src/providers/token-validator-provider';
import { V2PoolProvider } from '../../../../src/providers/v2/pool-provider';
import { MixedRouteHeuristicGasModelFactory } from '../../../../src/routers/alpha-router/gas-models/mixedRoute/mixed-route-heuristic-gas-model';
import { V2HeuristicGasModelFactory } from '../../../../src/routers/alpha-router/gas-models/v2/v2-heuristic-gas-model';
import {
  buildMockTokenAccessor,
  buildMockV2PoolAccessor,
  buildMockV3PoolAccessor,
  // DAI_USDT,
  // DAI_USDT_LOW,
  // DAI_USDT_MEDIUM,
  MOCK_ZERO_DEC_TOKEN,
  mockBlock,
  mockBlockBN,
  mockGasPriceWeiBN,
  pairToV2SubgraphPool,
  poolToV3SubgraphPool,
  USDC_DAI,
  USDC_DAI_LOW,
  USDC_DAI_MEDIUM,
  USDC_MOCK_LOW,
  // USDC_USDT_MEDIUM,
  USDC_WETH,
  USDC_WETH_LOW,
  WBTC_WETH,
  // WETH9_USDT_LOW,
  // WETH_USDT,
} from '../../../test-util/mock-data';
import { InMemoryRouteCachingProvider } from '../../providers/caching/route/test-util/inmemory-route-caching-provider';

// const helper = require('../../../../src/routers/alpha-router/functions/calculate-ratio-amount-in');

const chainId = ChainId.BASE;
const WETH = WRAPPED_NATIVE_CURRENCY[chainId];

describe('alpha router', () => {
  let mockProvider: sinon.SinonStubbedInstance<BaseProvider>;
  let mockMulticallProvider: sinon.SinonStubbedInstance<UniswapMulticallProvider>;
  let mockTokenProvider: sinon.SinonStubbedInstance<TokenProvider>;

  let mockV3PoolProvider: sinon.SinonStubbedInstance<V3PoolProvider>;
  let mockV3SubgraphProvider: sinon.SinonStubbedInstance<V3SubgraphProvider>;
  let mockOnChainQuoteProvider: sinon.SinonStubbedInstance<OnChainQuoteProvider>;
  let mockV3GasModelFactory: sinon.SinonStubbedInstance<V3HeuristicGasModelFactory>;
  let mockMixedRouteGasModelFactory: sinon.SinonStubbedInstance<MixedRouteHeuristicGasModelFactory>;

  let mockV2PoolProvider: sinon.SinonStubbedInstance<V2PoolProvider>;
  let mockV2SubgraphProvider: sinon.SinonStubbedInstance<V2SubgraphProvider>;
  let mockV2QuoteProvider: sinon.SinonStubbedInstance<V2QuoteProvider>;
  let mockV2GasModelFactory: sinon.SinonStubbedInstance<V2HeuristicGasModelFactory>;

  let mockGasPriceProvider: sinon.SinonStubbedInstance<ETHGasStationInfoProvider>;

  let mockBlockTokenListProvider: sinon.SinonStubbedInstance<CachingTokenListProvider>;
  let mockTokenValidatorProvider: sinon.SinonStubbedInstance<TokenValidatorProvider>;
  let mockTokenPropertiesProvider: sinon.SinonStubbedInstance<TokenPropertiesProvider>;

  let mockFallbackTenderlySimulator: sinon.SinonStubbedInstance<FallbackTenderlySimulator>;

  let inMemoryRouteCachingProvider: InMemoryRouteCachingProvider;

  let alphaRouter: AlphaRouter;

  const ROUTING_CONFIG: AlphaRouterConfig = {
    v3PoolSelection: {
      topN: 0,
      topNDirectSwaps: 0,
      topNTokenInOut: 0,
      topNSecondHop: 0,
      topNWithEachBaseToken: 0,
      topNWithBaseToken: 0,
    },
    v2PoolSelection: {
      topN: 0,
      topNDirectSwaps: 0,
      topNTokenInOut: 0,
      topNSecondHop: 0,
      topNWithEachBaseToken: 0,
      topNWithBaseToken: 0,
    },
    maxSwapsPerPath: 3,
    minSplits: 1,
    maxSplits: 3,
    distributionPercent: 25,
    forceCrossProtocol: false,
  };

  // const SWAP_AND_ADD_CONFIG: SwapAndAddConfig = {
  //   ratioErrorTolerance: new Fraction(1, 100),
  //   maxIterations: 6,
  // };

  // const SWAP_AND_ADD_OPTIONS: SwapAndAddOptions = {
  //   addLiquidityOptions: {
  //     recipient: `0x${'00'.repeat(19)}01`,
  //   },
  //   swapOptions: {
  //     type: SwapType.SWAP_ROUTER_02,
  //     deadline: 100,
  //     recipient: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
  //     slippageTolerance: new Percent(5, 10_000),
  //   },
  // };

  // const sumFn = (currencyAmounts: CurrencyAmount[]): CurrencyAmount => {
  //   let sum = currencyAmounts[0]!;
  //   for (let i = 1; i < currencyAmounts.length; i++) {
  //     sum = sum.add(currencyAmounts[i]!);
  //   }
  //   return sum;
  // };

  beforeEach(() => {
    mockProvider = sinon.createStubInstance(BaseProvider);
    mockProvider.getBlockNumber.resolves(mockBlock);

    mockMulticallProvider = sinon.createStubInstance(UniswapMulticallProvider);

    mockTokenProvider = sinon.createStubInstance(TokenProvider);
    const mockTokens = [
      USDC,
      DAI,
      WRAPPED_NATIVE_CURRENCY[chainId],
      MOCK_ZERO_DEC_TOKEN,
    ];
    mockTokenProvider.getTokens.resolves(buildMockTokenAccessor(mockTokens));

    mockV3PoolProvider = sinon.createStubInstance(V3PoolProvider);
    const v3MockPools = [
      USDC_DAI_LOW,
      USDC_DAI_MEDIUM,
      USDC_WETH_LOW,
      USDC_MOCK_LOW,
    ];
    mockV3PoolProvider.getPools.resolves(buildMockV3PoolAccessor(v3MockPools));
    mockV3PoolProvider.getPoolAddress.callsFake((tA, tB, fee) => ({
      poolAddress: Pool.getAddress(tA, tB, fee),
      token0: tA,
      token1: tB,
    }));

    const v2MockPools = [USDC_WETH, USDC_DAI, WBTC_WETH];
    mockV2PoolProvider = sinon.createStubInstance(V2PoolProvider);
    mockV2PoolProvider.getPools.resolves(buildMockV2PoolAccessor(v2MockPools));
    mockV2PoolProvider.getPoolAddress.callsFake((tA, tB) => ({
      poolAddress: Pair.getAddress(tA, tB),
      token0: tA,
      token1: tB,
    }));

    mockV3SubgraphProvider = sinon.createStubInstance(V3SubgraphProvider);
    const v3MockSubgraphPools: V3SubgraphPool[] = _.map(
      v3MockPools,
      poolToV3SubgraphPool
    );
    mockV3SubgraphProvider.getPools.resolves(v3MockSubgraphPools);

    mockV2SubgraphProvider = sinon.createStubInstance(V2SubgraphProvider);
    const v2MockSubgraphPools: V2SubgraphPool[] = _.map(
      v2MockPools,
      pairToV2SubgraphPool
    );
    mockV2SubgraphProvider.getPools.resolves(v2MockSubgraphPools);

    mockOnChainQuoteProvider = sinon.createStubInstance(OnChainQuoteProvider);
    mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
      getQuotesManyExactInFn<V3Route | V2Route | MixedRoute>()
    );
    mockOnChainQuoteProvider.getQuotesManyExactOut.callsFake(
      async (
        amountOuts: CurrencyAmount[],
        routes: V3Route[],
        _providerConfig?: ProviderConfig
      ) => {
        const routesWithQuotes = _.map(routes, (r) => {
          const amountQuotes = _.map(amountOuts, (amountOut) => {
            return {
              amount: amountOut,
              quote: BigNumber.from(amountOut.quotient.toString()),
              sqrtPriceX96AfterList: [
                BigNumber.from(1),
                BigNumber.from(1),
                BigNumber.from(1),
              ],
              initializedTicksCrossedList: [1],
              gasEstimate: BigNumber.from(10000),
            } as AmountQuote;
          });
          return [r, amountQuotes];
        });

        return {
          routesWithQuotes: routesWithQuotes,
          blockNumber: mockBlockBN,
        } as {
          routesWithQuotes: RouteWithQuotes<V3Route>[];
          blockNumber: BigNumber;
        };
      }
    );

    mockV2QuoteProvider = sinon.createStubInstance(V2QuoteProvider);
    mockV2QuoteProvider.getQuotesManyExactIn.callsFake(
      async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
        const routesWithQuotes = _.map(routes, (r) => {
          const amountQuotes = _.map(amountIns, (amountIn) => {
            return {
              amount: amountIn,
              quote: BigNumber.from(amountIn.quotient.toString()),
            } as V2AmountQuote;
          });
          return [r, amountQuotes];
        });

        return {
          routesWithQuotes: routesWithQuotes,
        } as { routesWithQuotes: V2RouteWithQuotes[] };
      }
    );

    mockV2QuoteProvider.getQuotesManyExactOut.callsFake(
      async (amountOuts: CurrencyAmount[], routes: V2Route[]) => {
        const routesWithQuotes = _.map(routes, (r) => {
          const amountQuotes = _.map(amountOuts, (amountOut) => {
            return {
              amount: amountOut,
              quote: BigNumber.from(amountOut.quotient.toString()),
            } as V2AmountQuote;
          });
          return [r, amountQuotes];
        });

        return {
          routesWithQuotes: routesWithQuotes,
        } as { routesWithQuotes: V2RouteWithQuotes[] };
      }
    );

    mockGasPriceProvider = sinon.createStubInstance(ETHGasStationInfoProvider);
    mockGasPriceProvider.getGasPrice.resolves({
      gasPriceWei: mockGasPriceWeiBN,
    });

    mockV3GasModelFactory = sinon.createStubInstance(
      V3HeuristicGasModelFactory
    );
    const v3MockGasModel = {
      estimateGasCost: sinon.stub(),
      calculateL1GasFees: sinon.stub(),
    };
    v3MockGasModel.estimateGasCost.callsFake((r: V3RouteWithValidQuote) => {
      return {
        gasEstimate: BigNumber.from(10000),
        gasCostInToken: CurrencyAmount.fromRawAmount(
          r.quoteToken,
          r.quote.multiply(new Fraction(95, 100)).quotient
        ),
        gasCostInUSD: CurrencyAmount.fromRawAmount(
          USDC,
          r.quote.multiply(new Fraction(95, 100)).quotient
        ),
      };
    });
    v3MockGasModel.calculateL1GasFees.callsFake(
      (route: V3RouteWithValidQuote[]) => {
        const r: any = route[0];
        return {
          gasUsedL1: BigNumber.from(0),
          gasCostL1USD: CurrencyAmount.fromRawAmount(
            USDC,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
          gasCostL1QuoteToken: CurrencyAmount.fromRawAmount(
            WETH,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
        };
      }
    );
    mockV3GasModelFactory.buildGasModel.resolves(v3MockGasModel);

    mockMixedRouteGasModelFactory = sinon.createStubInstance(
      MixedRouteHeuristicGasModelFactory
    );
    const mixedRouteMockGasModel = {
      estimateGasCost: sinon.stub(),
      calculateL1GasFees: sinon.stub(),
    };
    mixedRouteMockGasModel.estimateGasCost.callsFake(
      (r: MixedRouteWithValidQuote) => {
        return {
          gasEstimate: BigNumber.from(10000),
          gasCostInToken: CurrencyAmount.fromRawAmount(
            r.quoteToken,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
          gasCostInUSD: CurrencyAmount.fromRawAmount(
            USDC,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
        };
      }
    );
    mixedRouteMockGasModel.calculateL1GasFees.callsFake(
      (route: V3RouteWithValidQuote[]) => {
        const r: any = route[0];
        return {
          gasUsedL1: BigNumber.from(0),
          gasCostL1USD: CurrencyAmount.fromRawAmount(
            USDC,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
          gasCostL1QuoteToken: CurrencyAmount.fromRawAmount(
            WETH,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
        };
      }
    );
    mockMixedRouteGasModelFactory.buildGasModel.resolves(
      mixedRouteMockGasModel
    );

    mockV2GasModelFactory = sinon.createStubInstance(
      V2HeuristicGasModelFactory
    );
    const v2MockGasModel = {
      estimateGasCost: sinon.stub(),
      calculateL1GasFees: sinon.stub(),
    };
    v2MockGasModel.estimateGasCost.callsFake((r: V2RouteWithValidQuote) => {
      return {
        gasEstimate: BigNumber.from(10000),
        gasCostInToken: CurrencyAmount.fromRawAmount(
          r.quoteToken,
          r.quote.multiply(new Fraction(95, 100)).quotient
        ),
        gasCostInUSD: CurrencyAmount.fromRawAmount(
          USDC,
          r.quote.multiply(new Fraction(95, 100)).quotient
        ),
      };
    });
    v2MockGasModel.calculateL1GasFees.callsFake(
      (route: V2RouteWithValidQuote[]) => {
        const r: any = route[0];
        return {
          gasUsedL1: BigNumber.from(0),
          gasCostL1USD: CurrencyAmount.fromRawAmount(
            USDC,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
          gasCostL1QuoteToken: CurrencyAmount.fromRawAmount(
            WETH,
            r.quote.multiply(new Fraction(95, 100)).quotient
          ),
        };
      }
    );
    mockV2GasModelFactory.buildGasModel.resolves(v2MockGasModel);

    mockBlockTokenListProvider = sinon.createStubInstance(
      CachingTokenListProvider
    );
    const mockSwapRouterProvider = sinon.createStubInstance(SwapRouterProvider);
    mockSwapRouterProvider.getApprovalType.resolves({
      approvalTokenIn: 1,
      approvalTokenOut: 1,
    });

    mockTokenValidatorProvider = sinon.createStubInstance(
      TokenValidatorProvider
    );
    mockTokenValidatorProvider.validateTokens.resolves({
      getValidationByToken: () => TokenValidationResult.UNKN,
    });

    mockTokenPropertiesProvider = sinon.createStubInstance(
      TokenPropertiesProvider
    );
    mockTokenPropertiesProvider.getTokensProperties.resolves({
      '0x0': DEFAULT_TOKEN_PROPERTIES_RESULT,
    });

    mockFallbackTenderlySimulator = sinon.createStubInstance(
      FallbackTenderlySimulator
    );
    // mockFallbackTenderlySimulator.simulateTransaction.callsFake(async (_fromAddress, route)=>route)

    inMemoryRouteCachingProvider = new InMemoryRouteCachingProvider();
    inMemoryRouteCachingProvider.cacheMode = CacheMode.Livemode; // Assume cache is livemode by default.

    alphaRouter = new AlphaRouter({
      chainId,
      provider: mockProvider,
      multicall2Provider: mockMulticallProvider as any,
      v3SubgraphProvider: mockV3SubgraphProvider,
      v3PoolProvider: mockV3PoolProvider,
      onChainQuoteProvider: mockOnChainQuoteProvider,
      tokenProvider: mockTokenProvider,
      gasPriceProvider: mockGasPriceProvider,
      v3GasModelFactory: mockV3GasModelFactory,
      blockedTokenListProvider: mockBlockTokenListProvider,
      v2GasModelFactory: mockV2GasModelFactory,
      v2PoolProvider: mockV2PoolProvider,
      v2QuoteProvider: mockV2QuoteProvider,
      mixedRouteGasModelFactory: mockMixedRouteGasModelFactory,
      v2SubgraphProvider: mockV2SubgraphProvider,
      swapRouterProvider: mockSwapRouterProvider,
      tokenValidatorProvider: mockTokenValidatorProvider,
      simulator: mockFallbackTenderlySimulator,
      routeCachingProvider: inMemoryRouteCachingProvider,
      tokenPropertiesProvider: mockTokenPropertiesProvider,
    });
  });

  describe('exact in', () => {
    test('succeeds to route across all protocols when no protocols specified', async () => {
      // Mock the quote providers so that for each protocol, one route and one
      // amount less than 100% of the input gives a huge quote.
      // Ensures a split route.
      mockV2QuoteProvider.getQuotesManyExactIn.callsFake(
        async (amountIns: CurrencyAmount[], routes: V2Route[]) => {
          const routesWithQuotes = _.map(routes, (r, routeIdx) => {
            const amountQuotes = _.map(amountIns, (amountIn, idx) => {
              const quote =
                idx == 1 && routeIdx == 1
                  ? BigNumber.from(amountIn.quotient.toString()).mul(10)
                  : BigNumber.from(amountIn.quotient.toString());
              return {
                amount: amountIn,
                quote,
              } as V2AmountQuote;
            });
            return [r, amountQuotes];
          });

          return {
            routesWithQuotes: routesWithQuotes,
          } as { routesWithQuotes: V2RouteWithQuotes[] };
        }
      );

      mockOnChainQuoteProvider.getQuotesManyExactIn.callsFake(
        async (
          amountIns: CurrencyAmount[],
          routes: (V3Route | V2Route | MixedRoute)[],
          _providerConfig?: ProviderConfig
        ) => {
          const routesWithQuotes = _.map(routes, (r, routeIdx) => {
            const amountQuotes = _.map(amountIns, (amountIn, idx) => {
              const quote =
                idx == 1 && routeIdx == 1
                  ? BigNumber.from(amountIn.quotient.toString()).mul(10)
                  : BigNumber.from(amountIn.quotient.toString());
              return {
                amount: amountIn,
                quote,
                sqrtPriceX96AfterList: [
                  BigNumber.from(1),
                  BigNumber.from(1),
                  BigNumber.from(1),
                ],
                initializedTicksCrossedList: [1],
                gasEstimate: BigNumber.from(10000),
              } as AmountQuote;
            });
            return [r, amountQuotes];
          });

          return {
            routesWithQuotes: routesWithQuotes,
            blockNumber: mockBlockBN,
          } as {
            routesWithQuotes: RouteWithQuotes<V3Route>[];
            blockNumber: BigNumber;
          };
        }
      );

      const amount = CurrencyAmount.fromRawAmount(USDC, 10000);

      const swap = await alphaRouter.route(
        amount,
        WRAPPED_NATIVE_CURRENCY[chainId],
        TradeType.EXACT_INPUT,
        undefined,
        {
          ...ROUTING_CONFIG,
        }
      );

      expect(swap).toBeDefined();

      expect(mockFallbackTenderlySimulator.simulate.called).toBeFalsy();
      expect(mockProvider.getBlockNumber.called).toBeTruthy();
      expect(mockGasPriceProvider.getGasPrice.called).toBeTruthy();
      expect(
        mockV3GasModelFactory.buildGasModel.calledWith({
          chainId,
          gasPriceWei: mockGasPriceWeiBN,
          pools: sinon.match.any,
          amountToken: amount.currency,
          quoteToken: WETH,
          v2poolProvider: sinon.match.any,
          l2GasDataProvider: sinon.match.any,
          providerConfig: sinon.match({
            blockNumber: sinon.match.instanceOf(Promise),
          }),
        })
      ).toBeTruthy();
      expect(
        mockV2GasModelFactory.buildGasModel.calledWith({
          chainId,
          gasPriceWei: mockGasPriceWeiBN,
          poolProvider: sinon.match.any,
          token: WETH,
          providerConfig: sinon.match.any,
        })
      ).toBeTruthy();
      expect(
        mockMixedRouteGasModelFactory.buildGasModel.calledWith({
          chainId,
          gasPriceWei: mockGasPriceWeiBN,
          pools: sinon.match.any, /// v3 pool provider
          v2poolProvider: sinon.match.any,
          amountToken: amount.currency,
          quoteToken: WETH,
          providerConfig: sinon.match.any,
        })
      ).toBeTruthy();
    });
  });
});

type GetQuotesManyExactInFnParams = {
  quoteMultiplier?: Fraction;
  sqrtPriceX96AfterList?: BigNumber[];
};

function getQuotesManyExactInFn<TRoute extends V3Route | V2Route | MixedRoute>(
  options: GetQuotesManyExactInFnParams = {}
): (
  amountIns: CurrencyAmount[],
  routes: TRoute[],
  _providerConfig?: ProviderConfig | undefined
) => Promise<{
  routesWithQuotes: RouteWithQuotes<TRoute>[];
  blockNumber: BigNumber;
}> {
  return async (
    amountIns: CurrencyAmount[],
    routes: TRoute[],
    _providerConfig?: ProviderConfig
  ) => {
    const oneX96 = BigNumber.from(encodeSqrtRatioX96(1, 1).toString());
    const multiplier = options.quoteMultiplier || new Fraction(1, 1);
    const routesWithQuotes = _.map(routes, (r) => {
      const amountQuotes = _.map(amountIns, (amountIn) => {
        return {
          amount: amountIn,
          quote: BigNumber.from(
            amountIn.multiply(multiplier).quotient.toString()
          ),
          sqrtPriceX96AfterList: options.sqrtPriceX96AfterList || [
            oneX96,
            oneX96,
            oneX96,
          ],
          initializedTicksCrossedList: [1],
          gasEstimate: BigNumber.from(10000),
        } as AmountQuote;
      });
      return [r, amountQuotes];
    });

    return {
      routesWithQuotes: routesWithQuotes,
      blockNumber: mockBlockBN,
    } as {
      routesWithQuotes: RouteWithQuotes<TRoute>[];
      blockNumber: BigNumber;
    };
  };
}
