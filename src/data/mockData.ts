/**
 * Dữ liệu mẫu (Seed Data) chuẩn cho Hệ thống Đánh giá Chất lượng và Quản lý Nhuận bút (KPI & Royalty)
 * Đồ án SWP391 - Tòa soạn báo điện tử
 * Tuân thủ tuyệt đối quy tắc nghiệp vụ:
 * - 6 vai trò, 12 nhân sự chuẩn
 * - Danh mục 9 thể loại theo Nghị định 18/2014
 * - Đơn giá một hệ số theo lương cơ sở (234.000đ & 253.000đ)
 * - 18 tham số hệ thống
 * - Bài mẫu trung tâm "Nước sạch ở xóm chài ven sông" và ~25 bài viết trải từ tháng 6 đến tháng 9/2026
 */

import {
  User,
  Role,
  Section,
  Genre,
  Article,
  ArticleAuthor,
  ArticleVersion,
  ArticleAttachment,
  ArticleStatusLog,
  Notification,
  QualityScore,
  UnitPrice,
  RoyaltyItem,
  RoyaltyPeriod,
  PaymentVoucher,
  KpiTarget,
  KpiSnapshot,
  KpiMonthClose,
  ReaderDaily,
  ReaderImportLog,
  MediaFactor,
  RoyaltyRate,
  RoyaltyLine,
  SystemParameter,
  DuplicationMatch,
  Event,
  CriteriaSet,
  ScoringAttempt,
  Appeal,
  CrossReviewBatch,
  CrossReviewAssignment,
  ReviewerDeviationStat
} from '../types';
import { calculateRoyalty, getUnitPriceAtDate } from '../utils/royalty';
import { buildKpiSnapshot, KpiDataSource } from '../utils/kpi';

export const INITIAL_ROLES: Role[] = [
  { id: 'r1', code: 'PHONG_VIEN', name: 'Phóng viên' },
  { id: 'r2', code: 'TRUONG_BAN', name: 'Trưởng ban' },
  { id: 'r3', code: 'BIEN_TAP_VIEN', name: 'Biên tập viên' },
  { id: 'r4', code: 'THU_KY', name: 'Thư ký tòa soạn' },
  { id: 'r5', code: 'KE_TOAN', name: 'Kế toán' },
  { id: 'r6', code: 'ADMIN', name: 'Quản trị hệ thống' }
];

