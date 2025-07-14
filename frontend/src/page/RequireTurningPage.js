import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import DownloadIcon from "@mui/icons-material/Download";
import Papa from "papaparse";

const API_URL = process.env.REACT_APP_API_URL;

export default function RequireTurningPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/generate-require-turning/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const jsonData = await response.json();
      setData(jsonData);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("ไม่สามารถโหลดข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "require_turning.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4, width: "100%", maxWidth: "1200px" }}>
        <Typography variant="h5" gutterBottom align="center">
          รายการ Require Turning
        </Typography>

        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<SyncIcon />}
            onClick={handleFetchData}
            disabled={loading}
            fullWidth
          >
            {loading ? "กำลังโหลด..." : "โหลดข้อมูล"}
          </Button>

          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportCSV}
            disabled={data.length === 0}
            fullWidth
          >
            ดาวน์โหลด CSV
          </Button>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {data.length > 0 ? (
          <TableContainer
            sx={{
              maxHeight: 500,
              overflowX: "auto",
            }}
          >
            <Table stickyHeader sx={{ minWidth: 2000 }}>
              <TableHead>
                <TableRow>
                  <TableCell>order_no</TableCell>
                  <TableCell>due_date</TableCell>
                  <TableCell>part_group</TableCell>
                  <TableCell>part_no_value</TableCell>
                  <TableCell>part_component_group</TableCell>
                  <TableCell>parent_part_no</TableCell>
                  <TableCell>require_turning</TableCell>
                  <TableCell>priority_group</TableCell>
                  <TableCell>wip_parent</TableCell>
                  <TableCell>Target Daily Issue</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.order_no}</TableCell>
                    <TableCell>{item.due_date}</TableCell>
                    <TableCell>{item.part_group}</TableCell>
                    <TableCell>{item.part_no_value}</TableCell>
                    <TableCell>{item.part_component_group}</TableCell>
                    <TableCell>{item.parent_part_no}</TableCell>
                    <TableCell>{item.require_turning ?? "-"}</TableCell>
                    <TableCell>{item.priority_group}</TableCell>
                    <TableCell>{item.wip_qty ?? "-"}</TableCell>
                    <TableCell>{item.target_daily_issue ?? "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          !loading && (
            <Alert severity="info">ไม่มีข้อมูล กรุณากดปุ่มโหลดข้อมูล</Alert>
          )
        )}
      </Paper>
    </Box>
  );
}
