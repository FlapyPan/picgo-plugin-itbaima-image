'use strict'

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

/**
 * 基本返回结构
 * @typedef {Object} BaseResponse
 * @property {boolean} success - 请求是否成果
 * @property {number} status - 状态码
 * @property {*} [message] - 返回信息和数据
 */

/**
 * 上传请求的返回数据结构
 * @typedef {Object} UploadResponseMessage
 * @property {string} url - 图片地址
 * @property {number} size - 图片大小
 * @property {string} name - 图片名称
 * @property {string} delete_url - 图片删除地址
 */

/**
 * 上传请求的返回结构
 * @typedef {BaseResponse} UploadResponse
 * @property {(string|UploadResponseMessage)} message - 返回信息和数据
 */

/**
 * 删除请求的返回结构
 * @typedef {BaseResponse} DeleteResponse
 * @property {string} message - 返回信息
 */

const ID = 'itbaima'
const SETTING_NAME = 'picBed.itbaima'

/**
 * 获取默认配置
 * @returns {{apiV1: string, apiToken: string}}
 */
function defaultConfig() {
  return {
    apiV1: 'https://api.itbaima.net/image/api/v1',
    apiToken: '',
  }
}

/**
 * 获取存储的配置
 * @param {IPicGo} ctx
 * @return {PluginConfig}
 */
function getConfig(ctx) { return ctx.getConfig(SETTING_NAME) }

/**
 * 获取配置信息
 * @param {IPicGo} ctx
 * @return {IPluginConfig[]}
 */
function config(ctx) {
  const pluginConfig = getConfig(ctx) ?? defaultConfig()
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
function checkConfig(ctx, config) {
  const { apiV1, apiToken } = config
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

/**
 * 睡眠
 * @param ms - 睡眠的时间(毫秒)
 * @return {Promise<void>}
 */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/**
 * 上传处理器
 * @param {IPicGo} ctx
 * @return {Promise<void>}
 */
async function uploadHandle(ctx) {
  const config = getConfig(ctx)
  if (!checkConfig(ctx, config)) return
  const { apiV1, apiToken } = config
  const uploadUrl = apiV1.endsWith('/') ? `${apiV1}upload` : `${apiV1}/upload`
  const imgList = ctx.output
  for (const i in imgList) {
    const { fileName, buffer, base64Image } = imgList[i]
    const img = !buffer ? Buffer.from(base64Image) : buffer
    try {
      /** @type {UploadResponse} */
      const response = await ctx.request({
        url: uploadUrl,
        method: 'POST',
        headers: {
          'User-Agent': 'PicGo',
          'Authorization': apiToken,
        },
        formData: {
          file: {
            value: img,
            options: {
              filename: fileName,
            },
          },
          ssl: 'true',
        },
        json: true,
      })
      if (response?.success) {
        delete imgList[i].base64Image
        delete imgList[i].buffer
        imgList[i].imgUrl = response.message?.url
        imgList[i].fileName = response.message?.name
      } else {
        ctx.log.error(JSON.stringify(response))
        ctx.emit('notification', {
          title: `上传失败 ${fileName}`,
          body: response?.message ?? '未知错误，请检查日志并与开发者取得联系',
        })
      }
      await sleep(100)
    } catch (e) {
      ctx.log.error(e)
      if (e?.response?.status === 413) {
        ctx.emit('notification', {
          title: `上传失败 ${fileName}`,
          body: `图片大小超出限制`,
        })
      } else {
        ctx.emit('notification', {
          title: `上传失败 ${fileName}`,
          body: JSON.stringify(
            e.message ?? '未知错误，请检查日志并与开发者取得联系'),
        })
      }
    }
  }
}

/**
 * 注册事件监听器
 * @param {IPicGo} ctx
 */
function registerListeners(ctx) {
  ctx.on('remove', (imgList) => {
    const config = getConfig(ctx)
    if (!checkConfig(ctx, config)) return
    const { apiV1, apiToken } = config
    const deleteUrl = apiV1.endsWith('/') ? `${apiV1}delete` : `${apiV1}/delete`
    const imgInfos = imgList.filter(({ type }) => type === ID)
    ;(async () => {
      for (const { fileName } of imgInfos) {
        try {
          /**  @type {DeleteResponse} */
          const response = await ctx.request({
            url: `${deleteUrl}/${fileName}`,
            method: 'GET',
            headers: {
              'User-Agent': 'PicGo',
              'Authorization': apiToken,
            },
            json: true,
          })
          if (!response?.success) {
            ctx.log.error(JSON.stringify(response))
            ctx.emit('notification', {
              title: `远程图片删除失败 ${fileName}`,
              body: response?.message ??
                '未知错误，请检查日志并与开发者取得联系',
            })
          }
          await sleep(200)
        } catch (e) {
          ctx.log.error(e)
          ctx.emit('notification', {
            title: `远程图片删除失败 ${fileName}`,
            body: JSON.stringify(
              e.message ?? '未知错误，请检查日志并与开发者取得联系'),
          })
        }
      }
    })()
  })
}

/**
 * 栢码图床插件
 * @param {IPicGo} ctx
 */
function main(ctx) {
  return {
    uploader: ID,
    register: () => {
      ctx.helper.uploader.register(ID, {
        name: '栢码程序员 图床',
        config,
        handle: uploadHandle,
      })
      registerListeners(ctx)
    },
  }
}

module.exports = main
