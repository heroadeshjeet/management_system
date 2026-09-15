import express from 'express';
import { bulkImportStudents, getStudents } from '../controllers/studentController.js';

const router = express.Router();

router.post('/bulk-import', bulkImportStudents);
router.get('/', getStudents);

export default router;
