import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronLeft,
  Clock3,
  Edit3,
  FileText,
  Feather,
  Heart,
  LogOut,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type Post = {
  id: string;
  user_id: string;
  title: string;
  excerpt: string;
  body: string;
  topic: string;
  read_time: number;
  cover_color: string;
  published: boolean;
  created_at: string;
  updated_at: string;
};

type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type View = 'home' | 'library' | 'write' | 'post';

const coverStyles: Record<string, string> = {
  sky: 'from-[#dff5ff] via-[#b9e7f6] to-[#6bc6dc]',
  peach: 'from-[#fff0dc] via-[#f8c991] to-[#e49c65]',
  mint: 'from-[#e3f6e9] via-[#b4e2bf] to-[#6fbd91]',
  night: 'from-[#d9e1f2] via-[#9dabc8] to-[#596987]',
};

const demoPosts: Post[] = [
  { id: 'demo-1', user_id: 'demo', title: 'A softer way to pay attention', excerpt: 'On noticing the small rituals that make an ordinary Tuesday feel like a life.', body: 'The best ideas rarely arrive with a drumroll. They gather at the edge of the day: in a note left open, a walk taken without a destination, a question asked twice.\n\nAttention is not a productivity trick. It is a way of saying that this moment counts.', topic: 'Perspective', read_time: 4, cover_color: 'sky', published: true, created_at: '2026-08-12T10:00:00Z', updated_at: '2026-08-12T10:00:00Z' },
  { id: 'demo-2', user_id: 'demo', title: 'The quiet architecture of a good week', excerpt: 'A few generous boundaries can make room for the work that actually matters.', body: 'A good week is not packed. It has shape. There is enough structure to keep us from drifting and enough white space to surprise us.', topic: 'Practice', read_time: 6, cover_color: 'peach', published: true, created_at: '2026-08-09T10:00:00Z', updated_at: '2026-08-09T10:00:00Z' },
  { id: 'demo-3', user_id: 'demo', title: 'Notes from the edge of the map', excerpt: 'What traveling alone taught me about being a beginner again.', body: 'The first thing you lose when you travel alone is the illusion that you know exactly what comes next.', topic: 'Field notes', read_time: 5, cover_color: 'mint', published: true, created_at: '2026-08-04T10:00:00Z', updated_at: '2026-08-04T10:00:00Z' },
];

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<View>('home');
  const [posts, setPosts] = useState<Post[]>(demoPosts);
  const [selectedPost, setSelectedPost] = useState<Post | null>(demoPosts[0]);
  const [authOpen, setAuthOpen] = useState(false);
  const [editorPost, setEditorPost] = useState<Post | null>(null);
  const [search, setSearch] = useState('');
  const [topic, setTopic] = useState('All stories');
  const [toast, setToast] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    void loadPosts();
  }, [session]);

  async function loadPosts() {
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (!error && data && data.length > 0) setPosts(data as Post[]);
  }

  function openPost(post: Post) {
    setSelectedPost(post);
    setView('post');
  }

  function requestAuth() {
    setAuthOpen(true);
  }

  function startWriting() {
    if (!session) {
      requestAuth();
      return;
    }
    setEditorPost(null);
    setView('write');
  }

  async function signOut() {
    await supabase.auth.signOut();
    setView('home');
    setToast('You are signed out.');
    window.setTimeout(() => setToast(''), 2800);
  }

  const topics = useMemo(() => ['All stories', ...Array.from(new Set(posts.map((post) => post.topic)))], [posts]);
  const filteredPosts = useMemo(() => posts.filter((post) => {
    const matchesTopic = topic === 'All stories' || post.topic === topic;
    const query = search.toLowerCase();
    return matchesTopic && (!query || `${post.title} ${post.excerpt} ${post.topic}`.toLowerCase().includes(query));
  }), [posts, search, topic]);

  if (authLoading) return <div className="loading-screen"><Feather size={28} /><span>Opening Fieldnote</span></div>;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => setView('home')} aria-label="Go home"><span className="brand-mark"><Feather size={18} /></span><span>fieldnote</span></button>
        <nav className="main-nav">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}>Explore</button>
          <button className={view === 'library' ? 'active' : ''} onClick={() => session ? setView('library') : requestAuth()}>My library</button>
        </nav>
        <div className="top-actions">
          <button className="search-button" onClick={() => document.getElementById('story-search')?.focus()} aria-label="Search"><Search size={18} /></button>
          {session ? <><button className="write-button" onClick={startWriting}><Plus size={17} /> Write</button><button className="avatar" onClick={() => setView('library')} aria-label="Open profile">{getInitial(session.user)}</button></> : <button className="sign-in-link" onClick={requestAuth}>Sign in</button>}
        </div>
      </header>

      {view === 'home' && <main>
        <section className="hero-section page-width">
          <div className="hero-copy"><div className="eyebrow"><Sparkles size={14} /> Ideas worth keeping</div><h1>Make space for<br /><em>better thoughts.</em></h1><p>Fieldnote is a calm corner of the internet for curious people to share what they are learning, noticing, and making.</p><button className="primary-button" onClick={startWriting}>Start writing <ArrowRight size={17} /></button></div>
          <div className="hero-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="paper-card"><span className="paper-kicker">FIELD NOTE 042</span><div className="paper-line wide" /><div className="paper-line" /><div className="paper-line short" /><div className="paper-stamp">keep<br />looking</div></div><div className="art-caption"><span className="dot" /> A place to pause, reflect, and begin again.</div></div>
        </section>
        <section className="stories-section page-width"><div className="section-heading"><div><span className="eyebrow">The latest notes</span><h2>Stories for your in-between moments.</h2></div><div className="search-field"><Search size={17} /><input id="story-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search stories" /></div></div><div className="topic-row">{topics.map((item) => <button key={item} className={topic === item ? 'topic active' : 'topic'} onClick={() => setTopic(item)}>{item}</button>)}</div><div className="post-grid">{filteredPosts.map((post) => <PostCard key={post.id} post={post} onOpen={openPost} />)}</div>{filteredPosts.length === 0 && <div className="empty-state"><BookOpen size={25} /><h3>No stories found</h3><p>Try a different phrase or explore another topic.</p></div>}</section>
        <section className="manifesto page-width"><div className="manifesto-mark"><Feather size={24} /></div><div><span className="eyebrow">Why Fieldnote?</span><h2>Not a feed. A collection of <em>signals.</em></h2></div><p>We believe the internet can feel more like a thoughtful notebook than a noisy room. Follow ideas, not algorithms.</p></section>
      </main>}

      {view === 'library' && session && <Library posts={posts.filter((post) => post.user_id === session.user.id)} user={session.user} onNew={startWriting} onEdit={(post) => { setEditorPost(post); setView('write'); }} onOpen={openPost} onDelete={async (post) => { await supabase.from('posts').delete().eq('id', post.id); await loadPosts(); setToast('Story moved to the archive.'); }} />}
      {view === 'write' && session && <Editor post={editorPost} user={session.user} onCancel={() => setView('library')} onSaved={async (post) => { await loadPosts(); setSelectedPost(post); setView('post'); setToast(post.published ? 'Your story is live.' : 'Draft saved for later.'); }} />}
      {view === 'post' && selectedPost && <Article post={selectedPost} session={session} onBack={() => setView('home')} onSignIn={requestAuth} />}

      <footer className="footer page-width"><div className="brand"><span className="brand-mark"><Feather size={16} /></span><span>fieldnote</span></div><span>Made for the quietly curious.</span><span>© 2026</span></footer>
      {toast && <div className="toast"><Check size={17} /> {toast}</div>}
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onSuccess={() => setAuthOpen(false)} />}
    </div>
  );
}

