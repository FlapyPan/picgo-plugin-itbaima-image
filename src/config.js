/**
 * @typedef {import('picgo').IPicGo} IPicGo
 * @typedef {import('picgo').IPluginConfig} IPluginConfig
 */

/**
 * 插件配置结构
 * @typedef {Object} PluginConfig
 * @property {string} apiV1
 * @property {string} apiToken
 */

export const ID = 'itbaima'
export const SETTING_NAME = 'picBed.itbaima'

/**
 * 获取默认配置
 * @returns {{apiV1: string, apiToken: string}}
 */
export const defaultConfig = () => ({
  apiV1: 'https://api.itbaima.net/image/api/v1',
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
      name: 'apiV1',
      type: 'input',
      default: pluginConfig.apiV1,
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
  const {apiV1, apiToken} = config
  if (apiV1.trim() === '') {
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