export const INITIAL_SECTIONS: Section[] = [
  { id: 'sec-xahoi', code: 'XA_HOI', name: 'Ban Xã hội', description: 'Đời sống dân sinh, phóng sự điều tra, các vấn đề an sinh xã hội', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'sec-kinhte', code: 'KINH_TE', name: 'Ban Kinh tế', description: 'Tài chính ngân hàng, thị trường, doanh nghiệp và đầu tư', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'sec-thoisu', code: 'THOI_SU', name: 'Ban Thời sự', description: 'Chính trị, ngoại giao, chính sách và sự kiện nóng', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'sec-vanhoa', code: 'VAN_HOA', name: 'Ban Văn hóa', description: 'Văn học, nghệ thuật, di sản và đời sống văn hóa', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'sec-thethao', code: 'THE_THAO', name: 'Ban Thể thao', description: 'Thể thao trong nước, quốc tế và các giải đấu lớn', is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' }
];

/**
 * Danh mục 9 thể loại theo Nghị định 18/2014/NĐ-CP:
 * Nhóm NĐ | Tên thể loại | base_factor | max_factor
 * 1 | Tin | 5 | 10
 * 1 | Trả lời bạn đọc | 4 | 10
 * 4 | Chính luận | 15 | 30
 * 5 | Phóng sự | 15 | 30
 * 5 | Ký (một kỳ) | 15 | 30
 * 5 | Phỏng vấn | 12 | 30
 * 6 | Sáng tác văn học | 15 | 30
 * 7 | Nghiên cứu | 15 | 30
 * 8 | Trực tuyến, Media | 25 | 50
 */
export const INITIAL_GENRES: Genre[] = [
  { id: 'cat-tin', code: 'TIN', nd_group: 1, name: 'Tin', base_factor: 5, max_factor: 10, min_factor: 5, is_active: true, description: 'Phản ánh nhanh, kịp thời sự kiện thời sự' },
  { id: 'cat-tlbd', code: 'TRA_LOI_BAN_DOC', nd_group: 1, name: 'Trả lời bạn đọc', base_factor: 4, max_factor: 10, min_factor: 4, is_active: true, description: 'Giải đáp thắc mắc, tư vấn dân sinh pháp luật' },
  { id: 'cat-chinhluan', code: 'CHINH_LUAN', nd_group: 4, name: 'Chính luận', base_factor: 15, max_factor: 30, min_factor: 15, is_active: true, description: 'Bình luận, xã luận phân tích đường lối chính sách' },
  { id: 'cat-phongsu', code: 'PHONG_SU', nd_group: 5, name: 'Phóng sự', base_factor: 15, max_factor: 30, min_factor: 15, is_active: true, description: 'Điều tra, ghi chép hiện trường sâu sắc, chân thực' },
  { id: 'cat-ky', code: 'KY_MOT_KY', nd_group: 5, name: 'Ký (một kỳ)', base_factor: 15, max_factor: 30, min_factor: 15, is_active: true, description: 'Ký sự, bút ký văn học báo chí' },
  { id: 'cat-phongvan', code: 'PHONG_VAN', nd_group: 5, name: 'Phỏng vấn', base_factor: 12, max_factor: 30, min_factor: 12, is_active: true, description: 'Đối thoại trực tiếp với chuyên gia, nhân chứng' },
  { id: 'cat-sangtac', code: 'SANG_TAC_VAN_HOC', nd_group: 6, name: 'Sáng tác văn học', base_factor: 15, max_factor: 30, min_factor: 15, is_active: true, description: 'Truyện ngắn, thơ, tản văn nghệ thuật' },
  { id: 'cat-nghiencuu', code: 'NGHIEN_CUU', nd_group: 7, name: 'Nghiên cứu', base_factor: 15, max_factor: 30, min_factor: 15, is_active: true, description: 'Bài nghiên cứu khoa học xã hội, chuyên đề lý luận' },
  { id: 'cat-media', code: 'TRUC_TUYEN_MEDIA', nd_group: 8, name: 'Trực tuyến, Media', base_factor: 25, max_factor: 50, min_factor: 25, is_active: true, description: 'Megastory, Infographic tương tác, tường thuật trực tuyến' }
];

export const INITIAL_CATEGORIES = INITIAL_GENRES;

/**
 * 12 Người dùng hệ thống theo đặc tả:
 * - PV: Nguyễn Văn An (mặc định), Trần Thị Bình, Lê Hoàng Nam, Phạm Minh Tuấn (Ban Xã hội)
 * - BTV: Đỗ Mạnh Cường, Hoàng Văn Dũng, Vũ Thu Hà (Ban Xã hội), Bùi Quốc Anh (Ban Kinh tế - chuyên gia chấm Phóng sự)
 * - Trưởng ban Xã hội: Phan Hải Long
 * - Thư ký tòa soạn: Vũ Đình Toàn
 * - Kế toán: Nguyễn Bích Ngọc
 * - Admin: Đặng Quốc Cường
 */
export const INITIAL_USERS: User[] = [
  {
    id: 'u-an',
    username: 'nguyenvanan',
    password_hash: 'hash',
    full_name: 'Nguyễn Văn An',
    email: 'an.nv@toasoan.vn',
    phone: '0901234501',
    role_id: 'r1',
    role_code: 'PHONG_VIEN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-PV01',
    job_title: 'Phóng viên Điều tra & Dân sinh',
    department: 'Ban Xã hội',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-binh',
    username: 'tranthibinh',
    password_hash: 'hash',
    full_name: 'Trần Thị Bình',
    email: 'binh.tt@toasoan.vn',
    phone: '0901234502',
    role_id: 'r1',
    role_code: 'PHONG_VIEN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-PV02',
    job_title: 'Phóng viên Ảnh & Phóng sự',
    department: 'Ban Xã hội',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-nam',
    username: 'lehoangnam',
    password_hash: 'hash',
    full_name: 'Lê Hoàng Nam',
    email: 'nam.lh@toasoan.vn',
    phone: '0901234503',
    role_id: 'r1',
    role_code: 'PHONG_VIEN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-PV03',
    job_title: 'Phóng viên Xã hội & Pháp luật',
    department: 'Ban Xã hội',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-tuan',
    username: 'phamminhtuan',
    password_hash: 'hash',
    full_name: 'Phạm Minh Tuấn',
    email: 'tuan.pm@toasoan.vn',
    phone: '0901234504',
    role_id: 'r1',
    role_code: 'PHONG_VIEN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-PV04',
    job_title: 'Phóng viên Đời sống Đô thị',
    department: 'Ban Xã hội',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-cuong-btv',
    username: 'domanhcuong',
    password_hash: 'hash',
    full_name: 'Đỗ Mạnh Cường',
    email: 'cuong.dm@toasoan.vn',
    phone: '0901234505',
    role_id: 'r3',
    role_code: 'BIEN_TAP_VIEN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-BTV01',
    job_title: 'Biên tập viên Ban Xã hội',
    department: 'Ban Xã hội',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-dung',
    username: 'hoangvandung',
    password_hash: 'hash',
    full_name: 'Hoàng Văn Dũng',
    email: 'dung.hv@toasoan.vn',
    phone: '0901234506',
    role_id: 'r3',
    role_code: 'BIEN_TAP_VIEN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-BTV02',
    job_title: 'Biên tập viên Ban Xã hội',
    department: 'Ban Xã hội',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-ha',
    username: 'vuthuha',
    password_hash: 'hash',
    full_name: 'Vũ Thu Hà',
    email: 'ha.vt@toasoan.vn',
    phone: '0901234507',
    role_id: 'r3',
    role_code: 'BIEN_TAP_VIEN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-BTV03',
    job_title: 'Biên tập viên Ban Xã hội',
    department: 'Ban Xã hội',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-quocanh',
    username: 'buiquocanh',
    password_hash: 'hash',
    full_name: 'Bùi Quốc Anh',
    email: 'anh.bq@toasoan.vn',
    phone: '0901234508',
    role_id: 'r3',
    role_code: 'BIEN_TAP_VIEN',
    section_id: 'sec-kinhte',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-BTV04',
    job_title: 'BTV Kinh tế (Chuyên gia thẩm định Phóng sự)',
    department: 'Ban Kinh tế',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-long',
    username: 'phanhailong',
    password_hash: 'hash',
    full_name: 'Phan Hải Long',
    email: 'long.ph@toasoan.vn',
    phone: '0901234509',
    role_id: 'r2',
    role_code: 'TRUONG_BAN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-TB01',
    job_title: 'Trưởng Ban Xã hội',
    department: 'Ban Xã hội',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-toan',
    username: 'vudinhtoan',
    password_hash: 'hash',
    full_name: 'Vũ Đình Toàn',
    email: 'toan.vd@toasoan.vn',
    phone: '0901234510',
    role_id: 'r4',
    role_code: 'THU_KY',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-TK01',
    job_title: 'Thư ký Tòa soạn Chuyên trách Nhuận bút',
    department: 'Ban Thư ký Tòa soạn',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-ngoc',
    username: 'nguyenbichngoc',
    password_hash: 'hash',
    full_name: 'Nguyễn Bích Ngọc',
    email: 'ngoc.nb@toasoan.vn',
    phone: '0901234511',
    role_id: 'r5',
    role_code: 'KE_TOAN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-KT01',
    job_title: 'Kế toán trưởng Tòa soạn',
    department: 'Phòng Kế toán - Tài vụ',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  },
  {
    id: 'u-admin',
    username: 'dangquoccuong',
    password_hash: 'hash',
    full_name: 'Đặng Quốc Cường',
    email: 'cuong.dq@toasoan.vn',
    phone: '0901234512',
    role_id: 'r6',
    role_code: 'ADMIN',
    section_id: 'sec-xahoi',
    status: 'HOAT_DONG',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    press_id: 'HNB-2026-AD01',
    job_title: 'Quản trị viên Hệ thống & Công nghệ',
    department: 'Trung tâm CNTT & Xuất bản số',
    created_at: '2026-01-01',
    updated_at: '2026-01-01'
  }
];

/**
 * Hệ số Media theo Nghị định 18/2014
 */
export const INITIAL_MEDIA_FACTORS: MediaFactor[] = [
  { kind: 'ANH_TU_CHUP', label: 'Ảnh tự chụp', factor_per_item: 3, nd_limit_note: 'Nghị định 18/2014 nhóm 3, tối đa 10' },
  { kind: 'TRANH_TU_VE', label: 'Tranh, minh họa tự vẽ', factor_per_item: 3, nd_limit_note: 'Nghị định 18/2014 nhóm 2, tối đa 10' },
  { kind: 'VIDEO_TU_QUAY', label: 'Video tự quay', factor_per_item: 10, nd_limit_note: 'Nghị định 18/2014 nhóm 8, tối đa 50' },
  { kind: 'NGUON_NGOAI', label: 'Ảnh nguồn ngoài / Tái sử dụng', factor_per_item: 0, nd_limit_note: 'Không hưởng hệ số nhuận bút' }
];

/**
 * Đơn giá một hệ số theo Nghị định lương cơ sở:
 * - 01/07/2024 - 30/06/2026: 2.340.000đ → 234.000đ
 * - Từ 01/07/2026 (NĐ 161/2026): 2.530.000đ → 253.000đ
 */
export const INITIAL_ROYALTY_RATES: RoyaltyRate[] = [
  {
    id: 'rr-1',
    effective_from: '2024-07-01',
    effective_to: '2026-06-30',
    base_salary: 2340000,
    unit_rate: 234000,
    legal_basis: 'Nghị định 73/2024/NĐ-CP (Lương cơ sở 2.340.000 đ)'
  },
  {
    id: 'rr-2',
    effective_from: '2026-07-01',
    base_salary: 2530000,
    unit_rate: 253000,
    legal_basis: 'Nghị định 161/2026/NĐ-CP (Lương cơ sở 2.530.000 đ)'
  }
];

// Mảng tương thích ngược cho màn hình cấu hình đơn giá cũ
export const INITIAL_UNIT_PRICES: UnitPrice[] = [
  {
    id: 'up-legacy-1',
    amount: 234000,
    base_unit_price: 234000,
    photo_unit_price: 70200,
    video_unit_price: 234000,
    effective_from: '2024-07-01',
    effective_to: '2026-06-30',
    effective_date: '2024-07-01',
    is_active: false,
    note: 'Đơn giá 10% lương cơ sở NĐ 73/2024 (234.000 đ)'
  },
  {
    id: 'up-legacy-2',
    amount: 253000,
    base_unit_price: 253000,
    photo_unit_price: 75900,
    video_unit_price: 253000,
    effective_from: '2026-07-01',
    effective_date: '2026-07-01',
    is_active: true,
    note: 'Đơn giá 10% lương cơ sở NĐ 161/2026 (253.000 đ)'
  }
];

/**
 * 18 Tham số hệ thống theo đặc tả:
 */
export const INITIAL_SYSTEM_PARAMETERS: SystemParameter[] = [
  { key: 'MAX_AUTHORS_PER_ARTICLE', label: 'Số tác giả tối đa / bài', value: 5, unit: 'người', flow: 1 },
  { key: 'CO_AUTHOR_CONFIRM_DEADLINE_DAYS', label: 'Hạn đồng tác giả xác nhận', value: 3, unit: 'ngày', flow: 1 },
  { key: 'CONTENT_DUPLICATION_WARN_THRESHOLD', label: 'Ngưỡng trùng nội dung cảnh báo', value: 20, unit: '%', flow: 1 },
  { key: 'CONTENT_DUPLICATION_BLOCK_THRESHOLD', label: 'Ngưỡng trùng nội dung chặn nộp', value: 50, unit: '%', flow: 1 },
  { key: 'MATCHING_NGRAM_SYLLABLES', label: 'Cụm so khớp kiểm trùng', value: 5, unit: 'âm tiết', flow: 1 },
  { key: 'DHASH_DISTANCE_THRESHOLD', label: 'Ngưỡng ảnh trùng dHash', value: 5, unit: 'bit', flow: 1 },
  { key: 'APPEAL_DEADLINE_DAYS', label: 'Hạn khiếu nại từ công bố điểm', value: 7, unit: 'ngày', flow: 3 },
  { key: 'MAX_APPEALS_PER_ARTICLE', label: 'Số lần khiếu nại tối đa / bài', value: 1, unit: 'lần', flow: 3 },
  { key: 'SCORE_DISCREPANCY_THIRD_EDITOR_THRESHOLD', label: 'Ngưỡng lệch gọi BTV thứ ba', value: 5, unit: 'điểm', flow: 3 },
  { key: 'CRITERIA_MANDATORY_COMMENT_THRESHOLD', label: 'Tiêu chí bắt buộc nhận xét', value: 50, unit: 'điểm', flow: 2 },
  { key: 'PAYMENT_DEADLINE_DAYS', label: 'Hạn chi trả từ ngày đăng', value: 60, unit: 'ngày', flow: 4 },
  { key: 'PAYMENT_WARNING_DAYS', label: 'Cảnh báo hạn chi từ ngày', value: 45, unit: 'ngày', flow: 4 },
  { key: 'MINIMUM_FACTOR', label: 'Hệ số nhuận bút tối thiểu', value: 1, unit: 'hệ số', flow: 4 },
  { key: 'ROUNDING_UNIT', label: 'Làm tròn tiền nhuận bút', value: 1000, unit: 'đồng (lẻ dồn tác giả chính)', flow: 4 },
  { key: 'SATURATION_WINDOW_DAYS', label: 'Cửa sổ bão hòa đề tài', value: 7, unit: 'ngày', flow: 1 },
  { key: 'SATURATION_CAP_K', label: 'Ngưỡng K bài bắt đầu giảm hệ số', value: 10, unit: 'bài', flow: 1 },
  { key: 'SATURATION_RATES', label: 'Các mức hệ số bão hòa', value: '100% / 80% / 60%', unit: 'tỷ lệ', flow: 1 },
  { key: 'SATURATION_EXEMPTION_MIN_SCORE', label: 'Miễn bão hòa khi điểm bài đạt từ', value: 90, unit: 'điểm', flow: 1 }
];

export const INITIAL_EVENTS: Event[] = [
  { id: 'ev-hanhan', code: 'HAN_HAN_MIEN_TAY', name: 'Hạn hán và xâm nhập mặn miền Tây', description: 'Đợt hạn hán, thiếu nước ngọt kỷ lục tại Đồng bằng sông Cửu Long mùa khô 2026', start_date: '2026-06-01', is_active: true },
  { id: 'ev-thpt-2026', code: 'THPT_2026', name: 'Kỳ thi Tốt nghiệp THPT 2026', description: 'Kỳ thi tốt nghiệp THPT theo chương trình GDPT mới toàn quốc', start_date: '2026-06-25', is_active: true },
  { id: 'ev-chuyendoiso', code: 'CDS_QUOCGIA', name: 'Chiến dịch Chuyển đổi số Quốc gia', description: 'Triển khai số hóa thủ tục hành chính và quản trị số', start_date: '2026-07-01', is_active: true }
];

/**
 * Danh mục Bộ tiêu chí đánh giá chất lượng theo thể loại (Luồng 02):
 * Mỗi thể loại có 1 bộ dùng chung toàn tòa soạn, quản lý theo các phiên bản (DRAFT / ACTIVE / RETIRED).
 * Phóng sự: Phiên bản 2 (ACTIVE) và Phiên bản 1 (RETIRED)
 * Các thể loại khác: Phiên bản 1 (ACTIVE), tổng trọng số các tiêu chí = 100%.
 */
export const INITIAL_CRITERIA_SETS: CriteriaSet[] = [
  // --- 1. PHÓNG SỰ (cat-phongsu) ---
  // Phiên bản 1: RETIRED
  {
    id: 'cs-phongsu-v1',
    genre_id: 'cat-phongsu',
    version: 1,
    status: 'RETIRED',
    criteria: [
      { id: 'crit-ps1-1', name: 'Tính thời sự của đề tài', weight: 30, description: 'Phản ánh vấn đề xã hội đang quan tâm' },
      { id: 'crit-ps1-2', name: 'Độ chân thực, chi tiết hiện trường', weight: 30, description: 'Dữ liệu và nhân chứng thực tế' },
      { id: 'crit-ps1-3', name: 'Kết cấu và ngôn ngữ phóng sự', weight: 20, description: 'Bút pháp truyền cảm, logic' },
      { id: 'crit-ps1-4', name: 'Chất lượng ảnh minh họa', weight: 20, description: 'Hình ảnh chân thực, đúng bối cảnh' }
    ],
    created_at: '2026-01-10 08:00',
    used_count: 5,
    note: 'Bộ tiêu chí Phóng sự áp dụng giai đoạn 01/2026 - 05/2026 (ngừng áp dụng)'
  },
  // Phiên bản 2: ACTIVE (Đặc tả chuẩn SWP391)
  {
    id: 'cs-phongsu-v2',
    genre_id: 'cat-phongsu',
    version: 2,
    status: 'ACTIVE',
    criteria: [
      { id: 'crit-ps2-1', name: 'Tính thời sự, giá trị thông tin', weight: 20, description: 'Tính kịp thời, ý nghĩa xã hội và sự quan tâm của công chúng đối với sự việc' },
      { id: 'crit-ps2-2', name: 'Độ chính xác, có nguồn đối chứng', weight: 25, description: 'Thông tin có kiểm chứng từ nhiều nguồn độc lập, tài liệu xác thực' },
      { id: 'crit-ps2-3', name: 'Chiều sâu, góc nhìn riêng', weight: 25, description: 'Phát hiện vấn đề mới, phân tích nguyên nhân - hệ quả thấu đáo' },
      { id: 'crit-ps2-4', name: 'Bố cục, ngôn ngữ', weight: 15, description: 'Kết cấu mạch lạc, ngôn ngữ sinh động, chuẩn mực đạo đức báo chí' },
      { id: 'crit-ps2-5', name: 'Ảnh/minh họa hỗ trợ nội dung', weight: 15, description: 'Tác phẩm hình ảnh/media tác nghiệp bổ trợ đắt giá cho thông điệp bài' }
    ],
    created_at: '2026-06-01 09:00',
    used_count: 3,
    note: 'Bộ tiêu chí Phóng sự cập nhật chuẩn NĐ 18/2014 & quy chế chất lượng tòa soạn'
  },

  // --- 2. TIN (cat-tin) ---
  {
    id: 'cs-tin-v1',
    genre_id: 'cat-tin',
    version: 1,
    status: 'ACTIVE',
    criteria: [
      { id: 'crit-tin-1', name: 'Tính thời sự, tính mới của sự kiện', weight: 30, description: 'Sự kiện diễn ra nhanh, thông tin mới nhất' },
      { id: 'crit-tin-2', name: 'Độ chính xác, khách quan, nguồn tin rõ ràng', weight: 30, description: 'Số liệu, thời gian, địa điểm chính xác 100%' },
      { id: 'crit-tin-3', name: 'Văn phong ngắn gọn, chuẩn mực ngữ pháp', weight: 25, description: 'Câu cú gãy gọn, không bình luận suy diễn' },
      { id: 'crit-tin-4', name: 'Tiêu đề và cấu trúc kim tự tháp ngược (5W+1H)', weight: 15, description: 'Thông điệp cốt lõi ngay phần mở đầu' }
    ],
    created_at: '2026-01-10 08:00',
    used_count: 12,
    note: 'Bộ tiêu chí chuẩn cho thể loại Tin tức thời sự'
  },

  // --- 3. CHÍNH LUẬN (cat-chinhluan) ---
  {
    id: 'cs-chinhluan-v1',
    genre_id: 'cat-chinhluan',
    version: 1,
    status: 'ACTIVE',
    criteria: [
      { id: 'crit-cl-1', name: 'Tính định hướng tư tưởng, tôn chỉ', weight: 30, description: 'Bám sát chủ trương, đường lối, tính Đảng và tính nhân dân' },
      { id: 'crit-cl-2', name: 'Lập luận logic, chiều sâu phân tích', weight: 30, description: 'Hệ thống luận điểm chặt chẽ, luận cứ xác đáng' },
      { id: 'crit-cl-3', name: 'Dẫn chứng xác thực, tính thuyết phục cao', weight: 25, description: 'Thực tiễn sinh động, số liệu có cơ sở khoa học' },
      { id: 'crit-cl-4', name: 'Văn phong sắc bén, khúc chiết', weight: 15, description: 'Bút pháp chính luận trang trọng, sức lan tỏa mạnh mẽ' }
    ],
    created_at: '2026-01-10 08:00',
    used_count: 6,
    note: 'Bộ tiêu chí thể loại Chính luận, Bình luận chuyên sâu'
  },

  // --- 4. KÝ (MỘT KỲ) (cat-ky) ---
  {
    id: 'cs-ky-v1',
    genre_id: 'cat-ky',
    version: 1,
    status: 'ACTIVE',
    criteria: [
      { id: 'crit-ky-1', name: 'Tính chân thực của con người và sự kiện', weight: 30, description: 'Nhân vật có thật, không hư cấu các tình tiết then chốt' },
      { id: 'crit-ky-2', name: 'Bút pháp văn học, tính hình tượng', weight: 25, description: 'Nghệ thuật miêu tả, khắc họa cảnh vật và tâm lý' },
      { id: 'crit-ky-3', name: 'Chiều sâu cảm xúc, thông điệp nhân văn', weight: 25, description: 'Tác động lay động bạn đọc, ý nghĩa nhân bản' },
      { id: 'crit-ky-4', name: 'Ngôn ngữ biểu đạt và nghệ thuật trần thuật', weight: 20, description: 'Giọng điệu độc đáo, vốn từ phong phú' }
    ],
    created_at: '2026-01-10 08:00',
    used_count: 4,
    note: 'Bộ tiêu chí thể loại Bút ký, Ký sự một kỳ'
  },

  // --- 5. PHỎNG VẤN (cat-phongvan) ---
  {
    id: 'cs-phongvan-v1',
    genre_id: 'cat-phongvan',
    version: 1,
    status: 'ACTIVE',
    criteria: [
      { id: 'crit-pv-1', name: 'Tầm vóc nhân vật & tính thời sự đề tài', weight: 25, description: 'Nhân vật uy tín, đúng thẩm quyền hoặc nhân chứng đắt giá' },
      { id: 'crit-pv-2', name: 'Hệ thống câu hỏi gợi mở, sắc sảo', weight: 30, description: 'Hỏi đúng trọng tâm dư luận quan tâm, không né tránh' },
      { id: 'crit-pv-3', name: 'Giá trị thông tin phản hồi từ nhân vật', weight: 30, description: 'Cung cấp giải pháp, phát ngôn chính thức hoặc góc nhìn mới' },
      { id: 'crit-pv-4', name: 'Kỹ thuật dẫn dắt và biên tập lời thoại', weight: 15, description: 'Tự nhiên, giữ đúng phong cách nhân vật nhưng trong sáng' }
    ],
    created_at: '2026-01-10 08:00',
    used_count: 5,
    note: 'Bộ tiêu chí thể loại Phỏng vấn đối thoại'
  },

  // --- 6. SÁNG TÁC VĂN HỌC (cat-sangtac) ---
  {
    id: 'cs-sangtac-v1',
    genre_id: 'cat-sangtac',
    version: 1,
    status: 'ACTIVE',
    criteria: [
      { id: 'crit-st-1', name: 'Giá trị tư tưởng và ý nghĩa xã hội', weight: 35, description: 'Hướng thiện, phản ánh khát vọng và tinh thần cao đẹp' },
      { id: 'crit-st-2', name: 'Tính sáng tạo nghệ thuật & bút pháp', weight: 30, description: 'Tìm tòi cấu trúc mới, hình ảnh giàu sức biểu tượng' },
      { id: 'crit-st-3', name: 'Cốt truyện, hình tượng nhân vật', weight: 20, description: 'Nhân vật có số phận, tình tiết hấp dẫn, hợp lý' },
      { id: 'crit-st-4', name: 'Cảm xúc thẩm mỹ & vẻ đẹp ngôn từ', weight: 15, description: 'Ngôn từ trau chuốt, giàu nhạc điệu và hình ảnh' }
    ],
    created_at: '2026-01-10 08:00',
    used_count: 2,
    note: 'Bộ tiêu chí thể loại Sáng tác văn học (Truyện ngắn, Thơ, Tản văn)'
  },

  // --- 7. NGHIÊN CỨU (cat-nghiencuu) ---
  {
    id: 'cs-nghiencuu-v1',
    genre_id: 'cat-nghiencuu',
    version: 1,
    status: 'ACTIVE',
    criteria: [
      { id: 'crit-nc-1', name: 'Tính khoa học, cơ sở lý luận vững chắc', weight: 35, description: 'Phương pháp nghiên cứu chuẩn mực, khái niệm chuẩn xác' },
      { id: 'crit-nc-2', name: 'Đóng góp giải pháp và giá trị thực tiễn', weight: 30, description: 'Đề xuất khuyến nghị có tính khả thi cho chính sách' },
      { id: 'crit-nc-3', name: 'Tính chuẩn xác của trích dẫn và tài liệu', weight: 20, description: 'Tài liệu tham khảo minh bạch, số liệu tin cậy' },
      { id: 'crit-nc-4', name: 'Văn phong học thuật, kết cấu chuyên khảo', weight: 15, description: 'Trình bày theo quy chuẩn nghiên cứu khoa học' }
    ],
    created_at: '2026-01-10 08:00',
    used_count: 3,
    note: 'Bộ tiêu chí thể loại Nghiên cứu, Chuyên đề khoa học'
  },

  // --- 8. TRỰC TUYẾN, MEDIA (cat-media) ---
  {
    id: 'cs-media-v1',
    genre_id: 'cat-media',
    version: 1,
    status: 'ACTIVE',
    criteria: [
      { id: 'crit-med-1', name: 'Chất lượng hình ảnh, video clip, đồ họa', weight: 35, description: 'Độ phân giải cao, góc máy sáng tạo, âm thanh chuẩn' },
      { id: 'crit-med-2', name: 'Trải nghiệm tương tác đa phương tiện', weight: 25, description: 'Tối ưu trên di động, hiệu ứng mượt mà, trực quan' },
      { id: 'crit-med-3', name: 'Giá trị thông tin và tính thời sự', weight: 25, description: 'Nội dung sâu sắc, không lạm dụng kỹ xảo che lấp nội dung' },
      { id: 'crit-med-4', name: 'Bố cục trình bày visual storytelling', weight: 15, description: 'Kể chuyện bằng hình ảnh liền mạch, hấp dẫn' }
    ],
    created_at: '2026-01-10 08:00',
    used_count: 7,
    note: 'Bộ tiêu chí thể loại Megastory, Emagazine, Video, Infographic'
  },

  // --- 9. TRẢ LỜI BẠN ĐỌC (cat-tlbd) ---
  {
    id: 'cs-tlbd-v1',
    genre_id: 'cat-tlbd',
    version: 1,
    status: 'ACTIVE',
    criteria: [
      { id: 'crit-tlbd-1', name: 'Căn cứ pháp lý, chính sách viện dẫn chính xác', weight: 40, description: 'Điều khoản luật, văn bản quy phạm pháp luật chuẩn xác' },
      { id: 'crit-tlbd-2', name: 'Hướng dẫn giải quyết cụ thể, thỏa đáng', weight: 35, description: 'Các bước thực hiện rõ ràng, giúp bạn đọc giải tỏa vướng mắc' },
      { id: 'crit-tlbd-3', name: 'Tính kịp thời của phản hồi', weight: 15, description: 'Đáp ứng nguyện vọng của bạn đọc trong thời gian nhanh nhất' },
      { id: 'crit-tlbd-4', name: 'Ngôn ngữ chuẩn mực, thái độ văn minh', weight: 10, description: 'Nhã nhặn, tôn trọng bạn đọc, dễ hiểu cho đại chúng' }
    ],
    created_at: '2026-01-10 08:00',
    used_count: 4,
    note: 'Bộ tiêu chí thể loại Hộp thư bạn đọc, Tư vấn pháp luật'
  }
];

/**
 * 24 Bài viết mẫu từ tháng 6 đến tháng 9/2026 bao gồm:
 * 1. Bài mẫu trung tâm: "Nước sạch ở xóm chài ven sông" (Phóng sự - An chính 60%, Bình 40%, 3 ảnh, trùng 12%, bão hòa 80%)
 * 2. Đầy đủ các trạng thái bài:
 *    - DRAFT: 3 bài
 *    - PENDING_CONFIRMATION: 2 bài
 *    - SUBMITTED: 3 bài
 *    - ASSIGNED: 3 bài
 *    - REVISION_REQUESTED: 2 bài
 *    - REJECTED: 2 bài
 *    - PENDING_APPROVAL: 2 bài
 *    - SCORE_PUBLISHED: 2 bài
 *    - PUBLISHED: 5 bài
 */
export const INITIAL_ARTICLES: Article[] = [
  // --- BÀI MẪU TRUNG TÂM DEMO ---
  {
    id: 'art-nuocsach',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-cuong-btv',
    title: 'Nước sạch ở xóm chài ven sông',
    sapo: 'Giữa cái nắng như thiêu như đốt của mùa hạn mặn lịch sử, hàng trăm hộ dân xóm chài nghèo ven hạ lưu sông Tiền đang chắt chiu từng can nước ngọt chở từ sà lan cứu trợ về lán tạm.',
    content: `Càng về trưa, con đường đất cặp bờ bao cống Ba Lai càng thêm oi nồng. Bụi đỏ bám dày trên những tấm bạt che tạm của dãy nhà chồ xóm chài cồn Tam Hiệp. Mùi bùn sình phơi nắng bốc lên tanh nồng xen lẫn tiếng máy nổ rì rầm từ chiếc sà lan chở nước ngọt vừa cập bến.

Bà Nguyễn Thị Bảy (64 tuổi), tay thoăn thoắt xách hai can nhựa 20 lít đã cáu bẩn, vừa lau mồ hôi vừa phân trần: "Nửa tháng nay nước sông mặn chát, nấu cơm còn không được nói chi tắm giặt. Mấy đứa nhỏ nổi rôm sảy ngứa ngáy cả đêm. May có đoàn từ thiện chở sà lan nước về phát miễn phí, mỗi nhà được chia hai can dùng dè sẻn lắm mới đủ qua ngày".

Xóm chài có hơn 80 hộ dân, phần lớn là lao động nghèo không có đất sản xuất, mưu sinh nhờ nghề giăng câu thả lưới. Mùa khô năm nay, độ mặn 4 phần nghìn xâm nhập sâu vào nội đồng hơn 50km, vượt xa mốc lịch sử năm 2020. Mọi giếng khoan nước ngầm quanh vùng đều bị nhiễm mặn hoặc phèn chua, khiến nguồn nước ngọt sinh hoạt trở thành nỗi khát khao cháy bỏng.

Chính quyền địa phương đã khẩn trương lắp đặt 4 bồn chứa nước công cộng 5.000 lít và điều phối 12 chuyến sà lan nước ngọt mỗi tuần từ thượng nguồn về tiếp tế. Tuy nhiên, theo ghi nhận thực tế của phóng viên, giải pháp này chỉ mang tính ứng phó tức thời. Để giải quyết căn cơ bài toán an ninh nguồn nước cho người dân ven sông trong bối cảnh biến đổi khí hậu khốc liệt, cần sớm hoàn thiện hệ thống thủy lợi khép kín và mạng lưới cấp nước tập trung kiên cố.`,
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 14,
    saturation_rate: 80,
    duplication_percent: 12,
    duplication_explanation: 'Trùng một số số liệu khí tượng thủy văn công bố công khai từ Đài Khí tượng Trung ương.',
    withdrawn_count: 0,
    published_at: '2026-06-29 08:00',
    score_published_at: '2026-06-25 15:00',
    first_submitted_at: '2026-06-18 09:30',
    last_submitted_at: '2026-06-18 09:30',
    cover_image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=800&auto=format&fit=crop&q=80',
    view_count: 12400,
    created_at: '2026-06-17 14:00',
    updated_at: '2026-06-29 08:00'
  },

  // --- 1. DRAFT (Bài nháp & 3 trường hợp demo kiểm tra trùng lặp) ---
  {
    id: 'art-demo-cairang',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    title: 'Chợ nổi Cái Răng mùa nước nổi',
    sapo: 'Bức tranh giao thương nhộn nhịp trên sông Cần Thơ khi những chiếc ghe chở đầy hoa trái miệt vườn nối đuôi nhau về bến.',
    content: `Tờ mờ sáng, khi sương mù còn bảng lảng trên mặt sông Cần Thơ, tiếng máy đuôi tôm đã rền vang khắp khúc sông Cái Răng. Hàng trăm chiếc ghe, thuyền từ các ngả rạch tụ họp về đây tạo nên một khung cảnh buôn bán vô cùng sống động.

Người thương hồ xem ghe như nhà, sông nước như quê hương. Những cây bẹo vươn cao treo lủng lẳng dưa hấu, khóm, bưởi năm roi như lời chào mời mộc mạc mà tha thiết gửi đến khách phương xa. Dù nhịp sống đô thị ngày một hối hả, chợ nổi Cái Răng vẫn giữ được nét hồn cốt văn hóa sông nước miệt vườn Tây Nam Bộ độc đáo.`,
    status: 'DRAFT',
    declared_nature: 'SANG_TAC',
    duplication_percent: 12,
    withdrawn_count: 0,
    created_at: '2026-09-24 08:00',
    updated_at: '2026-09-24 08:00'
  },
  {
    id: 'art-demo-gialua',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    title: 'Giá lúa tăng mạnh đầu vụ Thu Đông',
    sapo: 'Nông dân Đồng bằng sông Cửu Long phấn khởi khi giá lúa tươi tại ruộng lập đỉnh mới, thương lái đổ xô đặt cọc.',
    content: `Ghi nhận tại các huyện Thới Lai, Cờ Đỏ (TP.Cần Thơ) và Tân Hưng (Long An), giá lúa OM 18 và Đài Thơm 8 đang được thương lái thu mua tại ruộng với giá dao động từ 8.200 - 8.600 đồng/kg, tăng gần 1.000 đồng/kg so với vụ trước.

Nhiều hợp tác xã nông nghiệp cho biết năng suất vụ Thu Đông năm nay ước đạt từ 6,2 - 6,5 tấn/ha. Với mức giá hiện tại, bà con nông dân thu lãi bình quân từ 25 - 30 triệu đồng/ha. Xuất khẩu gạo khởi sắc cùng nhu cầu thu gom nguyên liệu của các doanh nghiệp chế biến lương thực là động lực chính giúp giá lúa duy trì đà tăng ổn định.`,
    status: 'DRAFT',
    declared_nature: 'SANG_TAC',
    duplication_percent: 34,
    withdrawn_count: 0,
    created_at: '2026-09-25 09:30',
    updated_at: '2026-09-25 09:30'
  },
  {
    id: 'art-demo-baoso5',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    title: 'Tổng hợp diễn biến bão số 5',
    sapo: 'Bão số 5 di chuyển nhanh với sức gió giật cấp 14, hướng thẳng vào vùng biển các tỉnh từ Quảng Ninh đến Nam Định.',
    content: `Theo Trung tâm Dự báo Khí tượng Thủy văn Quốc gia, hồi 4 giờ sáng nay, vị trí tâm bão ở vào khoảng 20,5 độ Vĩ Bắc; 108,8 độ Kinh Đông, cách bờ biển Quảng Ninh - Hải Phòng khoảng 120km về phía Đông. Sức gió mạnh nhất vùng gần tâm bão mạnh cấp 11-12, giật cấp 14.

Dự báo trong 12 giờ tới, bão di chuyển chủ yếu theo hướng Tây Tây Bắc với tốc độ khoảng 20km/h, đi vào đất liền khu vực ven biển Đông Bắc Bộ. Vùng biển Vịnh Bắc Bộ sóng biển cao từ 3,0 - 5,0m, biển động dữ dội. Ban Chỉ đạo Phòng thủ Dân sự Quốc gia đã phát công điện khẩn yêu cầu các địa phương cấm biển và kêu gọi toàn bộ tàu thuyền về nơi neo đậu an toàn.`,
    status: 'DRAFT',
    declared_nature: 'SANG_TAC',
    duplication_percent: 63,
    withdrawn_count: 0,
    created_at: '2026-09-26 10:15',
    updated_at: '2026-09-26 10:15'
  },
  {
    id: 'art-draft-1',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    title: 'Góc khuất phía sau những lớp học tình thương đêm',
    sapo: 'Ghi nhận thực tế tại lớp học không phấn trắng bảng đen của những đứa trẻ mưu sinh lượm ve chai.',
    content: 'Bản thảo đang tiếp tục thu thập thêm hình ảnh và phỏng vấn cô giáo phụ trách lớp...',
    status: 'DRAFT',
    declared_nature: 'SANG_TAC',
    created_at: '2026-09-22 10:00',
    updated_at: '2026-09-22 10:00'
  },
  {
    id: 'art-draft-2',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-media',
    category_id: 'cat-media',
    genre_id: 'cat-media',
    title: 'Chùm ảnh: Một ngày theo chân hiệp sĩ đường phố',
    sapo: 'Bộ ảnh tư liệu sống động về những người lặng lẽ bảo vệ sự bình yên cho từng con ngõ nhỏ.',
    content: 'Đang biên soạn chú thích ảnh chi tiết và xử lý màu sắc ảnh tư liệu...',
    status: 'DRAFT',
    declared_nature: 'SANG_TAC',
    created_at: '2026-09-21 16:30',
    updated_at: '2026-09-21 16:30'
  },
  {
    id: 'art-draft-3',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    title: 'Khởi công cầu dân sinh thứ 10 tại xã vùng biên',
    sapo: 'Cây cầu nối đôi bờ kênh Vĩnh Tế giúp hơn 300 em học sinh an toàn đến trường trong mùa lũ.',
    content: 'Đang chờ số liệu chính xác từ ban quản lý dự án giao thông huyện...',
    status: 'DRAFT',
    declared_nature: 'SANG_TAC',
    created_at: '2026-09-23 08:15',
    updated_at: '2026-09-23 08:15'
  },

  // --- 2. PENDING_CONFIRMATION (2 bài - chờ xác nhận đồng tác giả) ---
  {
    id: 'art-coauthor-pending-1',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    title: 'Hồi sinh những cánh rừng ngập mặn Cần Giờ',
    sapo: 'Hành trình 10 năm gieo mầm xanh chắn sóng biển của các nhóm tình nguyện trẻ và lực lượng kiểm lâm.',
    content: 'Bài viết hợp tác giữa phóng viên Văn An (viết chính) và phóng viên ảnh Trần Thị Bình (chụp ảnh phóng sự thực địa)...',
    status: 'PENDING_CONFIRMATION',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-25 09:00',
    last_submitted_at: '2026-09-25 09:00',
    created_at: '2026-09-25 08:30',
    updated_at: '2026-09-25 09:00'
  },
  {
    id: 'art-coauthor-pending-2',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-chinhluan',
    category_id: 'cat-chinhluan',
    genre_id: 'cat-chinhluan',
    title: 'An sinh số: Không để ai bị bỏ lại phía sau trên môi trường mạng',
    sapo: 'Tháo gỡ những rào cản công nghệ cho người cao tuổi và nhóm yếu thế khi tiếp cận dịch vụ công trực tuyến.',
    content: 'Bài phân tích hợp tác giữa phóng viên Lê Hoàng Nam và phóng viên Phạm Minh Tuấn...',
    status: 'PENDING_CONFIRMATION',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-chuyendoiso',
    first_submitted_at: '2026-09-26 14:00',
    last_submitted_at: '2026-09-26 14:00',
    created_at: '2026-09-26 13:00',
    updated_at: '2026-09-26 14:00'
  },
  {
    id: 'art-coauthor-pending-3',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    title: 'Cứu hộ rùa biển quý hiếm tại Côn Đảo',
    sapo: 'Hành trình thầm lặng của các tình nguyện viên và kiểm lâm xuyên đêm bảo vệ từng ổ trứng rùa trước nguy cơ tuyệt chủng.',
    content: 'Bài phóng sự điều tra và ghi nhận cùng chuyên gia bảo tồn biển. Phóng viên Trần Thị Bình viết bài, phóng viên Nguyễn Văn An phối hợp thực địa...',
    status: 'PENDING_CONFIRMATION',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-26 10:00',
    last_submitted_at: '2026-09-26 10:00',
    created_at: '2026-09-26 09:00',
    updated_at: '2026-09-26 10:00'
  },

  // --- 3. SUBMITTED (3 bài - đã nộp, chờ Trưởng ban phân công) ---
  {
    id: 'art-sub-1',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongvan',
    category_id: 'cat-phongvan',
    genre_id: 'cat-phongvan',
    title: 'Phỏng vấn chuyên gia khí hậu: Kịch bản ứng phó El Nino cực đoan',
    sapo: 'GS.TS Nguyễn Văn Hưng cảnh báo tần suất các đợt nắng nóng gay gắt và giải pháp thích ứng phi công trình cho nông nghiệp đô thị.',
    content: 'Nội dung cuộc phỏng vấn bàn sâu về quy hoạch hồ điều hòa sinh thái và chuyển đổi cơ cấu cây trồng chịu hạn...',
    status: 'SUBMITTED',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-24 11:00',
    last_submitted_at: '2026-09-24 11:00',
    created_at: '2026-09-24 10:00',
    updated_at: '2026-09-24 11:00'
  },
  {
    id: 'art-sub-2',
    author_id: 'u-tuan',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    title: 'Trao tặng 200 suất học bổng nâng bước em tới trường',
    sapo: 'Chương trình thiện nguyện hỗ trợ học sinh có hoàn cảnh khó khăn tại 5 xã bãi ngang ven biển.',
    content: 'Sáng nay tại hội trường trung tâm văn hóa huyện, đại diện ban tổ chức đã trao tận tay...',
    status: 'SUBMITTED',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-25 15:30',
    last_submitted_at: '2026-09-25 15:30',
    created_at: '2026-09-25 14:00',
    updated_at: '2026-09-25 15:30'
  },
  {
    id: 'art-sub-3',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tlbd',
    category_id: 'cat-tlbd',
    genre_id: 'cat-tlbd',
    title: 'Hỏi đáp pháp lý: Điều kiện hưởng bảo hiểm tai nạn lao động tự nguyện',
    sapo: 'Luật sư tư vấn các thủ tục tham gia và mức trợ cấp cho người lao động phi chính thức từ ngày 01/07/2026.',
    content: 'Bạn đọc Trần Văn M. (quận 8, TP.HCM) gửi thư hỏi về quy trình làm hồ sơ giám định tỷ lệ thương tật...',
    status: 'SUBMITTED',
    declared_nature: 'TONG_HOP',
    first_submitted_at: '2026-09-26 09:20',
    last_submitted_at: '2026-09-26 09:20',
    created_at: '2026-09-26 08:30',
    updated_at: '2026-09-26 09:20'
  },

  // --- 4. ASSIGNED (đã phân công cho BTV thẩm định) ---
  {
    id: 'art-assigned-1',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-cuong-btv',
    title: 'Bẫy tín dụng đen công nghệ cao bủa vây công nhân khu công nghiệp',
    sapo: 'Thâm nhập đường dây cho vay nặng lãi qua app mạo danh sàn thương mại điện tử với lãi suất lên đến 1.000%/năm.',
    content: 'Những tin nhắn đe dọa, cắt ghép hình ảnh bôi nhọ nhân phẩm liên tục dội về máy điện thoại của chị H. suốt 2 tháng ròng...',
    status: 'ASSIGNED',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-23 09:00',
    last_submitted_at: '2026-09-23 09:00',
    created_at: '2026-09-22 14:00',
    updated_at: '2026-09-23 10:00'
  },
  {
    id: 'art-assigned-resubmit',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-cuong-btv',
    title: 'Thực trạng ô nhiễm nguồn nước ngầm tại cụm công nghiệp phía Nam',
    sapo: 'Bản thảo nộp lại sau khi bổ sung phiếu xét nghiệm mẫu nước từ Viện Môi trường và đối thoại với đại diện Ban Quản lý.',
    content: 'Theo kết quả xét nghiệm mẫu nước ngầm ngày 20/09, hàm lượng kim loại nặng vượt chuẩn cho phép từ 2,5 đến 4 lần. Phóng viên đã hoàn thiện bài viết theo góp ý của BTV...',
    status: 'ASSIGNED',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-20 08:30',
    last_submitted_at: '2026-09-25 14:00',
    created_at: '2026-09-19 10:00',
    updated_at: '2026-09-25 14:00'
  },
  {
    id: 'art-assigned-lead-rescore',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-cuong-btv',
    title: 'Bảo tồn rạn san hô Hòn Cau trước sức ép du lịch sinh thái',
    sapo: 'Ghi nhận thực địa về sự suy giảm thảm thực vật biển và kiến nghị thành lập khu bảo tồn biển nghiêm ngặt.',
    content: 'Trưởng ban Phan Hải Long đã yêu cầu BTV đánh giá lại bài viết sau khi phóng viên cung cấp thêm bộ ảnh lặn biển độc quyền...',
    status: 'ASSIGNED',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-22 11:00',
    last_submitted_at: '2026-09-22 11:00',
    created_at: '2026-09-21 09:00',
    updated_at: '2026-09-26 09:00'
  },
  {
    id: 'art-assigned-2',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-ky',
    category_id: 'cat-ky',
    genre_id: 'cat-ky',
    editor_id: 'u-dung',
    title: 'Những người giữ ngọn hải đăng nơi đầu sóng ngọn gió',
    sapo: 'Ký sự về cuộc sống cô đơn nhưng kiên cường của các chiến sĩ trạm đèn biển Hòn Lớn qua những mùa bão giông.',
    content: 'Đêm trên trạm đèn biển, tiếng sóng vỗ gầm gào vào vách đá dựng đứng. Ánh chớp đèn quét từng vòng tròn 360 độ vào màn đêm mịt mù...',
    status: 'ASSIGNED',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-24 16:00',
    last_submitted_at: '2026-09-24 16:00',
    created_at: '2026-09-24 15:00',
    updated_at: '2026-09-25 08:30'
  },
  {
    id: 'art-assigned-3',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-media',
    category_id: 'cat-media',
    genre_id: 'cat-media',
    editor_id: 'u-ha',
    title: 'Infographic: Toàn cảnh diễn biến xâm nhập mặn Đồng bằng sông Cửu Long',
    sapo: 'Dữ liệu trực quan hóa mức độ mặn đo tại 42 trạm quan trắc thủy văn trong 90 ngày vừa qua.',
    content: 'Biểu đồ tương tác so sánh ranh mặn 4 g/lít qua các năm 2016, 2020 và 2026...',
    status: 'ASSIGNED',
    declared_nature: 'TONG_HOP',
    event_id: 'ev-hanhan',
    first_submitted_at: '2026-09-25 10:00',
    last_submitted_at: '2026-09-25 10:00',
    created_at: '2026-09-25 09:00',
    updated_at: '2026-09-25 11:00'
  },

  // --- 5. REVISION_REQUESTED (2 bài - BTV yêu cầu sửa) ---
  {
    id: 'art-rev-1',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-cuong-btv',
    title: 'Nỗi lo sạt lở bờ sông mùa triều cường ở cù lao An Bình',
    sapo: 'Hàng chục căn nhà chực chờ rơi xuống sông Cổ Chiên khi từng mảng vườn cây ăn trái bị dòng nước xiết ngoạm dần.',
    content: 'Cần bổ sung ý kiến phản hồi chính thức từ UBND huyện Long Hồ về tiến độ dự án kè chống sạt lở và phương án tái định cư cho bà con...',
    status: 'REVISION_REQUESTED',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-20 10:00',
    last_submitted_at: '2026-09-21 15:00',
    created_at: '2026-09-19 14:00',
    updated_at: '2026-09-21 16:00'
  },
  {
    id: 'art-rev-2',
    author_id: 'u-tuan',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-chinhluan',
    category_id: 'cat-chinhluan',
    genre_id: 'cat-chinhluan',
    editor_id: 'u-dung',
    title: 'Xây dựng đô thị xanh: Đừng để cây xanh chỉ nằm trên bản vẽ',
    sapo: 'Tỷ lệ diện tích cây xanh bình quân đầu người tại các đại đô thị hiện chỉ đạt dưới 1m2/người, kém xa chuẩn quy hoạch.',
    content: 'Yêu cầu kiểm chứng lại số liệu diện tích công viên tại các dự án bất động sản khu Nam Sài Gòn trước khi tái nộp...',
    status: 'REVISION_REQUESTED',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-18 14:00',
    last_submitted_at: '2026-09-19 11:00',
    created_at: '2026-09-18 09:00',
    updated_at: '2026-09-19 14:00'
  },

  // --- 6. REJECTED (2 bài - từ chối) ---
  {
    id: 'art-rej-1',
    author_id: 'u-tuan',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-cuong-btv',
    title: 'Tin đồn vỡ đập thủy điện xả lũ gây hoang mang dư luận',
    sapo: 'Thông tin chưa kiểm chứng lan truyền trên mạng xã hội đã bị cơ quan chức năng bác bỏ.',
    content: 'Bài viết chưa phỏng vấn được đại diện nhà máy thủy điện, nguồn tin lượm lặt trên mạng xã hội không đủ độ tin cậy để xuất bản.',
    status: 'REJECTED',
    declared_nature: 'TONG_HOP',
    first_submitted_at: '2026-09-15 08:00',
    last_submitted_at: '2026-09-15 08:00',
    created_at: '2026-09-14 20:00',
    updated_at: '2026-09-15 10:30'
  },
  {
    id: 'art-rej-2',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-sangtac',
    category_id: 'cat-sangtac',
    genre_id: 'cat-sangtac',
    editor_id: 'u-ha',
    title: 'Tản văn: Chiều mưa phố thị nhớ mùi khói rơm đồng',
    sapo: 'Ký ức tuổi thơ bên bếp lửa của những đứa con xa quê lên phố lập nghiệp.',
    content: 'Nội dung trùng lặp hơn 60% với bài tản văn đã đăng trên trang cá nhân năm 2024, vi phạm quy định về bản quyền tác phẩm báo chí.',
    status: 'REJECTED',
    declared_nature: 'DANG_LAI',
    duplication_percent: 62,
    first_submitted_at: '2026-09-12 11:00',
    last_submitted_at: '2026-09-12 11:00',
    created_at: '2026-09-12 09:00',
    updated_at: '2026-09-13 14:00'
  },

  // --- 7. PENDING_APPROVAL (2 bài - BTV đã chấm điểm, chờ Trưởng ban duyệt điểm & duyệt xuất bản) ---
  {
    id: 'art-pend-app-1',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-cuong-btv',
    title: 'Cuộc đua giành lại sự sống trong đêm của kíp mổ dã chiến vùng cao',
    sapo: 'Vượt đèo sạt lở trong mưa bão, các y bác sĩ Bệnh viện Đa khoa tỉnh đã kịp thời cứu sống sản phụ vỡ tử cung nguy kịch.',
    content: 'Gần 2 giờ sáng, tiếng chuông điện thoại trực ban reo dồn dập báo tin từ Trạm y tế xã Tà Tổng...',
    status: 'PENDING_APPROVAL',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-22 08:00',
    last_submitted_at: '2026-09-22 08:00',
    created_at: '2026-09-21 15:00',
    updated_at: '2026-09-23 15:00'
  },
  {
    id: 'art-pend-app-2',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-chinhluan',
    category_id: 'cat-chinhluan',
    genre_id: 'cat-chinhluan',
    editor_id: 'u-dung',
    title: 'Phát triển kinh tế tuần hoàn: Đòn bẩy đưa nông sản Việt vươn xa',
    sapo: 'Từ vỏ trấu thành củi trấu xuất khẩu, phụ phẩm nông nghiệp đang mở ra chuỗi giá trị hàng tỷ đô la.',
    content: 'Thay vì đốt đồng gây ô nhiễm môi trường, các mô hình thu gom rơm rạ làm nấm và phân bón hữu cơ...',
    status: 'PENDING_APPROVAL',
    declared_nature: 'SANG_TAC',
    first_submitted_at: '2026-09-21 14:00',
    last_submitted_at: '2026-09-21 14:00',
    created_at: '2026-09-20 10:00',
    updated_at: '2026-09-22 16:30'
  },

  // --- 8. SCORE_PUBLISHED (2 bài - Đã công bố điểm, trong thời hạn khiếu nại 7 ngày) ---
  {
    id: 'art-score-pub-1',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongvan',
    category_id: 'cat-phongvan',
    genre_id: 'cat-phongvan',
    editor_id: 'u-dung',
    title: 'Đối thoại với thủ khoa kép khối A: Bí quyết từ chiếc bàn học gỗ mộc',
    sapo: 'Cậu học trò nghèo vùng bãi bồi ven biển chia sẻ phương pháp tự học và ước mơ chế tạo robot y tế.',
    content: 'Gặp Nguyễn Tuấn Kiệt sau khi Bộ Giáo dục công bố điểm thi tốt nghiệp THPT...',
    status: 'SCORE_PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-thpt-2026',
    score_published_at: '2026-09-22 17:00',
    first_submitted_at: '2026-09-18 10:00',
    last_submitted_at: '2026-09-18 10:00',
    created_at: '2026-09-17 14:00',
    updated_at: '2026-09-22 17:00'
  },
  {
    id: 'art-score-pub-2',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-nghiencuu',
    category_id: 'cat-nghiencuu',
    genre_id: 'cat-nghiencuu',
    editor_id: 'u-ha',
    title: 'Thực trạng chuyển dịch việc làm phi chính thức tại đô thị hậu đại dịch',
    sapo: 'Khảo sát trên 1.200 lao động tự do tại các khu chợ truyền thống và bến xe liên tỉnh.',
    content: 'Báo cáo tổng hợp số liệu việc làm, bảo hiểm xã hội và xu hướng ứng dụng công nghệ số...',
    status: 'SCORE_PUBLISHED',
    declared_nature: 'SANG_TAC',
    score_published_at: '2026-09-23 10:00',
    first_submitted_at: '2026-09-19 09:00',
    last_submitted_at: '2026-09-19 09:00',
    created_at: '2026-09-18 11:00',
    updated_at: '2026-09-23 10:00'
  },

  // --- 9. PUBLISHED (5 bài đã đăng từ tháng 7 đến tháng 9/2026) ---
  {
    id: 'art-pub-1',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-chinhluan',
    category_id: 'cat-chinhluan',
    genre_id: 'cat-chinhluan',
    editor_id: 'u-cuong-btv',
    title: 'Chính sách tiền lương mới từ 01/07/2026: Động lực cho đội ngũ công chức',
    sapo: 'Tăng lương cơ sở lên 2.530.000 đồng theo Nghị định 161/2026/NĐ-CP tạo niềm phấn khởi sâu rộng.',
    content: 'Nghị quyết của Quốc hội và quyết định kịp thời của Chính phủ đã đáp ứng mong mỏi của hàng triệu cán bộ, công chức, viên chức...',
    status: 'PUBLISHED',
    event_id: 'ev-chuyendoiso',
    declared_nature: 'SANG_TAC',
    published_at: '2026-07-02 07:30',
    score_published_at: '2026-06-30 16:00',
    first_submitted_at: '2026-06-28 10:00',
    last_submitted_at: '2026-06-28 10:00',
    view_count: 28400,
    created_at: '2026-06-27 15:00',
    updated_at: '2026-07-02 07:30'
  },
  {
    id: 'art-pub-2',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-dung',
    title: 'Những chuyến xe 0 đồng chở niềm hy vọng người bệnh nghèo',
    sapo: 'Đội xe cứu thương miễn phí của nhóm thiện nguyện Hoa Sen đã lăn bánh hơn 50.000 km đưa bệnh nhân nghèo về quê.',
    content: 'Cứ mỗi buổi sáng thứ hai, trước cổng Bệnh viện Ung bướu, những bác tài áo xanh lại ân cần đón từng cụ già...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    published_at: '2026-07-15 08:00',
    score_published_at: '2026-07-12 14:00',
    first_submitted_at: '2026-07-08 09:00',
    last_submitted_at: '2026-07-08 09:00',
    view_count: 18200,
    created_at: '2026-07-07 14:00',
    updated_at: '2026-07-15 08:00'
  },
  {
    id: 'art-pub-3',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-ky',
    category_id: 'cat-ky',
    genre_id: 'cat-ky',
    editor_id: 'u-ha',
    title: 'Hồn xưa phố cũ: Những nghệ nhân giữ lửa gốm men lam đất Việt',
    sapo: 'Giữa lòng đô thị hiện đại, các lò gốm thủ công bên bờ sông Đáy vẫn rực lửa đỏ mỗi sớm mai.',
    content: 'Tiếng bàn xoay lách cách đều đặn theo nhịp chân của cụ già ngoài 80 tuổi. Đôi tay thô ráp khéo léo vuốt lên dáng chiếc bình lam...',
    status: 'PUBLISHED',
    event_id: 'ev-thpt-2026',
    declared_nature: 'SANG_TAC',
    published_at: '2026-08-05 09:00',
    score_published_at: '2026-08-01 10:00',
    first_submitted_at: '2026-07-28 11:00',
    last_submitted_at: '2026-07-28 11:00',
    view_count: 11900,
    created_at: '2026-07-27 10:00',
    updated_at: '2026-08-05 09:00'
  },
  {
    id: 'art-pub-4',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-cuong-btv',
    title: 'Triệt phá kho hàng giả mỹ phẩm quy mô lớn tại cảng cạn',
    sapo: 'Lực lượng Quản lý thị trường thu giữ hơn 50.000 sản phẩm giả mạo nhãn hiệu nổi tiếng chuẩn bị đưa ra thị trường tiêu thụ.',
    content: 'Kiểm tra đột xuất kho hàng tại khu công nghiệp Tân Bình, cơ quan chức năng phát hiện hàng chục tấn mỹ phẩm không rõ nguồn gốc...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    published_at: '2026-08-18 11:30',
    score_published_at: '2026-08-16 16:00',
    first_submitted_at: '2026-08-15 14:00',
    last_submitted_at: '2026-08-15 14:00',
    view_count: 32000,
    created_at: '2026-08-15 10:00',
    updated_at: '2026-08-18 11:30'
  },
  {
    id: 'art-pub-5',
    author_id: 'u-tuan',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-media',
    category_id: 'cat-media',
    genre_id: 'cat-media',
    editor_id: 'u-dung',
    title: 'MegaStory: 30 ngày đêm đưa điện lưới quốc gia vượt biển ra đảo tiền tiêu',
    sapo: 'Hành trình kỳ tích kéo tuyến cáp ngầm 110kV vượt 25 hải lý qua những luồng lạch sâu thẳm đầy đá ngầm.',
    content: 'Những người thợ điện lực phong trần dầm mình dưới cái nắng biển mặn chát...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    published_at: '2026-09-02 08:00',
    score_published_at: '2026-08-28 15:00',
    first_submitted_at: '2026-08-22 10:00',
    last_submitted_at: '2026-08-22 10:00',
    view_count: 45000,
    created_at: '2026-08-20 16:00',
    updated_at: '2026-09-02 08:00'
  },

  // --- CÁC BÀI GẮN SỰ KIỆN: HẠN HÁN VÀ XÂM NHẬP MẶN MIỀN TÂY (ev-hanhan) ---
  // (Đủ 3 mức bão hòa: 1-10: 100%, 11-20: 80%, từ 21: 60%, có bài điểm >= 90 để kiểm tra miễn bão hòa)
  {
    id: 'art-ev-hh-01',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-cuong-btv',
    title: 'Hồ chứa nước ngọt Ba Tri cạn đáy giữa cao điểm nắng hạn',
    sapo: 'Hồ nước ngọt lớn nhất tỉnh Bến Tre trơ đáy nứt nẻ khiến hàng chục nghìn hộ dân điêu đứng.',
    content: 'Ghi nhận thực tế tại lòng hồ Kênh Lấp (huyện Ba Tri)...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 1,
    saturation_rate: 100,
    first_submitted_at: '2026-06-02 08:30',
    last_submitted_at: '2026-06-02 08:30',
    published_at: '2026-07-20 09:00', // 71 ngày trước -> Quá hạn chi (>60 ngày)
    created_at: '2026-06-02 08:00',
    updated_at: '2026-07-20 09:00'
  },
  {
    id: 'art-ev-hh-02',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-dung',
    title: 'Đắp đập tạm cứu vườn cây ăn trái chuyên canh Chợ Lách',
    sapo: 'Cuộc chạy đua nghẹt thở đắp 12 con đập dã chiến ngăn dòng nước mặn xâm nhập sầu riêng giống quý.',
    content: 'Hàng trăm thanh niên tình nguyện cùng bộ đội công binh...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 2,
    saturation_rate: 100,
    first_submitted_at: '2026-06-03 09:00',
    last_submitted_at: '2026-06-03 09:00',
    published_at: '2026-08-10 14:00', // 50 ngày trước -> Sắp đến hạn chi (45-60 ngày)
    created_at: '2026-06-03 08:30',
    updated_at: '2026-08-10 14:00'
  },
  {
    id: 'art-ev-hh-03',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-ha',
    title: 'Nông dân Bến Tre chở từng can nước ngọt tưới cây giống',
    sapo: 'Chi phí mua nước ngọt sinh hoạt và tưới tiêu tăng vọt khiến nhà vườn đứng trước nguy cơ thua lỗ nặng.',
    content: 'Dọc tuyến quốc lộ 57, từng đoàn xe ba gác chở bồn nước...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 3,
    saturation_rate: 100,
    first_submitted_at: '2026-06-04 10:00',
    last_submitted_at: '2026-06-04 10:00',
    published_at: '2026-09-12 08:30', // Trong hạn
    created_at: '2026-06-04 09:30',
    updated_at: '2026-09-12 08:30'
  },
  {
    id: 'art-ev-hh-04',
    author_id: 'u-tuan',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-media',
    category_id: 'cat-media',
    genre_id: 'cat-media',
    editor_id: 'u-cuong-btv',
    title: 'Phóng sự ảnh: Hạ lưu sông Tiền oằn mình trong cơn khát',
    sapo: 'Những hình ảnh xót xa ghi lại dòng sông cạn trơ đáy và nỗi cơ cực của người dân miệt vườn sông nước.',
    content: 'Bộ ảnh tác nghiệp 5 ngày đêm dọc bờ cồn cù lao...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 4,
    saturation_rate: 100,
    first_submitted_at: '2026-06-05 11:00',
    last_submitted_at: '2026-06-05 11:00',
    published_at: '2026-09-14 10:00',
    created_at: '2026-06-05 10:00',
    updated_at: '2026-09-14 10:00'
  },
  {
    id: 'art-ev-hh-05',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongvan',
    category_id: 'cat-phongvan',
    genre_id: 'cat-phongvan',
    editor_id: 'u-dung',
    title: 'Đối thoại với chuyên gia Viện Quy hoạch Thủy lợi miền Nam',
    sapo: 'GS.TS Nguyễn Văn Hùng phân tích nguyên nhân mặn xâm nhập bất thường và kịch bản ứng phó dài hạn.',
    content: 'Thưa Giáo sư, vì sao đợt mặn năm 2026 lại khốc liệt hơn dự báo ban đầu?...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 5,
    saturation_rate: 100,
    first_submitted_at: '2026-06-06 14:00',
    last_submitted_at: '2026-06-06 14:00',
    published_at: '2026-09-15 15:30',
    created_at: '2026-06-06 13:00',
    updated_at: '2026-09-15 15:30'
  },
  {
    id: 'art-ev-hh-06',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-ha',
    title: 'Huy động sà lan cấp 50.000m3 nước sạch miễn phí cho người nghèo',
    sapo: 'Nhiều doanh nghiệp và nhà hảo tâm chung tay chở nước ngọt từ thượng nguồn về vùng tâm hạn.',
    content: 'Những chuyến sà lan mang nặng ân tình cập bến cồn cát...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 6,
    saturation_rate: 100,
    first_submitted_at: '2026-06-07 08:30',
    last_submitted_at: '2026-06-07 08:30',
    published_at: '2026-09-16 09:00',
    created_at: '2026-06-07 08:00',
    updated_at: '2026-09-16 09:00'
  },
  {
    id: 'art-ev-hh-07',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-chinhluan',
    category_id: 'cat-chinhluan',
    genre_id: 'cat-chinhluan',
    editor_id: 'u-cuong-btv',
    title: 'Chính luận: Thuận thiên để giữ vững vựa lúa quốc gia',
    sapo: 'Thay đổi tư duy thích ứng với biến đổi khí hậu là mệnh lệnh sống còn của ĐBSCL.',
    content: 'Không thể tiếp tục đắp đê ngăn mặn bằng mọi giá mà cần chuyển dịch mùa vụ linh hoạt...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 7,
    saturation_rate: 100,
    first_submitted_at: '2026-06-08 09:15',
    last_submitted_at: '2026-06-08 09:15',
    published_at: '2026-09-17 14:00',
    created_at: '2026-06-08 08:30',
    updated_at: '2026-09-17 14:00'
  },
  {
    id: 'art-ev-hh-08',
    author_id: 'u-tuan',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-dung',
    title: 'Khánh thành tuyến ống dẫn nước ngọt dài 15km tại Gò Công Đông',
    sapo: 'Công trình cấp bách hoàn thành vượt tiến độ giải tỏa cơn khát cho 15.000 nhân khẩu vùng ven biển.',
    content: 'Đúng 9h sáng nay, dòng nước mát lành đã tuôn chảy từ vòi nước công cộng...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 8,
    saturation_rate: 100,
    first_submitted_at: '2026-06-09 10:20',
    last_submitted_at: '2026-06-09 10:20',
    published_at: '2026-09-18 11:00',
    created_at: '2026-06-09 09:00',
    updated_at: '2026-09-18 11:00'
  },
  {
    id: 'art-ev-hh-09',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-cuong-btv',
    title: 'Chuyện người thợ lặn kiểm tra cống ngăn mặn ngày đêm',
    sapo: 'Ngâm mình dưới dòng nước chảy xiết ngậm phù sa để trám từng khe hở cánh cống ngăn mặn.',
    content: 'Anh Bảy Đực ngoi lên khỏi mặt nước thở dốc, tay cầm chiếc búa chuyên dụng...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 9,
    saturation_rate: 100,
    first_submitted_at: '2026-06-10 11:30',
    last_submitted_at: '2026-06-10 11:30',
    published_at: '2026-09-19 16:00',
    created_at: '2026-06-10 10:00',
    updated_at: '2026-09-19 16:00'
  },
  {
    id: 'art-ev-hh-10',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-ha',
    title: 'Bộ Nông nghiệp ban bố tình huống khẩn cấp về hạn mặn tại 5 tỉnh',
    sapo: 'Các địa phương được phép áp dụng cơ chế đặc thù để mua sắm vật tư và thi công các công trình cấp nước.',
    content: 'Quyết định được ký ban hành chiều nay tại hội nghị trực tuyến phòng chống hạn mặn...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 10,
    saturation_rate: 100,
    first_submitted_at: '2026-06-11 15:00',
    last_submitted_at: '2026-06-11 15:00',
    published_at: '2026-09-20 08:30',
    created_at: '2026-06-11 14:00',
    updated_at: '2026-09-20 08:30'
  },

  // Bài 11 - 20: Giảm 20% (áp dụng 80%)
  {
    id: 'art-ev-hh-11',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-dung',
    title: 'Giá nước ngọt tăng cao kỷ lục tại vùng ven biển Tiền Giang',
    sapo: 'Mỗi mét khối nước ngọt vận chuyển bằng xe bồn đã chạm mốc 150.000 đồng.',
    content: 'Người dân phải xếp hàng dài từ 3 giờ sáng để hứng nước...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 11,
    saturation_rate: 80,
    first_submitted_at: '2026-06-12 09:00',
    last_submitted_at: '2026-06-12 09:00',
    published_at: '2026-09-21 09:00',
    created_at: '2026-06-12 08:00',
    updated_at: '2026-09-21 09:00'
  },
  {
    id: 'art-ev-hh-12',
    author_id: 'u-tuan',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-cuong-btv',
    title: 'Nhật ký xuyên đêm vận hành trạm bơm dã chiến cồn Tân Phong',
    sapo: 'Tranh thủ từng giờ từng phút khi độ mặn ngoài sông giảm xuống dưới 1‰ để bơm trữ nước vào mương vườn.',
    content: 'Đồng hồ điểm 1 giờ sáng, còi báo trạm bơm rúc lên từng hồi giục giã...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 12,
    saturation_rate: 80,
    first_submitted_at: '2026-06-14 10:30',
    last_submitted_at: '2026-06-14 10:30',
    published_at: '2026-09-22 10:00',
    created_at: '2026-06-14 09:30',
    updated_at: '2026-09-22 10:00'
  },
  {
    id: 'art-ev-hh-13',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-ha',
    title: 'Tổ chức các điểm cấp nước ngọt dã chiến tại xã cù lao Thới Sơn',
    sapo: '3 bồn chứa nước composite dung tích 10.000 lít được đưa về lắp đặt phục vụ bà con cồn bãi.',
    content: 'UBND tỉnh Tiền Giang đã chi viện phương tiện kéo bồn nước...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 13,
    saturation_rate: 80,
    first_submitted_at: '2026-06-16 11:00',
    last_submitted_at: '2026-06-16 11:00',
    published_at: '2026-09-23 11:00',
    created_at: '2026-06-16 10:00',
    updated_at: '2026-09-23 11:00'
  },
  // (Bài art-nuocsach là bài thứ 14 trong chuỗi, rank 14, rate 80%, điểm hiệu lực 92 -> Miễn bão hòa)
  {
    id: 'art-ev-hh-15',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-dung',
    title: 'Cứu hộ đàn bò sữa suy kiệt vì thiếu nước ngọt tại Ba Tri',
    sapo: 'Hàng trăm hộ nuôi bò sữa ở xã An Đức phải mua rơm và nước ngọt cầm cự qua mùa khô hạn.',
    content: 'Đàn bò nằm ủ rũ trong chuồng vì nắng nóng gay gắt...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 15,
    saturation_rate: 80,
    first_submitted_at: '2026-06-19 14:00',
    last_submitted_at: '2026-06-19 14:00',
    published_at: '2026-09-24 14:00',
    created_at: '2026-06-19 13:00',
    updated_at: '2026-09-24 14:00'
  },
  {
    id: 'art-ev-hh-16',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-ha',
    title: 'Trà Vinh cấp bách đào giếng tầng sâu cứu diện tích lúa hè thu',
    sapo: 'Công ty Cấp thoát nước Trà Vinh mở 6 trạm khoan giếng công nghiệp tầng sâu hơn 300m.',
    content: 'Máy khoan giếng hoạt động liên tục 24/24 giờ để đưa dòng nước ngầm ngọt lành...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 16,
    saturation_rate: 80,
    first_submitted_at: '2026-06-20 15:30',
    last_submitted_at: '2026-06-20 15:30',
    published_at: '2026-09-25 15:00',
    created_at: '2026-06-20 14:30',
    updated_at: '2026-09-25 15:00'
  },
  {
    id: 'art-ev-hh-17',
    author_id: 'u-tuan',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-cuong-btv',
    title: 'Tăng cường giám sát độ mặn trên hệ thống sông Tiền và sông Hậu',
    sapo: 'Các trạm đo mặn tự động truyền dữ liệu liên tục 15 phút một lần về điện thoại người dân.',
    content: 'Ứng dụng cảnh báo mặn đã giúp hàng nghìn hộ chủ động đóng cống...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 17,
    saturation_rate: 80,
    first_submitted_at: '2026-06-21 09:00',
    last_submitted_at: '2026-06-21 09:00',
    published_at: '2026-09-26 09:00',
    created_at: '2026-06-21 08:00',
    updated_at: '2026-09-26 09:00'
  },
  {
    id: 'art-ev-hh-18',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-dung',
    title: 'Đoàn xe cứu trợ nước sạch của tuổi trẻ TP.HCM đến với Bến Tre',
    sapo: 'Hơn 20 xe bồn chuyên dụng mang theo 200.000 lít nước tinh khiết đến từng ấp nghèo.',
    content: 'Bà con mang can, thùng phi ra tận đường lớn hân hoan đón dòng nước ngọt...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 18,
    saturation_rate: 80,
    first_submitted_at: '2026-06-22 10:00',
    last_submitted_at: '2026-06-22 10:00',
    published_at: '2026-09-26 14:00',
    created_at: '2026-06-22 09:00',
    updated_at: '2026-09-26 14:00'
  },
  {
    id: 'art-ev-hh-19',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-ha',
    title: 'Triển khai mô hình tích trữ nước mưa trong túi nhựa khổng lồ',
    sapo: 'Giải pháp túi chứa nước dung tích 15 - 30m3 phát huy hiệu quả bất ngờ tại vùng đất ngập mặn.',
    content: 'Túi nhựa PVC đặt dưới lòng mương vườn có chi phí thấp và lắp đặt nhanh chóng...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 19,
    saturation_rate: 80,
    first_submitted_at: '2026-06-23 11:30',
    last_submitted_at: '2026-06-23 11:30',
    published_at: '2026-09-27 10:00',
    created_at: '2026-06-23 10:30',
    updated_at: '2026-09-27 10:00'
  },
  {
    id: 'art-ev-hh-20',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-cuong-btv',
    title: 'Khuyến cáo nhà vườn không tự ý bơm nước tưới khi chưa đo mặn',
    sapo: 'Nhiều vườn sầu riêng đã bị cháy lá và rụng hoa hàng loạt vì chủ quan bơm nước có độ mặn vượt ngưỡng.',
    content: 'Chi cục Trồng trọt và Bảo vệ Thực vật các tỉnh miền Tây phát cảnh báo khẩn...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 20,
    saturation_rate: 80,
    first_submitted_at: '2026-06-24 14:00',
    last_submitted_at: '2026-06-24 14:00',
    published_at: '2026-09-27 16:00',
    created_at: '2026-06-24 13:00',
    updated_at: '2026-09-27 16:00'
  },

  // Bài từ thứ 21 trở đi: Giảm 40% (áp dụng 60%)
  {
    id: 'art-ev-hh-21',
    author_id: 'u-binh',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-tin',
    category_id: 'cat-tin',
    genre_id: 'cat-tin',
    editor_id: 'u-dung',
    title: 'Hàng trăm héc-ta hoa màu chết héo vì khát nước ngọt tại Gò Công',
    sapo: 'Nông dân bất lực nhìn những luống dưa hấu, rau màu tàn lụi dưới cái nắng chói chang.',
    content: 'Đất nứt nẻ thành những kẽ sâu hoắm, dây dưa héo quắt...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 21,
    saturation_rate: 60,
    first_submitted_at: '2026-06-25 09:00',
    last_submitted_at: '2026-06-25 09:00',
    published_at: '2026-09-28 08:30',
    created_at: '2026-06-25 08:00',
    updated_at: '2026-09-28 08:30'
  },
  {
    id: 'art-ev-hh-22',
    author_id: 'u-an',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-phongsu',
    category_id: 'cat-phongsu',
    genre_id: 'cat-phongsu',
    editor_id: 'u-cuong-btv',
    title: 'Sáng kiến máy lọc nước mặn năng lượng mặt trời của sinh viên miền Tây',
    sapo: 'Thiết bị chưng cất nước ngọt năng lượng mặt trời chi phí rẻ đem lại niềm hy vọng lớn cho xóm chài ven biển.',
    content: 'Nhóm sinh viên Đại học Cần Thơ đã sáng chế thành công thiết bị nhỏ gọn sản xuất 20 lít nước ngọt mỗi ngày...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 22,
    saturation_rate: 60,
    first_submitted_at: '2026-06-26 10:30',
    last_submitted_at: '2026-06-26 10:30',
    published_at: '2026-09-28 14:00',
    created_at: '2026-06-26 09:30',
    updated_at: '2026-09-28 14:00'
  },
  {
    id: 'art-ev-hh-23',
    author_id: 'u-nam',
    section_id: 'sec-xahoi',
    declared_category_id: 'cat-chinhluan',
    category_id: 'cat-chinhluan',
    genre_id: 'cat-chinhluan',
    editor_id: 'u-ha',
    title: 'Tương lai sinh kế bán đảo Cà Mau trong kịch bản sụt lún và hạn mặn',
    sapo: 'Phân tích đa chiều về bài toán tái cơ cấu kinh tế nông nghiệp thích ứng vùng hạ châu thổ Mekong.',
    content: 'Cà Mau đang đối mặt với thách thức kép: nước ngầm cạn kiệt và sụt lún địa tầng...',
    status: 'PUBLISHED',
    declared_nature: 'SANG_TAC',
    event_id: 'ev-hanhan',
    saturation_rank: 23,
    saturation_rate: 60,
    first_submitted_at: '2026-06-27 15:00',
    last_submitted_at: '2026-06-27 15:00',
    published_at: '2026-09-29 09:00',
    created_at: '2026-06-27 14:00',
    updated_at: '2026-09-29 09:00'
  }
];

/**
 * Danh sách đồng tác giả (article_authors):
 * Bài mẫu 'art-nuocsach': An chính 60%, Bình đồng tác giả 40% (xác nhận 19/06/2026)
 */
export const INITIAL_ARTICLE_AUTHORS: ArticleAuthor[] = [
  // Bài mẫu trung tâm 'art-nuocsach'
  {
    id: 'aa-ns-1',
    article_id: 'art-nuocsach',
    user_id: 'u-an',
    is_main: true,
    share_percent: 60,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-06-18 09:30'
  },
  {
    id: 'aa-ns-2',
    article_id: 'art-nuocsach',
    user_id: 'u-binh',
    is_main: false,
    share_percent: 40,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-06-19 14:15'
  },

  // 3 bài demo kiểm tra trùng lặp
  {
    id: 'aa-demo-cr-1',
    article_id: 'art-demo-cairang',
    user_id: 'u-an',
    is_main: true,
    share_percent: 70,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-09-24 08:00'
  },
  {
    id: 'aa-demo-cr-2',
    article_id: 'art-demo-cairang',
    user_id: 'u-binh',
    is_main: false,
    share_percent: 30,
    confirm_status: 'PENDING',
    confirm_deadline: '2026-09-27 08:00'
  },
  {
    id: 'aa-demo-gl-1',
    article_id: 'art-demo-gialua',
    user_id: 'u-an',
    is_main: true,
    share_percent: 100,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-09-25 09:30'
  },
  {
    id: 'aa-demo-bs5-1',
    article_id: 'art-demo-baoso5',
    user_id: 'u-an',
    is_main: true,
    share_percent: 100,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-09-26 10:15'
  },

  // Bài 'art-coauthor-pending-1' (An chính 70%, Bình 30% - đang chờ Bình xác nhận)
  {
    id: 'aa-cap1-1',
    article_id: 'art-coauthor-pending-1',
    user_id: 'u-an',
    is_main: true,
    share_percent: 70,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-09-25 09:00'
  },
  {
    id: 'aa-cap1-2',
    article_id: 'art-coauthor-pending-1',
    user_id: 'u-binh',
    is_main: false,
    share_percent: 30,
    confirm_status: 'PENDING',
    confirm_deadline: '2026-09-28 09:00'
  },

  // Bài 'art-coauthor-pending-2' (Nam chính 60%, Tuấn 40% - đang chờ Tuấn xác nhận)
  {
    id: 'aa-cap2-1',
    article_id: 'art-coauthor-pending-2',
    user_id: 'u-nam',
    is_main: true,
    share_percent: 60,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-09-26 14:00'
  },
  {
    id: 'aa-cap2-2',
    article_id: 'art-coauthor-pending-2',
    user_id: 'u-tuan',
    is_main: false,
    share_percent: 40,
    confirm_status: 'PENDING',
    confirm_deadline: '2026-09-29 14:00'
  },

  // Bài 'art-coauthor-pending-3' (Bình chính 65%, An 35% - đang chờ An xác nhận)
  {
    id: 'aa-cap3-1',
    article_id: 'art-coauthor-pending-3',
    user_id: 'u-binh',
    is_main: true,
    share_percent: 65,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-09-26 10:00'
  },
  {
    id: 'aa-cap3-2',
    article_id: 'art-coauthor-pending-3',
    user_id: 'u-an',
    is_main: false,
    share_percent: 35,
    confirm_status: 'PENDING',
    confirm_deadline: '2026-09-29 10:00'
  },

  // Bài nộp lại cần chấm lần 2 (An chính 100%)
  {
    id: 'aa-resub-1',
    article_id: 'art-assigned-resubmit',
    user_id: 'u-an',
    is_main: true,
    share_percent: 100,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-09-25 14:00'
  },

  // Bài Trưởng ban yêu cầu chấm lại (Bình chính 70%, Nam 30%)
  {
    id: 'aa-leadrescore-1',
    article_id: 'art-assigned-lead-rescore',
    user_id: 'u-binh',
    is_main: true,
    share_percent: 70,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-09-21 09:00'
  },
  {
    id: 'aa-leadrescore-2',
    article_id: 'art-assigned-lead-rescore',
    user_id: 'u-nam',
    is_main: false,
    share_percent: 30,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-09-21 10:00'
  },

  // Bài 'art-pub-2' (Bình chính 70%, An 30%)
  {
    id: 'aa-p2-1',
    article_id: 'art-pub-2',
    user_id: 'u-binh',
    is_main: true,
    share_percent: 70,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-07-08 09:00'
  },
  {
    id: 'aa-p2-2',
    article_id: 'art-pub-2',
    user_id: 'u-an',
    is_main: false,
    share_percent: 30,
    confirm_status: 'ACCEPTED',
    confirmed_at: '2026-07-09 10:20'
  }
];

/**
 * Media đính kèm (article_attachments):
 * Bài 'art-nuocsach': 3 ảnh theo kịch bản:
 * - Ảnh 1 của Bình: Tự chụp, Mới ('MOI')
 * - Ảnh 2 của Bình: Tự chụp, Tái sử dụng ('TAI_SU_DUNG', lệch 3 bit so với ảnh cũ năm 2025)
 * - Ảnh 3: Nguồn ngoài ('NGUON_NGOAI')
 */
export const INITIAL_ATTACHMENTS: ArticleAttachment[] = [
  // 3 ảnh của bài mẫu trung tâm 'art-nuocsach'
  {
    id: 'att-ns-1',
    article_id: 'art-nuocsach',
    version_id: 'ver-ns-1',
    media_type: 'IMAGE',
    media_kind: 'ANH_TU_CHUP',
    media_author_id: 'u-binh',
    source_type: 'UPLOAD',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=800&auto=format&fit=crop&q=80',
    original_name: 'nguoi_dan_xom_chai_keo_nuoc_ngot.jpg',
    caption: 'Ảnh 1: Người dân xóm chài kéo nước ngọt từ sà lan về lán trại (Ảnh: Trần Thị Bình)',
    dhash: 'a1b2c3d4e5f60718',
    hash_check: 'MOI',
    file_size: 1850000,
    sort_order: 1,
    created_at: '2026-06-18 09:30'
  },
  {
    id: 'att-ns-2',
    article_id: 'art-nuocsach',
    version_id: 'ver-ns-1',
    media_type: 'IMAGE',
    media_kind: 'ANH_TU_CHUP',
    media_author_id: 'u-binh',
    source_type: 'UPLOAD',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=800&auto=format&fit=crop&q=80',
    original_name: 'long_kenh_can_tro_day.jpg',
    caption: 'Ảnh 2: Lòng kênh cạn trơ đáy trong mùa khô hạn khốc liệt (Ảnh: Trần Thị Bình)',
    dhash: 'a1b2c3d4e5f6071b',
    hash_check: 'TAI_SU_DUNG',
    matched_distance_bits: 3,
    matched_article_id: 'art-old-2025',
    file_size: 2100000,
    sort_order: 2,
    created_at: '2026-06-18 09:30'
  },
  {
    id: 'att-ns-3',
    article_id: 'art-nuocsach',
    version_id: 'ver-ns-1',
    media_type: 'IMAGE',
    media_kind: 'NGUON_NGOAI',
    external_source: 'Báo Tài nguyên & Môi trường',
    source_type: 'URL',
    url: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&auto=format&fit=crop&q=80',
    original_name: 'ban_do_xam_nhap_man_song_tien.jpg',
    caption: 'Ảnh 3: Bản đồ ranh mặn 4 phần nghìn xâm nhập sâu vào nội đồng (Nguồn: Báo TN&MT)',
    dhash: '0011223344556677',
    hash_check: 'NGUON_NGOAI',
    file_size: 950000,
    sort_order: 3,
    created_at: '2026-06-18 09:30'
  },

  // Media cho các bài viết khác
  {
    id: 'att-pub1-1',
    article_id: 'art-pub-1',
    media_type: 'IMAGE',
    media_kind: 'ANH_TU_CHUP',
    media_author_id: 'u-an',
    source_type: 'UPLOAD',
    url: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
    original_name: 'hop_chinh_phu_luong_co_so.jpg',
    caption: 'Kỳ họp ban hành chính sách tiền lương mới',
    hash_check: 'MOI',
    file_size: 1450000,
    sort_order: 1,
    created_at: '2026-06-28 10:00'
  },
  {
    id: 'att-pub2-1',
    article_id: 'art-pub-2',
    media_type: 'IMAGE',
    media_kind: 'ANH_TU_CHUP',
    media_author_id: 'u-binh',
    source_type: 'UPLOAD',
    url: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800&auto=format&fit=crop&q=80',
    original_name: 'chuyen_xe_0_dong.jpg',
    caption: 'Chuyến xe ấm áp nghĩa tình đưa bệnh nhân nghèo về quê',
    hash_check: 'MOI',
    file_size: 1720000,
    sort_order: 1,
    created_at: '2026-07-08 09:00'
  },
  {
    id: 'att-pub5-1',
    article_id: 'art-pub-5',
    media_type: 'VIDEO',
    media_kind: 'VIDEO_TU_QUAY',
    media_author_id: 'u-tuan',
    source_type: 'UPLOAD',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    original_name: 'keo_cap_ngam_xuyen_bien.mp4',
    caption: 'Video hiện trường thi công kéo cáp ngầm xuyên biển',
    hash_check: 'MOI',
    file_size: 24500000,
    sort_order: 1,
    created_at: '2026-08-22 10:00'
  },

  // Media cho 3 bài demo kiểm tra trùng lặp
  {
    id: 'att-demo-cr-1',
    article_id: 'art-demo-cairang',
    media_type: 'IMAGE',
    media_kind: 'ANH_TU_CHUP',
    media_author_id: 'u-binh',
    source_type: 'UPLOAD',
    url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80',
    original_name: 'ghe_cho_nong_san_cai_rang.jpg',
    caption: 'Ghe xuồng chở đầy hoa trái miệt vườn cập bến chợ nổi (Ảnh: Trần Thị Bình)',
    dhash: '12345678abcdef01',
    hash_check: 'MOI',
    file_size: 1650000,
    sort_order: 1,
    created_at: '2026-09-24 08:00'
  },
  {
    id: 'att-demo-cr-2',
    article_id: 'art-demo-cairang',
    media_type: 'IMAGE',
    media_kind: 'ANH_TU_CHUP',
    media_author_id: 'u-an',
    source_type: 'UPLOAD',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop&q=80',
    original_name: 'cay_beo_chao_hang.jpg',
    caption: 'Cây bẹo vươn cao treo củ quả chào mời bạn hàng (Ảnh: Nguyễn Văn An)',
    dhash: '98765432fedcba10',
    hash_check: 'MOI',
    file_size: 1420000,
    sort_order: 2,
    created_at: '2026-09-24 08:00'
  },
  {
    id: 'att-demo-gl-1',
    article_id: 'art-demo-gialua',
    media_type: 'IMAGE',
    media_kind: 'ANH_TU_CHUP',
    media_author_id: 'u-an',
    source_type: 'UPLOAD',
    url: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
    original_name: 'thu_hoach_lua_co_do.jpg',
    caption: 'Thu hoạch lúa tươi bằng máy gặt đập liên hợp tại huyện Cờ Đỏ (Ảnh: Nguyễn Văn An)',
    dhash: '1122334455667788',
    hash_check: 'MOI',
    file_size: 1980000,
    sort_order: 1,
    created_at: '2026-09-25 09:30'
  },
  {
    id: 'att-demo-gl-2',
    article_id: 'art-demo-gialua',
    media_type: 'IMAGE',
    media_kind: 'NGUON_NGOAI',
    external_source: 'Báo Nông nghiệp Việt Nam',
    source_type: 'URL',
    url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&auto=format&fit=crop&q=80',
    original_name: 'bieu_do_gia_lua_xuat_khau.jpg',
    caption: 'Biểu đồ diễn biến giá gạo xuất khẩu 5% tấm (Nguồn: Báo Nông nghiệp VN)',
    dhash: 'aabbccddeeff0011',
    hash_check: 'NGUON_NGOAI',
    file_size: 850000,
    sort_order: 2,
    created_at: '2026-09-25 09:30'
  },
  {
    id: 'att-demo-bs5-1',
    article_id: 'art-demo-baoso5',
    media_type: 'IMAGE',
    media_kind: 'NGUON_NGOAI',
    external_source: 'Trung tâm Dự báo Khí tượng Thủy văn Quốc gia',
    source_type: 'URL',
    url: 'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&auto=format&fit=crop&q=80',
    original_name: 'anh_ve_tinh_bao_so_5.jpg',
    caption: 'Ảnh mây vệ tinh vùng tâm bão số 5 áp sát bờ biển Quảng Ninh (Nguồn: KTTV QG)',
    dhash: '00ffeeddccbbaa99',
    hash_check: 'NGUON_NGOAI',
    file_size: 920000,
    sort_order: 1,
    created_at: '2026-09-26 10:15'
  },
  {
    id: 'att-demo-bs5-2',
    article_id: 'art-demo-baoso5',
    media_type: 'IMAGE',
    media_kind: 'ANH_TU_CHUP',
    media_author_id: 'u-an',
    source_type: 'UPLOAD',
    url: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?w=800&auto=format&fit=crop&q=80',
    original_name: 'neo_dau_tau_thuyen.jpg',
    caption: 'Ngư dân chằng néo tàu thuyền tại âu tránh trú bão (Ảnh: Nguyễn Văn An - Ảnh tư liệu lưu trữ)',
    dhash: 'a1b2c3d4e5f6071a',
    hash_check: 'TAI_SU_DUNG',
    matched_distance_bits: 2,
    matched_article_id: 'art-old-2025',
    file_size: 1750000,
    sort_order: 2,
    created_at: '2026-09-26 10:15'
  }
];

export const INITIAL_DUPLICATION_MATCHES: DuplicationMatch[] = [
  {
    article_id: 'art-nuocsach',
    matched_article_id: 'art-ref-hanhan',
    matched_article_title: 'Hạn mặn khốc liệt đe dọa sinh kế hạ lưu sông Tiền',
    matched_author_name: 'Võ Minh Trí (Báo Nông nghiệp)',
    overlap_percent: 12,
    passages: [
      {
        mine: 'Mùa khô năm nay, độ mặn 4 phần nghìn xâm nhập sâu vào nội đồng hơn 50km, vượt xa mốc lịch sử năm 2020.',
        theirs: 'Trong đợt triều cường đầu tháng, ranh mặn 4‰ đã lấn sâu vào sông Tiền hơn 50km so với mốc năm 2020.'
      }
    ]
  },
  // 3 trường hợp demo kiểm tra trùng lặp
  {
    article_id: 'art-demo-cairang',
    matched_article_id: 'art-ref-cairang-old',
    matched_article_title: 'Ký sự chợ nổi miền Tây ngày giáp Tết',
    matched_author_name: 'Phạm Quốc Hùng (Báo Miền Tây)',
    overlap_percent: 12,
    passages: [
      {
        mine: 'Tờ mờ sáng, khi sương mù còn bảng lảng trên mặt sông Cần Thơ, tiếng máy đuôi tôm đã rền vang khắp khúc sông Cái Răng.',
        theirs: 'Từ mờ sáng tinh mơ, sương mù còn bảng lảng trên sông Cần Thơ, tiếng máy ghe đuôi tôm đã rền vang trên bến Cái Răng.'
      }
    ]
  },
  {
    article_id: 'art-demo-gialua',
    matched_article_id: 'art-ref-gialua-old',
    matched_article_title: 'Thị trường lúa gạo đồng bằng lập đỉnh mới',
    matched_author_name: 'Nguyễn Thành Chung (Thời báo Kinh tế)',
    overlap_percent: 34,
    passages: [
      {
        mine: 'giá lúa OM 18 và Đài Thơm 8 đang được thương lái thu mua tại ruộng với giá dao động từ 8.200 - 8.600 đồng/kg, tăng gần 1.000 đồng/kg so với vụ trước.',
        theirs: 'giá giống lúa OM 18 và Đài Thơm 8 được các thương lái thu mua tận ruộng với giá dao động 8.200 - 8.600 đồng/kg, tăng hơn 1.000 đồng/kg so với năm trước.'
      },
      {
        mine: 'Xuất khẩu gạo khởi sắc cùng nhu cầu thu gom nguyên liệu của các doanh nghiệp chế biến lương thực là động lực chính giúp giá lúa duy trì đà tăng ổn định.',
        theirs: 'nhu cầu thu gom nguyên liệu của các doanh nghiệp chế biến lương thực xuất khẩu là động lực lớn giúp giá lúa duy trì đà tăng ổn định trên thị trường.'
      }
    ]
  },
  {
    article_id: 'art-demo-baoso5',
    matched_article_id: 'art-ref-baoso5-old',
    matched_article_title: 'Bản tin dự báo thời tiết khẩn cấp về cơn bão số 5',
    matched_author_name: 'Phòng Dự báo Khí tượng (Bản tin Đài TT)',
    overlap_percent: 63,
    passages: [
      {
        mine: 'Theo Trung tâm Dự báo Khí tượng Thủy văn Quốc gia, hồi 4 giờ sáng nay, vị trí tâm bão ở vào khoảng 20,5 độ Vĩ Bắc; 108,8 độ Kinh Đông, cách bờ biển Quảng Ninh - Hải Phòng khoảng 120km về phía Đông. Sức gió mạnh nhất vùng gần tâm bão mạnh cấp 11-12, giật cấp 14.',
        theirs: 'Bản tin Trung tâm Dự báo Khí tượng Thủy văn Quốc gia: Hồi 4 giờ ngày hôm nay, tâm bão số 5 tại 20,5 độ Vĩ Bắc; 108,8 độ Kinh Đông, cách bờ biển Quảng Ninh - Hải Phòng 120km về phía Đông. Sức gió mạnh nhất vùng gần tâm bão đạt cấp 11-12, giật cấp 14.'
      },
      {
        mine: 'Dự báo trong 12 giờ tới, bão di chuyển chủ yếu theo hướng Tây Tây Bắc với tốc độ khoảng 20km/h, đi vào đất liền khu vực ven biển Đông Bắc Bộ. Vùng biển Vịnh Bắc Bộ sóng biển cao từ 3,0 - 5,0m, biển động dữ dội.',
        theirs: 'Trong 12 giờ tới, bão di chuyển chủ yếu theo hướng Tây Tây Bắc tốc độ 20km/h, đổ bộ vào đất liền ven biển Đông Bắc Bộ. Vùng biển Vịnh Bắc Bộ sóng biển cao 3,0 - 5,0m, biển động dữ dội.'
      }
    ]
  }
];

export const INITIAL_ARTICLE_VERSIONS: ArticleVersion[] = [
  {
    id: 'ver-ns-1',
    article_id: 'art-nuocsach',
    version_no: 1,
    title: 'Nước sạch ở xóm chài ven sông',
    sapo: 'Giữa cái nắng như thiêu như đốt của mùa hạn mặn lịch sử...',
    content: 'Nội dung bản thảo gốc nộp ngày 18/06/2026...',
    genre_id: 'cat-phongsu',
    created_by: 'u-an',
    created_at: '2026-06-18 09:30'
  }
];

export const INITIAL_STATUS_LOGS: ArticleStatusLog[] = [
  {
    id: 'log-ns-1',
    article_id: 'art-nuocsach',
    action: 'Nộp bài duyệt',
    from_status: 'DRAFT',
    to_status: 'SUBMITTED',
    actor_id: 'u-an',
    note: 'Phóng viên nộp bài phóng sự điều tra hiện trường',
    created_at: '2026-06-18 09:30'
  },
  {
    id: 'log-ns-2',
    article_id: 'art-nuocsach',
    action: 'Xác nhận đồng tác giả',
    from_status: 'SUBMITTED',
    to_status: 'SUBMITTED',
    actor_id: 'u-binh',
    note: 'Đồng tác giả Trần Thị Bình xác nhận tham gia 40% (ảnh hiện trường)',
    created_at: '2026-06-19 14:15'
  },
  {
    id: 'log-ns-3',
    article_id: 'art-nuocsach',
    action: 'Phân công thẩm định',
    from_status: 'SUBMITTED',
    to_status: 'ASSIGNED',
    actor_id: 'u-long',
    note: 'Trưởng ban phân công cho BTV Đỗ Mạnh Cường thẩm định',
    created_at: '2026-06-20 08:30'
  },
  {
    id: 'log-ns-4',
    article_id: 'art-nuocsach',
    action: 'Chấm điểm chất lượng',
    from_status: 'ASSIGNED',
    to_status: 'PENDING_APPROVAL',
    actor_id: 'u-cuong-btv',
    note: 'BTV hoàn tất chấm điểm chất lượng theo bộ tiêu chí Phóng sự: 88/100 điểm (bậc Khá)',
    created_at: '2026-06-24 16:00'
  },
  {
    id: 'log-ns-5',
    article_id: 'art-nuocsach',
    action: 'Công bố điểm & Duyệt xuất bản',
    from_status: 'PENDING_APPROVAL',
    to_status: 'SCORE_PUBLISHED',
    actor_id: 'u-long',
    note: 'Trưởng ban phê duyệt điểm chấm, mở thời hạn khiếu nại 7 ngày',
    created_at: '2026-06-25 15:00'
  },
  {
    id: 'log-ns-6',
    article_id: 'art-nuocsach',
    action: 'Xuất bản bài viết',
    from_status: 'SCORE_PUBLISHED',
    to_status: 'PUBLISHED',
    actor_id: 'u-long',
    note: 'Hết thời hạn khiếu nại, chính thức đăng báo điện tử',
    created_at: '2026-06-29 08:00'
  },
  {
    id: 'log-resub-1',
    article_id: 'art-assigned-resubmit',
    action: 'Yêu cầu sửa lại bài viết',
    from_status: 'ASSIGNED',
    to_status: 'REVISION_REQUESTED',
    actor_id: 'u-cuong-btv',
    note: 'Yêu cầu phóng viên bổ sung kết quả kiểm nghiệm mẫu nước và phản hồi từ BQL cụm công nghiệp.',
    created_at: '2026-09-22 15:00'
  },
  {
    id: 'log-resub-2',
    article_id: 'art-assigned-resubmit',
    action: 'Phóng viên nộp lại bài viết (Chấm lại lần 2)',
    from_status: 'REVISION_REQUESTED',
    to_status: 'ASSIGNED',
    actor_id: 'u-an',
    note: 'Phóng viên Văn An đã hoàn thiện bài viết theo góp ý của BTV và nộp lại để thẩm định lần 2.',
    created_at: '2026-09-25 14:00'
  },
  {
    id: 'log-lead-rescore-1',
    article_id: 'art-assigned-lead-rescore',
    action: 'Trưởng ban yêu cầu chấm lại',
    from_status: 'PENDING_APPROVAL',
    to_status: 'ASSIGNED',
    actor_id: 'u-long',
    note: 'Trưởng ban Phan Hải Long: Đề nghị BTV Đỗ Mạnh Cường đánh giá lại tiêu chí Ảnh/minh họa do tác giả đã bổ sung bộ ảnh lặn biển độc quyền đạt chất lượng rất cao.',
    created_at: '2026-09-26 09:00'
  }
];

export const INITIAL_QUALITY_SCORES: QualityScore[] = [
  {
    id: 'qs-ns',
    article_id: 'art-nuocsach',
    editor_id: 'u-cuong-btv',
    criteria_set_version: 2,
    criteria_scores: [
      { criterion_id: 'crit-ps2-1', name: 'Tính thời sự, giá trị thông tin', weight: 20, score: 80, weighted_score: 16.0, comment: 'Tính thời sự rất cao' },
      { criterion_id: 'crit-ps2-2', name: 'Độ chính xác, có nguồn đối chứng', weight: 25, score: 80, weighted_score: 20.0, comment: 'Đã bổ sung đối chứng và số liệu đầy đủ từ Trạm cấp nước' },
      { criterion_id: 'crit-ps2-3', name: 'Chiều sâu, góc nhìn riêng', weight: 25, score: 75, weighted_score: 18.75, comment: 'Phản ánh nhân văn, phân tích thấu đáo' },
      { criterion_id: 'crit-ps2-4', name: 'Bố cục, ngôn ngữ', weight: 15, score: 80, weighted_score: 12.0, comment: 'Kết cấu bài mạch lạc, hành văn cuốn hút' },
      { criterion_id: 'crit-ps2-5', name: 'Ảnh/minh họa hỗ trợ nội dung', weight: 15, score: 75, weighted_score: 11.25, comment: 'Bộ ảnh tác nghiệp chân thực' }
    ],
    total_score: 78,
    quality_factor: 1.0,
    quality_tier: 'Khá',
    note: 'Bài viết phản ánh chân thực, góc nhìn nhân văn sâu sắc. Đã bổ sung nguồn đối chứng hoàn chỉnh.',
    scored_at: '2026-06-24 16:00'
  },
  {
    id: 'qs-pend-1',
    article_id: 'art-pend-app-1',
    editor_id: 'u-cuong-btv',
    criteria_set_version: 2,
    criteria_scores: [
      { criterion_id: 'crit-ps2-1', name: 'Tính thời sự, giá trị thông tin', weight: 20, score: 92, weighted_score: 18.4, comment: 'Câu chuyện xúc động, tính lan tỏa cao' },
      { criterion_id: 'crit-ps2-2', name: 'Độ chính xác, có nguồn đối chứng', weight: 25, score: 88, weighted_score: 22.0, comment: 'Hồ sơ bệnh án và thông tin kíp mổ rõ ràng' },
      { criterion_id: 'crit-ps2-3', name: 'Chiều sâu, góc nhìn riêng', weight: 25, score: 84, weighted_score: 21.0, comment: 'Khai thác tốt tâm lý bác sĩ và gia đình bệnh nhân' },
      { criterion_id: 'crit-ps2-4', name: 'Bố cục, ngôn ngữ', weight: 15, score: 86, weighted_score: 12.9, comment: 'Văn phong hấp dẫn, tạo được kịch tính' },
      { criterion_id: 'crit-ps2-5', name: 'Ảnh/minh họa hỗ trợ nội dung', weight: 15, score: 80, weighted_score: 12.0, comment: 'Ảnh hiện trường phòng mổ đạt yêu cầu' }
    ],
    total_score: 86.3,
    quality_factor: 1.1,
    quality_tier: 'Khá',
    note: 'Bài viết xuất sắc, tình tiết nghẹt thở và đầy tính nhân văn. Đề xuất nhận và gửi duyệt điểm.',
    scored_at: '2026-09-23 14:30'
  },
  {
    id: 'qs-pend-2',
    article_id: 'art-pend-app-2',
    editor_id: 'u-dung',
    criteria_set_version: 1,
    criteria_scores: [
      { criterion_id: 'crit-cl-1', name: 'Tính định hướng tư tưởng, tôn chỉ', weight: 30, score: 82, weighted_score: 24.6 },
      { criterion_id: 'crit-cl-2', name: 'Lập luận logic, chiều sâu phân tích', weight: 30, score: 80, weighted_score: 24.0 },
      { criterion_id: 'crit-cl-3', name: 'Dẫn chứng xác thực, tính thuyết phục cao', weight: 25, score: 76, weighted_score: 19.0 },
      { criterion_id: 'crit-cl-4', name: 'Văn phong sắc bén, khúc chiết', weight: 15, score: 78, weighted_score: 11.7 }
    ],
    total_score: 79.3,
    quality_factor: 1.0,
    quality_tier: 'Khá',
    note: 'Bài chính luận chặt chẽ, số liệu thực tiễn sinh động.',
    scored_at: '2026-09-22 16:00'
  },
  {
    id: 'qs-scorepub-1',
    article_id: 'art-score-pub-1',
    editor_id: 'u-dung',
    criteria_set_version: 1,
    criteria_scores: [
      { criterion_id: 'crit-pv-1', name: 'Kỹ năng phỏng vấn, dẫn dắt đối thoại', weight: 30, score: 85, weighted_score: 25.5 },
      { criterion_id: 'crit-pv-2', name: 'Chiều sâu câu hỏi, tính phát hiện', weight: 30, score: 80, weighted_score: 24.0 },
      { criterion_id: 'crit-pv-3', name: 'Tính trung thực, khách quan', weight: 25, score: 84, weighted_score: 21.0 },
      { criterion_id: 'crit-pv-4', name: 'Ảnh/chân dung nhân vật', weight: 15, score: 82, weighted_score: 12.3 }
    ],
    total_score: 82.8,
    quality_factor: 1.0,
    quality_tier: 'Khá',
    note: 'Phỏng vấn sâu sắc, chân thực.',
    scored_at: '2026-09-22 15:00'
  },
  {
    id: 'qs-scorepub-2',
    article_id: 'art-score-pub-2',
    editor_id: 'u-ha',
    criteria_set_version: 1,
    criteria_scores: [
      { criterion_id: 'crit-nc-1', name: 'Tính khoa học, phương pháp luận', weight: 35, score: 86, weighted_score: 30.1 },
      { criterion_id: 'crit-nc-2', name: 'Quy mô mẫu và độ tin cậy số liệu', weight: 25, score: 84, weighted_score: 21.0 },
      { criterion_id: 'crit-nc-3', name: 'Giá trị ứng dụng và khuyến nghị', weight: 25, score: 88, weighted_score: 22.0 },
      { criterion_id: 'crit-nc-4', name: 'Trình bày biểu đồ, chú thích', weight: 15, score: 80, weighted_score: 12.0 }
    ],
    total_score: 85.1,
    quality_factor: 1.0,
    quality_tier: 'Khá',
    note: 'Báo cáo nghiên cứu công phu, dữ liệu thực tế đáng tin cậy.',
    scored_at: '2026-09-23 09:30'
  },
  // Quality scores cho các bài thuộc sự kiện Hạn mặn miền Tây (để hiển thị điểm hiệu lực & miễn bão hòa)
  { id: 'qs-ev-01', article_id: 'art-ev-hh-01', editor_id: 'u-cuong-btv', total_score: 78, quality_factor: 1.0, quality_tier: 'Khá', note: 'Chấm đạt', scored_at: '2026-06-03 14:00' },
  { id: 'qs-ev-02', article_id: 'art-ev-hh-02', editor_id: 'u-dung', total_score: 92, quality_factor: 1.2, quality_tier: 'Xuất sắc', note: 'Bài xuất sắc (Miễn bão hòa)', scored_at: '2026-06-04 15:00' },
  { id: 'qs-ev-03', article_id: 'art-ev-hh-03', editor_id: 'u-ha', total_score: 74, quality_factor: 0.9, quality_tier: 'Khá', note: 'Đạt yêu cầu', scored_at: '2026-06-05 16:00' },
  { id: 'qs-ev-04', article_id: 'art-ev-hh-04', editor_id: 'u-cuong-btv', total_score: 88, quality_factor: 1.1, quality_tier: 'Khá', note: 'Ảnh tốt', scored_at: '2026-06-06 17:00' },
  { id: 'qs-ev-05', article_id: 'art-ev-hh-05', editor_id: 'u-dung', total_score: 85, quality_factor: 1.0, quality_tier: 'Khá', note: 'Phỏng vấn sâu', scored_at: '2026-06-07 10:00' },
  { id: 'qs-ev-06', article_id: 'art-ev-hh-06', editor_id: 'u-ha', total_score: 80, quality_factor: 1.0, quality_tier: 'Khá', note: 'Thông tin nhanh', scored_at: '2026-06-08 11:00' },
  { id: 'qs-ev-07', article_id: 'art-ev-hh-07', editor_id: 'u-cuong-btv', total_score: 82, quality_factor: 1.0, quality_tier: 'Khá', note: 'Lập luận sắc bén', scored_at: '2026-06-09 14:00' },
  { id: 'qs-ev-08', article_id: 'art-ev-hh-08', editor_id: 'u-dung', total_score: 76, quality_factor: 0.9, quality_tier: 'Khá', note: 'Đạt yêu cầu', scored_at: '2026-06-10 15:00' },
  { id: 'qs-ev-09', article_id: 'art-ev-hh-09', editor_id: 'u-cuong-btv', total_score: 89, quality_factor: 1.1, quality_tier: 'Khá', note: 'Phóng sự chân thực', scored_at: '2026-06-11 16:00' },
  { id: 'qs-ev-10', article_id: 'art-ev-hh-10', editor_id: 'u-ha', total_score: 84, quality_factor: 1.0, quality_tier: 'Khá', note: 'Tính thời sự cao', scored_at: '2026-06-12 17:00' },
  { id: 'qs-ev-11', article_id: 'art-ev-hh-11', editor_id: 'u-dung', total_score: 75, quality_factor: 0.9, quality_tier: 'Khá', note: 'Phản ánh thời sự', scored_at: '2026-06-13 10:00' },
  { id: 'qs-ev-12', article_id: 'art-ev-hh-12', editor_id: 'u-cuong-btv', total_score: 86, quality_factor: 1.0, quality_tier: 'Khá', note: 'Góc nhìn hay', scored_at: '2026-06-15 11:00' },
  { id: 'qs-ev-13', article_id: 'art-ev-hh-13', editor_id: 'u-ha', total_score: 81, quality_factor: 1.0, quality_tier: 'Khá', note: 'Tin thời sự', scored_at: '2026-06-17 14:00' },
  { id: 'qs-ev-15', article_id: 'art-ev-hh-15', editor_id: 'u-dung', total_score: 79, quality_factor: 1.0, quality_tier: 'Khá', note: 'Đạt yêu cầu', scored_at: '2026-06-20 15:00' },
  { id: 'qs-ev-16', article_id: 'art-ev-hh-16', editor_id: 'u-ha', total_score: 83, quality_factor: 1.0, quality_tier: 'Khá', note: 'Đạt yêu cầu', scored_at: '2026-06-21 16:00' },
  { id: 'qs-ev-17', article_id: 'art-ev-hh-17', editor_id: 'u-cuong-btv', total_score: 85, quality_factor: 1.0, quality_tier: 'Khá', note: 'Tin hữu ích', scored_at: '2026-06-22 17:00' },
  { id: 'qs-ev-18', article_id: 'art-ev-hh-18', editor_id: 'u-dung', total_score: 82, quality_factor: 1.0, quality_tier: 'Khá', note: 'Phóng sự ảnh tốt', scored_at: '2026-06-23 10:00' },
  { id: 'qs-ev-19', article_id: 'art-ev-hh-19', editor_id: 'u-ha', total_score: 77, quality_factor: 0.9, quality_tier: 'Khá', note: 'Đạt yêu cầu', scored_at: '2026-06-24 11:00' },
  { id: 'qs-ev-20', article_id: 'art-ev-hh-20', editor_id: 'u-cuong-btv', total_score: 80, quality_factor: 1.0, quality_tier: 'Khá', note: 'Cảnh báo thời sự', scored_at: '2026-06-25 14:00' },
  { id: 'qs-ev-21', article_id: 'art-ev-hh-21', editor_id: 'u-dung', total_score: 76, quality_factor: 0.9, quality_tier: 'Khá', note: 'Khá (Bão hòa 60%)', scored_at: '2026-06-26 15:00' },
  { id: 'qs-ev-22', article_id: 'art-ev-hh-22', editor_id: 'u-cuong-btv', total_score: 93, quality_factor: 1.2, quality_tier: 'Xuất sắc', note: 'Bài xuất sắc (Điểm ≥ 90 -> Miễn bão hòa)', scored_at: '2026-06-27 16:00' },
  { id: 'qs-ev-23', article_id: 'art-ev-hh-23', editor_id: 'u-ha', total_score: 84, quality_factor: 1.0, quality_tier: 'Khá', note: 'Khá (Bão hòa 60%)', scored_at: '2026-06-28 17:00' },
  // Điểm hiệu lực các bài đã đăng tháng 7–9 (thang 100)
  { id: 'qs-pub-1', article_id: 'art-pub-1', editor_id: 'u-cuong-btv', criteria_set_version: 1, total_score: 86, quality_factor: 0.8, quality_tier: 'Khá', note: 'Lập luận chặt chẽ, số liệu cập nhật', scored_at: '2026-06-29 15:00' },
  { id: 'qs-pub-2', article_id: 'art-pub-2', editor_id: 'u-dung', criteria_set_version: 2, total_score: 82, quality_factor: 0.8, quality_tier: 'Khá', note: 'Câu chuyện cảm động, ảnh tốt', scored_at: '2026-07-10 10:00' },
  { id: 'qs-pub-3', article_id: 'art-pub-3', editor_id: 'u-ha', criteria_set_version: 1, total_score: 74, quality_factor: 0.8, quality_tier: 'Khá', note: 'Văn phong tốt, cần thêm tư liệu', scored_at: '2026-07-30 16:00' },
  { id: 'qs-pub-4', article_id: 'art-pub-4', editor_id: 'u-cuong-btv', criteria_set_version: 1, total_score: 72, quality_factor: 0.8, quality_tier: 'Khá', note: 'Tin nhanh, đủ nguồn', scored_at: '2026-08-16 09:00' },
  { id: 'qs-pub-5', article_id: 'art-pub-5', editor_id: 'u-dung', criteria_set_version: 1, total_score: 91, quality_factor: 1.0, quality_tier: 'Xuất sắc', note: 'MegaStory đầu tư công phu', scored_at: '2026-08-26 14:00' }
];

export const INITIAL_SCORING_ATTEMPTS: ScoringAttempt[] = [
  // Bài mẫu trung tâm "Nước sạch ở xóm chài ven sông":
  // BTV Cường lần 1 (21/06): 70 / 40 / 70 / 80 / 70 = 64 điểm, tiêu chí 2 nhận xét "Thiếu nguồn đối chứng" -> Trả về
  {
    id: 'sa-ns-1',
    article_id: 'art-nuocsach',
    attempt_no: 1,
    scorer_id: 'u-cuong-btv',
    scorer_type: 'PRIMARY',
    scored_at: '2026-06-21 15:30',
    decision: 'RETURN',
    criteria_set_version: 2,
    criteria_scores: [
      { criterion_id: 'crit-ps2-1', name: 'Tính thời sự, giá trị thông tin', weight: 20, score: 70, weighted_score: 14.0, comment: 'Đề tài hay, phản ánh kịp thời cuộc sống bà con' },
      { criterion_id: 'crit-ps2-2', name: 'Độ chính xác, có nguồn đối chứng', weight: 25, score: 40, weighted_score: 10.0, comment: 'Thiếu nguồn đối chứng kiểm nghiệm nồng độ mặn' },
      { criterion_id: 'crit-ps2-3', name: 'Chiều sâu, góc nhìn riêng', weight: 25, score: 70, weighted_score: 17.5, comment: 'Cần phân tích thêm giải pháp lâu dài' },
      { criterion_id: 'crit-ps2-4', name: 'Bố cục, ngôn ngữ', weight: 15, score: 80, weighted_score: 12.0, comment: 'Văn phong truyền cảm' },
      { criterion_id: 'crit-ps2-5', name: 'Ảnh/minh họa hỗ trợ nội dung', weight: 15, score: 70, weighted_score: 10.5, comment: 'Ảnh đạt nhưng cần thêm ảnh hiện trường sà lan cấp nước' }
    ],
    total_score: 64,
    note: 'Thiếu nguồn đối chứng kiểm nghiệm chất lượng nước, yêu cầu phóng viên bổ sung.',
    is_effective: false
  },
  // BTV Cường lần 2 (24/06): 80 / 80 / 75 / 80 / 75 = 78 điểm -> Nhận.
  // Duyệt ngày 25/06/2026, công bố 78 điểm, hạn khiếu nại đến 02/07/2026.
  {
    id: 'sa-ns-2',
    article_id: 'art-nuocsach',
    attempt_no: 2,
    scorer_id: 'u-cuong-btv',
    scorer_type: 'PRIMARY',
    scored_at: '2026-06-24 16:00',
    decision: 'ACCEPT',
    criteria_set_version: 2,
    criteria_scores: [
      { criterion_id: 'crit-ps2-1', name: 'Tính thời sự, giá trị thông tin', weight: 20, score: 80, weighted_score: 16.0, comment: 'Tính thời sự rất cao' },
      { criterion_id: 'crit-ps2-2', name: 'Độ chính xác, có nguồn đối chứng', weight: 25, score: 80, weighted_score: 20.0, comment: 'Đã bổ sung đối chứng và số liệu đầy đủ từ Trạm cấp nước' },
      { criterion_id: 'crit-ps2-3', name: 'Chiều sâu, góc nhìn riêng', weight: 25, score: 75, weighted_score: 18.75, comment: 'Phản ánh nhân văn, phân tích thấu đáo' },
      { criterion_id: 'crit-ps2-4', name: 'Bố cục, ngôn ngữ', weight: 15, score: 80, weighted_score: 12.0, comment: 'Kết cấu bài mạch lạc, hành văn cuốn hút' },
      { criterion_id: 'crit-ps2-5', name: 'Ảnh/minh họa hỗ trợ nội dung', weight: 15, score: 75, weighted_score: 11.25, comment: 'Bộ ảnh tác nghiệp chân thực' }
    ],
    total_score: 78,
    note: 'Bài viết phản ánh chân thực, góc nhìn nhân văn sâu sắc. Đã bổ sung nguồn đối chứng hoàn chỉnh.',
    is_effective: false,
    score_published_at: '2026-06-25 15:00',
    complaint_deadline: '2026-07-02 23:59'
  },
  // BTV Dũng lần 3 (chấm lại mù do khiếu nại 03/07): 90 / 90 / 95 / 90 / 95 = 92 điểm >= 78 -> Áp dụng 92 điểm hiệu lực
  {
    id: 'sa-ns-3',
    article_id: 'art-nuocsach',
    attempt_no: 3,
    scorer_id: 'u-dung',
    scorer_type: 'APPEAL',
    scored_at: '2026-07-03 10:30',
    decision: 'ACCEPT',
    criteria_set_version: 2,
    criteria_scores: [
      { criterion_id: 'crit-ps2-1', name: 'Tính thời sự, giá trị thông tin', weight: 20, score: 90, weighted_score: 18.0, comment: 'Tính thời sự xuất sắc' },
      { criterion_id: 'crit-ps2-2', name: 'Độ chính xác, có nguồn đối chứng', weight: 25, score: 90, weighted_score: 22.5, comment: 'Dữ liệu đối chứng đa chiều' },
      { criterion_id: 'crit-ps2-3', name: 'Chiều sâu, góc nhìn riêng', weight: 25, score: 95, weighted_score: 23.75, comment: 'Phân tích giải pháp công trình và thích ứng hạn mặn rất sắc sảo, xứng đáng mức xuất sắc' },
      { criterion_id: 'crit-ps2-4', name: 'Bố cục, ngôn ngữ', weight: 15, score: 90, weighted_score: 13.5, comment: 'Bút pháp phóng sự mẫu mực' },
      { criterion_id: 'crit-ps2-5', name: 'Ảnh/minh họa hỗ trợ nội dung', weight: 15, score: 95, weighted_score: 14.25, comment: 'Ảnh báo chí chất lượng cao' }
    ],
    total_score: 92,
    note: 'BTV Hoàng Văn Dũng chấm lại theo khiếu nại chất lượng: Đánh giá cao chiều sâu phân tích và góc nhìn phản biện chính sách.',
    is_effective: true
  },

  // Bài chờ duyệt điểm: art-pend-app-1
  {
    id: 'sa-pend-1',
    article_id: 'art-pend-app-1',
    attempt_no: 1,
    scorer_id: 'u-cuong-btv',
    scorer_type: 'PRIMARY',
    scored_at: '2026-09-23 14:30',
    decision: 'ACCEPT',
    criteria_set_version: 2,
    criteria_scores: [
      { criterion_id: 'crit-ps2-1', name: 'Tính thời sự, giá trị thông tin', weight: 20, score: 92, weighted_score: 18.4, comment: 'Câu chuyện xúc động, tính lan tỏa cao' },
      { criterion_id: 'crit-ps2-2', name: 'Độ chính xác, có nguồn đối chứng', weight: 25, score: 88, weighted_score: 22.0, comment: 'Hồ sơ bệnh án và thông tin kíp mổ rõ ràng' },
      { criterion_id: 'crit-ps2-3', name: 'Chiều sâu, góc nhìn riêng', weight: 25, score: 84, weighted_score: 21.0, comment: 'Khai thác tốt tâm lý bác sĩ và gia đình bệnh nhân' },
      { criterion_id: 'crit-ps2-4', name: 'Bố cục, ngôn ngữ', weight: 15, score: 86, weighted_score: 12.9, comment: 'Văn phong hấp dẫn, tạo được kịch tính' },
      { criterion_id: 'crit-ps2-5', name: 'Ảnh/minh họa hỗ trợ nội dung', weight: 15, score: 80, weighted_score: 12.0, comment: 'Ảnh hiện trường phòng mổ đạt yêu cầu' }
    ],
    total_score: 86.3,
    note: 'Bài viết xuất sắc, tình tiết nghẹt thở và đầy tính nhân văn. Đề xuất nhận và gửi duyệt điểm.',
    is_effective: true
  },

  // Bài chờ duyệt điểm: art-pend-app-2
  {
    id: 'sa-pend-2',
    article_id: 'art-pend-app-2',
    attempt_no: 1,
    scorer_id: 'u-dung',
    scorer_type: 'PRIMARY',
    scored_at: '2026-09-22 16:00',
    decision: 'ACCEPT',
    criteria_set_version: 1,
    criteria_scores: [
      { criterion_id: 'crit-cl-1', name: 'Tính định hướng tư tưởng, tôn chỉ', weight: 30, score: 82, weighted_score: 24.6 },
      { criterion_id: 'crit-cl-2', name: 'Lập luận logic, chiều sâu phân tích', weight: 30, score: 80, weighted_score: 24.0 },
      { criterion_id: 'crit-cl-3', name: 'Dẫn chứng xác thực, tính thuyết phục cao', weight: 25, score: 76, weighted_score: 19.0 },
      { criterion_id: 'crit-cl-4', name: 'Văn phong sắc bén, khúc chiết', weight: 15, score: 78, weighted_score: 11.7 }
    ],
    total_score: 79.3,
    note: 'Bài chính luận chặt chẽ, số liệu thực tiễn sinh động.',
    is_effective: true
  },

  // Bài đã công bố điểm: art-score-pub-1
  {
    id: 'sa-scorepub-1',
    article_id: 'art-score-pub-1',
    attempt_no: 1,
    scorer_id: 'u-dung',
    scorer_type: 'PRIMARY',
    scored_at: '2026-09-22 15:00',
    decision: 'ACCEPT',
    criteria_set_version: 1,
    criteria_scores: [
      { criterion_id: 'crit-pv-1', name: 'Kỹ năng phỏng vấn, dẫn dắt đối thoại', weight: 30, score: 85, weighted_score: 25.5 },
      { criterion_id: 'crit-pv-2', name: 'Chiều sâu câu hỏi, tính phát hiện', weight: 30, score: 80, weighted_score: 24.0 },
      { criterion_id: 'crit-pv-3', name: 'Tính trung thực, khách quan', weight: 25, score: 84, weighted_score: 21.0 },
      { criterion_id: 'crit-pv-4', name: 'Ảnh/chân dung nhân vật', weight: 15, score: 82, weighted_score: 12.3 }
    ],
    total_score: 82.8,
    note: 'Phỏng vấn sâu sắc, chân thực.',
    is_effective: true,
    score_published_at: '2026-09-22 17:00',
    complaint_deadline: '2026-09-29 23:59'
  },

  // Bài đã công bố điểm: art-score-pub-2
  {
    id: 'sa-scorepub-2',
    article_id: 'art-score-pub-2',
    attempt_no: 1,
    scorer_id: 'u-ha',
    scorer_type: 'PRIMARY',
    scored_at: '2026-09-23 09:30',
    decision: 'ACCEPT',
    criteria_set_version: 1,
    criteria_scores: [
      { criterion_id: 'crit-nc-1', name: 'Tính khoa học, phương pháp luận', weight: 35, score: 86, weighted_score: 30.1 },
      { criterion_id: 'crit-nc-2', name: 'Quy mô mẫu và độ tin cậy số liệu', weight: 25, score: 84, weighted_score: 21.0 },
      { criterion_id: 'crit-nc-3', name: 'Giá trị ứng dụng và khuyến nghị', weight: 25, score: 88, weighted_score: 22.0 },
      { criterion_id: 'crit-nc-4', name: 'Trình bày biểu đồ, chú thích', weight: 15, score: 80, weighted_score: 12.0 }
    ],
    total_score: 85.1,
    note: 'Báo cáo nghiên cứu công phu, dữ liệu thực tế đáng tin cậy.',
    is_effective: true,
    score_published_at: '2026-09-23 10:00',
    complaint_deadline: '2026-09-30 23:59'
  },

  // Bài Trưởng ban yêu cầu chấm lại: art-assigned-lead-rescore
  {
    id: 'sa-leadrescore-old',
    article_id: 'art-assigned-lead-rescore',
    attempt_no: 1,
    scorer_id: 'u-cuong-btv',
    scorer_type: 'PRIMARY',
    scored_at: '2026-09-25 10:00',
    decision: 'ACCEPT',
    criteria_set_version: 2,
    criteria_scores: [
      { criterion_id: 'crit-ps2-1', name: 'Tính thời sự, giá trị thông tin', weight: 20, score: 75, weighted_score: 15.0 },
      { criterion_id: 'crit-ps2-2', name: 'Độ chính xác, có nguồn đối chứng', weight: 25, score: 70, weighted_score: 17.5 },
      { criterion_id: 'crit-ps2-3', name: 'Chiều sâu, góc nhìn riêng', weight: 25, score: 70, weighted_score: 17.5 },
      { criterion_id: 'crit-ps2-4', name: 'Bố cục, ngôn ngữ', weight: 15, score: 75, weighted_score: 11.25 },
      { criterion_id: 'crit-ps2-5', name: 'Ảnh/minh họa hỗ trợ nội dung', weight: 15, score: 60, weighted_score: 9.0, comment: 'Ảnh còn thiếu và đơn điệu' }
    ],
    total_score: 70.3,
    note: 'Chấm lần 1: Đạt mức Khá.',
    is_effective: false
  }
];

/**
 * ============================================================================
 * LUỒNG 04 – DỮ LIỆU NHUẬN BÚT (sinh tự động bằng CHÍNH hàm tính dùng chung
 * src/utils/royalty.ts để mọi con số trên các màn khớp nhau tuyệt đối)
 *
 * Kỳ 06/2026 (PAID)  : "Nước sạch ở xóm chài ven sông" lần 1 (78 điểm)
 * Kỳ 07/2026 (PAID)  : art-pub-1, art-pub-2 + 2 DÒNG ĐIỀU CHỈNH sau khiếu nại bài "Nước sạch" (92 điểm)
 * Kỳ 08/2026 (CLOSED): art-pub-4, art-ev-hh-02 → chờ Kế toán kiểm tra / trả về / khóa
 * Kỳ 09/2026 (OPEN)  : art-pub-5, art-ev-hh-03, art-ev-hh-04, art-ev-hh-09, art-ev-hh-10
 * Cố ý CHƯA chấm để demo cảnh báo hạn chi: art-ev-hh-01 (đăng 20/07 → quá 60 ngày),
 * art-pub-3 (đăng 05/08 → đã qua ngày 45).
 * ============================================================================
 */

const PERIOD_BASE: RoyaltyPeriod[] = [
  {
    id: 'per-2026-06', code: 'NB-2026-06', period_code: 'NB-2026-06', name: 'Kỳ nhuận bút tháng 06/2026',
    month: 6, year: 2026, status: 'PAID', total_amount: 0,
    closed_by: 'u-toan', closed_at: '2026-06-30 17:00',
    locked_by: 'u-ngoc', locked_at: '2026-06-30 18:00',
    paid_by: 'u-ngoc', paid_at: '2026-07-05 10:00'
  },
  {
    id: 'per-2026-07', code: 'NB-2026-07', period_code: 'NB-2026-07', name: 'Kỳ nhuận bút tháng 07/2026',
    month: 7, year: 2026, status: 'PAID', total_amount: 0,
    closed_by: 'u-toan', closed_at: '2026-07-31 16:30',
    locked_by: 'u-ngoc', locked_at: '2026-08-03 14:00',
    paid_by: 'u-ngoc', paid_at: '2026-08-07 15:00'
  },
  {
    id: 'per-2026-08', code: 'NB-2026-08', period_code: 'NB-2026-08', name: 'Kỳ nhuận bút tháng 08/2026',
    month: 8, year: 2026, status: 'CLOSED', total_amount: 0,
    closed_by: 'u-toan', closed_at: '2026-09-02 11:00'
  },
  {
    id: 'per-2026-09', code: 'NB-2026-09', period_code: 'NB-2026-09', name: 'Kỳ nhuận bút tháng 09/2026',
    month: 9, year: 2026, status: 'OPEN', total_amount: 0
  }
];

/** Kế hoạch chấm nhuận bút của Thư ký: bài nào vào kỳ nào */
const ROYALTY_GRADING_PLAN: { articleId: string; periodId: string; score?: number }[] = [
  { articleId: 'art-pub-1', periodId: 'per-2026-07' },
  { articleId: 'art-pub-2', periodId: 'per-2026-07' },
  { articleId: 'art-pub-4', periodId: 'per-2026-08' },
  { articleId: 'art-ev-hh-02', periodId: 'per-2026-08' },
  { articleId: 'art-pub-5', periodId: 'per-2026-09' },
  { articleId: 'art-ev-hh-03', periodId: 'per-2026-09' },
  { articleId: 'art-ev-hh-04', periodId: 'per-2026-09' },
  { articleId: 'art-ev-hh-09', periodId: 'per-2026-09' },
  { articleId: 'art-ev-hh-10', periodId: 'per-2026-09' }
];

const seedAuthorsOf = (articleId: string) => {
  const list = INITIAL_ARTICLE_AUTHORS.filter(a => a.article_id === articleId);
  if (list.length > 0) {
    return list.map(a => ({ userId: a.user_id, isMain: a.is_main, sharePercent: a.share_percent }));
  }
  const art = INITIAL_ARTICLES.find(a => a.id === articleId);
  return art ? [{ userId: art.author_id, isMain: true, sharePercent: 100 }] : [];
};

const seedScoreOf = (articleId: string): number => {
  const qs = INITIAL_QUALITY_SCORES.find(q => q.article_id === articleId);
  return qs ? qs.total_score : 75;
};

const seedLines: RoyaltyLine[] = [
  // --- KỲ 06/2026: bài mẫu "Nước sạch ở xóm chài ven sông" lần 1 ---
  // 78 điểm → 0,8; 15 × 0,8 = 12; bão hòa bài thứ 14: 12 × 80% = 9,6; Sáng tác 100%; 9,6 × 234.000 = 2.246.400 đ
  {
    id: 'rl-ns-art-an', article_id: 'art-nuocsach', period_id: 'per-2026-06', recipient_id: 'u-an',
    line_type: 'ARTICLE', factor: 9.6, unit_price: 234000, amount: 1348400,
    note: 'Tác giả chính 60%: nhận phần còn lại 2.246.400 − 898.000 = 1.348.400 đ'
  },
  {
    id: 'rl-ns-art-binh', article_id: 'art-nuocsach', period_id: 'per-2026-06', recipient_id: 'u-binh',
    line_type: 'ARTICLE', factor: 9.6, unit_price: 234000, amount: 898000,
    note: 'Đồng tác giả 40%: 898.560 đ làm tròn xuống 898.000 đ'
  },
  {
    id: 'rl-ns-med-binh', article_id: 'art-nuocsach', period_id: 'per-2026-06', recipient_id: 'u-binh',
    line_type: 'MEDIA', factor: 3, unit_price: 234000, amount: 702000,
    note: 'Ảnh 1 (ảnh tự chụp, mới): 3 × 234.000 = 702.000 đ. Ảnh 2 tái sử dụng, Ảnh 3 nguồn ngoài: 0 đ'
  },
  // --- KỲ 07/2026: DÒNG ĐIỀU CHỈNH sau khiếu nại (78 → 92, bậc 1,0, miễn bão hòa) ---
  // 15 × 234.000 = 3.510.000 đ (đơn giá theo NGÀY ĐĂNG 29/06, không dùng 253.000 đ) → Bình 1.404.000 đ, An 2.106.000 đ
  {
    id: 'rl-adj-ns-an', article_id: 'art-nuocsach', period_id: 'per-2026-07', recipient_id: 'u-an',
    line_type: 'ADJUSTMENT', is_adjustment: true, factor: 15, unit_price: 234000,
    previous_amount: 1348400, recalculated_amount: 2106000, amount: 757600,
    original_line_id: 'rl-ns-art-an', original_period_id: 'per-2026-06', original_period_name: 'Kỳ 06/2026',
    note: 'Điều chỉnh sau khiếu nại (78 → 92, miễn bão hòa): đã chi 1.348.400 đ, tính lại 2.106.000 đ'
  },
  {
    id: 'rl-adj-ns-binh', article_id: 'art-nuocsach', period_id: 'per-2026-07', recipient_id: 'u-binh',
    line_type: 'ADJUSTMENT', is_adjustment: true, factor: 15, unit_price: 234000,
    previous_amount: 898000, recalculated_amount: 1404000, amount: 506000,
    original_line_id: 'rl-ns-art-binh', original_period_id: 'per-2026-06', original_period_name: 'Kỳ 06/2026',
    note: 'Điều chỉnh phần bài sau khiếu nại (78 → 92, miễn bão hòa): đã chi 898.000 đ, tính lại 1.404.000 đ'
  }
];

const seedItems: RoyaltyItem[] = [
  {
    id: 'ri-ns', article_id: 'art-nuocsach', period_id: 'per-2026-06',
    base_price: 234000, base_unit_price: 234000, genre_factor: 15, quality_factor: 9.6,
    media_bonus: 702000, photo_count: 3, video_count: 0,
    amount: 2948400, total_royalty: 2948400, status: 'DA_CHI',
    note: 'Kỳ 06/2026: An 1.348.400 đ, Bình 898.000 đ + ảnh 702.000 đ. Sau khiếu nại điều chỉnh +1.263.600 đ vào kỳ 07/2026'
  }
];

ROYALTY_GRADING_PLAN.forEach(plan => {
  const art = INITIAL_ARTICLES.find(a => a.id === plan.articleId);
  if (!art) return;
  const genre = INITIAL_GENRES.find(g => g.id === art.category_id);
  const unitPrice = getUnitPriceAtDate(INITIAL_ROYALTY_RATES, art.published_at);
  const period = PERIOD_BASE.find(p => p.id === plan.periodId)!;
  const res = calculateRoyalty({
    effectiveScore: plan.score ?? seedScoreOf(art.id),
    baseFactor: genre?.base_factor ?? 5,
    maxFactor: genre?.max_factor ?? 10,
    saturationRate: art.saturation_rate ?? 100,
    nature: art.declared_nature,
    publishedDate: art.published_at,
    unitPrice,
    authors: seedAuthorsOf(art.id),
    attachments: INITIAL_ATTACHMENTS.filter(a => a.article_id === art.id)
  });
  res.authorShares.forEach(sh => {
    seedLines.push({
      id: `rl-${art.id}-${sh.userId}`,
      article_id: art.id,
      period_id: plan.periodId,
      recipient_id: sh.userId,
      line_type: 'ARTICLE',
      factor: res.finalFactor,
      unit_price: unitPrice,
      amount: sh.roundedAmount,
      note: `${sh.isMain ? 'Tác giả chính' : 'Đồng tác giả'} ${sh.sharePercent}% · hệ số cuối ${res.finalFactor} × ${unitPrice.toLocaleString('vi-VN')} đ`
    });
  });
  res.mediaItems.filter(m => m.amount > 0).forEach(m => {
    seedLines.push({
      id: `rl-${art.id}-media-${m.id}`,
      article_id: art.id,
      period_id: plan.periodId,
      recipient_id: m.authorId,
      line_type: 'MEDIA',
      factor: m.factor,
      unit_price: unitPrice,
      amount: m.amount,
      note: `${m.mediaType === 'VIDEO' ? 'Video' : 'Ảnh'} ${m.caption || m.originalName || ''}: ${m.factor} × ${unitPrice.toLocaleString('vi-VN')} đ`
    });
  });
  const paid = period.status === 'PAID';
  seedItems.push({
    id: `ri-${art.id}`,
    article_id: art.id,
    period_id: plan.periodId,
    base_price: unitPrice,
    base_unit_price: unitPrice,
    genre_factor: genre?.base_factor ?? 5,
    quality_factor: res.finalFactor,
    media_bonus: res.totalMediaAmount,
    photo_count: res.mediaItems.filter(m => m.mediaType === 'IMAGE').length,
    video_count: res.mediaItems.filter(m => m.mediaType === 'VIDEO').length,
    amount: res.totalPayout,
    total_royalty: res.totalPayout,
    status: paid ? 'DA_CHI' : period.status === 'OPEN' ? 'CHO_CHOT' : 'DA_DUYET',
    note: `Điểm hiệu lực ${res.effectiveScore} · hệ số cuối ${res.finalFactor} · đơn giá ${unitPrice.toLocaleString('vi-VN')} đ`
  });
});

export const INITIAL_ROYALTY_LINES: RoyaltyLine[] = seedLines;
export const INITIAL_ROYALTY_ITEMS: RoyaltyItem[] = seedItems;

const BANK_INFO: Record<string, { bank_name: string; account_number: string }> = {
  'u-an': { bank_name: 'Vietcombank - CN Ba Đình', account_number: '0011002345678' },
  'u-binh': { bank_name: 'BIDV - CN Hà Nội', account_number: '1201000987654' },
  'u-nam': { bank_name: 'Techcombank - CN Hoàn Kiếm', account_number: '1903456789012' },
  'u-tuan': { bank_name: 'VietinBank - CN Đống Đa', account_number: '1080002233445' }
};

const seedVouchers: PaymentVoucher[] = [];
PERIOD_BASE.filter(p => p.status === 'PAID' || p.status === 'LOCKED').forEach(p => {
  const lines = seedLines.filter(l => l.period_id === p.id);
  const recipients = Array.from(new Set(lines.map(l => l.recipient_id)));
  recipients.forEach((uid, idx) => {
    const mine = lines.filter(l => l.recipient_id === uid);
    const articleAmount = mine.filter(l => l.line_type === 'ARTICLE').reduce((s, l) => s + l.amount, 0);
    const mediaAmount = mine.filter(l => l.line_type === 'MEDIA').reduce((s, l) => s + l.amount, 0);
    const adjustmentAmount = mine.filter(l => l.line_type === 'ADJUSTMENT').reduce((s, l) => s + l.amount, 0);
    const total = articleAmount + mediaAmount + adjustmentAmount;
    const pay = Math.max(0, total);
    const user = INITIAL_USERS.find(u => u.id === uid);
    const bank = BANK_INFO[uid] || { bank_name: 'Vietcombank - CN Ba Đình', account_number: '0011000000000' };
    seedVouchers.push({
      id: `pv-${p.id}-${uid}`,
      voucher_no: `PC-${p.year}${String(p.month).padStart(2, '0')}-${String(idx + 1).padStart(3, '0')}`,
      period_id: p.id,
      user_id: uid,
      recipient_id: uid,
      amount: pay,
      total_amount: pay,
      article_amount: articleAmount,
      media_amount: mediaAmount,
      adjustment_amount: adjustmentAmount,
      carried_forward: total < 0 ? Math.abs(total) : 0,
      tax_deduction: 0,
      net_amount: pay,
      payment_method: 'CHUYEN_KHOAN',
      bank_account_info: {
        bank_name: bank.bank_name,
        account_number: bank.account_number,
        account_name: (user?.full_name || '').toUpperCase()
      },
      note: `Chi trả nhuận bút kỳ ${String(p.month).padStart(2, '0')}/${p.year} – ${user?.full_name || ''}`,
      is_paid: p.status === 'PAID',
      paid_at: p.status === 'PAID' ? p.paid_at : undefined,
      status: p.status === 'PAID' ? 'DA_CHI' : 'CHUA_CHI',
      created_at: p.locked_at,
      deadline_warning: 'NORMAL'
    });
  });
});

export const INITIAL_PAYMENT_VOUCHERS: PaymentVoucher[] = seedVouchers;

export const INITIAL_ROYALTY_PERIODS: RoyaltyPeriod[] = PERIOD_BASE.map(p => {
  const lines = seedLines.filter(l => l.period_id === p.id);
  const graded = new Set(lines.filter(l => !l.is_adjustment).map(l => l.article_id));
  return {
    ...p,
    total_amount: lines.reduce((s, l) => s + l.amount, 0),
    total_articles: graded.size,
    graded_articles: graded.size
  };
});

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-1',
    user_id: 'u-binh',
    message: 'Phóng viên Nguyễn Văn An đã thêm bạn làm đồng tác giả (30%) bài viết "Hồi sinh những cánh rừng ngập mặn Cần Giờ". Vui lòng xác nhận trong vòng 3 ngày.',
    link: '/reporter/articles',
    is_read: false,
    created_at: '2026-09-25 09:00'
  },
  {
    id: 'notif-2',
    user_id: 'u-an',
    message: 'Đồng tác giả Trần Thị Bình đã xác nhận tỷ lệ đóng góp (40%) bài "Nước sạch ở xóm chài ven sông".',
    link: '/articles/art-nuocsach',
    is_read: true,
    created_at: '2026-06-19 14:15'
  },
  {
    id: 'notif-3',
    user_id: 'u-long',
    message: 'Có 3 bài viết mới được nộp đang chờ Trưởng ban phân công BTV thẩm định.',
    link: '/editor-lead/queue',
    is_read: false,
    created_at: '2026-09-26 10:00'
  },
  {
    id: 'notif-cap3-an',
    user_id: 'u-an',
    message: 'Phóng viên Trần Thị Bình đã mời bạn tham gia đồng tác giả (35%) bài viết "Cứu hộ rùa biển quý hiếm tại Côn Đảo". Vui lòng xác nhận trước 29/09/2026.',
    link: '/reporter/articles',
    is_read: false,
    created_at: '2026-09-26 10:00'
  },
  {
    id: 'notif-appeal-dung',
    user_id: 'u-dung',
    message: 'Hệ thống tự động giao bạn chấm lại mù bài viết "Bẫy tín dụng đen công nghệ cao" do phóng viên khiếu nại chất lượng.',
    link: '/editor/queue',
    is_read: false,
    created_at: '2026-09-28 09:05'
  }
];

