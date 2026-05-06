/** Format a date string for display. */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Format a timestamp for chat messages. */
export function formatTime(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit',
  });
}

/** Relative time (e.g. "2h ago", "3d ago"). */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);

  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30)  return `${days}d ago`;
  return formatDate(dateStr);
}

/** Get display name from a profile + role profile combo. */
export function getDisplayName(baseProfile, roleProfile) {
  if (!baseProfile) return 'Unknown';
  if (roleProfile) {
    const name = roleProfile.display_name || roleProfile.business_name ||
                 roleProfile.brand_name || roleProfile.org_name;
    if (name) return name;
  }
  return baseProfile.full_name || baseProfile.email?.split('@')[0] || 'Unknown';
}

/** Role label for display. */
export function roleLabel(role) {
  const labels = {
    creator:  'Creator',
    business: 'Business',
    brand:    'Brand',
    charity:  'Charity',
  };
  return labels[role] || role;
}

/** Status badge class. */
export function statusClass(status) {
  const map = {
    pending:   'badge-pending',
    accepted:  'badge-accepted',
    declined:  'badge-declined',
    completed: 'badge-accepted',
    cancelled: 'badge-declined',
  };
  return map[status] || 'badge-pending';
}

/** Truncate text with ellipsis. */
export function truncate(str, len = 80) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

/** Generate initials from a name. */
export function initials(name) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
