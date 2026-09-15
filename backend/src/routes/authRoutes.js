import express from 'express';
import { login, getDemoAccounts } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.get('/demo-accounts', getDemoAccounts);

export default router;