function PostCard({ post, onOpen }: { post: Post; onOpen: (post: Post) => void }) {
  return <article className="post-card" onClick={() => onOpen(post)}><div className={`card-art ${coverStyles[post.cover_color] || coverStyles.sky}`}><span className="card-topic">{post.topic}</span><span className="card-number">{post.id.slice(-2).toUpperCase()}</span><div className="card-scribble">{post.cover_color === 'peach' ? 'observe' : post.cover_color === 'mint' ? 'wander' : 'consider'}</div></div><div className="card-content"><div className="meta"><span>{formatDate(post.created_at)}</span><span className="meta-separator">·</span><span><Clock3 size={13} /> {post.read_time} min read</span></div><h3>{post.title}</h3><p>{post.excerpt}</p><button className="read-more">Read note <ArrowRight size={15} /></button></div></article>;
}

function Library({ posts, user, onNew, onEdit, onOpen, onDelete }: { posts: Post[]; user: User; onNew: () => void; onEdit: (post: Post) => void; onOpen: (post: Post) => void; onDelete: (post: Post) => void }) {
  return <main className="library page-width"><div className="library-head"><div><span className="eyebrow">Your desk</span><h1>Welcome back, {user.email?.split('@')[0]}.</h1><p>A little room for the ideas still becoming.</p></div><button className="primary-button" onClick={onNew}><Plus size={17} /> New story</button></div><div className="stats-row"><div><strong>{posts.length}</strong><span>Total stories</span></div><div><strong>{posts.filter((post) => post.published).length}</strong><span>Published</span></div><div><strong>{posts.filter((post) => !post.published).length}</strong><span>In progress</span></div></div><div className="library-list"><div className="list-title"><h2>All your notes</h2><span>{posts.length} stories</span></div>{posts.length === 0 ? <div className="empty-state"><FileText size={25} /><h3>Your desk is empty</h3><p>Put down the first sentence. The rest can follow.</p><button className="secondary-button" onClick={onNew}>Write a story</button></div> : posts.map((post) => <div className="library-item" key={post.id}><div className={`mini-art ${coverStyles[post.cover_color] || coverStyles.sky}`} /><div className="library-item-copy"><div className="meta"><span>{post.published ? 'Published' : 'Draft'}</span><span className={post.published ? 'status live' : 'status'}>{post.published ? 'Live' : 'Private'}</span></div><h3>{post.title}</h3><p>{post.excerpt || 'No excerpt yet.'}</p></div><div className="item-actions"><button onClick={() => onOpen(post)} aria-label="Open story"><ArrowRight size={17} /></button><button onClick={() => onEdit(post)} aria-label="Edit story"><Edit3 size={17} /></button><button onClick={() => onDelete(post)} aria-label="Delete story"><Trash2 size={17} /></button></div></div>)}</div></main>;
}

