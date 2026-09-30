import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppLayout } from './components/layout/AppLayout';
import { EmptyState } from './components/common/EmptyState';
import { PageHeader } from './components/common/Header';

// Auth
import { MockLoginScreen } from './pages/auth/MockLoginScreen';

// Flow 1: Reporter
import { MyArticlesScreen } from './pages/flow1/MyArticlesScreen';
import { CreateEditArticleScreen } from './pages/flow1/CreateEditArticleScreen';
import { ArticleDetailHistoryScreen } from './pages/flow1/ArticleDetailHistoryScreen';
import { DuplicationResultScreen } from './pages/flow1/DuplicationResultScreen';
import { CoAuthorConfirmScreen } from './pages/flow1/CoAuthorConfirmScreen';

// Flow 2: Editor Lead & Editor
import { AssignmentQueueScreen } from './pages/flow2/AssignmentQueueScreen';
import { AssignEditorScreen } from './pages/flow2/AssignEditorScreen';
import { QualityScoringScreen } from './pages/flow2/QualityScoringScreen';
import { EditorWorkQueueScreen } from './pages/flow2/EditorWorkQueueScreen';
import { ScoreApprovalScreen } from './pages/flow2/ScoreApprovalScreen';
import { PublishApprovalScreen } from './pages/flow2/PublishApprovalScreen';
import { ScoringResultScreen } from './pages/flow2/ScoringResultScreen';

// Flow 3: Kiểm soát chất lượng chấm (Appeals & Quality Control)
import { ReporterAppealsScreen } from './pages/flow3/ReporterAppealsScreen';
import { BlindRescoreScreen } from './pages/flow3/BlindRescoreScreen';
import { LeadAppealsScreen } from './pages/flow3/LeadAppealsScreen';
import { ScoreComparisonScreen } from './pages/flow3/ScoreComparisonScreen';
import { CrossReviewBatchScreen } from './pages/flow3/CrossReviewBatchScreen';
import { ReviewerDeviationScreen } from './pages/flow3/ReviewerDeviationScreen';
import { ReviewerProfileScreen } from './pages/flow3/ReviewerProfileScreen';

// Shared
import { PublishedArticlesScreen } from './pages/shared/PublishedArticlesScreen';

// Flow 4: Secretary & Accounting
import { EventsScreen } from './pages/flow4/EventsScreen';
import { RoyaltyQueueScreen } from './pages/flow4/RoyaltyQueueScreen';
import { RoyaltyFormScreen } from './pages/flow4/RoyaltyFormScreen';
import { RoyaltyPeriodClosingScreen } from './pages/flow4/RoyaltyPeriodClosingScreen';
import { PaymentVouchersReportScreen } from './pages/flow4/PaymentVouchersReportScreen';
import { RoyaltyPeriodListScreen } from './pages/flow4/RoyaltyPeriodListScreen';
import { PeriodReviewScreen } from './pages/flow4/PeriodReviewScreen';
import { PaymentReportScreen } from './pages/flow4/PaymentReportScreen';
import { MyRoyaltiesScreen } from './pages/flow4/MyRoyaltiesScreen';

// Flow 5: KPI
import { KpiTargetSettingScreen } from './pages/flow5/KpiTargetSettingScreen';
import { SectionKpiScreen } from './pages/flow5/SectionKpiScreen';
import { PersonalKpiScreen } from './pages/flow5/PersonalKpiScreen';
import { ReporterKpiDetailScreen } from './pages/flow5/ReporterKpiDetailScreen';
import { KpiFinalizeScreen } from './pages/flow5/KpiFinalizeScreen';
import { ReaderImportScreen } from './pages/flow5/ReaderImportScreen';
import { GenrePopularityScreen } from './pages/flow5/GenrePopularityScreen';
import { TrendingEventsScreen } from './pages/flow5/TrendingEventsScreen';

// Admin
import { GenresConfigScreen } from './pages/admin/GenresConfigScreen';
import { MediaFactorsScreen } from './pages/admin/MediaFactorsScreen';
import { UnitPricesConfigScreen } from './pages/admin/UnitPricesConfigScreen';
import { ParametersScreen } from './pages/admin/ParametersScreen';
import { IntakeParametersScreen } from './pages/admin/IntakeParametersScreen';
import { CriteriaSetsScreen } from './pages/admin/CriteriaSetsScreen';

