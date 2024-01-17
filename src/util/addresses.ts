import { CHAIN_TO_ADDRESSES_MAP, ChainId, Token } from '@baseswapfi/sdk-core';
import { WRAPPED_NATIVE_CURRENCY } from './chains';

export type AddressMap = { [chainId: number]: string | undefined };

export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  [ChainId.BASE_GOERLI]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE_GOERLI].v3CoreFactoryAddress,
  [ChainId.BASE]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE].v3CoreFactoryAddress,
  [ChainId.ARBITRUM]: CHAIN_TO_ADDRESSES_MAP[ChainId.ARBITRUM].v3CoreFactoryAddress,
};

export const QUOTER_V2_ADDRESSES: AddressMap = {
  [ChainId.BASE_GOERLI]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE_GOERLI].quoterAddress,
  [ChainId.BASE]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE].quoterAddress,
};

export const MIXED_ROUTE_QUOTER_V1_ADDRESSES: AddressMap = {
  [ChainId.BASE_GOERLI]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE_GOERLI].v1MixedRouteQuoterAddress,
};

export const UNISWAP_MULTICALL_ADDRESSES: AddressMap = {
  [ChainId.BASE_GOERLI]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE_GOERLI].multicallAddress,
  [ChainId.BASE]: CHAIN_TO_ADDRESSES_MAP[ChainId.ARBITRUM].multicallAddress, // Needs to be the Uni version
  [ChainId.ARBITRUM]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE].multicallAddress, // Needs to be the Uni version
};

export const SWAP_ROUTER_02_ADDRESSES = (chainId: number): string => {
  console.log(`SWAP_ROUTER_02_ADDRESSES: not implemented. chain id ${chainId}`);
  return '';
};

export const OVM_GASPRICE_ADDRESS = '0x420000000000000000000000000000000000000F';
export const ARB_GASINFO_ADDRESS = '0x000000000000000000000000000000000000006C';

export const WETH9: {
  [chainId in ChainId]: Token;
} = WRAPPED_NATIVE_CURRENCY;
