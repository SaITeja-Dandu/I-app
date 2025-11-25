/**
 * @file pages/InterviewerSetupScreen.tsx
 * @description Interviewer profile setup screen with experience, specializations, and availability
 */

import React, { useState } from 'react';
import { Input } from '../components/Input';
import { Textarea } from '../components/Textarea';
import type { InterviewerProfile } from '../types';

interface InterviewerSetupScreenProps {
  onComplete: (profile: Partial<InterviewerProfile>) => void;
  onBack: () => void;
}

interface AvailabilitySlot {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const SPECIALIZATIONS = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Development',
  'DevOps',
  'Cloud Architecture',
  'System Design',
  'Data Structures & Algorithms',
  'Database Design',
  'API Design',
  'Microservices',
  'Security',
  'Machine Learning',
  'Data Science',
  'UI/UX Design',
  'Product Management',
  'Leadership & Management',
  'Behavioral Interviews',
];

const SKILL_SUGGESTIONS = [
  'React', 'TypeScript', 'Node.js', 'Python', 'Java', 'AWS', 'Docker',
  'Kubernetes', 'SQL', 'JavaScript', 'Vue.js', 'Angular', 'GraphQL', 'MongoDB',
  'PostgreSQL', 'Redis', 'Git', 'REST APIs', 'Microservices', 'CI/CD',
];