/**
 * Luồng 03: Danh sách Khiếu nại chất lượng (Appeals)
 */
export const INITIAL_APPEALS: Appeal[] = [
  // Mẫu 1: Bài "Nước sạch...", An khiếu nại tiêu chí 3 ngày 01/07/2026; Dũng chấm 92 >= 78 -> áp dụng 92
  {
    id: 'app-ns',
    article_id: 'art-nuocsach',
    author_id: 'u-an',
    appealed_criteria_ids: ['crit-ps2-3'],
    reason: 'Bài viết có nhiều phát hiện mới về nguyên nhân mặn xâm nhập sâu và phỏng vấn trực tiếp các chuyên gia Viện Thủy lợi, đề nghị đánh giá lại chiều sâu và góc nhìn riêng của tác phẩm.',
    status: 'RESOLVED',
    original_score: 78,
    original_scorer_id: 'u-cuong-btv',
    criteria_set_version: 2,
    rescore_editor_id: 'u-dung',
    rescore_score: 92,
    rescore_attempt_id: 'sa-ns-3',
    rescore_date: '2026-07-03 10:30',
    final_effective_score: 92,
    resolution_rule: 'NEW_SCORE_APPLIED',
    resolution_note: 'Điểm chấm lại (92) ≥ điểm cũ (78). Hệ thống áp dụng điểm chấm lại 92 làm điểm hiệu lực.',
    is_external_editor: false,
    created_at: '2026-07-01 09:30',
    resolved_at: '2026-07-03 11:00'
  },

  // Mẫu 2: Nhánh BTV thứ ba: Điểm cũ 80, chấm lại 60 (lệch 20 > 5), BTV thứ ba 75 -> trung vị 75
  {
    id: 'app-demo-third',
    article_id: 'art-score-pub-1',
    author_id: 'u-nam',
    appealed_criteria_ids: ['crit-pv-1', 'crit-pv-2'],
    reason: 'Phỏng vấn nhân vật độc quyền đạt thủ khoa kép, đề tài nhận được sự quan tâm lớn của phụ huynh và học sinh cả nước.',
    status: 'RESOLVED',
    original_score: 80,
    original_scorer_id: 'u-dung',
    criteria_set_version: 1,
    rescore_editor_id: 'u-ha',
    rescore_score: 60,
    rescore_date: '2026-09-24 10:00',
    third_editor_id: 'u-quocanh',
    third_score: 75,
    third_date: '2026-09-25 15:30',
    final_effective_score: 75,
    resolution_rule: 'MEDIAN_OF_THREE',
    resolution_note: 'Điểm chấm lại (60) thấp hơn và lệch 20 điểm (> 5) so với điểm gốc (80). Hệ thống đã tự động chuyển BTV thứ ba (Bùi Quốc Anh - ngoài ban) chấm mù. Điểm hiệu lực là trung vị của 3 lần chấm [60, 75, 80] = 75 điểm.',
    is_external_editor: false,
    is_third_external_editor: true,
    created_at: '2026-09-23 11:00',
    resolved_at: '2026-09-25 16:00'
  },

  // Mẫu 3: Nhánh giữ điểm cũ: Điểm cũ 82, chấm lại 79 (lệch 3 <= 5) -> giữ 82
  {
    id: 'app-demo-tolerance',
    article_id: 'art-score-pub-2',
    author_id: 'u-an',
    appealed_criteria_ids: ['crit-nc-2'],
    reason: 'Quy mô khảo sát 1.200 mẫu đã được thẩm tra độ tin cậy từ chuyên gia xã hội học.',
    status: 'RESOLVED',
    original_score: 82,
    original_scorer_id: 'u-ha',
    criteria_set_version: 1,
    rescore_editor_id: 'u-cuong-btv',
    rescore_score: 79,
    rescore_date: '2026-09-26 14:00',
    final_effective_score: 82,
    resolution_rule: 'ORIGINAL_RETAINED_WITHIN_TOLERANCE',
    resolution_note: 'Điểm chấm lại (79) thấp hơn điểm gốc (82) nhưng độ lệch là 3 điểm (≤ 5 điểm). Theo quy chế sai số cho phép, hệ thống giữ nguyên điểm gốc 82.',
    is_external_editor: false,
    created_at: '2026-09-25 10:00',
    resolved_at: '2026-09-26 15:00'
  },

  // Khiếu nại đang chấm lại (để BTV Dũng có việc chấm mù trong hàng việc)
  {
    id: 'app-active-1',
    article_id: 'art-assigned-1',
    author_id: 'u-an',
    appealed_criteria_ids: ['crit-ps2-1', 'crit-ps2-3'],
    reason: 'Vấn đề bẫy tín dụng đen công nghệ cao có tính điều tra dấn thân sâu, thâm nhập hang ổ đối tượng, mang tính cảnh báo xã hội đặc biệt cao.',
    status: 'IN_RESCORE',
    original_score: 74,
    original_scorer_id: 'u-cuong-btv',
    criteria_set_version: 2,
    rescore_editor_id: 'u-dung',
    is_external_editor: false,
    created_at: '2026-09-28 09:00'
  }
];

