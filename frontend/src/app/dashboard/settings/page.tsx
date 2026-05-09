'use client';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { Loader2, Save, User, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const profileMutation = useMutation({
    mutationFn: () => authApi.updateMe({ name }),
    onSuccess: (res) => { updateUser(res.data); toast.success('Profile updated'); },
    onError: () => toast.error('Update failed'),
  });

  const passwordMutation = useMutation({
    mutationFn: () => authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => { toast.success('Password changed'); setCurrentPassword(''); setNewPassword(''); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed';
      toast.error(msg);
    },
  });

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Account Settings</h1>

      {/* Profile */}
      <div className="card p-6 mb-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <User size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Profile</h2>
            <p className="text-sm text-gray-500">Update your name and email</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="form-label">Full name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="form-input" />
          </div>
          <div>
            <label className="form-label">Email address</label>
            <input type="email" value={user?.email || ''} className="form-input bg-gray-50" readOnly />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <button onClick={() => profileMutation.mutate()} disabled={profileMutation.isPending} className="btn-primary">
            {profileMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Profile
          </button>
        </div>
      </div>

      {/* Password */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Lock size={18} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Password</h2>
            <p className="text-sm text-gray-500">Change your account password</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="form-label">Current password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="form-input" placeholder="••••••••" />
          </div>
          <div>
            <label className="form-label">New password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input" placeholder="Min 6 characters" />
          </div>
          <button onClick={() => passwordMutation.mutate()}
            disabled={passwordMutation.isPending || !currentPassword || newPassword.length < 6} className="btn-primary">
            {passwordMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
