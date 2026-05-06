import { X, MapPin, Instagram, Globe, Users, Star, ExternalLink, Award } from 'lucide-react';
import { roleLabel, getDisplayName, initials } from '../../lib/utils';

/**
 * Profile detail popup. Works for both member profiles and Google Business listings.
 *
 * Props:
 *   - partner: object (member profile row joined with base profile, OR a google result)
 *   - isGoogle: boolean
 *   - onClose: () => void
 *   - onPropose: (partner) => void  — opens the proposal modal
 *   - onMessage: (partner) => void  — opens messaging (hidden for Google listings)
 */
export default function ProfileDetailModal({ partner, isGoogle, onClose, onPropose, onMessage }) {
  if (!partner) return null;

  // Extract fields depending on source
  const base = partner.profiles || {};
  const name = isGoogle
    ? partner.name
    : getDisplayName(base, partner);

  const description = isGoogle
    ? partner.address
    : partner.bio || partner.description || '';

  const role = isGoogle ? 'business' : (base.role || 'business');

  const location = isGoogle
    ? partner.address
    : [partner.city, partner.state].filter(Boolean).join(', ') || partner.address;

  const website = partner.website;
  const instagram = partner.instagram;
  const rating = partner.rating;
  const hasHosted = partner.has_hosted_events;
  const tags = partner.tags || partner.event_types || partner.partnership_types || [];
  const capacity = partner.capacity;
  const amenities = partner.amenities || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-surface-100 px-6 py-4 flex items-start justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-semibold">
              {initials(name)}
            </div>
            <div>
              <h2 className="font-display text-lg text-surface-800">{name}</h2>
              <div className="flex items-center gap-2">
                <span className="badge badge-role text-[10px]">{roleLabel(role)}</span>
                {isGoogle && (
                  <span className="badge bg-blue-50 text-blue-600 border-blue-200 text-[10px]">
                    Google Business
                  </span>
                )}
                {hasHosted && (
                  <span className="inline-flex items-center gap-1 badge bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]">
                    <Award size={10} /> Has hosted events
                  </span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 -mr-1.5 -mt-0.5">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Description */}
          {description && (
            <p className="text-sm text-surface-600 leading-relaxed">{description}</p>
          )}

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {location && (
              <div className="flex items-start gap-2">
                <MapPin size={15} className="text-surface-400 mt-0.5 shrink-0" />
                <span className="text-surface-600">{location}</span>
              </div>
            )}
            {rating && (
              <div className="flex items-center gap-2">
                <Star size={15} className="text-amber-400 fill-amber-400 shrink-0" />
                <span className="text-surface-600">{rating} rating</span>
              </div>
            )}
            {capacity && (
              <div className="flex items-center gap-2">
                <Users size={15} className="text-surface-400 shrink-0" />
                <span className="text-surface-600">Capacity: {capacity}</span>
              </div>
            )}
            {website && (
              <a href={website.startsWith('http') ? website : `https://${website}`} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-brand-600 hover:underline">
                <Globe size={15} className="shrink-0" />
                Website
                <ExternalLink size={12} />
              </a>
            )}
            {instagram && (
              <a href={`https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer"
                 className="flex items-center gap-2 text-brand-600 hover:underline">
                <Instagram size={15} className="shrink-0" />
                {instagram}
              </a>
            )}
          </div>

          {/* Amenities */}
          {amenities.length > 0 && (
            <div>
              <p className="label mb-2">Amenities</p>
              <div className="flex flex-wrap gap-1.5">
                {amenities.map(a => (
                  <span key={a} className="badge bg-surface-100 text-surface-600 border-surface-200 text-xs">
                    {a.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <p className="label mb-2">Tags</p>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="badge bg-brand-50 text-brand-700 border-brand-200 text-xs">{t}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-white border-t border-surface-100 px-6 py-4 flex gap-3 rounded-b-2xl">
          <button onClick={() => onPropose(partner)} className="btn-primary flex-1">
            Send Proposal
          </button>
          {!isGoogle && onMessage && (
            <button onClick={() => onMessage(partner)} className="btn-secondary flex-1">
              Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
