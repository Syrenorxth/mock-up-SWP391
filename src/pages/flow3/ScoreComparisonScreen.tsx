import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { formatDate, formatDateTime, ScoringAttempt } from '../../types';
import {
  Columns,
  Scale,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  User,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';

export const ScoreComparisonScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, getUser, getGenre } = useApp();

  const appeal = useMemo(() => {
    return state.appeals.find(ap => ap.id === id);
  }, [state.appeals, id]);

  const article = useMemo(() => {
    if (!appeal) return undefined;
    return state.articles.find(a => a.id === appeal.article_id);
  }, [state.articles, appeal]);

  // Lấy các lần chấm của bài viết này
  const attempts: ScoringAttempt[] = useMemo(() => {
    if (!appeal) return [];
    return state.scoringAttempts
      .filter(sa => sa.article_id === appeal.article_id)
      .sort((a, b) => a.attempt_no - b.attempt_no);
  }, [appeal, state.scoringAttempts]);

  // Lần 1 (Gốc)
  const attempt1 = attempts.find(sa => sa.scorer_type === 'PRIMARY') || attempts[0];
  // Lần 2 (Chấm lại mù)
  const attempt2 = attempts.find(sa => sa.id === appeal?.rescore_attempt_id) || attempts.find(sa => sa.scorer_type === 'APPEAL');
  // Lần 3 (BTV 3)
  const attempt3 = attempts.find(sa => sa.scorer_type === 'THIRD_EDITOR');

  const scorer1 = getUser(attempt1?.scorer_id || appeal?.original_scorer_id);
  const scorer2 = getUser(attempt2?.scorer_id || appeal?.rescore_editor_id);
  const scorer3 = getUser(attempt3?.scorer_id || appeal?.third_editor_id);

  const genre = getGenre(article?.category_id || article?.genre_id);
  const author = getUser(article?.author_id);

  // Danh sách các tiêu chí tổng hợp để so sánh từng hàng
  const criteriaComparisonList = useMemo(() => {
    // Lấy tiêu chí từ attempt1 hoặc attempt2
    const sourceCriteria = attempt1?.criteria_scores || attempt2?.criteria_scores || [];
    return sourceCriteria.map(c1 => {
      const c2 = attempt2?.criteria_scores?.find(c => c.criterion_id === c1.criterion_id);
      const c3 = attempt3?.criteria_scores?.find(c => c.criterion_id === c1.criterion_id);

      const score1 = c1.score;
      const score2 = c2?.score;
      const score3 = c3?.score;

      const diff21 = score2 !== undefined ? score2 - score1 : undefined;

      return {
        criterion_id: c1.criterion_id,
        name: c1.name,
        weight: c1.weight,
        score1,
        comment1: c1.comment,
        score2,
        comment2: c2?.comment,
        diff21,
        score3,
        comment3: c3?.comment
      };
    });
  }, [attempt1, attempt2, attempt3]);

  if (!appeal || !article) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center space-y-4">
        <Scale className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy yêu cầu khiếu nại</h3>
        <p className="text-xs text-slate-500">Mã #{id} không tồn tại trong hệ thống.</p>
        <Link
          to="/editor-lead/appeals"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Về danh sách khiếu nại</span>
        </Link>
      </div>
    );
  }

  const hasThirdReview = !!attempt3 || appeal.status === 'IN_THIRD_REVIEW';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Trang chủ', link: '/editor-lead/queue' },
          { label: 'Danh sách khiếu nại', link: '/editor-lead/appeals' },
          { label: 'Đối chiếu các lần chấm' }
        ]}
        title={`Đối chiếu kết quả thẩm định: ${article.title}`}
        description="Bảng phân tích ma trận điểm từng tiêu chí giữa lần chấm gốc ban đầu, lần chấm lại mù và lần chấm thứ ba (nếu có), cùng quy tắc chốt điểm hiệu lực tự động."
      />

      {/* Thông tin vắn tắt tác phẩm */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-900 border border-blue-200">
              {genre?.name}
            </span>
            <span className="text-xs font-mono text-slate-400">
              Khiếu nại: #{appeal.id}
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">
              Tác giả: <strong>{author?.full_name}</strong>
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 mt-1">
            {article.title}
          </h2>
        </div>

        <Link
          to="/editor-lead/appeals"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </Link>
      </div>

      {/* BẢNG ĐỐI CHIẾU TIÊU CHÍ CHI TIẾT */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Columns className="w-5 h-5 text-blue-900" />
            <h3 className="font-bold text-slate-900 text-sm">
              Ma trận so sánh tiêu chí giữa các lần chấm
            </h3>
          </div>
          <div className="text-xs text-slate-500">
            Bộ tiêu chí: <strong>Phiên bản {appeal.criteria_set_version}</strong>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-64">Tiêu chí & Trọng số</th>

                {/* Cột Lần 1 */}
                <th className="py-3 px-4 w-56 bg-slate-50/80 border-l border-slate-200">
                  <div>LẦN 1 · CHẤM GỐC</div>
                  <div className="text-[10px] font-semibold text-slate-500 normal-case">
                    BTV: {scorer1?.full_name || 'BTV ban đầu'}
                  </div>
                </th>

                {/* Cột Lần 2 */}
                <th className="py-3 px-4 w-56 bg-amber-50/50 border-l border-slate-200">
                  <div className="text-amber-900">LẦN 2 · CHẤM MÙ LẠI</div>
                  <div className="text-[10px] font-semibold text-amber-700 normal-case">
                    BTV: {scorer2?.full_name || 'BTV chấm lại'}{' '}
                    {appeal.is_external_editor && '(Ngoài ban)'}
                  </div>
                </th>

                {/* Cột Chênh lệch */}
                <th className="py-3 px-4 w-28 text-center border-l border-slate-200 bg-slate-50">
                  <div>CHÊNH LỆCH</div>
                  <div className="text-[10px] font-normal text-slate-400 normal-case">(Lần 2 - Lần 1)</div>
                </th>

                {/* Cột Lần 3 (nếu có) */}
                {hasThirdReview && (
                  <th className="py-3 px-4 w-56 bg-purple-50/50 border-l border-slate-200">
                    <div className="text-purple-900">LẦN 3 · BTV THỨ BA</div>
                    <div className="text-[10px] font-semibold text-purple-700 normal-case">
                      BTV: {scorer3?.full_name || 'BTV thứ ba'}{' '}
                      {appeal.is_third_external_editor && '(Ngoài ban)'}
                    </div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {criteriaComparisonList.map((row, idx) => {
                const isAppealed = appeal.appealed_criteria_ids.includes(row.criterion_id);

                return (
                  <tr
                    key={row.criterion_id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isAppealed ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Tiêu chí */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-xs">
                          {idx + 1}. {row.name}
                        </span>
                        {isAppealed && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-200 text-amber-900 uppercase">
                            Bị khiếu nại
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Trọng số: <strong className="text-slate-600">{row.weight}%</strong>
                      </div>
                    </td>

                    {/* Lần 1 */}
                    <td className="py-3.5 px-4 bg-slate-50/50 border-l border-slate-200">
                      <div className="font-black text-slate-900 text-sm">
                        {row.score1} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
                      </div>
                      {row.comment1 && (
                        <div className="text-[11px] text-slate-500 italic mt-0.5">
                          "{row.comment1}"
                        </div>
                      )}
                    </td>

                    {/* Lần 2 */}
                    <td className="py-3.5 px-4 bg-amber-50/20 border-l border-slate-200">
                      {row.score2 !== undefined ? (
                        <>
                          <div className="font-black text-amber-900 text-sm">
                            {row.score2} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
                          </div>
                          {row.comment2 && (
                            <div className="text-[11px] text-slate-600 italic mt-0.5">
                              "{row.comment2}"
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Đang chấm lại...</span>
                      )}
                    </td>

                    {/* Chênh lệch */}
                    <td className="py-3.5 px-4 text-center border-l border-slate-200 bg-slate-50">
                      {row.diff21 !== undefined ? (
                        <div
                          className={`inline-flex items-center gap-0.5 font-black text-xs px-2 py-0.5 rounded-full ${
                            row.diff21 > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.diff21 < 0
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {row.diff21 > 0 ? (
                            <TrendingUp className="w-3 h-3 text-emerald-600" />
                          ) : row.diff21 < 0 ? (
                            <TrendingDown className="w-3 h-3 text-rose-600" />
                          ) : (
                            <Minus className="w-3 h-3 text-slate-400" />
                          )}
                          <span>{row.diff21 > 0 ? `+${row.diff21}` : row.diff21}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Lần 3 */}
                    {hasThirdReview && (
                      <td className="py-3.5 px-4 bg-purple-50/20 border-l border-slate-200">
                        {row.score3 !== undefined ? (
                          <>
                            <div className="font-black text-purple-900 text-sm">
                              {row.score3} <span className="text-[10px] font-normal text-slate-400">/ 100</span>
                            </div>
                            {row.comment3 && (
                              <div className="text-[11px] text-slate-600 italic mt-0.5">
                                "{row.comment3}"
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Đang chờ chấm lần 3...</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* Dòng TỔNG ĐIỂM */}
            <tfoot className="bg-slate-100/90 font-black border-t-2 border-slate-300 text-xs">
              <tr>
                <td className="py-4 px-4 text-slate-900 font-extrabold uppercase">
                  TỔNG ĐIỂM TỔNG HỢP:
                </td>

                {/* Tổng điểm 1 */}
                <td className="py-4 px-4 bg-slate-50 border-l border-slate-200 text-slate-900 text-base">
                  {attempt1?.total_score ?? appeal.original_score} đ
                </td>

                {/* Tổng điểm 2 */}
                <td className="py-4 px-4 bg-amber-50/50 border-l border-slate-200 text-amber-950 text-base">
                  {attempt2?.total_score ?? appeal.rescore_score ?? '—'} {attempt2?.total_score && 'đ'}
                </td>

                {/* Chênh lệch tổng */}
                <td className="py-4 px-4 text-center border-l border-slate-200 bg-slate-50 text-sm">
                  {attempt2?.total_score !== undefined ? (
                    <span
                      className={`font-black ${
                        attempt2.total_score >= (attempt1?.total_score ?? appeal.original_score)
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {attempt2.total_score - (attempt1?.total_score ?? appeal.original_score) > 0 ? '+' : ''}
                      {Math.round((attempt2.total_score - (attempt1?.total_score ?? appeal.original_score)) * 10) / 10} đ
                    </span>
                  ) : (
                    '—'
                  )}
                </td>

                {/* Tổng điểm 3 */}
                {hasThirdReview && (
                  <td className="py-4 px-4 bg-purple-50/50 border-l border-slate-200 text-purple-950 text-base">
                    {attempt3?.total_score ?? appeal.third_score ?? '—'} {attempt3?.total_score && 'đ'}
                  </td>
                )}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* KHỐI KẾT LUẬN & QUY TẮC PHÂN GIẢI */}
      <div className="bg-linear-to-r from-blue-900 to-indigo-950 text-white rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-white/10">
          <div>
            <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              Kết luận phân giải điểm số
            </span>
            <h3 className="text-lg font-bold mt-0.5">
              Quy tắc thẩm định & Điểm hiệu lực của tác phẩm
            </h3>
          </div>

          <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/20 text-right">
            <span className="text-[10px] text-blue-200 uppercase block">Điểm hiệu lực chốt</span>
            <span className="text-2xl font-black text-amber-300">
              {appeal.final_effective_score !== undefined
                ? `${appeal.final_effective_score} / 100 đ`
                : 'ĐANG XỬ LÝ'}
            </span>
          </div>
        </div>

        {/* Nội dung diễn giải quy tắc */}
        <div className="space-y-2 text-xs leading-relaxed">
          <div className="font-bold text-amber-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Căn cứ theo Quy chế thẩm định chất lượng tác phẩm:</span>
          </div>

          <p className="text-blue-100 font-medium bg-white/5 p-4 rounded-2xl border border-white/10">
            {appeal.resolution_note ||
              'Hệ thống đang trong quá trình thực hiện thẩm định độc lập theo đúng quy chuẩn.'}
          </p>

          <div className="text-[11px] text-blue-200 pt-2 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Ghi chú quan trọng về tài chính:</strong> Điểm cuối trở thành <strong>điểm hiệu lực</strong> của tác phẩm. Luồng 03 không can thiệp tính tiền nhuận bút; nếu điểm hiệu lực làm thay đổi bậc xếp loại chất lượng, hệ thống Luồng 04 (Nhuận bút) sẽ <strong>tự động sinh dòng điều chỉnh (adjustment)</strong> trong kỳ mở gần nhất.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
