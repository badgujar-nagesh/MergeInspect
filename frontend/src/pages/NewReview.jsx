import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { reviewsApi, githubApi } from '../api/reviews'

const AI_MODELS = [
  {
    provider: 'openai',
    label: 'OpenAI',
    models: [
      { value: 'gpt-4o',          label: 'GPT-4o',           desc: 'Most capable, best for complex reviews' },
      { value: 'gpt-4-turbo',     label: 'GPT-4 Turbo',      desc: 'Fast & accurate' },
      { value: 'gpt-4o-mini',     label: 'GPT-4o Mini',      desc: 'Faster & cheaper, good for small PRs' },
    ],
  },
  {
    provider: 'claude',
    label: 'Anthropic Claude',
    models: [
      { value: 'claude-opus-4-5',   label: 'Claude Opus 4.5',   desc: 'Most powerful Claude model' },
      { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5', desc: 'Balanced speed & quality' },
      { value: 'claude-haiku-4-5',  label: 'Claude Haiku 4.5',  desc: 'Fastest Claude model' },
    ],
  },
]

// Parse PR URL → { owner, repo, prNumber }
function parsePRUrl(url) {
  try {
    // https://github.com/owner/repo/pull/123
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/)
    if (!match) return null
    return { owner: match[1], repo: match[2], prNumber: parseInt(match[3], 10) }
  } catch {
    return null
  }
}

