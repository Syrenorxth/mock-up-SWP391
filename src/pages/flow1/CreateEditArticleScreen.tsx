import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { PageHeader } from '../../components/common/Header';
import {
  Save,
  ArrowRight,
  ArrowLeft,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Users,
  Image as ImageIcon,
  Video,
  FileText,
  Sparkles,
  HelpCircle,
  Plus,
  ShieldCheck,
  Percent,
  Clock,
  ExternalLink,
  ChevronDown,
  Coins,
  XCircle
} from 'lucide-react';
import {
  ArticleAttachment,
  ArticleAuthor,
  ArticleNature,
  MediaKind,
  HashCheckStatus
} from '../../types';
import { RoyaltyEstimateModal } from './RoyaltyEstimateModal';

export const CreateEditArticleScreen: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    state,
    dispatch,
    notify,
    getGenre,
    getSection,
    getUser,
    getArticleLogs,
    getArticleQualityScore,
    getArticleAttachments,
    getArticleAuthors,
    getEvent,
    getSystemParameter
  } = useApp();

  const isEditMode = Boolean(id);
  const existingArticle = useMemo(() => {
    return isEditMode ? state.articles.find(a => a.id === id) : null;
  }, [isEditMode, id, state.articles]);

  // Modal ước tính nhuận bút
  const [estimateModalOpen, setEstimateModalOpen] = useState(false);

  // (a) Khối Nội dung
  const [title, setTitle] = useState('');
  const [sapo, setSapo] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // (b) Khối Khai báo nghiệp vụ
  const [declaredCategoryId, setDeclaredCategoryId] = useState('');
  const [declaredNature, setDeclaredNature] = useState<ArticleNature>('SANG_TAC');
  const [eventId, setEventId] = useState('');
  const [sectionId, setSectionId] = useState('');

  // (c) Khối Đồng tác giả & Tỷ lệ
  const [authors, setAuthors] = useState<ArticleAuthor[]>([]);
  const [selectedCoAuthorId, setSelectedCoAuthorId] = useState('');

  // (d) Khối Tệp đính kèm & Tác quyền Media
  const [attachments, setAttachments] = useState<ArticleAttachment[]>([]);
  const [isDhashChecked, setIsDhashChecked] = useState(false);

  // Load dữ liệu khi sửa bài
  useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title);
      setSapo(existingArticle.sapo || '');
      setContent(existingArticle.content || '');
      setCoverImage(existingArticle.cover_image || '');
      setSectionId(existingArticle.section_id);
      setDeclaredCategoryId(existingArticle.declared_category_id || existingArticle.category_id || existingArticle.genre_id);
      setDeclaredNature(existingArticle.declared_nature || 'SANG_TAC');
      setEventId(existingArticle.event_id || '');

      // Load đồng tác giả
      const existingAuthors = state.articleAuthors.filter(au => au.article_id === existingArticle.id);
      if (existingAuthors.length > 0) {
        setAuthors(existingAuthors);
      } else {
        setAuthors([
          {
            id: 'aa-init-' + Date.now(),
            article_id: existingArticle.id,
            user_id: existingArticle.author_id,
            is_main: true,
            share_percent: 100,
            confirm_status: 'ACCEPTED',
            confirmed_at: existingArticle.created_at
          }
        ]);
      }

      // Load đính kèm
      const existingAtts = state.articleAttachments.filter(a => a.article_id === existingArticle.id);
      setAttachments(existingAtts);
      setIsDhashChecked(existingAtts.length > 0 && existingAtts.every(a => Boolean(a.hash_check)));
    } else {
      // Khởi tạo bài mới
      setSectionId(state.currentUser.section_id || state.sections[0].id);
      setDeclaredCategoryId(state.genres[0]?.id || 'cat-phongsu');
      setAuthors([
        {
          id: 'aa-main-' + Date.now(),
          article_id: '',
          user_id: state.currentUser.id,
          is_main: true,
          share_percent: 100,
          confirm_status: 'ACCEPTED',
          confirmed_at: new Date().toISOString()
        }
      ]);
    }
  }, [existingArticle, state.articleAuthors, state.articleAttachments, state.currentUser, state.genres, state.sections]);

  // Phản hồi của BTV nếu bài bị trả về (REVISION_REQUESTED)
  const qualityScore = existingArticle ? getArticleQualityScore(existingArticle.id) : null;
  const revisionFeedback = existingArticle?.status === 'REVISION_REQUESTED'
    ? getArticleLogs(existingArticle.id).find(l => l.to_status === 'REVISION_REQUESTED')
    : null;

  // Giới hạn số tác giả tối đa từ tham số hệ thống
  const maxAuthorsLimit = Number(getSystemParameter('MAX_AUTHORS_PER_ARTICLE', 5));

  // Tính toán hệ số bão hòa chuyên đề (giữ nguyên nếu nộp lại)
  const selectedEvent = getEvent(eventId);
  const saturationInfo = useMemo(() => {
    if (!selectedEvent) return null;
    // Nếu là bài nộp lại và đã có saturation_rate khóa trước đó, giữ nguyên
    if (existingArticle?.saturation_rate !== undefined) {
      return {
        rank: existingArticle.saturation_rank ?? 1,
        rate: existingArticle.saturation_rate,
        countInEvent: (existingArticle.saturation_rank ?? 1) - 1
      };
    }
    const countInEvent = state.articles.filter(
      a => a.event_id === selectedEvent.id && a.id !== existingArticle?.id
    ).length;
    const rank = countInEvent + 1;
    let rate = 100;
    if (rank > 15) rate = 60;
    else if (rank > 10) rate = 80;

    return { rank, rate, countInEvent };
  }, [selectedEvent, state.articles, existingArticle]);

  // Tính toán & kiểm tra tổng tỷ lệ phân chia tác giả
  const totalSharePercent = useMemo(() => {
    return authors.reduce((sum, a) => sum + (Number(a.share_percent) || 0), 0);
  }, [authors]);

  const mainAuthor = useMemo(() => authors.find(a => a.is_main), [authors]);
  const isSharesValid = totalSharePercent === 100 && (mainAuthor?.share_percent || 0) >= 10;

  // Danh sách các phóng viên có thể thêm làm đồng tác giả (trừ những người đã có trong bài)
  const availableReporters = useMemo(() => {
    const existingUserIds = new Set(authors.map(a => a.user_id));
    return state.users.filter(u => u.role_code === 'PHONG_VIEN' && !existingUserIds.has(u.id));
  }, [authors, state.users]);

  // Thêm đồng tác giả
  const handleAddCoAuthor = () => {
    if (!selectedCoAuthorId) return;
    if (authors.length >= maxAuthorsLimit) {
      notify(`Một bài viết tối đa có ${maxAuthorsLimit} tác giả (theo quy định tòa soạn)!`, 'warning');
      return;
    }

    const newShare = 20;
    // Điều chỉnh lại tỷ lệ của tác giả chính nếu cần
    let updatedAuthors = authors.map(a => {
      if (a.is_main) {
        const remaining = Math.max(10, a.share_percent - newShare);
        return { ...a, share_percent: remaining };
      }
      return a;
    });

    const newAuthor: ArticleAuthor = {
      id: 'aa-new-' + Date.now(),
      article_id: existingArticle?.id || '',
      user_id: selectedCoAuthorId,
      is_main: false,
      share_percent: newShare,
      confirm_status: 'PENDING'
    };

    setAuthors([...updatedAuthors, newAuthor]);
    setSelectedCoAuthorId('');
    notify(`Đã thêm đồng tác giả ${getUser(selectedCoAuthorId)?.full_name}. Vui lòng kiểm tra lại tỷ lệ phân chia!`, 'info');
  };

  // Xóa đồng tác giả
  const handleRemoveCoAuthor = (userId: string) => {
    const removing = authors.find(a => a.user_id === userId);
    if (!removing || removing.is_main) return;

    const remainingAuthors = authors.filter(a => a.user_id !== userId);
    // Bù lại % cho tác giả chính
    const updated = remainingAuthors.map(a => {
      if (a.is_main) {
        return { ...a, share_percent: a.share_percent + (removing.share_percent || 0) };
      }
      return a;
    });
    setAuthors(updated);
  };

  // Cập nhật % của một tác giả
  const handleUpdateSharePercent = (userId: string, val: number) => {
    setAuthors(authors.map(a => a.user_id === userId ? { ...a, share_percent: val } : a));
  };

  // Nút tiện ích: Chia đều tỷ lệ
  const handleDistributeEvenly = () => {
    if (authors.length <= 1) return;
    const n = authors.length;
    const baseShare = Math.floor(100 / n);
    const remainder = 100 - baseShare * n;

    const updated = authors.map((a, idx) => ({
      ...a,
      share_percent: idx === 0 ? baseShare + remainder : baseShare
    }));
    setAuthors(updated);
    notify('Đã chia đều tỷ lệ đóng góp (phần dư ưu tiên cho tác giả chính).', 'info');
  };

  // Thêm tệp media mẫu
  const handleAddSampleMedia = (type: 'IMAGE' | 'VIDEO', kind: MediaKind = 'ANH_TU_CHUP') => {
    const isImage = type === 'IMAGE';
    const sampleUrls = [
      'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=800&auto=format&fit=crop&q=80'
    ];
    const url = isImage
      ? sampleUrls[attachments.length % sampleUrls.length]
      : 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

    const newAtt: ArticleAttachment = {
      id: 'att-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      article_id: existingArticle?.id || '',
      media_type: type,
      media_kind: kind,
      media_author_id: kind !== 'NGUON_NGOAI' ? state.currentUser.id : undefined,
      external_source: kind === 'NGUON_NGOAI' ? 'Thông tấn xã / Báo chí' : undefined,
      source_type: 'UPLOAD',
      url,
      original_name: isImage ? `anh_hien_truong_${attachments.length + 1}.jpg` : `video_phong_su_${attachments.length + 1}.mp4`,
      file_size: isImage ? 1650000 : 22000000,
      caption: isImage ? `Hình ảnh hiện trường tác nghiệp số ${attachments.length + 1}` : 'Video phản ánh hiện trường thực địa',
      sort_order: attachments.length + 1,
      dhash: 'dh' + Math.random().toString(16).substring(2, 14),
      hash_check: 'MOI',
      created_at: new Date().toISOString()
    };

    setAttachments([...attachments, newAtt]);
    setIsDhashChecked(false);
    notify(`Đã thêm ${isImage ? 'ảnh' : 'video'} đính kèm mới!`, 'info');
  };

  // Cập nhật thuộc tính media
  const handleUpdateAttachment = (attId: string, updates: Partial<ArticleAttachment>) => {
    setAttachments(attachments.map(a => a.id === attId ? { ...a, ...updates } : a));
    setIsDhashChecked(false);
  };

  // Xóa tệp media
  const handleRemoveAttachment = (attId: string) => {
    setAttachments(attachments.filter(a => a.id !== attId));
  };

  // Mô phỏng kiểm tra dHash bản quyền ảnh
  const handleRunDhashCheck = () => {
    if (attachments.length === 0) {
      notify('Chưa có tệp hình ảnh nào để kiểm tra bản quyền dHash!', 'warning');
      return;
    }

    const updated = attachments.map((att, idx) => {
      if (att.media_kind === 'NGUON_NGOAI') {
        return {
          ...att,
          hash_check: 'NGUON_NGOAI' as HashCheckStatus,
          dhash: att.dhash || 'ext-' + Math.random().toString(16).substring(2, 10)
        };
      }
      // Giả lập ảnh thứ 2 nếu có có thể là tái sử dụng
      if (idx === 1 && att.media_kind === 'ANH_TU_CHUP' && att.caption?.toLowerCase().includes('tư liệu')) {
        return {
          ...att,
          hash_check: 'TAI_SU_DUNG' as HashCheckStatus,
          matched_distance_bits: 2,
          matched_article_id: 'art-old-2025'
        };
      }
      return {
        ...att,
        hash_check: (att.hash_check || 'MOI') as HashCheckStatus,
        dhash: att.dhash || 'dh' + Math.random().toString(16).substring(2, 16)
      };
    });

    setAttachments(updated);
    setIsDhashChecked(true);
    notify('Đã hoàn thành kiểm tra dHash: Phân tích 64-bit mã băm cảm nhận và đối chiếu kho dữ liệu ảnh!', 'success');
  };

  // Lưu bản nháp
  const handleSaveDraft = () => {
    if (!title.trim()) {
      notify('Vui lòng nhập tiêu đề bài viết trước khi lưu nháp!', 'error');
      return;
    }

    const artId = existingArticle?.id || ('art-' + Date.now());

    dispatch({
      type: 'SAVE_DRAFT',
      payload: {
        article: {
          id: artId,
          title: title.trim(),
          sapo: sapo.trim(),
          content: content.trim(),
          cover_image: coverImage || attachments.find(a => a.media_type === 'IMAGE')?.url || '',
          section_id: sectionId || state.currentUser.section_id || state.sections[0].id,
          declared_category_id: declaredCategoryId,
          category_id: declaredCategoryId,
          genre_id: declaredCategoryId,
          declared_nature: declaredNature,
          event_id: eventId || undefined,
          author_id: existingArticle?.author_id || state.currentUser.id
        },
        attachments: attachments.map(a => ({ ...a, article_id: artId })),
        authors: authors.map(au => ({ ...au, article_id: artId }))
      }
    });

    notify('Đã lưu bản nháp thành công!', 'success');
    navigate('/reporter/articles');
  };

  // Kiểm tra điều kiện và chuyển sang màn hình Kiểm tra trùng & Nộp bài
  const handleProceedToDuplicationCheck = () => {
    if (!title.trim()) {
      notify('Vui lòng nhập tiêu đề bài viết!', 'error');
      return;
    }
    if (!content.trim()) {
      notify('Vui lòng nhập nội dung bài viết!', 'error');
      return;
    }
    if (!isSharesValid) {
      notify(`Tổng tỷ lệ đóng góp của các tác giả phải đúng bằng 100% (Hiện tại là ${totalSharePercent}%)!`, 'error');
      return;
    }

    const artId = existingArticle?.id || ('art-' + Date.now());

    // Lưu bài vào state trước
    dispatch({
      type: 'SAVE_DRAFT',
      payload: {
        article: {
          id: artId,
          title: title.trim(),
          sapo: sapo.trim(),
          content: content.trim(),
          cover_image: coverImage || attachments.find(a => a.media_type === 'IMAGE')?.url || '',
          section_id: sectionId || state.currentUser.section_id || state.sections[0].id,
          declared_category_id: declaredCategoryId,
          category_id: declaredCategoryId,
          genre_id: declaredCategoryId,
          declared_nature: declaredNature,
          event_id: eventId || undefined,
          author_id: existingArticle?.author_id || state.currentUser.id
        },
        attachments: attachments.map(a => ({ ...a, article_id: artId })),
        authors: authors.map(au => ({ ...au, article_id: artId }))
      }
    });

    // Chuyển sang màn hình kết quả kiểm tra trùng lặp
    navigate(`/reporter/articles/${artId}/duplication-check`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      <PageHeader
        breadcrumbs={[
          { label: 'Tác phẩm của tôi', link: '/reporter/articles' },
          { label: isEditMode ? 'Sửa bài viết' : 'Soạn tác phẩm mới' }
        ]}
        title={isEditMode ? 'Chỉnh sửa tác phẩm & Khai báo tác quyền' : 'Soạn bài mới & Khai báo tác quyền'}
        description="Quy trình 4 khối nghiệp vụ: Soạn thảo nội dung, Khai báo thể loại/tính chất, Xác định đồng tác giả & tỷ lệ, Kiểm tra tác quyền media."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/reporter/articles')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => setEstimateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4 text-amber-700" />
              <span>Ước tính nhuận bút</span>
            </button>
            {existingArticle?.status !== 'REJECTED' && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-300 transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4 text-slate-600" />
                  <span>Lưu bản nháp</span>
                </button>
                <button
                  type="button"
                  onClick={handleProceedToDuplicationCheck}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 shadow-sm transition-colors cursor-pointer"
                >
                  <span>{existingArticle?.status === 'REVISION_REQUESTED' ? 'Kiểm tra & Nộp lại' : 'Kiểm tra trùng & Nộp bài'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        }
      />

      {/* Banner Cảnh báo cho bài bị TỪ CHỐI (REJECTED) */}
      {existingArticle?.status === 'REJECTED' && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-rose-900">Bài đã bị từ chối – kết thúc</h4>
            <p className="text-xs text-rose-800 leading-relaxed">
              Tác phẩm này đã bị Ban Biên tập từ chối xuất bản. Bạn chỉ có thể xem lại thông tin lưu trữ, không thể chỉnh sửa hoặc nộp lại.
            </p>
          </div>
        </div>
      )}

      {/* Thông báo trả về cần sửa nếu có (REVISION_REQUESTED) */}
      {existingArticle?.status === 'REVISION_REQUESTED' && (
        <div className="p-4 rounded-2xl bg-pink-50 border border-pink-300 text-xs space-y-2">
          <div className="flex items-center gap-2 text-pink-900 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-pink-600" />
            <span>Biên tập viên yêu cầu sửa lại bài viết</span>
          </div>
          <div className="p-3 bg-white/90 rounded-xl border border-pink-200 text-pink-950 font-medium leading-relaxed">
            "{revisionFeedback?.note || qualityScore?.note || 'Vui lòng bổ sung tư liệu và chỉnh sửa theo góp ý của BTV.'}"
          </div>
          <p className="text-[11px] text-pink-800 italic">
            * Sau khi sửa xong nội dung, bạn bấm <strong>"Kiểm tra & Nộp lại"</strong>. Nếu cơ cấu tác giả không đổi, bài viết sẽ được chuyển thẳng về đúng BTV cũ để chấm lại. Mức bão hòa đề tài ({existingArticle.saturation_rate ?? 100}%) được giữ nguyên như lần nộp đầu.
          </p>
        </div>
      )}

      {/* (A) KHỐI 1: NỘI DUNG BÀI VIẾT */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-900" />
            <h3 className="text-sm font-bold text-slate-900">Khối 1: Bản thảo nội dung tác phẩm</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Số từ: {content ? content.trim().split(/\s+/).length : 0} từ
          </span>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Tiêu đề bài viết (Headline) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Nhập tiêu đề hấp dẫn, chính xác và đúng tôn chỉ..."
              className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-900 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Tóm tắt / Lời dẫn (Sapo)
            </label>
            <textarea
              rows={2}
              value={sapo}
              onChange={e => setSapo(e.target.value)}
              placeholder="Tóm tắt ngắn gọn sự kiện, vấn đề nổi bật của tác phẩm (khoảng 30-60 từ)..."
              className="w-full px-3.5 py-2 text-xs text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Nội dung chi tiết tác phẩm <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={10}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Soạn thảo toàn văn bài viết phóng sự, điều tra, tin bài..."
              className="w-full px-3.5 py-3 text-xs leading-relaxed text-slate-800 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 font-sans"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1.5">
              Ảnh đại diện bài viết (Cover Image URL)
            </label>
            <input
              type="text"
              value={coverImage}
              onChange={e => setCoverImage(e.target.value)}
              placeholder="https://images.unsplash.com/... (để trống nếu dùng ảnh đính kèm đầu tiên)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* (B) KHỐI 2: KHAI BÁO NGHIỆP VỤ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-900" />
            <h3 className="text-sm font-bold text-slate-900">Khối 2: Khai báo nghiệp vụ & Sự kiện</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Cơ sở xác định khung hệ số nhuận bút & bão hòa đề tài
          </span>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Thể loại khai báo */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Thể loại tác phẩm (PV khai báo) <span className="text-rose-500">*</span>
            </label>
            <select
              value={declaredCategoryId}
              onChange={e => setDeclaredCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer font-medium"
            >
              {state.genres.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} (Khung hệ số: {g.base_factor || g.min_factor} - {g.max_factor})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 mt-1 italic">
              ℹ️ BTV có quyền điều chỉnh thể loại phù hợp hơn trước khi chấm điểm (hệ thống có ghi log lịch sử).
            </p>
          </div>

          {/* Tính chất tác phẩm */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Tính chất tác phẩm <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { val: 'SANG_TAC', label: 'Sáng tác (100%)', desc: 'Độc lập thực tế' },
                { val: 'DICH', label: 'Dịch (50-70%)', desc: 'Tài liệu quốc tế' },
                { val: 'TONG_HOP', label: 'Tổng hợp (40-60%)', desc: 'Nhiều nguồn tin' },
                { val: 'DANG_LAI', label: 'Đăng lại (0%)', desc: 'Nguyên văn nguồn' }
              ].map(item => (
                <label
                  key={item.val}
                  className={`flex flex-col p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                    declaredNature === item.val
                      ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="nature"
                      checked={declaredNature === item.val}
                      onChange={() => setDeclaredNature(item.val as ArticleNature)}
                      className="text-blue-900"
                    />
                    <span>{item.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 pl-4">{item.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sự kiện chuyên đề */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Sự kiện / Chuyên đề tác nghiệp (Nếu có)
            </label>
            <select
              value={eventId}
              onChange={e => setEventId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
            >
              <option value="">-- Không thuộc sự kiện / chuyên đề nào --</option>
              {state.events.filter(ev => ev.is_active).map(ev => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.code})
                </option>
              ))}
            </select>

            {/* Thông tin độ bão hòa K */}
            {saturationInfo && selectedEvent && (
              <div className="mt-2.5 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-950 space-y-1">
                <div className="flex items-center justify-between font-bold">
                  <span>
                    Chuyên đề: "{selectedEvent.name}" đã có {saturationInfo.countInEvent} bài trước đó.
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-200 font-mono text-[11px]">
                    Xếp thứ: {saturationInfo.rank} · Hệ số bão hòa K = {saturationInfo.rate}%
                  </span>
                </div>
                <p className="text-[11px] text-purple-800 leading-relaxed">
                  Quy định bão hòa: Bài thứ ≤ 10 hưởng 100% · Bài 11-15 hưởng 80% · Bài &gt; 15 hưởng 60%.
                  <strong className="ml-1">Miễn trừ bão hòa về 100% nếu bài chấm đạt chất lượng xuất sắc ≥ 90 điểm.</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* (C) KHỐI 3: ĐỒNG TÁC GIẢ & TỶ LỆ PHÂN CHIA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900">
              Khối 3: Tác giả, Đồng tác giả & Tỷ lệ phân chia ({authors.length} người)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDistributeEvenly}
              className="text-[11px] font-semibold text-blue-800 hover:underline cursor-pointer"
            >
              Chia đều tỷ lệ
            </button>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              isSharesValid ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
            }`}>
              Tổng: {totalSharePercent}% {isSharesValid ? '✓' : '⚠️'}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Cảnh báo nếu tổng khác 100% */}
          {!isSharesValid && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  Tổng tỷ lệ hiện là <strong>{totalSharePercent}%</strong> (Cần điều chỉnh về đúng <strong>100%</strong> mới có thể nộp bài duyệt).
                </span>
              </div>
              <button
                type="button"
                onClick={handleDistributeEvenly}
                className="px-2.5 py-1 rounded bg-rose-200 hover:bg-rose-300 font-bold text-[10px] cursor-pointer"
              >
                Cân đối tự động
              </button>
            </div>
          )}

          {/* Bảng danh sách tác giả */}
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Họ tên & Email</th>
                  <th className="py-2.5 px-3">Vai trò trong bài</th>
                  <th className="py-2.5 px-3 w-36">Tỷ lệ hưởng (%)</th>
                  <th className="py-2.5 px-3">Trạng thái xác nhận</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authors.map(author => {
                  const user = getUser(author.user_id);
                  return (
                    <tr key={author.user_id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{user?.full_name || author.user_id}</div>
                        <div className="text-[10px] text-slate-400">{user?.email || 'Phóng viên'} · {user?.press_id}</div>
                      </td>
                      <td className="py-3 px-3">
                        {author.is_main ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                            Tác giả chính (≥ 10%)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Đồng tác giả
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min={author.is_main ? 10 : 1}
                            max={100}
                            value={author.share_percent}
                            onChange={e => handleUpdateSharePercent(author.user_id, Number(e.target.value))}
                            className="w-20 px-2 py-1 text-xs font-mono font-bold text-center border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600"
                          />
                          <span className="text-slate-500 font-bold">%</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {author.is_main ? (
                          <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác nhận
                          </span>
                        ) : author.confirm_status === 'ACCEPTED' ? (
                          <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Đồng ý tham gia
                          </span>
                        ) : author.confirm_status === 'REJECTED' ? (
                          <span className="text-rose-700 font-bold text-[11px] flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Từ chối
                          </span>
                        ) : (
                          <span className="text-amber-700 font-bold text-[11px] flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Chờ xác nhận (3 ngày)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!author.is_main && (
                          <button
                            type="button"
                            onClick={() => handleRemoveCoAuthor(author.user_id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                            title="Xóa đồng tác giả"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Thêm đồng tác giả mới */}
          {authors.length < 5 && availableReporters.length > 0 && (
            <div className="flex items-center gap-3 pt-2">
              <select
                value={selectedCoAuthorId}
                onChange={e => setSelectedCoAuthorId(e.target.value)}
                className="w-72 px-3 py-2 text-xs rounded-xl border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
              >
                <option value="">-- Chọn phóng viên thêm làm đồng tác giả --</option>
                {availableReporters.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} ({r.department})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCoAuthor}
                disabled={!selectedCoAuthorId}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm đồng tác giả</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* (D) KHỐI 4: TỆP ĐÍNH KÈM & TÁC QUYỀN MEDIA */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-800" />
            <h3 className="text-sm font-bold text-slate-900">
              Khối 4: Tệp đính kèm & Tác quyền Media ({attachments.length} tệp)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunDhashCheck}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Kiểm tra bản quyền ảnh (dHash)</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddSampleMedia('IMAGE', 'ANH_TU_CHUP')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-900 hover:bg-blue-100 text-xs font-bold border border-blue-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Ảnh chụp</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddSampleMedia('IMAGE', 'NGUON_NGOAI')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold border border-slate-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Nguồn ngoài</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddSampleMedia('VIDEO', 'VIDEO_TU_QUAY')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-900 hover:bg-indigo-100 text-xs font-bold border border-indigo-200 cursor-pointer"
            >
              <Video className="w-3.5 h-3.5" />
              <span>+ Video</span>
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {attachments.length === 0 ? (
            <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
              <Upload className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs text-slate-500 font-medium">
                Chưa có hình ảnh hoặc video nào đính kèm cho bài viết.
              </p>
              <div className="flex justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleAddSampleMedia('IMAGE', 'ANH_TU_CHUP')}
                  className="px-3 py-1.5 rounded-lg bg-blue-900 text-white text-xs font-semibold cursor-pointer"
                >
                  Thêm ảnh tự chụp
                </button>
                <button
                  type="button"
                  onClick={() => handleAddSampleMedia('IMAGE', 'NGUON_NGOAI')}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  Thêm ảnh nguồn ngoài
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {attachments.map((att, idx) => {
                const isImage = att.media_type === 'IMAGE' || !att.media_type;
                const isExternal = att.media_kind === 'NGUON_NGOAI';
                const isReuse = att.hash_check === 'TAI_SU_DUNG';

                return (
                  <div
                    key={att.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col md:flex-row gap-4 items-start"
                  >
                    {/* Thumbnail */}
                    <div className="w-28 h-20 shrink-0 rounded-lg overflow-hidden bg-slate-200 border border-slate-300 relative">
                      <img
                        src={att.url}
                        alt={att.caption || 'Media'}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (!target.dataset.fallback) {
                            target.dataset.fallback = 'true';
                            target.src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186f5f8?w=800&auto=format&fit=crop&q=80';
                          }
                        }}
                      />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-mono">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* Form thuộc tính media */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full text-xs">
                      {/* Caption */}
                      <div className="md:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Chú thích ảnh / Chú giải <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={att.caption || ''}
                          onChange={e => handleUpdateAttachment(att.id, { caption: e.target.value })}
                          placeholder="Mô tả nội dung hình ảnh, địa điểm chụp..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs"
                        />
                      </div>

                      {/* Loại tác quyền */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                          Loại tác quyền
                        </label>
                        <select
                          value={att.media_kind || 'ANH_TU_CHUP'}
                          onChange={e => handleUpdateAttachment(att.id, { media_kind: e.target.value as MediaKind })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-xs cursor-pointer"
                        >
                          <option value="ANH_TU_CHUP">Ảnh tự chụp (Thuộc bài)</option>
                          <option value="TRANH_TU_VE">Tranh / Đồ họa tự vẽ</option>
                          <option value="VIDEO_TU_QUAY">Video tự quay hiện trường</option>
                          <option value="NGUON_NGOAI">Nguồn ngoài (Khai thác)</option>
                        </select>
                      </div>

                      {/* Tác giả / Nguồn ngoài */}
                      <div className="md:col-span-2">
                        {isExternal ? (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Tên cơ quan / Nguồn ảnh ngoài
                            </label>
                            <input
                              type="text"
                              value={att.external_source || ''}
                              onChange={e => handleUpdateAttachment(att.id, { external_source: e.target.value })}
                              placeholder="Ví dụ: TTXVN, Reuters, Báo Tuổi Trẻ..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Tác giả chụp ảnh (Phải là 1 trong các tác giả bài viết)
                            </label>
                            <select
                              value={att.media_author_id || authors[0]?.user_id}
                              onChange={e => handleUpdateAttachment(att.id, { media_author_id: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs cursor-pointer"
                            >
                              {authors.map(au => (
                                <option key={au.user_id} value={au.user_id}>
                                  {getUser(au.user_id)?.full_name} ({au.is_main ? 'Tác giả chính' : 'Đồng tác giả'})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      {/* Trạng thái hash dHash */}
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            dHash: {att.dhash ? att.dhash.substring(0, 10) + '...' : 'Chưa hash'}
                          </div>
                          {isReuse ? (
                            <span className="text-[10px] font-bold text-amber-700">
                              ⚠️ Tái sử dụng (Hệ số = 0)
                            </span>
                          ) : isExternal ? (
                            <span className="text-[10px] text-slate-500">
                              Nguồn ngoài (0 hệ số)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700">
                              ✓ Mới (Tính hệ số 100%)
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(att.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 cursor-pointer"
                          title="Xóa tệp này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => navigate('/reporter/articles')}
          className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          Hủy và quay lại
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setEstimateModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors shadow-2xs cursor-pointer"
          >
            <Coins className="w-4 h-4 text-amber-700" />
            <span>Ước tính nhuận bút</span>
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-slate-800 hover:bg-slate-50 border border-slate-300 transition-colors shadow-2xs cursor-pointer"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>Lưu bản nháp</span>
          </button>

          <button
            type="button"
            onClick={handleProceedToDuplicationCheck}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-900 text-white hover:bg-blue-800 shadow-sm transition-all cursor-pointer"
          >
            <span>{existingArticle?.status === 'REVISION_REQUESTED' ? 'Kiểm tra & Nộp lại' : 'Kiểm tra trùng lặp & Nộp bài'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modal Ước tính nhuận bút */}
      <RoyaltyEstimateModal
        isOpen={estimateModalOpen}
        onClose={() => setEstimateModalOpen(false)}
        article={
          existingArticle || {
            id: 'art-temp',
            author_id: state.currentUser.id,
            section_id: sectionId || state.sections[0].id,
            declared_category_id: declaredCategoryId,
            category_id: declaredCategoryId,
            genre_id: declaredCategoryId,
            declared_nature: declaredNature,
            event_id: eventId || undefined,
            title: title || 'Tác phẩm mới',
            sapo,
            content,
            status: 'DRAFT',
            saturation_rank: saturationInfo?.rank,
            saturation_rate: saturationInfo?.rate,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        }
        authors={authors}
        attachments={attachments}
      />
    </div>
  );
};
