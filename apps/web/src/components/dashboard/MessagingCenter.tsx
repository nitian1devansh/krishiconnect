'use client';

import React, { useState } from 'react';
import {
  BadgeCheck,
  CircleHelp,
  FileText,
  Paperclip,
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';

export function MessagingCenter({ isAdmin = false }: { isAdmin?: boolean }) {
  const { language } = useLanguage();
  const contacts = isAdmin
    ? [
        {
          name: 'GreenGrow Seeds',
          person: 'Vikram Patel · Vendor',
          initials: 'GG',
          preview: 'We have uploaded the updated GST document.',
          time: '10:42 AM',
          unread: 2,
          status: 'Verified vendor',
          order: 'Verification #KV-1842',
        },
        {
          name: 'Bharat Agro Tools',
          person: 'Manoj Singh · Vendor',
          initials: 'BA',
          preview: 'Could you clarify the product approval note?',
          time: '9:18 AM',
          unread: 1,
          status: 'Verified vendor',
          order: 'Product case #PA-2049',
        },
        {
          name: 'Maha Krishi Center',
          person: 'Asha Pawar · Vendor',
          initials: 'MK',
          preview: 'Thank you. We will update the bank details.',
          time: 'Yesterday',
          unread: 0,
          status: 'Under review',
          order: 'Payout case #PO-918',
        },
        {
          name: 'JalDhara Systems',
          person: 'Kiran Desai · Vendor',
          initials: 'JD',
          preview: 'Drip kit bulk pricing update requested.',
          time: '16 Jun',
          unread: 0,
          status: 'Verified vendor',
          order: 'Catalog #JD-441',
        },
      ]
    : [
        {
          name: 'Rajesh Kumar',
          person: 'Farmer · Nashik',
          initials: 'RK',
          preview: 'Understood. How much should I use for each tomato plant?',
          time: '10:42 AM',
          unread: 1,
          status: 'Verified farmer',
          order: 'Order #KC2048 · Tomato Seeds',
        },
        {
          name: 'Sunita Patil',
          person: 'Farmer · Pune',
          initials: 'SP',
          preview: 'Does the bio fungicide come with usage instructions in Marathi?',
          time: 'Yesterday',
          unread: 0,
          status: 'Verified farmer',
          order: 'Order #KC1982 · Bio Care',
        },
        {
          name: 'Anil Jadhav',
          person: 'Farmer · Satara',
          initials: 'AJ',
          preview: 'When will the 50g packet be back in stock?',
          time: '16 Jun',
          unread: 0,
          status: 'Registered buyer',
          order: 'Inquiry · Sarpan Tomato',
        },
      ];

  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState<string[]>([]);
  const contact = contacts[selected] || contacts[0];

  const send = () => {
    if (!draft.trim()) return;
    setSent((prev) => [...prev, draft.trim()]);
    setDraft('');
  };

  return (
    <div className="dash-content">
      <div className="dash-welcome">
        <div>
          <p>
            {tx(
              language,
              isAdmin ? 'MARKETPLACE COMMUNICATIONS' : 'REAL-TIME SUPPORT',
              isAdmin ? 'मार्केटप्लेस संचार' : 'रियल-टाइम सहायता'
            )}
          </p>
          <h1>
            {tx(
              language,
              isAdmin ? 'Vendor Communications & Inquiries' : 'Direct Messages & Advisory',
              isAdmin ? 'विक्रेता संचार और पूछताछ' : 'सीधे संदेश और सलाह'
            )}
          </h1>
          <span>
            {tx(
              language,
              isAdmin
                ? 'Coordinate directly with sellers for approvals, documents and marketplace operations.'
                : 'Help farmers with products, orders and application guidance.',
              isAdmin
                ? 'स्वीकृति, दस्तावेज़ और मार्केटप्लेस संचालन के लिए विक्रेताओं से सीधे जुड़ें।'
                : 'उत्पाद, ऑर्डर और उपयोग संबंधी मार्गदर्शन में किसानों की मदद करें।'
            )}
          </span>
        </div>
        <button type="button" className="primary" onClick={() => alert('Starting new message')}>
          <Plus size={16} /> {tx(language, 'New message', 'नया संदेश')}
        </button>
      </div>

      <section className="message-shell">
        {/* Left: Conversation list */}
        <aside className="conversation-list">
          <div className="conversation-search">
            <Search size={16} />
            <input
              placeholder={tx(
                language,
                `Search ${isAdmin ? 'vendors' : 'farmers'}...`,
                `${isAdmin ? 'विक्रेता' : 'किसान'} खोजें...`
              )}
            />
          </div>
          <div className="inbox-tabs">
            <button type="button" className="active">
              {tx(language, 'All messages', 'सभी संदेश')}
            </button>
            <button type="button">{tx(language, 'Unread', 'अपठित')}</button>
          </div>
          <div className="conversation-scroll">
            {contacts.map((item, index) => (
              <button
                type="button"
                className={`conversation-item ${selected === index ? 'active' : ''}`}
                onClick={() => setSelected(index)}
                key={item.name}
              >
                <span className={`message-avatar avatar-${index}`}>{item.initials}</span>
                <div>
                  <span>
                    <b>{item.name}</b>
                    <small>{item.time}</small>
                  </span>
                  <em>{item.person}</em>
                  <p>{item.preview}</p>
                </div>
                {item.unread > 0 && <i>{item.unread}</i>}
              </button>
            ))}
          </div>
        </aside>

        {/* Center: Chat panel */}
        <section className="chat-panel">
          <header className="chat-header">
            <span className={`message-avatar avatar-${selected}`}>{contact.initials}</span>
            <div>
              <b>{contact.name}</b>
              <small>
                <i /> {tx(language, 'Online now', 'अभी ऑनलाइन')} · {contact.person}
              </small>
            </div>
            <button type="button" title="Start a phone call" onClick={() => alert('Starting voice call...')}>
              <Phone size={17} />
            </button>
            <button type="button" title="Start a video call" onClick={() => alert('Starting video call...')}>
              <Video size={17} />
            </button>
          </header>

          <div className="chat-context">
            <ShieldCheck size={18} />
            <span>
              <b>
                {tx(
                  language,
                  isAdmin ? 'Official marketplace conversation' : 'Protected farmer conversation',
                  isAdmin ? 'आधिकारिक मार्केटप्लेस वार्तालाप' : 'सुरक्षित किसान वार्तालाप'
                )}
              </b>
              <small>
                {isAdmin
                  ? 'Messages are retained in the admin audit log.'
                  : 'Only share product and order information through KrishiConnect.'}
              </small>
            </span>
          </div>

          <div className="chat-messages">
            <span className="chat-date">{tx(language, 'TODAY', 'आज')}</span>
            <div className="message-bubble incoming">
              <p>
                {isAdmin
                  ? 'Hello, we received a request for our updated GST certificate. We have uploaded the new document to our shop profile.'
                  : 'Hello, I purchased the organic vermicompost from your shop. Can I apply it through my drip irrigation system?'}
              </p>
              <small>10:38 AM</small>
            </div>
            <div className="message-bubble outgoing">
              <p>
                {isAdmin
                  ? 'Thank you. I can see the document now. Our verification team will review it today.'
                  : 'Hello Rajesh. Vermicompost should be applied directly to moist soil around the root zone, not through the drip line.'}
              </p>
              <small>10:40 AM · Read</small>
            </div>
            <div className="message-bubble incoming">
              <p>
                {isAdmin
                  ? 'Great. Please let us know if any other information is required.'
                  : 'Understood. How much should I use for each tomato plant?'}
              </p>
              <small>10:42 AM</small>
            </div>

            {sent.map((msg, index) => (
              <div className="message-bubble outgoing" key={`${msg}-${index}`}>
                <p>{msg}</p>
                <small>Just now · Sent</small>
              </div>
            ))}
          </div>

          <div className="quick-replies">
            <span>{tx(language, 'Quick reply:', 'त्वरित उत्तर:')}</span>
            {(isAdmin
              ? ['Document received', 'Please update details', 'Review in progress']
              : ['Share usage guide', 'Check order status', 'Talk to our expert']
            ).map((reply) => (
              <button
                type="button"
                onClick={() => setDraft(reply)}
                key={reply}
              >
                {reply}
              </button>
            ))}
          </div>

          <form
            className="message-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <button
              type="button"
              title="Attach a file"
              onClick={() => alert('Select file attachment')}
            >
              <Paperclip size={18} />
            </button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={tx(
                language,
                `Message ${contact.name}...`,
                `${contact.name} को संदेश...`
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              className="send-message"
              disabled={!draft.trim()}
              type="submit"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </section>

        {/* Right: Contact details */}
        <aside className="contact-details">
          <span className={`message-avatar large avatar-${selected}`}>{contact.initials}</span>
          <h3>{contact.name}</h3>
          <p>{contact.person}</p>
          <span className="contact-status">
            <BadgeCheck size={14} /> {contact.status}
          </span>
          <div className="contact-summary">
            <small>{tx(language, 'CONVERSATION ABOUT', 'वार्तालाप का विषय')}</small>
            <b>{contact.order}</b>
            <button type="button" onClick={() => alert('Opening conversation context')}>
              {tx(language, 'View details', 'विवरण देखें')} <BadgeCheck size={12} />
            </button>
          </div>
          <div className="contact-facts">
            <span>
              <small>{isAdmin ? 'JOINED' : 'ORDERS'}</small>
              <b>{isAdmin ? 'Aug 2023' : '8'}</b>
            </span>
            <span>
              <small>{isAdmin ? 'RATING' : 'SPENT'}</small>
              <b>{isAdmin ? '4.8 ★' : '₹12,460'}</b>
            </span>
          </div>
          <button
            type="button"
            className="outline-btn full"
            onClick={() => alert(`Opening profile for ${contact.name}`)}
          >
            <FileText size={15} />{' '}
            {tx(
              language,
              `View ${isAdmin ? 'vendor profile' : 'customer profile'}`,
              isAdmin ? 'विक्रेता प्रोफ़ाइल देखें' : 'ग्राहक प्रोफ़ाइल देखें'
            )}
          </button>
          <button
            type="button"
            className="message-support-action"
            onClick={() => alert('Escalated to KrishiConnect Support')}
          >
            <CircleHelp size={15} /> {tx(language, 'Escalate to support', 'सहायता टीम को भेजें')}
          </button>
        </aside>
      </section>
    </div>
  );
}

export default MessagingCenter;

