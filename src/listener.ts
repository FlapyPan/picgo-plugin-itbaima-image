import { IPicGo }                     from 'picgo'
import { checkConfig, getConfig, ID } from './config'
import { DeleteResponse }             from './api'
import { sleep }                      from './utils'

export const registerListeners = (ctx: IPicGo) => {
  ctx.on('remove', (imgList: any[]) => {
    const config = getConfig(ctx)
    if (!checkConfig(ctx, config)) return
    const {url, apiToken} = config
    const deleteUrl = url.endsWith('/') ? `${url}delete` : `${url}/delete`
    const imgInfos = imgList.filter(({type}) => type === ID)
    ;(async () => {
      for (const {fileName} of imgInfos) {
        try {
          const response: DeleteResponse = await ctx.request({
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
          await sleep(500)
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