/**
 * Luồng 03 [Iter 3]: Các đợt chấm chéo (Cross-Review Batches)
 */
export const INITIAL_CROSS_REVIEW_BATCHES: CrossReviewBatch[] = [
  {
    id: 'crb-2026-q3',
    name: 'Đợt chấm chéo kiểm soát chất lượng Quý 3/2026',
    start_date: '2026-09-01',
    end_date: '2026-09-30',
    sample_size: 15,
    participating_editor_ids: ['u-cuong-btv', 'u-dung', 'u-ha', 'u-quocanh'],
    status: 'IN_PROGRESS',
    created_at: '2026-09-01 08:00',
    created_by: 'u-long',
    note: 'Đợt chấm chéo lấy mẫu ngẫu nhiên 15 bài đã xuất bản để đo độ lệch chuẩn giữa các biên tập viên.'
  }
];

export const INITIAL_CROSS_REVIEW_ASSIGNMENTS: CrossReviewAssignment[] = [
  {
    id: 'cra-1',
    batch_id: 'crb-2026-q3',
    article_id: 'art-pub-1',
    original_scorer_id: 'u-cuong-btv',
    original_score: 85,
    reviewer_id: 'u-dung',
    reviewed_score: 82,
    deviation: -3,
    status: 'COMPLETED',
    completed_at: '2026-09-10 14:00',
    note: 'Chấm chéo kiểm chuẩn'
  },
  {
    id: 'cra-2',
    batch_id: 'crb-2026-q3',
    article_id: 'art-pub-2',
    original_scorer_id: 'u-ha',
    original_score: 72,
    reviewer_id: 'u-cuong-btv',
    reviewed_score: 80,
    deviation: +8,
    status: 'COMPLETED',
    completed_at: '2026-09-12 11:30',
    note: 'BTV Hà chấm quá khắt khe so với BTV Cường'
  },
  {
    id: 'cra-3',
    batch_id: 'crb-2026-q3',
    article_id: 'art-demo-cairang',
    original_scorer_id: 'u-dung',
    original_score: 78,
    reviewer_id: 'u-quocanh',
    reviewed_score: 84,
    deviation: +6,
    status: 'COMPLETED',
    completed_at: '2026-09-15 16:00',
    note: 'Độ lệch +6 điểm'
  },
  {
    id: 'cra-4',
    batch_id: 'crb-2026-q3',
    article_id: 'art-nuocsach',
    original_scorer_id: 'u-cuong-btv',
    original_score: 78,
    reviewer_id: 'u-ha',
    reviewed_score: 71,
    deviation: -7,
    status: 'COMPLETED',
    completed_at: '2026-09-18 10:00',
    note: 'Chấm chéo đo lường'
  }
];

