import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { useRequestStore } from '@/stores/useRequestStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import * as Select from '@/components/ui/select';
import { cn } from '@/utils/cn';

type AuthType = 'none' | 'bearer' | 'basic' | 'custom';

/**
 * AuthEditor component for configuring HTTP authentication.
 */
export const AuthEditor = (): React.JSX.Element => {
  const { headers, setHeaders } = useRequestStore();
  const [authType, setAuthType] = useState<AuthType>(() => {
    if (headers['Authorization']?.startsWith('Bearer ')) return 'bearer';
    if (headers['Authorization']?.startsWith('Basic ')) return 'basic';
    if (headers['Authorization']) return 'custom';
    return 'none';
  });
  const [token, setToken] = useState(() => {
    if (headers['Authorization']?.startsWith('Bearer ')) {
      return headers['Authorization'].substring(7);
    }
    return '';
  });
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [customHeader, setCustomHeader] = useState(() => {
    if (headers['Authorization'] && !headers['Authorization'].startsWith('Bearer ') && !headers['Authorization'].startsWith('Basic ')) {
      return headers['Authorization'];
    }
    return '';
  });
  const [showPassword, setShowPassword] = useState(false);

  const updateAuth = (type: AuthType, value: string): void => {
    const updatedHeaders = { ...headers };
    
    // Remove existing Authorization header
    delete updatedHeaders['Authorization'];
    
    if (type === 'none') {
      setHeaders(updatedHeaders);
      return;
    }
    
    if (type === 'bearer') {
      updatedHeaders['Authorization'] = `Bearer ${value}`;
    } else if (type === 'basic') {
      // Basic auth uses base64 encoded username:password
      const encoded = btoa(`${username}:${password}`);
      updatedHeaders['Authorization'] = `Basic ${encoded}`;
    } else if (type === 'custom') {
      updatedHeaders['Authorization'] = value;
    }
    
    setHeaders(updatedHeaders);
  };

  const handleAuthTypeChange = (value: string | undefined): void => {
    const newType = (value || 'none') as AuthType;
    setAuthType(newType);
    
    if (newType === 'none') {
      updateAuth('none', '');
    } else if (newType === 'bearer' && token) {
      updateAuth('bearer', token);
    } else if (newType === 'basic' && username && password) {
      updateAuth('basic', '');
    } else if (newType === 'custom' && customHeader) {
      updateAuth('custom', customHeader);
    }
  };

  const handleTokenChange = (value: string): void => {
    setToken(value);
    if (authType === 'bearer') {
      updateAuth('bearer', value);
    }
  };

  const handleUsernameChange = (value: string): void => {
    setUsername(value);
    if (authType === 'basic' && password) {
      updateAuth('basic', '');
    }
  };

  const handlePasswordChange = (value: string): void => {
    setPassword(value);
    if (authType === 'basic' && username) {
      updateAuth('basic', '');
    }
  };

  const handleCustomHeaderChange = (value: string): void => {
    setCustomHeader(value);
    if (authType === 'custom') {
      updateAuth('custom', value);
    }
  };

  return (
    <div className="h-full flex flex-col" data-testid="auth-editor">
      <div className="flex-1 overflow-auto p-4" style={{ scrollbarGutter: 'stable' }}>
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Auth type selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-text-secondary">Authentication Type</label>
            <Select.Select value={authType} onValueChange={handleAuthTypeChange}>
              <Select.SelectTrigger className="w-full">
                <Select.SelectValue />
              </Select.SelectTrigger>
              <Select.SelectContent>
                <Select.SelectItem value="none">None</Select.SelectItem>
                <Select.SelectItem value="bearer">Bearer Token</Select.SelectItem>
                <Select.SelectItem value="basic">Basic Auth</Select.SelectItem>
                <Select.SelectItem value="custom">Custom Header</Select.SelectItem>
              </Select.SelectContent>
            </Select.Select>
          </div>

          {/* Bearer token */}
          {authType === 'bearer' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-text-secondary">Token</label>
              <Input
                type="text"
                value={token}
                onChange={(e) => handleTokenChange(e.target.value)}
                placeholder="Enter bearer token"
                className="font-mono text-sm"
              />
            </motion.div>
          )}

          {/* Basic auth */}
          {authType === 'basic' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Username</label>
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Enter username"
                  className="font-mono text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">Password</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter password"
                    className="font-mono text-sm pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Custom header */}
          {authType === 'custom' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <label className="text-sm font-medium text-text-secondary">Authorization Header</label>
              <Input
                type="text"
                value={customHeader}
                onChange={(e) => handleCustomHeaderChange(e.target.value)}
                placeholder="Enter custom authorization header value"
                className="font-mono text-sm"
              />
            </motion.div>
          )}

          {/* Empty state */}
          {authType === 'none' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <Key className="size-12 text-text-muted/25 mb-4" strokeWidth={1} />
              <p className="text-sm text-text-muted">No authentication configured</p>
              <p className="text-xs text-text-muted/70 mt-1">Select an authentication type above to get started</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
