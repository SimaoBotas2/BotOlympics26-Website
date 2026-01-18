import React from 'react';
import { useImageTransform } from '../hooks/useImageTransform';

/**
 * TeamMember Component
 * 
 * Displays a single team member card with image, name, and role.
 * Supports custom image transformations via the imageTransforms config.
 * 
 * @param {Object} member - Member data object
 * @param {string} member.name - Team member name
 * @param {string} member.role - Team member role/position
 * @param {string} member.img - Image path/URL
 * @param {string} [member.id] - Optional unique identifier for custom transforms
 * @returns {JSX.Element} Team member card
 * 
 * Usage:
 * <TeamMember member={{ name: "João", role: "Developer", img: "/path/to/photo.jpg" }} />
 */
export default function TeamMember({ member }) {
  // Get any custom transforms applied to this member
  const imageClassName = useImageTransform(member.id || member.name);

  return (
    <div className="team-member">
      <img 
        className={`avatar ${imageClassName}`}
        src={member.img} 
        alt=""
      />
      <div className="member-name">{member.name}</div>
      <div className="member-role">{member.role}</div>
    </div>
  );
}
