import { IPicGo, IPluginConfig, PicGo } from 'picgo'

const ID = 'itbaima'
const SETTING_NAME = 'picBed.itbaima'

interface PluginConfig {
  url: string
  apiToken: string
}

export = (ctx: PicGo) => {
  const register = (): void => {
    ctx.helper.uploader.register(ID, {
      transformer: '',
      name: '栢码程序员 图床',
      config,
      handle: uploadHandle,
    })
  }
  const config = (ctx: PicGo): IPluginConfig[] => {
    let pluginConfig: PluginConfig = ctx.getConfig(SETTING_NAME) ?? {
      url: 'https://image.itbaima.net/image/api/v1/upload',
      apiToken: '',
    }
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
  const uploadHandle = async (ctx: IPicGo) => {
    const {
      url,
      apiToken,
    }: PluginConfig = ctx.getConfig(SETTING_NAME)
    if (url.trim() === '') {
      ctx.emit('notification', {
        title: '请先配置上传地址',
      })
      return
    }
    if (apiToken.trim() === '') {
      ctx.emit('notification', {
        title: '请先配置 API 密钥',
      })
      return
    }
    const imgList = ctx.output
    for (const i in imgList) {
      const {
        fileName,
        buffer,
        base64Image,
      } = imgList[i]
      const img = (!buffer) ? Buffer.from(base64Image) : buffer
      try {
        const response = await ctx.request({
          url,
          method: 'POST',
          headers: {
            'User-Agent': 'PicGo',
            'Authorization': apiToken,
          },
          formData: {
            file: {
              value: img,
              options: { filename: fileName },
            },
            ssl: 'true',
          },
        })
        ctx.log.debug(response)
        const data = JSON.parse(response)
        if (!data?.success) {
          if (data?.status === 401 || data?.status === 403) {
            ctx.emit('notification', {
              title: `上传失败 ${fileName}`,
              body: `请检查token是否有效 ${data?.message}`,
            })
          } else {
            ctx.emit('notification', {
              title: `上传失败 ${fileName}`,
              body: data?.message ?? '未知错误，请检查日志并与开发者取得联系',
            })
          }
          continue
        }
        delete imgList[i].base64Image
        delete imgList[i].buffer
        imgList[i].imgUrl = data.message.url
        imgList[i].fileName = data.message.name
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

  return {
    uploader: ID,
    register,
  }
}
