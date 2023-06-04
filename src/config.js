/**
 * @typedef {import('picgo').IPicGo} IPicGo
 * @typedef {import('picgo').IPluginConfig} IPluginConfig
 */

/**
 * 插件配置结构
 * @typedef {Object} PluginConfig
 * @property {string} url
 * @property {string} apiToken
 */

export const ID = 'itbaima'
export const SETTING_NAME = 'picBed.itbaima'

/**
 * 获取默认配置
 * @returns {PluginConfig}
 */
export const defaultConfig = () => ({
  url: 'https://image.itbaima.net/image/api/v1',
  apiToken: '',
})

/**
 * 获取存储的配置
 * @param {IPicGo} ctx
 * @return {PluginConfig}
 */
export const getConfig = (ctx) => ctx.getConfig(SETTING_NAME)

/**
 * 获取配置信息
 * @param {IPicGo} ctx
 * @return {IPluginConfig[]}
 */
export const config = (ctx) => {
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

/**
 * 检查配置
 * @param {IPicGo} ctx
 * @param {PluginConfig} config
 * @return {boolean}
 */
export const checkConfig = (ctx, config) => {
  const {url, apiToken} = config
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
