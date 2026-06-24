import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiChatApi } from '@/lib/aiChatApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content: "Hi! I'm your AI assistant. Ask me about tasks, workflows, team productivity, or how to use this system.",
  },
]

const STORAGE_KEY = 'tm_chat_history'

function loadHistory() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : INITIAL_MESSAGES
  } catch {
    return INITIAL_MESSAGES
  }
}

function saveHistory(messages) {
  try {
    // Keep last 50 messages to avoid sessionStorage bloat
    const trimmed = messages.slice(-50)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  } catch {}
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(loadHistory)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const addMessage = (msg) => {
    setMessages((prev) => {
      const next = [...prev, msg]
      saveHistory(next)
      return next
    })
  }

  const mutation = useMutation({
    mutationFn: aiChatApi.sendMessage,
    onSuccess: (data) => {
      addMessage({ role: 'assistant', content: data.reply })
    },
    onError: () => {
      addMessage({ role: 'assistant', content: 'Sorry, something went wrong. Please try again.' })
    },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, mutation.isPending])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  function handleSend(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed || mutation.isPending) return
    addMessage({ role: 'user', content: trimmed })
    mutation.mutate(trimmed)
    setInput('')
  }

  function handleClear() {
    setMessages(INITIAL_MESSAGES)
    sessionStorage.removeItem(STORAGE_KEY)
  }

  const nonInitialCount = messages.filter((m) => m.role === 'user').length

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-13 h-13 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center hover:bg-blue-700 transition-all hover:scale-105 z-50 p-3.5"
        aria-label="Toggle AI chat"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-84 bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden"
          style={{ width: '22rem', height: '32rem' }}
        >
          {/* Header */}
          <div className="px-4 py-3 bg-blue-600 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold leading-none">AI Assistant</p>
                <p className="text-[10px] text-white/70 mt-0.5">Powered by Groq</p>
              </div>
            </div>
            {nonInitialCount > 0 && (
              <button
                onClick={handleClear}
                className="text-[10px] text-white/70 hover:text-white border border-white/30 rounded px-1.5 py-0.5 transition-colors"
                title="Clear chat history"
              >
                Clear
              </button>
            )}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-sm leading-relaxed shadow-sm ${
                    m.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {mutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 text-gray-400 text-sm px-3 py-2 rounded-xl rounded-bl-sm shadow-sm flex items-center gap-1">
                  <span className="animate-bounce inline-block" style={{ animationDelay: '0ms' }}>•</span>
                  <span className="animate-bounce inline-block" style={{ animationDelay: '150ms' }}>•</span>
                  <span className="animate-bounce inline-block" style={{ animationDelay: '300ms' }}>•</span>
                </div>
              </div>
            )}
          </div>

          {/* Suggested prompts — show only at start */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5 shrink-0 bg-gray-50">
              {['How do I assign a task?', 'What are my pending tasks?', 'Explain task priorities'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    addMessage({ role: 'user', content: prompt })
                    mutation.mutate(prompt)
                  }}
                  className="text-xs px-2 py-1 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2 shrink-0 bg-white">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 text-sm"
              disabled={mutation.isPending}
            />
            <Button type="submit" size="sm" disabled={mutation.isPending || !input.trim()}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
