/**
 * Định nghĩa kiểu dữ liệu cho Hệ thống Đánh giá Chất lượng và Quản lý Nhuận bút (KPI & Royalty)
 * SWP391 course project - Tuân thủ tuyệt đối schema ERD và mô hình nghiệp vụ tòa soạn báo điện tử
 */

export type RoleCode = 
  | 'PHONG_VIEN' 
  | 'TRUONG_BAN' 
  | 'BIEN_TAP_VIEN' 
  | 'THU_KY' 
  | 'KE_TOAN' 
  | 'ADMIN';

export type ArticleStatusCode = 
  | 'DRAFT'                   // Nháp (xám)
  | 'PENDING_CONFIRMATION'    // Chờ xác nhận đồng tác giả (vàng)
  | 'SUBMITTED'               // Đã nộp (xanh dương)
  | 'ASSIGNED'                // Đã phân công (chàm)
  | 'REVISION_REQUESTED'      // Trả về – cần sửa (hồng)
  | 'REJECTED'                // Từ chối (đỏ)
  | 'PENDING_APPROVAL'        // Chờ duyệt điểm (tím)
  | 'SCORE_PUBLISHED'         // Đã công bố điểm (xanh ngọc)
  | 'PUBLISHED';              // Đã đăng (xanh lá)

export type PeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED' | 'PAID' | 'NHAP' | 'DANG_CHAM' | 'DA_CHOT' | 'DA_CHI' | 'DA_CHI_TRA';
export type KpiAchieved = 'DAT' | 'CHUA_DAT';

/** Ngày "hôm nay" cố định của kịch bản demo (tòa soạn đang ở cuối tháng 9/2026) */
export const DEMO_TODAY = '2026-09-29';

export type DeclaredNature = 'SANG_TAC' | 'DICH' | 'TONG_HOP' | 'DANG_LAI';
export type ArticleNature = DeclaredNature;
export type MediaKind = 'ANH_TU_CHUP' | 'TRANH_TU_VE' | 'VIDEO_TU_QUAY' | 'NGUON_NGOAI';
export type HashCheckStatus = 'MOI' | 'TAI_SU_DUNG' | 'NGUON_NGOAI';
export type CoAuthorConfirmStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Role {
  id: string;
  code: RoleCode;
  name: string;
}

