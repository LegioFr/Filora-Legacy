declare const __FILORA_CHANNEL__: 'production' | 'test'
declare const __FILORA_BUILD_ID__: string

export const FILORA_CHANNEL = __FILORA_CHANNEL__
export const FILORA_BUILD_ID = __FILORA_BUILD_ID__
export const FILORA_APP_NAME = FILORA_CHANNEL === 'production' ? 'Filora' : 'Filora Test'
export const FILORA_ICON_192 = FILORA_CHANNEL === 'production'
  ? '/icons/filora-192.png'
  : '/icons/filora-test-192.png'
