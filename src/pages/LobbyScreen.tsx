/**
 * @file pages/LobbyScreen.tsx
 * @description Main dashboard with modern design
 */

import { useMemo, useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { INTERVIEW_LENGTH, SCORE_RANGES } from '../utils/constants';
import type { UserProfile, InterviewSession, InterviewBooking } from '../types';
import { BookingService } from '../services/booking';
import { getFirebaseInstances } from '../services/firebase';

interface LobbyScreenProps {
  profile: UserProfile;
  history: InterviewSession[];
  onStartInterview: () => void;
  onEditProfile: () => void;
  onBookInterview?: () => void;
  onViewDashboard?: () => void;
  isLoading?: boolean;
}

export const LobbyScreen: React.FC<LobbyScreenProps> = ({
  profile,
  history,
  onStartInterview,
  onEditProfile,
  onBookInterview,
  onViewDashboard,
  isLoading = false,
}) => {
  const [upcomingBookings, setUpcomingBookings] = useState<InterviewBooking[]>([]);

  // Subscribe to upcoming bookings
  useEffect(() => {
    const { db } = getFirebaseInstances();
    const bookingService = new BookingService(db);
    
    const unsubscribe = bookingService.subscribeToUserBookings(
      profile.id,
      (bookings: InterviewBooking[]) => {
        // Filter for upcoming confirmed bookings only
        const upcoming = bookings
          .filter(b => 
            (b.status === 'confirmed' || b.status === 'pending') &&
            new Date(b.scheduledDateTime) > new Date()
          )
          .sort((a, b) => 
            new Date(a.scheduledDateTime).getTime() - new Date(b.scheduledDateTime).getTime()
          )
          .slice(0, 3); // Show max 3 upcoming
        
        setUpcomingBookings(upcoming);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [profile.id]);

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
    <div style={{ minHeight: '100vh', width: '100%', background: '#f8f9fa' }}>
      {/* Main Content */}
      <div style={{ padding: '0 clamp(16px, 4vw, 24px) clamp(24px, 6vw, 32px)' }}>
        <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          {/* Header Section */}
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
              {isLoading ? 'Starting...' : '🚀 Start AI Interview'}
            </Button>
            {profile.userType === 'candidate' && onBookInterview && (
              <Button variant="primary" onClick={onBookInterview} size="md">
                📅 Book Live Interview
              </Button>
            )}
            {profile.userType === 'interviewer' && onViewDashboard && (
              <Button variant="primary" onClick={onViewDashboard} size="md">
                👨‍💼 Interviewer Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Profile Card */}
        <div style={{ background: 'white', padding: 'clamp(16px, 5vw, 24px)', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 'clamp(16px, 4vw, 24px)' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Role</p>
              <p style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{profile.role}</p>
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
              <p style={{ fontSize: '24px', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        {upcomingBookings.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: 'clamp(20px, 6vw, 24px)', fontWeight: 'bold', color: '#111', marginBottom: '16px' }}>📅 Upcoming Interviews</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {upcomingBookings.map((booking) => {
                const isCandidate = booking.candidateId === profile.id;
                const otherParty = isCandidate ? booking.interviewerName : booking.candidateName;
                const scheduledDate = new Date(booking.scheduledDateTime);
                const now = new Date();
                const hoursUntil = Math.floor((scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60));
                const daysUntil = Math.floor(hoursUntil / 24);
                
                let timeUntilText = '';
                if (hoursUntil < 1) {
                  timeUntilText = 'Starting soon!';
                } else if (hoursUntil < 24) {
                  timeUntilText = `In ${hoursUntil}h`;
                } else if (daysUntil === 1) {
                  timeUntilText = 'Tomorrow';
                } else {
                  timeUntilText = `In ${daysUntil} days`;
                }

                return (
                  <div 
                    key={booking.id} 
                    style={{ 
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                      border: '2px solid',
                      borderColor: booking.status === 'confirmed' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(249, 115, 22, 0.3)',
                      padding: 'clamp(16px, 4vw, 20px)', 
                      borderRadius: '12px', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start', 
                      gap: '16px', 
                      flexWrap: 'wrap',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(99, 102, 241, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <h4 style={{ fontWeight: 'bold', color: '#111', fontSize: 'clamp(16px, 4vw, 18px)' }}>
                          {isCandidate ? '🎯' : '👤'} {otherParty}
                        </h4>
                        <Badge 
                          label={booking.status === 'confirmed' ? 'Confirmed' : 'Pending'} 
                          variant={booking.status === 'confirmed' ? 'success' : 'warning'} 
                          size="sm" 
                        />
                      </div>
                      <div style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', color: '#666', marginBottom: '4px' }}>
                        📅 {scheduledDate.toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </div>
                      <div style={{ fontSize: 'clamp(13px, 3.5vw, 15px)', color: '#666', marginBottom: '4px' }}>
                        ⏰ {scheduledDate.toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit'
                        })} • {booking.durationMinutes} min
                      </div>
                      <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', color: '#999' }}>
                        💼 {booking.role}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', minWidth: 'auto' }}>
                      <div style={{ 
                        fontSize: 'clamp(16px, 4vw, 18px)', 
                        fontWeight: 'bold', 
                        marginBottom: '8px',
                        background: hoursUntil < 24 ? 'linear-gradient(to right, #ef4444, #dc2626)' : 'linear-gradient(to right, #2563eb, #9333ea)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}>
                        {timeUntilText}
                      </div>
                      {booking.status === 'confirmed' && booking.meetingLink && (
                        <a 
                          href={booking.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-block',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: 'linear-gradient(to right, #2563eb, #9333ea)',
                            color: 'white',
                            borderRadius: '6px',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 99, 235, 0.3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          🔗 Join Meeting
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Stats */}
        {stats && (
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: 'clamp(20px, 6vw, 24px)', fontWeight: 'bold', color: '#111', marginBottom: '16px' }}>Performance</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))', gap: 'clamp(12px, 3vw, 16px)' }}>
              <div style={{ background: 'white', padding: 'clamp(16px, 4vw, 24px)', borderRadius: '12px', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)' }}>
                <p style={{ fontSize: '10px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Total</p>
                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{stats.total}</p>
              </div>
              <div style={{ background: 'white', padding: 'clamp(16px, 4vw, 24px)', borderRadius: '12px', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)' }}>
                <p style={{ fontSize: '10px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Average</p>
                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{stats.avgScore}</p>
                <p style={{ fontSize: '11px', color: '#999', marginTop: '8px' }}>out of 100</p>
              </div>
              <div style={{ background: 'white', padding: 'clamp(16px, 4vw, 24px)', borderRadius: '12px', boxShadow: '0 2px 6px rgba(37, 99, 235, 0.1)' }}>
                <p style={{ fontSize: '10px', color: '#999', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>Best</p>
                <p style={{ fontSize: 'clamp(24px, 6vw, 32px)', fontWeight: 'bold', background: 'linear-gradient(to right, #2563eb, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{stats.best}</p>
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
    </div>
  );
};

export default LobbyScreen;
