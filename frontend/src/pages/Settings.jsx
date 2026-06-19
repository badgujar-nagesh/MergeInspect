import { useState, useEffect } from 'react'
import { githubApi } from '../api/reviews'

const API_KEY_FIELDS = [
  {
    key:         'openai',
    label:       'OpenAI API Key',
    icon:        '🟢',
    placeholder: 'sk-proj-...',
    link:        'https://platform.openai.com/api-keys',
    linkLabel:   'platform.openai.com/api-keys',
    desc:        'Required for GPT-4o, GPT-4 Turbo, GPT-4o Mini models',
  },
  {
    key:         'claude',
    label:       'Anthropic Claude API Key',
    icon:        '🟣',
    placeholder: 'sk-ant-...',
    link:        'https://console.anthropic.com/settings/keys',
    linkLabel:   'console.anthropic.com',
    desc:        'Required for Claude Opus, Sonnet, Haiku models',
  },
]

function ApiKeySection({ config, onSaved }) {
  const [value, setValue]   = useState('')
  const [hasKey, setHasKey] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState(null)

  useEffect(() => {
    githubApi.checkApiKey(config.key)
      .then(res => setHasKey(res.data.has_key))
      .catch(() => setHasKey(false))
  }, [config.key])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await githubApi.saveApiKey(config.key, value)
      setHasKey(true)
      setSaved(true)
      setValue('')
      onSaved?.()
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save key.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-bold text-gray-900">
          {config.icon} {config.label}
        </h2>
        {hasKey === true  && <span className="text-xs px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">✅ Saved</span>}
        {hasKey === false && <span className="text-xs px-3 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-full font-medium">Not set</span>}
      </div>

      <p className="text-xs text-gray-500 mb-1">{config.desc}</p>
      <p className="text-xs text-gray-400 mb-4">
        Get your key at{' '}
        <a href={config.link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
          {config.linkLabel}
        </a>
      </p>

      {saved && (
        <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
          ✅ Key saved successfully!
        </div>
      )}
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex gap-3">
        <input
          type="password"
          required
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={config.placeholder}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
        >
          {saving ? 'Saving...' : hasKey ? 'Update' : 'Save'}
        </button>
      </form>
    </div>
  )
}

export default function Settings() {
  const [token, setToken]       = useState('')
  const [hasToken, setHasToken] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState(null)

  useEffect(() => {
    githubApi.checkToken()
      .then(res => setHasToken(res.data.has_token))
      .catch(() => setHasToken(false))
  }, [])

  const handleSaveGithub = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      await githubApi.saveToken(token)
      setHasToken(true)
      setSaved(true)
      setToken('')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Failed to save token.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">⚙️ Settings</h1>
        <p className="text-gray-500 mt-1">Manage your GitHub and AI API credentials</p>
      </div>

      {/* GitHub Token */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold text-gray-900">🐙 GitHub Personal Access Token</h2>
          {hasToken === true  && <span className="text-xs px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full font-medium">✅ Saved</span>}
          {hasToken === false && <span className="text-xs px-3 py-1 bg-gray-100 text-gray-500 border border-gray-200 rounded-full font-medium">Not set</span>}
        </div>

        <p className="text-xs text-gray-500 mb-1">Required to fetch PR data and post inline review comments back to GitHub.</p>
        <p className="text-xs text-gray-400 mb-4">
          Create at{' '}
          <a href="https://github.com/settings/tokens/new" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
            github.com/settings/tokens
          </a>
          {' '}— needs <code className="bg-gray-100 px-1 rounded">repo</code> scope.
        </p>

        {saved && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
            ✅ Token saved successfully!
          </div>
        )}
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSaveGithub} className="flex gap-3">
          <input
            type="password"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {saving ? 'Saving...' : hasToken ? 'Update' : 'Save'}
          </button>
        </form>
      </div>

      {/* OpenAI + Claude API Keys */}
      {API_KEY_FIELDS.map(config => (
        <ApiKeySection key={config.key} config={config} />
      ))}

      {/* Summary */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
        <p className="font-semibold text-gray-700 mb-2">ℹ️ How keys are used</p>
        <ul className="space-y-1 text-xs">
          <li>🐙 <strong>GitHub token</strong> — fetches PR diffs + posts review comments back to the PR</li>
          <li>🟢 <strong>OpenAI key</strong> — used when GPT-4o / GPT-4 Turbo / GPT-4o Mini is selected</li>
          <li>🟣 <strong>Claude key</strong> — used when Claude Opus / Sonnet / Haiku is selected</li>
        </ul>
        <p className="mt-2 text-xs text-gray-400">All keys are encrypted at rest using Laravel's built-in encryption.</p>
      </div>
    </div>
  )
}
