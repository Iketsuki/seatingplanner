import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Monitor, 
  LayoutGrid, 
  ArrowDownUp, 
  Save, 
  Upload, 
  GripVertical, 
  Trash2, 
  Grid3X3,
  Layers,
  Printer,
  X,
  Image as ImageIcon,
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  ZoomIn,
  ZoomOut,
  Shuffle,
  ArrowRight,
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Settings2,
  User
} from 'lucide-react';

// --- Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
    {children}
  </div>
);

const Button = ({ onClick, children, variant = "primary", className = "", ...props }) => {
  const baseStyle = "px-3 py-1.5 md:px-4 md:py-2 rounded-md font-medium text-xs md:text-sm transition-colors flex items-center gap-2 justify-center";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300",
    outline: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50",
    danger: "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100",
    success: "bg-green-600 text-white hover:bg-green-700",
  };
  return (
    <button onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

// --- Main Application ---

export default function SeatingPlanner() {
  // --- State ---
  
  // Grid Configuration
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(6);
  const [clusterSize, setClusterSize] = useState(2); 
  
  // Data
  const [students, setStudents] = useState([]); 
  const [placements, setPlacements] = useState({}); 
  
  // UI State
  const [viewMode, setViewMode] = useState('teacher'); 
  const [inputText, setInputText] = useState("");
  const [importTier, setImportTier] = useState(1); 
  const [importGender, setImportGender] = useState('none'); // 'M', 'F', 'none'
  const [draggedItem, setDraggedItem] = useState(null); 
  const [zoom, setZoom] = useState(1);
  
  // Mixing State (Target count per tier per group)
  // Indices 1-6 map to Tiers 1-6. Values are { min: 0, max: 99 }
  const [mixTargets, setMixTargets] = useState({
    1: { min: 0, max: 99 },
    2: { min: 0, max: 99 },
    3: { min: 0, max: 99 },
    4: { min: 0, max: 99 },
    5: { min: 0, max: 99 },
    6: { min: 0, max: 99 },
  });

  // Delete Confirmation State
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const clearTimerRef = useRef(null);

  // Ref for the grid container to capture image
  const scrollContainerRef = useRef(null); // The scrolling window
  const contentRef = useRef(null); // The scalable content inside

  // --- Effects ---

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // --- Helpers ---

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleBulkImport = () => {
    const lines = inputText.split('\n').filter(line => line.trim() !== '');
    const newStudents = lines.map(name => ({
      id: generateId(),
      name: name.trim(),
      tier: importTier,
      gender: importGender === 'none' ? null : importGender
    }));
    
    setStudents(prev => [...prev, ...newStudents]);
    setInputText("");
  };

  const sortRoster = (type) => {
    const unseated = students.filter(s => !Object.values(placements).includes(s.id));
    const seated = students.filter(s => Object.values(placements).includes(s.id));
    
    let sortedUnseated = [...unseated];
    if (type === 'name') {
      sortedUnseated.sort((a, b) => a.name.localeCompare(b.name));
    } else if (type === 'tier') {
      sortedUnseated.sort((a, b) => a.tier - b.tier);
    }
    
    setStudents([...seated, ...sortedUnseated]);
  };

  // --- Fill Strategies ---

  // Fill Row by Row
  const autoFillRows = (direction = 'front-to-back') => {
    const newPlacements = {};
    const unseated = students.filter(s => !Object.values(placements).includes(s.id));
    const seated = students.filter(s => Object.values(placements).includes(s.id));
    
    let currentStudentIdx = 0;
    const allStudentsToSeat = [...seated, ...unseated]; 

    // Determine loop order
    // Front is Row 0 (closest to blackboard). Back is Row rows-1.
    const startRow = direction === 'front-to-back' ? 0 : rows - 1;
    const endRow = direction === 'front-to-back' ? rows : -1;
    const step = direction === 'front-to-back' ? 1 : -1;

    for (let r = startRow; r !== endRow; r += step) {
      for (let c = 0; c < cols; c++) {
        if (currentStudentIdx < allStudentsToSeat.length) {
          newPlacements[`${r}-${c}`] = allStudentsToSeat[currentStudentIdx].id;
          currentStudentIdx++;
        }
      }
    }
    setPlacements(newPlacements);
  };

  // Fill Column by Column
  const autoFillCols = (direction = 'left-to-right') => {
    const newPlacements = {};
    const unseated = students.filter(s => !Object.values(placements).includes(s.id));
    const seated = students.filter(s => Object.values(placements).includes(s.id));
    
    let currentStudentIdx = 0;
    const allStudentsToSeat = [...seated, ...unseated]; 

    const startCol = direction === 'left-to-right' ? 0 : cols - 1;
    const endCol = direction === 'left-to-right' ? cols : -1;
    const step = direction === 'left-to-right' ? 1 : -1;

    for (let c = startCol; c !== endCol; c += step) {
      for (let r = 0; r < rows; r++) {
        if (currentStudentIdx < allStudentsToSeat.length) {
          newPlacements[`${r}-${c}`] = allStudentsToSeat[currentStudentIdx].id;
          currentStudentIdx++;
        }
      }
    }
    setPlacements(newPlacements);
  };

  // Sort Entire Class
  const smartFillSeq = (direction) => {
    const sorted = [...students].sort((a, b) => {
       return direction === 'asc' ? a.tier - b.tier : b.tier - a.tier;
    });

    const newPlacements = {};
    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (idx < sorted.length) {
          newPlacements[`${r}-${c}`] = sorted[idx].id;
          idx++;
        }
      }
    }
    setPlacements(newPlacements);
  };

  // Group Composition Fill
  const smartFillGroupMix = () => {
    const newPlacements = {};
    
    // 1. Bucket students by Tier
    const buckets = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    students.forEach(s => {
        if(buckets[s.tier]) buckets[s.tier].push(s);
        else buckets[1].push(s); // Fallback
    });

    // 2. Identify Groups (Clusters)
    const groups = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c += clusterSize) {
            const seatsInGroup = [];
            for (let k = 0; k < clusterSize; k++) {
                if (c + k < cols) seatsInGroup.push(`${r}-${c + k}`);
            }
            groups.push(seatsInGroup);
        }
    }

    // 3. Fill Groups
    groups.forEach(groupSeats => {
        const studentsForGroup = [];
        const tiersInGroup = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

        // STEP A: Fulfill MINIMUMS
        [1, 2, 3, 4, 5, 6].forEach(tier => {
            const min = mixTargets[tier]?.min || 0;
            for(let i=0; i<min; i++) {
                if (buckets[tier].length > 0) {
                    studentsForGroup.push(buckets[tier].shift());
                    tiersInGroup[tier]++;
                }
            }
        });

        // STEP B: Fill remaining spots respecting MAXIMUMS
        // We prioritize filling with lower Tiers (1, 2...) first, or could be random. 
        // Let's iterate available tiers to fill remaining.
        const remainingSpots = groupSeats.length - studentsForGroup.length;
        
        for(let i=0; i<remainingSpots; i++) {
            let found = false;
            for(let t=1; t<=6; t++) {
                const max = (mixTargets[t]?.max === undefined || mixTargets[t]?.max === 0) ? 99 : mixTargets[t].max;
                
                // If we have students of this tier AND haven't hit max for this group
                if (buckets[t].length > 0 && tiersInGroup[t] < max) {
                    studentsForGroup.push(buckets[t].shift());
                    tiersInGroup[t]++;
                    found = true;
                    break;
                }
            }
            if(!found) {
                // Last ditch: If constraints prevent filling, just fill with whoever is left regardless of max?
                // Or leave empty. Let's try to fill with anyone left if possible, ignoring max to ensure seats are used.
                // Strict mode would leave empty. Let's stick to strict max for now.
                break; 
            }
        }

        // Assign to seats
        studentsForGroup.forEach((student, idx) => {
            if (groupSeats[idx]) {
                newPlacements[groupSeats[idx]] = student.id;
            }
        });
    });

    setPlacements(newPlacements);
  };

  const clearBoard = () => setPlacements({});

  const handleResetAllClick = () => {
    if (confirmClearAll) {
      setStudents([]);
      setPlacements({});
      setConfirmClearAll(false);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    } else {
      setConfirmClearAll(true);
      clearTimerRef.current = setTimeout(() => setConfirmClearAll(false), 3000);
    }
  };

  const deleteStudent = (studentId) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    const newPlacements = { ...placements };
    const seatId = Object.keys(newPlacements).find(k => newPlacements[k] === studentId);
    if (seatId) {
      delete newPlacements[seatId];
      setPlacements(newPlacements);
    }
  };

  // --- Drag & Drop ---

  const handleDragStart = (e, type, id, source) => {
    setDraggedItem({ type, id, source });
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetLocation) => { 
    e.preventDefault();
    const draggedId = draggedItem.id;
    if (!draggedId) return;

    const newPlacements = { ...placements };
    const oldKey = Object.keys(newPlacements).find(key => newPlacements[key] === draggedId);
    if (oldKey) delete newPlacements[oldKey];

    if (targetLocation !== 'list') {
      if (newPlacements[targetLocation]) {
        const displacedStudentId = newPlacements[targetLocation];
        if (oldKey) newPlacements[oldKey] = displacedStudentId;
      }
      newPlacements[targetLocation] = draggedId;
    }
    setPlacements(newPlacements);
    setDraggedItem(null);
  };

  // --- Export ---

  const exportData = () => {
    const data = {
      config: { rows, cols, clusterSize },
      students,
      placements
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'seating-plan.json';
    a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if(data.config) {
          setRows(data.config.rows);
          setCols(data.config.cols);
          setClusterSize(data.config.clusterSize);
        }
        if(data.students) setStudents(data.students);
        if(data.placements) setPlacements(data.placements);
      } catch (err) {
        console.error("Invalid file");
      }
    };
    reader.readAsText(file);
  };

  const handlePrint = () => window.print();

  const handleExportImage = async () => {
    if (typeof window.html2canvas === 'undefined') {
      alert("Image generation library is still loading, please try again in a moment.");
      return;
    }
    
    if (scrollContainerRef.current) {
      const originalOverflow = scrollContainerRef.current.style.overflow;
      
      scrollContainerRef.current.style.overflow = 'visible';
      scrollContainerRef.current.style.height = 'auto'; 
      scrollContainerRef.current.classList.remove('overflow-auto');

      await new Promise(resolve => setTimeout(resolve, 150));

      try {
        const canvas = await window.html2canvas(scrollContainerRef.current, {
            scale: 2, 
            backgroundColor: "#f1f5f9",
            useCORS: true,
            logging: false,
            windowHeight: scrollContainerRef.current.scrollHeight,
            height: scrollContainerRef.current.scrollHeight
        });
        
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = 'seating-plan.png';
        link.href = image;
        link.click();
      } catch (e) {
        console.error("Image export failed", e);
        alert("Failed to generate image.");
      } finally {
        scrollContainerRef.current.style.overflow = originalOverflow;
        scrollContainerRef.current.style.height = '';
        scrollContainerRef.current.classList.add('overflow-auto');
      }
    }
  };

  // --- View Helpers ---

  const unseatedStudents = students.filter(s => !Object.values(placements).includes(s.id));

  const displayRows = Array.from({ length: rows }, (_, i) => i);
  if (viewMode === 'teacher') {
    displayRows.reverse();
  }

  const getTierColor = (tier) => {
    switch(tier) {
      case 1: return "bg-green-50 text-green-800";
      case 2: return "bg-yellow-50 text-yellow-800";
      case 3: return "bg-red-50 text-red-800";
      case 4: return "bg-blue-50 text-blue-800";
      case 5: return "bg-purple-50 text-purple-800";
      case 6: return "bg-orange-50 text-orange-800";
      default: return "bg-gray-50 text-gray-800";
    }
  };

  // Border color based on gender
  const getGenderBorderClass = (gender) => {
    if (gender === 'M') return "border-sky-300"; // Pastel Blue
    if (gender === 'F') return "border-pink-300"; // Pastel Pink
    return "border-slate-200"; // Default
  };

  const getTierLabelColor = (tier) => {
    switch(tier) {
        case 1: return "bg-green-100 text-green-800 border-green-200";
        case 2: return "bg-yellow-100 text-yellow-800 border-yellow-200";
        case 3: return "bg-red-100 text-red-800 border-red-200";
        case 4: return "bg-blue-100 text-blue-800 border-blue-200";
        case 5: return "bg-purple-100 text-purple-800 border-purple-200";
        case 6: return "bg-orange-100 text-orange-800 border-orange-200";
        default: return "bg-gray-100";
    }
  };

  const getFontSizeClass = (text, isTentView = false) => {
    const len = text.length;
    if (isTentView) {
        if (len > 25) return "text-[10px]";
        if (len > 15) return "text-xs";
        if (len > 10) return "text-sm";
        return "text-base";
    }
    if (len > 25) return "text-[9px] leading-tight";
    if (len > 20) return "text-[10px] leading-tight";
    if (len > 12) return "text-xs leading-tight";
    if (len > 8) return "text-sm";
    return "text-base";
  };

  const TierOption = ({ value }) => (
    <option value={value}>Tier {value}</option>
  );

  return (
    <div className="h-screen bg-gray-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      
      <style>
        {`
          @media print {
            @page { size: landscape; margin: 0.5cm; }
            .no-print { display: none !important; }
            .print-only { display: block !important; }
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .print-container { 
                border: none !important; 
                box-shadow: none !important; 
                width: 100% !important; 
                margin: 0 !important; 
                padding: 0 !important; 
                overflow: visible !important;
                background: white !important;
                height: auto !important;
                display: block !important;
            }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        `}
      </style>

      {/* Header */}
      <header className="no-print flex-shrink-0 bg-white border-b border-slate-200 p-3 md:p-4 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              Classroom Seating Planner
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setViewMode('teacher')} className={`px-2 py-1 md:px-3 md:py-1.5 rounded text-xs md:text-sm font-medium transition-all flex items-center gap-1 ${viewMode === 'teacher' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>
                <Monitor className="w-3 h-3" /> Teacher
              </button>
              <button onClick={() => setViewMode('student')} className={`px-2 py-1 md:px-3 md:py-1.5 rounded text-xs md:text-sm font-medium transition-all flex items-center gap-1 ${viewMode === 'student' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>
                <Users className="w-3 h-3" /> Student
              </button>
              <button onClick={() => setViewMode('tent')} className={`px-2 py-1 md:px-3 md:py-1.5 rounded text-xs md:text-sm font-medium transition-all flex items-center gap-1 ${viewMode === 'tent' ? 'bg-white shadow text-blue-600' : 'text-slate-600'}`}>
                <ArrowDownUp className="w-3 h-3" /> Tent
              </button>
            </div>
            
            <div className="flex gap-2 border-l pl-2 border-slate-300">
                <Button variant="outline" onClick={handleExportImage} title="Download PNG (Current Zoom)">
                    <ImageIcon className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={handlePrint} title="Print / Save PDF">
                    <Printer className="w-4 h-4" />
                </Button>
                <Button variant="outline" onClick={exportData} title="Save JSON">
                  <Save className="w-4 h-4" />
                </Button>
                <label className="cursor-pointer">
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                  <div className="h-full px-3 py-1.5 rounded-md font-medium text-sm bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center">
                    <Upload className="w-4 h-4" />
                  </div>
                </label>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden max-w-7xl mx-auto w-full">
        
        {/* LEFT COLUMN: Controls & Roster */}
        <div className="no-print w-80 flex-shrink-0 flex flex-col border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-4 space-y-6">
            
            {/* Grid Settings */}
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" /> Layout
              </h2>
              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col">
                  <label className="text-[10px] font-medium text-slate-500 uppercase">Rows</label>
                  <input type="number" value={rows} onChange={e => setRows(Number(e.target.value))} className="border rounded p-1 text-sm w-full" min="1" max="30" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-medium text-slate-500 uppercase">Cols</label>
                  <input type="number" value={cols} onChange={e => setCols(Number(e.target.value))} className="border rounded p-1 text-sm w-full" min="1" max="20" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-medium text-slate-500 uppercase">Group</label>
                  <input type="number" value={clusterSize} onChange={e => setClusterSize(Number(e.target.value))} className="border rounded p-1 text-sm w-full" min="1" />
                </div>
              </div>
            </div>

            <hr />

            {/* Smart Fill Section (Reorganized) */}
            <div className="space-y-3">
              <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Shuffle className="w-4 h-4" /> Smart Fill
              </h2>
              
              {/* 1. Geometric Fill */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Pattern Fill</label>
                <div className="grid grid-cols-2 gap-2 w-full">
                    <div className="flex gap-1">
                        <Button variant="secondary" onClick={() => autoFillRows('front-to-back')} className="text-xs px-1 flex-1 justify-center" title="Fill Blackboard to Back">
                            <ArrowDown className="w-3 h-3" /> Rows
                        </Button>
                        <Button variant="secondary" onClick={() => autoFillRows('back-to-front')} className="text-xs px-1 flex-1 justify-center" title="Fill Back to Blackboard">
                            <ArrowUp className="w-3 h-3" /> Rows
                        </Button>
                    </div>
                    <div className="flex gap-1">
                        <Button variant="secondary" onClick={() => autoFillCols('left-to-right')} className="text-xs px-1 flex-1 justify-center" title="Fill Left to Right">
                            <ArrowRight className="w-3 h-3" /> Cols
                        </Button>
                        <Button variant="secondary" onClick={() => autoFillCols('right-to-left')} className="text-xs px-1 flex-1 justify-center" title="Fill Right to Left">
                            <ArrowLeft className="w-3 h-3" /> Cols
                        </Button>
                    </div>
                </div>
              </div>

              {/* 2. Sort Fill */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Sorted Fill (Tiers)</label>
                <div className="flex gap-2">
                   <Button variant="secondary" onClick={() => smartFillSeq('asc')} className="text-xs flex-1 justify-center">
                    <ArrowDownWideNarrow className="w-3 h-3" /> T1→T6
                  </Button>
                  <Button variant="secondary" onClick={() => smartFillSeq('desc')} className="text-xs flex-1 justify-center">
                    <ArrowUpNarrowWide className="w-3 h-3" /> T6→T1
                  </Button>
                </div>
              </div>

              {/* 3. Composition Fill */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Group Composition</label>
                <div className="bg-slate-50 p-2 rounded border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                    <Settings2 className="w-3 h-3" />
                    Target per Group (Size {clusterSize})
                  </div>
                  
                  <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                    {[1, 2, 3, 4, 5, 6].map(t => (
                        <div key={t} className={`flex items-center border rounded px-1 ${getTierLabelColor(t)}`}>
                            <span className="text-[9px] font-bold mr-1 w-4">T{t}</span>
                            <div className="flex gap-1 flex-1 items-center">
                                <input 
                                    type="number" 
                                    min="0" 
                                    className="w-full bg-white/50 rounded px-0.5 text-[10px] text-center" 
                                    placeholder="Min"
                                    title={`Min Tier ${t}`}
                                    value={mixTargets[t]?.min || ""}
                                    onChange={(e) => setMixTargets({...mixTargets, [t]: { ...mixTargets[t], min: Number(e.target.value) }})}
                                />
                                <span className="text-slate-400 text-[9px]">-</span>
                                <input 
                                    type="number" 
                                    min="0" 
                                    className="w-full bg-white/50 rounded px-0.5 text-[10px] text-center" 
                                    placeholder="Max"
                                    title={`Max Tier ${t}`}
                                    value={mixTargets[t]?.max === 99 ? "" : mixTargets[t]?.max}
                                    onChange={(e) => setMixTargets({...mixTargets, [t]: { ...mixTargets[t], max: e.target.value === "" ? 99 : Number(e.target.value) }})}
                                />
                            </div>
                        </div>
                    ))}
                  </div>

                  <Button variant="secondary" onClick={smartFillGroupMix} className="text-xs w-full">
                    Apply Composition
                  </Button>
                </div>
              </div>

              <div className="pt-2 border-t">
                 <Button variant="danger" onClick={clearBoard} className="text-xs justify-center w-full">
                  Clear Board Only
                </Button>
              </div>
            </div>

            <hr />

            {/* Roster Section */}
            <div className="flex flex-col h-96">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-1">
                    <Layers className="w-4 h-4" /> Roster ({unseatedStudents.length})
                    </h2>
                    <div className="flex gap-1">
                        <button onClick={() => sortRoster('name')} className="text-[10px] px-1 bg-slate-100 border rounded hover:bg-slate-200" title="Sort A-Z">AZ</button>
                        <button onClick={() => sortRoster('tier')} className="text-[10px] px-1 bg-slate-100 border rounded hover:bg-slate-200" title="Sort by Tier">Tier</button>
                    </div>
                </div>
                <button 
                  onClick={handleResetAllClick} 
                  title="Delete ALL students"
                  className={`p-1 rounded transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide ${confirmClearAll ? 'bg-red-600 text-white w-20 justify-center' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                >
                  {confirmClearAll ? "Confirm?" : <Trash2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Add Student Input */}
              <div className="mb-2 space-y-2">
                 <textarea 
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Paste list..."
                  className="w-full border rounded-md p-2 text-xs h-20 resize-none focus:ring-1 focus:ring-blue-500 outline-none"
                />
                <div className="flex gap-1">
                   <select 
                    className="text-xs border rounded p-1 w-16 outline-none"
                    value={importTier}
                    onChange={(e) => setImportTier(Number(e.target.value))}
                  >
                    {[1,2,3,4,5,6].map(t => <TierOption key={t} value={t} />)}
                  </select>
                  <select 
                    className="text-xs border rounded p-1 w-16 outline-none"
                    value={importGender}
                    onChange={(e) => setImportGender(e.target.value)}
                    title="Gender for Import"
                  >
                    <option value="none">-</option>
                    <option value="M">Boy</option>
                    <option value="F">Girl</option>
                  </select>
                  <Button onClick={handleBulkImport} className="flex-1 py-1 text-xs">Add</Button>
                </div>
              </div>
              
              <div 
                className="flex-1 overflow-y-auto space-y-1 border-t pt-2"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, 'list')}
              >
                {unseatedStudents.length === 0 && (
                  <p className="text-center text-slate-400 text-xs mt-10">All students seated</p>
                )}
                {unseatedStudents.map(student => (
                  <div
                    key={student.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, 'student', student.id, 'list')}
                    className={`p-1.5 rounded border-2 cursor-move flex justify-between items-center shadow-sm select-none hover:shadow-md transition-shadow group ${getTierColor(student.tier)} ${getGenderBorderClass(student.gender)}`}
                  >
                    <span className="font-medium text-xs truncate flex-1">{student.name}</span>
                    <div className="flex items-center gap-1">
                      <select 
                        value={student.tier}
                        onChange={(e) => {
                          const newS = students.map(s => s.id === student.id ? {...s, tier: Number(e.target.value)} : s);
                          setStudents(newS);
                        }}
                        className="text-[9px] bg-white/50 rounded border-0 w-8 text-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                         {[1,2,3,4,5,6].map(t => <option key={t} value={t}>T{t}</option>)}
                      </select>
                      {/* Gender Toggle for Individual Student */}
                       <button
                        onClick={(e) => {
                             e.stopPropagation();
                             const nextG = student.gender === 'M' ? 'F' : student.gender === 'F' ? null : 'M';
                             const newS = students.map(s => s.id === student.id ? {...s, gender: nextG} : s);
                             setStudents(newS);
                        }}
                        className={`w-4 h-4 rounded-full text-[8px] flex items-center justify-center font-bold ${student.gender === 'M' ? 'bg-sky-200 text-sky-800' : student.gender === 'F' ? 'bg-pink-200 text-pink-800' : 'bg-gray-200 text-gray-500'}`}
                        title="Toggle Gender"
                      >
                        {student.gender || '-'}
                      </button>

                      <button 
                         onClick={(e) => { e.stopPropagation(); deleteStudent(student.id); }}
                         className="p-1 hover:bg-red-200 text-red-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <GripVertical className="w-3 h-3 opacity-50" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: The Classroom Grid */}
        <div className="flex-1 flex flex-col bg-slate-100 relative print-container overflow-hidden">
          
          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 z-20 flex flex-col gap-1 bg-white shadow-md rounded-md border border-slate-200 no-print">
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-2 hover:bg-slate-50 text-slate-600 border-b border-slate-100"><ZoomIn className="w-4 h-4" /></button>
            <button onClick={() => setZoom(1)} className="p-2 hover:bg-slate-50 text-slate-400 text-[10px] font-bold">{Math.round(zoom*100)}%</button>
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))} className="p-2 hover:bg-slate-50 text-slate-600"><ZoomOut className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-auto p-8 print-container flex flex-col items-center" ref={scrollContainerRef}>
            
            {/* SCALABLE WRAPPER */}
            <div 
              ref={contentRef}
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
              className="flex flex-col items-center transition-transform duration-200"
            >
              
              {/* Blackboard Indicator */}
              <div 
                className={`w-[600px] bg-slate-800 rounded-sm mb-12 flex flex-col items-center justify-center text-slate-300 shadow-lg transition-all ${viewMode === 'teacher' ? 'order-last mt-12' : 'order-first mb-12'} ${viewMode === 'tent' ? 'h-24' : 'h-8'}`}
              >
                {viewMode === 'tent' ? (
                     <>
                      <div className="h-1/2 flex items-center rotate-180 opacity-60 border-b border-slate-600 w-full justify-center">
                         <span className="text-xs font-mono">BLACKBOARD / FRONT</span>
                      </div>
                      <div className="h-1/2 flex items-center">
                         <span className="text-xs font-mono">BLACKBOARD / FRONT</span>
                      </div>
                     </>
                ) : (
                    <span className="text-xs font-mono">BLACKBOARD / FRONT</span>
                )}
              </div>

              {/* Grid Container */}
              <div className="flex flex-col gap-4 min-w-fit items-center mx-auto">
                {displayRows.map((rowIndex) => (
                  <div key={rowIndex} className="flex justify-center">
                    {Array.from({ length: cols }, (_, colIndex) => {
                      const seatId = `${rowIndex}-${colIndex}`;
                      const studentId = placements[seatId];
                      const student = students.find(s => s.id === studentId);
                      const isGap = (colIndex + 1) % clusterSize === 0 && colIndex !== cols - 1;

                      return (
                        <div key={colIndex} className="flex">
                          <div
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, seatId)}
                            className={`
                              relative group
                              w-28 h-20 md:w-32 md:h-24 lg:w-40 lg:h-28
                              border-2 border-dashed rounded-lg m-1
                              transition-all duration-200
                              ${student ? 'border-solid border-slate-300 bg-white shadow-sm' : 'border-slate-300 bg-slate-50/50 hover:bg-blue-50 hover:border-blue-300'}
                            `}
                          >
                            {student && (
                              <div
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'student', student.id, seatId)}
                                className={`w-full h-full cursor-grab active:cursor-grabbing p-2 flex flex-col justify-center items-center relative border-2 ${getTierColor(student.tier).replace('bg-', 'bg-opacity-20 ')} ${getGenderBorderClass(student.gender)} rounded-md`}
                              >
                                {viewMode === 'tent' ? (
                                  // TENT CARD VIEW
                                  <>
                                    <div className="w-full h-1/2 flex items-center justify-center border-b border-dashed border-gray-300 rotate-180 opacity-60">
                                      <span className={`${getFontSizeClass(student.name, true)} font-bold text-center leading-tight break-words px-1`}>{student.name}</span>
                                    </div>
                                    <div className="w-full h-1/2 flex items-center justify-center">
                                      <span className={`${getFontSizeClass(student.name, true)} font-bold text-center leading-tight break-words px-1`}>{student.name}</span>
                                    </div>
                                  </>
                                ) : (
                                  // STANDARD VIEW
                                  <>
                                    <span className={`${getFontSizeClass(student.name, false)} font-bold text-center text-slate-800 line-clamp-3 px-1 break-words w-full`}>
                                      {student.name}
                                    </span>
                                    
                                    {/* Hover controls */}
                                    <div className="no-print absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                      <button 
                                        onClick={() => {
                                          const newP = {...placements};
                                          delete newP[seatId];
                                          setPlacements(newP);
                                        }}
                                        className="bg-red-100 text-red-600 p-1 rounded hover:bg-red-200"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>

                                    {/* Tier Indicator Dot */}
                                    <div className={`absolute bottom-1 left-1 w-2 h-2 rounded-full ${
                                      student.tier === 1 ? 'bg-green-500' : 
                                      student.tier === 2 ? 'bg-yellow-500' : 
                                      student.tier === 3 ? 'bg-red-500' :
                                      student.tier === 4 ? 'bg-blue-500' :
                                      student.tier === 5 ? 'bg-purple-500' : 'bg-orange-500'
                                    }`} title={`Tier ${student.tier}`}></div>
                                  </>
                                )}
                              </div>
                            )}
                            
                            {!student && (
                              <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs font-medium uppercase tracking-widest pointer-events-none">
                                Empty
                              </div>
                            )}
                          </div>
                          
                          {/* Aisle Gap */}
                          {isGap && <div className="w-8 md:w-16 lg:w-24 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}