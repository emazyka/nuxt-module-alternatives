import type { ProviderPartialOptions, ProviderOptions } from '../../type';
import type { Oauth2SchemeOptions } from '../schemes';
export interface FacebookProviderOptions extends ProviderOptions, Oauth2SchemeOptions {
}
export declare function facebook(strategy: ProviderPartialOptions<FacebookProviderOptions>): void;
