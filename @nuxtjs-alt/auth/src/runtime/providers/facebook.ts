import type { ProviderPartialOptions, ProviderOptions } from '../../type'
import type { Oauth2SchemeOptions } from '../schemes'
import { assignDefaults } from '../utils/provider'

export interface FacebookProviderOptions
    extends ProviderOptions,
    Oauth2SchemeOptions { }

export function facebook(
    strategy: ProviderPartialOptions<FacebookProviderOptions>
): void {
    const DEFAULTS: typeof strategy = {
        scheme: 'oauth2',
        endpoints: {
            authorization: 'https://facebook.com/v2.12/dialog/oauth',
            userInfo:
                'https://graph.facebook.com/v2.12/me?fields=about,name,picture{url},email'
        },
        scope: ['public_profile', 'email']
    }

    assignDefaults(strategy, DEFAULTS)
}
