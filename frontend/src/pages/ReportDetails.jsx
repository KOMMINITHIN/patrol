import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import toast from 'react-hot-toast';
import { getReportById, updateReportStatus } from '../services/reports';
import { voteOnReport, checkIfVoted } from '../services/votes';
import { getComments, addComment, subscribeToComments } from '../services/comments';
import { useAuthStore } from '../stores/authStore';
import { getCategoryIcon, getCategoryLabel, getPriorityColor, getStatusBadge, formatTimeAgo, formatDate, shareReport } from '../utils/helpers';

const ReportDetails = ({ isOverlay = false, onClose }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, signIn } = useAuthStore();
  
  const [report, setReport] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSendingComment, setIsSendingComment] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  
  const contentRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    // Load everything in parallel for faster loading
    Promise.all([
      loadReport(),
      loadComments()
    ]);
  }, [id]);

  useEffect(() => {
    // Subscribe to realtime comments only after initial load
    if (!isLoading) {
      const subscription = subscribeToComments(id, (payload) => {
        if (payload.eventType === 'INSERT') {
          setComments((prev) => [...prev, payload.new]);
          scrollToBottom();
        } else if (payload.eventType === 'DELETE') {
          setComments((prev) => prev.filter((c) => c.id !== payload.old.id));
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id, isLoading]);

  useEffect(() => {
    // GSAP entrance animation
    if (contentRef.current && !isLoading) {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
  }, [isLoading]);

  const loadReport = async (retryCount = 0) => {
    try {
      const data = await getReportById(id);
      setReport(data);
      
      // Check if user has voted (non-blocking)
      checkIfVoted(id).then(setHasVoted).catch(console.error);
    } catch (error) {
      console.error('Error loading report:', error);
      
      // Retry up to 2 times with delay
      if (retryCount < 2) {
        setTimeout(() => loadReport(retryCount + 1), 1000);
        return;
      }
      
      toast.error('Failed to load report. Please try again.');
      if (!isOverlay) {
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const data = await getComments(id);
      setComments(data);
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVote = async () => {
    if (hasVoted) {
      toast.error('You have already voted on this issue');
      return;
    }

    setIsVoting(true);
    try {
      await voteOnReport(id, user?.id);
      setHasVoted(true);
      setReport((prev) => ({
        ...prev,
        vote_count: prev.vote_count + 1,
      }));
      toast.success('Vote recorded! Thanks for your input.');
    } catch (error) {
      toast.error(error.message || 'Failed to vote');
    } finally {
      setIsVoting(false);
    }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!isAuthenticated) {
      toast.error('Please sign in to comment');
      return;
    }

    setIsSendingComment(true);
    try {
      await addComment(id, user.id, newComment);
      setNewComment('');
      toast.success('Comment added');
    } catch (error) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setIsSendingComment(false);
    }
  };

  const handleShare = async () => {
    const success = await shareReport(report);
    if (success) {
      toast.success('Link copied to clipboard!');
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to update status');
      return;
    }

    try {
      await updateReportStatus(id, newStatus, null, null, user.id);
      setReport((prev) => ({ ...prev, status: newStatus }));
      setShowStatusModal(false);
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className={`${isOverlay ? 'p-8 min-h-[400px]' : 'min-h-[calc(100vh-64px)]'} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading report...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className={`${isOverlay ? 'p-8 min-h-[300px]' : 'min-h-[calc(100vh-64px)]'} flex items-center justify-center bg-gray-50`}>
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-700 font-semibold mb-1">Report not found</p>
          <p className="text-gray-500 text-sm mb-4">This report may have been removed</p>
          <button onClick={isOverlay ? onClose : () => navigate('/app')} className="btn-primary">
            Back to Map
          </button>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    if (isOverlay && onClose) {
      onClose();
    } else {
      navigate('/app');
    }
  };

  return (
    <div className={`${isOverlay ? '' : 'min-h-screen'} bg-gray-50`}>
      <div ref={contentRef} className={`${isOverlay ? '' : 'max-w-2xl mx-auto'}`}>
        
        {/* Hero Image Section */}
        <div className={`relative ${isOverlay ? 'h-48' : 'h-56 sm:h-72'}`}>
          <img
            src={report.photo_url || 'https://via.placeholder.com/800x400?text=No+Image'}
            alt={report.title}
            className="w-full h-full object-cover"
            loading="eager"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/800x400?text=No+Image';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          
          {/* Navigation Buttons */}
          <div className="absolute top-4 left-4 right-4 flex justify-between">
            <button
              onClick={handleBack}
              className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-105"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleShare}
              className="w-10 h-10 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-105"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
          </div>

          {/* Status & Priority Badges */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <span className={`${getStatusBadge(report.status)} capitalize shadow-lg`}>
                {report.status.replace('_', ' ')}
              </span>
              <span className={`badge ${getPriorityColor(report.priority)} capitalize shadow-lg`}>
                {report.priority}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-4 pb-32">
          
          {/* Title & Category Card */}
          <div className="bg-white rounded-2xl shadow-sm -mt-6 relative z-10 p-5 mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-3">{report.title}</h1>
            
            <div className="flex items-center gap-3">
              <span className={`category-icon category-${report.category} w-9 h-9 text-lg`}>
                {getCategoryIcon(report.category)}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{getCategoryLabel(report.category)}</p>
                <p className="text-xs text-gray-500">{formatTimeAgo(report.created_at)}</p>
              </div>
            </div>

            {/* Description */}
            {report.description && (
              <p className="text-gray-600 text-sm mt-4 leading-relaxed">{report.description}</p>
            )}
          </div>

          {/* Location Card */}
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{report.address || 'Location'}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {report.latitude.toFixed(6)}, {report.longitude.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{report.vote_count}</p>
              <p className="text-xs text-blue-700 font-medium">Upvotes</p>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-slate-100 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">{report.view_count}</p>
              <p className="text-xs text-gray-500 font-medium">Views</p>
            </div>
          </div>

          {/* Reporter Card */}
          {report.profiles && (
            <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
              <div className="flex items-center gap-3">
                {report.profiles.avatar_url ? (
                  <img
                    src={report.profiles.avatar_url}
                    alt={report.profiles.display_name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {report.profiles.display_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{report.profiles.display_name}</p>
                  <p className="text-xs text-gray-500">Reported {formatDate(report.created_at)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleVote}
              disabled={hasVoted || isVoting}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold transition-all ${
                hasVoted
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25'
              }`}
            >
              {isVoting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                  </svg>
                  <span>{hasVoted ? 'Voted!' : 'Upvote'}</span>
                </>
              )}
            </button>

            {isAuthenticated && report.status !== 'resolved' && (
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex-1 py-3.5 rounded-xl font-semibold border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all"
              >
                Update Status
              </button>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                Community Discussion
                <span className="ml-2 text-sm font-normal text-gray-500">({comments.length})</span>
              </h2>
            </div>

            {/* Comments List */}
            <div className="max-h-80 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">No comments yet</p>
                  <p className="text-gray-400 text-xs mt-1">Be the first to share your thoughts!</p>
                </div>
              ) : (
                <div className="p-4 space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`flex gap-2.5 ${comment.user_id === user?.id ? 'flex-row-reverse' : ''}`}
                    >
                      {comment.profiles?.avatar_url ? (
                        <img
                          src={comment.profiles.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-medium">
                            {comment.profiles?.display_name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div className={`max-w-[75%] ${comment.user_id === user?.id ? 'items-end' : ''}`}>
                        <div
                          className={`rounded-2xl px-4 py-2.5 ${
                            comment.user_id === user?.id
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md'
                              : 'bg-gray-100 text-gray-900 rounded-bl-md'
                          }`}
                        >
                          <p className={`text-xs font-medium mb-1 ${comment.user_id === user?.id ? 'text-blue-100' : 'text-gray-500'}`}>
                            {comment.profiles?.display_name || 'User'}
                          </p>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                        <p className={`text-[10px] text-gray-400 mt-1 ${comment.user_id === user?.id ? 'text-right' : ''}`}>
                          {formatTimeAgo(comment.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Comment Input */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              {isAuthenticated ? (
                <form onSubmit={handleSendComment} className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={500}
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim() || isSendingComment}
                    className="w-11 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-all hover:shadow-lg"
                  >
                    {isSendingComment ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </form>
              ) : (
                <button
                  onClick={signIn}
                  className="w-full py-3 bg-white border border-gray-200 rounded-xl text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
                >
                  Sign in to join the discussion
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => setShowStatusModal(false)}>
          <div 
            className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl animate-slide-up safe-area-bottom" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle bar for mobile */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>
            
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold text-gray-900">Update Status</h3>
                <button 
                  onClick={() => setShowStatusModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                {['open', 'in_progress', 'resolved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={report.status === status}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                      report.status === status
                        ? 'border-primary-500 bg-primary-50 shadow-md'
                        : 'border-gray-100 bg-gray-50 hover:border-gray-200 hover:bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          status === 'open' ? 'bg-red-100' : 
                          status === 'in_progress' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          {status === 'open' && (
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {status === 'in_progress' && (
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          {status === 'resolved' && (
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 capitalize block">
                            {status.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {status === 'open' && 'Issue is awaiting attention'}
                            {status === 'in_progress' && 'Issue is being addressed'}
                            {status === 'resolved' && 'Issue has been fixed'}
                          </span>
                        </div>
                      </div>
                      {report.status === status && (
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          <span className="text-xs text-primary-600 font-semibold">Current</span>
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetails;
