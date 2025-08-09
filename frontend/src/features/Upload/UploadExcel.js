import React, { useState, useEffect  } from "react";
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
  InputLabel,
  FormControl,
  Toolbar,
} from "@mui/material";

//MASTER
const masterItems = [
  { topic: "bomWos" },
  { topic: "machineGroup" },
  { topic: "machineLayout" },
  { topic: "toolLimitAndCapa" },
  { topic: "fac1" },
  { topic: "fac3" },
  { topic: "sleeveAndThrustBrg" },
];

//BY MONTH
const monthItems = [
  {topic: "balanceOrderMidSmall" },
  {topic: "machineNotAvailable" },
  {topic: "productionPlan" },
  {topic: "kpiSetup" },
  {topic: "kpiProduction" },
  {topic: "workingDate" },
];

export default function UploadPlanningPage() {
  const [activeTab, setActiveTab] = useState("MASTER");
  const [searchTopic, setSearchTopic] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedMonthTopic, setSelectedMonthTopic] = useState("");
  const [fileMap, setFileMap] = useState({});
  const [showData, setShowData] = useState([]);

  const handleFileChange = (topic, file) => {
    setFileMap((prev) => ({
      ...prev,
      [topic]: { file, filename: file.name },
    }));
  };

  const handleUpload = async (topic) => {
    const selected = fileMap[topic];

    const formData = new FormData();
    formData.append("file", selected.file);

    let response;

    try {
      const endpoint = `/data_management/${topic}/upload/`;

      response = await fetch(
        `${process.env.REACT_APP_API_URL}${endpoint}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Upload failed");
      }

      const result = await response.json();
      alert("✅ Success: " + result.status);
      } catch (error) {
        console.error("❌ Upload error:", error);
        alert(error.message || "Something went wrong");
      }
  };

  useEffect(() => {
    const fetchTopicData = async () => {
      if (!searchTopic) {
        setShowData([]); // เคลียร์ถ้าไม่เลือก
        return;
      }

      try {
        const res = await fetch(`${process.env.REACT_APP_API_URL}/data_management/${searchTopic}/`);
        if (!res.ok) throw new Error(`Failed to fetch ${searchTopic} data`);
        const data = await res.json();
        setShowData(data);
      } catch (err) {
        console.error("Fetch error:", err);
        setShowData([]);
      }
    };

    fetchTopicData();
  }, [searchTopic]);

  const handleMonthUpload = async () => {
    console.log("📂 Files to Upload:");

    const incompleteTopics = monthItems.filter(
      (item) => !fileMap[item.topic]?.file
    );

    if (incompleteTopics.length > 0) {
      alert("❌ Please upload all required files before submitting.");
      console.log("❌ Missing files:", incompleteTopics.map((i) => i.topic));
      return;
    }

    const formData = new FormData();

    for (const item of monthItems) {
      const file = fileMap[item.topic].file;
      formData.append(item.topic, file);
      console.log(`✅ Appended ${item.topic}:`, file.name);
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/data_management/monthy/upload/`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Upload failed");
      }

      const result = await response.json();
      console.log("✅ Upload success:", result);
      alert("✅ Upload success");
    } catch (error) {
      console.error("❌ Upload error:", error.message);
      alert("❌ Upload failed: " + error.message);
    }
  };



  return (
    <Box sx={{ p: 4 }}>
      <Toolbar />
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold", mb: 1 }}>
        UPLOAD PLANNING DATA PAGE
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Typography
          onClick={() => {
            setActiveTab("BY_MONTH");
            setSearchTopic("");   
            setShowData([]); 
          }}          sx={{
            cursor: "pointer",
            fontWeight: activeTab === "BY_MONTH" ? "bold" : "normal",
            borderBottom: activeTab === "BY_MONTH" ? "2px solid black" : "none",
          }}
        >
          BY MONTH
        </Typography>
        <Typography
          onClick={() => {
            setActiveTab("MASTER");
            setSelectedMonth("");
            setSelectedMonthTopic("");
          }}
          sx={{
            cursor: "pointer",
            fontWeight: activeTab === "MASTER" ? "bold" : "normal",
            borderBottom: activeTab === "MASTER" ? "2px solid black" : "none",
          }}
        >
          MASTER
        </Typography>
      </Box>

      {/* --- MASTER --- */}
      {activeTab === "MASTER" && (
        <>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography fontWeight="bold" mb={1}>
              MASTER PLANNING DATA LIST
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>TOPICS</TableCell>
                  <TableCell>TEMPLATE</TableCell>
                  <TableCell>TEMPLATE VERSION</TableCell>
                  <TableCell>FILE</TableCell>
                  <TableCell>UPLOAD</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {masterItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.topic}</TableCell>
                    <TableCell>
                      <Button size="small">[download]</Button>
                    </TableCell>
                    <TableCell>v.0.0.1</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        component="label"
                        sx={{ textTransform: "none", color: "blue" }}
                      >
                        {fileMap[item.topic]?.filename || "[file]"}
                        <input
                          type="file"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleFileChange(item.topic, file);
                          }}
                        />
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => handleUpload(item.topic)}
                        disabled={!fileMap[item.topic]?.file}
                      >
                        [upload]
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>

          <Box mt={3}>
            <Typography fontWeight="bold">FIND&SEARCH</Typography>
            <FormControl size="small" sx={{ mt: 1, width: 250 }}>
              <InputLabel>TOPICS</InputLabel>
              <Select
                value={searchTopic}
                label="TOPICS"
                onChange={(e) => setSearchTopic(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select</em>
                </MenuItem>
                {masterItems.map((item, idx) => (
                  <MenuItem key={idx} value={item.topic}>
                    {item.topic}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </>
      )}


      {/* --- BY MONTH --- */}
      {activeTab === "BY_MONTH" && (
        <>
          <Paper elevation={3} sx={{ p: 2 }}>
            <Typography fontWeight="bold" mb={1}>
              PLANNING DATA BY MONTH LIST
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>TOPICS</TableCell>
                  <TableCell>TEMPLATE</TableCell>
                  <TableCell>TEMPLATE VERSION</TableCell>
                  <TableCell>FILE</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {monthItems.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{item.topic}</TableCell>
                    <TableCell>
                      <Button size="small">[download]</Button>
                    </TableCell>
                    <TableCell>v.0.0.1</TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        component="label"
                        sx={{ textTransform: "none", color: "blue" }}
                      >
                        {fileMap[item.topic]?.filename || "[file]"}
                        <input
                          type="file"
                          hidden
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleFileChange(item.topic, file);
                          }}
                        />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" size="medium" sx={{ px: 4 }} onClick={handleMonthUpload}>
                upload
              </Button>
            </Box>
          </Paper>

          <Box mt={3}>
            <Typography fontWeight="bold">FIND&SEARCH</Typography>

            <Box mt={1}>
              <Typography sx={{ mb: 0.5 }}>MONTH</Typography>
              <Select
                size="small"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                displayEmpty
                sx={{ width: 200 }}
              >
                <MenuItem value="">SELECT</MenuItem>
                <MenuItem value="2025-10">2025-10</MenuItem>
              </Select>
            </Box>

            <Box mt={2}>
              <Typography sx={{ mb: 0.5 }}>TOPICS</Typography>
              <Select
                size="small"
                value={selectedMonthTopic}
                onChange={(e) => {
                  const apiKey = e.target.value;
                  setSelectedMonthTopic(apiKey);
                  setSearchTopic(apiKey); 
                }}
                displayEmpty
                sx={{ width: 250 }}
              >
                <MenuItem value="">Select</MenuItem>
                {monthItems.map((item, i) => (
                  <MenuItem key={i} value={item.topic}>
                    {item.topic}
                  </MenuItem>
                ))}
              </Select>
            </Box>
          </Box>
        </>
      )}
      {showData.length > 0 && (
        <Box mt={2}>
          <Typography fontWeight="bold" mb={1}>
            DATA FOR: {searchTopic.toUpperCase()}
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                {Object.keys(showData[0]).map((key, idx) => (
                  <TableCell key={idx}>{key}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {showData.map((row, i) => (
                <TableRow key={i}>
                  {Object.values(row).map((val, j) => (
                    <TableCell key={j}>{val}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
