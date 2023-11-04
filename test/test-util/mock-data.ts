import { BigNumber } from '@ethersproject/bignumber';
import { ChainId, Currency, Ether, Token } from '@baseswapfi/sdk-core';
import { TokenList } from '@uniswap/token-lists';
import { Pair } from '@baseswapfi/v2-sdk';
import { encodeSqrtRatioX96, FeeAmount, Pool } from '@baseswapfi/v3-sdk2';
import _ from 'lodash';
import {
  AlphaRouterConfig,
  CurrencyAmount,
  DAI_BASE as DAI,
  TokenAccessor,
  USDC_BASE as USDC,
  WBTC_BASE as WBTC,
  V2SubgraphPool,
  V3PoolAccessor,
  V3SubgraphPool,
  WRAPPED_NATIVE_CURRENCY,
} from '../../src';
import { V2PoolAccessor } from '../../src';

const chainId = ChainId.BASE;
const WRAPPED_NATIVE = WRAPPED_NATIVE_CURRENCY[chainId];
export const mockBlock = 5525383; // 10/20/23 6:15pm EST
export const mockGasPriceWeiBN = BigNumber.from(100000);
export const mockBlockBN = BigNumber.from(mockBlock);

export const mockRoutingConfig: AlphaRouterConfig = {
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
  maxSplits: 4,
  distributionPercent: 5,
  forceCrossProtocol: false,
};

// Mock 0 decimal token
export const MOCK_ZERO_DEC_TOKEN = new Token(
  ChainId.BASE,
  '0x11fe4b6ae13d2a6055c8d9cf65c55bac32b5d844', // TODO: This might blow things up
  0,
  'MOCK',
  'Mock Zero Dec'
);

// Mock V3 Pools
export const USDC_MOCK_LOW = new Pool(
  USDC,
  MOCK_ZERO_DEC_TOKEN,
  FeeAmount.LOW,
  encodeSqrtRatioX96(1, 1),
  500,
  0
);

export const USDC_WETH_LOW = new Pool(
  USDC,
  WRAPPED_NATIVE!,
  FeeAmount.LOW,
  encodeSqrtRatioX96(1, 1),
  500,
  0
);

export const USDC_WETH_MEDIUM = new Pool(
  USDC,
  WRAPPED_NATIVE!,
  FeeAmount.MEDIUM,
  encodeSqrtRatioX96(1, 1),
  500,
  0
);

// Mock USDC weth pools with different liquidity

export const USDC_WETH_LOW_LIQ_LOW = new Pool(
  USDC,
  WRAPPED_NATIVE!,
  FeeAmount.LOW,
  encodeSqrtRatioX96(1, 1),
  100,
  0
);

export const USDC_WETH_MED_LIQ_MEDIUM = new Pool(
  USDC,
  WRAPPED_NATIVE!,
  FeeAmount.MEDIUM,
  encodeSqrtRatioX96(1, 1),
  500,
  0
);

export const USDC_WETH_HIGH_LIQ_HIGH = new Pool(
  USDC,
  WRAPPED_NATIVE!,
  FeeAmount.HIGH,
  encodeSqrtRatioX96(1, 1),
  1000,
  0
);

// export const WETH9_USDT_LOW = new Pool(
//   WRAPPED_NATIVE!,
//   USDT,
//   FeeAmount.LOW,
//   encodeSqrtRatioX96(1, 1),
//   200,
//   0
// );

export const USDC_DAI_LOW = new Pool(
  USDC,
  DAI,
  FeeAmount.LOW,
  encodeSqrtRatioX96(1, 1),
  10,
  0
);
export const USDC_DAI_MEDIUM = new Pool(
  USDC,
  DAI,
  FeeAmount.MEDIUM,
  encodeSqrtRatioX96(1, 1),
  8,
  0
);
// export const USDC_USDT_MEDIUM = new Pool(USDC, USDT, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 8, 0);

