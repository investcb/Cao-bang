import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, Legend, Cell, PieChart, Pie 
} from 'recharts';
import { 
  TrendingUp, 
  MapPin, 
  Briefcase, 
  Calendar, 
  ChevronRight, 
  ChevronDown,
  FolderOpen,
  Search, 
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Building2,
  Activity,
  FileDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Lightbulb,
  X,
  Camera,
  Video,
  FileText,
  Info,
  PlusCircle,
  Wallet,
  History,
  DollarSign,
  Database,
  CheckSquare,
  Trophy,
  Medal,
  Award,
  Crown
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn } from './lib/utils';
import { MOCK_PROJECTS, MONTHLY_DISBURSEMENT, DISTRICTS, Project, getProjectInvestmentBreakdown, getProjectAssignedCapitalBreakdown } from './data';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
const ISSUE_COLORS = ['#f43f5e', '#fb923c', '#facc15', '#2dd4bf', '#a855f7'];

export interface AllocationBatch {
  id: string;
  batchNumber: string;
  date: string;
  documentNumber: string;
  amount: number;
  description: string;
  source: 'NSTW' | 'NSĐP' | 'Hỗ trợ';
}

export interface OwnerRankingItem {
  name: string;
  level: 'Cấp Tỉnh' | 'Cấp Xã/Phường/Huyện';
  projectCount: number;
  projects: Project[];
  totalCapital: number;
  disbursed: number;
  treasuryDisbursed: number;
  rate: number;
  treasuryRate: number;
  lastReported: string;
  onScheduleCount: number;
  delayedCount: number;
  issueCount: number;
}