function Editor({ post, user, onCancel, onSaved }: { post: Post | null; user: User; onCancel: () => void; onSaved: (post: Post) => void }) {
  const [title, setTitle] = useState(post?.title || '');
  const [excerpt, setExcerpt] = useState(post?.excerpt || '');
  const [body, setBody] = useState(post?.body || '');
  const [topic, setTopic] = useState(post?.topic || 'Perspective');
  const [readTime, setReadTime] = useState(String(post?.read_time || 5));
  const [coverColor, setCoverColor] = useState(post?.cover_color || 'sky');
  const [published, setPublished] = useState(post?.published || false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !body.trim()) { setError('Add a title and a few words before saving.'); return; }
    setSaving(true); setError('');
    const payload = { title: title.trim(), excerpt: excerpt.trim(), body: body.trim(), topic, read_time: Number(readTime), cover_color: coverColor, published, user_id: user.id };
    const result = post ? await supabase.from('posts').update(payload).eq('id', post.id).select().maybeSingle() : await supabase.from('posts').insert(payload).select().maybeSingle();
    if (result.error || !result.data) { setError('We could not save this story. Please try again.'); setSaving(false); return; }
    onSaved(result.data as Post);
  }

  return <main className="editor page-width"><div className="editor-top"><button className="back-link" onClick={onCancel}><ChevronLeft size={17} /> Back to desk</button><div className="editor-actions"><span className="save-label">{saving ? 'Saving…' : published ? 'Ready to publish' : 'Private draft'}</span><button className="secondary-button" onClick={() => setPublished(false)}>Save draft</button><button className="primary-button" onClick={() => setPublished(true)} disabled={saving}>{post?.published ? 'Update story' : 'Publish story'}</button></div></div><form onSubmit={save} className="editor-layout"><div className="editor-main"><input className="title-input" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Give your story a title" maxLength={140} /><textarea className="excerpt-input" value={excerpt} onChange={(event) => setExcerpt(event.target.value)} placeholder="A short introduction for the story card…" maxLength={280} /><div className="body-toolbar"><span>Write freely</span><span>{body.length} characters</span></div><textarea className="body-input" value={body} onChange={(event) => setBody(event.target.value)} placeholder="Start with the sentence you keep returning to…" /></div><aside className="editor-sidebar"><div className="side-panel"><span className="panel-label">Story details</span><label>Topic<select value={topic} onChange={(event) => setTopic(event.target.value)}><option>Perspective</option><option>Practice</option><option>Field notes</option><option>Culture</option><option>Work & life</option></select></label><label>Reading time<select value={readTime} onChange={(event) => setReadTime(event.target.value)}><option value="3">3 min</option><option value="5">5 min</option><option value="8">8 min</option><option value="12">12 min</option></select></label></div><div className="side-panel"><span className="panel-label">Cover mood</span><div className="color-picker">{Object.keys(coverStyles).map((color) => <button type="button" key={color} className={`color-option ${coverStyles[color]} ${coverColor === color ? 'selected' : ''}`} onClick={() => setCoverColor(color)} aria-label={`Choose ${color} cover`} />)}</div><div className={`cover-preview card-art ${coverStyles[coverColor]}`}><span className="card-topic">{topic}</span><div className="card-scribble">{title || 'your story'}</div></div></div>{error && <p className="form-error">{error}</p>}</aside></form></main>;
}

