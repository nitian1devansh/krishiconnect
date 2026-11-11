import { Router } from 'express';
import prisma from '../db/prisma';
import { authenticate } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// Submit a new soil test analysis
router.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      sampleName,
      soilType,
      phLevel,
      nitrogenLevel,
      phosphorusLevel,
      potassiumLevel,
      organicCarbon,
      reportFileUrl,
      recommendations,
    } = req.body;

    if (!sampleName || !soilType || phLevel === undefined) {
      throw new AppError('Sample name, soil type, and pH level are required.', 400);
    }

    // Find farmer profile if exists
    const farmerProfile = await prisma.farmerProfile.findUnique({
      where: { userId: req.user!.id },
    });

    const report = await prisma.soilTestReport.create({
      data: {
        userId: req.user!.id,
        farmerProfileId: farmerProfile?.id,
        sampleName,
        soilType,
        phLevel: Number(phLevel),
        nitrogenLevel: Number(nitrogenLevel || 0),
        phosphorusLevel: Number(phosphorusLevel || 0),
        potassiumLevel: Number(potassiumLevel || 0),
        organicCarbon: organicCarbon !== undefined ? Number(organicCarbon) : null,
        reportFileUrl,
        recommendations: typeof recommendations === 'object' ? JSON.stringify(recommendations) : recommendations,
        status: 'COMPLETED',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Soil test report saved successfully.',
      data: report,
    });
  } catch (err) {
    next(err);
  }
});

// Get user's soil test history
router.get('/', authenticate, async (req, res, next) => {
  try {
    const reports = await prisma.soilTestReport.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: reports,
    });
  } catch (err) {
    next(err);
  }
});

// Get single soil test
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const report = await prisma.soilTestReport.findUnique({
      where: { id: req.params.id },
    });

    if (!report) {
      throw new AppError('Soil test report not found.', 404);
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

