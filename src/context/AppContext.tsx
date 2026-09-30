/**
 * React Context & Reducer quản trị toàn bộ dữ liệu ứng dụng
 * Đảm bảo dữ liệu sống đồng bộ giữa tất cả các màn hình
 * Tuân thủ quy tắc nghiệp vụ SWP391 - Hệ thống KPI & Nhuận bút Tòa soạn
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
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
  DEMO_TODAY,
  RoleCode,
  ArticleStatusCode,
  ScoringCriteria,
  MediaFactor,
  RoyaltyRate,
  RoyaltyLine,
  SystemParameter,
  DuplicationMatch,
  Event,
  CriteriaSet,
  CriterionItem,
  CriterionScoreDetail,
  ScoringAttempt,
  Appeal,
  AppealStatus,
  AppealResolutionRule,
  CrossReviewBatch,
  CrossReviewAssignment,
  ReviewerDeviationStat
} from '../types';
import {
  INITIAL_ROLES,
  INITIAL_SECTIONS,
  INITIAL_GENRES,
  INITIAL_USERS,
  INITIAL_UNIT_PRICES,
  INITIAL_ROYALTY_PERIODS,
  INITIAL_ARTICLES,
  INITIAL_ARTICLE_AUTHORS,
  INITIAL_ARTICLE_VERSIONS,
  INITIAL_ATTACHMENTS,
  INITIAL_DUPLICATION_MATCHES,
  INITIAL_STATUS_LOGS,
  INITIAL_QUALITY_SCORES,
  INITIAL_SCORING_ATTEMPTS,
  INITIAL_APPEALS,
  INITIAL_CROSS_REVIEW_BATCHES,
  INITIAL_CROSS_REVIEW_ASSIGNMENTS,
  INITIAL_REVIEWER_STATS,
  INITIAL_ROYALTY_ITEMS,
  INITIAL_ROYALTY_LINES,
  INITIAL_PAYMENT_VOUCHERS,
  INITIAL_KPI_TARGETS,
  INITIAL_KPI_SNAPSHOTS,
  INITIAL_KPI_MONTH_CLOSES,
  INITIAL_READER_DAILY,
  INITIAL_READER_IMPORT_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_MEDIA_FACTORS,
  INITIAL_ROYALTY_RATES,
  INITIAL_SYSTEM_PARAMETERS,
  INITIAL_EVENTS,
  INITIAL_CRITERIA_SETS
} from '../data/mockData';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export interface AppState {
  users: User[];
  roles: Role[];
  sections: Section[];
  genres: Genre[];
  articles: Article[];
  articleAuthors: ArticleAuthor[];
  articleVersions: ArticleVersion[];
  articleAttachments: ArticleAttachment[];
  articleStatusLogs: ArticleStatusLog[];
  duplicationMatches: DuplicationMatch[];
  notifications: Notification[];
  qualityScores: QualityScore[];
  unitPrices: UnitPrice[];
  royaltyRates: RoyaltyRate[];
  mediaFactors: MediaFactor[];
  systemParameters: SystemParameter[];
  events: Event[];
  criteriaSets: CriteriaSet[];
  scoringAttempts: ScoringAttempt[];
  appeals: Appeal[];
  crossReviewBatches: CrossReviewBatch[];
  crossReviewAssignments: CrossReviewAssignment[];
  reviewerStats: ReviewerDeviationStat[];
  royaltyItems: RoyaltyItem[];
  royaltyLines: RoyaltyLine[];
  royaltyPeriods: RoyaltyPeriod[];
  paymentVouchers: PaymentVoucher[];
  kpiTargets: KpiTarget[];
  kpiSnapshots: KpiSnapshot[];
  kpiMonthCloses: KpiMonthClose[];
  readerDaily: ReaderDaily[];
  readerImportLogs: ReaderImportLog[];
  currentUser: User;
  currentRole: RoleCode;
  toasts: ToastItem[];
}

export type Action =
  | { type: 'SWITCH_ROLE'; payload: RoleCode }
  | { type: 'SWITCH_USER'; payload: string }
  | { type: 'RESET_DEMO' }
  | { type: 'ADD_TOAST'; payload: Omit<ToastItem, 'id'> }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'MARK_NOTIF_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFS_READ' }
  | { type: 'SAVE_DRAFT'; payload: { article: Partial<Article>; attachments?: ArticleAttachment[]; authors?: ArticleAuthor[] } }
  | { type: 'SUBMIT_ARTICLE'; payload: { articleId: string; note?: string } }
  | { type: 'WITHDRAW_ARTICLE'; payload: { articleId: string; reason: string } }
  | { type: 'SUBMIT_ARTICLE_WITH_DUPLICATION'; payload: { articleId: string; duplication_percent: number; duplication_explanation?: string; saturation_rank?: number; saturation_rate?: number; note?: string } }
  | { type: 'SAVE_ATTACHMENTS'; payload: { articleId: string; attachments: ArticleAttachment[] } }
  | { type: 'CONFIRM_CO_AUTHOR'; payload: { articleId: string; userId: string; accept: boolean; reason?: string } }
  | { type: 'ASSIGN_EDITOR'; payload: { articleIds: string[]; editorId: string; note?: string } }
  | { type: 'SCORE_ARTICLE'; payload: { articleId: string; criteria?: ScoringCriteria; criteriaScores?: CriterionScoreDetail[]; criteriaSetVersion?: number; note: string; action: 'NHAN' | 'TRA_VE' | 'TU_CHOI' | 'DAT' | 'YEU_CAU_SUA'; newCategoryId?: string } }
  | { type: 'APPROVE_SCORE'; payload: { articleId: string; note?: string; scorePublishedAt?: string; complaintDeadline?: string } }
  | { type: 'REQUEST_RESCORE'; payload: { articleId: string; reason: string } }
  | { type: 'CHANGE_ARTICLE_CATEGORY'; payload: { articleId: string; newCategoryId: string; reason: string } }
  | { type: 'SUBMIT_APPEAL'; payload: { articleId: string; appealedCriteriaIds: string[]; reason: string } }
  | { type: 'SUBMIT_BLIND_RESCORE'; payload: { appealId: string; criteriaScores: CriterionScoreDetail[]; note: string } }
  | { type: 'SUBMIT_THIRD_REVIEW'; payload: { appealId: string; criteriaScores: CriterionScoreDetail[]; note: string } }
  | { type: 'CREATE_CROSS_REVIEW_BATCH'; payload: { name: string; startDate: string; endDate: string; genreId?: string; sampleSize: number; editorIds: string[]; note?: string } }
  | { type: 'SUBMIT_CROSS_REVIEW_EVALUATION'; payload: { assignmentId: string; reviewedScore: number; note?: string } }
  | { type: 'SAVE_EDITED_ARTICLE'; payload: { articleId: string; title: string; sapo: string; content: string; genreId?: string; note?: string } }
  | { type: 'EDIT_ARTICLE'; payload: { articleId: string; title: string; sapo: string; content: string; genreId?: string; note?: string } }
  | { type: 'SEND_FOR_PUBLISH_APPROVAL'; payload: { articleId: string; note?: string } }
  | { type: 'SUBMIT_FOR_PUBLISH'; payload: { articleId: string; note?: string } }
  | { type: 'APPROVE_PUBLISH'; payload: { articleId: string; publishDateTime?: string; publishTime?: string; note?: string } }
  | { type: 'REJECT_PUBLISH_TO_EDITOR'; payload: { articleId: string; reason: string } }
  | { type: 'REJECT_BACK_TO_EDITOR'; payload: { articleId: string; reason: string } }
  | { type: 'CREATE_CRITERIA_SET_VERSION'; payload: { genreId: string; criteria: CriterionItem[]; note?: string; autoActivate?: boolean } }
  | { type: 'UPDATE_CRITERIA_SET'; payload: { id: string; criteria: CriterionItem[]; note?: string } }
  | { type: 'ACTIVATE_CRITERIA_SET_VERSION'; payload: { criteriaSetId: string } }
  | { type: 'SAVE_ROYALTY_ITEM'; payload: any }
  | { type: 'CALCULATE_ROYALTY'; payload: any }
  | { type: 'CLOSE_PERIOD'; payload: { periodId: string; note?: string } }
  | { type: 'REOPEN_PERIOD'; payload: { periodId: string; reason: string } }
  | { type: 'RETURN_PERIOD'; payload: { periodId: string; reason: string } }
  | { type: 'LOCK_PERIOD'; payload: { periodId: string } }
  | { type: 'CREATE_ROYALTY_PERIOD'; payload: { month: number; year: number } }
  | { type: 'PAY_VOUCHER'; payload: { voucherId: string; paymentMethod?: 'CHUYEN_KHOAN' | 'TIEN_MAT' } }
  | { type: 'PAY_ALL_PERIOD_VOUCHERS'; payload: { periodId: string } }
  | { type: 'SET_KPI_TARGETS'; payload: { targets: KpiTarget[] } }
  | { type: 'COPY_KPI_TARGETS'; payload: { fromMonth: number; fromYear: number; toMonth: number; toYear: number; sectionId?: string } }
  | { type: 'FINALIZE_KPI_MONTH'; payload: { sectionId: string; month: number; year: number; snapshots: KpiSnapshot[] } }
  | { type: 'IMPORT_READER_DATA'; payload: { rows: ReaderDaily[]; log: ReaderImportLog } }
  | { type: 'ADD_GENRE'; payload: Omit<Genre, 'id' | 'created_at' | 'updated_at'> | Genre }
  | { type: 'UPDATE_GENRE'; payload: Genre }
  | { type: 'DEACTIVATE_GENRE'; payload: { genreId: string } }
  | { type: 'ADD_UNIT_PRICE'; payload: any }
  | { type: 'ADD_ROYALTY_RATE'; payload: { base_salary: number; effective_from: string; legal_basis?: string } }
  | { type: 'UPDATE_MEDIA_FACTORS'; payload: { mediaFactors: MediaFactor[] } }
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: Event }
  | { type: 'SAVE_ROYALTY_CALCULATION'; payload: { royaltyItem: any; royaltyLines: RoyaltyLine[] } }
  | { type: 'UPDATE_USER_AVATAR'; payload: { userId: string; avatarUrl: string } }
  | { type: 'UPDATE_SYSTEM_PARAMETERS'; payload: { parameters: SystemParameter[] } }
  | { type: 'UPDATE_SYSTEM_PARAMETER'; payload: { key: string; value: string | number } }
  | { type: 'SIMULATE_COAUTHOR_TIMEOUT'; payload?: { articleId?: string } }
  | { type: 'RESUBMIT_REVISION'; payload: { articleId: string; title: string; sapo: string; content: string; note?: string; duplication_percent?: number; duplication_explanation?: string } };

const initialState: AppState = {
  users: INITIAL_USERS,
  roles: INITIAL_ROLES,
  sections: INITIAL_SECTIONS,
  genres: INITIAL_GENRES,
  articles: INITIAL_ARTICLES,
  articleAuthors: INITIAL_ARTICLE_AUTHORS,
  articleVersions: INITIAL_ARTICLE_VERSIONS,
  articleAttachments: INITIAL_ATTACHMENTS,
  articleStatusLogs: INITIAL_STATUS_LOGS,
  duplicationMatches: INITIAL_DUPLICATION_MATCHES,
  notifications: INITIAL_NOTIFICATIONS,
  qualityScores: INITIAL_QUALITY_SCORES,
  unitPrices: INITIAL_UNIT_PRICES,
  royaltyRates: INITIAL_ROYALTY_RATES,
  mediaFactors: INITIAL_MEDIA_FACTORS,
  systemParameters: INITIAL_SYSTEM_PARAMETERS,
  events: INITIAL_EVENTS,
  criteriaSets: INITIAL_CRITERIA_SETS,
  scoringAttempts: INITIAL_SCORING_ATTEMPTS,
  appeals: INITIAL_APPEALS,
  crossReviewBatches: INITIAL_CROSS_REVIEW_BATCHES,
  crossReviewAssignments: INITIAL_CROSS_REVIEW_ASSIGNMENTS,
  reviewerStats: INITIAL_REVIEWER_STATS,
  royaltyItems: INITIAL_ROYALTY_ITEMS,
  royaltyLines: INITIAL_ROYALTY_LINES,
  royaltyPeriods: INITIAL_ROYALTY_PERIODS,
  paymentVouchers: INITIAL_PAYMENT_VOUCHERS,
  kpiTargets: INITIAL_KPI_TARGETS,
  kpiSnapshots: INITIAL_KPI_SNAPSHOTS,
  kpiMonthCloses: INITIAL_KPI_MONTH_CLOSES,
  readerDaily: INITIAL_READER_DAILY,
  readerImportLogs: INITIAL_READER_IMPORT_LOGS,
  currentUser: INITIAL_USERS[0], // Nguyễn Văn An (Phóng viên)
  currentRole: 'PHONG_VIEN',
  toasts: []
};

function appReducer(state: AppState, action: Action): AppState {
  const now = new Date();
  const nowStr = now.toISOString().replace('T', ' ').substring(0, 16);

  switch (action.type) {
    case 'SWITCH_ROLE': {
      const newRole = action.payload;
      // Tìm user phù hợp nhất cho vai trò này
      const targetUser = state.users.find(u => u.role_code === newRole) || state.users[0];
      return {
        ...state,
        currentRole: newRole,
        currentUser: targetUser
      };
    }

    case 'RESET_DEMO': {
      return { ...initialState, toasts: [] };
    }

    case 'SWITCH_USER': {
      const user = state.users.find(u => u.id === action.payload);
      if (!user) return state;
      return {
        ...state,
        currentUser: user,
        currentRole: user.role_code
      };
    }

    case 'UPDATE_USER_AVATAR': {
      const { userId, avatarUrl } = action.payload;
      const updatedUsers = state.users.map(u => u.id === userId ? { ...u, avatar_url: avatarUrl } : u);
      const updatedCurrentUser = state.currentUser.id === userId
        ? { ...state.currentUser, avatar_url: avatarUrl }
        : state.currentUser;
      return {
        ...state,
        users: updatedUsers,
        currentUser: updatedCurrentUser
      };
    }

    case 'ADD_TOAST': {
      const newToast: ToastItem = {
        id: 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
        type: action.payload.type,
        message: action.payload.message
      };
      return {
        ...state,
        toasts: [...state.toasts, newToast]
      };
    }

    case 'REMOVE_TOAST': {
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.payload)
      };
    }

    case 'MARK_NOTIF_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, is_read: true } : n
        )
      };
    }

    case 'MARK_ALL_NOTIFS_READ': {
      return {
        ...state,
        notifications: state.notifications.map(n => ({ ...n, is_read: true }))
      };
    }

    case 'SAVE_DRAFT': {
      const { article: artInput, attachments, authors } = action.payload;
      let updatedArticles = [...state.articles];
      let updatedVersions = [...state.articleVersions];
      let updatedAttachments = [...state.articleAttachments];
      let updatedAuthors = [...state.articleAuthors];
      let articleId = artInput.id;

      const categoryId = artInput.category_id || artInput.declared_category_id || artInput.genre_id || state.genres[0].id;

      if (articleId && state.articles.some(a => a.id === articleId)) {
        // Cập nhật bài cũ
        updatedArticles = updatedArticles.map(a =>
          a.id === articleId
            ? {
                ...a,
                ...artInput,
                category_id: categoryId,
                declared_category_id: a.declared_category_id || categoryId,
                genre_id: categoryId,
                updated_at: nowStr
              }
            : a
        );
      } else {
        // Tạo bài mới
        articleId = 'art-' + Date.now();
        const newArt: Article = {
          id: articleId,
          author_id: artInput.author_id || state.currentUser.id,
          section_id: artInput.section_id || state.sections[0].id,
          declared_category_id: categoryId,
          category_id: categoryId,
          genre_id: categoryId,
          declared_nature: artInput.declared_nature || 'SANG_TAC',
          title: artInput.title || 'Bản nháp mới',
          sapo: artInput.sapo || '',
          content: artInput.content || '',
          status: 'DRAFT',
          event_id: artInput.event_id,
          created_at: nowStr,
          updated_at: nowStr
        };
        updatedArticles.unshift(newArt);

        // Tạo version 1
        const newVersion: ArticleVersion = {
          id: 'ver-' + Date.now(),
          article_id: articleId,
          version_no: 1,
          title: newArt.title,
          sapo: newArt.sapo,
          content: newArt.content,
          genre_id: newArt.category_id,
          created_by: state.currentUser.id,
          created_at: nowStr
        };
        updatedVersions.unshift(newVersion);
      }

      if (attachments && attachments.length > 0) {
        updatedAttachments = [
          ...updatedAttachments.filter(att => att.article_id !== articleId),
          ...attachments.map(att => ({ ...att, article_id: articleId! }))
        ];
      }

      if (authors && authors.length > 0) {
        updatedAuthors = [
          ...updatedAuthors.filter(au => au.article_id !== articleId),
          ...authors.map(au => ({ ...au, article_id: articleId! }))
        ];
      }

      return {
        ...state,
        articles: updatedArticles,
        articleVersions: updatedVersions,
        articleAttachments: updatedAttachments,
        articleAuthors: updatedAuthors
      };
    }

    case 'SUBMIT_ARTICLE': {
      const art = state.articles.find(a => a.id === action.payload.articleId);
      if (!art) return state;

      // Kiểm tra nếu bài có đồng tác giả đang chờ xác nhận
      const pendingAuthors = state.articleAuthors.filter(
        au => au.article_id === art.id && !au.is_main && au.confirm_status === 'PENDING'
      );

      const targetStatus: ArticleStatusCode = pendingAuthors.length > 0
        ? 'PENDING_CONFIRMATION'
        : 'SUBMITTED';

      const updatedArticles = state.articles.map(a => {
        if (a.id === action.payload.articleId) {
          return {
            ...a,
            status: targetStatus,
            first_submitted_at: a.first_submitted_at || nowStr,
            last_submitted_at: nowStr,
            updated_at: nowStr
          };
        }
        return a;
      });

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: art.id,
        action: pendingAuthors.length > 0 ? 'Nộp bài – Chờ đồng tác giả xác nhận' : 'Nộp bài duyệt',
        from_status: art.status,
        to_status: targetStatus,
        actor_id: state.currentUser.id,
        note: action.payload.note || (pendingAuthors.length > 0 ? 'Đang gửi yêu cầu xác nhận tới các đồng tác giả' : 'Phóng viên nộp bài duyệt'),
        created_at: nowStr
      };

      // Thông báo cho Trưởng ban hoặc đồng tác giả
      const newNotifs: Notification[] = [];
      if (pendingAuthors.length > 0) {
        pendingAuthors.forEach(pa => {
          newNotifs.push({
            id: 'notif-' + Date.now() + '-' + pa.user_id,
            user_id: pa.user_id,
            message: `Phóng viên ${state.currentUser.full_name} mời bạn xác nhận đồng tác giả bài viết "${art.title}".`,
            link: `/reporter/articles`,
            is_read: false,
            created_at: nowStr
          });
        });
      } else {
        const lead = state.users.find(u => u.role_code === 'TRUONG_BAN' && u.section_id === art.section_id)
          || state.users.find(u => u.role_code === 'TRUONG_BAN');
        if (lead) {
          newNotifs.push({
            id: 'notif-' + Date.now(),
            user_id: lead.id,
            message: `Phóng viên ${state.currentUser.full_name} đã nộp bài "${art.title}".`,
            link: '/editor-lead/queue',
            is_read: false,
            created_at: nowStr
          });
        }
      }

      return {
        ...state,
        articles: updatedArticles,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...newNotifs, ...state.notifications]
      };
    }

    case 'CONFIRM_CO_AUTHOR': {
      const { articleId, userId, accept, reason } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const updatedAuthors = state.articleAuthors.map(au => {
        if (au.article_id === articleId && au.user_id === userId) {
          return {
            ...au,
            confirm_status: accept ? ('ACCEPTED' as const) : ('REJECTED' as const),
            confirmed_at: nowStr,
            reject_reason: reason
          };
        }
        return au;
      });

      // Quy tắc nghiệp vụ L01:
      // - Nếu có 1 người từ chối => bài về DRAFT, báo tác giả chính kèm lý do
      // - Nếu tất cả đồng tác giả đồng ý => bài chuyển SUBMITTED và báo Trưởng ban
      // - Nếu còn người chưa trả lời và không ai từ chối => PENDING_CONFIRMATION
      const hasAnyRejected = updatedAuthors.some(
        au => au.article_id === articleId && !au.is_main && au.confirm_status === 'REJECTED'
      );
      const remainingPending = updatedAuthors.filter(
        au => au.article_id === articleId && !au.is_main && au.confirm_status === 'PENDING'
      );

      let nextStatus: ArticleStatusCode = 'PENDING_CONFIRMATION';
      if (hasAnyRejected) {
        nextStatus = 'DRAFT';
      } else if (remainingPending.length === 0) {
        nextStatus = 'SUBMITTED';
      }

      const updatedArticles = state.articles.map(a =>
        a.id === articleId ? { ...a, status: nextStatus, updated_at: nowStr } : a
      );

      const user = state.users.find(u => u.id === userId);
      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: accept
          ? (nextStatus === 'SUBMITTED' ? 'Tất cả đồng tác giả xác nhận – Nộp bài duyệt' : 'Đồng tác giả xác nhận tham gia')
          : 'Đồng tác giả từ chối – Chuyển bài về Bản nháp',
        from_status: art.status,
        to_status: nextStatus,
        actor_id: userId,
        note: accept
          ? `Đồng tác giả ${user?.full_name} đã xác nhận tỷ lệ đóng góp.`
          : `Đồng tác giả ${user?.full_name} từ chối tham gia. Lý do: ${reason || 'Không đồng ý'}`,
        created_at: nowStr
      };

      const newNotifs: Notification[] = [];
      // Thông báo cho tác giả chính
      newNotifs.push({
        id: 'notif-' + Date.now() + '-main',
        user_id: art.author_id,
        message: accept
          ? `Đồng tác giả ${user?.full_name} đã chấp nhận tham gia bài "${art.title}".`
          : `Đồng tác giả ${user?.full_name} đã từ chối tham gia bài "${art.title}". Lý do: ${reason || 'Không đồng ý'}. Bài viết đã chuyển về Bản nháp.`,
        link: `/articles/${art.id}`,
        is_read: false,
        created_at: nowStr
      });

      // Nếu tất cả đã xác nhận -> chuyển sang SUBMITTED và thông báo cho Trưởng ban
      if (!hasAnyRejected && remainingPending.length === 0) {
        const lead = state.users.find(u => u.role_code === 'TRUONG_BAN' && u.section_id === art.section_id)
          || state.users.find(u => u.role_code === 'TRUONG_BAN');
        if (lead) {
          newNotifs.push({
            id: 'notif-' + Date.now() + '-lead',
            user_id: lead.id,
            message: `Bài viết "${art.title}" đã được các đồng tác giả xác nhận đầy đủ, chuyển sang hàng chờ phân công.`,
            link: '/editor-lead/queue',
            is_read: false,
            created_at: nowStr
          });
        }
      }

      return {
        ...state,
        articleAuthors: updatedAuthors,
        articles: updatedArticles,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...newNotifs, ...state.notifications]
      };
    }

    case 'SIMULATE_COAUTHOR_TIMEOUT': {
      const targetArticleId = action.payload?.articleId;
      const targetArticles = state.articles.filter(
        a => (targetArticleId ? a.id === targetArticleId : a.status === 'PENDING_CONFIRMATION')
      );

      if (targetArticles.length === 0) return state;

      const targetArticleIds = new Set(targetArticles.map(a => a.id));

      const updatedArticles = state.articles.map(a =>
        targetArticleIds.has(a.id)
          ? { ...a, status: 'DRAFT' as ArticleStatusCode, updated_at: nowStr }
          : a
      );

      const timeoutLogs: ArticleStatusLog[] = [];
      const timeoutNotifs: Notification[] = [];

      targetArticles.forEach(art => {
        timeoutLogs.push({
          id: 'log-timeout-' + Date.now() + '-' + art.id,
          article_id: art.id,
          action: 'Quá hạn 3 ngày xác nhận đồng tác giả – Tự động về Bản nháp',
          from_status: art.status,
          to_status: 'DRAFT',
          actor_id: 'system',
          note: 'Hết thời hạn 3 ngày chờ đồng tác giả phản hồi theo quy định tòa soạn. Hệ thống tự động chuyển bài về Bản nháp để tác giả chính chủ động xử lý.',
          created_at: nowStr
        });

        timeoutNotifs.push({
          id: 'notif-timeout-' + Date.now() + '-' + art.id,
          user_id: art.author_id,
          message: `Bài viết "${art.title}" đã được hệ thống tự động chuyển về Bản nháp do quá hạn 3 ngày mà đồng tác giả chưa xác nhận.`,
          link: `/reporter/articles/${art.id}/edit`,
          is_read: false,
          created_at: nowStr
        });
      });

      return {
        ...state,
        articles: updatedArticles,
        articleStatusLogs: [...timeoutLogs, ...state.articleStatusLogs],
        notifications: [...timeoutNotifs, ...state.notifications]
      };
    }

    case 'RESUBMIT_REVISION': {
      const { articleId, title, sapo, content, note, duplication_percent, duplication_explanation } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const coAuthors = state.articleAuthors.filter(au => au.article_id === articleId && !au.is_main);
      const hasPendingCoAuthors = coAuthors.some(au => au.confirm_status === 'PENDING');

      // Quy tắc: Nếu CHỈ sửa nội dung -> nộp thẳng, bài quay về đúng BTV cũ chấm lại (trạng thái ASSIGNED, log "Nộp lại sau khi bị trả về").
      // Nếu đổi tác giả hoặc tỷ lệ -> phải qua PENDING_CONFIRMATION lại.
      // Giữ nguyên mức bão hòa đã khóa ở lần nộp đầu.
      const nextStatus: ArticleStatusCode = hasPendingCoAuthors ? 'PENDING_CONFIRMATION' : 'ASSIGNED';

      const existingVersions = state.articleVersions.filter(v => v.article_id === articleId);
      const nextVersionNo = existingVersions.length + 1;

      const newVersion: ArticleVersion = {
        id: 'ver-' + Date.now(),
        article_id: articleId,
        version_no: nextVersionNo,
        title,
        sapo,
        content,
        genre_id: art.category_id,
        created_by: state.currentUser.id,
        created_at: nowStr
      };

      const updatedArticles = state.articles.map(a =>
        a.id === articleId
          ? {
              ...a,
              title,
              sapo,
              content,
              status: nextStatus,
              duplication_percent: duplication_percent ?? a.duplication_percent,
              duplication_explanation: duplication_explanation ?? a.duplication_explanation,
              last_submitted_at: nowStr,
              updated_at: nowStr
            }
          : a
      );

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: nextStatus === 'ASSIGNED'
          ? 'Nộp lại sau khi bị trả về (Chuyển BTV chấm lại)'
          : 'Nộp lại bài viết (Chờ đồng tác giả xác nhận lại)',
        from_status: art.status,
        to_status: nextStatus,
        actor_id: state.currentUser.id,
        note: note || `Phóng viên đã hoàn thành chỉnh sửa nội dung theo góp ý của BTV.`,
        created_at: nowStr
      };

      const newNotifs: Notification[] = [];
      if (nextStatus === 'ASSIGNED' && art.editor_id) {
        newNotifs.push({
          id: 'notif-' + Date.now() + '-editor',
          user_id: art.editor_id,
          message: `Phóng viên ${state.currentUser.full_name} đã sửa và nộp lại bài viết "${title}" theo yêu cầu của bạn.`,
          link: `/editor/score/${articleId}`,
          is_read: false,
          created_at: nowStr
        });
      }

      return {
        ...state,
        articles: updatedArticles,
        articleVersions: [newVersion, ...state.articleVersions],
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...newNotifs, ...state.notifications]
      };
    }

    case 'WITHDRAW_ARTICLE': {
      const { articleId, reason } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const newWithdrawnCount = (art.withdrawn_count || 0) + 1;
      const updatedArticles = state.articles.map(a =>
        a.id === articleId
          ? {
              ...a,
              status: 'DRAFT' as ArticleStatusCode,
              withdrawn_count: newWithdrawnCount,
              updated_at: nowStr
            }
          : a
      );

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: `Rút bài viết về Bản nháp (Lần ${newWithdrawnCount})`,
        from_status: art.status,
        to_status: 'DRAFT',
        actor_id: state.currentUser.id,
        note: reason || 'Phóng viên chủ động rút bài để chỉnh sửa, bổ sung tài liệu',
        created_at: nowStr
      };

      return {
        ...state,
        articles: updatedArticles,
        articleStatusLogs: [newLog, ...state.articleStatusLogs]
      };
    }

    case 'SUBMIT_ARTICLE_WITH_DUPLICATION': {
      const { articleId, duplication_percent, duplication_explanation, saturation_rank, saturation_rate, note } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const coAuthors = state.articleAuthors.filter(au => au.article_id === articleId && !au.is_main);
      const pendingCoAuthors = coAuthors.filter(au => au.confirm_status === 'PENDING');
      const targetStatus: ArticleStatusCode = pendingCoAuthors.length > 0 ? 'PENDING_CONFIRMATION' : 'SUBMITTED';

      // Hạn 3 ngày cho đồng tác giả
      const deadlineDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
      const deadlineStr = deadlineDate.toISOString().replace('T', ' ').substring(0, 16);

      const updatedAuthors = state.articleAuthors.map(au => {
        if (au.article_id === articleId && !au.is_main && au.confirm_status === 'PENDING' && !au.confirm_deadline) {
          return { ...au, confirm_deadline: deadlineStr };
        }
        return au;
      });

      const updatedArticles = state.articles.map(a => {
        if (a.id === articleId) {
          return {
            ...a,
            status: targetStatus,
            duplication_percent,
            duplication_explanation: duplication_explanation || a.duplication_explanation,
            saturation_rank: saturation_rank ?? a.saturation_rank,
            saturation_rate: saturation_rate ?? a.saturation_rate,
            first_submitted_at: a.first_submitted_at || nowStr,
            last_submitted_at: nowStr,
            updated_at: nowStr
          };
        }
        return a;
      });

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: pendingCoAuthors.length > 0 ? 'Nộp bài – Chờ đồng tác giả xác nhận (Hạn 3 ngày)' : 'Nộp bài duyệt (Đã kiểm tra trùng & tác quyền)',
        from_status: art.status,
        to_status: targetStatus,
        actor_id: state.currentUser.id,
        note: note || `Độ trùng lặp: ${duplication_percent}%. ${duplication_explanation ? 'Giải trình: ' + duplication_explanation : ''}`,
        created_at: nowStr
      };

      const newNotifs: Notification[] = [];
      if (pendingCoAuthors.length > 0) {
        pendingCoAuthors.forEach(pa => {
          newNotifs.push({
            id: 'notif-' + Date.now() + '-' + pa.user_id,
            user_id: pa.user_id,
            message: `Phóng viên ${state.currentUser.full_name} mời bạn xác nhận đồng tác giả (${pa.share_percent}%) bài viết "${art.title}". Thời hạn xác nhận: 3 ngày.`,
            link: '/reporter/articles',
            is_read: false,
            created_at: nowStr
          });
        });
      } else {
        const lead = state.users.find(u => u.role_code === 'TRUONG_BAN' && u.section_id === art.section_id)
          || state.users.find(u => u.role_code === 'TRUONG_BAN');
        if (lead) {
          newNotifs.push({
            id: 'notif-' + Date.now(),
            user_id: lead.id,
            message: `Phóng viên ${state.currentUser.full_name} đã nộp bài "${art.title}" (Độ trùng lặp: ${duplication_percent}%).`,
            link: '/editor-lead/queue',
            is_read: false,
            created_at: nowStr
          });
        }
      }

      return {
        ...state,
        articles: updatedArticles,
        articleAuthors: updatedAuthors,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...newNotifs, ...state.notifications]
      };
    }

    case 'SAVE_ATTACHMENTS': {
      const { articleId, attachments } = action.payload;
      return {
        ...state,
        articleAttachments: [
          ...state.articleAttachments.filter(att => att.article_id !== articleId),
          ...attachments
        ]
      };
    }

    case 'ASSIGN_EDITOR': {
      const { articleIds, editorId, note } = action.payload;
      const editor = state.users.find(u => u.id === editorId);
      if (!editor) return state;

      const newLogs: ArticleStatusLog[] = [];
      const newNotifs: Notification[] = [];

      const updatedArticles = state.articles.map(a => {
        if (articleIds.includes(a.id)) {
          newLogs.push({
            id: 'log-' + Date.now() + '-' + a.id,
            article_id: a.id,
            action: 'Phân công biên tập viên',
            from_status: a.status,
            to_status: 'ASSIGNED',
            actor_id: state.currentUser.id,
            note: note || `Phân công cho BTV ${editor.full_name}`,
            created_at: nowStr
          });

          newNotifs.push({
            id: 'notif-' + Date.now() + '-' + a.id,
            user_id: editor.id,
            message: `Bạn được phân công thẩm định bài viết "${a.title}".`,
            link: `/editor/score/${a.id}`,
            is_read: false,
            created_at: nowStr
          });

          return {
            ...a,
            editor_id: editorId,
            status: 'ASSIGNED' as ArticleStatusCode,
            updated_at: nowStr
          };
        }
        return a;
      });

      return {
        ...state,
        articles: updatedArticles,
        articleStatusLogs: [...newLogs, ...state.articleStatusLogs],
        notifications: [...newNotifs, ...state.notifications]
      };
    }

    case 'CHANGE_ARTICLE_CATEGORY': {
      const { articleId, newCategoryId, reason } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const oldGenre = state.genres.find(g => g.id === (art.category_id || art.genre_id));
      const newGenre = state.genres.find(g => g.id === newCategoryId);

      const updatedArticles = state.articles.map(a =>
        a.id === articleId
          ? { ...a, category_id: newCategoryId, genre_id: newCategoryId, updated_at: nowStr }
          : a
      );

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: 'Đổi thể loại tác phẩm',
        from_status: art.status,
        to_status: art.status,
        actor_id: state.currentUser.id,
        note: `BTV ${state.currentUser.full_name} đổi thể loại từ "${oldGenre?.name || 'Chưa xác định'}" sang "${newGenre?.name || 'Mới'}". Lý do: ${reason}`,
        created_at: nowStr
      };

      return {
        ...state,
        articles: updatedArticles,
        articleStatusLogs: [newLog, ...state.articleStatusLogs]
      };
    }

    case 'SCORE_ARTICLE': {
      const { articleId, criteria, criteriaScores, criteriaSetVersion, note, action: scoreAction, newCategoryId } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      // Tính tổng điểm theo thang 100 từ criteriaScores, làm tròn 1 chữ số thập phân
      let totalScore = 0;
      let qualityFactor = 0.8;
      let qualityTier = 'Đạt';

      if (criteriaScores && criteriaScores.length > 0) {
        const weightedSum = criteriaScores.reduce((sum, item) => {
          const wScore = item.weighted_score !== undefined
            ? item.weighted_score
            : (item.score * (item.weight || 0)) / 100;
          return sum + wScore;
        }, 0);
        totalScore = Math.round(weightedSum * 10) / 10;
      } else if (criteria) {
        totalScore = 80;
      }

      // Bậc tham khảo: ≥ 90 Xuất sắc, 70–89 Khá, < 70 Đạt
      if (totalScore >= 90) {
        qualityTier = 'Xuất sắc';
        qualityFactor = 1.25;
      } else if (totalScore >= 70) {
        qualityTier = 'Khá';
        qualityFactor = 1.0;
      } else {
        qualityTier = 'Đạt';
        qualityFactor = 0.8;
      }

      const effectiveGenreId = newCategoryId || art.category_id || art.genre_id;
      const effectiveVersion = criteriaSetVersion || 1;

      // Cập nhật used_count của bộ tiêu chí
      const updatedCriteriaSets = state.criteriaSets.map(cs => {
        if (cs.genre_id === effectiveGenreId && cs.version === effectiveVersion) {
          return { ...cs, used_count: (cs.used_count || 0) + 1 };
        }
        return cs;
      });

      // Quyết định và trạng thái tiếp theo
      const decision: 'ACCEPT' | 'RETURN' | 'REJECT' =
        (scoreAction === 'NHAN' || scoreAction === 'DAT') ? 'ACCEPT' :
        (scoreAction === 'TRA_VE' || scoreAction === 'YEU_CAU_SUA') ? 'RETURN' : 'REJECT';

      let nextStatus: ArticleStatusCode = 'PENDING_APPROVAL';
      let actionLabel = `Chấm điểm chất lượng: ${totalScore}/100 (${qualityTier}) - Chờ Trưởng ban duyệt`;
      if (decision === 'RETURN') {
        nextStatus = 'REVISION_REQUESTED';
        actionLabel = `Trả về: Yêu cầu phóng viên chỉnh sửa (${totalScore}/100 điểm)`;
      } else if (decision === 'REJECT') {
        nextStatus = 'REJECTED';
        actionLabel = `Từ chối bài viết (${totalScore}/100 điểm)`;
      }

      // Tạo ScoringAttempt mới (Lần 1, lần 2..., không ghi đè)
      const existingAttempts = state.scoringAttempts.filter(sa => sa.article_id === articleId);
      const attemptNo = existingAttempts.length + 1;

      const newAttempt: ScoringAttempt = {
        id: 'sa-' + Date.now(),
        article_id: articleId,
        attempt_no: attemptNo,
        scorer_id: state.currentUser.id,
        scorer_type: 'PRIMARY',
        total_score: totalScore,
        note: note || '',
        decision,
        criteria_set_version: effectiveVersion,
        criteria_scores: criteriaScores || [],
        scored_at: nowStr,
        is_effective: decision === 'ACCEPT'
      };

      const updatedAttempts = [
        newAttempt,
        ...state.scoringAttempts.map(sa =>
          sa.article_id === articleId ? { ...sa, is_effective: false } : sa
        )
      ];

      const newQualityScore: QualityScore = {
        id: 'qs-' + Date.now(),
        article_id: articleId,
        editor_id: state.currentUser.id,
        criteria_set_version: effectiveVersion,
        criteria_scores: criteriaScores || [],
        criteria_json: criteria,
        total_score: totalScore,
        quality_factor: qualityFactor,
        quality_tier: qualityTier,
        note,
        scored_at: nowStr
      };

      const updatedArticles = state.articles.map(a => {
        if (a.id === articleId) {
          return {
            ...a,
            category_id: effectiveGenreId,
            genre_id: effectiveGenreId,
            status: nextStatus,
            updated_at: nowStr
          };
        }
        return a;
      });

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: actionLabel,
        from_status: art.status,
        to_status: nextStatus,
        actor_id: state.currentUser.id,
        note: note || `BTV hoàn tất chấm điểm chất lượng lần ${attemptNo}: ${totalScore}/100 điểm (${qualityTier})`,
        created_at: nowStr
      };

      const newNotif: Notification = {
        id: 'notif-' + Date.now(),
        user_id: art.author_id,
        message: decision === 'ACCEPT'
          ? `Bài viết "${art.title}" đã được BTV chấm đạt ${totalScore}/100 điểm (${qualityTier}) và gửi Trưởng ban duyệt điểm.`
          : decision === 'RETURN'
            ? `BTV yêu cầu chỉnh sửa bài viết "${art.title}" (${totalScore}/100 điểm): ${note}`
            : `Bài viết "${art.title}" đã bị từ chối (${totalScore}/100 điểm). Lý do: ${note}`,
        link: decision === 'RETURN' ? `/reporter/articles/${art.id}/edit` : `/articles/${art.id}`,
        is_read: false,
        created_at: nowStr
      };

      return {
        ...state,
        articles: updatedArticles,
        criteriaSets: updatedCriteriaSets,
        scoringAttempts: updatedAttempts,
        qualityScores: [newQualityScore, ...state.qualityScores.filter(q => q.article_id !== articleId)],
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [newNotif, ...state.notifications]
      };
    }

    case 'APPROVE_SCORE': {
      const { articleId, note, scorePublishedAt, complaintDeadline } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const pubTime = scorePublishedAt || nowStr;
      // Hạn khiếu nại = công bố + 7 ngày
      const pubDate = new Date(pubTime.replace(' ', 'T'));
      const deadlineDate = new Date(pubDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      const defaultDeadlineStr = `${String(deadlineDate.getDate()).padStart(2, '0')}/${String(deadlineDate.getMonth() + 1).padStart(2, '0')}/${deadlineDate.getFullYear()}`;
      const deadline = complaintDeadline || defaultDeadlineStr;

      const effectiveScore = state.qualityScores.find(q => q.article_id === articleId)?.total_score || 78;

      const updatedArticles = state.articles.map(a =>
        a.id === articleId
          ? {
              ...a,
              status: 'SCORE_PUBLISHED' as ArticleStatusCode,
              score_published_at: pubTime,
              updated_at: nowStr
            }
          : a
      );

      const updatedAttempts = state.scoringAttempts.map(sa => {
        if (sa.article_id === articleId && (sa.is_effective || sa.decision === 'ACCEPT')) {
          return {
            ...sa,
            score_published_at: pubTime,
            complaint_deadline: deadline
          };
        }
        return sa;
      });

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: 'Duyệt & Công bố điểm chất lượng',
        from_status: 'PENDING_APPROVAL',
        to_status: 'SCORE_PUBLISHED',
        actor_id: state.currentUser.id,
        note: note || `Trưởng ban phê duyệt điểm (${effectiveScore}/100), công bố điểm và mở thời hạn khiếu nại đến ${deadline}`,
        created_at: nowStr
      };

      const articleAuthors = state.articleAuthors.filter(aa => aa.article_id === articleId);
      const notifs: Notification[] = [
        {
          id: 'notif-' + Date.now() + '-main',
          user_id: art.author_id,
          message: `Điểm chất lượng bài viết "${art.title}" đã được Trưởng ban phê duyệt (${effectiveScore}/100 điểm). Thời hạn gửi khiếu nại đến ${deadline}.`,
          link: `/reporter/articles/${art.id}/score`,
          is_read: false,
          created_at: nowStr
        },
        ...articleAuthors.filter(aa => !aa.is_main).map((aa, idx) => ({
          id: 'notif-' + Date.now() + '-co-' + idx,
          user_id: aa.user_id,
          message: `Điểm chất lượng bài viết "${art.title}" (đồng tác giả) đã được công bố (${effectiveScore}/100 điểm). Hạn khiếu nại đến ${deadline}.`,
          link: `/reporter/articles/${art.id}/score`,
          is_read: false,
          created_at: nowStr
        }))
      ];

      return {
        ...state,
        articles: updatedArticles,
        scoringAttempts: updatedAttempts,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...notifs, ...state.notifications]
      };
    }

    case 'REQUEST_RESCORE': {
      const { articleId, reason } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const updatedArticles = state.articles.map(a =>
        a.id === articleId
          ? {
              ...a,
              status: 'ASSIGNED' as ArticleStatusCode,
              updated_at: nowStr
            }
          : a
      );

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: 'Trưởng ban yêu cầu chấm lại',
        from_status: 'PENDING_APPROVAL',
        to_status: 'ASSIGNED',
        actor_id: state.currentUser.id,
        note: reason,
        created_at: nowStr
      };

      const notifs: Notification[] = [];
      if (art.editor_id) {
        notifs.push({
          id: 'notif-' + Date.now() + '-ed',
          user_id: art.editor_id,
          message: `Trưởng ban yêu cầu chấm lại bài viết "${art.title}". Lý do: ${reason}`,
          link: `/editor/score/${art.id}`,
          is_read: false,
          created_at: nowStr
        });
      }

      return {
        ...state,
        articles: updatedArticles,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...notifs, ...state.notifications]
      };
    }

    case 'SUBMIT_APPEAL': {
      const { articleId, appealedCriteriaIds, reason } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      // Không cho khiếu nại nhiều lần (tối đa 1 lần/bài)
      if (state.appeals.some(ap => ap.article_id === articleId)) {
        return state;
      }

      const qualityScore = state.qualityScores.find(q => q.article_id === articleId);
      const latestAttempt = state.scoringAttempts.find(sa => sa.article_id === articleId && sa.is_effective)
        || state.scoringAttempts.filter(sa => sa.article_id === articleId)[0];
      const originalScore = latestAttempt?.total_score || qualityScore?.total_score || 78;
      const originalScorerId = latestAttempt?.scorer_id || art.editor_id || 'u-cuong-btv';
      const criteriaVersion = latestAttempt?.criteria_set_version || qualityScore?.criteria_set_version || 2;

      // Tự động phân công BTV chấm lại: BTV != người chấm đầu, != tác giả/đồng tác giả
      const authors = state.articleAuthors.filter(aa => aa.article_id === articleId);
      const authorIds = [art.author_id, ...authors.map(a => a.user_id)];

      const candidateEditors = state.users.filter(u =>
        u.role_code === 'BIEN_TAP_VIEN' &&
        u.id !== originalScorerId &&
        !authorIds.includes(u.id)
      );

      // Ưu tiên BTV cùng ban
      const sameSectionEditors = candidateEditors.filter(u => u.section_id === art.section_id);
      let assignedEditor = sameSectionEditors[0];
      let isExternal = false;

      // Thiếu BTV trong ban thì lấy BTV ban khác
      if (!assignedEditor) {
        assignedEditor = candidateEditors[0];
        isExternal = true;
      }

      const newAppeal: Appeal = {
        id: 'app-' + Date.now(),
        article_id: articleId,
        author_id: state.currentUser.id,
        appealed_criteria_ids: appealedCriteriaIds,
        reason,
        status: 'IN_RESCORE',
        original_score: originalScore,
        original_scorer_id: originalScorerId,
        criteria_set_version: criteriaVersion,
        rescore_editor_id: assignedEditor?.id,
        is_external_editor: isExternal,
        created_at: nowStr
      };

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: 'Phóng viên gửi khiếu nại chất lượng tác phẩm',
        from_status: art.status,
        to_status: art.status,
        actor_id: state.currentUser.id,
        note: `Khiếu nại các tiêu chí: ${appealedCriteriaIds.join(', ')}. Hệ thống tự động phân công BTV ${assignedEditor?.full_name || 'chấm lại'}${isExternal ? ' (BTV ngoài ban)' : ''} chấm mù.`,
        created_at: nowStr
      };

      const notifs: Notification[] = [];
      if (assignedEditor) {
        notifs.push({
          id: 'notif-' + Date.now() + '-editor',
          user_id: assignedEditor.id,
          message: `Hệ thống tự động giao bạn chấm lại mù bài viết "${art.title}" do phóng viên khiếu nại chất lượng.`,
          link: `/editor/rescore/${newAppeal.id}`,
          is_read: false,
          created_at: nowStr
        });
      }

      return {
        ...state,
        appeals: [newAppeal, ...state.appeals],
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...notifs, ...state.notifications]
      };
    }

    case 'SUBMIT_BLIND_RESCORE': {
      const { appealId, criteriaScores, note } = action.payload;
      const targetAppeal = state.appeals.find(ap => ap.id === appealId);
      if (!targetAppeal) return state;

      const art = state.articles.find(a => a.id === targetAppeal.article_id);
      if (!art) return state;

      // Tính tổng điểm chấm lại (thang 100, làm tròn 1 số thập phân)
      const weightedSum = criteriaScores.reduce((sum, item) => {
        const wScore = item.weighted_score !== undefined
          ? item.weighted_score
          : (item.score * (item.weight || 0)) / 100;
        return sum + wScore;
      }, 0);
      const rescoreTotal = Math.round(weightedSum * 10) / 10;

      // Tạo ScoringAttempt mới với scorer_type = 'APPEAL'
      const existingAttempts = state.scoringAttempts.filter(sa => sa.article_id === targetAppeal.article_id);
      const newAttemptId = 'sa-' + Date.now();
      const newAttempt: ScoringAttempt = {
        id: newAttemptId,
        article_id: targetAppeal.article_id,
        attempt_no: existingAttempts.length + 1,
        scorer_id: state.currentUser.id,
        scorer_type: 'APPEAL',
        total_score: rescoreTotal,
        note: note || 'BTV chấm lại theo khiếu nại chất lượng (chấm mù)',
        decision: 'ACCEPT',
        criteria_set_version: targetAppeal.criteria_set_version,
        criteria_scores: criteriaScores,
        scored_at: nowStr,
        is_effective: false
      };

      // Đánh giá theo quy tắc:
      // 1. Điểm chấm lại >= điểm cũ -> Áp dụng điểm mới
      // 2. Thấp hơn và lệch <= 5 điểm -> Giữ điểm cũ (sai số chấm)
      // 3. Thấp hơn và lệch > 5 điểm -> Tự giao BTV thứ ba chấm mù
      let nextStatus: AppealStatus = 'RESOLVED';
      let rule: AppealResolutionRule = 'NEW_SCORE_APPLIED';
      let finalScore = rescoreTotal;
      let resolutionNote = '';
      let thirdEditorId: string | undefined = undefined;
      let isThirdExternal = false;
      const notifs: Notification[] = [];

      const authors = state.articleAuthors.filter(aa => aa.article_id === targetAppeal.article_id);
      const authorIds = [art.author_id, ...authors.map(a => a.user_id)];

      if (rescoreTotal >= targetAppeal.original_score) {
        rule = 'NEW_SCORE_APPLIED';
        finalScore = rescoreTotal;
        nextStatus = 'RESOLVED';
        resolutionNote = `Điểm chấm lại (${rescoreTotal}) ≥ điểm cũ (${targetAppeal.original_score}). Hệ thống áp dụng điểm chấm lại ${rescoreTotal} làm điểm hiệu lực.`;
        newAttempt.is_effective = true;
      } else if ((targetAppeal.original_score - rescoreTotal) <= 5) {
        rule = 'ORIGINAL_RETAINED_WITHIN_TOLERANCE';
        finalScore = targetAppeal.original_score;
        nextStatus = 'RESOLVED';
        resolutionNote = `Điểm chấm lại (${rescoreTotal}) thấp hơn điểm cũ (${targetAppeal.original_score}) nhưng độ lệch là ${Math.round((targetAppeal.original_score - rescoreTotal) * 10) / 10} điểm (≤ 5 điểm). Giữ nguyên điểm cũ ${targetAppeal.original_score}.`;
      } else {
        nextStatus = 'IN_THIRD_REVIEW';
        // Tự tìm BTV thứ 3: != original, != rescore, != authors
        const candidate3 = state.users.filter(u =>
          u.role_code === 'BIEN_TAP_VIEN' &&
          u.id !== targetAppeal.original_scorer_id &&
          u.id !== state.currentUser.id &&
          !authorIds.includes(u.id)
        );
        const sameSec3 = candidate3.filter(u => u.section_id === art.section_id);
        const picked3 = sameSec3[0] || candidate3[0];
        thirdEditorId = picked3?.id;
        isThirdExternal = !sameSec3[0];
        resolutionNote = `Điểm chấm lại (${rescoreTotal}) thấp hơn và lệch ${Math.round((targetAppeal.original_score - rescoreTotal) * 10) / 10} điểm (> 5 điểm) so với điểm cũ (${targetAppeal.original_score}). Hệ thống tự động chuyển BTV thứ ba (${picked3?.full_name || 'BTV 3'}${isThirdExternal ? ' - ngoài ban' : ''}) chấm mù.`;

        if (picked3) {
          notifs.push({
            id: 'notif-' + Date.now() + '-third',
            user_id: picked3.id,
            message: `Hệ thống phân công bạn làm BTV thứ ba chấm mù bài viết "${art.title}" do độ lệch chấm lần 2 vượt quá 5 điểm.`,
            link: `/editor/rescore/${appealId}`,
            is_read: false,
            created_at: nowStr
          });
        }
      }

      // Cập nhật Appeal
      const updatedAppeals = state.appeals.map(ap => {
        if (ap.id === appealId) {
          return {
            ...ap,
            status: nextStatus,
            rescore_score: rescoreTotal,
            rescore_attempt_id: newAttemptId,
            rescore_date: nowStr,
            third_editor_id: thirdEditorId,
            is_third_external_editor: isThirdExternal,
            final_effective_score: nextStatus === 'RESOLVED' ? finalScore : undefined,
            resolution_rule: nextStatus === 'RESOLVED' ? rule : undefined,
            resolution_note: resolutionNote,
            resolved_at: nextStatus === 'RESOLVED' ? nowStr : undefined
          };
        }
        return ap;
      });

      // Cập nhật QualityScore nếu đã resolved
      let updatedQualityScores = state.qualityScores;
      if (nextStatus === 'RESOLVED') {
        const qualityTier = finalScore >= 90 ? 'Xuất sắc' : finalScore >= 70 ? 'Khá' : 'Đạt';
        const qualityFactor = finalScore >= 90 ? 1.25 : finalScore >= 70 ? 1.0 : 0.8;

        updatedQualityScores = state.qualityScores.map(qs => {
          if (qs.article_id === targetAppeal.article_id) {
            return {
              ...qs,
              total_score: finalScore,
              quality_tier: qualityTier,
              quality_factor: qualityFactor,
              criteria_scores: rule === 'NEW_SCORE_APPLIED' ? criteriaScores : qs.criteria_scores,
              note: `Cập nhật sau khiếu nại (${rule === 'NEW_SCORE_APPLIED' ? 'Áp dụng điểm chấm lại' : 'Giữ điểm cũ trong sai số'}): ${finalScore}/100 đ`
            };
          }
          return qs;
        });

        // Báo cho tác giả
        notifs.push({
          id: 'notif-' + Date.now() + '-author',
          user_id: art.author_id,
          message: `Khiếu nại bài viết "${art.title}" đã có kết quả. Điểm hiệu lực: ${finalScore}/100. ${resolutionNote}`,
          link: `/reporter/articles/${art.id}/score`,
          is_read: false,
          created_at: nowStr
        });
      }

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: targetAppeal.article_id,
        action: 'BTV hoàn tất chấm lại mù theo khiếu nại',
        from_status: art.status,
        to_status: art.status,
        actor_id: state.currentUser.id,
        note: `Điểm chấm lại: ${rescoreTotal}/100. Kết quả: ${resolutionNote}`,
        created_at: nowStr
      };

      const updatedAttempts = [
        newAttempt,
        ...state.scoringAttempts.map(sa => {
          if (sa.article_id === targetAppeal.article_id && rule === 'NEW_SCORE_APPLIED' && nextStatus === 'RESOLVED') {
            return { ...sa, is_effective: false };
          }
          return sa;
        })
      ];

      return {
        ...state,
        appeals: updatedAppeals,
        scoringAttempts: updatedAttempts,
        qualityScores: updatedQualityScores,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...notifs, ...state.notifications]
      };
    }

    case 'SUBMIT_THIRD_REVIEW': {
      const { appealId, criteriaScores, note } = action.payload;
      const targetAppeal = state.appeals.find(ap => ap.id === appealId);
      if (!targetAppeal) return state;

      const art = state.articles.find(a => a.id === targetAppeal.article_id);
      if (!art) return state;

      const weightedSum = criteriaScores.reduce((sum, item) => {
        const wScore = item.weighted_score !== undefined
          ? item.weighted_score
          : (item.score * (item.weight || 0)) / 100;
        return sum + wScore;
      }, 0);
      const thirdTotal = Math.round(weightedSum * 10) / 10;

      // Tính trung vị 3 lần chấm: [original, rescore, third]
      const scores = [targetAppeal.original_score, targetAppeal.rescore_score || 0, thirdTotal].sort((a, b) => a - b);
      const medianScore = scores[1];

      const existingAttempts = state.scoringAttempts.filter(sa => sa.article_id === targetAppeal.article_id);
      const newAttemptId = 'sa-' + Date.now();
      const newAttempt: ScoringAttempt = {
        id: newAttemptId,
        article_id: targetAppeal.article_id,
        attempt_no: existingAttempts.length + 1,
        scorer_id: state.currentUser.id,
        scorer_type: 'THIRD_EDITOR',
        total_score: thirdTotal,
        note: note || 'BTV thứ ba chấm mù độc lập',
        decision: 'ACCEPT',
        criteria_set_version: targetAppeal.criteria_set_version,
        criteria_scores: criteriaScores,
        scored_at: nowStr,
        is_effective: thirdTotal === medianScore
      };

      const resolutionNote = `BTV thứ ba chấm ${thirdTotal} điểm. Áp dụng quy tắc trung vị 3 lần chấm [${scores.join(', ')}]. Điểm hiệu lực là ${medianScore} điểm.`;

      const qualityTier = medianScore >= 90 ? 'Xuất sắc' : medianScore >= 70 ? 'Khá' : 'Đạt';
      const qualityFactor = medianScore >= 90 ? 1.25 : medianScore >= 70 ? 1.0 : 0.8;

      const updatedQualityScores = state.qualityScores.map(qs => {
        if (qs.article_id === targetAppeal.article_id) {
          return {
            ...qs,
            total_score: medianScore,
            quality_tier: qualityTier,
            quality_factor: qualityFactor,
            note: `Cập nhật điểm theo trung vị 3 lần chấm (${scores.join(', ')}): ${medianScore}/100 đ`
          };
        }
        return qs;
      });

      const updatedAppeals = state.appeals.map(ap => {
        if (ap.id === appealId) {
          return {
            ...ap,
            status: 'RESOLVED' as const,
            third_score: thirdTotal,
            third_attempt_id: newAttemptId,
            third_date: nowStr,
            final_effective_score: medianScore,
            resolution_rule: 'MEDIAN_OF_THREE' as const,
            resolution_note: resolutionNote,
            resolved_at: nowStr
          };
        }
        return ap;
      });

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: targetAppeal.article_id,
        action: 'BTV thứ ba hoàn tất chấm mù - Chốt điểm trung vị',
        from_status: art.status,
        to_status: art.status,
        actor_id: state.currentUser.id,
        note: resolutionNote,
        created_at: nowStr
      };

      const notifs: Notification[] = [
        {
          id: 'notif-' + Date.now() + '-author-third',
          user_id: art.author_id,
          message: `Khiếu nại bài viết "${art.title}" đã hoàn tất qua 3 vòng chấm mù. Điểm hiệu lực trung vị: ${medianScore}/100.`,
          link: `/reporter/articles/${art.id}/score`,
          is_read: false,
          created_at: nowStr
        }
      ];

      return {
        ...state,
        appeals: updatedAppeals,
        scoringAttempts: [newAttempt, ...state.scoringAttempts],
        qualityScores: updatedQualityScores,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...notifs, ...state.notifications]
      };
    }

    case 'CREATE_CROSS_REVIEW_BATCH': {
      const { name, startDate, endDate, genreId, sampleSize, editorIds, note } = action.payload;
      const batchId = 'crb-' + Date.now();

      const newBatch: CrossReviewBatch = {
        id: batchId,
        name,
        start_date: startDate,
        end_date: endDate,
        genre_id: genreId,
        sample_size: sampleSize,
        participating_editor_ids: editorIds,
        status: 'IN_PROGRESS',
        created_at: nowStr,
        created_by: state.currentUser.id,
        note: note || 'Đợt chấm chéo chỉ để đo độ lệch người chấm, KHÔNG làm đổi điểm bài.'
      };

      // Chọn mẫu các bài viết đã có điểm
      let eligibleArticles = state.articles.filter(a =>
        a.status === 'PUBLISHED' || a.status === 'SCORE_PUBLISHED'
      );
      if (genreId) {
        eligibleArticles = eligibleArticles.filter(a => (a.category_id || a.genre_id) === genreId);
      }
      const sampled = eligibleArticles.slice(0, sampleSize);

      const assignments: CrossReviewAssignment[] = sampled.map((art, idx) => {
        const originalScore = state.qualityScores.find(q => q.article_id === art.id)?.total_score || 80;
        const availableReviewers = editorIds.filter(eId => eId !== art.editor_id);
        const assignedReviewer = availableReviewers[idx % availableReviewers.length] || editorIds[0];

        return {
          id: `cra-${batchId}-${idx + 1}`,
          batch_id: batchId,
          article_id: art.id,
          original_scorer_id: art.editor_id || 'u-cuong-btv',
          original_score: originalScore,
          reviewer_id: assignedReviewer,
          status: 'PENDING'
        };
      });

      return {
        ...state,
        crossReviewBatches: [newBatch, ...state.crossReviewBatches],
        crossReviewAssignments: [...assignments, ...state.crossReviewAssignments]
      };
    }

    case 'SUBMIT_CROSS_REVIEW_EVALUATION': {
      const { assignmentId, reviewedScore, note } = action.payload;
      const targetAssign = state.crossReviewAssignments.find(a => a.id === assignmentId);
      if (!targetAssign) return state;

      const deviation = reviewedScore - targetAssign.original_score;

      const updatedAssignments = state.crossReviewAssignments.map(a =>
        a.id === assignmentId
          ? {
              ...a,
              reviewed_score: reviewedScore,
              deviation,
              status: 'COMPLETED' as const,
              completed_at: nowStr,
              note
            }
          : a
      );

      // Cập nhật thống kê độ lệch của BTV
      const reviewer = state.users.find(u => u.id === targetAssign.reviewer_id);
      const updatedStats = state.reviewerStats.map(stat => {
        if (stat.editor_id === targetAssign.reviewer_id) {
          const newAvgDev = Math.round(((stat.avg_deviation * stat.total_graded + deviation) / (stat.total_graded + 1)) * 10) / 10;
          return {
            ...stat,
            total_graded: stat.total_graded + 1,
            avg_deviation: newAvgDev,
            is_high_deviation: Math.abs(newAvgDev) > 5
          };
        }
        return stat;
      });

      return {
        ...state,
        crossReviewAssignments: updatedAssignments,
        reviewerStats: updatedStats
      };
    }

    case 'CREATE_CRITERIA_SET_VERSION': {
      const { genreId, criteria, note, autoActivate } = action.payload;
      const genreSets = state.criteriaSets.filter(cs => cs.genre_id === genreId);
      const nextVersion = genreSets.reduce((max, cs) => Math.max(max, cs.version), 0) + 1;

      const newSet: CriteriaSet = {
        id: `cs-${genreId}-v${nextVersion}`,
        genre_id: genreId,
        version: nextVersion,
        status: autoActivate ? 'ACTIVE' : 'DRAFT',
        criteria,
        created_at: nowStr,
        used_count: 0,
        note: note || `Phiên bản ${nextVersion}`
      };

      const updatedSets = state.criteriaSets.map(cs => {
        if (autoActivate && cs.genre_id === genreId && cs.status === 'ACTIVE') {
          return { ...cs, status: 'RETIRED' as const };
        }
        return cs;
      });

      return {
        ...state,
        criteriaSets: [newSet, ...updatedSets]
      };
    }

    case 'UPDATE_CRITERIA_SET': {
      const { id, criteria, note } = action.payload;
      const target = state.criteriaSets.find(cs => cs.id === id);
      if (!target || target.used_count > 0 || target.status !== 'DRAFT') {
        return state;
      }

      const updatedSets = state.criteriaSets.map(cs =>
        cs.id === id
          ? {
              ...cs,
              criteria,
              note: note !== undefined ? note : cs.note
            }
          : cs
      );

      return {
        ...state,
        criteriaSets: updatedSets
      };
    }

    case 'ACTIVATE_CRITERIA_SET_VERSION': {
      const { criteriaSetId } = action.payload;
      const target = state.criteriaSets.find(cs => cs.id === criteriaSetId);
      if (!target) return state;

      const updatedSets = state.criteriaSets.map(cs => {
        if (cs.genre_id === target.genre_id) {
          if (cs.id === criteriaSetId) {
            return { ...cs, status: 'ACTIVE' as const };
          }
          if (cs.status === 'ACTIVE') {
            return { ...cs, status: 'RETIRED' as const };
          }
        }
        return cs;
      });

      return {
        ...state,
        criteriaSets: updatedSets
      };
    }

    case 'EDIT_ARTICLE':
    case 'SAVE_EDITED_ARTICLE': {
      const { articleId, title, sapo, content, genreId } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const existingVersions = state.articleVersions.filter(v => v.article_id === articleId);
      const nextVersionNo = existingVersions.length + 1;

      const newVersion: ArticleVersion = {
        id: 'ver-' + Date.now(),
        article_id: articleId,
        version_no: nextVersionNo,
        title,
        sapo,
        content,
        genre_id: genreId || art.category_id,
        created_by: state.currentUser.id,
        created_at: nowStr
      };

      const updatedArticles = state.articles.map(a =>
        a.id === articleId
          ? {
              ...a,
              title,
              sapo,
              content,
              category_id: genreId || a.category_id,
              genre_id: genreId || a.genre_id,
              updated_at: nowStr
            }
          : a
      );

      return {
        ...state,
        articles: updatedArticles,
        articleVersions: [newVersion, ...state.articleVersions]
      };
    }

    case 'SUBMIT_FOR_PUBLISH':
    case 'SEND_FOR_PUBLISH_APPROVAL': {
      const { articleId, note } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const updatedArticles = state.articles.map(a =>
        a.id === articleId
          ? { ...a, status: 'PENDING_APPROVAL' as ArticleStatusCode, updated_at: nowStr }
          : a
      );

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: 'Gửi duyệt xuất bản',
        from_status: art.status,
        to_status: 'PENDING_APPROVAL',
        actor_id: state.currentUser.id,
        note: note || 'Biên tập viên gửi Trưởng ban duyệt xuất bản bài viết',
        created_at: nowStr
      };

      const lead = state.users.find(u => u.role_code === 'TRUONG_BAN' && u.section_id === art.section_id)
        || state.users.find(u => u.role_code === 'TRUONG_BAN');

      const newNotif: Notification[] = lead ? [{
        id: 'notif-' + Date.now(),
        user_id: lead.id,
        message: `BTV ${state.currentUser.full_name} đã trình duyệt bài "${art.title}".`,
        link: '/editor-lead/publish-queue',
        is_read: false,
        created_at: nowStr
      }] : [];

      return {
        ...state,
        articles: updatedArticles,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...newNotif, ...state.notifications]
      };
    }

    case 'APPROVE_PUBLISH': {
      const payload = action.payload as any;
      const articleId = payload.articleId;
      const publishDateTime = payload.publishDateTime || payload.publishTime || nowStr;
      const note = payload.note;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const updatedArticles = state.articles.map(a =>
        a.id === articleId
          ? {
              ...a,
              status: 'PUBLISHED' as ArticleStatusCode,
              published_at: publishDateTime || nowStr,
              view_count: a.view_count || 100,
              updated_at: nowStr
            }
          : a
      );

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: 'Duyệt xuất bản bài viết',
        from_status: art.status,
        to_status: 'PUBLISHED',
        actor_id: state.currentUser.id,
        note: note || `Thời điểm đăng: ${publishDateTime || nowStr}`,
        created_at: nowStr
      };

      const newNotifs: Notification[] = [
        {
          id: 'notif-' + Date.now() + '-1',
          user_id: art.author_id,
          message: `Bài viết "${art.title}" của bạn đã được xuất bản!`,
          link: `/articles/${art.id}`,
          is_read: false,
          created_at: nowStr
        },
        {
          id: 'notif-' + Date.now() + '-2',
          user_id: (state.users.find(u => u.role_code === 'THU_KY')?.id || 'u-toan'),
          message: `Bài mới xuất bản "${art.title}" đã sẵn sàng tính nhuận bút.`,
          link: `/secretary/royalty-queue`,
          is_read: false,
          created_at: nowStr
        }
      ];

      return {
        ...state,
        articles: updatedArticles,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...newNotifs, ...state.notifications]
      };
    }

    case 'REJECT_BACK_TO_EDITOR':
    case 'REJECT_PUBLISH_TO_EDITOR': {
      const { articleId, reason } = action.payload;
      const art = state.articles.find(a => a.id === articleId);
      if (!art) return state;

      const updatedArticles = state.articles.map(a =>
        a.id === articleId
          ? { ...a, status: 'ASSIGNED' as ArticleStatusCode, updated_at: nowStr }
          : a
      );

      const newLog: ArticleStatusLog = {
        id: 'log-' + Date.now(),
        article_id: articleId,
        action: 'Trả lại biên tập viên',
        from_status: art.status,
        to_status: 'ASSIGNED',
        actor_id: state.currentUser.id,
        note: reason,
        created_at: nowStr
      };

      const newNotifs: Notification[] = art.editor_id ? [{
        id: 'notif-' + Date.now(),
        user_id: art.editor_id,
        message: `Trưởng ban trả lại bài "${art.title}": ${reason}`,
        link: `/editor/score/${art.id}`,
        is_read: false,
        created_at: nowStr
      }] : [];

      return {
        ...state,
        articles: updatedArticles,
        articleStatusLogs: [newLog, ...state.articleStatusLogs],
        notifications: [...newNotifs, ...state.notifications]
      };
    }

    case 'CALCULATE_ROYALTY':
    case 'SAVE_ROYALTY_ITEM': {
      const itemData = action.payload as any;
      const articleId = itemData.article_id || itemData.articleId;
      const existingIdx = state.royaltyItems.findIndex(r => r.article_id === articleId);
      let updatedRoyaltyItems = [...state.royaltyItems];

      const formattedItem: RoyaltyItem = {
        id: itemData.id || ('ri-' + Date.now()),
        article_id: articleId,
        period_id: itemData.period_id || itemData.periodId || state.royaltyPeriods[0]?.id || 'per-2026-09',
        base_price: itemData.base_price ?? itemData.baseUnitPrice ?? itemData.base_unit_price ?? 253000,
        base_unit_price: itemData.base_unit_price ?? itemData.baseUnitPrice ?? itemData.base_price ?? 253000,
        genre_factor: itemData.genre_factor ?? itemData.genreFactor ?? 15,
        quality_factor: itemData.quality_factor ?? itemData.qualityFactor ?? 1.0,
        media_bonus: itemData.media_bonus ?? itemData.mediaBonus ?? 0,
        photo_count: itemData.photo_count ?? itemData.photoCount ?? 0,
        video_count: itemData.video_count ?? itemData.videoCount ?? 0,
        photo_unit_price: itemData.photo_unit_price ?? itemData.photoUnitPrice ?? 75900,
        video_unit_price: itemData.video_unit_price ?? itemData.videoUnitPrice ?? 253000,
        amount: itemData.amount ?? itemData.totalRoyalty ?? itemData.total_royalty ?? 3795000,
        total_royalty: itemData.total_royalty ?? itemData.totalRoyalty ?? itemData.amount ?? 3795000,
        status: itemData.status || 'CHO_CHOT',
        note: itemData.note || ''
      };

      if (existingIdx >= 0) {
        updatedRoyaltyItems[existingIdx] = {
          ...updatedRoyaltyItems[existingIdx],
          ...formattedItem
        };
      } else {
        updatedRoyaltyItems.unshift(formattedItem);
      }

      const periodId = formattedItem.period_id;
      const periodTotal = updatedRoyaltyItems
        .filter(r => r.period_id === periodId)
        .reduce((sum, r) => sum + r.amount, 0);

      const updatedPeriods = state.royaltyPeriods.map(p =>
        p.id === periodId ? { ...p, total_amount: periodTotal } : p
      );

      return {
        ...state,
        royaltyItems: updatedRoyaltyItems,
        royaltyPeriods: updatedPeriods
      };
    }

    case 'CLOSE_PERIOD': {
      const { periodId } = action.payload;
      const period = state.royaltyPeriods.find(p => p.id === periodId);
      if (!period || period.status === 'LOCKED' || period.status === 'PAID') return state;

      const itemsInPeriod = state.royaltyItems.filter(r => r.period_id === periodId);
      const linesInPeriod = state.royaltyLines.filter(l => l.period_id === periodId);
      const totalAmount = linesInPeriod.length > 0
        ? linesInPeriod.reduce((sum, l) => sum + l.amount, 0)
        : itemsInPeriod.reduce((sum, r) => sum + r.amount, 0);

      const updatedPeriods = state.royaltyPeriods.map(p =>
        p.id === periodId
          ? {
              ...p,
              status: 'CLOSED' as const,
              total_amount: totalAmount,
              closed_by: state.currentUser.id,
              closed_at: nowStr
            }
          : p
      );

      const updatedRoyaltyItems = state.royaltyItems.map(r =>
        r.period_id === periodId ? { ...r, status: 'DA_DUYET' as const } : r
      );

      const accountant = state.users.find(u => u.role_code === 'KE_TOAN');
      const newNotif: Notification[] = accountant ? [{
        id: 'notif-' + Date.now(),
        user_id: accountant.id,
        message: `Thư ký đã chốt kỳ nhuận bút tháng ${period.month}/${period.year}. Vui lòng kiểm tra báo cáo và khóa kỳ.`,
        link: `/accounting/periods/${period.id}`,
        is_read: false,
        created_at: nowStr
      }] : [];

      return {
        ...state,
        royaltyPeriods: updatedPeriods,
        royaltyItems: updatedRoyaltyItems,
        notifications: [...newNotif, ...state.notifications]
      };
    }

    case 'RETURN_PERIOD':
    case 'REOPEN_PERIOD': {
      const { periodId, reason } = action.payload;
      const period = state.royaltyPeriods.find(p => p.id === periodId);
      if (!period || period.status === 'LOCKED' || period.status === 'PAID') {
        return state;
      }

      const updatedPeriods = state.royaltyPeriods.map(p =>
        p.id === periodId
          ? {
              ...p,
              status: 'OPEN' as const,
              return_reason: reason,
              closed_by: undefined,
              closed_at: undefined
            }
          : p
      );

      const updatedRoyaltyItems = state.royaltyItems.map(r =>
        r.period_id === periodId ? { ...r, status: 'CHO_CHOT' as const } : r
      );

      const secretary = state.users.find(u => u.role_code === 'THU_KY');
      const newNotif: Notification[] = secretary ? [{
        id: 'notif-' + Date.now(),
        user_id: secretary.id,
        message: `Kế toán đã trả lại kỳ nhuận bút tháng ${period.month}/${period.year}. Lý do: ${reason}`,
        link: `/secretary/royalty-periods/${period.id}`,
        is_read: false,
        created_at: nowStr
      }] : [];

      return {
        ...state,
        royaltyPeriods: updatedPeriods,
        royaltyItems: updatedRoyaltyItems,
        notifications: [...newNotif, ...state.notifications]
      };
    }

    case 'LOCK_PERIOD': {
      const { periodId } = action.payload;
      const period = state.royaltyPeriods.find(p => p.id === periodId);
      if (!period || period.status === 'LOCKED' || period.status === 'PAID') {
        return state;
      }

      const linesInPeriod = state.royaltyLines.filter(l => l.period_id === periodId);
      
      // Nhóm theo người thụ hưởng
      const recipientMap: Record<string, {
        userId: string;
        articleAmount: number;
        mediaAmount: number;
        adjustmentAmount: number;
        total: number;
        articleIds: Set<string>;
      }> = {};

      linesInPeriod.forEach(l => {
        if (!recipientMap[l.recipient_id]) {
          recipientMap[l.recipient_id] = {
            userId: l.recipient_id,
            articleAmount: 0,
            mediaAmount: 0,
            adjustmentAmount: 0,
            total: 0,
            articleIds: new Set<string>()
          };
        }
        const rec = recipientMap[l.recipient_id];
        if (l.line_type === 'ARTICLE') {
          rec.articleAmount += l.amount;
        } else if (l.line_type === 'MEDIA') {
          rec.mediaAmount += l.amount;
        } else if (l.line_type === 'ADJUSTMENT') {
          rec.adjustmentAmount += l.amount;
        }
        rec.total += l.amount;
        if (l.article_id) rec.articleIds.add(l.article_id);
      });

      // Tạo phiếu chi cho mỗi người: Phiếu chi KHÔNG BAO GIỜ ÂM
      const newVouchers: PaymentVoucher[] = Object.values(recipientMap).map(rec => {
        const user = state.users.find(u => u.id === rec.userId);
        const isNegative = rec.total < 0;
        const actualPayAmount = isNegative ? 0 : rec.total;
        const carriedForward = isNegative ? Math.abs(rec.total) : 0;

        // Tính ngày xuất bản sớm nhất của các bài để cảnh báo hạn chi (60 ngày)
        let maxDaysSincePub = 0;
        rec.articleIds.forEach(artId => {
          const art = state.articles.find(a => a.id === artId);
          if (art && art.published_at) {
            const pubDate = new Date(art.published_at.replace(' ', 'T'));
            const diffDays = Math.floor((new Date(DEMO_TODAY).getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays > maxDaysSincePub) maxDaysSincePub = diffDays;
          }
        });

        const deadlineWarning: 'NORMAL' | 'WARNING_45' | 'OVERDUE_60' =
          maxDaysSincePub > 60 ? 'OVERDUE_60' : maxDaysSincePub >= 45 ? 'WARNING_45' : 'NORMAL';

        return {
          id: 'pv-' + periodId + '-' + rec.userId,
          voucher_no: `PC-${period.year}${String(period.month).padStart(2, '0')}-${String(Math.floor(Math.random() * 900) + 100)}`,
          period_id: periodId,
          user_id: rec.userId,
          recipient_id: rec.userId,
          amount: actualPayAmount,
          total_amount: actualPayAmount,
          article_amount: rec.articleAmount,
          media_amount: rec.mediaAmount,
          adjustment_amount: rec.adjustmentAmount,
          carried_forward: carriedForward,
          tax_deduction: 0, // Bỏ thuế TNCN theo yêu cầu đề bài
          net_amount: actualPayAmount,
          payment_method: 'CHUYEN_KHOAN',
          bank_account_info: {
            bank_name: user?.role_code === 'PHONG_VIEN' ? 'Vietcombank - CN Ba Đình' : 'BIDV - CN Hà Nội',
            account_number: '001100' + rec.userId.replace(/[^0-9]/g, '1234'),
            account_name: (user?.full_name || 'NGUYEN VAN A').toUpperCase()
          },
          note: `Nhuận bút kỳ ${period.month}/${period.year} - ${user?.full_name || 'Phóng viên'}${carriedForward > 0 ? ` (Chuyển kỳ sau: -${carriedForward.toLocaleString('vi-VN')} đ)` : ''}`,
          is_paid: false,
          status: 'CHUA_CHI',
          days_since_published: maxDaysSincePub,
          deadline_warning: deadlineWarning,
          created_at: nowStr
        };
      });

      const totalPeriodAmount = newVouchers.reduce((sum, v) => sum + v.amount, 0);

      const updatedPeriods = state.royaltyPeriods.map(p =>
        p.id === periodId
          ? {
              ...p,
              status: 'LOCKED' as const,
              total_amount: totalPeriodAmount,
              locked_by: state.currentUser.id,
              locked_at: nowStr
            }
          : p
      );

      return {
        ...state,
        royaltyPeriods: updatedPeriods,
        paymentVouchers: [
          ...state.paymentVouchers.filter(pv => pv.period_id !== periodId),
          ...newVouchers
        ]
      };
    }

    case 'CREATE_ROYALTY_PERIOD': {
      const { month, year } = action.payload;
      const code = `NB-${year}-${String(month).padStart(2, '0')}`;
      const existing = state.royaltyPeriods.find(p => p.month === month && p.year === year);
      if (existing) return state;

      const newPeriod: RoyaltyPeriod = {
        id: `per-${year}-${String(month).padStart(2, '0')}`,
        code,
        period_code: code,
        name: `Kỳ nhuận bút tháng ${String(month).padStart(2, '0')}/${year}`,
        month,
        year,
        status: 'OPEN',
        total_amount: 0
      };

      return {
        ...state,
        royaltyPeriods: [...state.royaltyPeriods, newPeriod]
      };
    }

    case 'PAY_VOUCHER': {
      const { voucherId, paymentMethod } = action.payload as any;
      const targetVoucher = state.paymentVouchers.find(v => v.id === voucherId);
      if (!targetVoucher) return state;

      const updatedVouchers = state.paymentVouchers.map(v =>
        v.id === voucherId
          ? {
              ...v,
              is_paid: true,
              paid_at: nowStr,
              payment_method: paymentMethod || v.payment_method || 'CHUYEN_KHOAN',
              status: 'DA_CHI' as const
            }
          : v
      );

      // Kiểm tra nếu tất cả phiếu chi của kỳ này đã chi -> tự động chuyển kỳ sang PAID
      const periodId = targetVoucher.period_id;
      const periodVouchers = updatedVouchers.filter(v => v.period_id === periodId);
      const allPaid = periodVouchers.length > 0 && periodVouchers.every(v => v.is_paid || v.status === 'DA_CHI');

      const updatedPeriods = state.royaltyPeriods.map(p =>
        p.id === periodId && allPaid
          ? {
              ...p,
              status: 'PAID' as const,
              paid_at: nowStr,
              paid_by: state.currentUser.id
            }
          : p
      );

      return {
        ...state,
        paymentVouchers: updatedVouchers,
        royaltyPeriods: updatedPeriods
      };
    }

    case 'PAY_ALL_PERIOD_VOUCHERS': {
      const { periodId } = action.payload;
      const updatedVouchers = state.paymentVouchers.map(v =>
        v.period_id === periodId ? { ...v, is_paid: true, paid_at: nowStr, status: 'DA_CHI' as const } : v
      );

      const updatedPeriods = state.royaltyPeriods.map(p =>
        p.id === periodId ? { ...p, status: 'PAID' as const, paid_at: nowStr, paid_by: state.currentUser.id } : p
      );

      const updatedRoyaltyItems = state.royaltyItems.map(r =>
        r.period_id === periodId ? { ...r, status: 'DA_CHI' as const } : r
      );

      return {
        ...state,
        paymentVouchers: updatedVouchers,
        royaltyPeriods: updatedPeriods,
        royaltyItems: updatedRoyaltyItems
      };
    }

    case 'SET_KPI_TARGETS': {
      const { targets } = action.payload;
      const keyOf = (t: KpiTarget) => `${t.user_id}|${t.month}|${t.year}`;
      const incoming = new Map(targets.map(t => [keyOf(t), t]));
      const kept = state.kpiTargets.filter(t => !incoming.has(keyOf(t)));
      return { ...state, kpiTargets: [...kept, ...targets] };
    }

    case 'COPY_KPI_TARGETS': {
      const { fromMonth, fromYear, toMonth, toYear, sectionId } = action.payload;
      const previousTargets = state.kpiTargets.filter(
        t => t.month === fromMonth && t.year === fromYear && (!sectionId || t.section_id === sectionId)
      );
      const newTargets: KpiTarget[] = previousTargets.map(pt => ({
        id: `kt-${toYear}-${String(toMonth).padStart(2, '0')}-${pt.user_id}`,
        section_id: pt.section_id,
        user_id: pt.user_id,
        month: toMonth,
        year: toYear,
        target_articles: pt.target_articles,
        target_quality: pt.target_quality,
        note: `Sao chép từ tháng ${String(fromMonth).padStart(2, '0')}/${fromYear}`,
        created_by: state.currentUser.id,
        created_at: nowStr
      }));
      const cleanTargets = state.kpiTargets.filter(
        t => !(t.month === toMonth && t.year === toYear && (!sectionId || t.section_id === sectionId))
      );
      return { ...state, kpiTargets: [...cleanTargets, ...newTargets] };
    }

    case 'FINALIZE_KPI_MONTH': {
      const { sectionId, month, year, snapshots } = action.payload;
      const already = state.kpiMonthCloses.some(c => c.section_id === sectionId && c.month === month && c.year === year);
      if (already) return state;
      const notifs: Notification[] = snapshots.map((sn, i) => ({
        id: `notif-kpi-${Date.now()}-${i}`,
        user_id: sn.user_id,
        message: `KPI ${String(month).padStart(2, '0')}/${year} đã chốt: ${sn.result === 'DAT' ? 'ĐẠT' : 'CHƯA ĐẠT'} (${sn.converted_articles.toLocaleString('vi-VN')} bài quy đổi).`,
        link: '/kpi/personal',
        is_read: false,
        created_at: nowStr
      }));
      return {
        ...state,
        kpiSnapshots: [
          ...state.kpiSnapshots.filter(k => !(k.section_id === sectionId && k.month === month && k.year === year)),
          ...snapshots
        ],
        kpiMonthCloses: [
          ...state.kpiMonthCloses,
          { id: `kc-${year}-${month}-${sectionId}`, section_id: sectionId, month, year, finalized_at: nowStr, finalized_by: state.currentUser.id }
        ],
        notifications: [...notifs, ...state.notifications]
      };
    }

    case 'IMPORT_READER_DATA': {
      const { rows, log } = action.payload;
      const keyOf = (r: ReaderDaily) => `${r.article_id}|${r.date}`;
      const incoming = new Map(rows.map(r => [keyOf(r), r]));
      const kept = state.readerDaily.filter(r => !incoming.has(keyOf(r)));
      return {
        ...state,
        readerDaily: [...kept, ...rows],
        readerImportLogs: [log, ...state.readerImportLogs]
      };
    }

    case 'ADD_GENRE': {
      const g = action.payload as any;
      const newGenre: Genre = {
        id: g.id || ('cat-' + Date.now()),
        code: g.code || 'GENRE',
        nd_group: g.nd_group || 1,
        name: g.name,
        description: g.description,
        base_factor: g.base_factor || g.min_factor || 5,
        max_factor: g.max_factor || 10,
        is_active: g.is_active ?? true,
        created_at: g.created_at || nowStr.split(' ')[0],
        updated_at: g.updated_at || nowStr.split(' ')[0]
      };
      return {
        ...state,
        genres: [...state.genres, newGenre]
      };
    }

    case 'UPDATE_GENRE': {
      const exists = state.genres.some(g => g.id === action.payload.id);
      if (!exists) {
        return {
          ...state,
          genres: [...state.genres, { ...action.payload, updated_at: nowStr.split(' ')[0] }]
        };
      }
      const updated = state.genres.map(g =>
        g.id === action.payload.id ? { ...action.payload, updated_at: nowStr.split(' ')[0] } : g
      );
      return {
        ...state,
        genres: updated
      };
    }

    case 'DEACTIVATE_GENRE': {
      const { genreId } = action.payload;
      const updated = state.genres.map(g =>
        g.id === genreId ? { ...g, is_active: false, updated_at: nowStr.split(' ')[0] } : g
      );
      return {
        ...state,
        genres: updated
      };
    }

    case 'ADD_ROYALTY_RATE': {
      const { base_salary, effective_from, legal_basis } = action.payload;
      const unit_rate = Math.round(base_salary * 0.1);
      const fromDate = new Date(effective_from);
      fromDate.setDate(fromDate.getDate() - 1);
      const prevDayStr = fromDate.toISOString().split('T')[0];

      const updatedRates = state.royaltyRates.map(r => {
        if (!r.effective_to || r.effective_to >= effective_from) {
          return { ...r, effective_to: prevDayStr };
        }
        return r;
      });

      const newRate: RoyaltyRate = {
        id: 'rr-' + Date.now(),
        effective_from,
        base_salary,
        unit_rate,
        legal_basis: legal_basis || `Nghị định tiền lương mới (Lương cơ sở ${base_salary.toLocaleString('vi-VN')} đ)`
      };

      // Đồng bộ vào unitPrices để tương thích ngược
      const newLegacyUnitPrice: UnitPrice = {
        id: 'up-' + Date.now(),
        amount: unit_rate,
        base_unit_price: unit_rate,
        photo_unit_price: Math.round(unit_rate * 0.3),
        video_unit_price: unit_rate,
        effective_from,
        effective_date: effective_from,
        is_active: true,
        note: newRate.legal_basis
      };

      const updatedUnitPrices = state.unitPrices.map(u => ({
        ...u,
        is_active: false,
        effective_to: u.effective_to || prevDayStr
      }));

      return {
        ...state,
        royaltyRates: [...updatedRates, newRate],
        unitPrices: [...updatedUnitPrices, newLegacyUnitPrice]
      };
    }

    case 'UPDATE_MEDIA_FACTORS': {
      return {
        ...state,
        mediaFactors: action.payload.mediaFactors
      };
    }

    case 'ADD_EVENT': {
      return {
        ...state,
        events: [action.payload, ...state.events]
      };
    }

    case 'UPDATE_EVENT': {
      return {
        ...state,
        events: state.events.map(ev => ev.id === action.payload.id ? action.payload : ev)
      };
    }

    case 'SAVE_ROYALTY_CALCULATION': {
      const { royaltyItem, royaltyLines } = action.payload;
      const articleId = royaltyItem.article_id;

      // Cập nhật royaltyItems
      const existingIdx = state.royaltyItems.findIndex(r => r.article_id === articleId);
      let updatedRoyaltyItems = [...state.royaltyItems];
      if (existingIdx >= 0) {
        updatedRoyaltyItems[existingIdx] = {
          ...updatedRoyaltyItems[existingIdx],
          ...royaltyItem
        };
      } else {
        updatedRoyaltyItems.unshift(royaltyItem);
      }

      // Cập nhật royaltyLines: lọc bỏ các dòng cũ của bài này (nếu có) rồi thêm các dòng mới
      const filteredLines = state.royaltyLines.filter(
        l => !(l.article_id === articleId && l.period_id === royaltyItem.period_id && !l.is_adjustment)
      );
      const updatedLines = [...filteredLines, ...royaltyLines];

      // Cập nhật tổng tiền kỳ
      const periodId = royaltyItem.period_id;
      const periodTotal = updatedLines
        .filter(l => l.period_id === periodId)
        .reduce((sum, l) => sum + l.amount, 0);

      const updatedPeriods = state.royaltyPeriods.map(p =>
        p.id === periodId ? { ...p, total_amount: periodTotal } : p
      );

      return {
        ...state,
        royaltyItems: updatedRoyaltyItems,
        royaltyLines: updatedLines,
        royaltyPeriods: updatedPeriods
      };
    }

    case 'ADD_UNIT_PRICE': {
      const up = action.payload as any;
      const newPrice: UnitPrice = {
        id: up.id || ('up-' + Date.now()),
        genre_id: up.genre_id,
        amount: up.amount ?? up.base_unit_price ?? 253000,
        base_unit_price: up.base_unit_price ?? 253000,
        photo_unit_price: up.photo_unit_price ?? 75900,
        video_unit_price: up.video_unit_price ?? 253000,
        effective_from: up.effective_from || up.effective_date || nowStr.split(' ')[0],
        effective_date: up.effective_date || up.effective_from || nowStr.split(' ')[0],
        is_active: up.is_active ?? true,
        note: up.note || ''
      };

      return {
        ...state,
        unitPrices: [...state.unitPrices, newPrice]
      };
    }

    case 'UPDATE_SYSTEM_PARAMETERS': {
      return {
        ...state,
        systemParameters: action.payload.parameters
      };
    }

    case 'UPDATE_SYSTEM_PARAMETER': {
      const { key, value } = action.payload;
      return {
        ...state,
        systemParameters: state.systemParameters.map(p =>
          p.key === key ? { ...p, value } : p
        )
      };
    }

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  currentUser: User;
  currentRole: RoleCode;
  dispatch: React.Dispatch<Action>;
  notify: (message: string, type?: ToastItem['type']) => void;
  switchRole: (role: RoleCode) => void;
  // Helpers
  getGenre: (genreId?: string) => Genre | undefined;
  getSection: (sectionId?: string) => Section | undefined;
  getUser: (userId?: string) => User | undefined;
  getUnitPriceForDate: (genreId: string, dateStr: string) => number;
  getActiveRoyaltyRate: (dateStr?: string) => RoyaltyRate;
  getArticleQualityScore: (articleId: string) => QualityScore | undefined;
  getArticleRoyaltyItem: (articleId: string) => RoyaltyItem | undefined;
  getArticleAttachments: (articleId: string) => ArticleAttachment[];
  getArticleAuthors: (articleId: string) => ArticleAuthor[];
  getArticleVersions: (articleId: string) => ArticleVersion[];
  getArticleLogs: (articleId: string) => ArticleStatusLog[];
  getArticleDuplicationMatch: (articleId: string) => DuplicationMatch | undefined;
  getEvent: (eventId?: string) => Event | undefined;
  getSystemParameter: (key: string, defaultValue?: any) => any;
  getActiveCriteriaSet: (genreId: string) => CriteriaSet | undefined;
  getCriteriaSetsForGenre: (genreId: string) => CriteriaSet[];
  getScoringAttempts: (articleId: string) => ScoringAttempt[];
  getEffectiveScoringAttempt: (articleId: string) => ScoringAttempt | undefined;
  getArticleAppeals: (articleId: string) => Appeal[];
  getAppealById: (appealId: string) => Appeal | undefined;
  getEditorAssignedAppeals: (editorId: string) => Appeal[];
  getCrossReviewBatches: () => CrossReviewBatch[];
  getCrossReviewAssignments: (batchId?: string) => CrossReviewAssignment[];
  getEffectiveScoreForArticle: (articleId: string) => number;
  getDaysSincePublished: (publishedAt?: string) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Hook hỗ trợ kiểm thử tự động / demo: đổi người dùng từ console trình duyệt
  React.useEffect(() => {
    (window as any).__demoSwitchUser = (userId: string) => dispatch({ type: 'SWITCH_USER', payload: userId });
  }, []);

  const notify = (message: string, type: ToastItem['type'] = 'success') => {
    dispatch({ type: 'ADD_TOAST', payload: { message, type } });
  };

  const switchRole = (role: RoleCode) => {
    dispatch({ type: 'SWITCH_ROLE', payload: role });
  };

  const getGenre = (genreId?: string) => genreId ? state.genres.find(g => g.id === genreId) : undefined;
  const getSection = (sectionId?: string) => sectionId ? state.sections.find(s => s.id === sectionId) : undefined;
  const getUser = (userId?: string) => userId ? state.users.find(u => u.id === userId) : undefined;

  const getActiveRoyaltyRate = (dateStr?: string): RoyaltyRate => {
    const d = dateStr ? dateStr.split(' ')[0] : new Date().toISOString().split('T')[0];
    const match = state.royaltyRates.find(r => {
      const matchFrom = !r.effective_from || r.effective_from <= d;
      const matchTo = !r.effective_to || r.effective_to >= d;
      return matchFrom && matchTo;
    });
    return match || state.royaltyRates[state.royaltyRates.length - 1];
  };

  const getUnitPriceForDate = (_genreId: string, dateStr: string): number => {
    return getActiveRoyaltyRate(dateStr).unit_rate;
  };

  const getArticleQualityScore = (articleId: string) =>
    state.qualityScores.find(q => q.article_id === articleId);

  const getArticleRoyaltyItem = (articleId: string) =>
    state.royaltyItems.find(r => r.article_id === articleId);

  const getArticleAttachments = (articleId: string) =>
    state.articleAttachments.filter(a => a.article_id === articleId);

  const getArticleAuthors = (articleId: string) =>
    state.articleAuthors.filter(a => a.article_id === articleId);

  const getArticleVersions = (articleId: string) =>
    state.articleVersions
      .filter(v => v.article_id === articleId)
      .sort((a, b) => b.version_no - a.version_no);

  const getArticleLogs = (articleId: string) =>
    state.articleStatusLogs
      .filter(l => l.article_id === articleId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getEvent = (eventId?: string) =>
    state.events.find(e => e.id === eventId);

  const getArticleDuplicationMatch = (articleId: string) =>
    state.duplicationMatches.find(d => d.article_id === articleId);

  const getSystemParameter = (key: string, defaultValue?: any) => {
    const param = state.systemParameters.find(p => p.key === key);
    return param?.value !== undefined ? param.value : defaultValue;
  };

  const getActiveCriteriaSet = (genreId: string): CriteriaSet | undefined => {
    return state.criteriaSets.find(cs => cs.genre_id === genreId && cs.status === 'ACTIVE')
      || state.criteriaSets.find(cs => cs.genre_id === genreId);
  };

  const getCriteriaSetsForGenre = (genreId: string): CriteriaSet[] => {
    return state.criteriaSets
      .filter(cs => cs.genre_id === genreId)
      .sort((a, b) => b.version - a.version);
  };

  const getScoringAttempts = (articleId: string): ScoringAttempt[] => {
    return state.scoringAttempts
      .filter(sa => sa.article_id === articleId)
      .sort((a, b) => b.attempt_no - a.attempt_no);
  };

  const getEffectiveScoringAttempt = (articleId: string): ScoringAttempt | undefined => {
    return state.scoringAttempts.find(sa => sa.article_id === articleId && sa.is_effective)
      || state.scoringAttempts.filter(sa => sa.article_id === articleId).sort((a, b) => b.attempt_no - a.attempt_no)[0];
  };

  const getArticleAppeals = (articleId: string): Appeal[] => {
    return state.appeals.filter(ap => ap.article_id === articleId);
  };

  const getAppealById = (appealId: string): Appeal | undefined => {
    return state.appeals.find(ap => ap.id === appealId);
  };

  const getEditorAssignedAppeals = (editorId: string): Appeal[] => {
    return state.appeals.filter(ap =>
      (ap.rescore_editor_id === editorId && ap.status === 'IN_RESCORE') ||
      (ap.third_editor_id === editorId && ap.status === 'IN_THIRD_REVIEW')
    );
  };

  const getCrossReviewBatches = (): CrossReviewBatch[] => {
    return state.crossReviewBatches;
  };

  const getCrossReviewAssignments = (batchId?: string): CrossReviewAssignment[] => {
    return batchId
      ? state.crossReviewAssignments.filter(a => a.batch_id === batchId)
      : state.crossReviewAssignments;
  };

  const getEffectiveScoreForArticle = (articleId: string): number => {
    // 1. Kiểm tra khiếu nại đã giải quyết (Luồng 03)
    const resolvedAppeal = state.appeals.find(
      ap => ap.article_id === articleId && ap.status === 'RESOLVED' && ap.final_effective_score !== undefined
    );
    if (resolvedAppeal && resolvedAppeal.final_effective_score !== undefined) {
      return resolvedAppeal.final_effective_score;
    }

    // 2. Kiểm tra lần chấm có is_effective
    const effectiveAttempt = state.scoringAttempts.find(
      sa => sa.article_id === articleId && sa.is_effective
    );
    if (effectiveAttempt) {
      return effectiveAttempt.total_score;
    }

    // 3. Kiểm tra qualityScore
    const qs = state.qualityScores.find(q => q.article_id === articleId);
    if (qs) {
      return qs.total_score;
    }

    return 75; // Điểm mặc định nếu chưa chấm
  };

  const getDaysSincePublished = (publishedAt?: string): number => {
    if (!publishedAt) return 0;
    const pubDate = new Date(publishedAt.split(' ')[0]);
    // Giả định thời điểm hiện tại của tòa soạn demo là cuối tháng 9/2026 (2026-09-29)
    const now = new Date(DEMO_TODAY);
    const diffTime = Math.max(0, now.getTime() - pubDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <AppContext.Provider
      value={{
        state,
        currentUser: state.currentUser,
        currentRole: state.currentRole,
        dispatch,
        notify,
        switchRole,
        getGenre,
        getSection,
        getUser,
        getUnitPriceForDate,
        getActiveRoyaltyRate,
        getArticleQualityScore,
        getArticleRoyaltyItem,
        getArticleAttachments,
        getArticleAuthors,
        getArticleVersions,
        getArticleLogs,
        getArticleDuplicationMatch,
        getEvent,
        getSystemParameter,
        getActiveCriteriaSet,
        getCriteriaSetsForGenre,
        getScoringAttempts,
        getEffectiveScoringAttempt,
        getArticleAppeals,
        getAppealById,
        getEditorAssignedAppeals,
        getCrossReviewBatches,
        getCrossReviewAssignments,
        getEffectiveScoreForArticle,
        getDaysSincePublished
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
