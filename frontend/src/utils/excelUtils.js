import * as XLSX from 'xlsx';

/**
 * Downloads the official institutional student onboarding template
 * Exactly conforms to the 4 required columns: 'File numbers', 'Name', 'Password', 'Points'
 */
export const downloadTemplate = () => {
  const sampleData = [
    {
      'File numbers': '241350',
      'Name': 'Aarav Sharma',
      'Password': '123',
      'Points': 500,
    },
    {
      'File numbers': '241351',
      'Name': 'Priya Verma',
      'Password': '123',
      'Points': 500,
    },
    {
      'File numbers': '241352',
      'Name': 'Rohan Das',
      'Password': '123',
      'Points': 500,
    },
    {
      'File numbers': '241353',
      'Name': 'Sneha Kulkarni',
      'Password': '123',
      'Points': 500,
    },
  ];

  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students_Template');

  // Adjust column widths for sleek readability
  worksheet['!cols'] = [
    { wch: 18 }, // File numbers
    { wch: 25 }, // Name
    { wch: 15 }, // Password
    { wch: 12 }, // Points
  ];

  // Trigger browser download
  XLSX.writeFile(workbook, 'template.xlsx');
};

/**
 * Parses an uploaded Excel file (.xlsx, .xls) and validates the 4 standard columns
 */
export const parseExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          return reject(new Error('The uploaded Excel workbook contains no readable sheets.'));
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (rawRows.length === 0) {
          return reject(new Error('The uploaded sheet is completely empty.'));
        }

        // Verify required columns exist
        const firstRow = rawRows[0];
        const keys = Object.keys(firstRow).map((k) => k.trim().toLowerCase());

        const hasFileNumber = keys.some((k) =>
          ['file numbers', 'file number', 'filenumber', 'id'].includes(k)
        );
        const hasName = keys.some((k) => ['name', 'student name', 'fullname'].includes(k));

        if (!hasFileNumber || !hasName) {
          return reject(
            new Error(
              'Missing required column headers! Template requires "File numbers" and "Name".'
            )
          );
        }

        const validStudents = [];
        const duplicateFileNumbers = [];
        const errors = [];
        const seenInFile = new Set();

        rawRows.forEach((row, idx) => {
          const rowNum = idx + 2; // account for header row

          // Case-insensitive key lookup helper
          const findVal = (possibleKeys) => {
            for (const key of Object.keys(row)) {
              if (possibleKeys.includes(key.trim().toLowerCase())) {
                return row[key];
              }
            }
            return '';
          };

          const rawFileNum = findVal(['file numbers', 'file number', 'filenumber', 'id']);
          const rawName = findVal(['name', 'student name', 'fullname']);
          const rawPassword = findVal(['password', 'pass']);
          const rawPoints = findVal(['points', 'point']);

          if (!rawFileNum || !rawFileNum.toString().trim()) {
            errors.push(`Row ${rowNum}: Missing "File numbers" value`);
            return;
          }
          if (!rawName || !rawName.toString().trim()) {
            errors.push(`Row ${rowNum}: Missing "Name" value`);
            return;
          }

          const fileNumber = rawFileNum.toString().trim();
          const name = rawName.toString().trim();
          const pointsNum = Number(rawPoints);
          const points = !isNaN(pointsNum) && pointsNum >= 0 ? pointsNum : 500;
          const password =
            rawPassword && rawPassword.toString().trim() ? rawPassword.toString().trim() : '123';

          if (seenInFile.has(fileNumber.toLowerCase())) {
            duplicateFileNumbers.push(fileNumber);
            return;
          }
          seenInFile.add(fileNumber.toLowerCase());

          validStudents.push({
            fileNumber,
            name,
            password,
            points,
          });
        });

        resolve({
          validStudents,
          duplicateFileNumbers,
          errors,
          totalRows: rawRows.length,
        });
      } catch (err) {
        reject(new Error(`Failed to parse Excel file: ${err.message}`));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file from disk.'));
    reader.readAsArrayBuffer(file);
  });
};
