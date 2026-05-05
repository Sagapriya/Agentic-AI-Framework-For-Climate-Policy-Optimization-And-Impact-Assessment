import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { Globe, Activity, Zap, Users, Play, Download, CheckCircle2, Bot, Leaf, Thermometer, PieChart, AlertTriangle, Route, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  rl: '#10b981',        // Pure Emerald
  moderate: '#3b82f6',  // Blue
  aggressive: '#f43f5e',// Coral
  no_policy: '#64748b'  // Slate
};

function App() {
  const [tax, setTax] = useState(10.0);
  const [subsidy, setSubsidy] = useState(10.0);
  const [mode, setMode] = useState("Manual Policy");
  const [crisisMode, setCrisisMode] = useState(false);
  const [useRoadmap, setUseRoadmap] = useState(false);
  
  // Default simple roadmap — Phase 1: moderate, Phase 2: aggressive
  const [policyStages, setPolicyStages] = useState([
    { year_start: 0, year_end: 19, carbon_tax: 15.0, renewable_subsidy: 20.0 },
    { year_start: 20, year_end: 49, carbon_tax: 35.0, renewable_subsidy: 40.0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  // Dynamic Background Effect
  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    document.body.style.setProperty('--mouse-x', `${clientX}px`);
    document.body.style.setProperty('--mouse-y', `${clientY}px`);
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const response = await fetch('/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          carbon_tax: tax,
          renewable_subsidy: subsidy,
          mode: mode,
          crisis_mode: crisisMode,
          roadmap: useRoadmap ? policyStages : null
        }),
      });
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Simulation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const transformTimeSeries = (data) => {
    if (!data) return [];

    const timeSteps = data.time_series.rl.emissions.length;
    const formatted = [];

    for (let i = 0; i < timeSteps; i++) {
      formatted.push({
        step: i,
        rl_emissions: data.time_series.rl.emissions[i],
        mod_emissions: data.time_series.moderate.emissions[i],
        agg_emissions: data.time_series.aggressive.emissions[i],
        no_emissions: data.time_series.no_policy.emissions[i],

        rl_rewards: data.time_series.rl.rewards[i],
        mod_rewards: data.time_series.moderate.rewards[i],
        agg_rewards: data.time_series.aggressive.rewards[i],
        no_rewards: data.time_series.no_policy.rewards[i],

        rl_gdp: data.time_series.rl.gdp[i],
        mod_gdp: data.time_series.moderate.gdp[i],
        agg_gdp: data.time_series.aggressive.gdp[i],
        no_gdp: data.time_series.no_policy.gdp[i],

        rl_ren: data.time_series.rl.renewable_share[i],
        mod_ren: data.time_series.moderate.renewable_share[i],
        agg_ren: data.time_series.aggressive.renewable_share[i],
        no_ren: data.time_series.no_policy.renewable_share[i],

        rl_acc: data.time_series.rl.acceptance[i],
        mod_acc: data.time_series.moderate.acceptance[i],
        agg_acc: data.time_series.aggressive.acceptance[i],
        no_acc: data.time_series.no_policy.acceptance[i],

        // New Features
        rl_temp: data.time_series.rl.temp_rise[i],
        sec_energy: data.time_series.sectors?.Energy[i] || 0,
        sec_industry: data.time_series.sectors?.Industry[i] || 0,
        sec_transport: data.time_series.sectors?.Transport[i] || 0,
        sec_agri: data.time_series.sectors?.Agriculture[i] || 0,
      });
    }
    return formatted;
  };

  const transformSensitivity = (data) => {
    if (!data) return [];
    return data.sensitivity.tax_values.map((tax, i) => ({
      tax: tax.toFixed(1),
      emission: data.sensitivity.final_emissions[i]
    }));
  };

  const handleDownloadReport = () => {
    if (!results) return;

    try {
      const doc = new jsPDF();
      
      // Keep track of Y position
      let currentY = 20;

      // Header / Title (Formal Academic Style)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(0, 0, 0); // Strict Black
      doc.text('Agentic AI Framework For Climate Policy Optimization And Impact Assessment', 105, currentY, { align: 'center' });
      
      currentY += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, currentY, { align: 'center' });
      
      currentY += 15;

      // Section 1: Parameters
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('1. Simulation Parameters', 14, currentY);
      
      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Selected Policy Mode: ${mode}`, 14, currentY);
      doc.text(`Tested Carbon Tax: $${tax.toFixed(2)}`, 110, currentY);
      currentY += 5;
      doc.text(`Tested Renewable Subsidy: $${subsidy.toFixed(2)}`, 110, currentY);
      
      currentY += 10;

      // Section 2: Executive Summary
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text('2. Executive Summary Metrics', 14, currentY);
      
      currentY += 4;
      autoTable(doc, {
        startY: currentY,
        head: [['Metric', 'Initial Baseline', 'Final Outcome', 'Percentage']],
        body: [
          ['Total Emissions', `${results.metrics.initial_emission.toFixed(2)}`, `${results.metrics.final_emission.toFixed(2)}`, `-${results.metrics.emission_reduction_pct.toFixed(1)}%`],
          ['National GDP ($)', '-', `$${results.metrics.final_gdp.toFixed(0)}`, '-'],
          ['Renewable Energy Share', '-', `${(results.metrics.final_renewable_share * 100).toFixed(1)}%`, '-'],
          ['Public Acceptance Index', '-', `${results.metrics.final_acceptance.toFixed(2)}`, '-']
        ],
        theme: 'grid',
        headStyles: { fillColor: [40, 40, 40], textColor: [255, 255, 255], fontStyle: 'bold' },
        styles: { fontSize: 10, cellPadding: 4 }
      });
      
      currentY = doc.lastAutoTable.finalY + 15;

      // Section 3: Comparative Analysis
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text('3. Comparative Policy Analytics', 14, currentY);
      
      currentY += 4;
      const mainPolicyName = mode === "Trained RL Policy (Auto)" ? "AI Policy (RL)" : "Current Manual Policy";
      autoTable(doc, {
        startY: currentY,
        head: [['Policy Strategy', 'Final Emission', 'Final GDP', 'Ren. Share', 'Public Acceptance']],
        body: [
          [mainPolicyName, results.metrics.final_emission.toFixed(2), `$${results.metrics.final_gdp.toFixed(0)}`, `${(results.metrics.final_renewable_share * 100).toFixed(1)}%`, results.metrics.final_acceptance.toFixed(2)],
          ['Moderate Static Baseline', results.time_series.moderate.emissions[49]?.toFixed(2), `$${results.time_series.moderate.gdp[49]?.toFixed(0)}`, `${(results.time_series.moderate.renewable_share[49] * 100).toFixed(1)}%`, results.time_series.moderate.acceptance[49]?.toFixed(2)],
          ['Aggressive Static Baseline', results.time_series.aggressive.emissions[49]?.toFixed(2), `$${results.time_series.aggressive.gdp[49]?.toFixed(0)}`, `${(results.time_series.aggressive.renewable_share[49] * 100).toFixed(1)}%`, results.time_series.aggressive.acceptance[49]?.toFixed(2)],
          ['Do-Nothing Protocol', results.time_series.no_policy.emissions[49]?.toFixed(2), `$${results.time_series.no_policy.gdp[49]?.toFixed(0)}`, `${(results.time_series.no_policy.renewable_share[49] * 100).toFixed(1)}%`, results.time_series.no_policy.acceptance[49]?.toFixed(2)]
        ],
        theme: 'striped',
        headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 4 }
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // Recommendations Mini-Table
      autoTable(doc, {
        startY: currentY,
        head: [['Machine Learning Policy Recommendations', 'Target Value']],
        body: [
          ['Recommended Carbon Tax Setpoint', `$${results.recommendation.tax.toFixed(2)}`],
          ['Recommended Renewable Subsidy Setpoint', `$${results.recommendation.subsidy.toFixed(2)}`]
        ],
        theme: 'plain',
        headStyles: { fontStyle: 'bold', fontSize: 11, textColor: [0, 0, 0] },
        bodyStyles: { fontStyle: 'italic', textColor: [50, 50, 50] },
        tableLineColor: [0, 0, 0],
        tableLineWidth: 0.5,
      });

      currentY = doc.lastAutoTable.finalY + 15;

      // Section 4: AI Insights Paragraph
      if (results.ai_insights) {
        if (currentY > 230) {
          doc.addPage();
          currentY = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('4. Detailed AI Diagnostic Narrative', 14, currentY);
        
        currentY += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        
        // Sanitize LLM unicode (quotes, dashes, emojis) so it does not corrupt the jsPDF build
        let cleanInsights = results.ai_insights
          .replace(/[\u2018\u2019]/g, "'") // smart single quotes
          .replace(/[\u201C\u201D]/g, '"') // smart double quotes
          .replace(/[\u2013\u2014]/g, '-') // em/en dashes
          .replace(/[\u2026]/g, '...') // ellipses
          .replace(/\*/g, '') // remove markdown bold stars
          .replace(/[^\x00-\x7F]/g, ''); // strip remaining non-ASCII
          
        const splitInsights = doc.splitTextToSize(cleanInsights, 180); 
        doc.text(splitInsights, 14, currentY);
      }

      // Safe Blob Download Method
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Climate_Analytics_Report.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error("PDF Generate Error:", err);
      alert("Failed to generate PDF: " + err.message);
    }
  };

  const handleDownloadCSV = () => {
    if (!results) return;
    
    const data = transformTimeSeries(results);
    if (!data || data.length === 0) return;

    // Extract headers
    const headers = Object.keys(data[0]);
    
    // Create CSV rows
    const csvRows = [];
    csvRows.push(headers.join(','));
    
    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        return isNaN(val) ? `"${val}"` : val;
      });
      csvRows.push(values.join(','));
    }
    
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Climate_Simulation_Data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const addRoadmapStage = () => {
    const lastStage = policyStages[policyStages.length - 1];
    if (!lastStage || lastStage.year_end >= 49) return;

    // Shrink last stage to make room, then add new stage
    const splitPoint = Math.floor((lastStage.year_start + lastStage.year_end) / 2) + 1;
    const updatedLast = { ...lastStage, year_end: splitPoint - 1 };
    const newStage = {
      year_start: splitPoint,
      year_end: 49,
      carbon_tax: Math.min(100, (lastStage.carbon_tax || 10) + 10),
      renewable_subsidy: Math.min(100, (lastStage.renewable_subsidy || 10) + 10)
    };

    const updated = [...policyStages];
    updated[updated.length - 1] = updatedLast;
    setPolicyStages([...updated, newStage]);
  };

  const updateRoadmapStage = (index, field, value) => {
    const newStages = [...policyStages];
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return;
    newStages[index] = { ...newStages[index], [field]: parsed };
    setPolicyStages(newStages);
  };

  const removeRoadmapStage = (index) => {
    if (policyStages.length <= 1) return; // Keep at least one stage
    const newStages = policyStages.filter((_, i) => i !== index);
    // Fix last stage to always end at year 49
    newStages[newStages.length - 1] = { ...newStages[newStages.length - 1], year_end: 49 };
    setPolicyStages(newStages);
  };


  const chartData = transformTimeSeries(results);
  const sensitivityData = transformSensitivity(results);

  const mainPolicyName = mode === "Trained RL Policy (Auto)" ? "RL Policy" : "Manual Policy";

  return (
    <div className="app-container" onMouseMove={handleMouseMove}>
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="logo-section">
          <div className="logo-container">
            <img src="/logo.png" alt="Climate AI" className="sidebar-logo" />
          </div>
          <h2>EcoPolicy AI</h2>
        </div>

        <div className="control-group">
          <label className="control-label">
            Policy Mode
          </label>
          <div className="radio-group">
            <label className="radio-label">
              <input
                type="radio"
                name="mode"
                value="Manual Policy"
                checked={mode === "Manual Policy"}
                onChange={(e) => setMode(e.target.value)}
              />
              Manual Policy
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="mode"
                value="Trained RL Policy (Auto)"
                checked={mode === "Trained RL Policy (Auto)"}
                onChange={(e) => setMode(e.target.value)}
              />
              Trained RL Policy (Auto)
            </label>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            Carbon Tax Level <span className="value">{tax}</span>
          </label>
          <input
            type="range"
            className="slider-input"
            min="0" max="50" step="0.5"
            value={tax}
            onChange={(e) => setTax(parseFloat(e.target.value))}
            disabled={mode === "Trained RL Policy (Auto)" || useRoadmap}
          />
        </div>

        <div className="control-group">
          <label className="control-label">
            Renewable Subsidy Level <span className="value">{subsidy}</span>
          </label>
          <input
            type="range"
            className="slider-input"
            min="0" max="50" step="0.5"
            value={subsidy}
            onChange={(e) => setSubsidy(parseFloat(e.target.value))}
            disabled={mode === "Trained RL Policy (Auto)" || useRoadmap}
          />
        </div>

        {/* Crisis Mode Control */}
        <div className="control-group" style={{ gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Advanced Options</label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer', padding: '0.6rem', borderRadius: '8px', background: crisisMode ? 'rgba(244,63,94,0.1)' : 'rgba(255,255,255,0.02)', border: crisisMode ? '1px solid rgba(244,63,94,0.4)' : '1px solid transparent', transition: 'all 0.2s' }}>
            <input
              type="checkbox"
              checked={crisisMode}
              onChange={(e) => setCrisisMode(e.target.checked)}
              style={{ accentColor: '#f43f5e', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: crisisMode ? '#f43f5e' : 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                <AlertTriangle size={14} /> Crisis Mode
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                Simulates random emission spikes (+20%) and GDP crashes from climate disasters every step.
              </div>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: mode === 'Trained RL Policy (Auto)' ? 'not-allowed' : 'pointer', padding: '0.6rem', borderRadius: '8px', background: useRoadmap ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.02)', border: useRoadmap ? '1px solid rgba(16,185,129,0.4)' : '1px solid transparent', transition: 'all 0.2s', opacity: mode === 'Trained RL Policy (Auto)' ? 0.5 : 1 }}>
            <input
              type="checkbox"
              checked={useRoadmap}
              onChange={(e) => setUseRoadmap(e.target.checked)}
              disabled={mode === 'Trained RL Policy (Auto)'}
              style={{ accentColor: 'var(--accent-primary)', width: '16px', height: '16px', marginTop: '2px', flexShrink: 0 }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: useRoadmap ? 'var(--accent-primary)' : 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                <Route size={14} /> Policy Roadmap
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', lineHeight: '1.4' }}>
                Define staged tax & subsidy targets across custom year ranges instead of a fixed value.
              </div>
            </div>
          </label>
        </div>

        {/* Roadmap Builder UI */}
        {useRoadmap && mode !== 'Trained RL Policy (Auto)' && (
          <div style={{ padding: '1rem', backgroundColor: 'rgba(16,185,129,0.05)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Route size={13} /> Policy Roadmap Stages
              </h4>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Total: {policyStages.reduce((s, st) => s + (st.year_end - st.year_start + 1), 0)} yrs</span>
            </div>

            {/* Visual Timeline */}
            <div style={{ display: 'flex', gap: '2px', height: '8px', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px', background: 'var(--bg-primary)' }}>
              {policyStages.map((stage, idx) => {
                const span = Math.max(0, stage.year_end - stage.year_start + 1);
                const hue = 140 + idx * 40;
                return <div key={idx} style={{ flex: span, background: `hsl(${hue}, 60%, 45%)`, minWidth: span > 0 ? '4px' : 0 }} title={`Stage ${idx+1}: Yr ${stage.year_start}–${stage.year_end}`} />;
              })}
            </div>

            {policyStages.map((stage, idx) => (
              <div key={idx} style={{ marginBottom: '10px', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>Stage {idx + 1}</span>
                  {policyStages.length > 1 && (
                    <button onClick={() => removeRoadmapStage(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', minWidth: '28px' }}>Year</span>
                  <input type="number" min="0" max="49" value={stage.year_start}
                    onChange={(e) => updateRoadmapStage(idx, 'year_start', e.target.value)}
                    style={{ width: '45%', padding: '3px 5px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>→</span>
                  <input type="number" min="1" max="50" value={stage.year_end}
                    onChange={(e) => updateRoadmapStage(idx, 'year_end', e.target.value)}
                    style={{ width: '45%', padding: '3px 5px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.8rem' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Tax ($/ton)</div>
                    <input type="number" min="0" max="100" value={stage.carbon_tax}
                      onChange={(e) => updateRoadmapStage(idx, 'carbon_tax', e.target.value)}
                      style={{ width: '100%', padding: '3px 5px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--accent-primary)', fontWeight: 600, fontSize: '0.85rem' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '2px' }}>Subsidy ($B)</div>
                    <input type="number" min="0" max="100" value={stage.renewable_subsidy}
                      onChange={(e) => updateRoadmapStage(idx, 'renewable_subsidy', e.target.value)}
                      style={{ width: '100%', padding: '3px 5px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--accent-secondary)', fontWeight: 600, fontSize: '0.85rem' }} />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addRoadmapStage}
              style={{ width: '100%', padding: '6px', marginTop: '4px', backgroundColor: 'rgba(16,185,129,0.08)', border: '1px dashed rgba(16,185,129,0.3)', borderRadius: '6px', color: 'var(--accent-primary)', cursor: policyStages[policyStages.length-1]?.year_end >= 49 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.82rem', opacity: policyStages[policyStages.length-1]?.year_end >= 49 ? 0.4 : 1 }}
              disabled={policyStages[policyStages.length-1]?.year_end >= 49}>
              <Plus size={13} /> Add Stage
            </button>
          </div>
        )}

        <button
          className="btn-run"
          onClick={runSimulation}
          disabled={loading}
        >
          {loading ? <Activity className="spinner" /> : <Play />}
          Run Simulation
        </button>

        {results && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn-download" onClick={handleDownloadReport} style={{ width: '100%' }}>
              <Download size={18} />
              Download Report
            </button>
            <button className="btn-download" onClick={handleDownloadCSV} style={{ width: '100%', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
              <FileSpreadsheet size={18} />
              Export Data (CSV)
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main id="dashboard-content" className="main-content">
        <div className="header">
          <h1>Agentic AI Framework For Climate Policy Optimization And Impact Assessment</h1>
          <p>Optimize carbon tax and renewable subsidy using Multi-Agent Reinforcement Learning.</p>
        </div>

        {loading && (
          <div className="loading-container">
            <Activity className="spinner" size={48} color="var(--accent-primary)" />
            <h2>Simulating the next 50 years of climate policy...</h2>
          </div>
        )}

        {!loading && !results && (
          <div className="loading-container" style={{ opacity: 0.5 }}>
            <Bot size={64} />
            <h2>Configure parameters and hit Run Simulation to see results.</h2>
          </div>
        )}

        {!loading && results && (
          <>
            {/* Active Mode Banner */}
            {(crisisMode || useRoadmap) && (
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                {crisisMode && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.4)', fontSize: '0.82rem', fontWeight: 600, color: '#f43f5e' }}>
                    <AlertTriangle size={13} /> Crisis Mode Active — results include random disaster shocks
                  </div>
                )}
                {useRoadmap && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '999px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                    <Route size={13} /> Policy Roadmap Active — {policyStages.length} stage{policyStages.length > 1 ? 's' : ''} applied
                  </div>
                )}
              </div>
            )}

            <div className="metrics-row">
              <div className="metric-card">
                <div className="metric-value">{results.metrics.emission_reduction_pct.toFixed(1)}%</div>
                <div className="metric-label">Emission Reduction</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">${(results.metrics.final_gdp / 1e9).toFixed(1)}B</div>
                <div className="metric-label">Final GDP</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{(results.metrics.final_renewable_share * 100).toFixed(1)}%</div>
                <div className="metric-label">Renewable Share</div>
              </div>
              <div className="metric-card">
                <div className="metric-value">{results.metrics.final_acceptance.toFixed(2)}</div>
                <div className="metric-label">Public Acceptance</div>
              </div>
            </div>

            <div className="recommendation-box">
              <h3><Bot size={20} /> AI Policy Recommendation</h3>
              <p>
                <strong>Recommended Carbon Tax:</strong> {results.recommendation.tax.toFixed(2)} <span style={{ margin: '0 8px', color: 'var(--border-color)' }}>|</span>
                <strong>Recommended Renewable Subsidy:</strong> {results.recommendation.subsidy.toFixed(2)}
              </p>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                Expected Outcomes: Final Emission {results.metrics.final_emission.toFixed(2)} | Final GDP ${results.metrics.final_gdp.toFixed(0)} | Renewable Share {(results.metrics.final_renewable_share * 100).toFixed(1)}% | Acceptance {results.metrics.final_acceptance.toFixed(2)}
              </p>
            </div>

            {results.ai_insights && (
              <div className="recommendation-box" style={{ marginTop: '1rem' }}>
                <h3><Bot size={20} /> AI Insights</h3>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', wordBreak: 'break-word', overflowWrap: 'break-word' }}>
                  {results.ai_insights
                    .split('\n')
                    .filter(line => line.trim() !== '')
                    .map((line, lineIdx) => (
                      <p key={lineIdx} style={{ marginBottom: '0.5rem', lineHeight: '1.7' }}>
                        {line.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                          part.startsWith('**') && part.endsWith('**')
                            ? <strong key={i} style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{part.slice(2, -2)}</strong>
                            : <span key={i}>{part}</span>
                        )}
                      </p>
                    ))}
                </div>
              </div>
            )}

            <div className="dashboard-grid">
              {/* Emissions Chart */}
              <div className="card">
                <h3 className="card-title"><Leaf size={18} /> Emissions Comparison</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="step" stroke="var(--text-secondary)" />
                      <YAxis stroke="var(--text-secondary)" />
                      <Tooltip contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px', backdropFilter: 'blur(10px)' }} />
                      <Legend />
                      <Line type="monotone" dataKey="rl_emissions" name={mainPolicyName} stroke={COLORS.rl} strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="mod_emissions" name="Moderate" stroke={COLORS.moderate} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="agg_emissions" name="Aggressive" stroke={COLORS.aggressive} strokeDasharray="3 3" dot={false} />
                      <Line type="monotone" dataKey="no_emissions" name="No Policy" stroke={COLORS.no_policy} strokeDasharray="2 2" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Reward Chart */}
              <div className="card">
                <h3 className="card-title"><Activity size={18} /> Reward Comparison</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="step" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                      <Legend />
                      <Line type="monotone" dataKey="rl_rewards" name={mainPolicyName} stroke={COLORS.rl} strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="mod_rewards" name="Moderate" stroke={COLORS.moderate} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="agg_rewards" name="Aggressive" stroke={COLORS.aggressive} strokeDasharray="3 3" dot={false} />
                      <Line type="monotone" dataKey="no_rewards" name="No Policy" stroke={COLORS.no_policy} strokeDasharray="2 2" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* GDP Chart */}
              <div className="card">
                <h3 className="card-title"><Zap size={18} /> GDP Comparison</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="step" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                      <Legend />
                      <Line type="monotone" dataKey="rl_gdp" name={mainPolicyName} stroke={COLORS.rl} strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="mod_gdp" name="Moderate" stroke={COLORS.moderate} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="agg_gdp" name="Aggressive" stroke={COLORS.aggressive} strokeDasharray="3 3" dot={false} />
                      <Line type="monotone" dataKey="no_gdp" name="No Policy" stroke={COLORS.no_policy} strokeDasharray="2 2" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Acceptance Chart */}
              <div className="card">
                <h3 className="card-title"><Users size={18} /> Public Acceptance</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="step" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                      <Legend />
                      <Line type="monotone" dataKey="rl_acc" name={mainPolicyName} stroke={COLORS.rl} strokeWidth={3} dot={false} />
                      <Line type="monotone" dataKey="mod_acc" name="Moderate" stroke={COLORS.moderate} strokeDasharray="5 5" dot={false} />
                      <Line type="monotone" dataKey="agg_acc" name="Aggressive" stroke={COLORS.aggressive} strokeDasharray="3 3" dot={false} />
                      <Line type="monotone" dataKey="no_acc" name="No Policy" stroke={COLORS.no_policy} strokeDasharray="2 2" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Temperature Rise Chart (New) */}
              <div className="card">
                <h3 className="card-title"><Thermometer size={18} color="#f97316" /> Temperature Rise (°C)</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="step" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" domain={['dataMin', 'dataMax + 0.5']} />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                      <Legend />
                      <Line type="monotone" dataKey="rl_temp" name="Projected Temp Rise" stroke="#f97316" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sectoral Breakdown (New) */}
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <h3 className="card-title"><PieChart size={18} color="#a855f7" /> Sectoral Emissions Breakdown</h3>
                <div style={{ width: '100%', height: 350 }}>
                  <ResponsiveContainer>
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="step" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                      <Legend />
                      <Area type="monotone" dataKey="sec_energy" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Energy Sector" />
                      <Area type="monotone" dataKey="sec_industry" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Industry Sector" />
                      <Area type="monotone" dataKey="sec_transport" stackId="1" stroke="#ec4899" fill="#ec4899" name="Transport Sector" />
                      <Area type="monotone" dataKey="sec_agri" stackId="1" stroke="#10b981" fill="#10b981" name="Agriculture Sector" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sensitivity Analysis */}
              <div className="card">
                <h3 className="card-title"><Leaf size={18} /> Sensitivity: Tax vs Final Emission</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <LineChart data={sensitivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="tax" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                      <Line type="monotone" dataKey="emission" name="Final Emission" stroke={COLORS.rl} strokeWidth={2} dot={{ fill: COLORS.rl, strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title"><CheckCircle2 size={18} /> Experimental Comparison</h3>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Policy</th>
                      <th>Final Emission</th>
                      <th>Final GDP</th>
                      <th>Ren. Share (%)</th>
                      <th>Acceptance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{mainPolicyName}</td>
                      <td>{results.metrics.final_emission.toFixed(2)}</td>
                      <td>{results.metrics.final_gdp.toFixed(0)}</td>
                      <td>{(results.metrics.final_renewable_share * 100).toFixed(1)}</td>
                      <td>{results.metrics.final_acceptance.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td>Moderate Static (5,5)</td>
                      <td>{results.time_series.moderate.emissions[49]?.toFixed(2) || 0}</td>
                      <td>{results.time_series.moderate.gdp[49]?.toFixed(0) || 0}</td>
                      <td>{(results.time_series.moderate.renewable_share[49] * 100 || 0).toFixed(1)}</td>
                      <td>{results.time_series.moderate.acceptance[49]?.toFixed(2) || 0}</td>
                    </tr>
                    <tr>
                      <td>Aggressive Static (25,25)</td>
                      <td>{results.time_series.aggressive.emissions[49]?.toFixed(2) || 0}</td>
                      <td>{results.time_series.aggressive.gdp[49]?.toFixed(0) || 0}</td>
                      <td>{(results.time_series.aggressive.renewable_share[49] * 100 || 0).toFixed(1)}</td>
                      <td>{results.time_series.aggressive.acceptance[49]?.toFixed(2) || 0}</td>
                    </tr>
                    <tr>
                      <td>No Policy (0,0)</td>
                      <td>{results.time_series.no_policy.emissions[49]?.toFixed(2) || 0}</td>
                      <td>{results.time_series.no_policy.gdp[49]?.toFixed(0) || 0}</td>
                      <td>{(results.time_series.no_policy.renewable_share[49] * 100 || 0).toFixed(1)}</td>
                      <td>{results.time_series.no_policy.acceptance[49]?.toFixed(2) || 0}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
