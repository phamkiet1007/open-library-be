const express = require('express')
const multer = require('multer')
const supabase = require('../configs/supabaseClient')
const router = express.Router()

const { authenticate, optionalAuth } = require('../middlewares/auth.middleware');
const { isAdmin, isMember } = require('../middlewares/role.middleware');

const { getVietnamTime } = require('../utils/date.utils');



const storage = multer.memoryStorage()
const upload = multer({ storage })

router.post('/', authenticate, isAdmin, upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    const fileName = `${getVietnamTime}-${file.originalname}`

    const { data, error } = await supabase.storage
      .from('books-pdf') //bucket-name
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      })

    if (error) return res.status(500).json({ error })

    const { data: publicUrlData } = supabase.storage
      .from('books-pdf')
      .getPublicUrl(fileName)

    return res.json({ publicUrl: publicUrlData.publicUrl })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Upload failed' })
  }
})

module.exports = router