export interface Section {
  id: string;
  code: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Thể loại tác phẩm (categories theo Nghị định 18/2014) */
export interface Genre {
  id: string;
  nd_group: number;      // Nhóm theo NĐ 18/2014 (1 - 8)
  name: string;          // Tên thể loại
  base_factor: number;   // Khung hệ số tối thiểu
  max_factor: number;    // Khung hệ số tối đa
  min_factor?: number;   // Alias tương thích cho base_factor
  is_active: boolean;    // Đang áp dụng
  code?: string;         // Mã định danh
  description?: string;  // Mô tả
  created_at?: string;
  updated_at?: string;
}
export type Category = Genre;

export interface User {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  email: string;
  phone: string;
  role_id: string;
  role_code: RoleCode;
  section_id: string;
  status: 'HOAT_DONG' | 'KHOA';
  avatar_url?: string;
  press_id?: string;
  job_title?: string;
  department?: string;
  created_at: string;
  updated_at: string;
}

/** Bài viết tác phẩm */
export interface Article {
  id: string;
  author_id: string;             // Tác giả chính (người tạo bài)
  section_id: string;            // Ban chuyên môn
  declared_category_id: string;  // Thể loại do PV khai báo
  category_id: string;           // Thể loại áp dụng (BTV có thể điều chỉnh)
  genre_id: string;              // Alias tương thích ngược cho category_id
  editor_id?: string;            // BTV được phân công thẩm định
  title: string;
  sapo: string;
  content: string;
  status: ArticleStatusCode;
  declared_nature: DeclaredNature; // Tính chất khai báo: Sáng tác, Dịch, Tổng hợp, Đăng lại
  event_id?: string;             // Gắn sự kiện (nếu có)
  saturation_rank?: number;      // Thứ tự bài trong sự kiện (trong 7 ngày)
  saturation_rate?: 100 | 80 | 60 | number; // Tỷ lệ bão hòa (100%, 80%, 60% - khóa khi nộp)
  duplication_percent?: number;  // Tỷ lệ trùng lặp nội dung cao nhất (%)
  duplication_explanation?: string; // Giải trình trùng lặp
  withdrawn_count?: number;      // Số lần rút bài
  published_at?: string;         // Thời điểm đăng bài
  score_published_at?: string;   // Thời điểm công bố điểm
  cover_image?: string;
  first_submitted_at?: string;
  last_submitted_at?: string;
  view_count?: number;
  created_at: string;
  updated_at: string;
}

/** Phân công & xác nhận tác giả, đồng tác giả (article_authors) */
export interface ArticleAuthor {
  id?: string;
  article_id: string;
  user_id: string;
  is_main: boolean;               // Là tác giả chính (true) hay đồng tác giả (false)
  share_percent: number;          // Tỷ lệ hưởng nhuận bút (tổng = 100%)
  confirm_status: CoAuthorConfirmStatus; // Trạng thái xác nhận của đồng tác giả
  confirmed_at?: string;          // Thời điểm xác nhận
  reject_reason?: string;         // Lý do từ chối (nếu có)
  confirm_deadline?: string;      // Hạn xác nhận (3 ngày)
}

export interface ArticleVersion {
  id: string;
  article_id: string;
  version_no: number;
  title: string;
  sapo: string;
  content: string;
  genre_id: string;
  created_by?: string;
  created_at: string;
}

/** Media đính kèm bài viết (article_attachments) */
export interface ArticleAttachment {
  id: string;
  article_id: string;
  version_id?: string;
  media_type?: 'IMAGE' | 'VIDEO';
  media_kind?: MediaKind;         // Loại media: Tự chụp, Tự vẽ, Tự quay, Nguồn ngoài
  media_author_id?: string;       // Tác giả media (phải là 1 trong các tác giả của bài)
  external_source?: string;       // Tên nguồn nếu là nguồn ngoài
  dhash?: string;                 // Mã băm dHash nhận diện ảnh trùng
  hash_check?: HashCheckStatus;   // Kết quả kiểm tra hash: MOI, TAI_SU_DUNG, NGUON_NGOAI
  matched_distance_bits?: number; // Khoảng cách Hamming (bit lệch)
  matched_article_id?: string;    // Bài viết có media trùng trước đó
  source_type?: 'UPLOAD' | 'URL';
  url: string;
  original_name: string;
  mime_type?: string;
  file_size: number;
  caption?: string;
  sort_order?: number;
  created_at: string;
}

/** Kết quả so khớp trùng lặp nội dung */
export interface DuplicationMatch {
  article_id: string;
  matched_article_id: string;
  matched_article_title?: string;
  matched_author_name?: string;
  overlap_percent: number;
  passages: { mine: string; theirs: string }[];
}

/** Định mức hệ số media theo NĐ 18/2014 */
export interface MediaFactor {
  kind: MediaKind;
  label: string;
  factor_per_item: number;
  nd_limit_note: string;
}

/** Đơn giá một hệ số theo lương cơ sở (royalty_rates) */
export interface RoyaltyRate {
  id?: string;
  effective_from: string; // YYYY-MM-DD
  effective_to?: string;   // YYYY-MM-DD
  base_salary: number;    // Lương cơ sở
  unit_rate: number;      // 10% lương cơ sở
  legal_basis: string;    // Căn cứ pháp lý (Nghị định)
}

/** Tham số vận hành hệ thống */
export interface SystemParameter {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  flow: number | string; // Luồng 1..5 hoặc Quản trị
}

export interface ArticleStatusLog {
  id: string;
  article_id: string;
  action: string;
  from_status: ArticleStatusCode;
  to_status: ArticleStatusCode;
  actor_id: string;
  note: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
}

export type CriteriaSetStatus = 'DRAFT' | 'ACTIVE' | 'RETIRED';

export interface CriterionItem {
  id: string;
  code?: string;
  name: string;
  weight: number; // Trọng số % (ví dụ 20, 25)
  description?: string;
}

export interface CriteriaSet {
  id: string;
  genre_id: string;
  version: number;
  status: CriteriaSetStatus;
  criteria: CriterionItem[];
  created_at: string;
  used_count: number; // Số lần đã dùng để chấm
  note?: string;
}

export interface Criterion {
  id: string;
  criteria_set_id?: string;
  code?: string;
  name: string;
  max_points?: number;
  weight: number;
  description?: string;
}

export interface ScoringAttempt {
  id: string;
  article_id: string;
  attempt_no: number;
  scorer_id: string;
  scorer_type: 'PRIMARY' | 'APPEAL' | 'CROSS_CHECK' | 'THIRD_EDITOR';
  total_score: number;
  note?: string;
  decision?: 'ACCEPT' | 'RETURN' | 'REJECT'; // Nhận & gửi duyệt / Trả về / Từ chối
  criteria_set_version?: number;
  criteria_scores?: CriterionScoreDetail[];
  scored_at: string;
  is_effective?: boolean;
  score_published_at?: string;
  complaint_deadline?: string;
}

export interface ScoringItem {
  id: string;
  scoring_attempt_id: string;
  criterion_id: string;
  score: number;
  comment?: string;
}

export type AppealStatus = 'SUBMITTED' | 'IN_RESCORE' | 'IN_THIRD_REVIEW' | 'RESOLVED';

export type AppealResolutionRule =
  | 'NEW_SCORE_APPLIED'
  | 'ORIGINAL_RETAINED_WITHIN_TOLERANCE'
  | 'MEDIAN_OF_THREE';

export interface Appeal {
  id: string;
  article_id: string;
  author_id: string;
  appealed_criteria_ids: string[];
  reason: string;
  status: AppealStatus;
  original_score: number;
  original_scorer_id: string;
  criteria_set_version: number;
  rescore_editor_id?: string;
  rescore_score?: number;
  rescore_attempt_id?: string;
  rescore_date?: string;
  third_editor_id?: string;
  third_score?: number;
  third_attempt_id?: string;
  third_date?: string;
  final_effective_score?: number;
  resolution_rule?: AppealResolutionRule;
  resolution_note?: string;
  is_external_editor?: boolean; // BTV ngoài ban
  is_third_external_editor?: boolean;
  created_at: string;
  resolved_at?: string;
}

export interface CrossReviewBatch {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  genre_id?: string;
  sample_size: number;
  participating_editor_ids: string[];
  status: 'CONFIGURING' | 'IN_PROGRESS' | 'COMPLETED';
  created_at: string;
  created_by: string;
  note?: string;
}

export interface CrossReviewAssignment {
  id: string;
  batch_id: string;
  article_id: string;
  original_scorer_id: string;
  original_score: number;
  reviewer_id: string;
  reviewed_score?: number;
  deviation?: number; // reviewed_score - original_score
  status: 'PENDING' | 'COMPLETED';
  completed_at?: string;
  note?: string;
}

export interface ReviewerDeviationStat {
  editor_id: string;
  editor_name: string;
  department?: string;
  total_graded: number;
  avg_score: number;
  avg_deviation: number;
  appeal_count: number;
  appeal_rate: number;
  is_high_deviation: boolean;
}

export interface Event {
  id: string;
  code: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

export interface RoyaltyLine {
  id: string;
  article_id: string;
  period_id: string;
  recipient_id: string;
  line_type: 'ARTICLE' | 'MEDIA' | 'LEAD_BONUS' | 'ADJUSTMENT';
  factor: number;
  unit_price: number;
  amount: number;
  note?: string;
  is_adjustment?: boolean;
  original_line_id?: string;
  original_period_id?: string;
  original_period_name?: string;
  previous_amount?: number;
  recalculated_amount?: number;
}

/** Một bài được tính vào KPI tháng (lưu kèm snapshot khi chốt) */
export interface KpiArticleItem {
  article_id: string;
  title: string;
  category_id: string;
  published_at: string;
  is_main: boolean;
  share_percent: number;
  converted: number;          // Bài quy đổi = tỷ lệ / 100 (60% → 0,6 bài)
  effective_score?: number;   // Điểm hiệu lực (sau khiếu nại nếu có)
  score_changed_by_appeal?: boolean;
  original_score?: number;
}

/** KPI tháng đã chốt – SNAPSHOT bất biến (luồng 05 ghi) */
export interface KpiSnapshot {
  id: string;
  user_id: string;
  section_id: string;
  month: number;
  year: number;
  target_articles: number;
  target_quality: number;
  converted_articles: number;
  avg_score: number | null;
  result: 'DAT' | 'CHUA_DAT';
  comment?: string;
  items: KpiArticleItem[];
  finalized_at: string;
  finalized_by: string;
}

/** Trạng thái chốt KPI theo ban + tháng */
export interface KpiMonthClose {
  id: string;
  section_id: string;
  month: number;
  year: number;
  finalized_at: string;
  finalized_by: string;
}

/** Số liệu độc giả theo ngày (nhập CSV – chỉ dùng cho báo cáo, KHÔNG tính KPI) */
export interface ReaderDaily {
  id: string;
  article_id: string;
  date: string;          // YYYY-MM-DD
  view_count: number;
  rating_count: number;
  rating_sum: number;    // Tổng điểm rating (thang 5)
}

/** Lịch sử các lần nhập số liệu độc giả */
export interface ReaderImportLog {
  id: string;
  file_name: string;
  imported_at: string;
  imported_by: string;
  total_rows: number;
  new_rows: number;
  overwritten_rows: number;
  error_rows: number;
}

export interface CriterionScoreDetail {
  criterion_id: string;
  name: string;
  weight: number; // %
  score: number; // 0 - 100
  weighted_score: number; // (score * weight) / 100
  comment?: string;
}

export interface ScoringCriteria {
  tinh_chinh_xac?: number;
  tinh_thoi_su?: number;
  chat_luong_noi_dung?: number;
  van_phong_trinh_bay?: number;
  tuan_thu_ton_chi?: number;
  [key: string]: any;
}

export interface QualityScore {
  id: string;
  article_id: string;
  editor_id: string;
  criteria_set_version?: number;
  criteria_scores?: CriterionScoreDetail[];
  criteria_json?: ScoringCriteria;
  total_score: number; // Thang 100 điểm
  quality_factor: number;
  quality_tier: string;
  note: string;
  scored_at: string;
}

// Kiểu cũ để giữ tương thích màn hình đơn giá
export interface UnitPrice {
  id: string;
  genre_id?: string;
  amount: number;
  effective_from?: string;
  effective_to?: string;
  effective_date?: string;
  base_unit_price?: number;
  photo_unit_price?: number;
  video_unit_price?: number;
  is_active?: boolean;
  note?: string;
}

export interface UnitPriceConfig {
  id: string;
  effective_date: string;
  base_unit_price: number;
  photo_unit_price: number;
  video_unit_price: number;
  is_active: boolean;
  note: string;
  created_at: string;
}

export interface RoyaltyItem {
  id: string;
  article_id: string;
  period_id: string;
  base_price: number;
  base_unit_price?: number;
  genre_factor: number;
  quality_factor: number;
  media_bonus: number;
  photo_count?: number;
  video_count?: number;
  photo_unit_price?: number;
  video_unit_price?: number;
  amount: number;
  total_royalty?: number;
  status: 'DA_DUYET' | 'CHO_CHOT' | 'DA_CHI';
  note?: string;
}

export interface RoyaltyPeriod {
  id: string;
  code: string;
  period_code?: string;
  name?: string;
  month: number;
  year: number;
  start_date?: string;
  end_date?: string;
  status: PeriodStatus;
  total_amount: number;
  total_articles?: number;
  graded_articles?: number;
  closed_by?: string;
  closed_at?: string;
  locked_by?: string;
  locked_at?: string;
  paid_by?: string;
  paid_at?: string;
  return_reason?: string;
}

export interface PaymentVoucher {
  id: string;
  voucher_no?: string;
  period_id: string;
  user_id: string;
  recipient_id?: string;
  amount: number;
  total_amount?: number;
  article_amount?: number;
  media_amount?: number;
  adjustment_amount?: number;
  carried_forward?: number; // Điều chỉnh âm chuyển kỳ sau nếu âm > số tiền
  tax_deduction?: number;
  net_amount?: number;
  paid_at?: string;
  payment_method?: 'CHUYEN_KHOAN' | 'TIEN_MAT';
  bank_account_info?: {
    bank_name: string;
    account_number: string;
    account_name: string;
  };
  note: string;
  is_paid: boolean;
  status?: 'CHUA_CHI' | 'DA_CHI';
  created_at?: string;
  days_since_published?: number;
  deadline_warning?: 'NORMAL' | 'WARNING_45' | 'OVERDUE_60';
}

export interface KpiTarget {
  id: string;
  section_id: string;
  user_id: string;
  month: number;
  year: number;
  target_articles: number;   // Số bài quy đổi tối thiểu / tháng
  target_quality: number;    // Điểm chất lượng trung bình tối thiểu (thang 100)
  note?: string;
  created_by?: string;
  created_at?: string;
}



// Bảng màu trạng thái duy nhất
export const STATUS_CONFIG: Record<ArticleStatusCode, { label: string; bg: string; text: string; border: string; dot: string }> = {
  DRAFT: {
    label: 'Nháp',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    dot: 'bg-slate-400'
  },
  PENDING_CONFIRMATION: {
    label: 'Chờ xác nhận đồng tác giả',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-500'
  },
  SUBMITTED: {
    label: 'Đã nộp',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500'
  },
  ASSIGNED: {
    label: 'Đã phân công',
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
    dot: 'bg-indigo-500'
  },
  REVISION_REQUESTED: {
    label: 'Trả về – cần sửa',
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-200',
    dot: 'bg-pink-500'
  },
  REJECTED: {
    label: 'Từ chối',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
    dot: 'bg-red-500'
  },
  PENDING_APPROVAL: {
    label: 'Chờ duyệt điểm',
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-300',
    dot: 'bg-purple-500'
  },
  SCORE_PUBLISHED: {
    label: 'Đã công bố điểm',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-300',
    dot: 'bg-teal-500'
  },
  PUBLISHED: {
    label: 'Đã đăng',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    dot: 'bg-emerald-500'
  }
};

// Định dạng tiền tệ VND với dấu chấm: 1.234.000 đ
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' đ';
}

// Định dạng ngày: dd/MM/yyyy
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return dateStr;
  }
}

