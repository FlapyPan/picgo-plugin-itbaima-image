import { config, ID } from './config'
import { uploadHandle } from './upload'
import { registerListeners } from './listener'

/**
 *
 * @param {import('picgo').IPicGo} ctx
 */
export default (ctx) => {
  const register = () => {
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
