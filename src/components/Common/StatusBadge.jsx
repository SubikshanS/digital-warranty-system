import React from 'react';

export const StatusBadge = ({ type = 'warranty', status }) => {
  let badgeStyle = 'bg-gray-100 text-gray-800 border-gray-300';
  let label = String(status).toUpperCase();

  if (type === 'warranty') {
    if (label === 'ACTIVE') {
      badgeStyle = 'badge-active';
    } else if (label === 'EXPIRED') {
      badgeStyle = 'badge-expired';
    } else {
      badgeStyle = 'badge-notfound';
      label = 'NOT FOUND';
    }
  } else if (type === 'claim') {
    switch (label) {
      case '0':
      case 'SUBMITTED':
        badgeStyle = 'badge-submitted';
        label = 'SUBMITTED';
        break;
      case '1':
      case 'APPROVED':
        badgeStyle = 'badge-approved';
        label = 'APPROVED';
        break;
      case '2':
      case 'REJECTED':
        badgeStyle = 'badge-rejected';
        label = 'REJECTED';
        break;
      case '3':
      case 'COMPLETED':
        badgeStyle = 'badge-completed';
        label = 'COMPLETED';
        break;
      default:
        badgeStyle = 'badge-notfound';
    }
  }

  return (
    <span className={`status-badge ${badgeStyle}`}>
      <span className="dot"></span>
      {label}
    </span>
  );
};
