const express = require('express');
const Product = require('../models/Product');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

/**
 * GET /api/products
 * Public — list all products. Supports ?category= and ?featured=true filters.
 */
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.featured) filter.featured = req.query.featured === 'true';

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: products.length, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: err.message });
  }
});

/**
 * GET /api/products/:id
 * Public — get a single product.
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: err.message });
  }
});

/**
 * POST /api/products
 * Admin only — create a product. Accepts multipart/form-data with an "image" file,
 * or a JSON body with an "image" URL string.
 */
router.post('/', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, price, category, inStock, stockQuantity, featured } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      category,
      inStock: inStock === undefined ? true : inStock === 'true' || inStock === true,
      stockQuantity: stockQuantity || 0,
      featured: featured === 'true' || featured === true,
      image: req.file ? `/uploads/${req.file.filename}` : req.body.image || '',
    });

    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to create product', error: err.message });
  }
});

/**
 * PUT /api/products/:id
 * Admin only — update a product.
 */
router.put('/:id', verifyToken, requireAdmin, upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image = `/uploads/${req.file.filename}`;
    if (updates.inStock !== undefined) updates.inStock = updates.inStock === 'true' || updates.inStock === true;
    if (updates.featured !== undefined) updates.featured = updates.featured === 'true' || updates.featured === true;

    const product = await Product.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Failed to update product', error: err.message });
  }
});

/**
 * DELETE /api/products/:id
 * Admin only.
 */
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete product', error: err.message });
  }
});

module.exports = router;