export const InterviewerSetupScreen: React.FC<InterviewerSetupScreenProps> = ({
  onComplete,
  onBack,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    yearsOfExperience: '',
    companyName: '',
    currentTitle: '',
    bio: '',
    linkedinUrl: '',
  });

  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [availability, setAvailability] = useState<AvailabilitySlot[]>(
    DAYS_OF_WEEK.map(day => ({
      day,
      startTime: '09:00',
      endTime: '17:00',
      enabled: false,
    }))
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleSpecialization = (spec: string) => {
    setSelectedSpecializations(prev =>
      prev.includes(spec) ? prev.filter(s => s !== spec) : [...prev, spec]
    );
  };

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed) && skills.length < 20) {
      setSkills(prev => [...prev, trimmed]);
      setCustomSkill('');
      if (errors.skills) {
        setErrors(prev => ({ ...prev, skills: '' }));
      }
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const toggleDayAvailability = (index: number) => {
    setAvailability(prev =>
      prev.map((slot, i) => (i === index ? { ...slot, enabled: !slot.enabled } : slot))
    );
  };

  const updateAvailabilityTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev =>
      prev.map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
    );
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.yearsOfExperience || isNaN(Number(formData.yearsOfExperience))) {
      newErrors.yearsOfExperience = 'Please enter valid years of experience';
    } else if (Number(formData.yearsOfExperience) < 1) {
      newErrors.yearsOfExperience = 'Must have at least 1 year of experience';
    }

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }

    if (!formData.currentTitle.trim()) {
      newErrors.currentTitle = 'Job title is required';
    }

    if (!formData.bio.trim() || formData.bio.length < 50) {
      newErrors.bio = 'Bio must be at least 50 characters';
    }

    if (selectedSpecializations.length === 0) {
      newErrors.specializations = 'Select at least one specialization';
    }

    if (skills.length === 0) {
      newErrors.skills = 'Add at least one technical skill';
    }

    const hasAvailability = availability.some(slot => slot.enabled);
    if (!hasAvailability) {
      newErrors.availability = 'Set availability for at least one day';
    }

    if (formData.linkedinUrl && !formData.linkedinUrl.includes('linkedin.com')) {
      newErrors.linkedinUrl = 'Please enter a valid LinkedIn URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    console.log('[InterviewerSetupScreen] Form submitted with name:', formData.name);
    setIsSubmitting(true);
    try {
      const interviewerProfile: Partial<InterviewerProfile> = {
        yearsOfExperience: Number(formData.yearsOfExperience),
        companyName: formData.companyName,
        currentTitle: formData.currentTitle,
        specializations: selectedSpecializations,
        skills: skills,
        bio: formData.bio,
        linkedInUrl: formData.linkedinUrl || undefined,
        availability: availability
          .filter(slot => slot.enabled)
          .map(slot => {
            const dayMap: Record<string, 0 | 1 | 2 | 3 | 4 | 5 | 6> = {
              'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3,
              'Thursday': 4, 'Friday': 5, 'Saturday': 6
            };
            return {
              dayOfWeek: dayMap[slot.day] ?? 1,
              startTime: slot.startTime,
              endTime: slot.endTime,
              timezone: 'Asia/Kolkata',
            };
          }),
        hourlyRate: 0, // Can be set later in settings
        totalInterviews: 0,
        rating: 0,
        verified: false,
        isActive: true, // CRITICAL: Enable interviewer visibility in booking search
      };

      // Pass the name along with the profile
      (interviewerProfile as any).__name = formData.name;
      console.log('[InterviewerSetupScreen] Calling onComplete with name:', formData.name);
      await onComplete(interviewerProfile);
    } catch (error) {
      console.error('Error saving interviewer profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <button
              onClick={onBack}
              className="mb-6 text-gray-600 hover:text-gray-800 flex items-center gap-2 mx-auto transition-colors"
            >
              ← Back
            </button>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Set Up Your Interviewer Profile
              </span>
            </h1>
            <p className="text-xl text-gray-600">
              Help candidates get to know your expertise and availability
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12 border border-white/20">
            {/* Experience Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                💼 Professional Background
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <Input
                    type="number"
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange('yearsOfExperience', e.target.value)}
                    placeholder="e.g., 5"
                    min="1"
                  />
                  {errors.yearsOfExperience && (
                    <p className="text-red-500 text-sm mt-1">{errors.yearsOfExperience}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Company *
                  </label>
                  <Input
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="e.g., Google"
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-sm mt-1">{errors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Current Title *
                  </label>
                  <Input
                    value={formData.currentTitle}
                    onChange={(e) => handleInputChange('currentTitle', e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                  />
                  {errors.currentTitle && (
                    <p className="text-red-500 text-sm mt-1">{errors.currentTitle}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    LinkedIn Profile (Optional)
                  </label>
                  <Input
                    value={formData.linkedinUrl}
                    onChange={(e) => handleInputChange('linkedinUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  {errors.linkedinUrl && (
                    <p className="text-red-500 text-sm mt-1">{errors.linkedinUrl}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bio Section */}
            <div className="mb-10">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Professional Bio *
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                placeholder="Tell candidates about your experience, expertise, and what they can expect from interviews with you..."
                rows={5}
              />
              <div className="flex justify-between items-center mt-2">
                {errors.bio && <p className="text-red-500 text-sm">{errors.bio}</p>}
                <p className="text-sm text-gray-500 ml-auto">
                  {formData.bio.length} characters (minimum 50)
                </p>
              </div>
            </div>

            {/* Specializations Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                🎯 Areas of Expertise
              </h2>
              <p className="text-gray-600 mb-4">Select all areas where you can conduct interviews</p>
              {errors.specializations && (
                <p className="text-red-500 text-sm mb-4">{errors.specializations}</p>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SPECIALIZATIONS.map((spec) => (
                  <button
                    key={spec}
                    onClick={() => toggleSpecialization(spec)}
                    className={`
                      px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200
                      ${
                        selectedSpecializations.includes(spec)
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg scale-105'
                          : 'bg-white/60 text-gray-700 border-2 border-gray-200 hover:border-blue-300'
                      }
                    `}
                  >
                    {selectedSpecializations.includes(spec) && '✓ '}
                    {spec}
                  </button>
                ))}
              </div>
            </div>

            {/* Technical Skills Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                💻 Technical Skills
              </h2>
              <p className="text-gray-600 mb-4">Add the technical skills and technologies you're proficient in</p>
              {errors.skills && (
                <p className="text-red-500 text-sm mb-4">{errors.skills}</p>
              )}
              
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
                <input
                  type="text"
                  placeholder="Add custom skill (e.g., Terraform, Redis)..."
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(customSkill);
                    }
                  }}
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => addSkill(customSkill)}
                  disabled={!customSkill.trim() || skills.length >= 20}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all duration-200"
                >
                  Add
                </button>
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

            {/* Availability Section */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                📅 Weekly Availability
              </h2>
              <p className="text-gray-600 mb-2">
                Set your general availability. You can adjust this anytime in settings.
              </p>
              <p className="text-sm text-gray-500 mb-4">
                All times use <span className="font-semibold">India Standard Time (IST, UTC+05:30)</span>.
              </p>
              {errors.availability && (
                <p className="text-red-500 text-sm mb-4">{errors.availability}</p>
              )}
              <div className="space-y-3">
                {availability.map((slot, index) => (
                  <div
                    key={slot.day}
                    className={`
                      flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                      ${
                        slot.enabled
                          ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300'
                          : 'bg-white/60 border-gray-200'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={slot.enabled}
                      onChange={() => toggleDayAvailability(index)}
                      className="w-5 h-5 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                      <span className="font-semibold text-gray-800">{slot.day}</span>
                      {slot.enabled && (
                        <>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Start Time</label>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                updateAvailabilityTime(index, 'startTime', e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">End Time</label>
                            <input
                              type="time"
                              value={slot.endTime}
                              onChange={(e) =>
                                updateAvailabilityTime(index, 'endTime', e.target.value)
                              }
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info Banner */}
            <div className="mb-8 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tip:</strong> Complete profiles with detailed bios and multiple
                specializations get 3x more interview requests!
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                onClick={onBack}
                className="flex-1 px-8 py-4 rounded-xl text-lg font-semibold bg-white/80 text-gray-700 border-2 border-gray-200 hover:border-gray-300 transition-all duration-300"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 px-8 py-4 rounded-xl text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        </div>
      </div>

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

export default InterviewerSetupScreen;
