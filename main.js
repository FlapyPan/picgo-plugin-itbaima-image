'use strict'

/**
 * @typedef {import('picgo').IPicGo} IPicGo
 * @typedef {import('picgo').IPluginConfig} IPluginConfig
 */

/**
 * 插件配置结构
 * @typedef {Object} PluginConfig
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

const ID = 'itbaima-v1'
const NAME = '栢码图床'
const SETTING_NAME = 'picBed.itbaima.v1'
const BASE_API_URL = 'https://api.itbaima.cn/image/api/v1'
const UPLOAD_API_URL = `${BASE_API_URL}/upload`
const DELETE_API_URL = `${BASE_API_URL}/delete`
const WEB_URL = 'https://www.itbaima.cn/space/images'

/**
 * 获取默认配置
 * @returns {PluginConfig}
 */
function defaultConfig() {
  return {
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
  const { apiToken } = config
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

function uploadPostOptions(apiToken, img, filename) {
  return {
    url: UPLOAD_API_URL,
    method: 'POST',
    headers: {
      'User-Agent': 'PicGo',
      'Authorization': apiToken,
    },
    formData: {
      file: {
        value: img,
        options: {
          filename,
        },
      },
      ssl: 'true',
    },
    json: true,
  }
}

/**
 * 上传处理器
 * @param {IPicGo} ctx
 * @return {Promise<void>}
 */
async function uploadHandle(ctx) {
  const config = getConfig(ctx)
  if (!checkConfig(ctx, config)) return
  const { apiToken } = config
  const imgList = ctx.output
  const task = async (i) => {
    const { fileName, buffer, base64Image } = imgList[i]
    const img = buffer ? buffer : Buffer.from(base64Image)
    try {
      /** @type {UploadResponse} */
      const response = await ctx.request(uploadPostOptions(apiToken, img, fileName))
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
          body: JSON.stringify(e.message ?? '未知错误，请检查日志并与开发者取得联系'),
        })
      }
    }
  }
  for (const i in imgList) await task(i)
}

function removePostOptions(apiToken, fileName) {
  return {
    url: `${DELETE_API_URL}/${fileName}`,
    method: 'GET',
    headers: {
      'User-Agent': 'PicGo',
      'Authorization': apiToken,
    },
    json: true,
  }
}

/**
 * 注册删除事件监听器
 * @param {IPicGo} ctx
 */
function registerRemoveListener(ctx) {
  const listener = async (imgList, guiApi) => {
    const config = getConfig(ctx)
    if (!checkConfig(ctx, config)) return
    const { apiToken } = config
    const task = async (fileName) => {
      try {
        /**  @type {DeleteResponse} */
        const response = await ctx.request(removePostOptions(apiToken, fileName))
        if (!response?.success) {
          ctx.log.error(JSON.stringify(response))
          ctx.emit('notification', {
            title: `远程图片删除失败 ${fileName}`,
            body: response?.message ?? '未知错误，请检查日志并与开发者取得联系',
          })
        }
        await sleep(200)
      } catch (e) {
        ctx.log.error(e)
        ctx.emit('notification', {
          title: `远程图片删除失败 ${fileName}`,
          body: JSON.stringify(e.message ?? '未知错误，请检查日志并与开发者取得联系'),
        })
      }
    }
    const imgInfos = imgList.filter(({ type }) => type === ID)
    for (const { fileName } of imgInfos) await task(fileName)
  }
  ctx.on('remove', listener)
}

function openBrowser(url) {
  const { exec } = require('child_process')
  const platform = require('os').platform()
  if (platform === 'win32') {
    exec(`start ${url}`)
  } else if (process.platform === 'darwin') {
    exec(`open ${url}`)
  } else {
    exec(`xdg-open ${url}`)
  }
}

/**
 * 插件菜单
 */
function guiMenu() {
  return [
    {
      label: '在浏览器中打开图床',
      handle: () => openBrowser(WEB_URL),
    },
  ]
}

/**
 * 栢码图床插件
 * @param {IPicGo} ctx
 */
function main(ctx) {
  const register = () => {
    ctx.helper.uploader.register(ID, {
      name: NAME,
      handle: uploadHandle,
      config,
    })
    registerRemoveListener(ctx)
  }
  return {
    uploader: ID,
    register,
    guiMenu,
  }
}

module.exports = main
