import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { formatDate } from '../../types';
import {
  UserCheck,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Info,
  ShieldAlert,
  Send,
  Building2,
  Layers
} from 'lucide-react';

export const AssignEditorScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, dispatch, notify, getGenre, getSection, getUser } = useApp();
  const navigate = useNavigate();

  const article = state.articles.find(a => a.id === id);

  const [selectedEditorId, setSelectedEditorId] = useState<string>('');
  const [note, setNote] = useState('');

  if (!article) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-base font-bold text-slate-800">Không tìm thấy bài viết</h2>
        <button
          type="button"
          onClick={() => navigate('/editor-lead/queue')}
          className="mt-4 px-4 py-2 bg-blue-900 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Quay lại hàng chờ
        </button>
      </div>
    );
  }

  const genre = getGenre(article.declared_category_id || article.category_id || article.genre_id);
  const section = getSection(article.section_id);
  const author = getUser(article.author_id);

  // Danh sách tác giả & đồng tác giả của bài viết
  const articleAuthors = state.articleAuthors.filter(au => au.article_id === article.id);
  const coAuthors = articleAuthors.filter(au => !au.is_main);
  const authorUserIds = new Set([
    article.author_id,
    ...articleAuthors.map(au => au.user_id)
  ]);

  // Lấy tất cả các Biên tập viên
  const editors = state.users.filter(u => u.role_code === 'BIEN_TAP_VIEN');

  // Thống kê & Sắp xếp BTV gợi ý
  // Quy tắc: Đang chấm ít bài nhất trước, ưu tiên người đã chấm thể loại này
  const rankedEditors = useMemo(() => {
    const list = editors.map(ed => {
      // Số bài đang chấm (ASSIGNED)
      const activeCount = state.articles.filter(
        a => a.editor_id === ed.id && a.status === 'ASSIGNED'
      ).length;

      // Số bài cùng thể loại này đã từng thẩm định/chấm xong
      const targetGenreId = article.declared_category_id || article.category_id || article.genre_id;
      const scoredSameGenreCount = state.articles.filter(
        a =>
          a.editor_id === ed.id &&
          (a.category_id === targetGenreId || a.genre_id === targetGenreId) &&
          ['PENDING_APPROVAL', 'SCORE_PUBLISHED', 'PUBLISHED'].includes(a.status)
      ).length;

      // Kiểm tra BTV có phải tác giả/đồng tác giả không
      const isAuthorOrCoAuthor = authorUserIds.has(ed.id);

      return {
        editor: ed,
        activeCount,
        scoredSameGenreCount,
        isAuthorOrCoAuthor
      };
    });

    // Sắp xếp:
    // 1. Không phải tác giả đứng trước
    // 2. Đang chấm ít bài nhất trước (activeCount tăng dần)
    // 3. Đã chấm nhiều bài thể loại này hơn (scoredSameGenreCount giảm dần)
    return list.sort((a, b) => {
      if (a.isAuthorOrCoAuthor !== b.isAuthorOrCoAuthor) {
        return a.isAuthorOrCoAuthor ? 1 : -1;
      }
      if (a.activeCount !== b.activeCount) {
        return a.activeCount - b.activeCount; // Ít bài nhất trước
      }
      return b.scoredSameGenreCount - a.scoredSameGenreCount; // Ưu tiên kinh nghiệm thể loại
    });
  }, [editors, state.articles, article, authorUserIds]);

  // Người đứng đầu hợp lệ được coi là gợi ý số 1
  const topSuggestedId = useMemo(() => {
    const topValid = rankedEditors.find(e => !e.isAuthorOrCoAuthor);
    return topValid ? topValid.editor.id : '';
  }, [rankedEditors]);

  // Tự động chọn người được gợi ý nếu chưa chọn ai
  React.useEffect(() => {
    if (!selectedEditorId && topSuggestedId) {
      setSelectedEditorId(topSuggestedId);
    }
  }, [topSuggestedId, selectedEditorId]);

  const handleAssign = () => {
    if (!selectedEditorId) {
      notify('Vui lòng chọn một Biên tập viên', 'error');
      return;
    }

    if (authorUserIds.has(selectedEditorId)) {
      notify('Không thể phân công cho Biên tập viên là tác giả hoặc đồng tác giả của bài viết!', 'error');
      return;
    }

    const ed = getUser(selectedEditorId);
    dispatch({
      type: 'ASSIGN_EDITOR',
      payload: {
        articleIds: [article.id],
        editorId: selectedEditorId,
        note: note.trim() || `Trưởng ban phân công cho BTV ${ed?.full_name} thẩm định`
      }
    });

    notify(`Đã phân công bài viết cho BTV ${ed?.full_name}!`, 'success');
    navigate('/editor-lead/queue');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        breadcrumbs={[
          { label: 'Hàng chờ phân công', link: '/editor-lead/queue' },
          { label: 'Phân công BTV' }
        ]}
        title="Chỉ định Biên tập viên thẩm định bài viết"
        description="Hệ thống tự động xếp hạng BTV gợi ý: ưu tiên BTV đang chấm ít bài nhất và đã có kinh nghiệm thẩm định thể loại này."
        actions={
          <button
            type="button"
            onClick={() => navigate('/editor-lead/queue')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
        }
      />

      {/* Khối thông tin tóm tắt bài viết */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 font-medium">
            <span className="text-blue-900 font-bold uppercase">{section?.name || 'Ban chuyên môn'}</span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-900 font-bold text-xs">
              {genre?.name}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>Nộp ngày {formatDate(article.first_submitted_at || article.created_at)}</span>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900">{article.title}</h3>

        {article.sapo && (
          <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
            {article.sapo}
          </p>
        )}

        <div className="text-xs text-slate-600 flex items-center justify-between pt-1">
          <div>
            Tác giả chính: <strong className="text-slate-900">{author?.full_name}</strong> ({author?.email})
          </div>

          {coAuthors.length > 0 && (
            <div className="text-[11px] text-slate-500">
              Đồng tác giả: {coAuthors.map(ca => `${getUser(ca.user_id)?.full_name} (${ca.share_percent}%)`).join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* Danh sách BTV gợi ý & sắp xếp */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-900" />
              <span>Danh sách Biên tập viên gợi ý</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Đang chấm ít bài nhất xếp trước. Ưu tiên BTV đã từng chấm thể loại {genre?.name}.
            </p>
          </div>

          <div className="text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            Tổng số: <strong>{editors.length}</strong> BTV
          </div>
        </div>

        <div className="space-y-3">
          {rankedEditors.map(({ editor: ed, activeCount, scoredSameGenreCount, isAuthorOrCoAuthor }) => {
            const isSelected = selectedEditorId === ed.id;
            const isTop = ed.id === topSuggestedId;
            const edSection = getSection(ed.section_id);

            return (
              <div
                key={ed.id}
                onClick={() => {
                  if (!isAuthorOrCoAuthor) {
                    setSelectedEditorId(ed.id);
                  }
                }}
                className={`p-4 rounded-2xl border-2 transition-all ${
                  isAuthorOrCoAuthor
                    ? 'border-slate-200 bg-slate-50/60 opacity-60 cursor-not-allowed'
                    : isSelected
                    ? 'border-blue-900 bg-blue-50/40 shadow-xs cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Thông tin BTV */}
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {ed.avatar_url ? (
                        <img
                          src={ed.avatar_url}
                          alt={ed.full_name}
                          className="w-11 h-11 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center justify-center">
                          {ed.full_name.charAt(0)}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-900 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs">
                          ✓
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                        <span>{ed.full_name}</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          ({edSection?.name || 'Tòa soạn'})
                        </span>
                        {isTop && !isAuthorOrCoAuthor && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300">
                            <Sparkles className="w-3 h-3 text-emerald-700" />
                            Gợi ý số 1
                          </span>
                        )}
                        {isAuthorOrCoAuthor && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <ShieldAlert className="w-3 h-3 text-rose-600" />
                            Tác giả / Đồng tác giả
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ed.job_title || 'Biên tập viên'} • {ed.email}
                      </div>
                    </div>
                  </div>

                  {/* Chỉ số tải & Kinh nghiệm thể loại */}
                  <div className="flex items-center gap-4 sm:text-right shrink-0">
                    <div className="text-xs">
                      <div className="text-slate-500 text-[11px]">Đang chấm:</div>
                      <div className="font-extrabold text-slate-900">
                        Đang chấm <span className="text-blue-900 text-sm font-black">{activeCount}</span> bài
                      </div>
                    </div>

                    <div className="text-xs border-l border-slate-200 pl-4">
                      <div className="text-slate-500 text-[11px]">Kinh nghiệm {genre?.name}:</div>
                      <div className="font-extrabold text-emerald-800">
                        Đã chấm <span className="text-emerald-700 text-sm font-black">{scoredSameGenreCount}</span> bài
                      </div>
                    </div>
                  </div>
                </div>

                {isAuthorOrCoAuthor && (
                  <div className="mt-2.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Quy chế xung đột lợi ích: Không được phân công bài viết cho chính tác giả hoặc đồng tác giả.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Ghi chú chỉ đạo */}
        <div className="pt-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            Ghi chú chỉ đạo của Trưởng ban (Tùy chọn)
          </label>
          <textarea
            rows={2}
            placeholder="Ví dụ: Kiểm tra kỹ tính pháp lý của hồ sơ, đối chiếu nguồn tin thứ 3, hoàn thành trước 17h..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        {/* Nút hành động Xác nhận */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div className="text-xs text-slate-500">
            {selectedEditorId ? (
              <span>
                Đã chọn: <strong className="text-slate-900">{getUser(selectedEditorId)?.full_name}</strong>
              </span>
            ) : (
              <span className="text-amber-700 font-medium">Vui lòng chọn một Biên tập viên</span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAssign}
            disabled={!selectedEditorId || authorUserIds.has(selectedEditorId)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Xác nhận phân công BTV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