export const INITIAL_REVIEWER_STATS: ReviewerDeviationStat[] = [
  {
    editor_id: 'u-cuong-btv',
    editor_name: 'Đỗ Mạnh Cường',
    department: 'Ban Xã hội',
    total_graded: 24,
    avg_score: 81.5,
    avg_deviation: +2.4,
    appeal_count: 3,
    appeal_rate: 12.5,
    is_high_deviation: false
  },
  {
    editor_id: 'u-dung',
    editor_name: 'Hoàng Văn Dũng',
    department: 'Ban Xã hội',
    total_graded: 28,
    avg_score: 79.8,
    avg_deviation: -1.2,
    appeal_count: 2,
    appeal_rate: 7.1,
    is_high_deviation: false
  },
  {
    editor_id: 'u-ha',
    editor_name: 'Vũ Thu Hà',
    department: 'Ban Xã hội',
    total_graded: 20,
    avg_score: 73.2,
    avg_deviation: -6.8, // Chấm chặt tay (> 5)
    appeal_count: 5,
    appeal_rate: 25.0,
    is_high_deviation: true // Cờ lệch cao
  },
  {
    editor_id: 'u-quocanh',
    editor_name: 'Bùi Quốc Anh',
    department: 'Ban Kinh tế (BTV ngoài ban)',
    total_graded: 16,
    avg_score: 85.0,
    avg_deviation: +5.8, // Chấm rộng tay (> 5)
    appeal_count: 3,
    appeal_rate: 18.7,
    is_high_deviation: true // Cờ lệch cao
  }
];

