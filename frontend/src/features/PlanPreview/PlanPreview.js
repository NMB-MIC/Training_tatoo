// src/features/PreviewPlan/PreviewPlanPage.js
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
} from "@mui/material";

const apiBase = process.env.REACT_APP_API_URL;

const adjustItems = [
  { label: "WORKING DAY", topic: "workingDate", templateVersion: "v.0.0.1" },
  { label: "CAPACITY", topic: "toolLimitAndCapa", templateVersion: "v.0.0.1" },
];

export default function PreviewPlanPage() {
  // ========== state ==========
  const [fileMap, setFileMap] = useState({});
  const [monthOptions, setMonthOptions] = useState([]);          // <-- เปลี่ยนเป็น state
  const [selectedMonth, setSelectedMonth] = useState("");        // <-- เริ่มว่าง รอโหลดจาก API
  const [planType, setPlanType] = useState(""); // FIRST PLAN | REPLAN
  const [planMode, setPlanMode] = useState("clear_pass_due");
  const [clearPassPercent, setClearPassPercent] = useState(100);
  const [productionTargetPercent, setProductionTargetPercent] = useState(100);

  const [workingDays, setWorkingDays] = useState(0);

  const [autoDaily, setAutoDaily] = useState(0);
  const [manualDaily, setManualDaily] = useState(0);
  const autoMonthly = useMemo(() => autoDaily * workingDays, [autoDaily, workingDays]);
  const manualMonthly = useMemo(() => manualDaily * workingDays, [manualDaily, workingDays]);

  // ---------- load months from API ----------
  const loadMonths = async () => {
    try {
      const url = `${apiBase}/data_management/balanceOrderMidSmall/`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("balanceOrderMidSmall fetch failed");
      const data = await res.json();

      // ดึง targetPlanMonth, ทำให้เป็น 'YYYY-MM', ไม่ซ้ำ และเรียงล่าสุดก่อน
      const uniq = Array.from(
        new Set(
          (Array.isArray(data) ? data : [])
            .map((r) => (r?.targetPlanMonth ?? "").toString())
            .filter(Boolean)
            .map((s) => s.slice(0, 7)) // กันกรณีเป็น 'YYYY-MM-DD'
        )
      ).sort((a, b) => b.localeCompare(a)); // desc

      setMonthOptions(uniq);
      if (!selectedMonth && uniq.length) setSelectedMonth(uniq[0]);
    } catch (e) {
      console.error("loadMonths error:", e);
      setMonthOptions([]);
      setSelectedMonth("");
    }
  };

  useEffect(() => {
    loadMonths();
  }, []);

  const handleFileChange = (topic, file) => {
    setFileMap((prev) => ({
      ...prev,
      [topic]: { file, filename: file.name },
    }));
  };

  const handleUpload = async (topic) => {
    const picked = fileMap[topic];
    if (!picked?.file) {
      alert(`Please select file for ${topic}`);
      return;
    }
    const fd = new FormData();
    fd.append("file", picked.file);
    if (selectedMonth) fd.append("targetPlanMonth", selectedMonth);

    try {
      const res = await fetch(`${apiBase}/data_management/${topic}/upload/`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Upload ${topic} failed`);
      }
      const out = await res.json();
      alert(`✅ ${topic}: ${out.status || "uploaded"}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload failed");
    }
  };

  const handleDownloadTemplate = (topic) => {
    alert(`(demo) download template for ${topic}`);
  };

  const fetchWorkingDays = async (ym) => {
    try {
      const res = await fetch(
        `${apiBase}/data_management/workingDate/?targetPlanMonth=${encodeURIComponent(ym)}`
      );
      if (!res.ok) throw new Error("workingDate fetch failed");
      const data = await res.json();
      setWorkingDays(Array.isArray(data) ? data.length : 0);
    } catch (e) {
      console.warn("workingDate fetch error:", e.message);
      setWorkingDays(0);
    }
  };

  const fetchKpiProduction = async () => {
    const tryUrls = [
      `${apiBase}/data_management/kpiProduction/`,
      `${apiBase}/data_management/kpi_production/`,
    ];
    for (const url of tryUrls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          const r0 = rows[0];
          setAutoDaily(Number(r0.autoMachineDailyTarget || 0));
          setManualDaily(Number(r0.manualDailyTarget || 0));
          return;
        }
      } catch {}
    }
    setAutoDaily(0);
    setManualDaily(0);
  };

  useEffect(() => {
    if (selectedMonth) {
      fetchWorkingDays(selectedMonth);
    }
  }, [selectedMonth]);

  useEffect(() => {
    fetchKpiProduction();
  }, []);

  const handleCreatePlan = async () => {
    const fd = new FormData();
    fd.append("month", selectedMonth || "");
    fd.append("planType", planType || "");
    fd.append("planMode", planMode);
    fd.append("clearPassPercent", String(clearPassPercent || 0));
    fd.append("productionTargetPercent", String(productionTargetPercent || 0));
    fd.append("workingDays", String(workingDays || 0));
    fd.append("autoDaily", String(autoDaily || 0));
    fd.append("manualDaily", String(manualDaily || 0));
    fd.append("autoMonthly", String(autoMonthly || 0));
    fd.append("manualMonthly", String(manualMonthly || 0));

    try {
      const res = await fetch(`${apiBase}/data_management/create_plan/upload/`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Create plan failed");
      }
      const out = await res.json();
      alert("✅ Created plan");
      console.log("create plan result:", out);
    } catch (e) {
      console.error(e);
      alert("❌ " + e.message);
    }
  };

  // ========== UI ==========
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
        PREVIEW PLAN PAGE
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography fontWeight="bold" gutterBottom>
          PARAMETER ADJUSTING LIST
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>TOPICS</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>TEMPLATE</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>TEMPLATE VERSION</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>FILE</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>UPLOAD</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adjustItems.map((it) => (
              <TableRow key={it.topic}>
                <TableCell>{it.label}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => handleDownloadTemplate(it.topic)}>
                    [download]
                  </Button>
                </TableCell>
                <TableCell>{it.templateVersion}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    component="label"
                    sx={{ textTransform: "none", color: "blue" }}
                  >
                    {fileMap[it.topic]?.filename || "[file]"}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileChange(it.topic, f);
                      }}
                    />
                  </Button>
                </TableCell>
                <TableCell>
                  <Button
                    size="small"
                    onClick={() => handleUpload(it.topic)}
                    disabled={!fileMap[it.topic]?.file}
                  >
                    [upload]
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* PLAN TYPE / PLAN MODE */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          <Box>
            <Typography fontWeight="bold" gutterBottom>
              PLAN TYPE
            </Typography>
            <Select
              size="small"
              value={planType}
              onChange={(e) => setPlanType(e.target.value)}
              displayEmpty
              sx={{ width: 200 }}
            >
              <MenuItem value="">
                <em>Select</em>
              </MenuItem>
              <MenuItem value="FIRST PLAN">FIRST PLAN</MenuItem>
              <MenuItem value="REPLAN">REPLAN</MenuItem>
            </Select>
          </Box>

          <Box>
            <Typography fontWeight="bold" gutterBottom>
              PLAN MODE LOGIC
            </Typography>
            <RadioGroup value={planMode} onChange={(e) => setPlanMode(e.target.value)}>
              <FormControlLabel value="clear_pass_due" control={<Radio />} label="Clear pass due" />
              <FormControlLabel value="production_target" control={<Radio />} label="Production target" />
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <FormControlLabel
                  value="custom_clear_pass_due"
                  control={<Radio />}
                  label="Custom %Clear pass due"
                />
                <TextField
                  size="small"
                  type="number"
                  value={clearPassPercent}
                  onChange={(e) => setClearPassPercent(Number(e.target.value))}
                  sx={{ width: 90 }}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                <FormControlLabel
                  value="custom_production_target"
                  control={<Radio />}
                  label="Custom %Production target"
                />
                <TextField
                  size="small"
                  type="number"
                  value={productionTargetPercent}
                  onChange={(e) => setProductionTargetPercent(Number(e.target.value))}
                  sx={{ width: 90 }}
                  inputProps={{ min: 0, max: 100 }}
                />
              </Box>
            </RadioGroup>
          </Box>

          <Box>
            <Typography fontWeight="bold" gutterBottom>
              MONTH
            </Typography>
            <Select
              size="small"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              sx={{ width: 160 }}
              displayEmpty
            >
              {monthOptions.length === 0 ? (
                <MenuItem value="">
                  <em>No data</em>
                </MenuItem>
              ) : (
                monthOptions.map((m) => (
                  <MenuItem key={m} value={m}>
                    {m}
                  </MenuItem>
                ))
              )}
            </Select>
          </Box>
        </Box>
      </Paper>

      <Box>
        <Button variant="contained" onClick={handleCreatePlan} disabled={!selectedMonth}>
          CREATE PLAN
        </Button>
      </Box>
    </Box>
  );
}
