import React, { useState } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
} from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";

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

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
      <Paper elevation={4} sx={{ p: 4, width: "650px" }}>
        <Typography variant="h5" gutterBottom align="center">
          รายการ Require Turning
        </Typography>

        <Button
          variant="contained"
          startIcon={<SyncIcon />}
          onClick={handleFetchData}
          disabled={loading}
          sx={{ mb: 2 }}
          fullWidth
        >
          {loading ? "กำลังโหลด..." : "โหลดข้อมูล"}
        </Button>

        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {data.length > 0 ? (
          <Box
            sx={{
              maxHeight: 400,
              overflowY: "auto",
              background: "#f5f5f5",
              p: 2,
              borderRadius: "4px",
            }}
          >
            {data.map((item, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  p: 1.5,
                  background: "#ffffff",
                  borderRadius: "4px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                }}
              >
                <Typography sx={{ fontWeight: "bold" }}>
                  Parent Part No: {item.parent_part_no}
                </Typography>
                <Typography>Part No: {item.part_no_value}</Typography>
                <Typography>Balance Order: {item.balance_order}</Typography>
                <Typography>WIP Qty: {item.wip_qty ?? "-"}</Typography>
                <Typography>
                  Target Daily Issue: {item.target_daily_issue ?? "-"}
                </Typography>
                <Typography>Source: {item.source}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          !loading && (
            <Alert severity="info">ไม่มีข้อมูล กรุณากดปุ่มโหลดข้อมูล</Alert>
          )
        )}
      </Paper>
    </Box>
  );
}
