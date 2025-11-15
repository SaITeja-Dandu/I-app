/**
 * @file pages/SetupScreen.tsx
 * @description User profile setup with modern design
 */

import { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { createLogger } from '../utils/logger';
import type { UserProfile } from '../types';

const logger = createLogger('setup-screen');

interface SetupScreenProps {
  onProfileSave: (profile: Partial<UserProfile>) => Promise<void>;
  isLoading?: boolean;
  initialProfile?: UserProfile;
}

const ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Mobile Developer', 'DevOps Engineer', 'Data Scientist',
  'QA Engineer', 'Product Manager',
];

const SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'AWS', 'Docker',
  'SQL', 'JavaScript', 'Vue.js', 'Angular', 'GraphQL', 'MongoDB',
  'PostgreSQL', 'Git', 'REST APIs',
];

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onProfileSave,
  isLoading = false,
  initialProfile,
}) => {
  const [role, setRole] = useState(initialProfile?.role || '');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setCustomSkill('');
      if (errors.skills) setErrors({ ...errors, skills: '' });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!role.trim()) newErrors.role = 'Role is required';
    if (skills.length === 0) newErrors.skills = 'At least one skill is required';
    if (skills.length > 20) newErrors.skills = 'Maximum 20 skills allowed';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Valid email required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onProfileSave({ role: role.trim(), skills, email: email || undefined });
      logger.info('Profile saved');
    } catch (error) {
      logger.error({ error }, 'Failed to save profile');
      setErrors({ form: 'Failed to save profile. Please try again.' });
    }
  };

  return (
    <div style={{ minHeight: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(16px, 4vw, 24px)', background: '#f5f5f5' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(24px, 8vw, 40px)' }}>
          <div style={{ marginBottom: '16px', fontSize: 'clamp(36px, 10vw, 48px)' }}>🚀</div>
          <h1 style={{ fontSize: 'clamp(24px, 7vw, 32px)', fontWeight: 'bold', marginBottom: '8px', color: '#111' }}>Build Your Profile</h1>
          <p style={{ fontSize: 'clamp(14px, 4vw, 16px)', color: '#666' }}>Start your AI-powered interview journey</p>
        </div>

        {errors.form && (
          <div style={{ marginBottom: '24px', padding: '16px', background: '#fee', border: '1px solid #fcc', borderRadius: '8px', color: '#c00', fontWeight: '600' }}>
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <label style={{ display: 'block', fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold', marginBottom: '16px', color: '#111' }}>Professional Role</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap: '12px' }}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    if (errors.role) setErrors({ ...errors, role: '' });
                  }}
                  style={{
                    padding: '12px',
                    borderRadius: '6px',
                    border: role === r ? '2px solid #0066cc' : '1px solid #ddd',
                    background: role === r ? '#e6f2ff' : 'white',
                    color: role === r ? '#0066cc' : '#333',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 200ms'
                  }}
                  onMouseEnter={(e) => {
                    if (role !== r) {
                      e.currentTarget.style.borderColor = '#999';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (role !== r) {
                      e.currentTarget.style.borderColor = '#ddd';
                    }
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            {errors.role && <p style={{ fontSize: '14px', color: '#c00', marginTop: '8px', fontWeight: '600' }}>{errors.role}</p>}
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Input
              label="Email Address (Optional)"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              error={errors.email}
            />
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <label style={{ display: 'block', fontSize: 'clamp(14px, 4vw, 16px)', fontWeight: 'bold', marginBottom: '16px', color: '#111' }}>Technical Skills</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
              <Input
                type="text"
                placeholder="Add a skill..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSkill(customSkill);
                  }
                }}
                fullWidth
              />
              <Button
                type="button"
                onClick={() => addSkill(customSkill)}
                disabled={!customSkill || isLoading}
                variant="secondary"
                size="md"
              >
                Add
              </Button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '14px', color: '#666', fontWeight: '600', marginBottom: '8px' }}>Popular skills:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {SKILL_SUGGESTIONS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => addSkill(skill)}
                    disabled={skills.includes(skill) || isLoading}
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      borderRadius: '20px',
                      border: 'none',
                      background: skills.includes(skill) ? '#e6e6e6' : '#0066cc',
                      color: skills.includes(skill) ? '#999' : 'white',
                      fontWeight: '500',
                      cursor: skills.includes(skill) ? 'not-allowed' : 'pointer',
                      opacity: skills.includes(skill) ? 0.6 : 1
                    }}
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>

            {skills.length > 0 && (
              <div style={{ padding: '16px', background: '#f9f9f9', borderRadius: '6px', border: '1px solid #e6e6e6', marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>Selected ({skills.length}/20):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {skills.map((skill, idx) => (
                    <div
                      key={skill}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#0066cc',
                        color: 'white',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = skills.filter((_, i) => i !== idx);
                          setSkills(updated);
                          setErrors({});
                        }}
                        title="Remove skill"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'white',
                          cursor: 'pointer',
                          padding: '0',
                          fontSize: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '18px',
                          height: '18px',
                          transition: 'transform 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.2)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {errors.skills && <p style={{ fontSize: '14px', color: '#c00', marginTop: '8px', fontWeight: '600' }}>{errors.skills}</p>}
          </div>

          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <Button
              type="submit"
              disabled={isLoading}
              variant="primary"
              size="lg"
              style={{ width: '100%' }}
            >
              {isLoading ? 'Saving...' : 'Save Profile & Start'}
            </Button>
          </div>
        </form>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginTop: '24px' }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111', marginBottom: '12px' }}>✨ What's Included</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ fontSize: '14px', color: '#666' }}>• 5 tailored questions</li>
              <li style={{ fontSize: '14px', color: '#666' }}>• Real-time AI evaluation</li>
              <li style={{ fontSize: '14px', color: '#666' }}>• Detailed feedback</li>
            </ul>
          </div>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#111', marginBottom: '12px' }}>🎯 Pro Tips</h3>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li style={{ fontSize: '14px', color: '#666' }}>• Be specific with skills</li>
              <li style={{ fontSize: '14px', color: '#666' }}>• Use your actual job title</li>
              <li style={{ fontSize: '14px', color: '#666' }}>• Add technologies you use</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetupScreen;
