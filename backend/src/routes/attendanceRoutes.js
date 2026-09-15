import express from 'express';
import { saveAttendance, getAttendance } from '../controllers/attendanceController.js';

const router = express.Router();

router.post('/', saveAttendance);
router.get('/:classId/:date', getAttendance);

export default router;
