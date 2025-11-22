/**
 * 文件上传配置
 * 使用 multer 处理文件上传
 */
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/templates')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

// 配置存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    // 生成唯一文件名：原文件名-时间戳-随机数.扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    const ext = path.extname(file.originalname)
    const basename = path.basename(file.originalname, ext)
    cb(null, `${basename}-${uniqueSuffix}${ext}`)
  }
})

// 文件过滤 - 只允许 .docx 文件
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  
  if (ext === '.docx') {
    cb(null, true)
  } else {
    cb(new Error('只允许上传 .docx 文件'))
  }
}

// 创建 multer 实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 限制 50MB
  }
})

export default upload
