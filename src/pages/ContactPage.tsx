import React, { useState } from 'react';
import { apiRequest } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { GlassCard } from '../components/ui/glass/GlassCard';
import { GlassButton } from '../components/ui/glass/GlassButton';
import { GlassInput, GlassTextarea } from '../components/ui/glass/GlassInput';
import { Send, CheckCircle2, Phone, MessageSquare } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, subject, message }),
      });

      setIsSuccess(true);
      showToast('Message sent successfully! Our team will respond shortly.', 'success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: any) {
      showToast(err.message || 'Failed to send message.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto min-h-screen">
      <div className="text-center max-w-xl mx-auto mb-10">
        <h1 className="text-3xl font-extrabold text-white">
          Contact Support
        </h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          Need assistance with courses, accounts, or enrollment? Reach out directly to customer support.
        </p>

        {/* Official Customer Support Phone Card */}
        <div className="mt-6 inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.05] border border-white/12 backdrop-blur-xl shadow-lg">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="text-[11px] text-slate-400 block uppercase tracking-wider font-semibold">Official Support Line</span>
            <a
              href="tel:7796021948"
              className="text-white font-bold text-sm hover:underline tracking-wide"
            >
              7796021948
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <GlassCard interactive={false} className="p-8 rounded-[32px] shadow-2xl">
          <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/8">
            <MessageSquare className="w-4 h-4 text-slate-300" />
            <h2 className="text-base font-bold text-white">Send a Message</h2>
          </div>
          {isSuccess ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Thank You for Reaching Out
              </h3>
              <p className="text-xs text-slate-400 mt-2">
                Your message has been safely received in our support records. We will follow up via email.
              </p>
              <div className="mt-6">
                <GlassButton variant="secondary" size="sm" onClick={() => setIsSuccess(false)}>
                  Send Another Message
                </GlassButton>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <GlassInput
                pill
                label="Your Name"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <GlassInput
                pill
                label="Email Address"
                type="email"
                placeholder="name@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <GlassInput
                pill
                label="Subject"
                placeholder="Course Inquiry, Billing, or Feedback"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />

              <GlassTextarea
                label="Message"
                placeholder="How can we assist you today?"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />

              <div className="pt-2">
                <GlassButton
                  variant="primary"
                  size="md"
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </GlassButton>
              </div>
            </form>
          )}
        </GlassCard>
      </div>
    </div>
  );
};
