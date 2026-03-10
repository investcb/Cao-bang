export interface Project {
  id: string;
  name: string;
  district: string;
  commune: string;
  totalInvestment: number; // Tổng mức đầu tư dự án
  pmCapital: number; // Vốn Thủ tướng giao (giữ lại để tính toán)
  provinceCapital: number; // Tổng vốn được giao trong năm
  assignedCapital: number; // Vốn đã giao
  unassignedCapital: number; // Vốn chưa giao
  disbursed: number; // Vốn đã giải ngân (Chủ đầu tư báo cáo)
  treasuryDisbursed: number; // Vốn đã giải ngân (Kho bạc đối chiếu)
  treasuryReconciliationDate: string; // Ngày đối chiếu kho bạc
  hasCamera: boolean; // Có camera hiện trường không
  cameraUrl?: string; // Link xem camera
  category: 'Giao thông' | 'Y tế' | 'Giáo dục' | 'Nông nghiệp' | 'Khác';
  status: 'Đúng tiến độ' | 'Chậm tiến độ' | 'Vướng mắc';
  difficultyType?: 'Giải phóng mặt bằng' | 'Nguồn vốn' | 'Thủ tục hành chính' | 'Vật liệu xây dựng' | 'Khác';
  authorityLevel?: 'Trung ương' | 'Tỉnh' | 'Huyện' | 'Xã';
  difficulty?: string;
  solution?: string;
}

export interface MonthlyData {
  month: string;
  target: number;
  actual: number;
}

export const DISTRICTS = [
  "Ban CSSP",
  "Ban QLDA Đầu tư và Xây dựng tỉnh Cao Bằng",
  "Ban QLDA ĐTXD các công trình giao thông",
  "Ban quản lý Khu kinh tế tỉnh",
  "Bộ CHQS tỉnh",
  "Cao đẳng Cao Bằng",
  "Công an tỉnh",
  "Báo và Phát thanh, truyền hình Cao Bằng",
  "Hội nông dân",
  "Quỹ phát triển đất",
  "Sở Dân tộc và Tôn giáo",
  "Sở Khoa học & công nghệ",
  "Sở Nội vụ",
  "Sở Nông nghiệp và Môi trường",
  "Sở Tài chính",
  "Sở Văn hoá, Thể thao và Du lịch",
  "Sở Xây dựng",
  "Sở Y tế",
  "UBND Phường Nùng Trí Cao",
  "UBND phường Tân Giang",
  "UBND phường Thục Phán",
  "UBND xã Bạch Đằng",
  "UBND xã Bảo Lạc",
  "UBND xã Bảo Lâm",
  "UBND xã Bế Văn Đàn",
  "UBND xã Ca Thành",
  "UBND xã Canh Tân",
  "UBND xã Cần Yên",
  "UBND xã Cô Ba",
  "UBND xã Cốc Pàng",
  "UBND xã Đàm Thủy",
  "UBND xã Đình Phong",
  "UBND xã Đoài Dương",
  "UBND xã Độc Lập",
  "UBND xã Đông Khê",
  "UBND xã Đức Long",
  "UBND xã Hạ Lang",
  "UBND xã Hà Quảng",
  "UBND xã Hạnh Phúc",
  "UBND xã Hòa An",
  "UBND xã Huy Giáp",
  "UBND xã Hưng Đạo",
  "UBND xã Kim Đồng",
  "UBND xã Khánh Xuân",
  "UBND xã Lũng Nặm",
  "UBND xã Lý Bôn",
  "UBND xã Lý Quốc",
  "UBND xã Minh Khai",
  "UBND xã Minh Tâm",
  "UBND xã Nam Quang",
  "UBND xã Nam Tuấn",
  "UBND xã Nguyên Bình",
  "UBND xã Nguyễn Huệ",
  "UBND xã Phan Thanh",
  "UBND xã Phục Hòa",
  "UBND xã Quang Hán",
  "UBND xã Quảng Lâm",
  "UBND xã Quang Long",
  "UBND xã Quang Trung",
  "UBND xã Quảng Uyên",
  "UBND xã Sơn Lộ",
  "UBND xã Tam Kim",
  "UBND xã Tĩnh Túc",
  "UBND xã Tổng Cọt",
  "UBND xã Thạch An",
  "UBND xã Thành Công",
  "UBND xã Thanh Long",
  "UBND xã Thông Nông",
  "UBND xã Trà Lĩnh",
  "UBND xã Trùng Khánh",
  "UBND xã Trường Hà",
  "UBND xã Vinh Quý",
  "UBND xã Xuân Trường",
  "UBND xã Yên Thổ"
];

