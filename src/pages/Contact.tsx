import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

export default function Contact() {
  const { showToast } = useToast()
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) {
      showToast('Please fill in all fields', 'error')
      return
    }
    setSubmitting(true)
    const { error } = await supabase.from('contact').insert(form)
    setSubmitting(false)
    if (error) {
      showToast('Failed to send message', 'error')
    } else {
      showToast('Message sent! We will get back to you soon.')
      setForm({ name: '', email: '', message: '' })
    }
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--sp-3)', paddingBottom: 'var(--sp-3)' }}>
      <div className="section-header">
        <h2><i className="fa-solid fa-envelope text-primary" /> Contact Us</h2>
        <p>Have questions? We'd love to hear from you</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-3)', alignItems: 'start' }}>
        <div className="card" style={{ padding: 'var(--sp-3)' }}>
          <h3 style={{ marginBottom: 'var(--sp-2)' }}><i className="fa-solid fa-store text-primary" /> FarmConnect</h3>
          <p className="text-muted mb-2">Connecting local farmers directly with customers. Fresh, organic, and locally sourced agricultural products delivered to your doorstep.</p>
          <div className="flex items-center gap-1 mb-1">
            <i className="fa-solid fa-location-dot text-primary" />
            <span>123 Farm Road, Green Valley, USA</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <i className="fa-solid fa-phone text-primary" />
            <span>+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <i className="fa-solid fa-envelope text-primary" />
            <span>hello@farmconnect.com</span>
          </div>
          <div className="flex gap-1" style={{ marginTop: 'var(--sp-2)' }}>
            <a href="#" className="social-icon" aria-label="Facebook"><i className="fa-brands fa-facebook-f" /></a>
            <a href="#" className="social-icon" aria-label="Twitter"><i className="fa-brands fa-x-twitter" /></a>
            <a href="#" className="social-icon" aria-label="Instagram"><i className="fa-brands fa-instagram" /></a>
          </div>
        </div>

        <div className="card" style={{ padding: 'var(--sp-3)' }}>
          <h3 style={{ marginBottom: 'var(--sp-2)' }}><i className="fa-solid fa-paper-plane text-primary" /> Send a Message</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            </div>
            <div className="form-group">
              <label className="form-label">Your Email</label>
              <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Message</label>
              <textarea className="form-input" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help you?" style={{ minHeight: 120 }} />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={submitting}>
              {submitting ? <i className="fa-solid fa-spinner fa-spin" /> : <><i className="fa-solid fa-paper-plane" /> Send Message</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