/**
 * ============================================================================
 * LUỒNG 05 – KPI & BÁO CÁO
 * - Chỉ tiêu tháng 06 → 09/2026 cho 4 phóng viên Ban Xã hội (tháng 10 chưa giao để demo "Đặt chỉ tiêu")
 * - Tháng 06, 07, 08 đã CHỐT → lưu snapshot (tính bằng chính hàm src/utils/kpi.ts)
 * - Tháng 09 đang chạy → tính trực tiếp, Trưởng ban có thể chốt khi demo
 * - Số liệu độc giả theo ngày (đã nhập đến hết 28/09/2026) – CHỈ dùng cho báo cáo
 * ============================================================================
 */
const KPI_REPORTERS = ['u-an', 'u-binh', 'u-nam', 'u-tuan'];
const KPI_TARGET_PLAN: { month: number; articles: number; quality: number; note: string }[] = [
  { month: 6, articles: 0.5, quality: 70, note: 'Tháng đầu vận hành hệ thống – chỉ tiêu thí điểm' },
  { month: 7, articles: 2, quality: 75, note: '' },
  { month: 8, articles: 1, quality: 75, note: 'Tháng nghỉ hè luân phiên' },
  { month: 9, articles: 5, quality: 80, note: 'Tăng cường đưa tin sự kiện Hạn hán miền Tây' }
];

