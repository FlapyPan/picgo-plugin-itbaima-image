export interface BaseResponse {
  success: boolean,
  status: number,
  message?: any
}

export interface UploadResponseMessage {
  url: string
  size: number
  name: string
  delete_url: string
}

export const isUploadResponseMessage = (obj: any): obj is UploadResponseMessage => (
  'url' in obj &&
  'size' in obj &&
  'name' in obj &&
  'delete_url' in obj
)

export interface UploadResponse extends BaseResponse {
  message: string | UploadResponseMessage
}

export interface DeleteResponse extends BaseResponse {
  message: string
}