// export const DAI_USDT_LOW = new Pool(DAI, USDT, FeeAmount.LOW, encodeSqrtRatioX96(1, 1), 10, 0);
// export const DAI_USDT_MEDIUM = new Pool(DAI, USDT, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 10, 0);
// export const WBTC_USDT_MEDIUM = new Pool(USDT, WBTC, FeeAmount.MEDIUM, encodeSqrtRatioX96(1, 1), 500, 0);
// export const WBTC_WETH_MEDIUM = new Pool(
//   WRAPPED_NATIVE!,
//   WBTC,
//   FeeAmount.MEDIUM,
//   encodeSqrtRatioX96(1, 1),
//   500,
//   0
// );

// // Mock V2 Pools
// export const DAI_USDT = new Pair(
//   CurrencyAmount.fromRawAmount(DAI, 10000000000),
//   CurrencyAmount.fromRawAmount(USDT, 10000000000)
// );

export const USDC_WETH = new Pair(
  CurrencyAmount.fromRawAmount(USDC, 10000000000),
  CurrencyAmount.fromRawAmount(WRAPPED_NATIVE!, 10000000000)
);

// export const USDC_USDT = new Pair(
//   CurrencyAmount.fromRawAmount(USDC, 10000000000),
//   CurrencyAmount.fromRawAmount(USDT, 10000000000)
// );

// export const WETH_USDT = new Pair(
//   CurrencyAmount.fromRawAmount(USDT, 10000000000),
//   CurrencyAmount.fromRawAmount(WRAPPED_NATIVE!, 10000000000)
// );

export const USDC_DAI = new Pair(
  CurrencyAmount.fromRawAmount(USDC, 10000000000),
  CurrencyAmount.fromRawAmount(DAI, 10000000000)
);

// export const WETH_DAI = new Pair(
//   CurrencyAmount.fromRawAmount(DAI, 10000000000),
//   CurrencyAmount.fromRawAmount(WRAPPED_NATIVE!, 10000000000)
// );

export const WBTC_WETH = new Pair(
  CurrencyAmount.fromRawAmount(WBTC, 10000000000),
  CurrencyAmount.fromRawAmount(WRAPPED_NATIVE!, 10000000000)
);

export const poolToV3SubgraphPool = (
  pool: Pool,
  idx: number
): V3SubgraphPool => {
  return {
    id: idx.toString(),
    feeTier: pool.fee.toString(),
    liquidity: pool.liquidity.toString(),
    token0: {
      id: pool.token0.address,
    },
    token1: {
      id: pool.token1.address,
    },
    tvlETH: parseFloat(pool.liquidity.toString()),
    tvlUSD: parseFloat(pool.liquidity.toString()),
  };
};

export const pairToV2SubgraphPool = (
  pool: Pair,
  idx: number
): V2SubgraphPool => {
  return {
    id: idx.toString(),
    token0: {
      id: pool.token0.address,
    },
    token1: {
      id: pool.token1.address,
    },
    reserve: 1000,
    supply: 100,
    reserveUSD: 100,
  };
};

export const buildMockV3PoolAccessor: (pools: Pool[]) => V3PoolAccessor = (
  pools: Pool[]
) => {
  return {
    getAllPools: () => pools,
    getPoolByAddress: (address: string) =>
      _.find(
        pools,
        (p) =>
          Pool.getAddress(p.token0, p.token1, p.fee).toLowerCase() ==
          address.toLowerCase()
      ),
    getPool: (tokenA, tokenB, fee) =>
      _.find(
        pools,
        (p) =>
          Pool.getAddress(p.token0, p.token1, p.fee) ==
          Pool.getAddress(tokenA, tokenB, fee)
      ),
  };
};

export const buildMockV2PoolAccessor: (pools: Pair[]) => V2PoolAccessor = (
  pools: Pair[]
) => {
  return {
    getAllPools: () => pools,
    getPoolByAddress: (address: string) =>
      _.find(
        pools,
        (p) =>
          Pair.getAddress(p.token0, p.token1).toLowerCase() ==
          address.toLowerCase()
      ),
    getPool: (tokenA, tokenB) =>
      _.find(
        pools,
        (p) =>
          Pair.getAddress(p.token0, p.token1) == Pair.getAddress(tokenA, tokenB)
      ),
  };
};

export const buildMockTokenAccessor: (tokens: Token[]) => TokenAccessor = (
  tokens
) => {
  return {
    getAllTokens: () => tokens,
    getTokenByAddress: (address) =>
      _.find(tokens, (t) => t.address.toLowerCase() == address.toLowerCase()),
    getTokenBySymbol: (symbol) =>
      _.find(tokens, (t) => t.symbol!.toLowerCase() == symbol.toLowerCase()),
  };
};

