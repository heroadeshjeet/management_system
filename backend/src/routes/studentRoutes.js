import express from 'express';
import {
  bulkImportStudents,
  getStudents,
  updateStudentPoints,
  getStudentDashboard,
} from '../controllers/studentController.js';

const router = express.Router();

router.post('/bulk-import', bulkImportStudents);
router.get('/', getStudents);
router.get('/:id/dashboard', getStudentDashboard);
router.patch('/:id/points', updateStudentPoints);

export default router;

