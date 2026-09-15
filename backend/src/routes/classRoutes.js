import express from 'express';
import { createClass, getClasses, getClassById } from '../controllers/classController.js';

const router = express.Router();

router.post('/', createClass);
router.get('/', getClasses);
router.get('/:id', getClassById);

export default router;
