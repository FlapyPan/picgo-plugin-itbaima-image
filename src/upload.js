import { checkConfig, getConfig } from './config'
import { isUploadResponseMessage } from './api'
import { sleep } from './utils'

/**
 * @typedef {import('picgo').IPicGo} IPicGo
 * @typedef {import('picgo').IPluginConfig} IPluginConfig
 * @typedef {import('./api').UploadResponse} UploadResponse
 */

/**
 * 上传处理器
 * @param {IPicGo} ctx
 * @return {Promise<void>}
 */
export const uploadHandle = async (ctx) => {
  const config = getConfig(ctx)
  if (!checkConfig(ctx, config)) return
  const {apiV1, apiToken} = config
  const uploadUrl = apiV1.endsWith('/') ? `${apiV1}upload` : `${apiV1}/upload`
  const imgList = ctx.output
  for (const i in imgList) {
    const {fileName, buffer, base64Image} = imgList[i]
    const img = (!buffer) ? Buffer.from(base64Image) : buffer
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
            options: {filename: fileName},
          },
          ssl: 'true',
        },
        json: true,
      })
      if (response?.success) {
        delete imgList[i].base64Image
        delete imgList[i].buffer
        if (isUploadResponseMessage(response?.message)) {
          imgList[i].imgUrl = response.message.url
          imgList[i].fileName = response.message.name
        }
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
}
