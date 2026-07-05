import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { 
  FiUser, FiMail, FiPhone, FiCalendar, FiLock, 
  FiKey, FiBell, FiShield, FiCheckCircle, FiLoader 
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { authAPI } from '../services/api.js';
import { useAuthStore } from '../store/index.js';

export default function UserProfile() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile'); // profile, password, notifications
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Profile Form
  const { register: registerProfile, handleSubmit: handleProfileSubmit, formState: { errors: profileErrors } } = useForm({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
      dateOfBirth: user?.dateOfBirth ? format(parseISO(user.dateOfBirth), 'yyyy-MM-dd') : '',
      gender: user?.gender || '',
    }
  });

  // Password Form
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPasswordForm, watch } = useForm({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }
  });

  const newPasswordVal = watch('newPassword');

  // Submit Profile Info
  const onProfileSubmit = async (data) => {
    setProfileLoading(true);
    try {
      const res = await authAPI.updateProfile(data);
      const updatedUser = res.data.data.user;
      updateUser(updatedUser);
      toast.success('Profile updated successfully! 👤');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // Submit Password Change
  const onPasswordSubmit = async (data) => {
    setPasswordLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully! 🔑');
      resetPasswordForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Mock Notification settings state
  const [notifs, setNotifs] = useState({
    bookingConfirmations: true,
    weeklyOffers: false,
    showReminders: true,
    systemUpdates: true,
  });

  const toggleNotif = (key) => {
    setNotifs(prev => ({ ...prev, [key]: !prev[key] }));
    toast.success('Notification settings saved');
  };

  return (
    <div className="min-h-screen pb-20 pt-8" style={{ background: '#0a0a12' }}>
      <div className="container-app max-w-4xl space-y-8">
        
        {/* Title / Info card */}
        <div className="flex flex-col md:flex-row gap-6 items-center p-6 rounded-3xl border" style={{ background: '#12121e', borderColor: '#2d2d4a' }}>
          <div className="w-20 h-20 rounded-full bg-purple-900 border flex items-center justify-center text-2xl font-black text-white shrink-0" style={{ borderColor: '#2d2d4a' }}>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="text-center md:text-left space-y-1.5 flex-1">
            <h1 className="text-3xl font-black text-white">{user?.firstName} {user?.lastName}</h1>
            <p className="text-sm" style={{ color: '#a0a0c0' }}>{user?.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-1">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-purple-400 border border-purple-400/20" style={{ background: 'rgba(124,58,237,0.1)' }}>
                {user?.role}
              </span>
              {user?.isEmailVerified ? (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[#10b981] border border-[#10b981]/20 bg-[#10b981]/10 flex items-center gap-1">
                  <FiCheckCircle /> Verified Account
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-amber-500 border border-amber-500/20 bg-amber-500/10">
                  Unverified Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Grid: Navigation Sidebar (Left) and Content (Right) */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: 'profile', label: 'Personal Info', icon: FiUser },
              { id: 'password', label: 'Security & Password', icon: FiShield },
              { id: 'notifications', label: 'Notifications', icon: FiBell }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-sm font-semibold transition-all cursor-pointer select-none shrink-0 w-full text-left"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : '#12121e',
                    border: isActive ? '1px solid transparent' : '1px solid #2d2d4a',
                    color: isActive ? 'white' : '#a0a0c0'
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Content area */}
          <div className="flex-1 w-full card p-6 md:p-8">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Personal Information</h3>
                  <p className="text-xs" style={{ color: '#606080' }}>Update your personal profile information here.</p>
                </div>

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                  {/* Name details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a0a0c0' }}>First Name</label>
                      <input 
                        type="text" 
                        {...registerProfile('firstName', { required: 'First name is required' })}
                        className="input-field" 
                        placeholder="John" 
                      />
                      {profileErrors.firstName && <p className="text-xs text-rose-500 mt-1">{profileErrors.firstName.message}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a0a0c0' }}>Last Name</label>
                      <input 
                        type="text" 
                        {...registerProfile('lastName', { required: 'Last name is required' })}
                        className="input-field" 
                        placeholder="Doe" 
                      />
                      {profileErrors.lastName && <p className="text-xs text-rose-500 mt-1">{profileErrors.lastName.message}</p>}
                    </div>
                  </div>

                  {/* Email (Disabled) */}
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a0a0c0' }}>Email Address</label>
                    <div className="relative">
                      <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#606080' }} />
                      <input 
                        type="email" 
                        value={user?.email || ''} 
                        disabled 
                        className="input-field pl-10 opacity-50 cursor-not-allowed" 
                      />
                    </div>
                    <span className="text-[10px] mt-1.5 block" style={{ color: '#606080' }}>Email address cannot be changed.</span>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a0a0c0' }}>Phone Number</label>
                    <div className="relative">
                      <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#606080' }} />
                      <input 
                        type="tel" 
                        {...registerProfile('phone')}
                        className="input-field pl-10" 
                        placeholder="+91 98765 43210" 
                      />
                    </div>
                  </div>

                  {/* Date of Birth and Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a0a0c0' }}>Date of Birth</label>
                      <div className="relative">
                        <FiCalendar className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#606080' }} />
                        <input 
                          type="date" 
                          {...registerProfile('dateOfBirth')}
                          className="input-field pl-10" 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a0a0c0' }}>Gender</label>
                      <select 
                        {...registerProfile('gender')}
                        className="input-field"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="btn-primary px-8 py-3 text-sm flex items-center justify-center gap-2"
                    >
                      {profileLoading ? <FiLoader className="animate-spin" /> : null}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'password' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Security & Password</h3>
                  <p className="text-xs" style={{ color: '#606080' }}>Update your security credentials here.</p>
                </div>

                <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a0a0c0' }}>Current Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#606080' }} />
                      <input 
                        type="password" 
                        {...registerPassword('currentPassword', { required: 'Required' })}
                        className="input-field pl-10" 
                        placeholder="••••••••" 
                      />
                    </div>
                    {passwordErrors.currentPassword && <p className="text-xs text-rose-500 mt-1">{passwordErrors.currentPassword.message}</p>}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a0a0c0' }}>New Password</label>
                    <div className="relative">
                      <FiKey className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#606080' }} />
                      <input 
                        type="password" 
                        {...registerPassword('newPassword', { 
                          required: 'Required',
                          minLength: { value: 8, message: 'Minimum 8 characters' },
                          pattern: {
                            value: /(?=.*[A-Z])(?=.*\d)/,
                            message: 'Must contain an uppercase letter and a number',
                          }
                        })}
                        className="input-field pl-10" 
                        placeholder="••••••••" 
                      />
                    </div>
                    {passwordErrors.newPassword && <p className="text-xs text-rose-500 mt-1">{passwordErrors.newPassword.message}</p>}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="text-xs font-semibold block mb-1.5" style={{ color: '#a0a0c0' }}>Confirm New Password</label>
                    <div className="relative">
                      <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#606080' }} />
                      <input 
                        type="password" 
                        {...registerPassword('confirmPassword', { 
                          required: 'Required',
                          validate: (val) => val === newPasswordVal || 'Passwords do not match',
                        })}
                        className="input-field pl-10" 
                        placeholder="••••••••" 
                      />
                    </div>
                    {passwordErrors.confirmPassword && <p className="text-xs text-rose-500 mt-1">{passwordErrors.confirmPassword.message}</p>}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="btn-primary px-8 py-3 text-sm flex items-center justify-center gap-2"
                    >
                      {passwordLoading ? <FiLoader className="animate-spin" /> : null}
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Notification Preferences</h3>
                  <p className="text-xs" style={{ color: '#606080' }}>Configure how you would like to be notified.</p>
                </div>

                <div className="space-y-5 pt-2">
                  {[
                    { key: 'bookingConfirmations', label: 'Ticket Booking Confirmations', desc: 'Get updates on your booking confirmations and receipt tickets.' },
                    { key: 'weeklyOffers', label: 'Weekly Deals & Coupons', desc: 'Receive alerts when new discount codes and food court coupons are available.' },
                    { key: 'showReminders', label: 'Show Reminders', desc: 'Get notifications 2 hours before your scheduled movie show starts.' },
                    { key: 'systemUpdates', label: 'Security & System Alerts', desc: 'Important alerts regarding changes to your account security and details.' }
                  ].map((n) => (
                    <div key={n.key} className="flex items-center justify-between gap-6 p-4 rounded-xl" style={{ background: '#12121e', border: '1px solid #2d2d4a' }}>
                      <div className="flex-1 space-y-1 text-left">
                        <h4 className="font-extrabold text-white text-sm">{n.label}</h4>
                        <p className="text-xs" style={{ color: '#606080' }}>{n.desc}</p>
                      </div>
                      
                      {/* Checkbox Switch */}
                      <button
                        onClick={() => toggleNotif(n.key)}
                        className="w-12 h-6 rounded-full p-1 transition-colors duration-200 cursor-pointer"
                        style={{
                          background: notifs[n.key] ? '#7c3aed' : '#2d2d4a'
                        }}
                      >
                        <div 
                          className="w-4 h-4 rounded-full bg-white transition-transform duration-200"
                          style={{
                            transform: notifs[n.key] ? 'translateX(24px)' : 'translateX(0)'
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
