import { Router } from 'express';
import AuthRouter from './auth';
import { Request, Response } from 'express';

// Init router and path
const router = Router();

// Add sub-routes
router.use('/v1/auth', AuthRouter);

router.get('/health', async (req: Request, res: Response) => {
    res.send();
});

// Export the base-router
export default router;
