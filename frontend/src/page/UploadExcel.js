import React, { useState } from "react";
import {
  Box, Button, Typography, Paper, LinearProgress
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
const API_URL = process.env.REACT_APP_API_URL;

export default function UploadMultiFileRow() {
  const [files, setFiles] = useState({
    bom: null,
    machine: null,
    parentFixRunMc: null,
    bar: null,
    targetDailyIssue: null,
    capacity: null,
    ringreceive: null,
    partflange: null,
    partto2nd: null,
    processcount: null,
    partyield: null,
    turnover: null,
    balanceordermidsmall: null,
    balanceordermcb: null,
    workingdate: null,
    wip: null, // ✅ เพิ่ม wip
  });

  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const endpoints = {
    bom: "/bom_wos",
    machine: "/upload_machine/",
    parentFixRunMc: "/upload_fix_run_machine/",
    bar: "/upload_bar/",
    targetDailyIssue: "/upload_target_daily_issue/",
    capacity: "/upload_capacity/",
    ringreceive: "/upload_ring_receive/",
    partflange: "/upload_part_flange/",
    partto2nd: "/upload_part_to_2nd/",
    processcount: "/upload_process_count/",
    partyield: "/upload_part_yield/",
    turnover: "/upload_turnover/",
    balanceordermidsmall: "/upload_balance_order_mid_small/",
    balanceordermcb: "/upload_balance_order_mcb/",
    workingdate: "/upload_working_date/",
    wip: "/upload_wip/", // ✅ เพิ่ม endpoint
  };

  const handleFileChange = (e, key) => {
    const file = e.target.files[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [key]: file }));
    }
  };

  const handleUpload = async () => {
    setProgress(5);
    setMessage("");

    try {
      const keysToUpload = Object.keys(files).filter(key => files[key]);

      if (keysToUpload.length === 0) {
        setMessage("❌ กรุณาเลือกไฟล์อย่างน้อย 1 ไฟล์");
        setProgress(0);
        return;
      }

      for (let i = 0; i < keysToUpload.length; i++) {
        const key = keysToUpload[i];
        const formData = new FormData();
        formData.append("file", files[key]);

        const res = await fetch(`${API_URL}${endpoints[key]}`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || `Upload ${key} failed`);
        }
        await res.json();

        const currentProgress = Math.round(((i + 1) / keysToUpload.length) * 100);
        setProgress(currentProgress);
      }

      setMessage(`✅ อัปโหลดไฟล์สำเร็จ!`);
      setTimeout(() => setProgress(0), 1500);
    } catch (error) {
      console.error("Upload failed:", error);
      setProgress(0);
      setMessage(`❌ อัปโหลดล้มเหลว: ${error.message}`);
    }
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4, width: "600px" }}>
        <Typography variant="h4" gutterBottom align="center">
          อัปโหลดไฟล์
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <FileUploadRow label="ไฟล์ bom_wos" file={files.bom} keyName="bom" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ machine" file={files.machine} keyName="machine" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ parent_fix_run_mc" file={files.parentFixRunMc} keyName="parentFixRunMc" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ bar" file={files.bar} keyName="bar" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ target_daily_issue" file={files.targetDailyIssue} keyName="targetDailyIssue" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ capacity" file={files.capacity} keyName="capacity" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ ring_receive" file={files.ringreceive} keyName="ringreceive" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ part_flange" file={files.partflange} keyName="partflange" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ part_to_2nd" file={files.partto2nd} keyName="partto2nd" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ process_count" file={files.processcount} keyName="processcount" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ part_yield" file={files.partyield} keyName="partyield" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ turnover" file={files.turnover} keyName="turnover" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ balance_order_mid_small" file={files.balanceordermidsmall} keyName="balanceordermidsmall" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ balance_order_mcb" file={files.balanceordermcb} keyName="balanceordermcb" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ working_date" file={files.workingdate} keyName="workingdate" onChange={handleFileChange} />
          <FileUploadRow label="ไฟล์ wip" file={files.wip} keyName="wip" onChange={handleFileChange} /> {/* ✅ เพิ่มช่อง */}
        </Box>

        <Button
          variant="contained"
          color="success"
          sx={{ mt: 3 }}
          onClick={handleUpload}
        >
          ส่งไฟล์ที่เลือก
        </Button>

        {progress > 0 && (
          <Box sx={{ mt: 3 }}>
            <LinearProgress variant="determinate" value={progress} />
            <Typography sx={{ mt: 1, whiteSpace: "pre-line" }}>{message}</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

function FileUploadRow({ label, file, keyName, onChange }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Typography>{label} {file && `: ${file.name}`}</Typography>
      <Button variant="contained" component="label" startIcon={<UploadFileIcon />}>
        เลือกไฟล์
        <input type="file" hidden accept=".xlsx, .xls, .csv" onChange={(e) => onChange(e, keyName)} />
      </Button>
    </Box>
  );
}
