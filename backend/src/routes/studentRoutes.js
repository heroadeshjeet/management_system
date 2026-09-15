import express from 'express';
import {
  bulkImportStudents,
  getStudents,
  updateStudentPoints,
} from '../controllers/studentController.js';

const router = express.Router();

router.post('/bulk-import', bulkImportStudents);
router.get('/', getStudents);
router.patch('/:id/points', updateStudentPoints);

export default router;
