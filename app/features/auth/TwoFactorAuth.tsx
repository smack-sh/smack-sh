import { useState } from 'react';
import { useLoaderData } from '@remix-run/react';
import { json, type LoaderFunctionArgs } from '@remix-run/node';

export async function loader({ request }: LoaderFunctionArgs) {
  // Note: Auth should be handled at route level for Electron builds

  // Mock data - in real app, fetch from user's 2FA settings
  const twoFactorSettings = {
    isEnabled: false,
    method: 'app', // 'app', 'sms', 'email'
    backupCodes: ['abc1-def2-ghi3', 'jkl4-mno5-pqr6', 'stu7-vwx8-yz9', '123a-456b-789c', 'defg-hijk-lmno'],
    phoneNumber: '+1 (555) 123-4567',
    backupCodesGeneratedAt: '2024-10-15T10:00:00Z',
  };

  return json({ twoFactorSettings });
}

export function TwoFactorAuth() {
  const { twoFactorSettings } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState<'setup' | 'manage' | 'backup'>('setup');
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h2>
          <p className="text-gray-600 dark:text-gray-400">Add an extra layer of security to your account</p>
        </div>
        <div
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            twoFactorSettings.isEnabled
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
          }`}
        >
          {twoFactorSettings.isEnabled ? 'Enabled' : 'Disabled'}
        </div>
      </div>

      {/* Status Card */}
      {!twoFactorSettings.isEnabled && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Security Alert</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Two-factor authentication is not enabled. Enable 2FA to better protect your account.
              </p>
              <button
                onClick={() => setIsSetupModalOpen(true)}
                className="mt-3 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'setup', label: 'Setup 2FA', icon: '🔐' },
            { id: 'manage', label: 'Manage Settings', icon: '⚙️' },
            { id: 'backup', label: 'Backup Codes', icon: '🔑' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-accent-500 text-accent-600 dark:text-accent-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'setup' && <SetupTab onSetupComplete={() => setIsSetupModalOpen(false)} />}
        {activeTab === 'manage' && <ManageTab settings={twoFactorSettings} />}
        {activeTab === 'backup' && <BackupTab backupCodes={twoFactorSettings.backupCodes} />}
      </div>

      {/* Setup Modal */}
      {isSetupModalOpen && <SetupModal onClose={() => setIsSetupModalOpen(false)} />}
    </div>
  );
}

function SetupTab({ onSetupComplete }: { onSetupComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState(
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y5ZmFmYiIvPgogIDx0ZXh0IHg9IjEwMCIgeT0iMTA1IiBmb250LWZhbWlseT0ibW9ub3NwYWNlIiBmb250LXNpemU9IjE2IiBmaWxsPSIjMzc0MTUxIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TZXQgdXAgMkZBIEluIEFwcDwvdGV4dD4KPC9zdmc+',
  );
  const [verificationCode, setVerificationCode] = useState('');

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onSetupComplete();
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center mb-6">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">Set Up Two-Factor Authentication</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Step {step} of 3</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center mb-8">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  stepNum <= step
                    ? 'bg-accent-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}
              >
                {stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`w-12 h-1 mx-2 ${stepNum < step ? 'bg-accent-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                ></div>
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[300px]">
          {step === 1 && (
            <div className="text-center space-y-6">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Download an authenticator app
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  We recommend using Google Authenticator, Authy, or Microsoft Authenticator.
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                    📱
                  </div>
                  <p className="text-sm font-medium">Google Authenticator</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                    🔐
                  </div>
                  <p className="text-sm font-medium">Authy</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-2">
                    🪟
                  </div>
                  <p className="text-sm font-medium">Microsoft Authenticator</p>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Scan the QR code</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Open your authenticator app and scan this QR code to add your account.
                </p>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Can't scan? Enter this code manually:</p>
                <code className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded text-sm font-mono">
                  JBSWY3DPEHPK3PXP
                </code>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Verify your code</h4>
                <p className="text-gray-600 dark:text-gray-400">Enter the 6-digit code from your authenticator app.</p>
              </div>
              <div className="max-w-sm mx-auto">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full text-center text-2xl font-mono tracking-widest px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  maxLength={6}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Enter the code from your authenticator app
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={handlePrev}
            disabled={step === 1}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={step === 3 && verificationCode.length !== 6}
            className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-md hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 disabled:opacity-50"
          >
            {step === 3 ? 'Complete Setup' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageTab({ settings }: { settings: any }) {
  const [selectedMethod, setSelectedMethod] = useState(settings.method);
  const [phoneNumber, setPhoneNumber] = useState(settings.phoneNumber);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Authentication Method</h3>
        <div className="space-y-3">
          {[
            { id: 'app', name: 'Authenticator App', description: 'Use an app like Google Authenticator' },
            { id: 'sms', name: 'SMS', description: 'Receive codes via text message' },
            { id: 'email', name: 'Email', description: 'Receive codes via email' },
          ].map((method) => (
            <label
              key={method.id}
              className="flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="radio"
                name="method"
                value={method.id}
                checked={selectedMethod === method.id}
                onChange={(e) => setSelectedMethod(e.target.value)}
                className="mr-3 text-accent-600 focus:ring-accent-500"
              />
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{method.name}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">{method.description}</div>
              </div>
            </label>
          ))}
        </div>

        {selectedMethod === 'sms' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent-500 focus:border-accent-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-md hover:bg-accent-700">
            Update Method
          </button>
          <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-medium rounded-md hover:bg-red-200 dark:hover:bg-red-900/50">
            Disable 2FA
          </button>
        </div>
      </div>
    </div>
  );
}

function BackupTab({ backupCodes }: { backupCodes: string[] }) {
  const [showCodes, setShowCodes] = useState(false);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Backup Recovery Codes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Save these codes in a safe place. You can use them to access your account if you lose your device.
            </p>
          </div>
          <button
            onClick={() => setShowCodes(!showCodes)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            {showCodes ? 'Hide' : 'Show'} Codes
          </button>
        </div>

        {showCodes && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600"
                >
                  {code}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button className="px-3 py-1 text-sm bg-accent-600 text-white rounded hover:bg-accent-700">
                Download Codes
              </button>
              <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-500">
                Generate New Codes
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">Important</h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Each backup code can only be used once. Generate new codes if you've used some of them.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SetupModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Enable Two-Factor Authentication</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Two-factor authentication adds an extra layer of security to your account. You'll need both your password and
          a code from your authenticator app to sign in.
        </p>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <span className="text-gray-700 dark:text-gray-300">Download an authenticator app</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <span className="text-gray-700 dark:text-gray-300">Scan the QR code</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-accent-100 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400 rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <span className="text-gray-700 dark:text-gray-300">Enter verification code</span>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              /* Start setup process */
            }}
            className="px-4 py-2 bg-accent-600 text-white text-sm font-medium rounded-md hover:bg-accent-700"
          >
            Start Setup
          </button>
        </div>
      </div>
    </div>
  );
}
