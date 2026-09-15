import express from 'express';
import { getTeachers, addTeacher, removeTeacher } from '../controllers/adminController.js';

const router = express.Router();

router.get('/teachers', getTeachers);
router.post('/teachers', addTeacher);
router.delete('/teachers/:id', removeTeacher);

export default router;
