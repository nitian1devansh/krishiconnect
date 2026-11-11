import { Router } from 'express';
import { CatalogService } from '../services/catalog.service';

const router = Router();

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await CatalogService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

router.get('/products', async (req, res, next) => {
  try {
    const filters = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 12,
      category: req.query.category as string,
      search: req.query.search as string,
      crop: req.query.crop as string,
      organicOnly: req.query.organic === 'true',
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      sortBy: req.query.sortBy as any,
      vendorId: req.query.vendorId as string,
    };

    const result = await CatalogService.getProducts(filters);
    res.json({ success: true, data: result.products, pagination: result.pagination });
  } catch (err) {
    next(err);
  }
});

router.get('/products/:slug', async (req, res, next) => {
  try {
    const product = await CatalogService.getProductBySlug(req.params.slug);
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

router.get('/storefront/:storeSlug', async (req, res, next) => {
  try {
    const storefront = await CatalogService.getVendorStorefront(req.params.storeSlug);
    res.json({ success: true, data: storefront });
  } catch (err) {
    next(err);
  }
});

export default router;