// Định dạng ngày giờ: dd/MM/yyyy HH:mm
export function formatDateTime(dateStr?: string): string {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
}

/**
 * Tính tiền nhuận bút từ hệ số và đơn giá (tránh sai số float)
 * Quy tắc: nhân hệ số với 100 rồi mới nhân đơn giá, cuối cùng chia 100
 * Ví dụ: 9,6 × 234.000 = 2.246.400 đ
 */
export function calculateRoyaltyAmount(factor: number, unitRate: number): number {
  return Math.floor((Math.round(factor * 100) * unitRate) / 100);
}

export const ROLE_INFO: Record<RoleCode, { label: string; desc: string }> = {
  PHONG_VIEN: { label: 'Phóng viên', desc: 'Sáng tạo nội dung, nộp bài, xác nhận đồng tác giả, theo dõi KPI' },
  TRUONG_BAN: { label: 'Trưởng ban', desc: 'Phân công BTV, duyệt điểm và duyệt xuất bản, quản lý KPI ban' },
  BIEN_TAP_VIEN: { label: 'Biên tập viên', desc: 'Thẩm định chất lượng, chấm điểm các tiêu chí, biên tập bài' },
  THU_KY: { label: 'Thư ký tòa soạn', desc: 'Định mức nhuận bút, duyệt phụ cấp media, chốt kỳ nhuận bút' },
  KE_TOAN: { label: 'Kế toán', desc: 'Lập phiếu chi, chi trả nhuận bút, theo dõi hạn chi' },
  ADMIN: { label: 'Quản trị viên', desc: 'Quản lý người dùng, thể loại và khung hệ số, tham số hệ thống' }
};