export const mockTokenList: TokenList = {
  name: 'Tokens',
  timestamp: '2021-01-05T20:47:02.923Z',
  version: {
    major: 1,
    minor: 0,
    patch: 0,
  },
  tags: {},
  logoURI: 'ipfs://QmNa8mQkrNKp1WEEeGjFezDmDeodkWRevGFN8JCV7b4Xir',
  keywords: ['uniswap'],
  tokens: [
    {
      name: 'USDC',
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      decimals: 6,
      chainId: chainId,
      logoURI: '',
    },
    {
      name: 'USDbC',
      address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA',
      symbol: 'USDT',
      decimals: 6,
      chainId: chainId,
      logoURI: '',
    },
    {
      name: 'DAI',
      address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb',
      symbol: 'DAI',
      decimals: 18,
      chainId: chainId,
      logoURI: '',
    },
    {
      name: 'Axelar Wrapped Bitcoin',
      symbol: 'axlWBTC',
      address: '0x1a35EE4640b0A3B87705B0A4B45D227Ba60Ca2ad',
      chainId: chainId,
      decimals: 8,
      logoURI: '',
    },
  ],
};

// export const BLAST_WITHOUT_TAX = new Token(
//   ChainId.MAINNET,
//   '0x3ed643e9032230f01c6c36060e305ab53ad3b482',
//   18,
//   'BLAST',
//   'BLAST'
// );
// export const BLAST = new Token(
//   ChainId.MAINNET,
//   '0x3ed643e9032230f01c6c36060e305ab53ad3b482',
//   18,
//   'BLAST',
//   'BLAST',
//   false,
//   BigNumber.from(400),
//   BigNumber.from(10000)
// );
// export const BULLET_WITHOUT_TAX = new Token(
//   ChainId.MAINNET,
//   '0x8ef32a03784c8Fd63bBf027251b9620865bD54B6',
//   8,
//   'BULLET',
//   'Bullet Game Betting Token',
//   false
// );
// export const BULLET = new Token(
//   ChainId.MAINNET,
//   '0x8ef32a03784c8Fd63bBf027251b9620865bD54B6',
//   8,
//   'BULLET',
//   'Bullet Game Betting Token',
//   false,
//   BigNumber.from(500),
//   BigNumber.from(500)
// );
// export const STETH_WITHOUT_TAX = new Token(
//   ChainId.MAINNET,
//   '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
//   18,
//   'stETH',
//   'stETH',
//   false
// );

// stETH is a special case (rebase token), that would make the token include buyFeeBps and sellFeeBps of 0 as always
// @note This is CBETH on Base being used here
export const STETH = new Token(
  ChainId.BASE,
  '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
  18,
  'cbETH',
  'cbETH',
  false,
  BigNumber.from(0),
  BigNumber.from(0)
);
// export const BITBOY = new Token(
//   ChainId.MAINNET,
//   '0x4a500ed6add5994569e66426588168705fcc9767',
//   8,
//   'BITBOY',
//   'BitBoy Fund',
//   false,
//   BigNumber.from(300),
//   BigNumber.from(300)
// );

export const PORTION_BIPS = 12;
export const PORTION_RECIPIENT = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'; // TODO: ?
export const PORTION_TYPE = 'flat';

export type Portion = {
  bips: number;
  recipient: string;
  type: string;
};

export const FLAT_PORTION: Portion = {
  bips: PORTION_BIPS,
  recipient: PORTION_RECIPIENT,
  type: PORTION_TYPE,
};

export const GREENLIST_TOKEN_PAIRS: Array<[Currency, Currency]> = [
  [Ether.onChain(ChainId.BASE), USDC],
  [WRAPPED_NATIVE_CURRENCY[ChainId.BASE], USDC],
  [DAI, WBTC],
];

// export const GREENLIST_CARVEOUT_PAIRS: Array<[Currency, Currency]> = [
//   [USDC, DAI],
//   [WRAPPED_NATIVE_CURRENCY[ChainId.MAINNET], Ether.onChain(ChainId.MAINNET)],
// ];
