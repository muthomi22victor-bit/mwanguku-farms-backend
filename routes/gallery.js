const express = require('express');
const Gallery = require('../models/Gallery');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * GET /api/gallery
 * Public — list all gallery images. Supports ?category= filter.
 */
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    const images = await Gallery.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: images.length, images });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch gallery', error: err.message });
  }
});

/**
 * POST /api/gallery
 * Admin only — upload a new gallery image (multipart/form-data, field name "image").
 */
router.post('/', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file && !req.body.image) {
      return res.status(400).json({ success: false, message: 'An image file is required' });
    }

    const { title, description, category, tags, featured } = req.body;

    const image = await Gallery.create({
      title,
      description,
      category,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      featured: featured === 'true' || featured === true,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image,
      uploader: req.user._id,
    });

    res.status(201).json({ success: true, image });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to upload image', error: err.message });
  }
});

/**
 * PUT /api/gallery/:id
 * Admin only — update gallery item metadata (and optionally replace the image).
 */
router.put('/:id', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = `/uploads/${req.file.filename}`;
    if (updates.tags) updates.tags = updates.tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (updates.featured !== undefined) updates.featured = updates.featured === 'true' || updates.featured === true;

    const image = await Gallery.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!image) return res.status(404).json({ success: false, message: 'Gallery image not found' });
    res.json({ success: true, image });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update image', error: err.message });
  }
});

/**
 * DELETE /api/gallery/:id
 * Admin only.
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const image = await Gallery.findByIdAndDelete(req.params.id);
    if (!image) return res.status(404).json({ success: false, message: 'Gallery image not found' });
    res.json({ success: true, message: 'Gallery image deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete image', error: err.message });
  }
});

module.exports = router;
