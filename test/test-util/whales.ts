import { ChainId, Currency, Ether } from '@baseswapfi/sdk-core';
import { DAI_BASE, USDC_BASE, DAI_ON, ExtendedEther, nativeOnChain, USDC_ON, WETH9, WNATIVE_ON } from '../../src';
// import { BULLET, BULLET_WITHOUT_TAX } from './mock-data';

// TODO: This is janky. These addresses do not line up with what they are saying it is (USDC, DAI, etc)
export const WHALES = (token: Currency): string => {
  switch (token) {
    case nativeOnChain(ChainId.BASE):
      return '0x428ab2ba90eba0a4be7af34c9ac451ab061ac010';
    case WNATIVE_ON(ChainId.BASE):
      return '0x4bb6b2efe7036020ba6f02a05602546c9f25bf28';
    case USDC_ON(ChainId.BASE):
      return '0x4a3636608d7bc5776cb19eb72caa36ebb9ea683b';
    case DAI_ON(ChainId.BASE):
      return '0x835866d37AFB8CB8F8334dCCdaf66cf01832Ff5D';

    // case BULLET_WITHOUT_TAX || BULLET:
    //   return '0x171d311eAcd2206d21Cb462d661C33F0eddadC03';
    // default:
    //   return '0xf04a5cc80b1e94c69b48f5ee68a08cd2f09a7c3e';

    default:
      return '';
  }
};