export default function NewReview() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    pr_url:         '',
    ai_provider:    'openai',
    ai_model:       'gpt-4o',
    post_to_github: true,
  })

  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [hasToken, setHasToken] = useState({ openai: null, claude: null, github: null })
  const [step, setStep]         = useState('idle')

  useEffect(() => {
    Promise.all([
      githubApi.checkToken(),
      githubApi.checkApiKey('openai'),
      githubApi.checkApiKey('claude'),
    ]).then(([gh, oai, cl]) => {
      setHasToken({
        github: gh.data.has_token,
        openai: oai.data.has_key,
        claude: cl.data.has_key,
      })
    }).catch(console.error)
  }, [])

  // When provider changes, auto-select first model of that provider
  const handleProviderChange = (provider) => {
    const firstModel = AI_MODELS.find(g => g.provider === provider).models[0].value
    setForm(f => ({ ...f, ai_provider: provider, ai_model: firstModel }))
  }

  const currentModels = AI_MODELS.find(g => g.provider === form.ai_provider)?.models ?? []

  const selectedProviderHasKey = form.ai_provider === 'openai' ? hasToken.openai : hasToken.claude

  const prParsed = parsePRUrl(form.pr_url)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (!hasToken.github) {
      setErrors({ general: 'Please save your GitHub Personal Access Token in Settings first.' })
      return
    }
    if (!selectedProviderHasKey) {
      setErrors({ general: `Please save your ${form.ai_provider === 'openai' ? 'OpenAI' : 'Claude'} API key in Settings first.` })
      return
    }
    if (!prParsed) {
      setErrors({ pr_url: 'Please enter a valid GitHub PR URL, e.g. https://github.com/owner/repo/pull/42' })
      return
    }

    setLoading(true)
    setStep('fetching')

    try {
      setTimeout(() => setStep('analyzing'), 2000)
      if (form.post_to_github) setTimeout(() => setStep('posting'), 8000)

      const res = await reviewsApi.create({
        pr_url:         form.pr_url,
        ai_provider:    form.ai_provider,
        ai_model:       form.ai_model,
        post_to_github: form.post_to_github,
      })

      setStep('done')
      navigate(`/reviews/${res.data.data.id}`)
    } catch (err) {
      setStep('idle')
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors)
      } else {
        setErrors({ general: err.response?.data?.message ?? 'Something went wrong. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  const stepLabels = {
    idle:      null,
    fetching:  '🔍 Fetching PR diff from GitHub...',
    analyzing: `🤖 Analyzing code with ${form.ai_model}...`,
    posting:   '🐙 Posting review comments to GitHub PR...',
    done:      '✅ Done! Redirecting...',
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">🔍 New PR Review</h1>
        <p className="text-gray-500 mt-1">Paste a GitHub Pull Request URL to analyze with AI</p>
      </div>

      {/* Warning banners */}
      {hasToken.github === false && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 font-medium">
          ⚠️ No GitHub token saved. <a href="/settings" className="underline">Go to Settings</a> to add it.
        </div>
      )}
      {hasToken[form.ai_provider] === false && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800 font-medium">
          ⚠️ No {form.ai_provider === 'openai' ? 'OpenAI' : 'Claude'} API key saved.{' '}
          <a href="/settings" className="underline">Go to Settings</a> to add it.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* PR URL */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              GitHub Pull Request URL
            </label>
            <input
              type="url"
              required
              value={form.pr_url}
              onChange={(e) => setForm({ ...form, pr_url: e.target.value })}
              placeholder="https://github.com/owner/repository/pull/42"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm ${
                errors.pr_url ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.pr_url && <p className="mt-1 text-xs text-red-600">{errors.pr_url}</p>}

            {/* Live parse preview */}
            {form.pr_url && (
              <p className={`mt-1.5 text-xs ${prParsed ? 'text-green-600' : 'text-red-500'}`}>
                {prParsed
                  ? `✅ Parsed: ${prParsed.owner}/${prParsed.repo} — PR #${prParsed.prNumber}`
                  : '❌ Invalid URL — must match https://github.com/owner/repo/pull/NUMBER'}
              </p>
            )}
          </div>

          {/* AI Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
            <div className="grid grid-cols-2 gap-3">
              {AI_MODELS.map(({ provider, label }) => {
                const hasKey = provider === 'openai' ? hasToken.openai : hasToken.claude
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => handleProviderChange(provider)}
                    className={`relative flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 transition-all ${
                      form.ai_provider === provider
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl">{provider === 'openai' ? '🟢' : '🟣'}</span>
                    <span className="text-sm font-semibold">{label}</span>
                    {hasKey === false && (
                      <span className="text-xs text-yellow-600 font-medium">⚠️ No key</span>
                    )}
                    {hasKey === true && (
                      <span className="text-xs text-green-600 font-medium">✅ Ready</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* AI Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <div className="space-y-2">
              {currentModels.map(({ value, label, desc }) => (
                <label
                  key={value}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    form.ai_model === value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="ai_model"
                    value={value}
                    checked={form.ai_model === value}
                    onChange={() => setForm(f => ({ ...f, ai_model: value }))}
                    className="mt-0.5 accent-blue-600"
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{label}</p>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Post to GitHub toggle */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              id="post_to_github"
              checked={form.post_to_github}
              onChange={(e) => setForm({ ...form, post_to_github: e.target.checked })}
              className="mt-0.5 w-4 h-4 accent-blue-600 cursor-pointer"
            />
            <label htmlFor="post_to_github" className="cursor-pointer">
              <span className="text-sm font-semibold text-gray-800">🐙 Post review comments to GitHub PR</span>
              <p className="text-xs text-gray-500 mt-0.5">
                AI findings will be posted as inline review comments directly on the pull request diff
              </p>
            </label>
          </div>

          {/* Progress */}
          {loading && stepLabels[step] && (
            <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <svg className="animate-spin w-5 h-5 text-blue-600 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              <p className="text-sm font-medium text-blue-700">{stepLabels[step]}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !prParsed}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : '🚀 Analyze Pull Request'}
          </button>
        </form>
      </div>

      {/* Steps info */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600 space-y-1">
        <p className="font-semibold text-gray-700">What happens next:</p>
        <p>1. PR diff is fetched from GitHub API</p>
        <p>2. <strong>{form.ai_model}</strong> analyzes the code for security, performance, quality & architecture</p>
        <p>3. Findings are saved with scores (0–100) per category</p>
        {form.post_to_github && <p>4. 🐙 Review comments are posted inline on the GitHub PR diff</p>}
      </div>
    </div>
  )
}
