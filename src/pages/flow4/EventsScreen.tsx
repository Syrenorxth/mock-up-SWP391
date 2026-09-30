import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import { Modal } from '../../components/common/Modal';
import { StatusBadge } from '../../components/common/Badge';
import { Event, Article, formatDateTime, formatDate } from '../../types';
import {
  Calendar,
  Plus,
  Edit2,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  ChevronRight,
  TrendingDown,
  ArrowRight,
  Coins,
  FileText
} from 'lucide-react';

export const EventsScreen: React.FC = () => {
  const {
    state,
    dispatch,
    notify,
    getUser,
    getGenre,
    getEffectiveScoreForArticle
  } = useApp();
  const navigate = useNavigate();

  // Sự kiện đang chọn (mặc định 'ev-hanhan')
  const [selectedEventId, setSelectedEventId] = useState<string>('ev-hanhan');

  // Modal tạo/sửa sự kiện
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const currentEvent = useMemo(() => {
    return state.events.find(e => e.id === selectedEventId) || state.events[0];
  }, [state.events, selectedEventId]);

  // Danh sách bài viết gắn sự kiện đang chọn, xếp theo thứ tự ngày nộp / saturation_rank
  const eventArticles = useMemo(() => {
    if (!currentEvent) return [];
    return state.articles
      .filter(a => a.event_id === currentEvent.id)
      .sort((a, b) => {
        const rankA = a.saturation_rank ?? 999;
        const rankB = b.saturation_rank ?? 999;
        if (rankA !== rankB) return rankA - rankB;
        const timeA = new Date(a.first_submitted_at || a.created_at).getTime();
        const timeB = new Date(b.first_submitted_at || b.created_at).getTime();
        return timeA - timeB;
      });
  }, [state.articles, currentEvent]);

  // Thống kê bài viết trong sự kiện
  const stats = useMemo(() => {
    const total = eventArticles.length;
    const tier1 = eventArticles.filter(a => (a.saturation_rank ?? 0) >= 1 && (a.saturation_rank ?? 0) <= 10).length;
    const tier2 = eventArticles.filter(a => (a.saturation_rank ?? 0) >= 11 && (a.saturation_rank ?? 0) <= 20).length;
    const tier3 = eventArticles.filter(a => (a.saturation_rank ?? 0) >= 21).length;
    const exempt = eventArticles.filter(a => getEffectiveScoreForArticle(a.id) >= 90).length;
    return { total, tier1, tier2, tier3, exempt };
  }, [eventArticles, getEffectiveScoreForArticle]);

  const handleOpenAdd = () => {
    setEditingEvent(null);
    setName('');
    setCode('SK_' + Date.now().toString().slice(-4));
    setStartDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setIsActive(true);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleOpenEdit = (ev: Event) => {
    setEditingEvent(ev);
    setName(ev.name);
    setCode(ev.code);
    setStartDate(ev.start_date);
    setDescription(ev.description || '');
    setIsActive(ev.is_active);
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSaveEvent = () => {
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên sự kiện.');
      return;
    }
    if (!startDate) {
      setErrorMsg('Vui lòng chọn ngày bắt đầu.');
      return;
    }

    if (editingEvent) {
      const updated: Event = {
        ...editingEvent,
        name: name.trim(),
        code: code.trim() || editingEvent.code,
        start_date: startDate,
        description: description.trim(),
        is_active: isActive
      };
      dispatch({
        type: 'UPDATE_EVENT',
        payload: updated
      });
      notify(`Đã cập nhật sự kiện "${updated.name}"!`, 'success');
    } else {
      const newEv: Event = {
        id: 'ev-' + Date.now(),
        name: name.trim(),
        code: code.trim() || ('SK_' + Date.now()),
        start_date: startDate,
        description: description.trim(),
        is_active: isActive
      };
      dispatch({
        type: 'ADD_EVENT',
        payload: newEv
      });
      setSelectedEventId(newEv.id);
      notify(`Đã tạo sự kiện mới "${newEv.name}"!`, 'success');
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Thư ký tòa soạn', link: '/secretary/royalty-queue' },
          { label: 'Quản lý sự kiện' }
        ]}
        title="Quản lý Sự kiện & Kiểm soát Bão hòa Đề tài (Luồng 04)"
        description="Theo dõi danh sách sự kiện chuyên đề và thứ tự bài viết nộp trong cửa sổ 7 ngày. Tự động khóa mức hệ số bão hòa (100% / 80% / 60%) và kích hoạt cơ chế Miễn bão hòa khi bài đạt chất lượng xuất sắc (≥ 90 điểm)."
        actions={
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-900 text-white text-xs font-bold hover:bg-blue-800 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo sự kiện mới</span>
          </button>
        }
      />

      {/* Grid: Left Event Selector & Right Article List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Left: Events List */}
        <div className="lg:col-span-1 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Danh mục sự kiện ({state.events.length})
            </span>
          </div>

          <div className="space-y-2">
            {state.events.map(ev => {
              const isSelected = ev.id === currentEvent?.id;
              const count = state.articles.filter(a => a.event_id === ev.id).length;

              return (
                <div
                  key={ev.id}
                  onClick={() => setSelectedEventId(ev.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-900/20'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300 hover:bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-xs leading-snug line-clamp-2">
                      {ev.name}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(ev);
                      }}
                      className={`p-1 rounded-lg shrink-0 transition-colors ${
                        isSelected ? 'hover:bg-blue-800 text-blue-200' : 'hover:bg-slate-100 text-slate-400'
                      }`}
                      title="Chỉnh sửa sự kiện"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className={`text-[11px] mt-2 flex items-center justify-between ${
                    isSelected ? 'text-blue-200' : 'text-slate-500'
                  }`}>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(ev.start_date)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {count} bài viết
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Event Details & Articles Table */}
        <div className="lg:col-span-3 space-y-4">
          {currentEvent && (
            <>
              {/* Event Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-900">
                        {currentEvent.name}
                      </h2>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                        {currentEvent.code}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                      <span>Bắt đầu từ: <strong>{formatDate(currentEvent.start_date)}</strong></span>
                      <span>•</span>
                      <span>Trạng thái: <strong className={currentEvent.is_active ? 'text-emerald-700' : 'text-slate-500'}>{currentEvent.is_active ? 'Đang theo dõi' : 'Đã kết thúc'}</strong></span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(currentEvent)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shrink-0"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Sửa sự kiện</span>
                  </button>
                </div>

                {currentEvent.description && (
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{currentEvent.description}"
                  </p>
                )}

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">Tổng bài gắn sự kiện</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{stats.total}</div>
                    <div className="text-[10px] text-slate-500">Trong cửa sổ 7 ngày</div>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">Bài 1 – 10 (100%)</div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">{stats.tier1}</div>
                    <div className="text-[10px] text-emerald-600">Giữ nguyên hệ số</div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200">
                    <div className="text-[10px] font-bold text-amber-800 uppercase">Bài 11 – 20 (80%)</div>
                    <div className="text-xl font-black text-amber-700 mt-0.5">{stats.tier2}</div>
                    <div className="text-[10px] text-amber-600">Giảm 20% hệ số</div>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                    <div className="text-[10px] font-bold text-rose-800 uppercase">Từ bài 21+ (60%)</div>
                    <div className="text-xl font-black text-rose-700 mt-0.5">{stats.tier3}</div>
                    <div className="text-[10px] text-rose-600">Giảm 40% hệ số</div>
                  </div>
                </div>

                {/* Rule Exemption Box */}
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-blue-800 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong>Cơ chế Miễn bão hòa đề tài (Luồng 04):</strong> Bất kể bài viết nộp ở thứ tự nào (kể cả thuộc mức 80% hoặc 60%), nếu <strong>Điểm hiệu lực đạt từ 90 điểm trở lên</strong> (Xếp loại Xuất sắc), hệ thống sẽ <strong>MIỄN BÃO HÒA</strong> và tự động khôi phục mức hưởng <strong>100% hệ số</strong>. Hiện có <strong>{stats.exempt} bài viết</strong> đạt điều kiện miễn bão hòa trong sự kiện này.
                  </div>
                </div>
              </div>

              {/* Articles Table */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-900" />
                    <span>Danh sách bài viết xếp theo thứ tự ngày nộp</span>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {eventArticles.length} bài viết
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-3 text-center w-14">Thứ tự</th>
                        <th className="py-3 px-4">Bài viết & Tác giả</th>
                        <th className="py-3 px-3 w-28">Thể loại</th>
                        <th className="py-3 px-3 w-32">Ngày nộp bài</th>
                        <th className="py-3 px-3 text-center w-24">Điểm hiệu lực</th>
                        <th className="py-3 px-3 text-center w-28">Mức bão hòa</th>
                        <th className="py-3 px-3 text-center w-36">Miễn bão hòa</th>
                        <th className="py-3 px-3 text-center w-28">Trạng thái</th>
                        <th className="py-3 px-3 text-right w-28">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eventArticles.map(art => {
                        const author = getUser(art.author_id);
                        const genre = getGenre(art.category_id || art.genre_id);
                        const effectiveScore = getEffectiveScoreForArticle(art.id);
                        const isExempt = effectiveScore >= 90;
                        const rank = art.saturation_rank ?? 1;
                        const rate = art.saturation_rate ?? (rank <= 10 ? 100 : rank <= 20 ? 80 : 60);

                        return (
                          <tr
                            key={art.id}
                            className={`hover:bg-slate-50 transition-colors ${
                              isExempt ? 'bg-emerald-50/15' : ''
                            }`}
                          >
                            <td className="py-3.5 px-3 text-center font-black text-slate-800">
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs ${
                                rank <= 10
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : rank <= 20
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-rose-100 text-rose-900 border border-rose-300'
                              }`}>
                                #{rank}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-bold text-slate-900 line-clamp-1">{art.title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                Tác giả: <strong className="text-slate-800">{author?.full_name || 'Phóng viên'}</strong>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap text-slate-700">
                              {genre?.name || '—'}
                            </td>

                            <td className="py-3.5 px-3 whitespace-nowrap text-[11px] text-slate-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{art.first_submitted_at ? formatDateTime(art.first_submitted_at) : formatDate(art.created_at)}</span>
                              </div>
                            </td>

                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <span className={`font-black text-xs px-2 py-0.5 rounded-md ${
                                effectiveScore >= 90
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                  : effectiveScore >= 70
                                  ? 'bg-blue-50 text-blue-900 border border-blue-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {effectiveScore} đ
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                rate === 100
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                  : rate === 80
                                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                  : 'bg-rose-100 text-rose-800 border border-rose-300'
                              }`}>
                                {rate}%
                              </span>
                            </td>

                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              {isExempt ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white shadow-2xs">
                                  <Sparkles className="w-3 h-3" />
                                  <span>Miễn (Điểm ≥ 90)</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">
                                  —
                                </span>
                              )}
                            </td>

                            <td className="py-3.5 px-3 text-center whitespace-nowrap">
                              <StatusBadge status={art.status} />
                            </td>

                            <td className="py-3.5 px-3 text-right whitespace-nowrap">
                              {art.status === 'PUBLISHED' ? (
                                <button
                                  type="button"
                                  onClick={() => navigate(`/secretary/royalty-form/${art.id}`)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
                                >
                                  <Coins className="w-3 h-3" />
                                  <span>Chấm NB</span>
                                </button>
                              ) : (
                                <Link
                                  to={`/articles/${art.id}`}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 text-slate-600 text-[11px] font-medium hover:bg-slate-50 transition-colors"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Chi tiết</span>
                                </Link>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Tạo/Sửa sự kiện */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEvent ? `Chỉnh sửa sự kiện: ${editingEvent.name}` : 'Tạo Sự kiện Chuyên đề Mới'}
        maxWidth="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSaveEvent}
              className="px-4 py-2 bg-blue-900 text-white text-xs font-bold rounded-xl hover:bg-blue-800 cursor-pointer shadow-xs"
            >
              {editingEvent ? 'Lưu cập nhật' : 'Tạo sự kiện'}
            </button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
              Tên sự kiện / Chiến dịch chuyên đề <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ví dụ: Hạn hán và xâm nhập mặn miền Tây"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Mã sự kiện <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Ví dụ: HAN_HAN_MIEN_TAY"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
                Ngày bắt đầu sự kiện <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-800 uppercase tracking-wider mb-1">
              Mô tả bối cảnh sự kiện
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Mô tả tóm tắt nội dung sự kiện, mục đích theo dõi..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="eventIsActive"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="rounded text-blue-900 focus:ring-blue-600"
            />
            <label htmlFor="eventIsActive" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Đang trong thời gian hoạt động theo dõi đề tài
            </label>
          </div>
        </div>
      </Modal>
    </div>
  );
};
