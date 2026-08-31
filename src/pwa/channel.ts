declare const __FILORA_CHANNEL__: 'production' | 'test'

export const FILORA_CHANNEL = __FILORA_CHANNEL__
export const FILORA_APP_NAME = FILORA_CHANNEL === 'production' ? 'Filora' : 'Filora Test'
