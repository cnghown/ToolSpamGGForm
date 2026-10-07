import Papa from "papaparse";
import * as XLSX from "xlsx";

/**
 * Parses uploaded file and extracts structured columns and data arrays
 * @param {File} file 
 * @returns {Promise<{ fileName: string, columns: string[], columnData: Object, allValues: string[] }>}
 */
export async function parseDataFile(file) {
  const extension = file.name.split(".").pop().toLowerCase();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    if (extension === "txt") {
      reader.onload = (e) => {
        const text = e.target.result || "";
        const lines = text
          .split(/\r?\n/)
          .map(line => line.trim())
          .filter(line => line.length > 0);

        resolve({
          fileName: file.name,
          columns: ["Dữ liệu (Cột đơn)"],
          columnData: {
            "Dữ liệu (Cột đơn)": lines
          },
          allValues: lines
        });
      };
      reader.onerror = () => reject(new Error("Lỗi khi đọc file .txt"));
      reader.readAsText(file, "UTF-8");
    } else if (extension === "csv") {
      Papa.parse(file, {
        complete: (results) => {
          if (!results.data || !Array.isArray(results.data) || results.data.length === 0) {
            return reject(new Error("File CSV rỗng."));
          }

          const rawRows = results.data.filter(r => Array.isArray(r) && r.some(c => c !== null && c !== undefined && String(c).trim() !== ""));
          if (rawRows.length === 0) {
            return reject(new Error("File CSV không có dữ liệu."));
          }

          // Check if first row is header
          const firstRow = rawRows[0];
          const hasMultipleCols = firstRow.length > 1;

          const columns = firstRow.map((colName, colIdx) => String(colName || `Cột ${colIdx + 1}`).trim());
          const columnData = {};
          const allValues = [];

          columns.forEach(col => { columnData[col] = []; });

          // Start from row 1 (assuming row 0 is header if multiple columns, or row 0 if single)
          const startIdx = hasMultipleCols ? 1 : 0;

          for (let i = startIdx; i < rawRows.length; i++) {
            const row = rawRows[i];
            columns.forEach((colName, colIdx) => {
              const val = row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]).trim() : "";
              if (val) {
                columnData[colName].push(val);
                allValues.push(val);
              }
            });
          }

          resolve({
            fileName: file.name,
            columns,
            columnData,
            allValues
          });
        },
        error: (err) => reject(new Error(`Lỗi parse CSV: ${err.message}`))
      });
    } else if (extension === "json") {
      reader.onload = (e) => {
        try {
          const content = JSON.parse(e.target.result);
          const columns = [];
          const columnData = {};
          const allValues = [];

          if (Array.isArray(content)) {
            // Find all keys from array of objects
            content.forEach(item => {
              if (typeof item === "object" && item !== null) {
                Object.keys(item).forEach(k => {
                  if (!columns.includes(k)) columns.push(k);
                });
              }
            });

            if (columns.length === 0) {
              // Flat array of strings
              const lines = content.map(v => String(v).trim()).filter(Boolean);
              columns.push("Dữ liệu (Cột đơn)");
              columnData["Dữ liệu (Cột đơn)"] = lines;
              allValues.push(...lines);
            } else {
              columns.forEach(col => { columnData[col] = []; });
              content.forEach(item => {
                if (typeof item === "object" && item !== null) {
                  columns.forEach(col => {
                    const val = item[col] !== undefined && item[col] !== null ? String(item[col]).trim() : "";
                    if (val) {
                      columnData[col].push(val);
                      allValues.push(val);
                    }
                  });
                }
              });
            }
          } else if (typeof content === "object" && content !== null) {
            Object.keys(content).forEach(k => columns.push(k));
            columns.forEach(col => {
              const val = String(content[col]).trim();
              columnData[col] = [val];
              allValues.push(val);
            });
          }

          resolve({
            fileName: file.name,
            columns,
            columnData,
            allValues
          });
        } catch (err) {
          reject(new Error("Lỗi cấu trúc file JSON không hợp lệ."));
        }
      };
      reader.onerror = () => reject(new Error("Lỗi khi đọc file .json"));
      reader.readAsText(file, "UTF-8");
    } else if (["xlsx", "xls"].includes(extension)) {
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const rawRows = json.filter(r => Array.isArray(r) && r.some(c => c !== null && c !== undefined && String(c).trim() !== ""));
          if (rawRows.length === 0) {
            return reject(new Error("File Excel không có dữ liệu."));
          }

          const firstRow = rawRows[0];
          const hasMultipleCols = firstRow.length > 1;

          const columns = firstRow.map((colName, colIdx) => String(colName || `Cột ${colIdx + 1}`).trim());
          const columnData = {};
          const allValues = [];

          columns.forEach(col => { columnData[col] = []; });

          const startIdx = hasMultipleCols ? 1 : 0;

          for (let i = startIdx; i < rawRows.length; i++) {
            const row = rawRows[i];
            columns.forEach((colName, colIdx) => {
              const val = row[colIdx] !== undefined && row[colIdx] !== null ? String(row[colIdx]).trim() : "";
              if (val) {
                columnData[colName].push(val);
                allValues.push(val);
              }
            });
          }

          resolve({
            fileName: file.name,
            columns,
            columnData,
            allValues
          });
        } catch (err) {
          reject(new Error("Lỗi đọc file Excel (.xlsx/.xls)."));
        }
      };
      reader.onerror = () => reject(new Error("Lỗi đọc binary file Excel."));
      reader.readAsArrayBuffer(file);
    } else {
      reject(new Error(`Định dạng file .${extension} chưa được hỗ trợ.`));
    }
  });
}
