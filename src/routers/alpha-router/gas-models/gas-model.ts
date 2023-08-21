import { BigNumber } from '@ethersproject/bignumber';
// import { ChainId, Token } from '@baseswapfi/sdk-core';
import { CurrencyAmount } from '../../../util/amounts';
import { RouteWithValidQuote } from '../entities/route-with-valid-quote';

/**
 * Contains functions for generating gas estimates for given routes.
 *
 * We generally compute gas estimates off-chain because
 *  1/ Calling eth_estimateGas for a swaps requires the caller to have
 *     the full balance token being swapped, and approvals.
 *  2/ Tracking gas used using a wrapper contract is not accurate with Multicall
 *     due to EIP-2929
 *  3/ For V2 we simulate all our swaps off-chain so have no way to track gas used.
 *
 * Generally these models should be optimized to return quickly by performing any
 * long running operations (like fetching external data) outside of the functions defined.
 * This is because the functions in the model are called once for every route and every
 * amount that is considered in the algorithm so it is important to minimize the number of
 * long running operations.
 */
export type IGasModel<TRouteWithValidQuote extends RouteWithValidQuote> = {
  estimateGasCost(
    routeWithValidQuote: TRouteWithValidQuote
  ): {
    gasEstimate: BigNumber;
    gasCostInToken: CurrencyAmount;
    gasCostInUSD: CurrencyAmount;
  };
  calculateL1GasFees?(routes: TRouteWithValidQuote[]): Promise<L1ToL2GasCosts>;
};

export type L1ToL2GasCosts = {
  gasUsedL1: BigNumber;
  gasCostL1USD: CurrencyAmount;
  gasCostL1QuoteToken: CurrencyAmount;
};