// Màn hình trang đang xây dựng (dùng EmptyState)
const UnderConstructionScreen: React.FC<{ title?: string }> = ({ title = 'Tính năng đang xây dựng' }) => (
  <div className="space-y-6">
    <PageHeader
      title={title}
      description="Màn hình nghiệp vụ này đang được phát triển theo lộ trình của nhóm phát triển."
    />
    <EmptyState
      title="Đang trong quá trình hoàn thiện"
      description="Chức năng này thuộc lộ trình phát triển tiếp theo của dự án. Mời thầy cô và các bạn trải nghiệm các luồng nghiệp vụ chính đã sẵn sàng trên thanh điều hướng."
    />
  </div>
);

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Mock Login Page */}
          <Route path="/login" element={<MockLoginScreen />} />

          {/* App Shell with Sidebar, Header & Guided Demo Bar */}
          <Route element={<AppLayout />}>
            {/* Luồng 01: Phóng viên */}
            <Route path="/reporter/articles" element={<MyArticlesScreen />} />
            <Route path="/reporter/confirmations" element={<CoAuthorConfirmScreen />} />
            <Route path="/reporter/articles/new" element={<CreateEditArticleScreen />} />
            <Route path="/reporter/articles/:id/edit" element={<CreateEditArticleScreen />} />
            <Route path="/reporter/articles/:id/duplication-check" element={<DuplicationResultScreen />} />
            <Route path="/reporter/articles/:id/score" element={<ScoringResultScreen />} />
            <Route path="/reporter/articles/:id" element={<ArticleDetailHistoryScreen />} />
            <Route path="/articles/:id" element={<ArticleDetailHistoryScreen />} />
            <Route path="/kpi/personal" element={<PersonalKpiScreen />} />

            {/* Alias / redirects tương thích */}
            <Route path="/reporter/create" element={<Navigate to="/reporter/articles/new" replace />} />
            <Route path="/reporter/edit/:id" element={<CreateEditArticleScreen />} />

            {/* Luồng 02: Trưởng ban phân công, BTV chấm điểm, Trưởng ban duyệt điểm & duyệt đăng */}
            <Route path="/editor-lead/queue" element={<AssignmentQueueScreen />} />
            <Route path="/editor-lead/assign/:id" element={<AssignEditorScreen />} />
            <Route path="/editor/queue" element={<EditorWorkQueueScreen />} />
            <Route path="/editor/score/:id" element={<QualityScoringScreen />} />
            <Route path="/editor-lead/score-approval" element={<ScoreApprovalScreen />} />
            <Route path="/editor-lead/publish-queue" element={<PublishApprovalScreen />} />

            {/* Luồng 03: Kiểm soát chất lượng chấm (Khiếu nại, Chấm mù, Chấm chéo, Độ lệch BTV) */}
            <Route path="/reporter/appeals" element={<ReporterAppealsScreen />} />
            <Route path="/editor/rescore/:appealId" element={<BlindRescoreScreen />} />
            <Route path="/editor-lead/appeals" element={<LeadAppealsScreen />} />
            <Route path="/editor-lead/appeals/:id/compare" element={<ScoreComparisonScreen />} />
            <Route path="/editor-lead/cross-review" element={<CrossReviewBatchScreen />} />
            <Route path="/editor-lead/reviewer-deviation" element={<ReviewerDeviationScreen />} />
            <Route path="/editor-lead/reviewers/:id" element={<ReviewerProfileScreen />} />

            {/* Bài đã xuất bản */}
            <Route path="/published" element={<PublishedArticlesScreen />} />
            <Route path="/published-articles" element={<Navigate to="/published" replace />} />

            {/* Luồng 04: Thư ký tòa soạn & Kế toán */}
            <Route path="/secretary/events" element={<EventsScreen />} />
            <Route path="/secretary/royalty-queue" element={<RoyaltyQueueScreen />} />
            <Route path="/secretary/royalty-form/:id" element={<RoyaltyFormScreen />} />
            <Route path="/secretary/royalty-periods" element={<RoyaltyPeriodClosingScreen />} />
            <Route path="/secretary/royalty-periods/:id" element={<RoyaltyPeriodClosingScreen />} />
            <Route path="/royalty/periods" element={<RoyaltyPeriodListScreen />} />
            <Route path="/accounting/periods" element={<PeriodReviewScreen />} />
            <Route path="/accounting/periods/:id" element={<PeriodReviewScreen />} />
            <Route path="/accounting/vouchers" element={<PaymentVouchersReportScreen />} />
            <Route path="/accounting/report" element={<PaymentReportScreen />} />
            <Route path="/reporter/royalties" element={<MyRoyaltiesScreen />} />

            {/* Luồng 05: KPI & Báo cáo */}
            <Route path="/kpi/targets" element={<KpiTargetSettingScreen />} />
            <Route path="/kpi/section" element={<SectionKpiScreen />} />
            <Route path="/kpi/my" element={<Navigate to="/kpi/personal" replace />} />
            <Route path="/kpi/reporters/:id" element={<ReporterKpiDetailScreen />} />
            <Route path="/kpi/finalize" element={<KpiFinalizeScreen />} />
            <Route path="/reports/genres" element={<GenrePopularityScreen />} />
            <Route path="/reports/trending" element={<TrendingEventsScreen />} />
            <Route path="/admin/reader-import" element={<ReaderImportScreen />} />

            {/* Admin: Danh mục & Đơn giá & Tiêu chí & Tham số */}
            <Route path="/admin/parameters" element={<ParametersScreen />} />
            <Route path="/admin/parameters/intake" element={<ParametersScreen />} />
            <Route path="/admin/intake-parameters" element={<ParametersScreen />} />
            <Route path="/admin/criteria-sets" element={<CriteriaSetsScreen />} />
            <Route path="/admin/genres" element={<GenresConfigScreen />} />
            <Route path="/admin/media-factors" element={<MediaFactorsScreen />} />
            <Route path="/admin/unit-prices" element={<UnitPricesConfigScreen />} />

            {/* Trang đang xây dựng */}
            <Route path="/under-construction" element={<UnderConstructionScreen />} />

            {/* Fallbacks */}
            <Route path="/" element={<Navigate to="/reporter/articles" replace />} />
            <Route path="*" element={<UnderConstructionScreen title="Trang không tìm thấy hoặc đang xây dựng" />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
