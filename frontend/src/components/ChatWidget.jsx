import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiChatApi } from '@/lib/aiChatApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hi! I'm your assistant. Ask me about tasks, workflows, or how to use the system." },
  ])
  const scrollRef = useRef(null)

  const mutation = useMutation({
    mutationFn: aiChatApi.sendMessage,
    onSuccess: (data) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }])
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ])
    },
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, mutation.isPending])

  function handleSend(e) {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }])
    mutation.mutate(trimmed)
    setInput('')
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 text-white shadow-lg flex items-center justify-center text-2xl hover:bg-blue-700 transition-colors z-50"
        aria-label="Toggle AI chat"
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-24 right-6 w-80 h-[28rem] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col z-50">
          <div className="px-4 py-3 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
            <h3 className="font-semibold text-sm">AI Assistant</h3>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] px-3 py-2 rounded-lg text-sm ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white ml-auto'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {m.content}
              </div>
            ))}
            {mutation.isPending && (
              <div className="bg-gray-100 text-gray-500 text-sm px-3 py-2 rounded-lg max-w-[85%]">
                Thinking...
              </div>
            )}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-gray-200 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1"
            />
            <Button type="submit" size="sm" disabled={mutation.isPending}>
              Send
            </Button>
          </form>
        </div>
      )}
    </>
  )
}
