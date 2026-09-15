import express from 'express';
import { sendNotification, getNotifications, getNotificationById } from '../controllers/notificationController.js';

const router = express.Router();

router.post('/send', sendNotification);
router.get('/', getNotifications);
router.get('/:id', getNotificationById);

export default router;

