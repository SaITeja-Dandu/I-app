/**
 * @file pages/SetupScreen.tsx
 * @description User profile setup with professional header and enhanced UI
 */

import { useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { createLogger } from '../utils/logger';
import ResumeScannerPage from './ResumeScannerPage';
import type { UserProfile } from '../types';

const logger = createLogger('setup-screen');

interface SetupScreenProps {
  onProfileSave: (profile: Partial<UserProfile>) => Promise<void>;
  isLoading?: boolean;
  initialProfile?: UserProfile;
  onResumeAnalyzed?: (experience: string) => void;
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
  onResumeAnalyzed,
}) => {
  logger.info({ initialProfile: !!initialProfile }, 'SetupScreen mounted');
  const [userType, setUserType] = useState<'candidate' | 'interviewer' | ''>(initialProfile?.userType || '');
  const [role, setRole] = useState(initialProfile?.role || '');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [skills, setSkills] = useState<string[]>(initialProfile?.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showResumScanner, setShowResumScanner] = useState(false);
  
  // Interviewer-specific state
  const [yearsOfExperience, setYearsOfExperience] = useState(initialProfile?.interviewerProfile?.yearsOfExperience || 0);
  const [companyName, setCompanyName] = useState(initialProfile?.interviewerProfile?.companyName || '');
  const [currentTitle, setCurrentTitle] = useState(initialProfile?.interviewerProfile?.currentTitle || '');
  const [specializations, setSpecializations] = useState<string[]>(initialProfile?.interviewerProfile?.specializations || []);
  const [hourlyRate, setHourlyRate] = useState(initialProfile?.interviewerProfile?.hourlyRate || 0);
  const [bio, setBio] = useState(initialProfile?.interviewerProfile?.bio || '');
  const [linkedInUrl, setLinkedInUrl] = useState(initialProfile?.interviewerProfile?.linkedInUrl || '');

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
      logger.debug({ skill: trimmed, totalSkills: skills.length + 1 }, 'Skill added');
      setSkills([...skills, trimmed]);
      setCustomSkill('');
      if (errors.skills) setErrors({ ...errors, skills: '' });
    } else {
      if (!trimmed) logger.warn({}, 'Empty skill attempted');
      if (skills.includes(trimmed)) logger.warn({ skill: trimmed }, 'Duplicate skill attempted');
      if (skills.length >= 20) logger.warn({}, 'Max skills reached');
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Common validation
    if (!userType) newErrors.userType = 'Please select your role type';
    if (!role.trim()) newErrors.role = 'Role is required';
    if (skills.length === 0) newErrors.skills = 'At least one skill is required';
    if (skills.length > 20) newErrors.skills = 'Maximum 20 skills allowed';
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Valid email required';
    
    // Interviewer-specific validation
    if (userType === 'interviewer') {
      if (yearsOfExperience < 0) newErrors.yearsOfExperience = 'Years of experience must be positive';
      if (specializations.length === 0) newErrors.specializations = 'Select at least one specialization';
      if (hourlyRate <= 0) newErrors.hourlyRate = 'Hourly rate must be greater than 0';
      if (!bio.trim()) newErrors.bio = 'Bio is required';
    }
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    logger.info({ userType, isValid, errorCount: Object.keys(newErrors).length, errors: newErrors }, 'Form validation completed');
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.info({ userType }, 'Form submission started');
    if (!validate()) {
      logger.warn({}, 'Form validation failed - submission cancelled');
      return;
    }
    try {
      const profileData = {
        userType: userType as 'candidate' | 'interviewer',
        role: role.trim(), 
        skills, 
        email: email || undefined,
        interviewerProfile: userType === 'interviewer' ? {
          yearsOfExperience,
          companyName,
          currentTitle,
          specializations,
          hourlyRate,
          bio,
          linkedInUrl,
          availability: [],
          rating: 0,
          totalInterviews: 0,
          verified: false,
        } : undefined,
      };
      logger.info({ userType, role, skillCount: skills.length }, 'Calling onProfileSave');
      await onProfileSave(profileData);
      logger.info({ userType }, 'Profile saved successfully');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      logger.error({ error: errorMsg, userType }, 'Failed to save profile');
      setErrors({ form: 'Failed to save profile. Please try again.' });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 px-4 py-8 md:py-12 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-4xl">
          {/* Hero Section */}
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <div className="inline-block mb-3 sm:mb-4 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full border border-blue-200">
              <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                ✨ Step 1: Profile Setup
              </span>
            </div>
            <div className="mb-3 sm:mb-4 text-4xl sm:text-5xl md:text-6xl">🚀</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent px-4">
              Build Your Profile
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
              {!userType ? 'Choose your role to get started with Intervuu.' : userType === 'candidate' ? 'Share your professional details to get personalized interview questions.' : 'Tell us about yourself so candidates can learn from your expertise.'}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-white">
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="text-xl sm:text-2xl">{userType === 'interviewer' ? '💼' : '👤'}</div>
                <h2 className="text-xl sm:text-2xl font-bold">
                  {!userType ? 'Choose Your Role' : userType === 'candidate' ? 'Candidate Profile' : 'Interviewer Profile'}
                </h2>
              </div>
              <p className="text-blue-50 text-xs sm:text-sm">
                {!userType ? 'Select whether you want to practice or conduct interviews' : userType === 'candidate' ? 'Tell us about your professional background' : 'Share your expertise and availability'}
              </p>
            </div>

            {/* Form Content */}
            <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8">
              {errors.form && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 font-semibold text-sm flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  {errors.form}
                </div>
              )}

              {!userType ? (
                // USER TYPE SELECTION SCREEN
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Candidate Option */}
                    <button
                      onClick={() => {
                        logger.info({}, 'User type selected: candidate');
                        setUserType('candidate');
                        setErrors({});
                      }}
                      className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
                    >
                      <div className="mb-4 text-6xl group-hover:scale-110 transition-transform">🎯</div>
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-blue-600 transition-colors">Practice & Learn</h3>
                      <p className="text-gray-600 mb-4">
                        I want to prepare for interviews with AI-powered practice sessions and get real-time feedback.
                      </p>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">✓</span> Take AI-powered interviews
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">✓</span> Get instant feedback
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">✓</span> Track progress
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-600">✓</span> Book with live interviewers
                        </div>
                      </div>
                    </button>

                    {/* Interviewer Option */}
                    <button
                      onClick={() => {
                        logger.info({}, 'User type selected: interviewer');
                        setUserType('interviewer');
                        setErrors({});
                      }}
                      className="group p-8 rounded-2xl border-2 border-gray-200 hover:border-purple-500 hover:shadow-2xl transition-all duration-300 hover:scale-105 text-left"
                    >
                      <div className="mb-4 text-6xl group-hover:scale-110 transition-transform">💼</div>
                      <h3 className="text-2xl font-bold mb-2 text-gray-900 group-hover:text-purple-600 transition-colors">Conduct Interviews</h3>
                      <p className="text-gray-600 mb-4">
                        I want to help candidates practice by conducting interviews and earning money.
                      </p>
                      <div className="space-y-2 text-sm text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span> Earn $$ per interview
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span> Set your schedule
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span> Build your profile
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-purple-600">✓</span> Get rated by candidates
                        </div>
                      </div>
                    </button>
                  </div>

                  {errors.userType && (
                    <p className="text-red-600 text-sm flex items-center gap-1 justify-center">
                      <span>ℹ️</span> {errors.userType}
                    </p>
                  )}
                </div>
              ) : (
                // FORM BASED ON USER TYPE
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => {
                      logger.info({}, 'Returning to user type selection');
                      setUserType('');
                    }}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-sm mb-6 transition-colors"
                  >
                    ← Change role
                  </button>

                  {/* INTERVIEWER-SPECIFIC FORM */}
                  {userType === 'interviewer' && (
                    <>
                      {/* Years of Experience */}
                      <div>
                        <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="text-2xl">📚</span>
                          <span>Years of Experience</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <Input
                          type="number"
                          min="0"
                          max="70"
                          placeholder="e.g., 5"
                          value={yearsOfExperience || ''}
                          onChange={(e) => {
                            setYearsOfExperience(parseInt(e.target.value) || 0);
                            if (errors.yearsOfExperience) setErrors({ ...errors, yearsOfExperience: '' });
                          }}
                          className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-purple-500"
                        />
                        {errors.yearsOfExperience && (
                          <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                            <span>ℹ️</span> {errors.yearsOfExperience}
                          </p>
                        )}
                      </div>

                      {/* Company Name */}
                      <div>
                        <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="text-2xl">🏢</span>
                          <span>Current Company</span>
                          <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., Google, Meta, Startup XYZ"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-purple-500"
                        />
                      </div>

                      {/* Current Title */}
                      <div>
                        <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="text-2xl">👔</span>
                          <span>Current Title</span>
                          <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                        </label>
                        <Input
                          type="text"
                          placeholder="e.g., Senior Software Engineer"
                          value={currentTitle}
                          onChange={(e) => setCurrentTitle(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-purple-500"
                        />
                      </div>

                      {/* Specializations */}
                      <div>
                        <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="text-2xl">🎯</span>
                          <span>Specializations</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-600 mb-4">Select areas where you conduct interviews</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {['Frontend', 'Backend', 'Full Stack', 'Mobile', 'System Design', 'DevOps', 'Data Science', 'QA', 'Product Management'].map((spec) => (
                            <button
                              key={spec}
                              type="button"
                              onClick={() => {
                                logger.debug({ spec, isAdding: !specializations.includes(spec) }, 'Specialization toggled');
                                if (specializations.includes(spec)) {
                                  setSpecializations(specializations.filter(s => s !== spec));
                                } else {
                                  setSpecializations([...specializations, spec]);
                                }
                                if (errors.specializations) setErrors({ ...errors, specializations: '' });
                              }}
                              className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                specializations.includes(spec)
                                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                            >
                              {spec}
                            </button>
                          ))}
                        </div>
                        {errors.specializations && (
                          <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                            <span>ℹ️</span> {errors.specializations}
                          </p>
                        )}
                      </div>

                      {/* Hourly Rate */}
                      <div>
                        <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="text-2xl">💰</span>
                          <span>Hourly Rate (USD)</span>
                          <span className="text-red-500">*</span>
                        </label>
                        <p className="text-sm text-gray-600 mb-3">Set your price for conducting interviews. Platform takes 20% commission.</p>
                        <Input
                          type="number"
                          min="10"
                          max="500"
                          step="5"
                          placeholder="e.g., 50"
                          value={hourlyRate || ''}
                          onChange={(e) => {
                            setHourlyRate(parseFloat(e.target.value) || 0);
                            if (errors.hourlyRate) setErrors({ ...errors, hourlyRate: '' });
                          }}
                          className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-purple-500"
                        />
                        {hourlyRate > 0 && (
                          <p className="text-sm text-green-600 mt-2 font-semibold">
                            ✓ You'll earn ${(hourlyRate * 0.8).toFixed(2)}/hour (after 20% commission)
                          </p>
                        )}
                        {errors.hourlyRate && (
                          <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                            <span>ℹ️</span> {errors.hourlyRate}
                          </p>
                        )}
                      </div>

                      {/* Bio */}
                      <div>
                        <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="text-2xl">💬</span>
                          <span>Your Bio</span>
                          <span className="text-red-500">*</span>
                          <span className="ml-auto text-sm font-normal text-gray-500">{bio.length}/300</span>
                        </label>
                        <p className="text-sm text-gray-600 mb-3">Tell candidates about yourself and why they should practice with you</p>
                        <textarea
                          placeholder="e.g., I'm a Senior Software Engineer with 10 years at Google specializing in distributed systems. I've helped 100+ candidates prepare for interviews..."
                          value={bio}
                          onChange={(e) => {
                            if (e.target.value.length <= 300) {
                              setBio(e.target.value);
                              if (errors.bio) setErrors({ ...errors, bio: '' });
                            }
                          }}
                          rows={4}
                          className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-purple-500 resize-none"
                        />
                        {errors.bio && (
                          <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                            <span>ℹ️</span> {errors.bio}
                          </p>
                        )}
                      </div>

                      {/* LinkedIn URL */}
                      <div>
                        <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                          <span className="text-2xl">🔗</span>
                          <span>LinkedIn URL</span>
                          <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                        </label>
                        <Input
                          type="url"
                          placeholder="https://linkedin.com/in/yourprofile"
                          value={linkedInUrl}
                          onChange={(e) => setLinkedInUrl(e.target.value)}
                          className="w-full px-4 py-3 text-sm rounded-xl border-2 border-gray-200 focus:border-purple-500"
                        />
                      </div>
                    </>
                  )}

                  {/* COMMON FIELDS FOR BOTH */}
                  {/* Role Section */}
                  <div>
                    <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                      <span className="text-2xl">👔</span>
                      <span>Professional Role</span>
                      <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-600 mb-4">Select the role that best matches your expertise</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {ROLES.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            logger.debug({ role: r }, 'Role selected');
                            setRole(r);
                            if (errors.role) setErrors({ ...errors, role: '' });
                          }}
                          className={`p-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                            role === r
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    {errors.role && (
                      <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                        <span>ℹ️</span> {errors.role}
                      </p>
                    )}
                  </div>

                  {/* Email Section */}
                  <div>
                    <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                      <span className="text-2xl">✉️</span>
                      <span>Email Address</span>
                      <span className="text-gray-400 text-sm font-normal">(Optional)</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="your.email@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                      className={`w-full px-4 py-3 text-sm rounded-xl border-2 transition-all ${
                        errors.email
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                        <span>ℹ️</span> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Skills Section */}
                  <div>
                    <label className="block text-base font-bold mb-3 text-gray-800 flex items-center gap-2">
                      <span className="text-2xl">🛠️</span>
                      <span>Your Skills</span>
                      <span className="text-red-500">*</span>
                      <span className="ml-auto text-sm font-normal text-gray-500">
                        {skills.length}/20 skills
                      </span>
                    </label>
                    <p className="text-sm text-gray-600 mb-4">Add skills that showcase your expertise</p>

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
                                ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-2 border-blue-300'
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
                        placeholder="Add custom skill (e.g., Redux, Kubernetes)..."
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addSkill(customSkill);
                          }
                        }}
                        className="flex-1 px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500"
                      />
                      <Button
                        type="button"
                        onClick={() => addSkill(customSkill)}
                        disabled={!customSkill.trim() || skills.length >= 20}
                        variant="secondary"
                        size="sm"
                        className="px-6"
                      >
                        Add
                      </Button>
                    </div>

                    {/* Selected Skills */}
                    {skills.length > 0 && (
                      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                        <p className="text-xs font-semibold text-gray-600 uppercase mb-3">Your Selected Skills</p>
                        <div className="flex flex-wrap gap-2">
                          {skills.map((skill, idx) => (
                            <div
                              key={`${skill}-${idx}`}
                              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold shadow-md"
                            >
                              <span>{skill}</span>
                              <button
                                type="button"
                                onClick={() => setSkills(skills.filter((_, i) => i !== idx))}
                                className="hover:bg-white/20 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {errors.skills && (
                      <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                        <span>ℹ️</span> {errors.skills}
                      </p>
                    )}
                  </div>

                  {/* Resume Upload - Only for Candidates */}
                  {userType === 'candidate' && (
                    <div className="pt-6 border-t-2 border-gray-100">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-3xl">📄</span>
                        <div>
                          <p className="text-base font-bold text-gray-800 mb-1">
                            Upload Resume <span className="text-gray-400 text-sm font-normal">(Optional but Recommended)</span>
                          </p>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            Upload your resume to automatically extract skills and experience. We'll use this to personalize your interview questions for better practice.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          logger.info({}, 'Resume scanner opened');
                          setShowResumScanner(true);
                        }}
                        variant="outline"
                        size="lg"
                        className="w-full"
                      >
                        <span className="text-lg mr-2">📤</span>
                        Upload & Analyze Resume
                      </Button>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-6 border-t-2 border-gray-100">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      variant="primary"
                      size="lg"
                      className="w-full text-base font-bold"
                    >
                      {isLoading ? (
                        <>
                          <span className="inline-block animate-spin mr-2">⏳</span>
                          Saving Your Profile...
                        </>
                      ) : (
                        <>
                          <span className="mr-2">🚀</span>
                          {userType === 'interviewer' ? 'Complete Interviewer Setup' : 'Continue to Interview'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-gray-500 text-center mt-3">
                      Fields marked with <span className="text-red-500">*</span> are required
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/20 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-3">🎯</div>
              <p className="font-bold text-gray-800 mb-1">Personalized Experience</p>
              <p className="text-sm text-gray-600">Tailored to your role & skills</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/20 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-3">⏱️</div>
              <p className="font-bold text-gray-800 mb-1">Quick Setup</p>
              <p className="text-sm text-gray-600">Complete in just 5 minutes</p>
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow-lg border border-white/20 text-center hover:scale-105 transition-transform duration-300">
              <div className="text-4xl mb-3">📊</div>
              <p className="font-bold text-gray-800 mb-1">Detailed Feedback</p>
              <p className="text-sm text-gray-600">Get actionable insights</p>
            </div>
          </div>
        </div>
      </div>

      {/* Resume Scanner Modal */}
      {showResumScanner && (
        <ResumeScannerPage
          onClose={() => {
            logger.info({}, 'Resume scanner closed');
            setShowResumScanner(false);
          }}
          onAnalyzed={(analysis) => {
            logger.info({ detectedSkills: analysis.skills.length, experience: analysis.experience.length }, 'Resume analyzed');
            // Auto-add detected skills to profile
            const newSkills = [...new Set([...skills, ...analysis.skills])];
            setSkills(newSkills.slice(0, 20)); // Max 20 skills
            logger.debug({ addedSkills: newSkills.length }, 'Skills updated from resume');
            
            // Pass resume experience to parent for interview context
            const experienceSummary = `${analysis.experience.join(', ')}. Skills: ${analysis.skills.join(', ')}`;
            onResumeAnalyzed?.(experienceSummary);
            setShowResumScanner(false);
          }}
        />
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default SetupScreen;
