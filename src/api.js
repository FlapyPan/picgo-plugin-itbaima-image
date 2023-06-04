/**
 * 基本返回结构
 * @typedef {Object} BaseResponse
 * @property {boolean} success - 请求是否成果
 * @property {number} status - 状态码
 * @property {*} [message] - 返回信息和数据
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

/**
 * 上传请求的返回数据结构
 * @typedef {Object} UploadResponseMessage
 * @property {string} url - 图片地址
 * @property {number} size - 图片大小
 * @property {string} name - 图片名称
 * @property {string} delete_url - 图片删除地址
 */

/**
 * 检查是否是 UploadResponseMessage 类型
 * @function
 * @param {*} obj
 * @returns {boolean}
 */
export const isUploadResponseMessage = (obj) => (
  'url' in obj &&
  'size' in obj &&
  'name' in obj &&
  'delete_url' in obj
)
