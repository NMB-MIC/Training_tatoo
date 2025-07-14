import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import Papa from "papaparse"; // ✅ ใช้สำหรับอ่าน CSV

const API_URL = process.env.REACT_APP_API_URL;

export default function CheckParentPartPage() {
  const [parentPartNo, setParentPartNo] = useState("");
  const [result, setResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // ตรวจสอบจาก input
  const handleCheck = async () => {
    if (!parentPartNo.trim()) {
      setErrorMsg("กรุณากรอก Parent Part No");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setResult([]);

    try {
      const res = await fetch(`${API_URL}/check-parent-data/?parent_part_no=${encodeURIComponent(parentPartNo)}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "ไม่สามารถดึงข้อมูลได้");
      }
      const data = await res.json();
      setResult([{ parent_part_no: parentPartNo, data }]);
    } catch (error) {
      console.error("Error:", error);
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ตรวจสอบจากไฟล์ CSV
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setErrorMsg("");
    setResult([]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const parentNos = results.data.map((row) => row.parent_part_no).filter(Boolean);
        const finalResults = [];

        for (let pNo of parentNos) {
          try {
            const res = await fetch(`${API_URL}/check-parent-data/?parent_part_no=${encodeURIComponent(pNo)}`);
            if (!res.ok) {
              const data = await res.json();
              finalResults.push({ parent_part_no: pNo, error: data.detail || "ไม่สามารถดึงข้อมูลได้" });
            } else {
              const data = await res.json();
              finalResults.push({ parent_part_no: pNo, data });
            }
          } catch (err) {
            finalResults.push({ parent_part_no: pNo, error: err.message });
          }
        }

        setResult(finalResults);
        setLoading(false);
      },
      error: (err) => {
        console.error("CSV Parse error:", err);
        setErrorMsg("เกิดข้อผิดพลาดในการอ่านไฟล์ CSV");
        setLoading(false);
      },
    });
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4, width: "650px" }}>
        <Typography variant="h5" gutterBottom align="center">
          ตรวจสอบ Parent Part No
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Parent Part No"
            variant="outlined"
            value={parentPartNo}
            onChange={(e) => setParentPartNo(e.target.value)}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleCheck}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "ตรวจสอบ (กรอกด้วยมือ)"}
          </Button>

          <Button
            variant="contained"
            component="label"
            color="secondary"
            startIcon={<UploadFileIcon />}
            disabled={loading}
          >
            อัปโหลดไฟล์ CSV
            <input type="file" hidden accept=".csv" onChange={handleFileChange} />
          </Button>

          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

          {result.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                ✅ ผลลัพธ์
              </Typography>
              <Box sx={{ maxHeight: 400, overflow: "auto", background: "#f5f5f5", p: 2, borderRadius: "4px" }}>
                {result.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: "bold" }}>Parent Part No: {item.parent_part_no}</Typography>
                    {item.error ? (
                      <Alert severity="error">{item.error}</Alert>
                    ) : (
                      <pre>{JSON.stringify(item.data, null, 2)}</pre>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