export const INITIAL_KPI_TARGETS: KpiTarget[] = KPI_TARGET_PLAN.flatMap(plan =>
  KPI_REPORTERS.map(uid => ({
    id: `kt-2026-${String(plan.month).padStart(2, '0')}-${uid}`,
    section_id: 'sec-xahoi',
    user_id: uid,
    month: plan.month,
    year: 2026,
    target_articles: plan.articles,
    target_quality: plan.quality,
    note: plan.note,
    created_by: 'u-long',
    created_at: `2026-${String(plan.month).padStart(2, '0')}-01 08:00`
  }))
);

const KPI_SEED_SOURCE: KpiDataSource = {
  articles: INITIAL_ARTICLES,
  articleAuthors: INITIAL_ARTICLE_AUTHORS,
  appeals: INITIAL_APPEALS,
  scoringAttempts: INITIAL_SCORING_ATTEMPTS,
  qualityScores: INITIAL_QUALITY_SCORES
};

const KPI_COMMENTS: Record<string, string> = {
  '6-u-an': 'Bài "Nước sạch ở xóm chài ven sông" chất lượng tốt, điểm sau khiếu nại 92.',
  '6-u-binh': 'Đóng góp tốt phần ảnh; tháng sau cần chủ động thêm đề tài.',
  '7-u-an': 'Hoàn thành tốt, bài chính luận được đánh giá cao.',
  '7-u-binh': 'Chưa đủ số bài quy đổi, cần tăng sản lượng.',
  '8-u-binh': 'Bài hạn hán đạt 92 điểm – xuất sắc.',
  '8-u-an': 'Đủ số bài nhưng điểm trung bình dưới chuẩn 75.',
  '8-u-nam': 'Điểm trung bình dưới chuẩn, cần đầu tư chiều sâu.'
};

