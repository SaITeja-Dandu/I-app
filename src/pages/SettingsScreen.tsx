/**
 * @file pages/SettingsScreen.tsx
 * @description User settings and preferences screen
 */

import React, { useState } from 'react';
import { PreferencesSettings } from '../components/PreferencesSettings';
import { ArrowLeft, User, Code } from 'lucide-react';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import { Button } from '../components/Button';
import { getFirestoreService } from '../services/firestore';
import type { UserProfile } from '../types';

const SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'AWS', 'Docker',
  'Kubernetes', 'SQL', 'JavaScript', 'Vue.js', 'Angular', 'GraphQL', 'MongoDB',
  'PostgreSQL', 'Redis', 'Git', 'REST APIs', 'Microservices', 'CI/CD',
];

interface SettingsScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  currentUser,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Profile form state
  const [skills, setSkills] = useState<string[]>(
    currentUser.userType === 'interviewer' 
      ? (currentUser.interviewerProfile?.skills || [])
      : (currentUser.skills || [])
  );
  const [customSkill, setCustomSkill] = useState('');
  const [bio, setBio] = useState(currentUser.interviewerProfile?.bio || '');
  const [linkedInUrl, setLinkedInUrl] = useState(currentUser.interviewerProfile?.linkedInUrl || '');

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
      setSkills(prev => [...prev, trimmed]);
      setCustomSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);

    try {
      const firestoreService = getFirestoreService();
      
      // Build interviewer profile without undefined values
      let updatedInterviewerProfile = currentUser.interviewerProfile;
      
      if (currentUser.userType === 'interviewer' && currentUser.interviewerProfile) {
        updatedInterviewerProfile = {
          ...currentUser.interviewerProfile,
          skills,
          bio,
        };
        
        // Only add linkedInUrl if it has a value
        if (linkedInUrl && linkedInUrl.trim()) {
          updatedInterviewerProfile.linkedInUrl = linkedInUrl;
        }
      }
      
      const updatedProfile: UserProfile = {
        ...currentUser,
        skills: currentUser.userType === 'candidate' ? skills : currentUser.skills,
        interviewerProfile: updatedInterviewerProfile,
        updatedAt: new Date(),
      };

      await firestoreService.saveUserProfile(currentUser.id, updatedProfile);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      
      // Auto-dismiss success message
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-mesh py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your profile and preferences
          </p>
        </div>

        {/* Save Message */}
        {saveMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            saveMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {saveMessage.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'profile'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <User className="inline h-5 w-5 mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'preferences'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Code className="inline h-5 w-5 mr-2" />
            Preferences
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Profile</h2>

            {/* Technical Skills Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                💻 Technical Skills
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {currentUser.userType === 'interviewer' 
                  ? 'Showcase your technical expertise to candidates'
                  : 'Add skills that showcase your expertise'
                }
              </p>

              {/* Suggested Skills */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Popular Skills - Click to Add</p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_SUGGESTIONS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => addSkill(skill)}
                      disabled={skills.includes(skill) || skills.length >= 20}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                        skills.includes(skill)
                          ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-2 border-blue-300 cursor-default'
                          : skills.length >= 20
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {skills.includes(skill) ? '✓' : '+'} {skill}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Skill Input */}
              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Add custom skill (e.g., Terraform, Redis)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e: React.KeyboardEvent) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(customSkill);
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={() => addSkill(customSkill)}
                  disabled={!customSkill.trim() || skills.length >= 20}
                  variant="secondary"
                  size="sm"
                >
                  Add
                </Button>
              </div>

              {/* Selected Skills */}
              {skills.length > 0 && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-gray-600 uppercase mb-3">
                    Your Selected Skills ({skills.length}/20)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <div
                        key={skill}
                        className="group relative px-4 py-2 bg-white rounded-full border-2 border-blue-200 flex items-center gap-2"
                      >
                        <span className="text-sm font-medium text-gray-800">{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Remove skill"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interviewer-specific fields */}
            {currentUser.userType === 'interviewer' && (
              <>
                {/* Bio */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Professional Bio
                  </label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell candidates about your experience and expertise..."
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    {bio.length} characters
                  </p>
                </div>

                {/* LinkedIn URL */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    LinkedIn Profile (Optional)
                  </label>
                  <Input
                    value={linkedInUrl}
                    onChange={(e) => setLinkedInUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
              </>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveProfile}
                disabled={isSaving}
                size="lg"
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </Button>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <PreferencesSettings userId={currentUser.id} />
        )}
      </div>
    </div>
  );
};
