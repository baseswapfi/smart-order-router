// import { BigNumber } from '@ethersproject/bignumber';
// import { BaseProvider, JsonRpcProvider } from '@ethersproject/providers';
// import DEFAULT_TOKEN_LIST from '@uniswap/default-token-list';
// import { Protocol, SwapRouter, Trade } from '@baseswapfi/router-sdk';
// import {
//   ChainId,
//   Currency,
//   Fraction,
//   Token,
//   TradeType,
//   Pool,
//   Position,
//   SqrtPriceMath,
//   TickMath,
// } from '@baseswapfi/sdk-core';
// import { TokenList } from '@uniswap/token-lists';
// import retry from 'async-retry';
// import JSBI from 'jsbi';
// import _ from 'lodash';
// import NodeCache from 'node-cache';

// import { SWAP_ROUTER_02_ADDRESSES, WRAPPED_NATIVE_CURRENCY } from '../../util';
// import { CurrencyAmount } from '../../util/amounts';
// import { ID_TO_CHAIN_ID, ID_TO_NETWORK_NAME, V2_SUPPORTED } from '../../util/chains';
// import { getHighestLiquidityV3NativePool, getHighestLiquidityV3USDPool } from '../../util/gas-factory-helpers';
// import { log } from '../../util/log';
// import { buildSwapMethodParameters, buildTrade } from '../../util/methodParameters';
// import { metric, MetricLoggerUnit } from '../../util/metric';
// import { UNSUPPORTED_TOKENS } from '../../util/unsupported-tokens';
// import {
//   IRouter,
//   ISwapToRatio,
//   MethodParameters,
//   MixedRoute,
//   SwapAndAddConfig,
//   SwapAndAddOptions,
//   SwapAndAddParameters,
//   SwapOptions,
//   SwapRoute,
//   SwapToRatioResponse,
//   SwapToRatioStatus,
//   V3Route,
// } from '../router';
