import { sleep } from './utils'
import { checkConfig, getConfig, ID } from './config'

/**
 * @typedef {import('./api').DeleteResponse} DeleteResponse
 */

/**
 * 注册事件监听器
 * @param {IPicGo} ctx
 */
export const registerListeners = (ctx) => {
  ctx.on('remove', (imgList) => {
    const config = getConfig(ctx)
    if (!checkConfig(ctx, config)) return
    const {url, apiToken} = config
    const deleteUrl = url.endsWith('/') ? `${url}delete` : `${url}/delete`
    const imgInfos = imgList.filter(({type}) => type === ID)
    ;(async () => {
      for (const {fileName} of imgInfos) {
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
    })()
  })
}
