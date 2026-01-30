import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { getCategoryIcon, getCategoryLabel, getPriorityColor, getStatusBadge, formatTimeAgo } from '../../utils/helpers';

const ReportCard = ({ report, compact = false }) => {
  const navigate = useNavigate();
  const cardRef = useRef(null);

  useEffect(() => {
    if (cardRef.current && !compact) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
      );
    }
  }, [compact]);

  const handleClick = () => {
    navigate(`/report/${report.id}`);
  };

  if (compact) {
    // Compact version for map popups
    return (
      <div className="w-64 p-0">
        {/* Photo */}
        <div className="relative h-32 -mx-3 -mt-3 mb-3">
          <img
            src={report.photo_url}
            alt={report.title}
            className="w-full h-full object-cover"
          />
          <div className={`absolute top-2 right-2 ${getStatusBadge(report.status)}`}>
            {report.status.replace('_', ' ')}
          </div>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">{report.title}</h3>
        
        <div className="flex items-center space-x-2 mb-2">
          <span className={`badge ${getPriorityColor(report.priority)}`}>
            {report.priority}
          </span>
          <span className="text-xs text-gray-500">{getCategoryLabel(report.category)}</span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
            </svg>
            <span>{report.vote_count}</span>
          </div>
          <span>{formatTimeAgo(report.created_at)}</span>
        </div>

        <button
          onClick={handleClick}
          className="w-full mt-3 btn-primary text-sm py-2"
        >
          View Details
        </button>
      </div>
    );
  }

  // Full card version
  return (
    <div
      ref={cardRef}
      onClick={handleClick}
      className="card cursor-pointer hover:scale-[1.02] transition-transform duration-300"
    >
      {/* Photo */}
      <div className="relative h-48">
        <img
          src={report.photo_url}
          alt={report.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        {/* Status badge */}
        <div className={`absolute top-3 right-3 ${getStatusBadge(report.status)}`}>
          {report.status.replace('_', ' ')}
        </div>

        {/* Priority indicator */}
        <div className={`absolute top-3 left-3 badge ${getPriorityColor(report.priority)}`}>
          {report.priority}
        </div>

        {/* Category icon */}
        <div className="absolute bottom-3 left-3 flex items-center space-x-2 text-white">
          <span className={`category-icon category-${report.category}`}>
            {getCategoryIcon(report.category)}
          </span>
          <span className="text-sm font-medium">{getCategoryLabel(report.category)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {report.title}
        </h3>

        {report.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {report.description}
          </p>
        )}

        {/* Address */}
        {report.address && (
          <div className="flex items-start space-x-2 text-sm text-gray-500 mb-3">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">{report.address}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex items-center space-x-4">
            {/* Votes */}
            <div className="flex items-center space-x-1 text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
              </svg>
              <span className="font-medium">{report.vote_count}</span>
            </div>

            {/* Views */}
            <div className="flex items-center space-x-1 text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{report.view_count}</span>
            </div>
          </div>

          <span className="text-sm text-gray-500">{formatTimeAgo(report.created_at)}</span>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