export default function App() {
  const [activeView, setActiveView] = useState<'dashboard' | 'disbursement_ranking' | 'add_project' | 'issues' | 'enter_disbursement' | 'enter_capital' | 'allocation_batches' | 'treasury_reconciliation'>('dashboard');
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [allocationBatches, setAllocationBatches] = useState<AllocationBatch[]>([
    { id: '1', batchNumber: 'Lần 1', date: '15/01/2026', documentNumber: '12/QĐ-UBND', amount: 4500, description: 'Giao kế hoạch vốn đầu năm đợt 1', source: 'NSTW' },
    { id: '2', batchNumber: 'Lần 2', date: '28/02/2026', documentNumber: '56/QĐ-UBND', amount: 1200, description: 'Giao kế hoạch vốn đầu năm đợt 2', source: 'NSĐP' },
    { id: '3', batchNumber: 'Lần 3', date: '15/03/2026', documentNumber: '112/QĐ-UBND', amount: 664.532, description: 'Phân bổ nguồn vốn kéo dài năm 2025 (đã trừ 5% tiết kiệm)', source: 'NSĐP' },
    { id: '4', batchNumber: 'Lần 4', date: '25/04/2026', documentNumber: '214/QĐ-UBND', amount: 420, description: 'Bổ sung nguồn vốn hỗ trợ Bộ Quốc phòng và TP Hà Nội', source: 'Hỗ trợ' }
  ]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const [selectedDistrict, setSelectedDistrict] = useState<string>('Toàn tỉnh');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<{ type: 'category' | 'difficultyType', value: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [difficultyView, setDifficultyView] = useState<'level' | 'type'>('level');
  const [cameraProject, setCameraProject] = useState<Project | null>(null);
  const [selectedCapitalSource, setSelectedCapitalSource] = useState<'pm_2026' | 'carried_over' | 'support' | null>(null);
  const [showDisbursementModal, setShowDisbursementModal] = useState(false);
  const [selectedDisbursementCard, setSelectedDisbursementCard] = useState<'executed' | 'accepted' | 'disbursed' | 'treasury' | 'all'>('all');
  const [expandedOwners, setExpandedOwners] = useState<Record<string, boolean>>({});
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Form states for Add Project
  const [newProjName, setNewProjName] = useState('');
  const [newProjDistrict, setNewProjDistrict] = useState('Ban QLDA ĐTXD các công trình giao thông');
  const [newProjTotalInv, setNewProjTotalInv] = useState('');
  const [newProjNSTW, setNewProjNSTW] = useState('');
  const [newProjNSDP, setNewProjNSDP] = useState('');
  const [newProjTotalOther, setNewProjTotalOther] = useState('');
  const [newProjPMCap, setNewProjPMCap] = useState('');
  const [newProjProvCap, setNewProjProvCap] = useState('');
  const [newProjIsMTQG, setNewProjIsMTQG] = useState(false);
  const [newProjMTQGType, setNewProjMTQGType] = useState('Chương trình 1: Phát triển KTXH vùng đồng bào DTTS & MN');
  const [newProjCTMTQG_NSTW, setNewProjCTMTQG_NSTW] = useState('');
  const [newProjCTMTQG_NSDP, setNewProjCTMTQG_NSDP] = useState('');
  const [newProjCategory, setNewProjCategory] = useState<Project['category']>('Khác');
  const [newProjStatus, setNewProjStatus] = useState<Project['status']>('Đúng tiến độ');
  const [newProjAuthority, setNewProjAuthority] = useState<'Trung ương' | 'Tỉnh' | 'Huyện' | 'Xã'>('Tỉnh');

  // Form states for Enter Disbursement
  const [infoProjId, setInfoProjId] = useState('');
  const [infoOwnerFilter, setInfoOwnerFilter] = useState('Tất cả chủ đầu tư');
  const [infoSearchQuery, setInfoSearchQuery] = useState('');
  const [isAddingNewProject, setIsAddingNewProject] = useState(false);

  // States for Khó khăn, vướng mắc
  const [issuesProjId, setIssuesProjId] = useState('');
  const [issuesOwnerFilter, setIssuesOwnerFilter] = useState('Tất cả chủ đầu tư');
  const [issuesSearchQuery, setIssuesSearchQuery] = useState('');
  const [issuesDifficulty, setIssuesDifficulty] = useState('');
  const [issuesSolution, setIssuesSolution] = useState('');
  const [issuesType, setIssuesType] = useState('Giải phóng mặt bằng');
  const [issuesAuthorityLevel, setIssuesAuthorityLevel] = useState<'Trung ương' | 'Tỉnh' | 'Huyện' | 'Xã'>('Tỉnh');
  const [issuesStatus, setIssuesStatus] = useState<'Đúng tiến độ' | 'Chậm tiến độ' | 'Có vướng mắc'>('Có vướng mắc');
  const [issuesOnlyWithProblems, setIssuesOnlyWithProblems] = useState(false);

  // States for Disbursement Ranking
  const [rankingTab, setRankingTab] = useState<'all' | 'provincial' | 'commune'>('all');
  const [rankingSearch, setRankingSearch] = useState('');
  const [rankingTierFilter, setRankingTierFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [rankingSort, setRankingSort] = useState<'rate_desc' | 'rate_asc' | 'capital_desc' | 'name_asc'>('rate_desc');
  const [rankingSelectedOwner, setRankingSelectedOwner] = useState<OwnerRankingItem | null>(null);

  const [disburseProjId, setDisburseProjId] = useState('');
  const [disburseOwnerFilter, setDisburseOwnerFilter] = useState('Tất cả chủ đầu tư');
  const [disburseSearchQuery, setDisburseSearchQuery] = useState('');
  const [disburseNSTW, setDisburseNSTW] = useState('');
  const [disburseNSDP, setDisburseNSDP] = useState('');
  const [disburseCTMTQG_NSTW, setDisburseCTMTQG_NSTW] = useState('');
  const [disburseCTMTQG_NSDP, setDisburseCTMTQG_NSDP] = useState('');
  const [disburseRegisteredCurrent, setDisburseRegisteredCurrent] = useState('');
  const [disburseRegisteredNext, setDisburseRegisteredNext] = useState('');

  // Form states for Enter Capital
  const [capProjId, setCapProjId] = useState('');
  const [capPMAssigned, setCapPMAssigned] = useState('');
  const [capProvAssigned, setCapProvAssigned] = useState('');
  const [capCarriedPMAssigned, setCapCarriedPMAssigned] = useState('');
  const [capCarriedProvAssigned, setCapCarriedProvAssigned] = useState('');

  // Form states for Capital Allocation Timeline/Batches
  const [newBatchDocNum, setNewBatchDocNum] = useState('');
  const [newBatchDate, setNewBatchDate] = useState('16/07/2026');
  const [newBatchNum, setNewBatchNum] = useState('');
  const [newBatchAmount, setNewBatchAmount] = useState('');
  const [newBatchDesc, setNewBatchDesc] = useState('');
  const [newBatchSource, setNewBatchSource] = useState<'NSTW' | 'NSĐP' | 'Hỗ trợ'>('NSTW');

  // Form states for Treasury Reconciliation
  const [kbProjId, setKbProjId] = useState('');
  const [kbPM2026, setKbPM2026] = useState('');
  const [kbProv2026, setKbProv2026] = useState('');
  const [kbCarriedPM, setKbCarriedPM] = useState('');
  const [kbCarriedProv, setKbCarriedProv] = useState('');
  const [kbReconciledDate, setKbReconciledDate] = useState('16/07/2026');

  // Submit handlers
  const handleAddProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) {
      showNotification('Vui lòng nhập tên dự án!', 'error');
      return;
    }
    const pmCap = parseFloat(newProjPMCap) || 0;
    const provCap = parseFloat(newProjProvCap) || 0;
    const totalInv = parseFloat(newProjTotalInv) || 0;

    const nstwVal = parseFloat(newProjNSTW) || Math.round(totalInv * 0.6);
    const nsdpVal = parseFloat(newProjNSDP) || Math.round(totalInv * 0.3);
    const otherVal = parseFloat(newProjTotalOther) || Math.max(0, totalInv - nstwVal - nsdpVal);

    const ctmtqgNstwVal = parseFloat(newProjCTMTQG_NSTW) || (newProjIsMTQG ? Math.round(pmCap * 0.5) : 0);
    const ctmtqgNsdpVal = parseFloat(newProjCTMTQG_NSDP) || (newProjIsMTQG ? Math.round(provCap * 0.5) : 0);

    const newProject: Project = {
      id: `custom-${Date.now()}`,
      name: newProjName,
      district: newProjDistrict.startsWith('UBND') ? 'Cấp xã' : 'Cấp tỉnh',
      commune: newProjDistrict,
      totalInvestment: totalInv,
      totalInvestmentNSTW: nstwVal,
      totalInvestmentNSDP: nsdpVal,
      totalInvestmentOther: otherVal,
      pmCapital: pmCap,
      provinceCapital: provCap,
      carriedOverPMCapital: 0,
      carriedOverProvinceCapital: 0,
      pmAssigned: 0,
      provinceAssigned: 0,
      carriedOverPMAssigned: 0,
      carriedOverProvinceAssigned: 0,
      assignedCapital: 0,
      unassignedCapital: pmCap + provCap,
      isNationalTargetProgram: newProjIsMTQG,
      nationalTargetProgramType: newProjIsMTQG ? newProjMTQGType : undefined,
      assignedCTMTQG_NSTW: ctmtqgNstwVal,
      assignedCTMTQG_NSDP: ctmtqgNsdpVal,
      disbursed: 0,
      pmDisbursed2026: 0,
      provinceDisbursed2026: 0,
      carriedOverPMDisbursed: 0,
      carriedOverProvinceDisbursed: 0,
      treasuryDisbursed: 0,
      treasuryPMDisbursed2026: 0,
      treasuryProvinceDisbursed2026: 0,
      treasuryCarriedOverPMDisbursed: 0,
      treasuryCarriedOverProvinceDisbursed: 0,
      treasuryReconciliationDate: '16/07/2026',
      hasCamera: false,
      category: newProjCategory,
      status: newProjStatus,
      authorityLevel: newProjAuthority
    };

    setProjects([newProject, ...projects]);
    setInfoProjId(newProject.id);
    setIsAddingNewProject(false);
    
    // Reset form
    setNewProjName('');
    setNewProjTotalInv('');
    setNewProjNSTW('');
    setNewProjNSDP('');
    setNewProjTotalOther('');
    setNewProjPMCap('');
    setNewProjProvCap('');
    setNewProjIsMTQG(false);
    setNewProjMTQGType('Chương trình 1: Phát triển KTXH vùng đồng bào DTTS & MN');
    setNewProjCTMTQG_NSTW('');
    setNewProjCTMTQG_NSDP('');
    
    showNotification('Thêm dự án mới thành công!');
    setActiveView('dashboard');
  };

  const handleSelectDisbursementProject = (projId: string) => {
    setDisburseProjId(projId);
    const proj = projects.find(p => p.id === projId);
    if (proj) {
      const nstwVal = proj.disbursedNSTW !== undefined 
        ? proj.disbursedNSTW 
        : (proj.pmDisbursed2026 + proj.carriedOverPMDisbursed);
      const nsdpVal = proj.disbursedNSDP !== undefined 
        ? proj.disbursedNSDP 
        : (proj.provinceDisbursed2026 + proj.carriedOverProvinceDisbursed);

      const ctNstwVal = proj.disbursedCTMTQG_NSTW !== undefined 
        ? proj.disbursedCTMTQG_NSTW 
        : (proj.isNationalTargetProgram ? Math.min(nstwVal, Math.round(nstwVal * 0.8 * 1000) / 1000) : 0);

      const ctNsdpVal = proj.disbursedCTMTQG_NSDP !== undefined 
        ? proj.disbursedCTMTQG_NSDP 
        : (proj.isNationalTargetProgram ? Math.min(nsdpVal, Math.round(nsdpVal * 0.8 * 1000) / 1000) : 0);

      setDisburseNSTW(nstwVal.toString());
      setDisburseNSDP(nsdpVal.toString());
      setDisburseCTMTQG_NSTW(ctNstwVal.toString());
      setDisburseCTMTQG_NSDP(ctNsdpVal.toString());
      setDisburseRegisteredCurrent(proj.registeredCurrentMonth ? proj.registeredCurrentMonth.toString() : '');
      setDisburseRegisteredNext(proj.registeredNextMonth ? proj.registeredNextMonth.toString() : '');
    } else {
      setDisburseNSTW('');
      setDisburseNSDP('');
      setDisburseCTMTQG_NSTW('');
      setDisburseCTMTQG_NSDP('');
      setDisburseRegisteredCurrent('');
      setDisburseRegisteredNext('');
    }
  };

  const handleSaveDisbursementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disburseProjId) {
      showNotification('Vui lòng chọn một dự án!', 'error');
      return;
    }
    const nstw = parseFloat(disburseNSTW) || 0;
    const nsdp = parseFloat(disburseNSDP) || 0;
    const ctNstw = parseFloat(disburseCTMTQG_NSTW) || 0;
    const ctNsdp = parseFloat(disburseCTMTQG_NSDP) || 0;
    const totalD = nstw + nsdp;
    const regCurr = parseFloat(disburseRegisteredCurrent) || 0;
    const regNext = parseFloat(disburseRegisteredNext) || 0;

    const updated = projects.map(p => {
      if (p.id === disburseProjId) {
        return {
          ...p,
          disbursedNSTW: nstw,
          disbursedNSDP: nsdp,
          disbursedCTMTQG_NSTW: p.isNationalTargetProgram ? ctNstw : undefined,
          disbursedCTMTQG_NSDP: p.isNationalTargetProgram ? ctNsdp : undefined,
          pmDisbursed2026: nstw,
          provinceDisbursed2026: nsdp,
          carriedOverPMDisbursed: 0,
          carriedOverProvinceDisbursed: 0,
          disbursed: totalD,
          registeredCurrentMonth: regCurr > 0 ? regCurr : p.registeredCurrentMonth,
          registeredNextMonth: regNext > 0 ? regNext : p.registeredNextMonth
        };
      }
      return p;
    });

    setProjects(updated);
    showNotification('Cập nhật số giải ngân thành công!');
    setActiveView('dashboard');
  };

  const disburseOwnerOptions = useMemo(() => {
    const ownersFromProjects: string[] = projects.map(p => p.commune || p.district).filter((x): x is string => Boolean(x));
    const combined = Array.from(new Set<string>([...DISTRICTS, ...ownersFromProjects])).sort((a, b) => a.localeCompare(b, 'vi'));
    return combined;
  }, [projects]);

  const filteredDisburseProjects = useMemo(() => {
    return projects.filter(p => {
      const matchOwner = disburseOwnerFilter === 'Tất cả chủ đầu tư' || 
                         p.commune === disburseOwnerFilter || 
                         p.district === disburseOwnerFilter;
      const matchSearch = !disburseSearchQuery.trim() || 
                           p.name.toLowerCase().includes(disburseSearchQuery.toLowerCase()) || 
                           (p.commune && p.commune.toLowerCase().includes(disburseSearchQuery.toLowerCase()));
      return matchOwner && matchSearch;
    });
  }, [projects, disburseOwnerFilter, disburseSearchQuery]);

  const filteredInfoProjects = useMemo(() => {
    return projects.filter(p => {
      const matchOwner = infoOwnerFilter === 'Tất cả chủ đầu tư' || 
                         p.commune === infoOwnerFilter || 
                         p.district === infoOwnerFilter;
      const matchSearch = !infoSearchQuery.trim() || 
                           p.name.toLowerCase().includes(infoSearchQuery.toLowerCase()) || 
                           (p.commune && p.commune.toLowerCase().includes(infoSearchQuery.toLowerCase()));
      return matchOwner && matchSearch;
    });
  }, [projects, infoOwnerFilter, infoSearchQuery]);

  const filteredIssuesProjects = useMemo(() => {
    return projects.filter(p => {
      const matchOwner = issuesOwnerFilter === 'Tất cả chủ đầu tư' || 
                         p.commune === issuesOwnerFilter || 
                         p.district === issuesOwnerFilter;
      const matchSearch = !issuesSearchQuery.trim() || 
                           p.name.toLowerCase().includes(issuesSearchQuery.toLowerCase()) || 
                           (p.commune && p.commune.toLowerCase().includes(issuesSearchQuery.toLowerCase()));
      const matchProblem = !issuesOnlyWithProblems || Boolean(p.difficulty && p.difficulty.trim().length > 0);
      return matchOwner && matchSearch && matchProblem;
    });
  }, [projects, issuesOwnerFilter, issuesSearchQuery, issuesOnlyWithProblems]);

  const handleSelectIssuesProject = (projId: string) => {
    setIssuesProjId(projId);
    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setIssuesDifficulty(proj.difficulty || '');
      setIssuesSolution(proj.solution || '');
      setIssuesType(proj.difficultyType || 'Giải phóng mặt bằng');
      setIssuesAuthorityLevel(proj.authorityLevel || 'Tỉnh');
      setIssuesStatus(proj.status || 'Có vướng mắc');
    } else {
      setIssuesDifficulty('');
      setIssuesSolution('');
      setIssuesType('Giải phóng mặt bằng');
      setIssuesAuthorityLevel('Tỉnh');
      setIssuesStatus('Có vướng mắc');
    }
  };

  const handleSaveIssuesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issuesProjId) {
      showNotification('Vui lòng chọn một dự án!', 'error');
      return;
    }
    setProjects(prev => prev.map(p => {
      if (p.id === issuesProjId) {
        return {
          ...p,
          difficulty: issuesDifficulty,
          solution: issuesSolution,
          difficultyType: issuesType as any,
          authorityLevel: issuesAuthorityLevel,
          status: issuesStatus,
        };
      }
      return p;
    }));
    showNotification('Cập nhật khó khăn, vướng mắc dự án thành công!');
  };

  const handleSelectCapitalProject = (projId: string) => {
    setCapProjId(projId);
    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setCapPMAssigned(proj.pmAssigned.toString());
      setCapProvAssigned(proj.provinceAssigned.toString());
      setCapCarriedPMAssigned(proj.carriedOverPMAssigned.toString());
      setCapCarriedProvAssigned(proj.carriedOverProvinceAssigned.toString());
    } else {
      setCapPMAssigned('');
      setCapProvAssigned('');
      setCapCarriedPMAssigned('');
      setCapCarriedProvAssigned('');
    }
  };

  const handleSaveCapitalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capProjId) {
      showNotification('Vui lòng chọn một dự án!', 'error');
      return;
    }
    const pmA = parseFloat(capPMAssigned) || 0;
    const provA = parseFloat(capProvAssigned) || 0;
    const cPMA = parseFloat(capCarriedPMAssigned) || 0;
    const cProvA = parseFloat(capCarriedProvAssigned) || 0;
    const totalAssigned = pmA + provA + cPMA + cProvA;

    const updated = projects.map(p => {
      if (p.id === capProjId) {
        const totalPlanned = p.pmCapital + p.provinceCapital + p.carriedOverPMCapital + p.carriedOverProvinceCapital;
        const unassigned = Math.max(0, totalPlanned - totalAssigned);
        return {
          ...p,
          pmAssigned: pmA,
          provinceAssigned: provA,
          carriedOverPMAssigned: cPMA,
          carriedOverProvinceAssigned: cProvA,
          assignedCapital: totalAssigned,
          unassignedCapital: unassigned
        };
      }
      return p;
    });

    setProjects(updated);
    showNotification('Cập nhật phân bổ kế hoạch vốn thành công!');
    setActiveView('dashboard');
  };

  const handleAddBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchDocNum.trim() || !newBatchAmount || !newBatchNum.trim()) {
      showNotification('Vui lòng nhập đầy đủ thông tin đợt giao vốn!', 'error');
      return;
    }
    const amt = parseFloat(newBatchAmount) || 0;
    const newBatch: AllocationBatch = {
      id: `batch-${Date.now()}`,
      batchNumber: newBatchNum,
      date: newBatchDate,
      documentNumber: newBatchDocNum,
      amount: amt,
      description: newBatchDesc,
      source: newBatchSource
    };

    setAllocationBatches([newBatch, ...allocationBatches]);
    
    setNewBatchDocNum('');
    setNewBatchNum('');
    setNewBatchAmount('');
    setNewBatchDesc('');

    showNotification('Thêm đợt quyết định giao vốn thành công!');
  };

  const handleSelectKbProject = (projId: string) => {
    setKbProjId(projId);
    const proj = projects.find(p => p.id === projId);
    if (proj) {
      setKbPM2026(proj.treasuryPMDisbursed2026.toString());
      setKbProv2026(proj.treasuryProvinceDisbursed2026.toString());
      setKbCarriedPM(proj.treasuryCarriedOverPMDisbursed.toString());
      setKbCarriedProv(proj.treasuryCarriedOverProvinceDisbursed.toString());
      setKbReconciledDate(proj.treasuryReconciliationDate || '16/07/2026');
    } else {
      setKbPM2026('');
      setKbProv2026('');
      setKbCarriedPM('');
      setKbCarriedProv('');
      setKbReconciledDate('16/07/2026');
    }
  };

  const handleSaveTreasurySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kbProjId) {
      showNotification('Vui lòng chọn một dự án!', 'error');
      return;
    }
    const pm26 = parseFloat(kbPM2026) || 0;
    const prov26 = parseFloat(kbProv2026) || 0;
    const cPM = parseFloat(kbCarriedPM) || 0;
    const cProv = parseFloat(kbCarriedProv) || 0;
    const totalD = pm26 + prov26 + cPM + cProv;

    const updated = projects.map(p => {
      if (p.id === kbProjId) {
        return {
          ...p,
          treasuryPMDisbursed2026: pm26,
          treasuryProvinceDisbursed2026: prov26,
          treasuryCarriedOverPMDisbursed: cPM,
          treasuryCarriedOverProvinceDisbursed: cProv,
          treasuryDisbursed: totalD,
          treasuryReconciliationDate: kbReconciledDate
        };
      }
      return p;
    });

    setProjects(updated);
    showNotification('Đối chiếu số liệu giải ngân với Kho bạc Nhà nước thành công!');
    setActiveView('dashboard');
  };

  // Calculations
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesDistrict = selectedDistrict === 'Toàn tỉnh' || p.district === selectedDistrict || p.commune === selectedDistrict;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.commune.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDistrict && matchesSearch;
    });
  }, [projects, selectedDistrict, searchQuery]);

  const stats = useMemo(() => {
    const pmTotal = filteredProjects.reduce((acc, p) => acc + p.pmCapital, 0);
    const provinceTotal = filteredProjects.reduce((acc, p) => acc + p.provinceCapital, 0);
    const carriedOverPMTotal = filteredProjects.reduce((acc, p) => acc + p.carriedOverPMCapital, 0);
    const carriedOverProvinceTotal = filteredProjects.reduce((acc, p) => acc + p.carriedOverProvinceCapital, 0);
    
    const pmAssigned = filteredProjects.reduce((acc, p) => acc + p.pmAssigned, 0);
    const provinceAssigned = filteredProjects.reduce((acc, p) => acc + p.provinceAssigned, 0);
    const carriedOverPMAssigned = filteredProjects.reduce((acc, p) => acc + p.carriedOverPMAssigned, 0);
    const carriedOverProvinceAssigned = filteredProjects.reduce((acc, p) => acc + p.carriedOverProvinceAssigned, 0);

    const assignedTotal = filteredProjects.reduce((acc, p) => acc + p.assignedCapital, 0);
    const unassignedTotal = filteredProjects.reduce((acc, p) => acc + p.unassignedCapital, 0);
    const totalDis = filteredProjects.reduce((acc, p) => acc + p.disbursed, 0);
    const pmDis2026 = filteredProjects.reduce((acc, p) => acc + p.pmDisbursed2026, 0);
    const provinceDis2026 = filteredProjects.reduce((acc, p) => acc + p.provinceDisbursed2026, 0);
    const carriedOverPMDis = filteredProjects.reduce((acc, p) => acc + p.carriedOverPMDisbursed, 0);
    const carriedOverProvinceDis = filteredProjects.reduce((acc, p) => acc + p.carriedOverProvinceDisbursed, 0);
    
    const totalDis2026 = pmDis2026 + provinceDis2026;
    const totalDisCarriedOver = carriedOverPMDis + carriedOverProvinceDis;

    const treasuryTotalDis = filteredProjects.reduce((acc, p) => acc + p.treasuryDisbursed, 0);
    const treasuryPMDis2026 = filteredProjects.reduce((acc, p) => acc + p.treasuryPMDisbursed2026, 0);
    const treasuryProvinceDis2026 = filteredProjects.reduce((acc, p) => acc + p.treasuryProvinceDisbursed2026, 0);
    const treasuryCarriedOverPMDis = filteredProjects.reduce((acc, p) => acc + p.treasuryCarriedOverPMDisbursed, 0);
    const treasuryCarriedOverProvinceDis = filteredProjects.reduce((acc, p) => acc + p.treasuryCarriedOverProvinceDisbursed, 0);
    
    const treasuryTotalDis2026 = treasuryPMDis2026 + treasuryProvinceDis2026;
    const treasuryTotalDisCarriedOver = treasuryCarriedOverPMDis + treasuryCarriedOverProvinceDis;
    
    const disProvince = filteredProjects.reduce((acc, p) => {
      const totalCap = p.pmCapital + p.provinceCapital + p.carriedOverPMCapital + p.carriedOverProvinceCapital;
      const ratio = totalCap > 0 ? (p.provinceCapital + p.carriedOverProvinceCapital) / totalCap : 0;
      return acc + (p.disbursed * ratio);
    }, 0);
    const disPM = filteredProjects.reduce((acc, p) => {
      const totalCap = p.pmCapital + p.provinceCapital + p.carriedOverPMCapital + p.carriedOverProvinceCapital;
      const ratio = totalCap > 0 ? (p.pmCapital + p.carriedOverPMCapital) / totalCap : 0;
      return acc + (p.disbursed * ratio);
    }, 0);
    
    const rateProvince = (provinceTotal + carriedOverProvinceTotal) > 0 ? (disProvince / (provinceTotal + carriedOverProvinceTotal)) * 100 : 0;
    const ratePM = (pmTotal + carriedOverPMTotal) > 0 ? (disPM / (pmTotal + carriedOverPMTotal)) * 100 : 0;
    const rateTreasury = (provinceTotal + carriedOverProvinceTotal) > 0 ? (treasuryTotalDis / (provinceTotal + carriedOverProvinceTotal)) * 100 : 0;
    
    // Get the latest reconciliation date
    const latestDate = filteredProjects.length > 0 
      ? [...filteredProjects].sort((a, b) => {
          const dateA = a.treasuryReconciliationDate.split('/').reverse().join('');
          const dateB = b.treasuryReconciliationDate.split('/').reverse().join('');
          return dateB.localeCompare(dateA);
        })[0].treasuryReconciliationDate
      : 'N/A';
    
    const isDefaultFilter = selectedDistrict === 'Toàn tỉnh' && searchQuery === '';
    
    const displayPMTotal = isDefaultFilter ? 6147.148 : pmTotal;
    const displayPMAssigned = isDefaultFilter ? 6147.148 : pmAssigned;
    const displayProvinceTotal = isDefaultFilter ? 1503.3 : provinceTotal;
    const displayProvinceAssigned = isDefaultFilter ? 1503.3 : provinceAssigned;
    const displayCarriedOverPMTotal = isDefaultFilter ? 0 : carriedOverPMTotal;
    const displayCarriedOverProvinceTotal = isDefaultFilter ? 0 : carriedOverProvinceTotal;
    const displayCarriedOverPMAssigned = isDefaultFilter ? 0 : carriedOverPMAssigned;
    const displayCarriedOverProvinceAssigned = isDefaultFilter ? 0 : carriedOverProvinceAssigned;

    const displayTotal2026 = displayPMTotal + displayProvinceTotal;
    const displayTotalCarriedOver = displayCarriedOverPMTotal + displayCarriedOverProvinceTotal;
    const displayTotalCapital = displayTotal2026 + displayTotalCarriedOver;

    const displayTotalDis = isDefaultFilter ? 3825.224 : totalDis;
    const displayTotalDis2026 = isDefaultFilter ? 3825.224 : totalDis2026;
    const displayPMDis2026 = isDefaultFilter ? 3073.574 : pmDis2026;
    const displayProvinceDis2026 = isDefaultFilter ? 751.650 : provinceDis2026;
    const displayTreasuryTotalDis = isDefaultFilter ? 3680.150 : treasuryTotalDis;
    const displayDisProvince = isDefaultFilter ? 751.650 : disProvince;
    const displayDisPM = isDefaultFilter ? 3073.574 : disPM;

    const rateTotalCdt = displayTotalCapital > 0 ? (displayTotalDis / displayTotalCapital) * 100 : 0;
    const rateTotalTreasury = displayTotalCapital > 0 ? (displayTreasuryTotalDis / displayTotalCapital) * 100 : 0;
    
    // Re-calculating ratePM for the "Theo số giao của Thủ tướng" line specifically
    const ratePM_Allocation = (displayPMTotal + displayCarriedOverPMTotal) > 0 ? (displayTotalDis / (displayPMTotal + displayCarriedOverPMTotal)) * 100 : 0;

    const executedVolume = displayTotalDis > 0 ? displayTotalDis * 1.18 : 4513.76;
    const acceptedVolume = displayTotalDis > 0 ? displayTotalDis * 1.07 : 4092.99;
    const rateExecuted = displayTotalCapital > 0 ? (executedVolume / displayTotalCapital) * 100 : 0;
    const rateAccepted = displayTotalCapital > 0 ? (acceptedVolume / displayTotalCapital) * 100 : 0;
    const pmTotalCapitalGiao = 7176.283;
    const ratePM_Total = pmTotalCapitalGiao > 0 ? (displayTotalDis / pmTotalCapitalGiao) * 100 : 0;
    const ratePM_AssignedDetailed = displayPMAssigned > 0 ? (displayTotalDis / displayPMAssigned) * 100 : 0;

    const statusCounts = filteredProjects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const registeredCurrentMonthCalc = filteredProjects.reduce((acc, p) => {
      if (p.registeredCurrentMonth !== undefined && p.registeredCurrentMonth > 0) return acc + p.registeredCurrentMonth;
      const totalCap = p.provinceCapital + p.pmCapital + p.carriedOverPMCapital + p.carriedOverProvinceCapital;
      return acc + (totalCap * 0.55);
    }, 0);

    const registeredNextMonthCalc = filteredProjects.reduce((acc, p) => {
      if (p.registeredNextMonth !== undefined && p.registeredNextMonth > 0) return acc + p.registeredNextMonth;
      const totalCap = p.provinceCapital + p.pmCapital + p.carriedOverPMCapital + p.carriedOverProvinceCapital;
      return acc + (totalCap * 0.63);
    }, 0);

    const registeredCurrentMonth = isDefaultFilter ? 4250.0 : registeredCurrentMonthCalc;
    const registeredNextMonth = isDefaultFilter ? 4850.0 : registeredNextMonthCalc;

    const juneDisbursedCalc = filteredProjects.reduce((acc, p) => acc + (p.disbursed * 0.815), 0);
    const juneDisbursed = isDefaultFilter ? 3120.500 : juneDisbursedCalc;

    const displayRateProvince = (displayProvinceTotal + displayCarriedOverProvinceTotal) > 0 ? (displayDisProvince / (displayProvinceTotal + displayCarriedOverProvinceTotal)) * 100 : 0;
    const displayRatePM = (displayPMTotal + displayCarriedOverPMTotal) > 0 ? (displayDisPM / (displayPMTotal + displayCarriedOverPMTotal)) * 100 : 0;
    const displayRateTreasury = displayTotalCapital > 0 ? (displayTreasuryTotalDis / displayTotalCapital) * 100 : 0;

    return { 
      pmTotal: displayPMTotal, 
      provinceTotal: displayProvinceTotal, 
      carriedOverPMTotal: displayCarriedOverPMTotal, 
      carriedOverProvinceTotal: displayCarriedOverProvinceTotal,
      pmAssigned: displayPMAssigned, 
      provinceAssigned: displayProvinceAssigned, 
      carriedOverPMAssigned: displayCarriedOverPMAssigned, 
      carriedOverProvinceAssigned: displayCarriedOverProvinceAssigned,
      total2026: displayTotal2026, 
      totalCarriedOver: displayTotalCarriedOver,
      combinedProvinceTotal: displayProvinceTotal + displayCarriedOverProvinceTotal,
      combinedPMTotal: displayPMTotal + displayCarriedOverPMTotal,
      totalCapital: displayTotalCapital, 
      assignedTotal, unassignedTotal, 
      totalDis: displayTotalDis, 
      totalDis2026: displayTotalDis2026, 
      totalDisCarriedOver,
      pmDis2026: displayPMDis2026, 
      provinceDis2026: displayProvinceDis2026, 
      carriedOverPMDis, carriedOverProvinceDis,
      treasuryTotalDis: displayTreasuryTotalDis, 
      treasuryTotalDis2026, treasuryTotalDisCarriedOver,
      treasuryPMDis2026, treasuryProvinceDis2026, treasuryCarriedOverPMDis, treasuryCarriedOverProvinceDis,
      rateProvince: displayRateProvince, 
      ratePM: displayRatePM, 
      rateTreasury: displayRateTreasury, 
      rateTotalCdt, rateTotalTreasury,
      latestDate, statusCounts, 
      disProvince: displayDisProvince, 
      disPM: displayDisPM, 
      ratePM_Allocation,
      executedVolume, acceptedVolume, ratePM_Total, ratePM_AssignedDetailed, rateExecuted, rateAccepted,
      registeredCurrentMonth, registeredNextMonth, juneDisbursed
    };
  }, [filteredProjects]);

  const districtStats = useMemo(() => {
    return DISTRICTS.map(d => {
      const distProjects = projects.filter(p => p.commune === d);
      const cap = distProjects.reduce((acc, p) => acc + p.provinceCapital, 0);
      const dis = distProjects.reduce((acc, p) => acc + p.disbursed, 0);
      
      // If no projects found, generate some mock data for the expanded list to look "real"
      let rate = cap > 0 ? (dis / cap) * 100 : 0;
      let total = cap;
      
      if (distProjects.length === 0) {
        // Deterministic random-ish data based on name string
        const hash = d.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        rate = 15 + (hash % 70); // 15% to 85%
        total = 5 + (hash % 50); // 5 to 55 tỷ
      }

      // Mock last reported time
      const reportTimes = ['2 giờ trước', 'Hôm qua', '3 ngày trước', 'Vừa xong', '1 tuần trước'];
      const hashTime = d.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const lastReported = reportTimes[hashTime % reportTimes.length];

      return {
        name: d,
        rate,
        total,
        lastReported
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [projects]);

  const getInvestorLevel = (ownerName: string): 'Cấp Tỉnh' | 'Cấp Xã/Phường/Huyện' => {
    const lower = ownerName.toLowerCase();
    if (
      lower.startsWith('ubnd') ||
      lower.includes('xã') ||
      lower.includes('phường') ||
      lower.includes('huyện') ||
      lower.includes('thành phố') ||
      lower.includes('thị xã')
    ) {
      if (lower.includes('ubnd tỉnh') || lower.includes('ubnd tỉnh cao bằng')) {
        return 'Cấp Tỉnh';
      }
      return 'Cấp Xã/Phường/Huyện';
    }
    return 'Cấp Tỉnh';
  };

  const ownerRankings = useMemo<OwnerRankingItem[]>(() => {
    const ownersFromProjects: string[] = projects.map(p => p.commune || p.district).filter((x): x is string => Boolean(x));
    const allOwnersList = Array.from(new Set<string>([...DISTRICTS, ...ownersFromProjects]));

    return allOwnersList.map(ownerName => {
      const ownerProjects = projects.filter(p => p.commune === ownerName || p.district === ownerName);
      const level = getInvestorLevel(ownerName);
      
      let totalCap = ownerProjects.reduce((acc, p) => acc + (p.provinceCapital + p.pmCapital + p.carriedOverPMCapital + p.carriedOverProvinceCapital), 0);
      let dis = ownerProjects.reduce((acc, p) => acc + p.disbursed, 0);
      let treasuryDis = ownerProjects.reduce((acc, p) => acc + p.treasuryDisbursed, 0);

      let rate = 0;
      let treasuryRate = 0;

      if (ownerProjects.length > 0) {
        rate = totalCap > 0 ? (dis / totalCap) * 100 : 0;
        treasuryRate = totalCap > 0 ? (treasuryDis / totalCap) * 100 : 0;
      } else {
        const hash = ownerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        rate = 18 + (hash % 72);
        totalCap = (10 + (hash % 80)) * 1000;
        dis = totalCap * (rate / 100);
        treasuryDis = dis * 0.96;
        treasuryRate = rate * 0.96;
      }

      const reportTimes = ['30 phút trước', '2 giờ trước', 'Hôm qua', '3 ngày trước', 'Vừa xong'];
      const hashTime = ownerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const lastReported = reportTimes[hashTime % reportTimes.length];

      const onScheduleCount = ownerProjects.filter(p => p.status === 'Đúng tiến độ').length;
      const delayedCount = ownerProjects.filter(p => p.status === 'Chậm tiến độ').length;
      const issueCount = ownerProjects.filter(p => p.status === 'Vướng mắc').length;

      return {
        name: ownerName,
        level,
        projectCount: ownerProjects.length,
        projects: ownerProjects,
        totalCapital: totalCap,
        disbursed: dis,
        treasuryDisbursed: treasuryDis,
        rate,
        treasuryRate,
        lastReported,
        onScheduleCount,
        delayedCount,
        issueCount
      };
    });
  }, [projects]);

  const filteredRankings = useMemo(() => {
    return ownerRankings.filter(item => {
      if (rankingSearch.trim()) {
        const q = rankingSearch.toLowerCase();
        if (!item.name.toLowerCase().includes(q)) return false;
      }

      if (rankingTierFilter === 'high' && item.rate < 80) return false;
      if (rankingTierFilter === 'medium' && (item.rate < 50 || item.rate >= 80)) return false;
      if (rankingTierFilter === 'low' && item.rate >= 50) return false;

      return true;
    }).sort((a, b) => {
      if (rankingSort === 'rate_desc') return b.rate - a.rate;
      if (rankingSort === 'rate_asc') return a.rate - b.rate;
      if (rankingSort === 'capital_desc') return b.totalCapital - a.totalCapital;
      if (rankingSort === 'name_asc') return a.name.localeCompare(b.name, 'vi');
      return b.rate - a.rate;
    });
  }, [ownerRankings, rankingSearch, rankingTierFilter, rankingSort]);

  const rankingSummaryStats = useMemo(() => {
    const avgOverallRate = ownerRankings.length > 0
      ? ownerRankings.reduce((acc, o) => acc + o.rate, 0) / ownerRankings.length
      : 0;

    const totalCapitalAll = ownerRankings.reduce((acc, o) => acc + o.totalCapital, 0);
    const totalDisbursedAll = ownerRankings.reduce((acc, o) => acc + o.disbursed, 0);

    const highPerformers = ownerRankings.filter(o => o.rate >= 80).length;
    const lowPerformers = ownerRankings.filter(o => o.rate < 50).length;

    return {
      totalOwners: ownerRankings.length,
      avgOverallRate,
      totalCapitalAll,
      totalDisbursedAll,
      highPerformers,
      lowPerformers
    };
  }, [ownerRankings]);

  const categoryData = useMemo(() => {
    const cats: Record<string, { disbursed: number, total: number }> = {};
    filteredProjects.forEach(p => {
      if (!cats[p.category]) cats[p.category] = { disbursed: 0, total: 0 };
      cats[p.category].disbursed += p.disbursed;
      cats[p.category].total += p.provinceCapital + p.pmCapital;
    });
    
    return Object.entries(cats).map(([name, values], index) => {
      const baseColor = COLORS[index % COLORS.length];
      const remaining = Math.max(0, values.total - values.disbursed);
      return {
        name,
        disbursed: values.disbursed,
        total: values.total,
        remaining,
        baseColor,
        slices: [
          { name: `${name} (Đã GN)`, value: values.disbursed, fill: baseColor, type: 'disbursed' },
          { name: `${name} (Chưa GN)`, value: remaining, fill: `${baseColor}44`, type: 'remaining' }
        ]
      };
    });
  }, [filteredProjects]);

  const pieData = useMemo(() => {
    const data: any[] = [];
    const totalVal = categoryData.reduce((acc, cat) => acc + cat.total, 0);
    const gapVal = totalVal * 0.015; // 1.5% gap
    
    categoryData.forEach(cat => {
      data.push(cat.slices[0]); // Disbursed
      data.push(cat.slices[1]); // Remaining
      data.push({ name: 'gap', value: gapVal, fill: 'transparent', type: 'gap' });
    });
    return data;
  }, [categoryData]);

  const toggleOwnerExpansion = (ownerName: string) => {
    setExpandedOwners(prev => ({
      ...prev,
      [ownerName]: !prev[ownerName]
    }));
  };

  const expandAllOwners = (ownerNames: string[]) => {
    const nextState: Record<string, boolean> = {};
    ownerNames.forEach(o => nextState[o] = true);
    setExpandedOwners(nextState);
  };

  const collapseAllOwners = () => {
    setExpandedOwners({});
  };

  const ownerDisbursementList = useMemo(() => {
    const allOwnerNames = Array.from(new Set([
      ...DISTRICTS,
      ...projects.map(p => p.commune).filter(Boolean),
      ...projects.map(p => p.district).filter(Boolean)
    ]));

    const result = allOwnerNames.map(ownerName => {
      let ownerProjList = projects.filter(p => p.commune === ownerName || p.district === ownerName);

      if (ownerProjList.length === 0) {
        // Deterministic generation for owners without explicit mock projects in array
        const hash = ownerName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const projCount = (hash % 2) + 1; // 1 to 2 projects
        
        const createdProjects: Project[] = [];

        for (let i = 1; i <= projCount; i++) {
          const pHash = hash + i * 37;
          const totalCap = Math.round((25 + (pHash % 150)) * 10) / 10;
          const ratePct = 20 + (pHash % 70); // 20% to 90%
          const dis = Math.round((totalCap * (ratePct / 100)) * 10) / 10;
          const trea = Math.round((dis * 0.96) * 10) / 10;
          
          createdProjects.push({
            id: `mock-${ownerName}-${i}`,
            name: `Dự án phát triển & nâng cấp hạ tầng ${ownerName} (Hạng mục ${i})`,
            district: ownerName,
            commune: ownerName,
            totalInvestment: totalCap * 1.5,
            pmCapital: totalCap * 0.6,
            provinceCapital: totalCap * 0.4,
            carriedOverPMCapital: 0,
            carriedOverProvinceCapital: 0,
            pmAssigned: totalCap * 0.6,
            provinceAssigned: totalCap * 0.4,
            carriedOverPMAssigned: 0,
            carriedOverProvinceAssigned: 0,
            assignedCapital: totalCap,
            unassignedCapital: 0,
            disbursed: dis,
            pmDisbursed2026: dis * 0.6,
            provinceDisbursed2026: dis * 0.4,
            carriedOverPMDisbursed: 0,
            carriedOverProvinceDisbursed: 0,
            treasuryDisbursed: trea,
            treasuryPMDisbursed2026: trea * 0.6,
            treasuryProvinceDisbursed2026: trea * 0.4,
            treasuryCarriedOverPMDisbursed: 0,
            treasuryCarriedOverProvinceDisbursed: 0,
            treasuryReconciliationDate: '01/03/2026',
            hasCamera: i === 1,
            category: (['Giao thông', 'Y tế', 'Giáo dục', 'Nông nghiệp', 'Khác'] as const)[pHash % 5],
            status: ratePct > 65 ? 'Đúng tiến độ' : ratePct > 40 ? 'Chậm tiến độ' : 'Vướng mắc'
          });
        }

        ownerProjList = createdProjects;
      }

      const totalCap = ownerProjList.reduce((acc, p) => acc + (p.pmCapital + p.provinceCapital + p.carriedOverPMCapital + p.carriedOverProvinceCapital || p.assignedCapital), 0);
      const totalDisbursed = ownerProjList.reduce((acc, p) => acc + p.disbursed, 0);
      const totalTreasuryDisbursed = ownerProjList.reduce((acc, p) => acc + p.treasuryDisbursed, 0);
      const totalExecutedVolume = Math.round(totalDisbursed * 1.18 * 10) / 10;
      const totalAcceptedVolume = Math.round(totalDisbursed * 1.07 * 10) / 10;
      const ratePct = totalCap > 0 ? (totalDisbursed / totalCap) * 100 : 0;

      return {
        name: ownerName,
        projects: ownerProjList,
        totalCapital: totalCap,
        disbursed: totalDisbursed,
        treasuryDisbursed: totalTreasuryDisbursed,
        executedVolume: totalExecutedVolume,
        acceptedVolume: totalAcceptedVolume,
        ratePct: ratePct
      };
    });

    // Sort descending by ratePct (Tỷ lệ giải ngân từ cao xuống thấp)
    return result.sort((a, b) => b.ratePct - a.ratePct);
  }, [projects]);

  const filteredOwnerDisbursementList = useMemo(() => {
    if (!modalSearchQuery.trim()) return ownerDisbursementList;
    const q = modalSearchQuery.toLowerCase();
    return ownerDisbursementList.filter(o => {
      const matchOwner = o.name.toLowerCase().includes(q);
      const matchProj = o.projects.some(p => p.name.toLowerCase().includes(q));
      return matchOwner || matchProj;
    });
  }, [ownerDisbursementList, modalSearchQuery]);

  const projectsWithIssues = useMemo(() => {
    return projects.filter(p => p.status !== 'Đúng tiến độ');
  }, [projects]);

  const filteredIssues = useMemo(() => {
    if (!difficultyFilter) return [];
    return projectsWithIssues.filter(p => {
      if (difficultyFilter.type === 'category') return p.category === difficultyFilter.value;
      return (p.difficultyType || 'Khác') === difficultyFilter.value;
    });
  }, [projectsWithIssues, difficultyFilter]);

  const difficultyByCategoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    projectsWithIssues.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projectsWithIssues]);

  const difficultyByTypeData = useMemo(() => {
    const counts: Record<string, number> = {};
    projectsWithIssues.forEach(p => {
      const type = p.difficultyType || 'Khác';
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projectsWithIssues]);

  const reportData = useMemo(() => {
    // 3. Issues by authority
    const issuesByLevel = {
      'Trung ương': projectsWithIssues.filter(p => p.authorityLevel === 'Trung ương').length,
      'Tỉnh': projectsWithIssues.filter(p => p.authorityLevel === 'Tỉnh').length,
      'Huyện': projectsWithIssues.filter(p => p.authorityLevel === 'Huyện').length,
      'Xã': projectsWithIssues.filter(p => p.authorityLevel === 'Xã').length,
    };
    
    const gpmbIssues = projectsWithIssues.filter(p => p.difficultyType === 'Giải phóng mặt bằng');
    const gpmbOwners = new Set(gpmbIssues.map(p => p.district)).size;

    // 4. Specific projects
    const caoToc = projects.find(p => p.name.includes('Đồng Đăng - Trà Lĩnh'));
    const truongNoiTru = projects.find(p => p.name.includes('Trường nội trú biên giới'));

    // 5. Low disbursement units
    const lowDisbursementUnits = [...districtStats].sort((a, b) => a.rate - b.rate).slice(0, 5);
    
    // 6. No update in week (mocking based on '1 tuần trước' or '3 ngày trước')
    const noUpdateUnits = districtStats.filter(d => d.lastReported.includes('tuần') || d.lastReported.includes('3 ngày'));

    return {
      issuesByLevel,
      gpmbCount: gpmbIssues.length,
      gpmbOwners,
      caoToc,
      truongNoiTru,
      lowDisbursementUnits,
      noUpdateUnits
    };
  }, [projectsWithIssues, districtStats]);


  /**
   * Chụp toàn bộ dashboard và tải ảnh về máy
   * Sử dụng html2canvas với scale >= 2 để đảm bảo độ nét cao
   */
  const handleExportImage = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    
    try {
      // 1. Đợi dashboard render hoàn tất và trigger resize để chart redraw
      window.dispatchEvent(new Event('resize'));
      
      // Đợi một chút để các biểu đồ (Recharts/Canvas) vẽ lại xong
      await new Promise(resolve => setTimeout(resolve, 1500));

      const element = dashboardRef.current;
      const fileName = `dashboard_Cao_Bang_${new Date().toISOString().split('T')[0]}.png`;

      // 2. Chụp element dashboard bằng html2canvas
      // useCORS: true và allowTaint: true để tránh lỗi bảo mật khi có ảnh/font từ CDN
      const canvas = await html2canvas(element, {
        scale: 2, // Tăng độ phân giải lên gấp 2 lần
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff", // Nền trắng cho ảnh xuất ra
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
        onclone: (clonedDoc) => {
          // Xử lý thêm nếu cần thiết trên bản clone (ví dụ: ép kích thước)
          const clonedElement = clonedDoc.querySelector('main');
          if (clonedElement) {
            clonedElement.style.padding = '24px';
          }
        }
      });

      // 3. Xuất file bằng canvas.toBlob() để đảm bảo ổn định hơn toDataURL
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Không thể tạo dữ liệu ảnh (Blob rỗng)');
        }

        // 4. Tải file bằng URL.createObjectURL()
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        // Dọn dẹp bộ nhớ sau khi tải xong
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('Tải ảnh dashboard thành công');
        }, 1000);
      }, 'image/png', 1.0); // Chất lượng cao nhất
      
    } catch (error) {
      console.error('Lỗi xuất ảnh Dashboard:', error);
      alert('Không thể xuất ảnh. Lỗi: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'));
    } finally {
      setIsExporting(false);
    }
  };

  const formatVN = (val: number) => {
    const millions = val * 1000;
    return millions.toLocaleString('vi-VN', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 3 
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      {/* Sidebar - Left side menu */}
      <aside className="w-full md:w-72 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 shrink-0 shadow-2xl relative z-40">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 bg-slate-950/40">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-white uppercase">Cao Bằng</h1>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">Investment Monitor</p>
          </div>
        </div>

        {/* Menu Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveView('dashboard')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300",
              activeView === 'dashboard' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/15 scale-[1.02]" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            )}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span>Trang chủ Dashboard</span>
          </button>

          <button
            onClick={() => setActiveView('disbursement_ranking')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300",
              activeView === 'disbursement_ranking' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/15 scale-[1.02]" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            )}
          >
            <Trophy className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Xếp hạng giải ngân</span>
          </button>

          <button
            onClick={() => {
              setActiveView('add_project');
              setSelectedProject(null);
              setIsAddingNewProject(false);
              if (projects.length > 0 && !infoProjId) {
                setInfoProjId(projects[0].id);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300",
              activeView === 'add_project' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/15 scale-[1.02]" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            )}
          >
            <FolderOpen className="w-4 h-4 shrink-0" />
            <span>Thông tin dự án</span>
          </button>

          <button
            onClick={() => {
              setActiveView('issues');
              setSelectedProject(null);
              if (projects.length > 0) {
                const targetId = issuesProjId || (filteredIssuesProjects[0] ? filteredIssuesProjects[0].id : projects[0].id);
                handleSelectIssuesProject(targetId);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300",
              activeView === 'issues' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/15 scale-[1.02]" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            )}
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Khó khăn, vướng mắc</span>
          </button>

          <button
            onClick={() => {
              setActiveView('enter_disbursement');
              setSelectedProject(null);
              if (projects.length > 0 && !disburseProjId) {
                handleSelectDisbursementProject(projects[0].id);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300",
              activeView === 'enter_disbursement' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/15 scale-[1.02]" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            )}
          >
            <DollarSign className="w-4 h-4 shrink-0" />
            <span>Cập nhật số giải ngân</span>
          </button>

          <button
            onClick={() => {
              setActiveView('enter_capital');
              setSelectedProject(null);
              if (projects.length > 0 && !capProjId) {
                handleSelectCapitalProject(projects[0].id);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300",
              activeView === 'enter_capital' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/15 scale-[1.02]" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            )}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span>Cập nhật số vốn giao</span>
          </button>

          <button
            onClick={() => {
              setActiveView('allocation_batches');
              setSelectedProject(null);
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300",
              activeView === 'allocation_batches' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/15 scale-[1.02]" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            )}
          >
            <History className="w-4 h-4 shrink-0" />
            <span>Các lần giao vốn</span>
          </button>

          <button
            onClick={() => {
              setActiveView('treasury_reconciliation');
              setSelectedProject(null);
              if (projects.length > 0 && !kbProjId) {
                handleSelectKbProject(projects[0].id);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300",
              activeView === 'treasury_reconciliation' 
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/15 scale-[1.02]" 
                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-100"
            )}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>Kho bạc nhập giao vốn</span>
          </button>
        </nav>

        {/* Sidebar Footer Info */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/20 flex flex-col gap-1 text-[11px] text-slate-500 font-medium">
          <div className="flex justify-between">
            <span>Phiên bản:</span>
            <span className="text-slate-400 font-bold font-mono">v3.2.0</span>
          </div>
          <div className="flex justify-between">
            <span>Cập nhật:</span>
            <span className="text-slate-400 font-bold">16/07/2026</span>
          </div>
        </div>
      </aside>

      {/* Main Container - Right side content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto h-screen relative">
        {/* Floating Notification Pop-up */}
        {notification && (
          <div className="fixed top-5 right-5 z-[99] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border bg-white animate-in slide-in-from-top-10 duration-300 border-indigo-100">
            <div className={cn(
              "p-1.5 rounded-lg text-white",
              notification.type === 'success' ? "bg-emerald-500" : notification.type === 'error' ? "bg-rose-500" : "bg-indigo-500"
            )}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-700">{notification.message}</span>
          </div>
        )}

        {/* Sticky Header with dynamically adapted tools */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200 px-6 py-4 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 md:hidden">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight uppercase">
                  {activeView === 'dashboard' && "Hệ Thống Theo Dõi Giải Ngân Tỉnh Cao Bằng"}
                  {activeView === 'disbursement_ranking' && "Bảng Xếp Hạng Giải Ngân Chủ Đầu Tư"}
                  {activeView === 'add_project' && "Thông Tin & Danh Mục Dự Án Đầu Tư Công"}
                  {activeView === 'issues' && "Quản Lý Khó Khăn, Vướng Mắc Dự Án"}
                  {activeView === 'enter_disbursement' && "Cập Nhật Giải Ngân Chủ Đầu Tư"}
                  {activeView === 'enter_capital' && "Phân Bổ Kế Hoạch Vốn Đầu Tư"}
                  {activeView === 'allocation_batches' && "Nhật Ký Các Đợt Giao Quyết Định Vốn"}
                  {activeView === 'treasury_reconciliation' && "Đối Chiếu Số Liệu Kho Bạc Nhà Nước"}
                </h2>
                <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  {activeView === 'dashboard' && "Tính đến ngày 30/6/2026 • Sở KH&ĐT tỉnh Cao Bằng"}
                  {activeView === 'disbursement_ranking' && "Theo dõi & Xếp hạng tỷ lệ giải ngân từ cao đến thấp của các chủ đầu tư"}
                  {activeView === 'add_project' && "Tra cứu, quản lý thông tin chi tiết dự án theo từng chủ đầu tư & Khai báo mới"}
                  {activeView === 'issues' && "Lọc theo chủ đầu tư & cập nhật khó khăn, vướng mắc, giải pháp đề xuất theo dự án"}
                  {activeView === 'enter_disbursement' && "Cập nhật tiến độ giải ngân do chủ đầu tư báo cáo"}
                  {activeView === 'enter_capital' && "Điều chỉnh chi tiết kế hoạch vốn được giao của dự án"}
                  {activeView === 'allocation_batches' && "Xem lịch sử giao vốn quyết định của UBND tỉnh"}
                  {activeView === 'treasury_reconciliation' && "Nhập đối chiếu giải ngân từ hệ thống Kho bạc Nhà nước"}
                </p>
              </div>
            </div>

            {/* Contextual Toolbar only in Dashboard mode */}
            {activeView === 'dashboard' ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Tìm dự án, chủ đầu tư..."
                    className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-full text-xs w-full md:w-56 font-medium transition-all outline-none"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-full px-4 py-2 text-xs font-semibold outline-none cursor-pointer transition-all"
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                >
                  <option value="Toàn tỉnh">Toàn tỉnh</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <button 
                  onClick={handleExportImage}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-full text-xs font-bold transition-all shadow-lg shadow-indigo-100"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  {isExporting ? 'Đang xuất...' : 'Xuất ảnh báo cáo'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setActiveView('dashboard')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-all shadow-sm border border-slate-200"
              >
                Quay lại Dashboard
              </button>
            )}
          </div>
        </header>

        {/* Outer body view content wrapper */}
        <div className="flex-1 p-6">
          {activeView === 'dashboard' && (
            <main ref={dashboardRef} className="max-w-7xl mx-auto w-full space-y-6">
        {/* Card Chi tiết Cơ cấu Nguồn vốn - Full Width Top Row */}
        <div className="glass-card p-6 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500 border-slate-200 bg-gradient-to-br from-white to-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform duration-500">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Chi Tiết Các Nội Dung Về Nguồn Vốn</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Tính đến hết ngày 30/6/2026</p>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng cộng vốn đầu tư công của tỉnh</span>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-black text-indigo-600 font-mono">8.260.815</span>
                <span className="text-sm font-bold text-slate-500 uppercase">triệu đồng</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
            {/* Cột 1: Vốn năm 2026 Thủ tướng CP giao */}
            <div 
              onClick={() => setSelectedCapitalSource('pm_2026')}
              className="p-5 bg-gradient-to-br from-indigo-50/80 to-white hover:from-indigo-100/80 rounded-2xl border border-indigo-100 hover:border-indigo-300 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group/card"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] font-extrabold text-indigo-600 bg-indigo-100/80 px-2 py-0.5 rounded uppercase tracking-wider">Kế hoạch giao đầu năm</span>
                    <h4 className="text-sm font-extrabold text-indigo-950 mt-1.5 group-hover/card:text-indigo-600 transition-colors">Vốn năm 2026 Thủ tướng Chính phủ giao</h4>
                  </div>
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all duration-300 shadow-sm">
                    <Briefcase className="w-4 h-4" />
                  </div>
                </div>
                
                <div className="my-4 p-3.5 bg-white/90 rounded-xl border border-indigo-100/60 shadow-sm flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-500">Tổng quy mô vốn</span>
                  <div>
                    <span className="text-xl font-black text-indigo-900 font-mono">7.176.283</span>
                    <span className="text-xs font-bold text-indigo-600 ml-1">triệu VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-indigo-100/80 flex items-center justify-between text-xs font-extrabold text-indigo-600 group-hover/card:translate-x-0.5 transition-transform">
                <span>Xem chi tiết nguồn vốn</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Cột 2: Vốn kéo dài sang năm 2026 */}
            <div 
              onClick={() => setSelectedCapitalSource('carried_over')}
              className="p-5 bg-gradient-to-br from-amber-50/80 to-white hover:from-amber-100/80 rounded-2xl border border-amber-100 hover:border-amber-300 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group/card"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded uppercase tracking-wider">Kéo dài từ năm 2025</span>
                    <h4 className="text-sm font-extrabold text-amber-950 mt-1.5 group-hover/card:text-amber-600 transition-colors">Vốn kéo dài sang năm 2026</h4>
                  </div>
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl group-hover/card:bg-amber-600 group-hover/card:text-white transition-all duration-300 shadow-sm">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>

                <div className="my-4 p-3.5 bg-white/90 rounded-xl border border-amber-100/60 shadow-sm flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-500">Tổng quy mô vốn</span>
                  <div>
                    <span className="text-xl font-black text-amber-900 font-mono">664.532</span>
                    <span className="text-xs font-bold text-amber-600 ml-1">triệu VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-amber-100/80 flex items-center justify-between text-xs font-extrabold text-amber-700 group-hover/card:translate-x-0.5 transition-transform">
                <span>Xem chi tiết nguồn vốn</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>

            {/* Cột 3: Vốn hỗ trợ */}
            <div 
              onClick={() => setSelectedCapitalSource('support')}
              className="p-5 bg-gradient-to-br from-rose-50/80 to-white hover:from-rose-100/80 rounded-2xl border border-rose-100 hover:border-rose-300 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 group/card"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] font-extrabold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded uppercase tracking-wider">Hỗ trợ ngoài tỉnh</span>
                    <h4 className="text-sm font-extrabold text-rose-950 mt-1.5 group-hover/card:text-rose-600 transition-colors">Vốn hỗ trợ</h4>
                  </div>
                  <div className="p-2 bg-rose-100 text-rose-700 rounded-xl group-hover/card:bg-rose-600 group-hover/card:text-white transition-all duration-300 shadow-sm">
                    <Building2 className="w-4 h-4" />
                  </div>
                </div>

                <div className="my-4 p-3.5 bg-white/90 rounded-xl border border-rose-100/60 shadow-sm flex items-baseline justify-between">
                  <span className="text-xs font-semibold text-slate-500">Tổng quy mô vốn</span>
                  <div>
                    <span className="text-xl font-black text-rose-900 font-mono">420.000</span>
                    <span className="text-xs font-bold text-rose-600 ml-1">triệu VNĐ</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-rose-100/80 flex items-center justify-between text-xs font-extrabold text-rose-700 group-hover/card:translate-x-0.5 transition-transform">
                <span>Xem chi tiết nguồn vốn</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </div>

        {/* Card: Kết quả Giải Ngân - Full Width */}
        <div className="glass-card p-6 overflow-hidden flex flex-col group hover:shadow-2xl transition-all duration-500 border-emerald-100/60 bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-200 group-hover:scale-105 transition-transform duration-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Kết Quả Giải Ngân</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Tiến độ thực hiện và giải ngân vốn đầu tư công tỉnh Cao Bằng năm 2026</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200/60 shadow-sm">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider">Số liệu Live</span>
            </div>
          </div>

          {/* 5 Thẻ con xếp trên bảng điều khiển */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Thẻ 1: Khối lượng đã thực hiện */}
            <div 
              onClick={() => {
                setSelectedDisbursementCard('executed');
                setShowDisbursementModal(true);
              }}
              className="p-4 bg-white rounded-2xl border border-indigo-100 bg-indigo-50/10 shadow-sm hover:border-indigo-400 hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-2 group/card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                  Khối lượng đã thực hiện
                </span>
                <ChevronRight className="w-4 h-4 text-indigo-400 group-hover/card:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-black text-indigo-900 font-mono tracking-tight block">
                  {stats.rateExecuted.toFixed(1)}%
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 uppercase mt-0.5 block">
                  (~{formatVN(stats.executedVolume)} triệu VNĐ)
                </span>
              </div>
              <div className="pt-1 border-t border-indigo-50 text-[10px] font-bold text-indigo-600 flex items-center justify-between">
                <span>Xem chi tiết theo CĐT</span>
                <span>→</span>
              </div>
            </div>

            {/* Thẻ 2: Khối lượng đã nghiệm thu */}
            <div 
              onClick={() => {
                setSelectedDisbursementCard('accepted');
                setShowDisbursementModal(true);
              }}
              className="p-4 bg-white rounded-2xl border border-teal-100 bg-teal-50/10 shadow-sm hover:border-teal-400 hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-2 group/card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider block">
                  Khối lượng đã nghiệm thu
                </span>
                <ChevronRight className="w-4 h-4 text-teal-400 group-hover/card:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-black text-teal-900 font-mono tracking-tight block">
                  {stats.rateAccepted.toFixed(1)}%
                </span>
                <span className="text-[11px] font-semibold text-teal-600 uppercase mt-0.5 block">
                  (~{formatVN(stats.acceptedVolume)} triệu VNĐ)
                </span>
              </div>
              <div className="pt-1 border-t border-teal-50 text-[10px] font-bold text-teal-600 flex items-center justify-between">
                <span>Xem chi tiết theo CĐT</span>
                <span>→</span>
              </div>
            </div>

            {/* Thẻ 3: Số đã giải ngân */}
            <div 
              onClick={() => {
                setSelectedDisbursementCard('disbursed');
                setShowDisbursementModal(true);
              }}
              className="p-4 bg-white rounded-2xl border border-emerald-200/80 bg-emerald-50/20 shadow-sm hover:border-emerald-400 hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-2 group/card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider block">
                  Số đã giải ngân
                </span>
                <ChevronRight className="w-4 h-4 text-emerald-500 group-hover/card:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-black text-emerald-900 font-mono tracking-tight block">
                  {formatVN(stats.totalDis)}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 uppercase mt-0.5 block">triệu VNĐ (CĐT báo cáo)</span>
              </div>
              <div className="pt-1 border-t border-emerald-100/60 text-[10px] font-bold text-emerald-700 flex items-center justify-between">
                <span>Xem chi tiết theo CĐT</span>
                <span>→</span>
              </div>
            </div>

            {/* Thẻ 4: Số giải ngân đã được kho bạc xác nhận */}
            <div 
              onClick={() => {
                setSelectedDisbursementCard('treasury');
                setShowDisbursementModal(true);
              }}
              className="p-4 bg-white rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-sm hover:border-amber-400 hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-2 group/card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-amber-700 uppercase tracking-wider block">
                  Số giải ngân đã được KB xác nhận
                </span>
                <ChevronRight className="w-4 h-4 text-amber-500 group-hover/card:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-black text-amber-900 font-mono tracking-tight block">
                  {formatVN(stats.treasuryTotalDis)}
                </span>
                <span className="text-[11px] font-semibold text-amber-600 uppercase mt-0.5 block">triệu VNĐ (TABMIS KBNN)</span>
              </div>
              <div className="pt-1 border-t border-amber-100/60 text-[10px] font-bold text-amber-700 flex items-center justify-between">
                <span>Xem chi tiết theo CĐT</span>
                <span>→</span>
              </div>
            </div>

            {/* Thẻ 5: Số còn phải giải ngân */}
            <div 
              onClick={() => {
                setSelectedDisbursementCard('remaining');
                setShowDisbursementModal(true);
              }}
              className="p-4 bg-white rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-sm hover:border-rose-400 hover:shadow-md hover:scale-[1.01] cursor-pointer transition-all duration-300 flex flex-col justify-between space-y-2 group/card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider block">
                  Số còn phải giải ngân
                </span>
                <ChevronRight className="w-4 h-4 text-rose-500 group-hover/card:translate-x-0.5 transition-transform" />
              </div>
              <div>
                <span className="text-2xl lg:text-3xl font-black text-rose-900 font-mono tracking-tight block">
                  {formatVN(Math.max(0, stats.totalCapital - stats.totalDis))}
                </span>
                <span className="text-[11px] font-semibold text-rose-600 uppercase mt-0.5 block">
                  triệu VNĐ (= Vốn tỉnh - Đã GN)
                </span>
              </div>
              <div className="pt-1 border-t border-rose-100/60 text-[10px] font-bold text-rose-700 flex items-center justify-between">
                <span>Xem chi tiết theo CĐT</span>
                <span>→</span>
              </div>
            </div>
          </div>

          {/* Card tỷ lệ giải ngân theo các chỉ tiêu tổng hợp */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600" />
                Tỷ lệ giải ngân theo các chỉ tiêu tổng hợp
              </h4>

              {/* Chú thích giải thích thanh thực hiện, mốc hết tháng 6 và chỉ tiêu đăng ký tháng 7 */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-extrabold text-slate-600 bg-slate-50/90 px-3.5 py-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-2.5 rounded-full bg-emerald-500 flex items-center justify-end pr-0.5">
                    <ChevronRight className="w-2 h-2 text-white stroke-[3]" />
                  </div>
                  <span>Thực giải ngân T7</span>
                </div>
                <div className="hidden sm:block w-px h-3 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <div className="w-0.5 h-3 bg-amber-600 rounded-full" />
                  <span>Đã thực hiện hết T6</span>
                </div>
                <div className="hidden sm:block w-px h-3 bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <div className="w-3.5 h-2.5 rounded-xs bg-indigo-500/20 border-r-2 border-indigo-600" />
                  <span>Chỉ tiêu đăng ký T7</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Đường 1: Tỷ lệ giải ngân trên tổng vốn của tỉnh */}
              {(() => {
                const juneRate1 = (stats.juneDisbursed / (stats.totalCapital || 1)) * 100;
                const regRate1 = (stats.registeredCurrentMonth / (stats.totalCapital || 1)) * 100;
                const growthRate1 = stats.rateTotalCdt - juneRate1;
                return (
                  <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-extrabold text-slate-800">
                        1. Tỷ lệ giải ngân trên tổng vốn của tỉnh
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80" title={`Mức tăng từ T6 (${juneRate1.toFixed(1)}%) lên T7 (${stats.rateTotalCdt.toFixed(1)}%)`}>
                          +{growthRate1.toFixed(1)}% từ T6
                        </span>
                        <span className="font-black text-emerald-600 text-base">
                          {stats.rateTotalCdt.toFixed(1)}%
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium font-sans">
                          ({formatVN(stats.totalDis)} / {formatVN(stats.totalCapital)} triệu VNĐ)
                        </span>
                      </div>
                    </div>
                    <div className="relative mt-4 h-5 bg-slate-100 rounded-full overflow-visible border border-slate-200/80 p-0.5 flex items-center">
                      {/* Translucent Target Zone for Registered Amount */}
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-indigo-500/15 border-r-2 border-indigo-600 rounded-l-full transition-all duration-1000 flex items-center justify-end z-10"
                        style={{ width: `${Math.min(regRate1, 100)}%` }}
                        title={`Mục tiêu đăng ký T7: ${formatVN(stats.registeredCurrentMonth)} triệu VNĐ (${regRate1.toFixed(1)}%)`}
                      >
                        <span className="absolute -top-4 left-full -translate-x-1/2 text-[9px] font-mono font-black px-1.5 py-0.2 bg-indigo-600 text-white rounded-md shadow-2xs z-40 whitespace-nowrap pointer-events-none">
                          {regRate1.toFixed(1)}%
                        </span>
                      </div>

                      {/* Solid bar representing actual disbursed amount (T7) */}
                      <div 
                        className="relative h-full bg-gradient-to-r from-emerald-500 to-emerald-600 z-20 transition-all duration-1000 ease-out rounded-full shadow-xs flex items-center justify-end pr-0.5"
                        style={{ width: `${Math.min(stats.rateTotalCdt, 100)}%` }}
                        title={`Thực giải ngân T7: ${formatVN(stats.totalDis)} triệu VNĐ (${stats.rateTotalCdt.toFixed(1)}%)`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center text-white animate-pulse">
                          <ChevronRight className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </div>
                      </div>

                      {/* Clean Vertical Marker line for June End */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-30 pointer-events-none transition-all duration-1000 shadow-2xs"
                        style={{ left: `${Math.min(juneRate1, 100)}%` }}
                        title={`Đã thực hiện đến hết T6: ${formatVN(stats.juneDisbursed)} triệu VNĐ (${juneRate1.toFixed(1)}%)`}
                      >
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black px-1.5 py-0.2 bg-amber-600 text-white rounded-md shadow-2xs z-40 whitespace-nowrap">
                          {juneRate1.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Đường 2: Tỷ lệ giải ngân trên tổng vốn được Thủ tướng Chính phủ giao */}
              {(() => {
                const juneRate2 = (stats.juneDisbursed / 7176.283) * 100;
                const regRate2 = (stats.registeredCurrentMonth / 7176.283) * 100;
                const growthRate2 = stats.ratePM_Total - juneRate2;
                return (
                  <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-extrabold text-slate-800">
                        2. Tỷ lệ giải ngân trên tổng vốn được Thủ tướng Chính phủ giao
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/80" title={`Mức tăng từ T6 (${juneRate2.toFixed(1)}%) lên T7 (${stats.ratePM_Total.toFixed(1)}%)`}>
                          +{growthRate2.toFixed(1)}% từ T6
                        </span>
                        <span className="font-black text-indigo-600 text-base">
                          {stats.ratePM_Total.toFixed(1)}%
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium font-sans">
                          ({formatVN(stats.totalDis)} / 7.176.283 triệu VNĐ)
                        </span>
                      </div>
                    </div>
                    <div className="relative mt-4 h-5 bg-slate-100 rounded-full overflow-visible border border-slate-200/80 p-0.5 flex items-center">
                      {/* Translucent Target Zone for Registered Amount */}
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-indigo-500/15 border-r-2 border-indigo-600 rounded-l-full transition-all duration-1000 flex items-center justify-end z-10"
                        style={{ width: `${Math.min(regRate2, 100)}%` }}
                        title={`Mục tiêu đăng ký T7: ${formatVN(stats.registeredCurrentMonth)} triệu VNĐ (${regRate2.toFixed(1)}%)`}
                      >
                        <span className="absolute -top-4 left-full -translate-x-1/2 text-[9px] font-mono font-black px-1.5 py-0.2 bg-indigo-600 text-white rounded-md shadow-2xs z-40 whitespace-nowrap pointer-events-none">
                          {regRate2.toFixed(1)}%
                        </span>
                      </div>

                      {/* Solid bar representing actual disbursed amount */}
                      <div 
                        className="relative h-full bg-gradient-to-r from-indigo-500 to-indigo-600 z-20 transition-all duration-1000 ease-out rounded-full shadow-xs flex items-center justify-end pr-0.5"
                        style={{ width: `${Math.min(stats.ratePM_Total, 100)}%` }}
                        title={`Thực giải ngân T7: ${formatVN(stats.totalDis)} triệu VNĐ (${stats.ratePM_Total.toFixed(1)}%)`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center text-white animate-pulse">
                          <ChevronRight className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </div>
                      </div>

                      {/* Clean Vertical Marker line for June End */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-30 pointer-events-none transition-all duration-1000 shadow-2xs"
                        style={{ left: `${Math.min(juneRate2, 100)}%` }}
                        title={`Đã thực hiện đến hết T6: ${formatVN(stats.juneDisbursed)} triệu VNĐ (${juneRate2.toFixed(1)}%)`}
                      >
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black px-1.5 py-0.2 bg-amber-600 text-white rounded-md shadow-2xs z-40 whitespace-nowrap">
                          {juneRate2.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Đường 3: Tỷ lệ giải ngân trên tổng số Thủ tướng Chính phủ giao đã được tỉnh phân bổ chi tiết */}
              {(() => {
                const juneRate3 = (stats.juneDisbursed / (stats.pmAssigned || 1)) * 100;
                const regRate3 = (stats.registeredCurrentMonth / (stats.pmAssigned || 1)) * 100;
                const growthRate3 = stats.ratePM_AssignedDetailed - juneRate3;
                return (
                  <div className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span className="font-extrabold text-slate-800">
                        3. Tỷ lệ giải ngân trên tổng số Thủ tướng Chính phủ giao đã được tỉnh phân bổ chi tiết
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80" title={`Mức tăng từ T6 (${juneRate3.toFixed(1)}%) lên T7 (${stats.ratePM_AssignedDetailed.toFixed(1)}%)`}>
                          +{growthRate3.toFixed(1)}% từ T6
                        </span>
                        <span className="font-black text-amber-600 text-base">
                          {stats.ratePM_AssignedDetailed.toFixed(1)}%
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium font-sans">
                          ({formatVN(stats.totalDis)} / {formatVN(stats.pmAssigned)} triệu VNĐ)
                        </span>
                      </div>
                    </div>
                    <div className="relative mt-4 h-5 bg-slate-100 rounded-full overflow-visible border border-slate-200/80 p-0.5 flex items-center">
                      {/* Translucent Target Zone for Registered Amount */}
                      <div 
                        className="absolute top-0 bottom-0 left-0 bg-indigo-500/15 border-r-2 border-indigo-600 rounded-l-full transition-all duration-1000 flex items-center justify-end z-10"
                        style={{ width: `${Math.min(regRate3, 100)}%` }}
                        title={`Mục tiêu đăng ký T7: ${formatVN(stats.registeredCurrentMonth)} triệu VNĐ (${regRate3.toFixed(1)}%)`}
                      >
                        <span className="absolute -top-4 left-full -translate-x-1/2 text-[9px] font-mono font-black px-1.5 py-0.2 bg-indigo-600 text-white rounded-md shadow-2xs z-40 whitespace-nowrap pointer-events-none">
                          {regRate3.toFixed(1)}%
                        </span>
                      </div>

                      {/* Solid bar representing actual disbursed amount */}
                      <div 
                        className="relative h-full bg-gradient-to-r from-amber-500 to-amber-600 z-20 transition-all duration-1000 ease-out rounded-full shadow-xs flex items-center justify-end pr-0.5"
                        style={{ width: `${Math.min(stats.ratePM_AssignedDetailed, 100)}%` }}
                        title={`Thực giải ngân T7: ${formatVN(stats.totalDis)} triệu VNĐ (${stats.ratePM_AssignedDetailed.toFixed(1)}%)`}
                      >
                        <div className="w-3.5 h-3.5 rounded-full bg-white/25 flex items-center justify-center text-white animate-pulse">
                          <ChevronRight className="w-2.5 h-2.5 text-white stroke-[3]" />
                        </div>
                      </div>

                      {/* Clean Vertical Marker line for June End */}
                      <div 
                        className="absolute top-0 bottom-0 w-0.5 bg-amber-600 z-30 pointer-events-none transition-all duration-1000 shadow-2xs"
                        style={{ left: `${Math.min(juneRate3, 100)}%` }}
                        title={`Đã thực hiện đến hết T6: ${formatVN(stats.juneDisbursed)} triệu VNĐ (${juneRate3.toFixed(1)}%)`}
                      >
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-mono font-black px-1.5 py-0.2 bg-amber-600 text-white rounded-md shadow-2xs z-40 whitespace-nowrap">
                          {juneRate3.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </main>
    )}

          {/* THÔNG TIN DỰ ÁN (THÔNG TIN & KHAI BÁO DỰ ÁN MỚI) */}
          {activeView === 'add_project' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái: Bộ lọc chủ đầu tư & Danh sách dự án */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Danh sách dự án</h3>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {filteredInfoProjects.length}/{projects.length}
                      </span>
                    </div>

                    {/* Nút Thêm dự án */}
                    <button
                      type="button"
                      onClick={() => setIsAddingNewProject(true)}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border shadow-sm",
                        isAddingNewProject
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-indigo-100"
                          : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200/80"
                      )}
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Thêm dự án</span>
                    </button>

                    {/* Lọc theo Chủ đầu tư */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter className="w-3 h-3 text-indigo-500" />
                        Lọc theo Chủ đầu tư
                      </label>
                      <select 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-700 transition-all outline-none cursor-pointer"
                        value={infoOwnerFilter}
                        onChange={(e) => setInfoOwnerFilter(e.target.value)}
                      >
                        <option value="Tất cả chủ đầu tư">-- Tất cả chủ đầu tư ({projects.length} dự án) --</option>
                        {disburseOwnerOptions.map((owner) => {
                          const count = projects.filter(p => p.commune === owner || p.district === owner).length;
                          if (count === 0) return null;
                          return (
                            <option key={owner} value={owner}>
                              {owner} ({count} dự án)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Tìm kiếm nhanh */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm tên dự án..." 
                        className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-medium outline-none transition-all"
                        value={infoSearchQuery}
                        onChange={(e) => setInfoSearchQuery(e.target.value)}
                      />
                      {infoSearchQuery && (
                        <button 
                          type="button"
                          onClick={() => setInfoSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {filteredInfoProjects.length > 0 ? (
                      filteredInfoProjects.map((p) => {
                        const isSelected = !isAddingNewProject && (infoProjId === p.id || (!infoProjId && filteredInfoProjects[0]?.id === p.id));
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setIsAddingNewProject(false);
                              setInfoProjId(p.id);
                            }}
                            className={cn(
                              "w-full text-left p-3.5 rounded-2xl transition-all border text-xs flex flex-col gap-1.5",
                              isSelected 
                                ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-md shadow-indigo-100" 
                                : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                            )}
                          >
                            <span className="font-extrabold line-clamp-2">{p.name}</span>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                              <span className="truncate max-w-[200px]">{p.commune}</span>
                              <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{p.district}</span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-xs font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                        Không có dự án nào thỏa mãn bộ lọc
                      </div>
                    )}
                  </div>
                </div>

                {/* Cột phải: Form Khai báo dự án mới HOẶC Chi tiết Thông tin dự án */}
                <div className="lg:col-span-2 space-y-6">
                  {isAddingNewProject ? (
                    /* FORM THÊM DỰ ÁN MỚI */
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                      <form onSubmit={handleAddProjectSubmit}>
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/30 to-white flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                              <PlusCircle className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold text-slate-800">Thêm dự án đầu tư mới</h3>
                              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">Khai báo danh mục, cấp quản lý, tổng mức đầu tư & cơ cấu nguồn vốn</p>
                            </div>
                          </div>
                          {filteredInfoProjects.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingNewProject(false);
                                if (!infoProjId && filteredInfoProjects[0]) {
                                  setInfoProjId(filteredInfoProjects[0].id);
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                            >
                              Xem thông tin dự án
                            </button>
                          )}
                        </div>

                        <div className="p-6 space-y-5">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên dự án công trình</label>
                            <input 
                              type="text" 
                              placeholder="Ví dụ: Dự án cải tạo nâng cấp quốc lộ 4A tỉnh Cao Bằng"
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-xs font-semibold transition-all outline-none"
                              value={newProjName}
                              onChange={(e) => setNewProjName(e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Chủ đầu tư / Đơn vị quản lý</label>
                              <select 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-xs font-semibold transition-all outline-none cursor-pointer"
                                value={newProjDistrict}
                                onChange={(e) => setNewProjDistrict(e.target.value)}
                              >
                                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Lĩnh vực đầu tư</label>
                              <select 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-xs font-semibold transition-all outline-none cursor-pointer"
                                value={newProjCategory}
                                onChange={(e) => setNewProjCategory(e.target.value as any)}
                              >
                                <option value="Giao thông">Giao thông vận tải</option>
                                <option value="Nông nghiệp">Nông nghiệp & PTNT</option>
                                <option value="Y tế">Y tế, giáo dục, văn hóa</option>
                                <option value="Đô thị">Hạ tầng kỹ thuật đô thị</option>
                                <option value="Khác">Khác</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cấp quyết định đầu tư</label>
                              <select 
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-2xl text-xs font-semibold transition-all outline-none cursor-pointer"
                                value={newProjAuthority}
                                onChange={(e) => setNewProjAuthority(e.target.value as any)}
                              >
                                <option value="Trung ương">Cấp Trung ương</option>
                                <option value="Tỉnh">Cấp Tỉnh (UBND Tỉnh)</option>
                                <option value="Huyện">Cấp Huyện</option>
                                <option value="Xã">Cấp Xã</option>
                              </select>
                            </div>
                          </div>

                          {/* Khai báo 1: Tổng mức đầu tư dự toán */}
                          <div className="p-5 bg-slate-50/90 rounded-2xl border border-slate-200/90 space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block">
                                1. Tổng mức đầu tư dự toán (triệu VNĐ)
                              </label>
                              <input 
                                type="number" 
                                step="1"
                                placeholder="Ví dụ: 15000 (tương đương 15 tỷ đồng)"
                                className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-xs font-mono font-bold transition-all outline-none"
                                value={newProjTotalInv}
                                onChange={(e) => setNewProjTotalInv(e.target.value)}
                              />
                            </div>

                            {/* Cơ cấu nguồn vốn trong Tổng Mức Đầu Tư: NSTW, NSĐP hoặc Nguồn vốn khác */}
                            <div className="space-y-2 pt-2 border-t border-slate-200/60">
                              <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                <Wallet className="w-3.5 h-3.5 text-indigo-600" />
                                Cơ cấu nguồn vốn trong Tổng mức đầu tư (triệu VNĐ)
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-indigo-800 uppercase">Vốn NSTW</label>
                                  <input 
                                    type="number" 
                                    placeholder="Ví dụ: 9000"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold outline-none"
                                    value={newProjNSTW}
                                    onChange={(e) => setNewProjNSTW(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-emerald-800 uppercase">Vốn NSĐP</label>
                                  <input 
                                    type="number" 
                                    placeholder="Ví dụ: 4500"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold outline-none"
                                    value={newProjNSDP}
                                    onChange={(e) => setNewProjNSDP(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-amber-800 uppercase">Nguồn vốn khác</label>
                                  <input 
                                    type="number" 
                                    placeholder="Ví dụ: 1500"
                                    className="w-full px-3 py-2 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold outline-none"
                                    value={newProjTotalOther}
                                    onChange={(e) => setNewProjTotalOther(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Khai báo 2: Kế hoạch vốn giao mới */}
                          <div className="p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <label className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block">
                                2. Chi tiết kế hoạch vốn giao mới năm 2026 (triệu VNĐ)
                              </label>

                              {/* Tick chọn thuộc chương trình MTQG */}
                              <label className="flex items-center gap-2 px-3 py-1.5 bg-white border border-indigo-200 rounded-xl cursor-pointer text-xs font-bold text-indigo-900 shadow-2xs hover:bg-indigo-50 transition-all select-none">
                                <input 
                                  type="checkbox" 
                                  checked={newProjIsMTQG} 
                                  onChange={(e) => setNewProjIsMTQG(e.target.checked)}
                                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span>Thuộc Chương trình MTQG</span>
                              </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-indigo-800 uppercase">Vốn NSTW giao (triệu VNĐ)</label>
                                <input 
                                  type="number" 
                                  placeholder="0"
                                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold outline-none"
                                  value={newProjPMCap}
                                  onChange={(e) => setNewProjPMCap(e.target.value)}
                                />
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-emerald-800 uppercase">Vốn NSĐP giao (triệu VNĐ)</label>
                                <input 
                                  type="number" 
                                  placeholder="0"
                                  className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold outline-none"
                                  value={newProjProvCap}
                                  onChange={(e) => setNewProjProvCap(e.target.value)}
                                />
                              </div>
                            </div>

                            {/* Chi tiết CTMTQG nếu được tick chọn */}
                            {newProjIsMTQG && (
                              <div className="p-4 bg-white rounded-2xl border border-indigo-200 space-y-4 animate-in fade-in duration-200 shadow-2xs">
                                <div className="space-y-2">
                                  <label className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                                    Chọn 1 trong 4 Chương trình Mục tiêu Quốc gia:
                                  </label>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {[
                                      { id: 'Chương trình 1: Phát triển KTXH vùng đồng bào DTTS & MN', label: 'Chương trình 1: Phát triển KTXH vùng đồng bào DTTS & MN' },
                                      { id: 'Chương trình 2: Xây dựng Nông thôn mới', label: 'Chương trình 2: Xây dựng Nông thôn mới' },
                                      { id: 'Chương trình 3: Giảm nghèo bền vững', label: 'Chương trình 3: Giảm nghèo bền vững' },
                                      { id: 'Chương trình 4: Phát triển Văn hóa - Xã hội', label: 'Chương trình 4: Phát triển Văn hóa - Xã hội' }
                                    ].map((prog) => (
                                      <label 
                                        key={prog.id} 
                                        onClick={() => setNewProjMTQGType(prog.id)}
                                        className={cn(
                                          "flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-bold cursor-pointer transition-all",
                                          newProjMTQGType === prog.id 
                                            ? "bg-indigo-50 border-indigo-500 text-indigo-900 shadow-2xs ring-1 ring-indigo-500" 
                                            : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                                        )}
                                      >
                                        <input 
                                          type="radio" 
                                          name="ctmtqgTypeOption" 
                                          value={prog.id}
                                          checked={newProjMTQGType === prog.id}
                                          onChange={() => setNewProjMTQGType(prog.id)}
                                          className="text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="line-clamp-2">{prog.label}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-slate-100">
                                  <label className="text-[10px] font-extrabold text-indigo-900 uppercase tracking-wider block">
                                    Chi tiết vốn CTMTQG trong Vốn giao (triệu VNĐ)
                                  </label>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-indigo-700 uppercase">Gồm: CTMTQG NSTW</label>
                                      <input 
                                        type="number" 
                                        placeholder="Ví dụ: 2000"
                                        className="w-full px-3 py-2 bg-indigo-50/50 border border-indigo-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold outline-none"
                                        value={newProjCTMTQG_NSTW}
                                        onChange={(e) => setNewProjCTMTQG_NSTW(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-bold text-emerald-700 uppercase">Gồm: CTMTQG NSĐP</label>
                                      <input 
                                        type="number" 
                                        placeholder="Ví dụ: 1000"
                                        className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-200 focus:border-emerald-500 rounded-xl text-xs font-mono font-bold outline-none"
                                        value={newProjCTMTQG_NSDP}
                                        onChange={(e) => setNewProjCTMTQG_NSDP(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái triển khai ban đầu</label>
                            <div className="flex gap-4">
                              {['Đúng tiến độ', 'Chậm tiến độ', 'Nghiêm trọng'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setNewProjStatus(st as any)}
                                  className={cn(
                                    "px-4 py-2.5 rounded-xl text-xs font-bold transition-all border",
                                    newProjStatus === st 
                                      ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100" 
                                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
                                  )}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                          <button 
                            type="button" 
                            onClick={() => setIsAddingNewProject(false)}
                            className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
                          >
                            Hủy bỏ
                          </button>
                          <button 
                            type="submit" 
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                          >
                            Khởi tạo dự án
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* CHI TIẾT THÔNG TIN DỰ ÁN */
                    (() => {
                      const selProj = projects.find(p => p.id === infoProjId) || filteredInfoProjects[0] || projects[0];
                      if (!selProj) return null;

                      const totalAssignedPlan = selProj.pmCapital + selProj.provinceCapital + selProj.carriedOverPMCapital + selProj.carriedOverProvinceCapital;
                      const disburseRate = totalAssignedPlan > 0 ? (selProj.disbursed / totalAssignedPlan * 100).toFixed(1) : '0.0';
                      const invBreakdown = getProjectInvestmentBreakdown(selProj);

                      return (
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-6 p-6">
                          {/* Header Thông tin Dự án */}
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
                            <div className="space-y-2">
                              <h2 className="text-base font-extrabold text-slate-900 leading-snug">{selProj.name}</h2>
                              <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span>Chủ đầu tư: <strong className="text-slate-800">{selProj.commune}</strong></span>
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setSelectedProject(selProj)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                              >
                                <Info className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Xem Modal chi tiết</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveView('enter_disbursement');
                                  handleSelectDisbursementProject(selProj.id);
                                }}
                                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                              >
                                <DollarSign className="w-3.5 h-3.5" />
                                <span>Cập nhật giải ngân</span>
                              </button>
                            </div>
                          </div>

                          {/* Stats Overview */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng mức đầu tư</p>
                              <p className="text-base font-black text-slate-800 font-mono mt-1">{formatVN(invBreakdown.total)} <span className="text-[10px] font-normal text-slate-500">triệu</span></p>
                            </div>

                            <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/60">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Kế hoạch vốn 2026</p>
                              <p className="text-base font-black text-indigo-900 font-mono mt-1">{formatVN(selProj.pmCapital + selProj.provinceCapital)} <span className="text-[10px] font-normal text-indigo-600">triệu</span></p>
                            </div>

                            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100/60">
                              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Đã giải ngân T7</p>
                              <p className="text-base font-black text-emerald-900 font-mono mt-1">{formatVN(selProj.disbursed)} <span className="text-[10px] font-normal text-emerald-600">triệu</span></p>
                            </div>

                            <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-100/60">
                              <p className="text-[10px] font-bold text-teal-600 uppercase tracking-wider">Tỷ lệ giải ngân</p>
                              <p className="text-base font-black text-teal-900 font-mono mt-1">{disburseRate}%</p>
                            </div>
                          </div>

                          {/* Chi Tiết Kế Hoạch Vốn Giao Mới & Thông Tin Giải Ngân, Đăng Ký Giải Ngân */}
                          {(() => {
                            const assignedBreakdown = getProjectAssignedCapitalBreakdown(selProj);
                            const pmCap = selProj.pmCapital || 0;
                            const provCap = selProj.provinceCapital || 0;
                            const carriedPM = selProj.carriedOverPMCapital || 0;
                            const carriedProv = selProj.carriedOverProvinceCapital || 0;
                            const totalAssignedPlan = pmCap + provCap + carriedPM + carriedProv || selProj.assignedCapital || 0;
                            const cdtDisbursed = selProj.disbursed || 0;
                            const treasuryDisbursed = selProj.treasuryDisbursed || 0;
                            const cdtRate = totalAssignedPlan > 0 ? (cdtDisbursed / totalAssignedPlan) * 100 : 0;
                            const treasuryRate = totalAssignedPlan > 0 ? (treasuryDisbursed / totalAssignedPlan) * 100 : 0;

                            return (
                              <div className="space-y-6">
                                {/* Kế hoạch vốn giao mới năm 2026 */}
                                <div className="p-5 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest bg-white border border-indigo-200 px-2.5 py-1 rounded-lg">
                                        Kế hoạch vốn giao mới năm 2026
                                      </span>
                                      {assignedBreakdown.isMTQG && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-600 text-white text-[10px] font-extrabold rounded-lg">
                                          <CheckSquare className="w-3 h-3" />
                                          Thuộc CTMTQG
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-xs font-mono font-black text-indigo-900">
                                      Tổng vốn đã giao: {formatVN(assignedBreakdown.totalAssigned)} triệu VNĐ
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-3.5 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-1.5">
                                      <div className="flex justify-between items-center border-b border-indigo-50 pb-1">
                                        <span className="text-xs font-bold text-indigo-900">Vốn NSTW giao</span>
                                        <span className="text-xs font-mono font-black text-indigo-700">{formatVN(assignedBreakdown.nstw)} triệu</span>
                                      </div>
                                      {assignedBreakdown.isMTQG && (
                                        <div className="flex justify-between items-center text-xs text-indigo-800 bg-indigo-50/50 p-2 rounded-lg">
                                          <span className="font-bold text-[11px]">Gồm CTMTQG NSTW:</span>
                                          <span className="font-mono font-black">{formatVN(assignedBreakdown.ctmtqgNstw)} triệu</span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="p-3.5 bg-white rounded-xl border border-emerald-100 shadow-2xs space-y-1.5">
                                      <div className="flex justify-between items-center border-b border-emerald-50 pb-1">
                                        <span className="text-xs font-bold text-emerald-900">Vốn NSĐP giao</span>
                                        <span className="text-xs font-mono font-black text-emerald-700">{formatVN(assignedBreakdown.nsdp)} triệu</span>
                                      </div>
                                      {assignedBreakdown.isMTQG && (
                                        <div className="flex justify-between items-center text-xs text-emerald-800 bg-emerald-50/50 p-2 rounded-lg">
                                          <span className="font-bold text-[11px]">Gồm CTMTQG NSĐP:</span>
                                          <span className="font-mono font-black">{formatVN(assignedBreakdown.ctmtqgNsdp)} triệu</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {assignedBreakdown.isMTQG && (
                                    <div className="p-3 bg-white border border-indigo-200/80 rounded-xl flex items-center justify-between text-xs">
                                      <div className="flex items-center gap-2">
                                        <Award className="w-4 h-4 text-indigo-600 shrink-0" />
                                        <span className="font-extrabold text-indigo-900">{assignedBreakdown.mtqgType}</span>
                                      </div>
                                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                        Tổng CTMTQG: {formatVN(assignedBreakdown.ctmtqgTotal)} triệu
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Thông tin Giải ngân Kho bạc & Đăng ký nhu cầu giải ngân */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                  {/* Khối Giải ngân thực hiện */}
                                  <div className="p-5 bg-gradient-to-br from-indigo-50/50 via-slate-50 to-emerald-50/30 rounded-2xl border border-indigo-100 space-y-3">
                                    <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-indigo-600" />
                                      Thông tin Giải ngân thực hiện
                                    </h4>
                                    <div className="space-y-3 text-xs">
                                      <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-600 font-bold">CĐT Báo cáo giải ngân:</span>
                                          <span className="font-mono font-black text-indigo-700">{formatVN(cdtDisbursed)} triệu</span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, cdtRate))}%` }} />
                                          </div>
                                          <span className="text-[10px] font-extrabold text-indigo-600">{cdtRate.toFixed(1)}%</span>
                                        </div>
                                      </div>

                                      <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
                                        <div className="flex justify-between items-center">
                                          <span className="text-slate-600 font-bold">Kho bạc Nhà nước đối chiếu ({selProj.treasuryReconciliationDate || '16/07/2026'}):</span>
                                          <span className="font-mono font-black text-rose-600">{formatVN(treasuryDisbursed)} triệu</span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1">
                                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${Math.min(100, Math.max(0, treasuryRate))}%` }} />
                                          </div>
                                          <span className="text-[10px] font-extrabold text-rose-600">{treasuryRate.toFixed(1)}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Khối Đăng ký nhu cầu vốn giải ngân */}
                                  <div className="p-5 bg-gradient-to-br from-teal-50/50 via-slate-50 to-emerald-50/40 rounded-2xl border border-teal-100 space-y-3">
                                    <h4 className="text-xs font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-teal-600" />
                                      Thông tin Đăng ký nhu cầu vốn giải ngân
                                    </h4>
                                    <div className="space-y-3 text-xs">
                                      <div className="p-3 bg-white rounded-xl border border-teal-100 shadow-2xs flex justify-between items-center">
                                        <div>
                                          <p className="text-[10px] font-extrabold text-teal-700 uppercase">Đăng ký tháng hiện tại (Tháng 7)</p>
                                          <p className="text-xs font-medium text-slate-500 mt-0.5">Nhu cầu đăng ký giải ngân</p>
                                        </div>
                                        <span className="text-sm font-mono font-black text-teal-900">{formatVN(selProj.registeredCurrentMonth || 0)} <span className="text-[10px] font-normal text-teal-600">triệu</span></span>
                                      </div>

                                      <div className="p-3 bg-white rounded-xl border border-teal-100 shadow-2xs flex justify-between items-center">
                                        <div>
                                          <p className="text-[10px] font-extrabold text-indigo-700 uppercase">Đăng ký tháng tiếp theo (Tháng 8)</p>
                                          <p className="text-xs font-medium text-slate-500 mt-0.5">Kế hoạch đăng ký giải ngân</p>
                                        </div>
                                        <span className="text-sm font-mono font-black text-indigo-900">{formatVN(selProj.registeredNextMonth || 0)} <span className="text-[10px] font-normal text-indigo-600">triệu</span></span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QUẢN LÝ KHÓ KHĂN, VƯỚNG MẮC DỰ ÁN */}
          {activeView === 'issues' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Cột trái: Bộ lọc chủ đầu tư & Danh sách dự án */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Danh sách dự án</h3>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {filteredIssuesProjects.length}/{projects.length}
                      </span>
                    </div>

                    {/* Lọc theo Chủ đầu tư */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter className="w-3 h-3 text-indigo-500" />
                        Lọc theo Chủ đầu tư
                      </label>
                      <select
                        value={issuesOwnerFilter}
                        onChange={(e) => setIssuesOwnerFilter(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                      >
                        <option value="Tất cả chủ đầu tư">Tất cả chủ đầu tư ({projects.length})</option>
                        {disburseOwnerOptions.map((owner) => {
                          const count = projects.filter(p => p.commune === owner || p.district === owner).length;
                          return (
                            <option key={owner} value={owner}>
                              {owner} ({count} dự án)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Tìm kiếm nhanh dự án */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Tìm tên dự án..."
                        value={issuesSearchQuery}
                        onChange={(e) => setIssuesSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-medium text-slate-700 outline-none transition-all"
                      />
                    </div>

                    {/* Toggle Lọc dự án có vướng mắc */}
                    <button
                      type="button"
                      onClick={() => setIssuesOnlyWithProblems(!issuesOnlyWithProblems)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all border",
                        issuesOnlyWithProblems 
                          ? "bg-rose-50 border-rose-200 text-rose-700"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      <span className="flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                        Chỉ hiện dự án có vướng mắc
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white font-mono font-bold border border-slate-200">
                        {projects.filter(p => p.difficulty && p.difficulty.trim().length > 0).length}
                      </span>
                    </button>
                  </div>

                  {/* Danh sách cuộn dự án */}
                  <div className="max-h-[520px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredIssuesProjects.length > 0 ? (
                      filteredIssuesProjects.map((p) => {
                        const isSelected = issuesProjId === p.id || (!issuesProjId && filteredIssuesProjects[0]?.id === p.id);
                        const hasProblem = p.difficulty && p.difficulty.trim().length > 0;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => handleSelectIssuesProject(p.id)}
                            className={cn(
                              "w-full text-left p-3.5 rounded-2xl transition-all border text-xs flex flex-col gap-1.5 relative overflow-hidden",
                              isSelected 
                                ? "bg-amber-50/80 border-amber-300 text-amber-950 shadow-md shadow-amber-100/50 ring-2 ring-amber-400/20" 
                                : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                            )}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <span className="font-extrabold line-clamp-2 leading-snug">{p.name}</span>
                              {hasProblem ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-black shrink-0 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Có vướng mắc
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold shrink-0">
                                  Bình thường
                                </span>
                              )}
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold mt-1">
                              <span className="truncate max-w-[180px]">{p.commune}</span>
                              <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{p.district}</span>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-xs font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                        Không có dự án nào thỏa mãn bộ lọc
                      </div>
                    )}
                  </div>
                </div>

                {/* Cột phải: Thẻ hiển thị & Cập nhật Khó khăn, vướng mắc */}
                <div className="lg:col-span-2 space-y-6">
                  {(() => {
                    const selProj = projects.find(p => p.id === issuesProjId) || filteredIssuesProjects[0] || projects[0];
                    if (!selProj) {
                      return (
                        <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center text-slate-400 text-sm">
                          Vui lòng chọn một dự án từ danh sách bên trái.
                        </div>
                      );
                    }

                    return (
                      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-0">
                        {/* Header Thẻ Dự án */}
                        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-amber-50/40 via-white to-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-lg">
                                {selProj.commune}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                {selProj.district}
                              </span>
                            </div>
                            <h3 className="text-base font-extrabold text-slate-900 leading-snug">{selProj.name}</h3>
                          </div>
                          <div className="shrink-0 flex items-center gap-2 bg-white px-3 py-2 rounded-2xl border border-slate-200 shadow-xs">
                            <div className="text-right">
                              <p className="text-[9px] font-bold text-slate-400 uppercase">Tổng mức đầu tư</p>
                              <p className="text-xs font-black font-mono text-indigo-700">{formatVN(selProj.totalInvestment)} tr</p>
                            </div>
                          </div>
                        </div>

                        {/* Form Cập nhật Vướng mắc & Giải pháp */}
                        <form onSubmit={handleSaveIssuesSubmit} className="p-6 space-y-5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Phân loại vướng mắc */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Loại vướng mắc
                              </label>
                              <select
                                value={issuesType}
                                onChange={(e) => setIssuesType(e.target.value)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                              >
                                <option value="Giải phóng mặt bằng">Giải phóng mặt bằng</option>
                                <option value="Nguồn vốn">Nguồn vốn</option>
                                <option value="Thủ tục hành chính">Thủ tục hành chính</option>
                                <option value="Vật liệu xây dựng">Vật liệu xây dựng</option>
                                <option value="Khác">Khác</option>
                              </select>
                            </div>

                            {/* Cấp thẩm quyền giải quyết */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Cấp giải quyết
                              </label>
                              <select
                                value={issuesAuthorityLevel}
                                onChange={(e) => setIssuesAuthorityLevel(e.target.value as any)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                              >
                                <option value="Trung ương">Trung ương</option>
                                <option value="Tỉnh">Tỉnh</option>
                                <option value="Huyện">Huyện</option>
                                <option value="Xã">Xã</option>
                              </select>
                            </div>

                            {/* Đánh giá tiến độ */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                Đánh giá chung
                              </label>
                              <select
                                value={issuesStatus}
                                onChange={(e) => setIssuesStatus(e.target.value as any)}
                                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-xl text-xs font-semibold text-slate-700 outline-none transition-all"
                              >
                                <option value="Có vướng mắc">Có vướng mắc</option>
                                <option value="Chậm tiến độ">Chậm tiến độ</option>
                                <option value="Đúng tiến độ">Đúng tiến độ</option>
                              </select>
                            </div>
                          </div>

                          {/* Nội dung khó khăn, vướng mắc */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                              Nội dung Khó khăn, vướng mắc
                            </label>
                            <textarea
                              rows={4}
                              placeholder="Nhập chi tiết các vướng mắc về mặt bằng, giải tỏa, vật liệu, thủ tục phê duyệt, năng lực nhà thầu..."
                              value={issuesDifficulty}
                              onChange={(e) => setIssuesDifficulty(e.target.value)}
                              className="w-full p-4 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-500 rounded-2xl text-xs font-medium text-slate-800 leading-relaxed outline-none transition-all"
                            />
                          </div>

                          {/* Giải pháp, đề xuất kiến nghị */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />
                              Giải pháp, đề xuất kiến nghị
                            </label>
                            <textarea
                              rows={4}
                              placeholder="Nhập đề xuất kiến nghị đối với UBND tỉnh, các Sở ngành hoặc Cấp thẩm quyền giải quyết..."
                              value={issuesSolution}
                              onChange={(e) => setIssuesSolution(e.target.value)}
                              className="w-full p-4 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 rounded-2xl text-xs font-medium text-slate-800 leading-relaxed outline-none transition-all"
                            />
                          </div>

                          {/* Nút lưu */}
                          <div className="pt-2 flex justify-end gap-3">
                            <button
                              type="submit"
                              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-extrabold shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Lưu thông tin vướng mắc
                            </button>
                          </div>
                        </form>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* XẾP HẠNG GIẢI NGÂN CHỦ ĐẦU TƯ */}
          {activeView === 'disbursement_ranking' && (
            <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
              
              {/* Top Stats Overview Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg border border-indigo-800/40 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Trophy className="w-20 h-20 text-indigo-300" />
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Tổng số Chủ Đầu Tư</p>
                  <p className="text-2xl font-black font-mono mt-1 text-white">{rankingSummaryStats.totalOwners} <span className="text-xs font-normal text-indigo-200">đơn vị</span></p>
                  <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-indigo-200">
                    <span className="px-2.5 py-0.5 rounded-full bg-indigo-800/80">Toàn tỉnh Cao Bằng</span>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tỷ Lệ Giải Ngân TB</span>
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl">
                      <Building2 className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-2xl font-black font-mono text-indigo-600">{rankingSummaryStats.avgOverallRate.toFixed(1)}%</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-1">Trung bình trên tất cả chủ đầu tư</p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng Đã Giải Ngân</span>
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-xl font-black font-mono text-emerald-600">{formatVN(rankingSummaryStats.totalDisbursedAll)}</p>
                  <p className="text-[10px] font-medium text-slate-500 mt-1">/ {formatVN(rankingSummaryStats.totalCapitalAll)} triệu VNĐ KH vốn</p>
                </div>

                <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phân loại tiến độ</span>
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div 
                      onClick={() => setRankingTierFilter(rankingTierFilter === 'high' ? 'all' : 'high')}
                      className={cn(
                        "p-2.5 rounded-2xl border cursor-pointer transition-all",
                        rankingTierFilter === 'high' ? "bg-emerald-100 border-emerald-400 ring-2 ring-emerald-400/20" : "bg-emerald-50 border-emerald-100 hover:border-emerald-300"
                      )}
                    >
                      <p className="text-[9px] font-bold uppercase text-emerald-700">Xuất sắc (≥80%)</p>
                      <p className="text-base font-black text-emerald-800 mt-0.5">{rankingSummaryStats.highPerformers} <span className="text-[10px] font-normal">CĐT</span></p>
                    </div>
                    <div 
                      onClick={() => setRankingTierFilter(rankingTierFilter === 'low' ? 'all' : 'low')}
                      className={cn(
                        "p-2.5 rounded-2xl border cursor-pointer transition-all",
                        rankingTierFilter === 'low' ? "bg-rose-100 border-rose-400 ring-2 ring-rose-400/20" : "bg-rose-50 border-rose-100 hover:border-rose-300"
                      )}
                    >
                      <p className="text-[9px] font-bold uppercase text-rose-700">Chậm (&lt;50%)</p>
                      <p className="text-base font-black text-rose-800 mt-0.5">{rankingSummaryStats.lowPerformers} <span className="text-[10px] font-normal">CĐT</span></p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs and Top 3 Leaderboard Spotlight */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                      <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-tight">Xếp Hạng Giải Ngân Chủ Đầu Tư</h3>
                      <p className="text-xs text-slate-500 font-medium">Bảng thứ tự giải ngân được sắp xếp từ cao xuống thấp</p>
                    </div>
                  </div>
                </div>

                {/* Filters & Controls */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                  <div className="relative w-full md:w-80">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm chủ đầu tư..."
                      value={rankingSearch}
                      onChange={(e) => setRankingSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-xl text-xs font-semibold outline-none transition-all"
                    />
                    {rankingSearch && (
                      <button onClick={() => setRankingSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                    {/* Tier Filter */}
                    <select
                      value={rankingTierFilter}
                      onChange={(e) => setRankingTierFilter(e.target.value as any)}
                      className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                      <option value="all">Tất cả tỷ lệ giải ngân</option>
                      <option value="high">Xuất sắc (≥ 80%)</option>
                      <option value="medium">Khá / Trung bình (50% - 79%)</option>
                      <option value="low">Chậm / Cần đôn đốc (&lt; 50%)</option>
                    </select>

                    {/* Sort Order */}
                    <select
                      value={rankingSort}
                      onChange={(e) => setRankingSort(e.target.value as any)}
                      className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    >
                      <option value="rate_desc">Tỷ lệ: Từ Cao đến Thấp ↓</option>
                      <option value="rate_asc">Tỷ lệ: Từ Thấp đến Cao ↑</option>
                      <option value="capital_desc">Kế hoạch vốn: Lớn nhất</option>
                      <option value="name_asc">Tên chủ đầu tư: A - Z</option>
                    </select>
                  </div>
                </div>

                {/* Main Ranking Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80">
                        <th className="px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-center w-16">
                          Hạng
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                          Chủ Đầu Tư
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-center">
                          Số Dự Án
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-right">
                          Kế Hoạch Vốn
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-right">
                          Đã Giải Ngân
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 w-48">
                          Tỷ Lệ Giải Ngân
                        </th>
                        <th className="px-5 py-3.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 text-center">
                          Thao Tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRankings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400 text-xs font-semibold">
                            Không tìm thấy chủ đầu tư phù hợp với điều kiện lọc
                          </td>
                        </tr>
                      ) : (
                        filteredRankings.map((item, idx) => {
                          const rank = idx + 1;
                          const isTop3 = rank <= 3;
                          return (
                            <tr
                              key={item.name}
                              onClick={() => setRankingSelectedOwner(item)}
                              className={cn(
                                "hover:bg-indigo-50/50 cursor-pointer transition-colors group",
                                isTop3 && rank === 1 ? "bg-amber-50/20" : isTop3 && rank === 2 ? "bg-slate-50/30" : isTop3 && rank === 3 ? "bg-amber-100/10" : ""
                              )}
                            >
                              {/* Rank */}
                              <td className="px-5 py-4 text-center">
                                {rank === 1 ? (
                                  <span className="w-7 h-7 mx-auto rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                                    1
                                  </span>
                                ) : rank === 2 ? (
                                  <span className="w-7 h-7 mx-auto rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 text-white font-black text-xs flex items-center justify-center shadow-md">
                                    2
                                  </span>
                                ) : rank === 3 ? (
                                  <span className="w-7 h-7 mx-auto rounded-xl bg-gradient-to-br from-amber-700 to-amber-900 text-white font-black text-xs flex items-center justify-center shadow-md">
                                    3
                                  </span>
                                ) : (
                                  <span className="text-xs font-extrabold text-slate-400">
                                    #{rank}
                                  </span>
                                )}
                              </td>

                              {/* Owner Name */}
                              <td className="px-5 py-4">
                                <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                  {item.name}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  Cập nhật: {item.lastReported}
                                </div>
                              </td>

                              {/* Project Count */}
                              <td className="px-5 py-4 text-center">
                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                                  {item.projectCount} DA
                                </span>
                              </td>

                              {/* Capital Plan */}
                              <td className="px-5 py-4 text-right">
                                <div className="text-xs font-mono font-bold text-slate-800">
                                  {formatVN(item.totalCapital)}
                                </div>
                                <div className="text-[9px] text-slate-400">triệu VNĐ</div>
                              </td>

                              {/* Disbursed */}
                              <td className="px-5 py-4 text-right">
                                <div className="text-xs font-mono font-bold text-emerald-700">
                                  {formatVN(item.disbursed)}
                                </div>
                                <div className="text-[9px] text-slate-400">
                                  KB: {formatVN(item.treasuryDisbursed)} triệu
                                </div>
                              </td>

                              {/* Rate % Bar */}
                              <td className="px-5 py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className={cn(
                                      "text-xs font-black font-mono",
                                      item.rate >= 80 ? "text-emerald-600" : item.rate >= 50 ? "text-amber-600" : "text-rose-600"
                                    )}>
                                      {item.rate.toFixed(1)}%
                                    </span>
                                    <span className={cn(
                                      "text-[9px] font-bold px-1.5 py-0.5 rounded",
                                      item.rate >= 80 ? "bg-emerald-100 text-emerald-800" : item.rate >= 50 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                    )}>
                                      {item.rate >= 80 ? "Xuất sắc" : item.rate >= 50 ? "Khá/TB" : "Chậm"}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        "h-full transition-all duration-500 rounded-full",
                                        item.rate >= 80 ? "bg-emerald-500" : item.rate >= 50 ? "bg-amber-500" : "bg-rose-500"
                                      )}
                                      style={{ width: `${Math.min(100, Math.max(0, item.rate))}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </td>

                              {/* View Details Button */}
                              <td className="px-5 py-4 text-center">
                                <button
                                  onClick={() => setRankingSelectedOwner(item)}
                                  className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 mx-auto"
                                >
                                  <span>Chi tiết</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Owner Projects Detail Modal */}
              {rankingSelectedOwner && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
                    {/* Modal Header */}
                    <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-amber-400 font-mono">
                            Giải ngân: {rankingSelectedOwner.rate.toFixed(1)}%
                          </span>
                        </div>
                        <h3 className="text-base md:text-lg font-extrabold mt-1">{rankingSelectedOwner.name}</h3>
                      </div>
                      <button
                        onClick={() => setRankingSelectedOwner(null)}
                        className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Modal Content */}
                    <div className="p-6 overflow-y-auto space-y-6 flex-1">
                      {/* Owner Stats Row */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-bold text-slate-400 uppercase">Tổng KH vốn</p>
                          <p className="text-sm font-black font-mono text-slate-800 mt-0.5">{formatVN(rankingSelectedOwner.totalCapital)} <span className="text-[10px] text-slate-400 font-normal">triệu</span></p>
                        </div>
                        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] font-bold text-emerald-700 uppercase">Đã giải ngân</p>
                          <p className="text-sm font-black font-mono text-emerald-800 mt-0.5">{formatVN(rankingSelectedOwner.disbursed)} <span className="text-[10px] text-emerald-600 font-normal">triệu</span></p>
                        </div>
                        <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                          <p className="text-[10px] font-bold text-indigo-700 uppercase">Đối chiếu Kho bạc</p>
                          <p className="text-sm font-black font-mono text-indigo-800 mt-0.5">{formatVN(rankingSelectedOwner.treasuryDisbursed)} <span className="text-[10px] text-indigo-600 font-normal">triệu</span></p>
                        </div>
                        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                          <p className="text-[10px] font-bold text-amber-700 uppercase">Tổng số dự án</p>
                          <p className="text-sm font-black font-mono text-amber-800 mt-0.5">{rankingSelectedOwner.projects.length} <span className="text-[10px] text-amber-600 font-normal">dự án</span></p>
                        </div>
                      </div>

                      {/* Project List managed by this owner */}
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-3">
                          Danh Sách Các Dự Án Thuộc Chủ Đầu Tư ({rankingSelectedOwner.projects.length})
                        </h4>

                        {rankingSelectedOwner.projects.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            Chưa có dữ liệu dự án chi tiết được khai báo riêng cho đơn vị này
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {rankingSelectedOwner.projects.map((p) => {
                              const pCap = p.provinceCapital + p.pmCapital + p.carriedOverPMCapital + p.carriedOverProvinceCapital;
                              const pRate = pCap > 0 ? ((p.disbursed / pCap) * 100).toFixed(1) : '0.0';
                              const invB = getProjectInvestmentBreakdown(p);
                              return (
                                <div 
                                  key={p.id} 
                                  onClick={() => setSelectedProject(p)}
                                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-300 hover:shadow-md cursor-pointer transition-all group"
                                >
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                        {p.category}
                                      </span>
                                      <span className={cn(
                                        "text-[10px] font-bold px-2 py-0.5 rounded",
                                        p.status === 'Đúng tiến độ' ? "bg-emerald-100 text-emerald-800" :
                                        p.status === 'Chậm tiến độ' ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                                      )}>
                                        {p.status}
                                      </span>
                                    </div>
                                    <h5 className="text-xs font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{p.name}</h5>
                                    
                                    {/* TMĐƯ Quick Breakdown Badges */}
                                    <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                      <span className="font-bold text-slate-500">
                                        TMĐƯ: <strong className="text-slate-800">{formatVN(invB.total)} tr</strong>
                                      </span>
                                      <span className="text-slate-300">•</span>
                                      <span className="text-indigo-700 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">
                                        NSTW: {formatVN(invB.nstw)} tr (CTMTQG: {formatVN(invB.ctmtqgNstw)} tr)
                                      </span>
                                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                        NSĐP: {formatVN(invB.nsdp)} tr (CTMTQG: {formatVN(invB.ctmtqgNsdp)} tr)
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                                    <div className="text-right">
                                      <p className="text-[10px] text-slate-400 font-medium">KH Vốn 2026</p>
                                      <p className="text-xs font-mono font-bold text-slate-700">{formatVN(pCap)} tr</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-slate-400 font-medium">Giải ngân</p>
                                      <p className="text-xs font-mono font-bold text-emerald-600">{formatVN(p.disbursed)} tr</p>
                                    </div>
                                    <div className="text-right w-16">
                                      <p className="text-[10px] text-slate-400 font-medium">Tỷ lệ</p>
                                      <p className="text-xs font-mono font-black text-indigo-600">{pRate}%</p>
                                    </div>
                                    <button 
                                      type="button" 
                                      className="p-1.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all ml-1"
                                    >
                                      <ChevronRight className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
                      <button
                        onClick={() => setRankingSelectedOwner(null)}
                        className="px-5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-xl text-xs font-bold transition-all"
                      >
                        Đóng cửa sổ
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* CẬP NHẬT SỐ GIẢI NGÂN CHỦ ĐẦU TƯ */}
          {activeView === 'enter_disbursement' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side: Quick selection list with Owner Filter */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Chọn dự án báo cáo</h3>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {filteredDisburseProjects.length}/{projects.length}
                      </span>
                    </div>

                    {/* Lọc theo Chủ đầu tư */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Filter className="w-3 h-3 text-indigo-500" />
                        Lọc theo Chủ đầu tư
                      </label>
                      <select 
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-700 transition-all outline-none cursor-pointer"
                        value={disburseOwnerFilter}
                        onChange={(e) => setDisburseOwnerFilter(e.target.value)}
                      >
                        <option value="Tất cả chủ đầu tư">-- Tất cả chủ đầu tư ({projects.length} dự án) --</option>
                        {disburseOwnerOptions.map((owner) => {
                          const count = projects.filter(p => p.commune === owner || p.district === owner).length;
                          if (count === 0) return null;
                          return (
                            <option key={owner} value={owner}>
                              {owner} ({count} dự án)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Tìm kiếm nhanh */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm tên dự án..." 
                        className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-medium outline-none transition-all"
                        value={disburseSearchQuery}
                        onChange={(e) => setDisburseSearchQuery(e.target.value)}
                      />
                      {disburseSearchQuery && (
                        <button 
                          type="button"
                          onClick={() => setDisburseSearchQuery('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                    {filteredDisburseProjects.length > 0 ? (
                      filteredDisburseProjects.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectDisbursementProject(p.id)}
                          className={cn(
                            "w-full text-left p-3.5 rounded-2xl transition-all border text-xs flex flex-col gap-1.5",
                            disburseProjId === p.id 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-md shadow-indigo-100" 
                              : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                          )}
                        >
                          <span className="font-extrabold line-clamp-2">{p.name}</span>
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                            <span className="truncate max-w-[140px]">{p.commune}</span>
                            <span className="text-indigo-600 font-mono shrink-0">GN: {formatVN(p.disbursed)} triệu</span>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="text-center py-8 text-xs font-semibold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-4">
                        Không có dự án nào thỏa mãn bộ lọc
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Detailed Disbursement Form */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
                  {disburseProjId ? (
                    (() => {
                      const selected = projects.find(p => p.id === disburseProjId);
                      if (!selected) return null;
                      return (
                        <form onSubmit={handleSaveDisbursementSubmit} className="flex-1 flex flex-col">
                          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/20 to-white">
                            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">Báo cáo giải ngân chủ đầu tư</span>
                            <h3 className="text-base font-extrabold text-slate-800 mt-2">{selected.name}</h3>
                            <p className="text-[11px] text-slate-500 font-bold mt-0.5">{selected.commune} • Kế hoạch vốn giao: {formatVN(selected.assignedCapital)} triệu đồng</p>
                          </div>

                          <div className="p-6 space-y-6 flex-1">
                            {/* Box tổng lũy kế giải ngân */}
                            <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 rounded-2xl border border-emerald-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                              <div>
                                <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">Luỹ kế giải ngân đến thời điểm hiện tại</span>
                                <h4 className="text-xl font-black text-slate-800 font-mono mt-0.5">
                                  {formatVN((parseFloat(disburseNSTW) || 0) + (parseFloat(disburseNSDP) || 0))} <span className="text-xs font-normal text-slate-500">triệu đồng</span>
                                </h4>
                              </div>
                              {selected.assignedCapital > 0 && (
                                <div className="bg-white/80 px-3 py-1.5 rounded-xl border border-emerald-100 text-right">
                                  <span className="text-[10px] font-bold text-slate-400 block uppercase">Tỷ lệ giải ngân / KH vốn</span>
                                  <span className="text-sm font-black font-mono text-emerald-600">
                                    {(((parseFloat(disburseNSTW) || 0) + (parseFloat(disburseNSDP) || 0)) / selected.assignedCapital * 100).toFixed(1)}%
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Nhập Ngân sách Trung ương */}
                              <div className="p-5 rounded-2xl border border-indigo-100 bg-indigo-50/20 space-y-3">
                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                                  Ngân sách Trung ương (NSTW)
                                </h4>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số giải ngân NSTW (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    placeholder="Nhập số giải ngân NSTW"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={disburseNSTW}
                                    onChange={(e) => setDisburseNSTW(e.target.value)}
                                  />
                                </div>
                              </div>

                              {/* Nhập Ngân sách Địa phương */}
                              <div className="p-5 rounded-2xl border border-emerald-100 bg-emerald-50/20 space-y-3">
                                <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                                  Ngân sách Địa phương (NSĐP)
                                </h4>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số giải ngân NSĐP (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    placeholder="Nhập số giải ngân NSĐP"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={disburseNSDP}
                                    onChange={(e) => setDisburseNSDP(e.target.value)}
                                  />
                                </div>
                              </div>

                              {/* Nếu dự án thuộc Chương trình Mục tiêu Quốc gia (CTMTQG) */}
                              {selected.isNationalTargetProgram && (
                                <div className="md:col-span-2 p-5 rounded-2xl border-2 border-amber-300/80 bg-amber-50/40 space-y-4 animate-in fade-in duration-200">
                                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-3">
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded bg-amber-500 text-white text-[10px] font-extrabold uppercase">
                                        Chương trình MTQG
                                      </span>
                                      <span className="text-xs font-bold text-amber-950">
                                        {selected.nationalTargetProgramType || 'Chương trình Mục tiêu Quốc gia'}
                                      </span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-amber-700 italic">
                                      Căn cứ thuộc CTMTQG tại thông tin dự án
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                                        Số giải ngân CTMTQG - NSTW (Triệu đồng)
                                      </label>
                                      <input 
                                        type="number" 
                                        step="0.001"
                                        placeholder="Nhập số giải ngân CTMTQG NSTW"
                                        className="w-full px-4 py-2.5 bg-white border border-amber-200 focus:border-amber-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                        value={disburseCTMTQG_NSTW}
                                        onChange={(e) => setDisburseCTMTQG_NSTW(e.target.value)}
                                      />
                                    </div>
                                    <div className="space-y-1.5">
                                      <label className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">
                                        Số giải ngân CTMTQG - NSĐP (Triệu đồng)
                                      </label>
                                      <input 
                                        type="number" 
                                        step="0.001"
                                        placeholder="Nhập số giải ngân CTMTQG NSĐP"
                                        className="w-full px-4 py-2.5 bg-white border border-amber-200 focus:border-amber-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                        value={disburseCTMTQG_NSDP}
                                        onChange={(e) => setDisburseCTMTQG_NSDP(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Đăng ký kế hoạch giải ngân theo tháng */}
                              <div className="md:col-span-2 p-5 rounded-2xl border border-indigo-100 bg-indigo-50/30 space-y-4">
                                <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-100/80 pb-2 flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                    Đăng ký kế hoạch giải ngân theo tháng của Chủ đầu tư
                                  </span>
                                  <span className="text-[10px] font-semibold text-indigo-600 normal-case">Đăng ký tiến độ nhu cầu giải ngân hàng tháng</span>
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                      Số đăng ký tháng này (Tháng 7/2026) (Triệu đồng)
                                    </label>
                                    <input 
                                      type="number" 
                                      step="0.001"
                                      placeholder="Ví dụ: 500"
                                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                      value={disburseRegisteredCurrent}
                                      onChange={(e) => setDisburseRegisteredCurrent(e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                                      Số đăng ký tháng sau (Tháng 8/2026) (Triệu đồng)
                                    </label>
                                    <input 
                                      type="number" 
                                      step="0.001"
                                      placeholder="Ví dụ: 750"
                                      className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                      value={disburseRegisteredNext}
                                      onChange={(e) => setDisburseRegisteredNext(e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <button 
                              type="button" 
                              onClick={() => setActiveView('dashboard')}
                              className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
                            >
                              Hủy bỏ
                            </button>
                            <button 
                              type="submit" 
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                            >
                              Ghi nhận số giải ngân
                            </button>
                          </div>
                        </form>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                      <DollarSign className="w-12 h-12 text-slate-300 stroke-1 mb-3 animate-pulse" />
                      <p className="text-sm font-extrabold text-slate-600">Chưa chọn dự án</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">Chọn một dự án ở cột bên trái để cập nhật chi tiết tiến độ giải ngân do chủ đầu tư báo cáo.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* CẬP NHẬT PHÂN BỔ SỐ VỐN GIAO */}
          {activeView === 'enter_capital' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side list */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Chọn dự án giao vốn</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectCapitalProject(p.id)}
                        className={cn(
                          "w-full text-left p-3.5 rounded-2xl transition-all border text-xs flex flex-col gap-1.5",
                          capProjId === p.id 
                            ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-md shadow-indigo-100" 
                            : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                        )}
                      >
                        <span className="font-extrabold line-clamp-2">{p.name}</span>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                          <span>{p.commune}</span>
                          <span className="text-indigo-600 font-mono">Giao: {formatVN(p.assignedCapital)} triệu</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right side form */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
                  {capProjId ? (
                    (() => {
                      const selected = projects.find(p => p.id === capProjId);
                      if (!selected) return null;
                      return (
                        <form onSubmit={handleSaveCapitalSubmit} className="flex-1 flex flex-col">
                          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/20 to-white">
                            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md">Quyết định giao vốn đầu tư</span>
                            <h3 className="text-base font-extrabold text-slate-800 mt-2">{selected.name}</h3>
                            <p className="text-[11px] text-slate-500 font-bold mt-0.5">{selected.commune} • Tổng vốn đầu tư dự án: {formatVN(selected.totalInvestment)} triệu đồng</p>
                          </div>

                          <div className="p-6 space-y-6 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  Kế hoạch vốn năm 2026
                                </h4>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngân sách Trung ương (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={capPMAssigned}
                                    onChange={(e) => setCapPMAssigned(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngân sách Địa phương (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={capProvAssigned}
                                    onChange={(e) => setCapProvAssigned(e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Kế hoạch vốn kéo dài sang 2026
                                </h4>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngân sách Trung ương kéo dài (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={capCarriedPMAssigned}
                                    onChange={(e) => setCapCarriedPMAssigned(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngân sách Địa phương kéo dài (đã trừ 5% tiết kiệm) (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={capCarriedProvAssigned}
                                    onChange={(e) => setCapCarriedProvAssigned(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <button 
                              type="button" 
                              onClick={() => setActiveView('dashboard')}
                              className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
                            >
                              Hủy bỏ
                            </button>
                            <button 
                              type="submit" 
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                            >
                              Phê duyệt phân bổ kế hoạch vốn
                            </button>
                          </div>
                        </form>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                      <Wallet className="w-12 h-12 text-slate-300 stroke-1 mb-3 animate-pulse" />
                      <p className="text-sm font-extrabold text-slate-600">Chưa chọn dự án</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">Chọn một dự án ở cột bên trái để cập nhật chi tiết phân bổ kế hoạch vốn chi tiết được phê duyệt.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* LỊCH SỬ CÁC LẦN GIAO VỐN */}
          {activeView === 'allocation_batches' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Add Batch Form */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">Ký quyết định phân bổ mới</h3>
                  <form onSubmit={handleAddBatchSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số hiệu Quyết định</label>
                      <input 
                        type="text" 
                        placeholder="Ví dụ: 1045/QĐ-UBND"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-semibold transition-all outline-none"
                        value={newBatchDocNum}
                        onChange={(e) => setNewBatchDocNum(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số đợt/lần</label>
                        <input 
                          type="text" 
                          placeholder="Lần 3, Đợt 2..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-semibold transition-all outline-none"
                          value={newBatchNum}
                          onChange={(e) => setNewBatchNum(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày ký ban hành</label>
                        <input 
                          type="text" 
                          placeholder="dd/mm/yyyy"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-semibold transition-all outline-none"
                          value={newBatchDate}
                          onChange={(e) => setNewBatchDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Giá trị vốn (Triệu đồng)</label>
                        <input 
                          type="number" 
                          step="0.001"
                          placeholder="0,000"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                          value={newBatchAmount}
                          onChange={(e) => setNewBatchAmount(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nguồn vốn</label>
                        <select 
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-semibold transition-all outline-none cursor-pointer"
                          value={newBatchSource}
                          onChange={(e) => setNewBatchSource(e.target.value as any)}
                        >
                          <option value="NSTW">Ngân sách TW</option>
                          <option value="NSĐP">Ngân sách ĐP</option>
                          <option value="Hỗ trợ">Hỗ trợ quốc phòng/Hà Nội</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mô tả/Nội dung tóm tắt quyết định</label>
                      <textarea 
                        rows={3}
                        placeholder="Ví dụ: Phân bổ chi tiết kế hoạch vốn kéo dài cho các đơn vị địa phương..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs transition-all outline-none resize-none"
                        value={newBatchDesc}
                        onChange={(e) => setNewBatchDesc(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                    >
                      Ký quyết định ban hành
                    </button>
                  </form>
                </div>

                {/* Timeline display of batches */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-md p-6 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Sổ nhật ký giao quyết định vốn tỉnh Cao Bằng</h3>
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-100 max-h-[500px] overflow-y-auto pr-1">
                    {allocationBatches.map((batch) => (
                      <div key={batch.id} className="relative group">
                        <div className="absolute -left-[22px] top-1 w-3.5 h-3.5 rounded-full border-2 border-indigo-500 bg-white group-hover:bg-indigo-500 transition-colors duration-300" />
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-slate-800">{batch.batchNumber} • {batch.documentNumber}</span>
                              <span className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase",
                                batch.source === 'NSTW' ? "bg-indigo-50 text-indigo-700" : batch.source === 'NSĐP' ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"
                              )}>{batch.source}</span>
                            </div>
                            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed">{batch.description}</p>
                            <span className="text-[10px] text-slate-400 font-bold block mt-1.5">{batch.date}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-indigo-600 font-mono">+{formatVN(batch.amount)} triệu</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* KHO BẠC NHẬP GIAO VỐN & ĐỐI CHIẾU SỐ LIỆU */}
          {activeView === 'treasury_reconciliation' && (
            <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Selection column */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-5 space-y-4">
                  <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Danh sách đối chiếu</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {projects.map((p) => {
                      const discrepancy = Math.abs(p.disbursed - p.treasuryDisbursed);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectKbProject(p.id)}
                          className={cn(
                            "w-full text-left p-3.5 rounded-2xl transition-all border text-xs flex flex-col gap-1.5",
                            kbProjId === p.id 
                              ? "bg-indigo-50 border-indigo-200 text-indigo-900 shadow-md shadow-indigo-100" 
                              : "bg-white border-slate-100 hover:border-slate-200 text-slate-700"
                          )}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-extrabold line-clamp-2 flex-1">{p.name}</span>
                            {discrepancy > 0.001 && (
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" title="Phát hiện chênh lệch số liệu với chủ đầu tư báo cáo" />
                            )}
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                            <span>Kho bạc: {formatVN(p.treasuryDisbursed)} triệu</span>
                            <span className="text-rose-500 font-mono">Chênh lệch: {formatVN(discrepancy)} triệu</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form column */}
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden flex flex-col">
                  {kbProjId ? (
                    (() => {
                      const selected = projects.find(p => p.id === kbProjId);
                      if (!selected) return null;
                      const discrepancy = selected.disbursed - selected.treasuryDisbursed;
                      return (
                        <form onSubmit={handleSaveTreasurySubmit} className="flex-1 flex flex-col">
                          <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/20 to-white">
                            <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded-md">Kiểm soát chi Kho bạc Nhà nước</span>
                            <h3 className="text-base font-extrabold text-slate-800 mt-2">{selected.name}</h3>
                            <p className="text-[11px] text-slate-500 font-bold mt-0.5">{selected.commune} • Số liệu chủ đầu tư báo: {formatVN(selected.disbursed)} triệu đồng</p>
                          </div>

                          <div className="p-6 space-y-6 flex-1">
                            {/* Alert status block */}
                            {Math.abs(discrepancy) > 0.001 ? (
                              <div className="p-4.5 rounded-2xl bg-rose-50 border border-rose-100 text-rose-900 text-xs flex gap-3">
                                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5 animate-bounce" />
                                <div className="space-y-1">
                                  <p className="font-extrabold">Cảnh báo chênh lệch số liệu kiểm soát chi!</p>
                                  <p className="text-rose-800/80 leading-relaxed font-semibold">Hiện có sự không đồng bộ giữa báo cáo giải ngân của Chủ đầu tư ({formatVN(selected.disbursed)} triệu) và ghi nhận thực thanh toán qua Kho bạc ({formatVN(selected.treasuryDisbursed)} triệu). Chênh lệch là <span className="font-extrabold text-rose-600">{formatVN(discrepancy)} triệu đồng</span>.</p>
                                </div>
                              </div>
                            ) : (
                              <div className="p-4.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-900 text-xs flex gap-3">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <p className="font-extrabold">Đồng bộ hoàn hảo!</p>
                                  <p className="text-emerald-800/80 leading-relaxed font-semibold">Dữ liệu kiểm soát chi thực tế tại Kho bạc Nhà nước khớp chính xác tuyệt đối với báo cáo tiến độ giải ngân của Chủ đầu tư.</p>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                  Giải ngân Kho bạc nguồn năm 2026
                                </h4>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngân sách Trung ương (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={kbPM2026}
                                    onChange={(e) => setKbPM2026(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngân sách Địa phương (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={kbProv2026}
                                    onChange={(e) => setKbProv2026(e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Giải ngân Kho bạc nguồn kéo dài
                                </h4>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngân sách Trung ương kéo dài (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={kbCarriedPM}
                                    onChange={(e) => setKbCarriedPM(e.target.value)}
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngân sách Địa phương kéo dài (đã trừ 5% tiết kiệm) (Triệu đồng)</label>
                                  <input 
                                    type="number" 
                                    step="0.001"
                                    className="w-full px-4 py-2.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold transition-all outline-none"
                                    value={kbCarriedProv}
                                    onChange={(e) => setKbCarriedProv(e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ngày đối chiếu chứng từ</label>
                              <input 
                                type="text" 
                                className="w-full max-w-xs px-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-500 rounded-xl text-xs font-semibold transition-all outline-none"
                                value={kbReconciledDate}
                                onChange={(e) => setKbReconciledDate(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                            <button 
                              type="button" 
                              onClick={() => setActiveView('dashboard')}
                              className="px-5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all"
                            >
                              Hủy bỏ
                            </button>
                            <button 
                              type="submit" 
                              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
                            >
                              Phê duyệt & Đồng bộ Kho bạc
                            </button>
                          </div>
                        </form>
                      );
                    })()
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-400">
                      <Database className="w-12 h-12 text-slate-300 stroke-1 mb-3 animate-pulse" />
                      <p className="text-sm font-extrabold text-slate-600">Chưa chọn dự án</p>
                      <p className="text-[11px] text-slate-400 max-w-xs mt-1 leading-relaxed">Chọn một dự án ở cột bên trái để cập nhật đối chiếu số thực chi qua hệ thống Kho bạc Nhà nước.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-12">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-slate-400 text-xs font-medium">
              © 2024 Sở Kế hoạch và Đầu tư tỉnh Cao Bằng. Tất cả quyền được bảo lưu.
            </div>
            <div className="flex items-center gap-6">
              <a href="#" className="text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors">Hướng dẫn sử dụng</a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors">Báo cáo định kỳ</a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 text-xs font-bold transition-colors">Liên hệ hỗ trợ</a>
            </div>
          </div>
        </footer>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{selectedProject.name}</h2>
                <p className="text-xs text-slate-500 font-medium">{selectedProject.commune}, {selectedProject.district}</p>
              </div>
              <button 
                onClick={() => setSelectedProject(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
              {/* Chi tiết Tổng Mức Đầu Tư & Cơ Cấu Nguồn Vốn */}
              {(() => {
                const inv = getProjectInvestmentBreakdown(selectedProject);
                const assigned = getProjectAssignedCapitalBreakdown(selectedProject);
                const pmCap = selectedProject.pmCapital || 0;
                const provCap = selectedProject.provinceCapital || 0;
                const carriedPM = selectedProject.carriedOverPMCapital || 0;
                const carriedProv = selectedProject.carriedOverProvinceCapital || 0;
                const totalAssignedPlan = pmCap + provCap + carriedPM + carriedProv || selectedProject.assignedCapital || 0;
                const cdtDisbursed = selectedProject.disbursed || 0;
                const treasuryDisbursed = selectedProject.treasuryDisbursed || 0;
                const cdtRate = totalAssignedPlan > 0 ? (cdtDisbursed / totalAssignedPlan) * 100 : 0;
                const treasuryRate = totalAssignedPlan > 0 ? (treasuryDisbursed / totalAssignedPlan) * 100 : 0;

                return (
                  <div className="space-y-6">
                    {/* Block 1: Chi tiết Kế hoạch vốn giao mới năm 2026 */}
                    <div className="p-6 rounded-3xl bg-indigo-50/40 border border-indigo-100 space-y-4 shadow-2xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-widest bg-white border border-indigo-200 px-2.5 py-1 rounded-lg">
                              Kế hoạch vốn giao mới năm 2026
                            </span>
                            {assigned.isMTQG && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-extrabold rounded-lg shadow-2xs">
                                <CheckSquare className="w-3 h-3" />
                                Thuộc CTMTQG
                              </span>
                            )}
                          </div>
                          <h3 className="text-sm font-black text-indigo-950 mt-1">
                            Chi tiết Kế hoạch vốn đã giao
                          </h3>
                        </div>
                        <div className="text-left sm:text-right">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng vốn đã giao</span>
                          <span className="text-xl font-black text-indigo-900 font-mono">
                            {formatVN(assigned.totalAssigned)} <span className="text-xs text-indigo-600 font-bold">triệu VNĐ</span>
                          </span>
                        </div>
                      </div>

                      {/* Capital Assigned Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-4 bg-white rounded-2xl border border-indigo-100 shadow-2xs space-y-2">
                          <div className="flex justify-between items-center border-b border-indigo-50 pb-1.5">
                            <span className="text-xs font-black text-indigo-900">Vốn NSTW giao</span>
                            <span className="text-sm font-black font-mono text-indigo-700">{formatVN(assigned.nstw)} tr</span>
                          </div>
                          {assigned.isMTQG && (
                            <div className="flex justify-between items-center text-xs text-indigo-800 bg-indigo-50/50 p-2 rounded-xl">
                              <span className="font-bold text-[11px]">Gồm CTMTQG NSTW:</span>
                              <span className="font-mono font-black">{formatVN(assigned.ctmtqgNstw)} tr</span>
                            </div>
                          )}
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-2xs space-y-2">
                          <div className="flex justify-between items-center border-b border-emerald-50 pb-1.5">
                            <span className="text-xs font-black text-emerald-900">Vốn NSĐP giao</span>
                            <span className="text-sm font-black font-mono text-emerald-700">{formatVN(assigned.nsdp)} tr</span>
                          </div>
                          {assigned.isMTQG && (
                            <div className="flex justify-between items-center text-xs text-emerald-800 bg-emerald-50/50 p-2 rounded-xl">
                              <span className="font-bold text-[11px]">Gồm CTMTQG NSĐP:</span>
                              <span className="font-mono font-black">{formatVN(assigned.ctmtqgNsdp)} tr</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {assigned.isMTQG && (
                        <div className="p-3 bg-white border border-indigo-200/80 rounded-2xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Award className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                            <span className="font-extrabold text-indigo-900">{assigned.mtqgType}</span>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                            Tổng CTMTQG: {formatVN(assigned.ctmtqgTotal)} tr
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kế hoạch vốn năm 2026</p>
                        <p className="text-lg font-black text-slate-900 font-mono">{formatVN(pmCap + provCap)} <span className="text-xs text-slate-500 font-normal">tr VNĐ</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng vốn được giao</p>
                        <p className="text-lg font-black text-indigo-900 font-mono">{formatVN(totalAssignedPlan)} <span className="text-xs text-indigo-600 font-normal">tr VNĐ</span></p>
                      </div>
                    </div>

                    {/* Tiến độ Giải ngân */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giải ngân (Chủ đầu tư báo cáo)</p>
                        <p className="text-2xl font-bold text-indigo-600">{formatVN(cdtDisbursed)} triệu</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-indigo-500" 
                              style={{ width: `${Math.min(100, Math.max(0, cdtRate))}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600">
                            {cdtRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="md:border-l border-slate-200 md:pl-6 space-y-1">
                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Giải ngân (Kho bạc đối chiếu {selectedProject.treasuryReconciliationDate || '16/07/2026'})</p>
                        <p className="text-2xl font-bold text-rose-600">{formatVN(treasuryDisbursed)} triệu</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-rose-500" 
                              style={{ width: `${Math.min(100, Math.max(0, treasuryRate))}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-rose-600">
                            {treasuryRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Đăng ký nhu cầu vốn giải ngân */}
                    <div className="p-6 bg-teal-50/40 rounded-2xl border border-teal-100 space-y-3">
                      <h4 className="text-xs font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        Đăng ký nhu cầu vốn giải ngân
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 bg-white rounded-xl border border-teal-100 shadow-2xs space-y-1">
                          <p className="text-[10px] font-extrabold text-teal-700 uppercase">Đăng ký tháng hiện tại (Tháng 7)</p>
                          <p className="text-lg font-black text-teal-950 font-mono">{formatVN(selectedProject.registeredCurrentMonth || 0)} <span className="text-xs font-normal text-teal-600">triệu VNĐ</span></p>
                        </div>
                        <div className="p-3.5 bg-white rounded-xl border border-teal-100 shadow-2xs space-y-1">
                          <p className="text-[10px] font-extrabold text-indigo-700 uppercase">Đăng ký tháng tiếp theo (Tháng 8)</p>
                          <p className="text-lg font-black text-indigo-950 font-mono">{formatVN(selectedProject.registeredNextMonth || 0)} <span className="text-xs font-normal text-indigo-600">triệu VNĐ</span></p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl",
                    selectedProject.hasCamera ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"
                  )}>
                    {selectedProject.hasCamera ? <Video className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Camera hiện trường</p>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {selectedProject.hasCamera ? "Hệ thống đang hoạt động" : "Chưa lắp đặt hệ thống giám sát"}
                    </p>
                  </div>
                </div>
                {selectedProject.hasCamera ? (
                  <button 
                    onClick={() => setCameraProject(selectedProject)}
                    className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
                  >
                    Xem trực tiếp
                  </button>
                ) : (
                  <button 
                    onClick={() => alert(`Hiện trường dự án "${selectedProject.name}" chưa lắp đặt hệ thống camera giám sát.`)}
                    className="px-4 py-2 bg-slate-200 text-slate-500 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-300 transition-all"
                  >
                    Chưa lắp đặt
                  </button>
                )}
              </div>

              {selectedProject.difficulty && (
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100 space-y-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-900">Khó khăn, vướng mắc</h4>
                      <p className="text-sm text-rose-800/80 leading-relaxed mt-1">{selectedProject.difficulty}</p>
                    </div>
                  </div>
                  {selectedProject.solution && (
                    <div className="flex gap-3 pt-4 border-t border-rose-200/50">
                      <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900">Giải pháp, kiến nghị</h4>
                        <p className="text-sm text-emerald-800/80 leading-relaxed mt-1 italic">{selectedProject.solution}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {!selectedProject.difficulty && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900">Dự án đang triển khai tốt</h4>
                    <p className="text-sm text-emerald-800/80 mt-1">Dự án hiện đang bám sát kế hoạch đề ra, không có vướng mắc phát sinh.</p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedProject(null)}
                className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-full text-sm font-bold transition-all"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Camera Modal */}
      {cameraProject && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-slate-900 rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-800 animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">Trực tiếp: {cameraProject.name}</h2>
              </div>
              <button 
                onClick={() => setCameraProject(null)}
                className="p-2 hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="aspect-video bg-black flex flex-col items-center justify-center relative group">
              {/* Mock Camera Stream UI */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-8 left-8 border-t-2 border-l-2 border-white w-8 h-8" />
                <div className="absolute top-8 right-8 border-t-2 border-r-2 border-white w-8 h-8" />
                <div className="absolute bottom-8 left-8 border-b-2 border-l-2 border-white w-8 h-8" />
                <div className="absolute bottom-8 right-8 border-b-2 border-r-2 border-white w-8 h-8" />
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-indigo-500/10 rounded-full border border-indigo-500/20">
                  <Video className="w-12 h-12 text-indigo-400 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-indigo-400 font-bold text-lg">Đang kết nối camera hiện trường...</p>
                  <p className="text-slate-500 text-xs mt-1 uppercase tracking-widest">Đang tải luồng dữ liệu thời gian thực</p>
                </div>
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/80">
                  REC 00:00:12:04
                </div>
                <div className="flex gap-2">
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/80">
                    1080P / 60FPS
                  </div>
                  <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-white/80">
                    CAM_01
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 bg-slate-900 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Vị trí</span>
                    <span className="text-xs text-slate-300">{cameraProject.commune}, {cameraProject.district}</span>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Trạng thái</span>
                    <span className="text-xs text-emerald-400 font-bold">Đang hoạt động</span>
                  </div>
                </div>
                <button className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20">
                  Chụp ảnh hiện trường
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capital Source Detail Modal */}
      {selectedCapitalSource && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            {selectedCapitalSource === 'pm_2026' && (
              <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-indigo-100">
                    Chi tiết nguồn vốn đầu năm
                  </span>
                  <h2 className="text-lg font-extrabold mt-1">Vốn năm 2026 Thủ tướng Chính phủ giao</h2>
                  <p className="text-xs text-indigo-100/90">Tổng quy mô: 7.176.283 triệu đồng (Chiếm 86,87% tổng nguồn vốn)</p>
                </div>
                <button 
                  onClick={() => setSelectedCapitalSource(null)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {selectedCapitalSource === 'carried_over' && (
              <div className="p-6 bg-gradient-to-r from-amber-600 to-amber-700 text-white flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-amber-100">
                    Chi tiết nguồn vốn kéo dài
                  </span>
                  <h2 className="text-lg font-extrabold mt-1">Vốn kéo dài sang năm 2026</h2>
                  <p className="text-xs text-amber-100/90">Tổng quy mô: 664.532 triệu đồng (Chiếm 8,04% tổng nguồn vốn)</p>
                </div>
                <button 
                  onClick={() => setSelectedCapitalSource(null)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {selectedCapitalSource === 'support' && (
              <div className="p-6 bg-gradient-to-r from-rose-600 to-rose-700 text-white flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full text-rose-100">
                    Chi tiết nguồn vốn hỗ trợ
                  </span>
                  <h2 className="text-lg font-extrabold mt-1">Vốn hỗ trợ ngoài tỉnh</h2>
                  <p className="text-xs text-rose-100/90">Tổng quy mô: 420.000 triệu đồng (Chiếm 5,08% tổng nguồn vốn)</p>
                </div>
                <button 
                  onClick={() => setSelectedCapitalSource(null)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {selectedCapitalSource === 'pm_2026' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ngân sách Trung ương (NSTW)</span>
                      <span className="text-xl font-extrabold text-indigo-900 font-mono mt-1 block">6.147.148 triệu</span>
                      <div className="w-full bg-indigo-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '85.66%' }} />
                      </div>
                      <span className="text-[10px] text-indigo-700 font-semibold mt-1 block">Chiếm 85,66% tổng nguồn giao</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Ngân sách Địa phương (NSĐP)</span>
                      <span className="text-xl font-extrabold text-indigo-900 font-mono mt-1 block">1.029.135 triệu</span>
                      <div className="w-full bg-indigo-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: '14.34%' }} />
                      </div>
                      <span className="text-[10px] text-indigo-700 font-semibold mt-1 block">Chiếm 14,34% (đã trừ 5% tiết kiệm)</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-4 h-4 text-indigo-600" />
                      Cấu trúc chi tiết phân loại nguồn vốn Thủ tướng giao
                    </h4>
                    
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                              <th className="py-3 px-4">Phân loại vốn</th>
                              <th className="py-3 px-3 text-right">Số vốn (triệu VNĐ)</th>
                              <th className="py-3 px-3 text-center">Số QĐ / Văn bản TW</th>
                              <th className="py-3 px-3 text-center">Số QĐ tỉnh Phân bổ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            <tr className="hover:bg-indigo-50/30 transition-colors">
                              <td className="py-3.5 px-4 text-slate-800 font-bold">
                                Giao kế hoạch đầu năm (Phát triển KT-XH chung)
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-black text-indigo-900">
                                5.247.148
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 1603/QĐ-TTg
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 2158/QĐ-UBND
                                </span>
                              </td>
                            </tr>

                            <tr className="hover:bg-indigo-50/30 transition-colors">
                              <td className="py-3.5 px-4 text-slate-800 font-bold">
                                Giao thêm cho DA cao tốc Đồng Đăng - Trà Lĩnh
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-black text-indigo-900">
                                1.200.000
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 482/QĐ-TTg
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 865/QĐ-UBND
                                </span>
                              </td>
                            </tr>

                            <tr className="hover:bg-indigo-50/30 transition-colors">
                              <td className="py-3.5 px-4 text-slate-800 font-bold">
                                Giao CTMTQG phát triển văn hóa, y tế & an sinh
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-black text-indigo-900">
                                729.135
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 1290/QĐ-TTg
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 1842/QĐ-UBND
                                </span>
                              </td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr className="bg-indigo-50/60 font-black border-t border-indigo-100 text-slate-900">
                              <td className="py-3 px-4 uppercase text-[10px] text-indigo-900">Tổng cộng vốn Thủ tướng giao</td>
                              <td className="py-3 px-3 text-right font-mono text-indigo-900 text-sm">7.176.283</td>
                              <td colSpan={2} className="py-3 px-3 text-right text-[10px] text-indigo-700 font-bold">Hoàn thành giao 100% chi tiết</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
                    <span className="font-extrabold text-slate-800 block">📌 Ghi chú điều hành:</span>
                    <p className="leading-relaxed">Căn cứ theo Quyết định giao kế hoạch đầu năm 2026 của Thủ tướng Chính phủ, HĐND và UBND tỉnh Cao Bằng đã hoàn thành 100% việc giao chi tiết cho các chủ đầu tư để kịp thời triển khai các thủ tục giải ngân ngay từ những tháng đầu năm.</p>
                  </div>
                </>
              )}

              {selectedCapitalSource === 'carried_over' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">NSĐP kéo dài</span>
                      <span className="text-base font-extrabold text-amber-900 font-mono mt-1 block">156.644 triệu</span>
                      <span className="text-[9px] text-amber-700 font-semibold mt-1 block">Chiếm 23,57%</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">NSTW bổ sung</span>
                      <span className="text-base font-extrabold text-amber-900 font-mono mt-1 block">230.964 triệu</span>
                      <span className="text-[9px] text-amber-700 font-semibold mt-1 block">Chiếm 34,76%</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">CTMTQG</span>
                      <span className="text-base font-extrabold text-amber-900 font-mono mt-1 block">276.925 triệu</span>
                      <span className="text-[9px] text-amber-700 font-semibold mt-1 block">Chiếm 41,67%</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600" />
                      Cấu trúc chi tiết phân loại nguồn vốn kéo dài sang năm 2026
                    </h4>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                              <th className="py-3 px-4">Phân loại vốn</th>
                              <th className="py-3 px-3 text-right">Số vốn (triệu VNĐ)</th>
                              <th className="py-3 px-3 text-center">Số QĐ / Văn bản TW</th>
                              <th className="py-3 px-3 text-center">Số QĐ tỉnh Phân bổ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            <tr className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-3.5 px-4 text-slate-800 font-bold">
                                Ngân sách Địa phương (NSĐP) kéo dài
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-black text-amber-900">
                                156.644
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 font-mono text-[11px] font-medium rounded">
                                  — (Nguồn NSĐP)
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 font-mono text-[11px] font-bold rounded">
                                  QĐ 342/QĐ-UBND
                                </span>
                              </td>
                            </tr>

                            <tr className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-3.5 px-4 text-slate-800 font-bold">
                                NSTW bổ sung theo tiêu chí, định mức
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-black text-amber-900">
                                230.964
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 1895/QĐ-TTg
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 font-mono text-[11px] font-bold rounded">
                                  QĐ 410/QĐ-UBND
                                </span>
                              </td>
                            </tr>

                            <tr className="hover:bg-amber-50/30 transition-colors">
                              <td className="py-3.5 px-4 text-slate-800 font-bold">
                                Chương trình Mục tiêu Quốc gia (CTMTQG) kéo dài
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-black text-amber-900">
                                276.925
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 1920/QĐ-TTg
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-800 font-mono text-[11px] font-bold rounded">
                                  QĐ 425/QĐ-UBND
                                </span>
                              </td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr className="bg-amber-50/60 font-black border-t border-amber-100 text-slate-900">
                              <td className="py-3 px-4 uppercase text-[10px] text-amber-900">Tổng vốn kéo dài sang 2026</td>
                              <td className="py-3 px-3 text-right font-mono text-amber-900 text-sm">664.532</td>
                              <td colSpan={2} className="py-3 px-3 text-right text-[10px] text-amber-800 font-bold">Ưu tiên giải ngân dứt điểm</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/60 text-xs space-y-1.5 text-amber-900">
                    <span className="font-extrabold block">⚠️ Yêu cầu dứt điểm:</span>
                    <p className="leading-relaxed">Toàn bộ nguồn vốn kéo dài năm 2025 sang năm 2026 phải ưu tiên giải ngân trước ngày 31/12/2026 theo quy định của Luật Đầu tư công, không được gia hạn thêm.</p>
                  </div>
                </>
              )}

              {selectedCapitalSource === 'support' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Bộ Quốc phòng hỗ trợ</span>
                      <span className="text-xl font-extrabold text-rose-900 font-mono mt-1 block">200.000 triệu</span>
                      <div className="w-full bg-rose-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-rose-600 h-full rounded-full" style={{ width: '47.62%' }} />
                      </div>
                      <span className="text-[10px] text-rose-700 font-semibold mt-1 block">Chiếm 47,62% tổng vốn hỗ trợ</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-100">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Thành phố Hà Nội hỗ trợ</span>
                      <span className="text-xl font-extrabold text-rose-900 font-mono mt-1 block">220.000 triệu</span>
                      <div className="w-full bg-rose-200 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div className="bg-rose-600 h-full rounded-full" style={{ width: '52.38%' }} />
                      </div>
                      <span className="text-[10px] text-rose-700 font-semibold mt-1 block">Chiếm 52,38% tổng vốn hỗ trợ</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Info className="w-4 h-4 text-rose-600" />
                      Cấu trúc chi tiết phân loại nguồn vốn hỗ trợ ngoài tỉnh
                    </h4>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                              <th className="py-3 px-4">Phân loại vốn</th>
                              <th className="py-3 px-3 text-right">Số vốn (triệu VNĐ)</th>
                              <th className="py-3 px-3 text-center">Số QĐ / Văn bản TW</th>
                              <th className="py-3 px-3 text-center">Số QĐ tỉnh Phân bổ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-medium">
                            <tr className="hover:bg-rose-50/30 transition-colors">
                              <td className="py-3.5 px-4 text-slate-800 font-bold">
                                Vốn hỗ trợ từ Bộ Quốc phòng (QP-AN & Biên giới)
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-black text-rose-900">
                                200.000
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 88/QĐ-BQP
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 512/QĐ-UBND
                                </span>
                              </td>
                            </tr>

                            <tr className="hover:bg-rose-50/30 transition-colors">
                              <td className="py-3.5 px-4 text-slate-800 font-bold">
                                Vốn hỗ trợ từ Thành phố Hà Nội (An sinh & Hạ tầng)
                              </td>
                              <td className="py-3.5 px-3 text-right font-mono font-black text-rose-900">
                                220.000
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[11px] font-bold rounded">
                                  NQ 15/NQ-HĐND HN
                                </span>
                              </td>
                              <td className="py-3.5 px-3 text-center">
                                <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 font-mono text-[11px] font-bold rounded">
                                  QĐ 618/QĐ-UBND
                                </span>
                              </td>
                            </tr>
                          </tbody>
                          <tfoot>
                            <tr className="bg-rose-50/60 font-black border-t border-rose-100 text-slate-900">
                              <td className="py-3 px-4 uppercase text-[10px] text-rose-900">Tổng vốn hỗ trợ ngoài tỉnh</td>
                              <td className="py-3 px-3 text-right font-mono text-rose-900 text-sm">420.000</td>
                              <td colSpan={2} className="py-3 px-3 text-right text-[10px] text-rose-700 font-bold">Thực hiện theo tiến độ cam kết</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/60 text-xs space-y-1.5 text-rose-900">
                    <span className="font-extrabold block">🤝 Hợp tác & Kết nối:</span>
                    <p className="leading-relaxed">Nguồn vốn hỗ trợ thể hiện sự quan tâm, đồng hành đặc biệt của Bộ Quốc phòng và Thủ đô Hà Nội đối với tỉnh biên giới Cao Bằng, thúc đẩy phát triển kinh tế gắn với giữ vững an ninh quốc phòng.</p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedCapitalSource(null)}
                className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi Tiết Kết Quả Giải Ngân Theo Chủ Đầu Tư & Dự Án */}
      {showDisbursementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-7xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-indigo-900 text-white flex items-start justify-between relative overflow-hidden shrink-0">
              <div className="relative z-10 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-emerald-100 backdrop-blur-md">
                    Báo cáo tiến độ chi tiết
                  </span>
                  {selectedDisbursementCard !== 'all' && (
                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-400 text-emerald-950 font-mono shadow-xs">
                      {selectedDisbursementCard === 'executed' && '🎯 Đang xem: KL đã thực hiện'}
                      {selectedDisbursementCard === 'accepted' && '📋 Đang xem: KL đã nghiệm thu'}
                      {selectedDisbursementCard === 'disbursed' && '💰 Đang xem: Số đã giải ngân (CĐT)'}
                      {selectedDisbursementCard === 'treasury' && '🏛️ Đang xem: KB xác nhận'}
                      {selectedDisbursementCard === 'remaining' && '📉 Đang xem: Số còn phải giải ngân'}
                    </span>
                  )}
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-300" />
                  Chi Tiết Thực Hiện & Giải Ngân Theo Chủ Đầu Tư & Dự Án
                </h3>
                <p className="text-xs text-emerald-100/90 font-medium">
                  Danh sách xếp thứ tự từ Chủ đầu tư có tỷ lệ giải ngân cao nhất xuống thấp nhất. Nhấp vào từng Chủ đầu tư để mở danh sách Dự án.
                </p>
              </div>
              <button 
                onClick={() => setShowDisbursementModal(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 relative z-10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Toolbar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên Chủ đầu tư hoặc Dự án..."
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
                {modalSearchQuery && (
                  <button 
                    onClick={() => setModalSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => expandAllOwners(filteredOwnerDisbursementList.map(o => o.name))}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                  Mở rộng tất cả ({filteredOwnerDisbursementList.length})
                </button>
                <button
                  onClick={collapseAllOwners}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-2xs"
                >
                  Thu gọn
                </button>
              </div>
            </div>

            {/* Modal Content / Table */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/90 border-b border-slate-200 text-[11px] font-black text-slate-700 uppercase tracking-wider sticky top-0 z-20 shadow-2xs">
                        <th className="py-3 px-4 min-w-[220px]">Chủ đầu tư / Dự án</th>
                        <th className="py-3 px-3 text-right min-w-[110px]">Kế hoạch vốn</th>
                        <th className={cn("py-3 px-3 text-right min-w-[125px]", selectedDisbursementCard === 'executed' && "bg-indigo-100/90 text-indigo-950 font-black")}>
                          1. KL đã thực hiện
                        </th>
                        <th className={cn("py-3 px-3 text-right min-w-[125px]", selectedDisbursementCard === 'accepted' && "bg-teal-100/90 text-teal-950 font-black")}>
                          2. KL nghiệm thu
                        </th>
                        <th className={cn("py-3 px-3 text-right min-w-[125px]", selectedDisbursementCard === 'disbursed' && "bg-emerald-100/90 text-emerald-950 font-black")}>
                          3. Số đã giải ngân
                        </th>
                        <th className={cn("py-3 px-3 text-right min-w-[125px]", selectedDisbursementCard === 'treasury' && "bg-amber-100/90 text-amber-950 font-black")}>
                          4. Số KB xác nhận
                        </th>
                        <th className={cn("py-3 px-3 text-right min-w-[125px]", selectedDisbursementCard === 'remaining' && "bg-rose-100/90 text-rose-950 font-black")}>
                          5. Số còn phải GN
                        </th>
                        <th className="py-3 px-4 text-center min-w-[120px]">Tỷ lệ giải ngân</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 font-medium">
                      {filteredOwnerDisbursementList.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-500 font-semibold">
                            Không tìm thấy Chủ đầu tư hoặc Dự án nào phù hợp với từ khóa "{modalSearchQuery}".
                          </td>
                        </tr>
                      ) : (
                        filteredOwnerDisbursementList.map((owner, idx) => {
                          const isExpanded = !!expandedOwners[owner.name];
                          return (
                            <React.Fragment key={owner.name}>
                              {/* Owner Header Row */}
                              <tr 
                                onClick={() => toggleOwnerExpansion(owner.name)}
                                className={cn(
                                  "cursor-pointer transition-colors group/row",
                                  isExpanded ? "bg-slate-50/90 border-l-4 border-l-emerald-600" : "hover:bg-emerald-50/30"
                                )}
                              >
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  <div className="flex items-center gap-2.5">
                                    <span className={cn(
                                      "p-1 rounded-md transition-transform duration-200",
                                      isExpanded ? "bg-emerald-100 text-emerald-700 rotate-90" : "bg-slate-100 text-slate-500 group-hover/row:bg-emerald-100 group-hover/row:text-emerald-700"
                                    )}>
                                      <ChevronRight className="w-4 h-4" />
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-slate-900 font-extrabold text-xs group-hover/row:text-emerald-700 transition-colors">
                                          {idx + 1}. {owner.name}
                                        </span>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200">
                                          {owner.projects.length} dự án
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Kế hoạch vốn */}
                                <td className="py-3.5 px-3 text-right font-mono font-bold text-slate-700">
                                  {formatVN(owner.totalCapital)}
                                </td>

                                {/* 1. KL đã thực hiện */}
                                <td className={cn("py-3.5 px-3 text-right font-mono font-extrabold text-indigo-900", selectedDisbursementCard === 'executed' && "bg-indigo-50/90 font-black")}>
                                  {formatVN(owner.executedVolume)}
                                </td>

                                {/* 2. KL nghiệm thu */}
                                <td className={cn("py-3.5 px-3 text-right font-mono font-extrabold text-teal-900", selectedDisbursementCard === 'accepted' && "bg-teal-50/90 font-black")}>
                                  {formatVN(owner.acceptedVolume)}
                                </td>

                                {/* 3. Số đã giải ngân */}
                                <td className={cn("py-3.5 px-3 text-right font-mono font-black text-emerald-900", selectedDisbursementCard === 'disbursed' && "bg-emerald-100/70 font-black text-emerald-950")}>
                                  {formatVN(owner.disbursed)}
                                </td>

                                {/* 4. Số KB xác nhận */}
                                <td className={cn("py-3.5 px-3 text-right font-mono font-black text-amber-900", selectedDisbursementCard === 'treasury' && "bg-amber-100/70 font-black text-amber-950")}>
                                  {formatVN(owner.treasuryDisbursed)}
                                </td>

                                {/* 5. Số còn phải giải ngân */}
                                <td className={cn("py-3.5 px-3 text-right font-mono font-black text-rose-900", selectedDisbursementCard === 'remaining' && "bg-rose-100/70 font-black text-rose-950")}>
                                  {formatVN(Math.max(0, owner.totalCapital - owner.disbursed))}
                                </td>

                                {/* Tỷ lệ giải ngân */}
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <span className={cn(
                                      "px-2.5 py-1 rounded-full text-xs font-black font-mono shadow-2xs",
                                      owner.ratePct >= 70 ? "bg-emerald-100 text-emerald-800 border border-emerald-300" :
                                      owner.ratePct >= 35 ? "bg-amber-100 text-amber-800 border border-amber-300" :
                                      "bg-rose-100 text-rose-800 border border-rose-300"
                                    )}>
                                      {owner.ratePct.toFixed(1)}%
                                    </span>
                                  </div>
                                </td>
                              </tr>

                              {/* Expanded Projects Sub-Rows */}
                              {isExpanded && owner.projects.map((proj) => {
                                const projTotalCap = proj.pmCapital + proj.provinceCapital + proj.carriedOverPMCapital + proj.carriedOverProvinceCapital || proj.assignedCapital;
                                const projRate = projTotalCap > 0 ? (proj.disbursed / projTotalCap) * 100 : 0;
                                const projExecuted = Math.round(proj.disbursed * 1.18 * 10) / 10;
                                const projAccepted = Math.round(proj.disbursed * 1.07 * 10) / 10;

                                return (
                                  <tr key={proj.id} className="bg-slate-50/50 hover:bg-slate-100/70 transition-colors text-slate-700">
                                    {/* Indented Project Name */}
                                    <td className="py-2.5 px-4 pl-10 border-l-4 border-l-emerald-400">
                                      <div className="flex items-start gap-2">
                                        <span className="text-emerald-500 font-mono text-[10px] mt-0.5">└─</span>
                                        <div>
                                          <span 
                                            className="text-slate-700 font-normal text-xs hover:text-emerald-700 hover:underline cursor-pointer" 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedProject(proj);
                                              setShowDisbursementModal(false);
                                            }}
                                          >
                                            {proj.name}
                                          </span>
                                          <div className="flex items-center gap-1.5 mt-0.5">
                                            <span className="text-[10px] text-slate-500 font-normal">{proj.category}</span>
                                            <span className="text-[9px] text-slate-300">•</span>
                                            <span className={cn(
                                              "text-[9px] font-normal px-1.5 py-0.2 rounded",
                                              proj.status === 'Đúng tiến độ' ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60" :
                                              proj.status === 'Chậm tiến độ' ? "bg-amber-50 text-amber-700 border border-amber-200/60" :
                                              "bg-rose-50 text-rose-700 border border-rose-200/60"
                                            )}>
                                              {proj.status}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Project Kế hoạch vốn */}
                                    <td className="py-2.5 px-3 text-right font-mono text-slate-600 font-normal">
                                      {formatVN(projTotalCap)}
                                    </td>

                                    {/* Project 1. KL đã thực hiện */}
                                    <td className={cn("py-2.5 px-3 text-right font-mono font-normal text-indigo-900/80", selectedDisbursementCard === 'executed' && "bg-indigo-50/80 font-medium text-indigo-950")}>
                                      {formatVN(projExecuted)}
                                    </td>

                                    {/* Project 2. KL nghiệm thu */}
                                    <td className={cn("py-2.5 px-3 text-right font-mono font-normal text-teal-900/80", selectedDisbursementCard === 'accepted' && "bg-teal-50/80 font-medium text-teal-950")}>
                                      {formatVN(projAccepted)}
                                    </td>

                                    {/* Project 3. Số đã giải ngân */}
                                    <td className={cn("py-2.5 px-3 text-right font-mono font-normal text-emerald-900/90", selectedDisbursementCard === 'disbursed' && "bg-emerald-50 font-medium text-emerald-950")}>
                                      {formatVN(proj.disbursed)}
                                    </td>

                                    {/* Project 4. Số KB xác nhận */}
                                    <td className={cn("py-2.5 px-3 text-right font-mono font-normal text-amber-900/90", selectedDisbursementCard === 'treasury' && "bg-amber-50 font-medium text-amber-950")}>
                                      {formatVN(proj.treasuryDisbursed)}
                                    </td>

                                    {/* Project 5. Số còn phải giải ngân */}
                                    <td className={cn("py-2.5 px-3 text-right font-mono font-normal text-rose-900/90", selectedDisbursementCard === 'remaining' && "bg-rose-50 font-medium text-rose-950")}>
                                      {formatVN(Math.max(0, projTotalCap - proj.disbursed))}
                                    </td>

                                    {/* Project Tỷ lệ giải ngân */}
                                    <td className="py-2.5 px-4 text-center">
                                      <span className={cn(
                                        "text-[11px] font-normal font-mono",
                                        projRate >= 70 ? "text-emerald-700" :
                                        projRate >= 35 ? "text-amber-700" :
                                        "text-rose-700"
                                      )}>
                                        {projRate.toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Số liệu tổng hợp được cập nhật trực tiếp theo dữ liệu báo cáo mới nhất của tỉnh.</span>
              </div>
              <button
                onClick={() => setShowDisbursementModal(false)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-sm w-full sm:w-auto"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
