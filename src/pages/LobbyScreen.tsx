/**
 * @file pages/LobbyScreen.tsx
 * @description Main dashboard with modern design
 */

import { useMemo } from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { INTERVIEW_LENGTH, SCORE_RANGES } from '../utils/constants';
import type { UserProfile, InterviewSession } from '../types';

interface LobbyScreenProps {
  profile: UserProfile;
  history: InterviewSession[];
  onStartInterview: () => void;
  onEditProfile: () => void;
  isLoading?: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  profile,
  history,
  onStartInterview,
  onEditProfile,
  isLoading = false,
}) => {
  const stats = useMemo(() => {
    if (history.length === 0) return null;
    const totalScore = history.reduce((sum, s) => sum + s.score, 0);
    const avgScore = totalScore / history.length;
    const best = Math.max(...history.map((s) => s.score));
    return { avgScore: avgScore.toFixed(1), best, total: history.length };
  }, [history]);

  const historyList = useMemo(() => {
    return history.slice(0, 5).map((session) => {
      const scoreRange = Object.values(SCORE_RANGES).find((r) => session.score >= r.min) || SCORE_RANGES.POOR;
      return (
        <div key={session.id} style={{ background: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <h4 style={{ fontWeight: 'bold', color: '#111', fontSize: 'clamp(14px, 4vw, 16px)' }}>{session.role}</h4>
              <Badge label={`${session.questions.length}/${INTERVIEW_LENGTH} Q`} variant="info" size="sm" />
            </div>
            <p style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#999' }}>
              {new Date(session.date).toLocaleDateString()} • {Math.floor(session.duration / 60)}m
            </p>
          </div>
          <div style={{ textAlign: 'right', minWidth: 'auto' }}>
            <div style={{ fontSize: 'clamp(20px, 5vw, 28px)', fontWeight: 'bold', marginBottom: '8px', color: scoreRange.color }}>
              {session.score.toFixed(1)}
            </div>
            <Badge label={scoreRange.label} variant={
              scoreRange.label === 'Excellent' ? 'success' :
              scoreRange.label === 'Good' ? 'primary' :
              scoreRange.label === 'Fair' ? 'warning' : 'danger'
            } size="sm" />
          </div>
        </div>
      );
    });
  }, [history]);

  return (
    <div style={{ minHeight: '100vh', width: '100%', padding: 'max(16px, 4vw)', background: '#f5f5f5' }}>
      <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(16px, 5vw, 24px)', marginBottom: 'clamp(24px, 6vw, 32px)' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(24px, 8vw, 36px)', fontWeight: 'bold', color: '#111', marginBottom: '8px' }}>Welcome back!</h1>
            <p style={{ fontSize: 'clamp(14px, 4vw, 16px)', color: '#666' }}>{profile.role} • {profile.skills.length} skills</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={onEditProfile} size="md">
              ✏️ Edit Profile
            </Button>
            <Button variant="primary" onClick={onStartInterview} disabled={isLoading} size="md">
              {isLoading ? 'Starting...' : '🚀 Start Interview'}
            </Button>
          </div>
        </div>

        {/* Profile Card */}
        <div style={{ background: 'white', padding: 'clamp(16px, 5vw, 24px)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 'clamp(16px, 4vw, 24px)' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Role</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>{profile.role}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Skills</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {profile.skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} label={skill} variant="primary" size="sm" />
                ))}
                {profile.skills.length > 3 && (
                  <Badge label={`+${profile.skills.length - 3}`} variant="secondary" size="sm" />
                )}
              </div>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Interviews</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#0066cc' }}>{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        {/* Performance Stats */}
        {stats && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: 'clamp(20px, 6vw, 24px)', fontWeight: 'bold', color: '#111', marginBottom: '16px' }}>Performance</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 'clamp(12px, 3vw, 16px)' }}>
              <div style={{ background: 'white', padding: 'clamp(16px, 4vw, 24px)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '10px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Total</p>
                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', color: '#0066cc' }}>{stats.total}</p>
              </div>
              <div style={{ background: 'white', padding: 'clamp(16px, 4vw, 24px)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '10px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Average</p>
                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', color: '#0066cc' }}>{stats.avgScore}</p>
                <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>out of 100</p>
              </div>
              <div style={{ background: 'white', padding: 'clamp(16px, 4vw, 24px)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <p style={{ fontSize: '10px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Best</p>
                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', color: '#0066cc' }}>{stats.best}</p>
                <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>personal best</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Interviews */}
        {history.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111', marginBottom: '16px' }}>Recent Interviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {historyList}
            </div>
          </div>
        )}

        {/* Empty State */}
        {history.length === 0 && (
          <div style={{ background: 'white', padding: '64px 24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <h3 style={{ fontSize: '28px', fontWeight: 'bold', color: '#111', marginBottom: '16px' }}>No interviews yet</h3>
            <p style={{ color: '#666', marginBottom: '24px', fontSize: '16px' }}>Start your first interview to track progress</p>
            <Button onClick={onStartInterview} disabled={isLoading} variant="primary" size="lg">
              {isLoading ? 'Starting...' : '🚀 Start First Interview'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LobbyScreen;
