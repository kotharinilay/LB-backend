import { Router } from 'express';
import AuthController from '../controllers/AuthController';
import { isValid } from '../shared/util';
import {login} from '../shared/contracts'

// Init shared
const router = Router();


/******************************************************************************
 *                      Login - "GET /api/v1/login"
 ******************************************************************************/

router.post('/login', isValid(login), AuthController.login);

/******************************************************************************
 *                                     Export
 ******************************************************************************/

export default router;
