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
  Info
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { cn } from './lib/utils';
import { MOCK_PROJECTS, MONTHLY_DISBURSEMENT, DISTRICTS, Project } from './data';

export default function App() {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Toàn tỉnh');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<{ type: 'category' | 'difficultyType', value: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [difficultyView, setDifficultyView] = useState<'level' | 'type'>('level');
  const [cameraProject, setCameraProject] = useState<Project | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  // Calculations
  const filteredProjects = useMemo(() => {
    return MOCK_PROJECTS.filter(p => {
      const matchesDistrict = selectedDistrict === 'Toàn tỉnh' || p.district === selectedDistrict || p.commune === selectedDistrict;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.commune.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDistrict && matchesSearch;
    });
  }, [selectedDistrict, searchQuery]);

  const stats = useMemo(() => {
    const pmTotal = filteredProjects.reduce((acc, p) => acc + p.pmCapital, 0);
    const provinceTotal = filteredProjects.reduce((acc, p) => acc + p.provinceCapital, 0);
    const assignedTotal = filteredProjects.reduce((acc, p) => acc + p.assignedCapital, 0);
    const unassignedTotal = filteredProjects.reduce((acc, p) => acc + p.unassignedCapital, 0);
    const totalDis = filteredProjects.reduce((acc, p) => acc + p.disbursed, 0);
    const treasuryTotalDis = filteredProjects.reduce((acc, p) => acc + p.treasuryDisbursed, 0);
    
    const rateProvince = provinceTotal > 0 ? (totalDis / provinceTotal) * 100 : 0;
    const ratePM = pmTotal > 0 ? (totalDis / pmTotal) * 100 : 0;
    const rateTreasury = provinceTotal > 0 ? (treasuryTotalDis / provinceTotal) * 100 : 0;
    
    // Get the latest reconciliation date
    const latestDate = filteredProjects.length > 0 
      ? [...filteredProjects].sort((a, b) => {
          const dateA = a.treasuryReconciliationDate.split('/').reverse().join('');
          const dateB = b.treasuryReconciliationDate.split('/').reverse().join('');
          return dateB.localeCompare(dateA);
        })[0].treasuryReconciliationDate
      : 'N/A';
    
    return { 
      pmTotal, provinceTotal, assignedTotal, unassignedTotal, totalDis, 
      treasuryTotalDis, rateProvince, ratePM, rateTreasury, latestDate 
    };
  }, [filteredProjects]);

  const districtStats = useMemo(() => {
    return DISTRICTS.map(d => {
      const projects = MOCK_PROJECTS.filter(p => p.commune === d);
      const cap = projects.reduce((acc, p) => acc + p.provinceCapital, 0);
      const dis = projects.reduce((acc, p) => acc + p.disbursed, 0);
      
      // If no projects found, generate some mock data for the expanded list to look "real"
      let rate = cap > 0 ? (dis / cap) * 100 : 0;
      let total = cap;
      
      if (projects.length === 0) {
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
  }, []);

  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    filteredProjects.forEach(p => {
      cats[p.category] = (cats[p.category] || 0) + p.disbursed;
    });
    return Object.entries(cats).map(([name, value]) => ({ name, value }));
  }, [filteredProjects]);

  const projectsWithIssues = useMemo(() => {
    return MOCK_PROJECTS.filter(p => p.status !== 'Đúng tiến độ');
  }, []);

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
    const caoToc = MOCK_PROJECTS.find(p => p.name.includes('Đồng Đăng - Trà Lĩnh'));
    const truongNoiTru = MOCK_PROJECTS.find(p => p.name.includes('Trường nội trú biên giới'));

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

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  const ISSUE_COLORS = ['#f43f5e', '#fb923c', '#facc15', '#2dd4bf', '#a855f7'];

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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cao Bằng Investment Monitor</h1>
              <p className="text-xs text-slate-500 font-medium">Hệ thống theo dõi giải ngân vốn đầu tư công</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Tìm kiếm dự án, chủ đầu tư..."
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-full text-sm w-full md:w-64 transition-all outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select 
              className="bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 rounded-full px-4 py-2 text-sm font-medium outline-none cursor-pointer transition-all"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <option value="Toàn tỉnh">Toàn tỉnh</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <button 
              onClick={handleExportImage}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-full text-sm font-bold transition-all shadow-lg shadow-indigo-200"
            >
              <FileDown className="w-4 h-4" />
              {isExporting ? 'Đang xuất...' : 'Xuất ảnh báo cáo'}
            </button>
          </div>
        </div>
      </header>

      <main ref={dashboardRef} className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 flex flex-col justify-between group hover:border-indigo-200 transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng Kế Hoạch Vốn</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Vốn Ngân sách Tỉnh</p>
                  <div className="text-2xl font-bold text-slate-900">{stats.provinceTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">tỷ</span></div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Vốn Ngân sách TW</p>
                  <div className="text-lg font-bold text-slate-700">{stats.pmTotal.toLocaleString()} <span className="text-xs font-normal text-slate-500">tỷ</span></div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Đã giao</p>
                  <p className="text-sm font-bold text-emerald-600">{stats.assignedTotal.toLocaleString()} tỷ</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Chưa giao</p>
                  <p className="text-sm font-bold text-rose-600">{stats.unassignedTotal.toLocaleString()} tỷ</p>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between group hover:border-emerald-200 transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Đã Giải Ngân</span>
            </div>
            <div className="mt-4">
              <div className="text-3xl font-bold text-slate-900">{stats.totalDis.toLocaleString()} <span className="text-sm font-normal text-slate-500">tỷ VNĐ</span></div>
              <div className="flex items-center mt-1 text-emerald-600 text-xs font-semibold">
                <Activity className="w-3 h-3 mr-1" />
                <span>Đang đẩy nhanh tiến độ</span>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 flex flex-col justify-between group hover:border-amber-200 transition-colors">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tỷ Lệ Giải Ngân</span>
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Theo số giao của Tỉnh</span>
                  <span className="text-sm font-bold text-slate-900">{stats.rateProvince.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 transition-all duration-1000" 
                    style={{ width: `${stats.rateProvince}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Theo số giao của TT</span>
                  <span className="text-sm font-bold text-slate-900">{stats.ratePM.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 transition-all duration-1000" 
                    style={{ width: `${stats.ratePM}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Theo đối chiếu Kho bạc ({stats.latestDate})</span>
                  <span className="text-sm font-bold text-rose-600">{stats.rateTreasury.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-500 transition-all duration-1000" 
                    style={{ width: `${stats.rateTreasury}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary Report */}
        <div className="glass-card p-6 border-indigo-100 bg-indigo-50/20">
          <div className="flex items-center gap-2 mb-4 text-indigo-700">
            <FileText className="w-5 h-5" />
            <h3 className="font-bold uppercase tracking-wider text-sm">Báo cáo tóm tắt tình hình thực hiện</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 text-sm leading-relaxed text-slate-700">
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">1</span>
                <p>
                  Tổng vốn đầu tư công của tỉnh là <span className="font-bold text-slate-900">{(stats.provinceTotal * 1000).toLocaleString()} triệu đồng</span>; 
                  Số vốn đã phân bổ, giao cho các chủ đầu tư thực hiện là <span className="font-bold text-slate-900">{(stats.assignedTotal * 1000).toLocaleString()}/{(stats.provinceTotal * 1000).toLocaleString()} triệu đồng</span>, 
                  đạt <span className="font-bold text-indigo-600">{((stats.assignedTotal / stats.provinceTotal) * 100).toFixed(1)}%</span> kế hoạch.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">2</span>
                <p>
                  Theo số vốn đã giao chi tiết, đến hết ngày <span className="font-bold text-slate-900">02/03/2026</span> kết quả giải ngân của tỉnh Cao Bằng là 
                  <span className="font-bold text-slate-900"> {(stats.totalDis * 1000).toLocaleString()}/{(stats.assignedTotal * 1000).toLocaleString()} triệu đồng</span>, 
                  đạt <span className="font-bold text-emerald-600">{((stats.totalDis / stats.assignedTotal) * 100).toFixed(1)}%</span> kế hoạch.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">3</span>
                <p>
                  Hiện tại, có <span className="font-bold text-rose-600">{reportData.issuesByLevel['Trung ương']}</span> vướng mắc thuộc thẩm quyền cấp trung ương; 
                  có <span className="font-bold text-rose-600">{reportData.issuesByLevel['Tỉnh']}</span> vướng mắc thuộc thẩm quyền cấp tỉnh; 
                  có <span className="font-bold text-rose-600">{reportData.issuesByLevel['Huyện']}</span> vướng mắc thuộc thẩm quyền cấp huyện; 
                  có <span className="font-bold text-rose-600">{reportData.issuesByLevel['Xã']}</span> vướng mắc thuộc thẩm quyền cấp xã. 
                  Trong đó: Có <span className="font-bold text-rose-600">{reportData.gpmbCount}</span> vướng mắc giải phóng mặt bằng thuộc <span className="font-bold text-slate-900">{reportData.gpmbOwners}</span> chủ đầu tư.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">4</span>
                <p>
                  Dự án {reportData.caoToc?.name}, giải ngân được <span className="font-bold text-slate-900">{(reportData.caoToc ? reportData.caoToc.disbursed * 1000 : 0).toLocaleString()} triệu đồng</span>, 
                  đạt <span className="font-bold text-indigo-600">{reportData.caoToc ? ((reportData.caoToc.disbursed / reportData.caoToc.provinceCapital) * 100).toFixed(1) : 0}%</span> kế hoạch. 
                  Dự án {reportData.truongNoiTru?.name}, giải ngân được <span className="font-bold text-slate-900">{(reportData.truongNoiTru ? reportData.truongNoiTru.disbursed * 1000 : 0).toLocaleString()} triệu đồng</span>, 
                  đạt <span className="font-bold text-rose-600">{reportData.truongNoiTru ? ((reportData.truongNoiTru.disbursed / reportData.truongNoiTru.provinceCapital) * 100).toFixed(1) : 0}%</span> kế hoạch.
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">5</span>
                <p>
                  Đơn vị có kết quả giải ngân thấp ({reportData.lowDisbursementUnits.length} đơn vị), cụ thể: {reportData.lowDisbursementUnits.map((u, i) => (
                    <span key={u.name}>
                      <span className="font-bold text-rose-600">{u.name} ({u.rate.toFixed(1)}%)</span>
                      {i < reportData.lowDisbursementUnits.length - 1 ? '; ' : '.'}
                    </span>
                  ))}
                </p>
              </div>
              <div className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">6</span>
                <p>
                  Các đơn vị chủ đầu tư trong tuần chưa có cập nhật báo cáo số liệu giải ngân: 
                  Có <span className="font-bold text-rose-600">{reportData.noUpdateUnits.length}</span> đơn vị, cụ thể: <span className="italic text-slate-500">
                    {reportData.noUpdateUnits.map(u => u.name).join(', ')}
                  </span>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Trend */}
          <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-500" />
                Tiến độ giải ngân theo tháng
              </h3>
              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-indigo-500" /> Kế hoạch
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500" /> Thực tế
                </div>
              </div>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={MONTHLY_DISBURSEMENT}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    unit="%"
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="target" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="actual" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-500" />
              Cơ cấu theo lĩnh vực
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {categoryData.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{item.name}</span>
                  <span className="font-bold text-slate-700">{item.value.toLocaleString()} tỷ</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Difficulty Analysis Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Difficulties by Category */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Vướng mắc phân bổ theo lĩnh vực
              </div>
              {difficultyFilter?.type === 'category' && (
                <button 
                  onClick={() => setDifficultyFilter(null)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  Xóa lọc
                </button>
              )}
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={difficultyByCategoryData} 
                  layout="vertical"
                  onClick={(data) => {
                    if (data && data.activeLabel) {
                      setDifficultyFilter({ type: 'category', value: data.activeLabel });
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
                    width={100}
                    style={{ cursor: 'pointer' }}
                  />
                  <Tooltip 
                    cursor={{ fill: 'slate-100', opacity: 0.4 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} style={{ cursor: 'pointer' }}>
                    {difficultyByCategoryData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={ISSUE_COLORS[index % ISSUE_COLORS.length]}
                        stroke={difficultyFilter?.value === entry.name ? '#000' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Difficulties by Type */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500" />
                Phân loại khó khăn, vướng mắc
              </div>
              {difficultyFilter?.type === 'difficultyType' && (
                <button 
                  onClick={() => setDifficultyFilter(null)}
                  className="text-[10px] font-bold text-indigo-600 hover:underline"
                >
                  Xóa lọc
                </button>
              )}
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={difficultyByTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    onClick={(data) => {
                      if (data && data.name) {
                        setDifficultyFilter({ type: 'difficultyType', value: data.name });
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    {difficultyByTypeData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={ISSUE_COLORS[(index + 2) % ISSUE_COLORS.length]}
                        stroke={difficultyFilter?.value === entry.name ? '#000' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center" 
                    iconType="circle"
                    formatter={(value) => <span className="text-[10px] font-bold text-slate-600 ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filtered Project Names from Chart Click */}
        {difficultyFilter && (
          <div className="glass-card p-4 bg-rose-50/30 border-rose-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                Dự án có vướng mắc: <span className="text-slate-900">{difficultyFilter.value}</span>
              </p>
              <button onClick={() => setDifficultyFilter(null)} className="text-rose-400 hover:text-rose-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {filteredIssues.map(p => (
                <button 
                  key={p.id}
                  onClick={() => setSelectedProject(p)}
                  className="px-3 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-medium text-slate-700 hover:border-rose-400 hover:shadow-sm transition-all"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* District Breakdown & Project List */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* District Ranking */}
          <div className="xl:col-span-1 glass-card p-6 flex flex-col">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-500" />
              Xếp hạng theo chủ đầu tư
            </h3>
            <div className="space-y-4 h-[620px] overflow-y-auto pr-2 custom-scrollbar">
              {districtStats.map((d, idx) => (
                <div 
                  key={d.name} 
                  className={cn(
                    "p-3 rounded-xl transition-all cursor-pointer border border-transparent",
                    selectedDistrict === d.name ? "bg-indigo-50 border-indigo-100" : "hover:bg-slate-50"
                  )}
                  onClick={() => setSelectedDistrict(d.name)}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="text-sm font-semibold text-slate-700 block">{d.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium italic">Báo cáo: {d.lastReported}</span>
                    </div>
                    <span className="text-xs font-bold text-indigo-600">{d.rate.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        d.rate > 80 ? "bg-emerald-500" : d.rate > 50 ? "bg-amber-500" : "bg-rose-500"
                      )}
                      style={{ width: `${d.rate}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Project Table */}
          <div className="xl:col-span-3 glass-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-500" />
                Danh sách dự án trọng điểm ({filteredProjects.length})
              </h3>
              <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                Xem tất cả <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tên dự án</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Địa điểm</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Vốn đầu tư</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">Tỷ lệ</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">Hiện trường</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.map((p) => (
                    <tr 
                      key={p.id} 
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => setSelectedProject(p)}
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{p.name}</div>
                        <div className="text-[10px] font-medium text-slate-400 mt-0.5">{p.category}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-600 font-medium">{p.commune}</div>
                        <div className="text-[10px] text-slate-400">{p.district}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold",
                          p.status === 'Đúng tiến độ' ? "bg-emerald-50 text-emerald-600" : 
                          p.status === 'Chậm tiến độ' ? "bg-amber-50 text-amber-600" : "bg-rose-50 text-rose-600"
                        )}>
                          {p.status === 'Đúng tiến độ' ? <CheckCircle2 className="w-3 h-3" /> : 
                           p.status === 'Chậm tiến độ' ? <Clock className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {p.status}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                        {p.provinceCapital.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">tỷ</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full",
                                  (p.disbursed / p.provinceCapital) > 0.8 ? "bg-emerald-500" : (p.disbursed / p.provinceCapital) > 0.5 ? "bg-amber-500" : "bg-rose-500"
                                )}
                                style={{ width: `${(p.disbursed / p.provinceCapital) * 100}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-700">
                              {((p.disbursed / p.provinceCapital) * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-[9px] text-slate-400 font-medium">
                            Kho bạc: {((p.treasuryDisbursed / p.provinceCapital) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (p.hasCamera) {
                              setCameraProject(p);
                            } else {
                              alert(`Hiện trường dự án "${p.name}" chưa lắp đặt hệ thống camera giám sát.`);
                            }
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            p.hasCamera 
                              ? "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 shadow-sm" 
                              : "bg-slate-50 text-slate-300 cursor-pointer hover:bg-slate-100"
                          )}
                          title={p.hasCamera ? "Xem camera hiện trường" : "Chưa lắp đặt camera"}
                        >
                          {p.hasCamera ? <Video className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Difficulties & Solutions Section */}
        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-slate-800">Khó khăn, vướng mắc & Giải pháp</h3>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setDifficultyView('level')}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                  difficultyView === 'level' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Theo cấp giải quyết
              </button>
              <button 
                onClick={() => setDifficultyView('type')}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all",
                  difficultyView === 'type' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Theo loại vướng mắc
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {(difficultyView === 'level' ? ['Trung ương', 'Tỉnh', 'Huyện', 'Xã'] : ['Giải phóng mặt bằng', 'Nguồn vốn', 'Thủ tục hành chính', 'Vật liệu xây dựng', 'Khác']).map((group) => {
              const projectsInGroup = projectsWithIssues.filter(p => 
                difficultyView === 'level' ? p.authorityLevel === group : (p.difficultyType || 'Khác') === group
              );

              if (projectsInGroup.length === 0) return null;

              return (
                <div key={group} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-100"></div>
                    <span className="px-4 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full">
                      {group} ({projectsInGroup.length})
                    </span>
                    <div className="h-px flex-1 bg-slate-100"></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {projectsInGroup.map((p) => (
                      <div key={p.id} className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-medium text-slate-400">{p.district}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                              <span className="text-[10px] font-bold text-indigo-500">{p.difficultyType || 'Khác'}</span>
                            </div>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            p.status === 'Chậm tiến độ' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                          )}>
                            {p.status}
                          </span>
                        </div>
                        <div className="space-y-4">
                          <div className="flex gap-3">
                            <div className="mt-1 p-1.5 bg-rose-50 rounded-xl text-rose-500 shrink-0">
                              <AlertCircle className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Khó khăn, vướng mắc</p>
                              <p className="text-xs text-slate-600 leading-relaxed font-medium">{p.difficulty}</p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <div className="mt-1 p-1.5 bg-emerald-50 rounded-xl text-emerald-500 shrink-0">
                              <Lightbulb className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Giải pháp, kiến nghị</p>
                              <p className="text-xs text-slate-600 leading-relaxed italic">{p.solution}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
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
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng mức đầu tư dự án</p>
                  <p className="text-2xl font-bold text-slate-900">{selectedProject.totalInvestment.toLocaleString()} tỷ VNĐ</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tổng vốn được giao trong năm</p>
                  <p className="text-2xl font-bold text-slate-700">{selectedProject.provinceCapital.toLocaleString()} tỷ VNĐ</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giải ngân (Chủ đầu tư báo cáo)</p>
                  <p className="text-2xl font-bold text-indigo-600">{selectedProject.disbursed.toLocaleString()} tỷ</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500" 
                        style={{ width: `${Math.min(100, (selectedProject.disbursed / selectedProject.provinceCapital) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-indigo-600">
                      {((selectedProject.disbursed / selectedProject.provinceCapital) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="md:border-l border-slate-200 md:pl-6 space-y-1">
                  <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Giải ngân (Kho bạc đối chiếu {selectedProject.treasuryReconciliationDate})</p>
                  <p className="text-2xl font-bold text-rose-600">{selectedProject.treasuryDisbursed.toLocaleString()} tỷ</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-rose-500" 
                        style={{ width: `${Math.min(100, (selectedProject.treasuryDisbursed / selectedProject.provinceCapital) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-rose-600">
                      {((selectedProject.treasuryDisbursed / selectedProject.provinceCapital) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

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
                  <div className="flex gap-3 pt-4 border-t border-rose-200/50">
                    <Lightbulb className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-sm font-bold text-emerald-900">Giải pháp, kiến nghị</h4>
                      <p className="text-sm text-emerald-800/80 leading-relaxed mt-1 italic">{selectedProject.solution}</p>
                    </div>
                  </div>
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
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
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
    </div>
  );
}