function Article({ post, session, onBack, onSignIn }: { post: Post; session: Session | null; onBack: () => void; onSignIn: () => void }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);
  useEffect(() => { if (post.id.startsWith('demo-')) { setLoadingComments(false); return; } supabase.from('comments').select('*').eq('post_id', post.id).order('created_at', { ascending: true }).then(({ data }) => { setComments((data || []) as Comment[]); setLoadingComments(false); }); }, [post.id]);
  async function addComment(event: FormEvent) { event.preventDefault(); if (!session) { onSignIn(); return; } if (!comment.trim()) return; const { data } = await supabase.from('comments').insert({ post_id: post.id, body: comment.trim() }).select().maybeSingle(); if (data) { setComments((current) => [...current, data as Comment]); setComment(''); } }
  return <main className="article-page"><div className="article-wrap"><button className="back-link" onClick={onBack}><ChevronLeft size={17} /> All stories</button><div className={`article-art card-art ${coverStyles[post.cover_color] || coverStyles.sky}`}><span className="card-topic">{post.topic}</span><span className="card-number">FIELDNOTE</span><div className="card-scribble">{post.cover_color === 'peach' ? 'observe' : post.cover_color === 'mint' ? 'wander' : 'consider'}</div></div><div className="article-heading"><div className="meta"><span>{formatDate(post.created_at)}</span><span className="meta-separator">·</span><span><Clock3 size={13} /> {post.read_time} min read</span></div><h1>{post.title}</h1><p>{post.excerpt}</p></div><div className="article-body">{post.body.split('\n').filter(Boolean).map((paragraph, index) => <p key={`${post.id}-${index}`}>{paragraph}</p>)}</div><div className="article-footer"><span><Heart size={17} /> Save for later</span><span><MessageCircle size={17} /> {comments.length} responses</span></div><section className="comments"><div className="comments-heading"><div><span className="eyebrow">The conversation</span><h2>Responses</h2></div><span>{comments.length}</span></div>{loadingComments ? <p className="muted">Loading responses…</p> : comments.length === 0 ? <p className="muted">Be the first to leave a thoughtful response.</p> : comments.map((item) => <div className="comment" key={item.id}><div className="comment-avatar">{item.user_id.slice(0, 2).toUpperCase()}</div><div><div className="comment-meta">Reader · {formatDate(item.created_at)}</div><p>{item.body}</p></div></div>)}<form className="comment-form" onSubmit={addComment}><div className="comment-avatar"><UserRound size={16} /></div><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder={session ? 'Add to the conversation…' : 'Sign in to leave a response'} onFocus={() => !session && onSignIn()} /><button type="submit" aria-label="Send response"><Send size={17} /></button></form></section></div></main>;
}

function AuthModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) { event.preventDefault(); setLoading(true); setError(''); const result = mode === 'signin' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password }); if (result.error) setError(result.error.message); else onSuccess(); setLoading(false); }
  return <div className="modal-backdrop" onClick={onClose}><div className="auth-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="Close"><X size={19} /></button><div className="auth-icon"><Feather size={22} /></div><span className="eyebrow">A quieter internet</span><h2>{mode === 'signin' ? 'Welcome back.' : 'Make a little room.'}</h2><p>{mode === 'signin' ? 'Sign in to write, save, and join the conversation.' : 'Create your free Fieldnote account and start collecting ideas.'}</p><form onSubmit={submit}><label>Email address<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label><label>Password<input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>{error && <p className="form-error">{error}</p>}<button className="primary-button full-width" disabled={loading}>{loading ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight size={17} /></button></form><button className="switch-auth" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}>{mode === 'signin' ? 'New here? Create an account' : 'Already have an account? Sign in'}</button></div></div>;
}

function getInitial(user: User) { return (user.email?.[0] || 'F').toUpperCase(); }
function formatDate(value: string) { return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value)); }

export default App;
