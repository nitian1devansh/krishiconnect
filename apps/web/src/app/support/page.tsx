'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bug,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CloudRain,
  CloudSun,
  Droplets,
  FlaskConical,
  Headphones,
  Leaf,
  MapPin,
  MessageSquare,
  Plus,
  Send,
  ShieldCheck,
  Sprout,
  Star,
  Sun,
  ThermometerSun,
  ThumbsUp,
  Video,
  Wind,
  X,
  Zap,
} from 'lucide-react';
import { useLanguage, tx } from '@/context/LanguageContext';
import { SoilTestingModule } from '@/components/soil/SoilTestingModule';

type SupportTab = 'community' | 'calendar' | 'weather' | 'soil' | 'advisor';

function SupportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get('tab') as SupportTab) || 'community';
  const { language } = useLanguage();

  const [active, setActive] = useState<SupportTab>(initialTab);

  // 1. Community state
  const [question, setQuestion] = useState('');
  const [posted, setPosted] = useState(false);
  const [liked, setLiked] = useState<number[]>([1]);
  const [booking, setBooking] = useState('');

  // 2. Calendar state
  const [calendarCrop, setCalendarCrop] = useState('Tomato');
  const [calendarDone, setCalendarDone] = useState<number[]>([1, 2]);

  // 3. Weather state
  const [location, setLocation] = useState('Nashik, Maharashtra');
  const [savedLoc, setSavedLoc] = useState(false);

  // 4. Advisor state
  const [advisorCrop, setAdvisorCrop] = useState('Tomato');
  const [stage, setStage] = useState('Vegetative growth');
  const [soil, setSoil] = useState('Black soil');
  const [problem, setProblem] = useState('Yellowing leaves');
  const [generated, setGenerated] = useState(false);

  const posts = [
    {
      id: 1,
      initials: 'MS',
      author: 'Mahesh Saini',
      location: 'Nashik, Maharashtra',
      time: '2 hours ago',
      tag: 'Tomato',
      title: 'Yellow spots are appearing on lower tomato leaves. What should I do?',
      body: 'The plants are 35 days old and I noticed these spots after two days of rain. Drip irrigation is running every alternate day.',
      answers: 12,
      likes: 28,
      expert: true,
    },
    {
      id: 2,
      initials: 'AK',
      author: 'Arun Kumar',
      location: 'Indore, Madhya Pradesh',
      time: '5 hours ago',
      tag: 'Soybean',
      title: 'Sharing my ridge sowing experience after early monsoon rain',
      body: 'Using raised ridges helped drainage significantly this year. Germination is even, and I used nearly 15% less seed per acre.',
      answers: 8,
      likes: 41,
      expert: false,
    },
    {
      id: 3,
      initials: 'SP',
      author: 'Sunita Pawar',
      location: 'Pune, Maharashtra',
      time: 'Yesterday',
      tag: 'Organic',
      title: 'Best organic treatment for whiteflies in chilli?',
      body: 'Neem spray helped for a week, but they are returning. Looking for a safe rotation plan before flowering begins.',
      answers: 19,
      likes: 36,
      expert: true,
    },
  ];

  const experts = [
    { name: 'Dr. Meera Joshi', role: 'Plant Pathologist', exp: '12 years', initials: 'MJ' },
    { name: 'Arvind Deshmukh', role: 'Soil & Nutrition Expert', exp: '9 years', initials: 'AD' },
    { name: 'Dr. Sana Khan', role: 'Entomologist', exp: '11 years', initials: 'SK' },
  ];

  const calendarTasks = [
    {
      day: '18',
      month: 'JUN',
      title: 'Inspect seedlings for leaf spots',
      type: 'Crop health',
      detail: 'Check lower leaves on at least 20 plants across the field.',
      id: 1,
    },
    {
      day: '20',
      month: 'JUN',
      title: 'Drip irrigation cycle',
      type: 'Irrigation',
      detail: 'Run drip lines for 35 minutes before 8 AM.',
      id: 2,
    },
    {
      day: '22',
      month: 'JUN',
      title: 'First nutrient application',
      type: 'Nutrition',
      detail: 'Apply water-soluble NPK 19:19:19 at recommended dosage.',
      id: 3,
    },
    {
      day: '25',
      month: 'JUN',
      title: 'Install plant support',
      type: 'Field work',
      detail: 'Begin staking healthy plants before rapid vegetative growth.',
      id: 4,
    },
  ];

  const forecast = [
    ['TODAY', '31°', '22°', CloudSun, '10%', '12 km/h'],
    ['WED', '32°', '23°', Sun, '5%', '10 km/h'],
    ['THU', '27°', '21°', CloudRain, '85%', '22 km/h'],
    ['FRI', '28°', '21°', CloudRain, '60%', '18 km/h'],
    ['SAT', '29°', '22°', CloudSun, '30%', '14 km/h'],
    ['SUN', '30°', '23°', CloudSun, '15%', '11 km/h'],
    ['MON', '31°', '23°', Sun, '10%', '9 km/h'],
  ] as const;

  const supportTabs = [
    { id: 'community' as SupportTab, label: 'Community', labelHi: 'समुदाय', icon: MessageSquare },
    { id: 'calendar' as SupportTab, label: 'Crop Calendar', labelHi: 'फसल कैलेंडर', icon: CalendarDays },
    { id: 'weather' as SupportTab, label: 'Weather Assistant', labelHi: 'मौसम सहायक', icon: CloudSun },
    { id: 'soil' as SupportTab, label: 'Soil Testing', labelHi: 'मिट्टी परीक्षण', icon: FlaskConical },
    { id: 'advisor' as SupportTab, label: 'Smart Advisor', labelHi: 'स्मार्ट सलाह', icon: Sprout },
  ];

  return (
    <main className="support-page">
      {/* Hero Header */}
      <section className="support-hero">
        <div className="container support-hero-inner">
          <div>
            <span className="hero-tag">
              <Sprout size={15} /> KRISHICONNECT FARMER HUB
            </span>
            <h1>{tx(language, 'Knowledge for every field.', 'हर खेत के लिए ज्ञान।')}</h1>
            <p>
              {tx(
                language,
                'Plan confidently with your community, trusted experts and farm-specific insights.',
                'समुदाय, विशेषज्ञों और खेत-विशेष जानकारी के साथ आत्मविश्वास से योजना बनाएँ।'
              )}
            </p>
          </div>
          <div className="farm-profile-chip">
            <span>RK</span>
            <div>
              <small>{tx(language, 'ACTIVE FARM PROFILE', 'सक्रिय खेत प्रोफ़ाइल')}</small>
              <b>{tx(language, 'Rajesh’s Tomato Farm', 'राजेश का टमाटर खेत')}</b>
              <p>
                {tx(language, 'Nashik · 4.5 acres · Sowing stage', 'नासिक · 4.5 एकड़ · बुवाई चरण')}
              </p>
            </div>
            <ChevronRight size={18} />
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="support-nav-wrap">
        <nav className="container support-nav">
          {supportTabs.map(({ id, label, labelHi, icon: Icon }) => (
            <button
              type="button"
              className={active === id ? 'active' : ''}
              onClick={() => setActive(id)}
              key={id}
            >
              <Icon size={18} /> <span>{tx(language, label, labelHi)}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* TAB 1: COMMUNITY MODULE */}
      {active === 'community' && (
        <div className="container support-content community-layout">
          <section className="community-feed">
            <div className="support-title">
              <div>
                <span className="kicker">{tx(language, 'FARMER COMMUNITY', 'किसान समुदाय')}</span>
                <h2>
                  {tx(
                    language,
                    'Learn from people who understand the land',
                    'ज़मीन को समझने वाले लोगों से सीखें'
                  )}
                </h2>
                <p>
                  {tx(
                    language,
                    'Ask, answer and share practical farming knowledge.',
                    'सवाल पूछें, जवाब दें और व्यावहारिक खेती ज्ञान साझा करें।'
                  )}
                </p>
              </div>
              <button
                type="button"
                className="primary"
                onClick={() => document.getElementById('ask-question')?.focus()}
              >
                <Plus size={16} /> {tx(language, 'Ask a question', 'सवाल पूछें')}
              </button>
            </div>

            <div className="ask-card">
              <span className="community-avatar">RK</span>
              <div>
                <textarea
                  id="ask-question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={tx(
                    language,
                    'What would you like to ask the community?',
                    'आप समुदाय से क्या पूछना चाहेंगे?'
                  )}
                />
                <div className="ask-actions">
                  <span>
                    <Leaf size={14} /> Add crop
                  </span>
                  <span>
                    <MapPin size={14} /> Add location
                  </span>
                  <button
                    type="button"
                    disabled={!question.trim()}
                    onClick={() => {
                      setPosted(true);
                      setQuestion('');
                    }}
                  >
                    {tx(language, 'Post question', 'सवाल पोस्ट करें')} <Send size={15} />
                  </button>
                </div>
              </div>
            </div>

            {posted && (
              <div className="posted-notice">
                <CheckCircle2 size={18} /> Your question was shared with the community. Experts have
                been notified.
              </div>
            )}

            <div className="feed-filters">
              <button type="button" className="active">
                For you
              </button>
              <button type="button">Unanswered</button>
              <button type="button">Expert answered</button>
              <button type="button">Following</button>
              <select>
                <option>All crops</option>
                <option>Tomato</option>
                <option>Soybean</option>
              </select>
            </div>

            {posts.map((post) => (
              <article className="discussion-card" key={post.id}>
                <div className="discussion-author">
                  <span className="community-avatar">{post.initials}</span>
                  <div>
                    <b>{post.author}</b>
                    <small>
                      {post.location} · {post.time}
                    </small>
                  </div>
                  <span className="crop-tag">{post.tag}</span>
                </div>
                <h3>{post.title}</h3>
                <p>{post.body}</p>
                {post.expert && (
                  <div className="expert-answer">
                    <span>
                      <BadgeCheck size={18} />
                    </span>
                    <div>
                      <b>Expert response from Dr. Meera Joshi</b>
                      <p>
                        This may be early blight. Remove affected lower leaves, avoid overhead watering
                        and monitor new growth for 48 hours before treatment.
                      </p>
                    </div>
                  </div>
                )}
                <div className="discussion-actions">
                  <button
                    type="button"
                    className={liked.includes(post.id) ? 'active' : ''}
                    onClick={() =>
                      setLiked((items) =>
                        items.includes(post.id)
                          ? items.filter((item) => item !== post.id)
                          : [...items, post.id]
                      )
                    }
                  >
                    <ThumbsUp size={15} /> {post.likes + (liked.includes(post.id) ? 1 : 0)}
                  </button>
                  <button type="button">
                    <MessageSquare size={15} /> {post.answers} answers
                  </button>
                  <button type="button">
                    <Send size={15} /> Share
                  </button>
                  <button type="button" className="follow-action">
                    Follow discussion
                  </button>
                </div>
              </article>
            ))}
          </section>

          <aside className="community-aside">
            <article className="expert-panel">
              <div className="aside-head">
                <div>
                  <span className="kicker">VERIFIED ADVICE</span>
                  <h3>Consult an expert</h3>
                </div>
                <BadgeCheck size={18} />
              </div>
              <p>Book a private video or phone consultation for your farm.</p>
              {experts.map((expert, index) => (
                <div className="expert-row" key={expert.name}>
                  <span className={`expert-avatar expert-${index}`}>{expert.initials}</span>
                  <div>
                    <b>{expert.name}</b>
                    <small>{expert.role}</small>
                    <span>
                      <Star size={13} fill="currentColor" /> 4.9 · {expert.exp}
                    </span>
                  </div>
                  <button type="button" onClick={() => setBooking(expert.name)}>
                    Book
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="outline-btn full"
                onClick={() => alert('Viewing all experts...')}
              >
                View all 48 experts <ArrowRight size={16} />
              </button>
            </article>

            <article className="community-stats">
              <h3>Community this week</h3>
              <div>
                <span>
                  <b>1,284</b> questions answered
                </span>
                <span>
                  <b>326</b> expert responses
                </span>
                <span>
                  <b>94%</b> helpful answers
                </span>
              </div>
            </article>
          </aside>

          {booking && (
            <div className="modal-backdrop">
              <div className="modal consultation-modal">
                <button type="button" className="modal-close" onClick={() => setBooking('')}>
                  <X size={18} />
                </button>
                <span className="modal-icon">
                  <Video size={24} />
                </span>
                <h2>Book consultation</h2>
                <p>Choose a convenient time to speak with {booking}.</p>
                <div className="consult-options">
                  <button type="button" className="active">
                    <Video size={16} /> Video call <small>₹299 · 20 min</small>
                  </button>
                  <button type="button">
                    <Headphones size={16} /> Phone call <small>₹199 · 15 min</small>
                  </button>
                </div>
                <label>
                  Select date
                  <input type="date" defaultValue="2025-06-21" />
                </label>
                <div className="time-slots">
                  <button type="button">10:30 AM</button>
                  <button type="button" className="active">
                    12:00 PM
                  </button>
                  <button type="button">4:30 PM</button>
                </div>
                <div>
                  <button
                    type="button"
                    className="outline-btn"
                    onClick={() => setBooking('')}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      alert(`Consultation booked with ${booking}! Check your messages.`);
                      setBooking('');
                    }}
                  >
                    Confirm booking
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CROP CALENDAR */}
      {active === 'calendar' && (
        <div className="container support-content">
          <div className="support-title calendar-title">
            <div>
              <span className="kicker">
                {tx(language, 'PERSONALIZED CROP CALENDAR', 'व्यक्तिगत फसल कैलेंडर')}
              </span>
              <h2>
                {tx(language, 'Your season, planned day by day', 'आपके मौसम की दिन-प्रतिदिन योजना')}
              </h2>
              <p>
                {tx(
                  language,
                  'Timely farm activities based on crop stage, location and local conditions.',
                  'फसल चरण, स्थान और स्थानीय परिस्थितियों के आधार पर समय पर कृषि कार्य।'
                )}
              </p>
            </div>
            <button
              type="button"
              className="outline-btn"
              onClick={() => alert('Add crop modal')}
            >
              <Plus size={16} /> Add another crop
            </button>
          </div>

          <div className="crop-selector">
            <div className="crop-identity">
              <span>
                <Sprout size={24} />
              </span>
              <div>
                <small>ACTIVE CROP</small>
                <select
                  value={calendarCrop}
                  onChange={(e) => setCalendarCrop(e.target.value)}
                >
                  <option>Tomato</option>
                  <option>Soybean</option>
                  <option>Onion</option>
                  <option>Wheat</option>
                </select>
                <p>Sarpan F1 · 4.5 acres · Sown 25 May 2025</p>
              </div>
            </div>
            <div className="stage-progress">
              <div>
                <span>Land prep</span>
                <span>Sowing</span>
                <span className="active">Vegetative</span>
                <span>Flowering</span>
                <span>Harvest</span>
              </div>
              <i>
                <b style={{ width: '42%' }} />
              </i>
              <small>Day 24 of approximately 110 days</small>
            </div>
            <div className="harvest-countdown">
              <small>ESTIMATED HARVEST</small>
              <b>72 days</b>
              <span>28 August 2025</span>
            </div>
          </div>

          <div className="calendar-layout">
            <section className="calendar-main">
              <div className="calendar-toolbar">
                <div>
                  <button type="button">
                    <ArrowLeft size={16} />
                  </button>
                  <h3>June 2025</h3>
                  <button type="button">
                    <ArrowRight size={16} />
                  </button>
                </div>
                <span>
                  <i className="today-dot" /> Today
                  <i className="task-dot" /> Farm task
                  <i className="weather-dot" /> Weather alert
                </span>
              </div>
              <div className="month-grid">
                {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                  <b key={day}>{day}</b>
                ))}
                {Array.from({ length: 35 }, (_, i) => {
                  const day = i - 1;
                  const task = [18, 20, 22, 25, 29].includes(day);
                  return (
                    <button
                      type="button"
                      className={`${day === 18 ? 'today' : ''} ${
                        day < 1 || day > 30 ? 'muted' : ''
                      }`}
                      key={i}
                    >
                      {day < 1 ? 30 + day : day > 30 ? day - 30 : day}
                      {task && <i className={day === 20 ? 'weather-dot' : 'task-dot'} />}
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="calendar-upcoming">
              <div className="aside-head">
                <div>
                  <span className="kicker">UP NEXT</span>
                  <h3>Upcoming activities</h3>
                </div>
                <span className="task-count">
                  {calendarTasks.length - calendarDone.length} pending
                </span>
              </div>
              {calendarTasks.map((task) => (
                <article
                  className={calendarDone.includes(task.id) ? 'done' : ''}
                  key={task.id}
                >
                  <div className="task-date">
                    <b>{task.day}</b>
                    <small>{task.month}</small>
                  </div>
                  <div>
                    <span className="task-type">{task.type}</span>
                    <h4>{task.title}</h4>
                    <p>{task.detail}</p>
                  </div>
                  <button
                    type="button"
                    className="task-check"
                    onClick={() =>
                      setCalendarDone((items) =>
                        items.includes(task.id)
                          ? items.filter((x) => x !== task.id)
                          : [...items, task.id]
                      )
                    }
                  >
                    <CheckCircle2 size={20} />
                  </button>
                </article>
              ))}
            </aside>
          </div>
        </div>
      )}

      {/* TAB 3: WEATHER ASSISTANT */}
      {active === 'weather' && (
        <div className="container support-content">
          <div className="support-title weather-title">
            <div>
              <span className="kicker">FARM WEATHER ASSISTANT</span>
              <h2>Field conditions & agricultural advisory</h2>
              <p>Forecast-driven advice for spraying, irrigation and fertilization.</p>
            </div>
            <div className="location-search">
              <MapPin size={18} />
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setSavedLoc(true)}
              >
                {savedLoc ? 'Updated' : 'Update'}
              </button>
            </div>
          </div>

          <section className="weather-dashboard">
            <div className="current-weather">
              <div className="weather-top">
                <div>
                  <span>NOW · {location.toUpperCase()}</span>
                  <h3>29°</h3>
                  <p>Feels like 32° · Partly cloudy</p>
                </div>
                <CloudSun size={52} />
              </div>
              <div className="weather-metrics">
                <span>
                  <Droplets size={18} /> <small>Humidity</small>
                  <b>68%</b>
                </span>
                <span>
                  <Wind size={18} /> <small>Wind</small>
                  <b>12 km/h</b>
                </span>
                <span>
                  <CloudRain size={18} /> <small>Rain today</small>
                  <b>10%</b>
                </span>
                <span>
                  <ThermometerSun size={18} /> <small>Soil temp.</small>
                  <b>25°</b>
                </span>
              </div>
            </div>

            <div className="rain-card">
              <span className="weather-alert-icon">
                <CloudRain size={24} />
              </span>
              <div>
                <small>IMPORTANT WEATHER ALERT</small>
                <h3>Heavy rain likely Thursday afternoon</h3>
                <p>Expected rainfall 18–25 mm between 2 PM and 8 PM.</p>
                <b>Prepare drainage channels and postpone fertilizer application.</b>
              </div>
            </div>
          </section>

          <section className="forecast-card">
            <div className="card-head">
              <div>
                <h3>7-day farm forecast</h3>
                <p>Updated 10 minutes ago</p>
              </div>
              <span>Rain probability · Wind speed</span>
            </div>
            <div className="forecast-grid">
              {forecast.map(([day, high, low, Icon, rain, wind], index) => (
                <article className={index === 0 ? 'active' : ''} key={day}>
                  <b>{day}</b>
                  <Icon size={24} />
                  <strong>
                    {high} <small>{low}</small>
                  </strong>
                  <span>
                    <Droplets size={13} /> {rain}
                  </span>
                  <span>
                    <Wind size={13} /> {wind}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <div className="farm-advice-grid">
            <article className="advice-card irrigation">
              <div className="advice-head">
                <span>
                  <Droplets size={20} />
                </span>
                <div>
                  <small>IRRIGATION</small>
                  <h3>Reduce irrigation today</h3>
                </div>
                <b>MEDIUM</b>
              </div>
              <p>
                Run drip irrigation for only 20 minutes this morning. Skip Thursday due to expected
                rain.
              </p>
              <div className="advice-timing">
                Best time <b>6:00–7:30 AM</b>
              </div>
            </article>

            <article className="advice-card spraying">
              <div className="advice-head">
                <span>
                  <ShieldCheck size={20} />
                </span>
                <div>
                  <small>SPRAYING</small>
                  <h3>Good spraying window</h3>
                </div>
                <b>FAVOURABLE</b>
              </div>
              <p>
                Low wind and no rain expected for the next 18 hours. Complete spraying before Wednesday.
              </p>
              <div className="advice-timing">
                Best time <b>5:30–8:00 PM</b>
              </div>
            </article>

            <article className="advice-card sowing">
              <div className="advice-head">
                <span>
                  <Sprout size={20} />
                </span>
                <div>
                  <small>SOWING</small>
                  <h3>Wait until after rainfall</h3>
                </div>
                <b>WAIT</b>
              </div>
              <p>For soybean, sow Friday morning after checking that field drainage is clear.</p>
              <div className="advice-timing">
                Recommended <b>Friday, 6:00 AM</b>
              </div>
            </article>
          </div>

          <div className="weather-alert-settings">
            <div>
              <CloudSun size={20} />
              <span>
                <b>Farm weather alerts are on</b>
                <small>Rain, heat, wind and crop-action alerts via app and SMS.</small>
              </span>
            </div>
            <button type="button" onClick={() => alert('Weather alerts configured!')}>
              Manage alerts
            </button>
          </div>
        </div>
      )}

      {/* TAB 3.5: SOIL TESTING */}
      {active === 'soil' && <SoilTestingModule />}

      {/* TAB 4: SMART INPUT ADVISOR */}
      {active === 'advisor' && (
        <div className="container support-content">
          <div className="support-title">
            <div>
              <span className="kicker">
                {tx(language, 'SMART INPUT ADVISOR', 'स्मार्ट कृषि सलाहकार')}
              </span>
              <h2>
                {tx(
                  language,
                  'The right input, at the right stage',
                  'सही चरण पर सही कृषि सामग्री'
                )}
              </h2>
              <p>
                {tx(
                  language,
                  'Recommendations based on your crop, growth stage, soil and observed problem.',
                  'आपकी फसल, विकास चरण, मिट्टी और दिखाई देने वाली समस्या के आधार पर सुझाव।'
                )}
              </p>
            </div>
            <span className="science-badge">
              <ShieldCheck size={16} /> Agronomist-reviewed guidance
            </span>
          </div>

          <div className="advisor-layout">
            <section className="advisor-form">
              <div className="advisor-form-head">
                <span>
                  <Sprout size={20} />
                </span>
                <div>
                  <h3>Tell us about your crop</h3>
                  <p>Use your saved farm profile or adjust the details below.</p>
                </div>
              </div>

              <div className="advisor-fields">
                <label>
                  <span>1</span>
                  <div>
                    Crop
                    <select
                      value={advisorCrop}
                      onChange={(e) => setAdvisorCrop(e.target.value)}
                    >
                      <option>Tomato</option>
                      <option>Chilli</option>
                      <option>Soybean</option>
                      <option>Wheat</option>
                    </select>
                  </div>
                </label>
                <label>
                  <span>2</span>
                  <div>
                    Growth stage
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                    >
                      <option>Vegetative growth</option>
                      <option>Seedling</option>
                      <option>Flowering</option>
                      <option>Fruiting</option>
                    </select>
                  </div>
                </label>
                <label>
                  <span>3</span>
                  <div>
                    Soil condition
                    <select
                      value={soil}
                      onChange={(e) => setSoil(e.target.value)}
                    >
                      <option>Black soil</option>
                      <option>Red soil</option>
                      <option>Loamy soil</option>
                      <option>Sandy soil</option>
                    </select>
                  </div>
                </label>
                <label>
                  <span>4</span>
                  <div>
                    What are you observing?
                    <select
                      value={problem}
                      onChange={(e) => setProblem(e.target.value)}
                    >
                      <option>Yellowing leaves</option>
                      <option>Leaf spots</option>
                      <option>Slow growth</option>
                      <option>Visible insects</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="soil-summary">
                <div>
                  <FlaskConical size={20} />
                  <span>
                    <b>Saved soil test · 2 May 2025</b>
                    <small>pH 7.2 · Nitrogen low · Phosphorus adequate · Potassium medium</small>
                  </span>
                </div>
                <button type="button" onClick={() => alert('Full soil report viewed')}>
                  View report
                </button>
              </div>

              <button
                type="button"
                className="primary full"
                onClick={() => setGenerated(true)}
              >
                <Zap size={16} /> Generate my recommendations
              </button>

              <p className="advisor-disclaimer">
                Recommendations are decision support, not a diagnosis. Always follow product labels
                and local agriculture guidance.
              </p>
            </section>

            <section className={`recommendation-results ${generated ? 'generated' : ''}`}>
              {!generated ? (
                <div className="advisor-empty">
                  <span>
                    <FlaskConical size={32} />
                  </span>
                  <h3>Your recommendations will appear here</h3>
                  <p>Complete four crop details to get a practical nutrition and protection plan.</p>
                  <div>
                    <span>
                      <Leaf size={14} /> Crop-specific
                    </span>
                    <span>
                      <ShieldCheck size={14} /> Safety checked
                    </span>
                    <span>
                      <CloudSun size={14} /> Weather aware
                    </span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="result-head">
                    <span className="kicker">PERSONALIZED PLAN</span>
                    <h3>
                      Recommendations for {advisorCrop} · {stage}
                    </h3>
                    <p>
                      Based on {soil.toLowerCase()}, {problem.toLowerCase()} and your recent soil test.
                    </p>
                  </div>

                  <article className="recommendation-card nutrient">
                    <div className="recommendation-type">
                      <span>
                        <Leaf size={18} />
                      </span>
                      <div>
                        <small>NUTRITION RECOMMENDATION</small>
                        <h4>Balanced NPK 19:19:19</h4>
                      </div>
                      <b>92% match</b>
                    </div>
                    <p>
                      Supports vegetative growth and addresses the low nitrogen level in your soil
                      report.
                    </p>
                    <div className="dose-grid">
                      <span>
                        <small>DOSAGE</small>
                        <b>1.5–2 kg / acre</b>
                      </span>
                      <span>
                        <small>METHOD</small>
                        <b>Through drip</b>
                      </span>
                      <span>
                        <small>TIMING</small>
                        <b>Early morning</b>
                      </span>
                    </div>
                    <div className="safety-note">
                      <ShieldCheck size={16} /> Apply once, then observe new growth for 7 days. Do not
                      exceed label dosage.
                    </div>
                    <button type="button" onClick={() => router.push('/products?category=Fertilizers')}>
                      View suitable products <ArrowRight size={15} />
                    </button>
                  </article>

                  <article className="recommendation-card protection">
                    <div className="recommendation-type">
                      <span>
                        <Bug size={18} />
                      </span>
                      <div>
                        <small>CROP PROTECTION</small>
                        <h4>Inspect before pesticide use</h4>
                      </div>
                      <b>Action needed</b>
                    </div>
                    <p>
                      Yellowing alone does not confirm a pest. Check leaf undersides and stems for
                      whiteflies, aphids or mites.
                    </p>
                    <div className="diagnostic-steps">
                      <span>
                        <b>1</b> Inspect 20 plants
                      </span>
                      <span>
                        <b>2</b> Photograph affected leaves
                      </span>
                      <span>
                        <b>3</b> Ask an expert if insects appear
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActive('community')}
                    >
                      Ask a crop expert <ArrowRight size={15} />
                    </button>
                  </article>

                  <div className="weather-compatibility">
                    <CloudRain size={20} />
                    <div>
                      <b>Weather timing</b>
                      <p>
                        Apply nutrients Wednesday morning. Avoid Thursday due to expected heavy rain.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      )}
    </main>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="container" style={{ padding: '60px 0' }}>Loading farmer hub...</div>}>
      <SupportContent />
    </Suspense>
  );
}