export const MOCK_PROJECTS: Project[] = [
  { 
    id: '1', 
    name: 'Đường bộ cao tốc Đồng Đăng - Trà Lĩnh', 
    district: 'Cấp tỉnh', 
    commune: 'Ban QLDA ĐTXD các công trình giao thông', 
    totalInvestment: 14331,
    pmCapital: 4800,
    provinceCapital: 5000,
    assignedCapital: 4500,
    unassignedCapital: 500,
    disbursed: 1250, 
    treasuryDisbursed: 1180,
    treasuryReconciliationDate: '01/03/2026',
    hasCamera: true,
    cameraUrl: 'https://example.com/camera/1',
    category: 'Giao thông',
    status: 'Chậm tiến độ',
    difficultyType: 'Giải phóng mặt bằng',
    authorityLevel: 'Trung ương',
    difficulty: 'Vướng mắc trong công tác giải phóng mặt bằng tại một số vị trí nền đường yếu.',
    solution: 'Hỗ trợ tái định cư sớm cho các hộ dân và áp dụng biện pháp kỹ thuật xử lý nền đất yếu.'
  },
  { 
    id: '2', 
    name: 'Cải tạo, nâng cấp Quốc lộ 4A', 
    district: 'Cấp tỉnh', 
    commune: 'Sở Xây dựng', 
    totalInvestment: 2500,
    pmCapital: 750,
    provinceCapital: 800,
    assignedCapital: 800,
    unassignedCapital: 0,
    disbursed: 450, 
    treasuryDisbursed: 442,
    treasuryReconciliationDate: '02/03/2026',
    hasCamera: false,
    category: 'Giao thông',
    status: 'Đúng tiến độ'
  },
  { 
    id: '3', 
    name: 'Xây dựng Bệnh viện Đa khoa tỉnh (Giai đoạn 2)', 
    district: 'Cấp tỉnh', 
    commune: 'Sở Y tế', 
    totalInvestment: 1200,
    pmCapital: 300,
    provinceCapital: 350,
    assignedCapital: 350,
    unassignedCapital: 0,
    disbursed: 210, 
    treasuryDisbursed: 195,
    treasuryReconciliationDate: '28/02/2026',
    hasCamera: true,
    cameraUrl: 'https://example.com/camera/3',
    category: 'Y tế',
    status: 'Vướng mắc',
    difficultyType: 'Vật liệu xây dựng',
    authorityLevel: 'Tỉnh',
    difficulty: 'Thiếu hụt nguồn cung vật liệu xây dựng (cát, đá) do các mỏ đang gia hạn giấy phép.',
    solution: 'UBND tỉnh chỉ đạo Sở TN&MT ưu tiên cấp phép khai thác cho các mỏ phục vụ dự án trọng điểm.'
  },
  { 
    id: '4', 
    name: 'Hệ thống thủy lợi hồ Bản Viết', 
    district: 'Cấp tỉnh', 
    commune: 'Sở Nông nghiệp và Môi trường', 
    totalInvestment: 500,
    pmCapital: 100,
    provinceCapital: 120,
    assignedCapital: 120,
    unassignedCapital: 0,
    disbursed: 95, 
    treasuryDisbursed: 92,
    treasuryReconciliationDate: '01/03/2026',
    hasCamera: false,
    category: 'Nông nghiệp',
    status: 'Đúng tiến độ'
  },
  { 
    id: '5', 
    name: 'Trường THPT Chuyên Cao Bằng (Cơ sở mới)', 
    district: 'Cấp tỉnh', 
    commune: 'Sở Tài chính', 
    totalInvestment: 450,
    pmCapital: 140,
    provinceCapital: 150,
    assignedCapital: 150,
    unassignedCapital: 0,
    disbursed: 140, 
    treasuryDisbursed: 138,
    treasuryReconciliationDate: '02/03/2026',
    hasCamera: true,
    cameraUrl: 'https://example.com/camera/5',
    category: 'Giáo dục',
    status: 'Đúng tiến độ'
  },
  { 
    id: '6', 
    name: 'Đường tỉnh 208 (Giai đoạn 2)', 
    district: 'Cấp tỉnh', 
    commune: 'Ban QLDA Đầu tư và Xây dựng tỉnh Cao Bằng', 
    totalInvestment: 1100,
    pmCapital: 380,
    provinceCapital: 400,
    assignedCapital: 350,
    unassignedCapital: 50,
    disbursed: 180, 
    treasuryDisbursed: 165,
    treasuryReconciliationDate: '01/03/2026',
    hasCamera: true,
    cameraUrl: 'https://example.com/camera/6',
    category: 'Giao thông',
    status: 'Chậm tiến độ',
    difficultyType: 'Khác',
    authorityLevel: 'Huyện',
    difficulty: 'Thời tiết mưa kéo dài ảnh hưởng đến công tác thảm nhựa mặt đường.',
    solution: 'Tăng cường nhân lực và máy móc thi công bù tiến độ vào những ngày thời tiết thuận lợi.'
  },
  { 
    id: '7', 
    name: 'Khu tái định cư cửa khẩu Trà Lĩnh', 
    district: 'Cấp xã', 
    commune: 'UBND xã Đàm Thủy', 
    totalInvestment: 350,
    pmCapital: 70,
    provinceCapital: 80,
    assignedCapital: 50,
    unassignedCapital: 30,
    disbursed: 30, 
    treasuryDisbursed: 28,
    treasuryReconciliationDate: '27/02/2026',
    hasCamera: false,
    category: 'Khác',
    status: 'Vướng mắc',
    difficultyType: 'Thủ tục hành chính',
    authorityLevel: 'Huyện',
    difficulty: 'Chưa thống nhất được đơn giá bồi thường cây trồng trên đất.',
    solution: 'Vận động người dân và áp dụng khung giá bồi thường mới nhất của tỉnh.'
  },
  { 
    id: '8', 
    name: 'Nâng cấp lưới điện nông thôn Bảo Lạc', 
    district: 'Cấp xã', 
    commune: 'UBND xã Cô Ba', 
    totalInvestment: 200,
    pmCapital: 50,
    provinceCapital: 60,
    assignedCapital: 60,
    unassignedCapital: 0,
    disbursed: 45, 
    treasuryDisbursed: 42,
    treasuryReconciliationDate: '01/03/2026',
    hasCamera: false,
    category: 'Khác',
    status: 'Đúng tiến độ'
  },
  { 
    id: '9', 
    name: 'Cầu Bản Giốc', 
    district: 'Cấp xã', 
    commune: 'UBND xã Trường Hà', 
    totalInvestment: 600,
    pmCapital: 180,
    provinceCapital: 200,
    assignedCapital: 200,
    unassignedCapital: 0,
    disbursed: 160, 
    treasuryDisbursed: 155,
    treasuryReconciliationDate: '02/03/2026',
    hasCamera: true,
    cameraUrl: 'https://example.com/camera/9',
    category: 'Giao thông',
    status: 'Đúng tiến độ'
  },
  { 
    id: '10', 
    name: 'Kè chống sạt lở sông Bằng Giang', 
    district: 'Cấp tỉnh', 
    commune: 'Ban quản lý Khu kinh tế tỉnh', 
    totalInvestment: 850,
    pmCapital: 150,
    provinceCapital: 180,
    assignedCapital: 100,
    unassignedCapital: 80,
    disbursed: 70, 
    treasuryDisbursed: 62,
    treasuryReconciliationDate: '28/02/2026',
    hasCamera: false,
    category: 'Nông nghiệp',
    status: 'Chậm tiến độ',
    difficultyType: 'Thủ tục hành chính',
    authorityLevel: 'Trung ương',
    difficulty: 'Vướng mắc thủ tục chuyển đổi mục đích sử dụng đất rừng phòng hộ.',
    solution: 'Đang trình Bộ NN&PTNT xem xét, phê duyệt phương án chuyển đổi.'
  },
  { 
    id: '11', 
    name: 'Hệ thống các Trường nội trú biên giới', 
    district: 'Cấp tỉnh', 
    commune: 'Sở Khoa học & công nghệ', 
    totalInvestment: 400,
    pmCapital: 120,
    provinceCapital: 130,
    assignedCapital: 130,
    unassignedCapital: 0,
    disbursed: 45, 
    treasuryDisbursed: 40,
    treasuryReconciliationDate: '01/03/2026',
    hasCamera: false,
    category: 'Giáo dục',
    status: 'Chậm tiến độ',
    difficultyType: 'Nguồn vốn',
    authorityLevel: 'Xã',
    difficulty: 'Chậm phân bổ vốn đối ứng từ ngân sách địa phương.',
    solution: 'Kiến nghị Sở Tài chính ưu tiên cân đối nguồn vốn trong quý II.'
  },
  // Automatically generated projects for each district/commune to ensure 3-5 projects
  ...DISTRICTS.flatMap((d, idx) => {
    const projects: Project[] = [];
    const categories: Project['category'][] = ['Giao thông', 'Y tế', 'Giáo dục', 'Nông nghiệp', 'Khác'];
    const statuses: Project['status'][] = ['Đúng tiến độ', 'Chậm tiến độ', 'Vướng mắc'];
    const difficulties: Project['difficultyType'][] = ['Giải phóng mặt bằng', 'Nguồn vốn', 'Thủ tục hành chính', 'Vật liệu xây dựng', 'Khác'];
    
    // Add 4 projects for each unit
    for (let i = 1; i <= 4; i++) {
      const projId = `auto-${idx}-${i}`;
      const cap = 10 + (idx % 20) + (i * 5);
      const dis = cap * (0.2 + (idx % 7) * 0.1);
      
      projects.push({
        id: projId,
        name: `Dự án ${categories[(idx + i) % 5]} - ${d} (Giai đoạn ${i})`,
        district: d.startsWith('UBND') ? 'Cấp xã' : 'Cấp tỉnh',
        commune: d,
        totalInvestment: cap * 3,
        pmCapital: cap,
        provinceCapital: cap + 2,
        assignedCapital: cap + 2,
        unassignedCapital: 0,
        disbursed: Math.min(dis, cap + 2),
        treasuryDisbursed: Math.min(dis * 0.95, cap + 2),
        treasuryReconciliationDate: '01/03/2026',
        hasCamera: (idx + i) % 3 === 0,
        category: categories[(idx + i) % 5],
        status: statuses[(idx + i) % 3],
        difficultyType: (idx + i) % 3 !== 0 ? difficulties[(idx + i) % 5] : undefined,
        authorityLevel: d.startsWith('UBND') ? 'Xã' : 'Tỉnh'
      });
    }
    return projects;
  })
];

export const MONTHLY_DISBURSEMENT: MonthlyData[] = [
  { month: 'Tháng 1', target: 5, actual: 3.2 },
  { month: 'Tháng 2', target: 12, actual: 8.5 },
  { month: 'Tháng 3', target: 20, actual: 15.8 },
  { month: 'Tháng 4', target: 28, actual: 22.1 },
  { month: 'Tháng 5', target: 35, actual: 30.5 },
  { month: 'Tháng 6', target: 45, actual: 42.0 },
  { month: 'Tháng 7', target: 55, actual: 48.2 },
  { month: 'Tháng 8', target: 65, actual: 58.0 },
  { month: 'Tháng 9', target: 75, actual: 68.5 },
  { month: 'Tháng 10', target: 85, actual: 75.2 },
  { month: 'Tháng 11', target: 92, actual: 82.0 },
  { month: 'Tháng 12', target: 100, actual: 91.5 },
];
