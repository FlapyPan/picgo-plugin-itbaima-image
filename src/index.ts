import { IPicGo }            from 'picgo'
import { config, ID }        from './config'
import { uploadHandle }      from './upload'
import { registerListeners } from './listener'

export = (ctx: IPicGo) => {
  const register = (): void => {
    ctx.helper.uploader.register(ID, {
      name: '栢码程序员 图床',
      config,
      handle: uploadHandle,
    })
    registerListeners(ctx)
  }
  return {
    uploader: ID,
    register,
  }
}
