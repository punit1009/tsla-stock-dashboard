const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Helper function to find file in parent directories
const findFileInParents = (filename, startDir = __dirname) => {
  const fullPath = path.join(startDir, filename);
  if (fs.existsSync(fullPath)) return fullPath;
  
  const parentDir = path.dirname(startDir);
  if (parentDir === startDir) return null;
  
  return findFileInParents(filename, parentDir);
};

// Paths
const excelFileName = 'TSLA_data.xlsx';
const excelFilePath = findFileInParents(excelFileName) || path.join(__dirname, '..', excelFileName);
const outputDir = path.join(__dirname, 'data');
const outputFilePath = path.join(outputDir, 'stock-data.json');

console.log('Looking for Excel file at:', excelFilePath);

if (!fs.existsSync(excelFilePath)) {
  console.error(`Error: Could not find ${excelFileName} in any parent directory`);
  console.log('Current working directory:', process.cwd());
  console.log('Directory contents:', fs.readdirSync(path.dirname(excelFilePath)));
  process.exit(1);
}

// Create data directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`Created output directory: ${outputDir}`);
}

try {
  console.log(`Reading Excel file from: ${excelFilePath}`);
  
  // Read the Excel file
  const workbook = XLSX.readFile(excelFilePath);
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`Found ${jsonData.length} records in the Excel file`);
  
  // Save as JSON
  fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
  
  console.log(`Successfully converted and saved to: ${outputFilePath}`);
  console.log('First record:', JSON.stringify(jsonData[0], null, 2));
  
} catch (error) {
  console.error('Error converting Excel to JSON:', error);
  process.exit(1);
}