const KPI_FINALIZED: { month: number; at: string }[] = [
  { month: 6, at: '2026-07-05 09:00' },
  { month: 7, at: '2026-08-05 09:00' },
  { month: 8, at: '2026-09-05 09:00' }
];

export const INITIAL_KPI_SNAPSHOTS: KpiSnapshot[] = KPI_FINALIZED.flatMap(f =>
  KPI_REPORTERS.map(uid =>
    buildKpiSnapshot(
      KPI_SEED_SOURCE,
      uid,
      'sec-xahoi',
      f.month,
      2026,
      INITIAL_KPI_TARGETS.find(t => t.user_id === uid && t.month === f.month),
      'u-long',
      f.at,
      KPI_COMMENTS[`${f.month}-${uid}`] || ''
    )
  )
);

export const INITIAL_KPI_MONTH_CLOSES: KpiMonthClose[] = KPI_FINALIZED.map(f => ({
  id: `kc-2026-${String(f.month).padStart(2, '0')}-sec-xahoi`,
  section_id: 'sec-xahoi',
  month: f.month,
  year: 2026,
  finalized_at: f.at,
  finalized_by: 'u-long'
}));

/** Sinh số liệu độc giả theo ngày (tất định) – từ ngày đăng đến hết 28/09/2026 */
const READER_DATA_UNTIL = '2026-09-28';
const seededRand = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
};

const buildReaderDaily = (): ReaderDaily[] => {
  const rows: ReaderDaily[] = [];
  const end = new Date(READER_DATA_UNTIL + 'T00:00:00');
  INITIAL_ARTICLES.filter(a => a.status === 'PUBLISHED' && a.published_at).forEach(a => {
    const start = new Date(a.published_at!.split(' ')[0] + 'T00:00:00');
    const days = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
    if (days <= 0) return;
    const total = a.view_count ?? Math.round(4000 + seededRand(a.id) * 9000);
    const weights = Array.from({ length: days }, (_, d) => Math.exp(-d / 5) + 0.015);
    const wSum = weights.reduce((s, w) => s + w, 0);
    let assigned = 0;
    const avgRating = 3.4 + seededRand(a.id + 'r') * 1.4;
    weights.forEach((w, d) => {
      const views = d === days - 1 ? total - assigned : Math.round((total * w) / wSum);
      assigned += views;
      const date = new Date(start.getTime() + d * 86400000);
      const ds = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const ratingCount = Math.max(0, Math.round(views / 160));
      rows.push({
        id: `rd-${a.id}-${ds}`,
        article_id: a.id,
        date: ds,
        view_count: Math.max(0, views),
        rating_count: ratingCount,
        rating_sum: Math.round(ratingCount * avgRating)
      });
    });
  });
  return rows;
};

export const INITIAL_READER_DAILY: ReaderDaily[] = buildReaderDaily();

export const INITIAL_READER_IMPORT_LOGS: ReaderImportLog[] = [
  { id: 'ril-1', file_name: 'so_lieu_doc_gia_2026-09-26.csv', imported_at: '2026-09-27 08:05', imported_by: 'u-admin', total_rows: 22, new_rows: 22, overwritten_rows: 0, error_rows: 0 },
  { id: 'ril-2', file_name: 'so_lieu_doc_gia_2026-09-27.csv', imported_at: '2026-09-28 08:10', imported_by: 'u-admin', total_rows: 25, new_rows: 24, overwritten_rows: 1, error_rows: 0 },
  { id: 'ril-3', file_name: 'so_lieu_doc_gia_2026-09-28.csv', imported_at: '2026-09-29 08:02', imported_by: 'u-admin', total_rows: 28, new_rows: 27, overwritten_rows: 0, error_rows: 1 }
];
