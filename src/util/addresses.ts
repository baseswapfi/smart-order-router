import { CHAIN_TO_ADDRESSES_MAP, ChainId, Token, V2_ROUTER_ADDRESSES } from '@baseswapfi/sdk-core';

export type AddressMap = { [chainId: number]: string | undefined };

export const V3_CORE_FACTORY_ADDRESSES: AddressMap = {
  [ChainId.BASE_GOERLI]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE_GOERLI].v3CoreFactoryAddress,
  [ChainId.BASE]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE].v3CoreFactoryAddress,
  [ChainId.SCROLL]: CHAIN_TO_ADDRESSES_MAP[ChainId.SCROLL].v3CoreFactoryAddress,
};

export const QUOTER_V2_ADDRESSES: AddressMap = {
  [ChainId.BASE_GOERLI]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE_GOERLI].quoterAddress,
  [ChainId.BASE]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE].quoterAddress,
  [ChainId.SCROLL]: CHAIN_TO_ADDRESSES_MAP[ChainId.SCROLL].quoterAddress,
};

// TODO: Checkout the mixed routing thing. Relevant for our setup now
export const MIXED_ROUTE_QUOTER_V1_ADDRESSES: AddressMap = {};

export const UNISWAP_MULTICALL_ADDRESSES: AddressMap = {
  [ChainId.BASE_GOERLI]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE_GOERLI].multicallAddress,
  [ChainId.BASE]: CHAIN_TO_ADDRESSES_MAP[ChainId.BASE].multicallAddress, // Needs to be the Uni version
  [ChainId.SCROLL]: CHAIN_TO_ADDRESSES_MAP[ChainId.SCROLL].multicallAddress,
};

export const SWAP_ROUTER_02_ADDRESSES = (chainId: number): string => {
  return V2_ROUTER_ADDRESSES[chainId] || '';
};

export const OVM_GASPRICE_ADDRESS = '0x420000000000000000000000000000000000000F';
export const ARB_GASINFO_ADDRESS = '0x000000000000000000000000000000000000006C';

// TODO: Need to sort this out or add for Scroll L2
export const GAS_ORACLE_ADDRESS = {
  [ChainId.SCROLL]: '0x5300000000000000000000000000000000000002',
};

// export const TICK_LENS_ADDRESS = CHAIN_TO_ADDRESSES_MAP[ChainId.BASE].tickLensAddress;
// export const NONFUNGIBLE_POSITION_MANAGER_ADDRESS =
//   CHAIN_TO_ADDRESSES_MAP[ChainId.BASE].nonfungiblePositionManagerAddress;
// export const V3_MIGRATOR_ADDRESS = CHAIN_TO_ADDRESSES_MAP[ChainId.BASE].v3MigratorAddress;
// export const MULTICALL2_ADDRESS = '0x942a772191A34040121C69bE6caBFEE6312ab641';

export const WETH9: {
  [chainId in ChainId]: Token;
} = {
  [ChainId.BASE_GOERLI]: new Token(
    ChainId.BASE_GOERLI,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.BASE]: new Token(ChainId.BASE, '0x4200000000000000000000000000000000000006', 18, 'WETH', 'Wrapped Ether'),
  [ChainId.SCROLL_SEPOLIA]: new Token(
    ChainId.SCROLL_SEPOLIA,
    '0x5300000000000000000000000000000000000004',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.OPTIMISM]: new Token(
    ChainId.OPTIMISM,
    '0x4200000000000000000000000000000000000006',
    18,
    'WETH',
    'Wrapped Ether'
  ),
  [ChainId.SCROLL]: new Token(
    ChainId.SCROLL,
    '0x5300000000000000000000000000000000000004',
    18,
    'WETH',
    'Wrapped Ether'
  ),
};
