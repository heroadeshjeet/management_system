import express from 'express';
import { getLogs } from '../controllers/blackboxController.js';

const router = express.Router();

router.get('/logs', getLogs);

export default router;
