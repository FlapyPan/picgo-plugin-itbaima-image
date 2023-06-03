import { IPicGo, IPluginConfig } from 'picgo'

export interface PluginConfig {
  url: string,
  apiToken: string
}

export const ID = 'itbaima'
export const SETTING_NAME = 'picBed.itbaima'

export const defaultConfig = (): PluginConfig => ({
  url: 'https://image.itbaima.net/image/api/v1',
  apiToken: '',
})

export const getConfig = (ctx: IPicGo): PluginConfig => ctx.getConfig(SETTING_NAME)

export const config = (ctx: IPicGo): IPluginConfig[] => {
  let pluginConfig = getConfig(ctx) ?? defaultConfig()
  return [
    {
      name: 'url',
      type: 'input',
      default: pluginConfig.url,
      required: true,
      message: 'API 地址',
      alias: 'API 地址',
    },
    {
      name: 'apiToken',
      type: 'input',
      default: pluginConfig.apiToken,
      required: true,
      message: 'API 密钥',
      alias: 'API 密钥',
    },
  ]
}

export const checkConfig = (ctx: IPicGo, {url, apiToken}: PluginConfig): boolean => {
  if (url.trim() === '') {
    ctx.emit('notification', {
      title: '请先配置上传地址',
    })
    return false
  }
  if (apiToken.trim() === '') {
    ctx.emit('notification', {
      title: '请先配置 API 密钥',
    })
    return false
  }
  return true
}
