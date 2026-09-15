import express from 'express';
import { submitMarks, getMarksByNotification } from '../controllers/testController.js';

const router = express.Router();

router.post('/marks', submitMarks);
router.get('/marks/:notificationId', getMarksByNotification);

export default router;
