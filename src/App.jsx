import { useState, useEffect, useRef } from 'react'
import './index.css'

const API_KEY = import.meta.env.VITE_NEWS_API_KEY
const CATEGORIES = ['General', 'Technology', 'Business', 'Science', 'Health', 'Entertainment']
const PAGE_SIZE = 9

function SkeletonCard() {
  return (
    <div className="card skeleton">
      <div className="skeleton-img" />
      <div className="card-body">
        <div className="skeleton-line short" />
        <div className="skeleton-line" />
        <div className="skeleton-line" />
        <div className="skeleton-line mid" />
      </div>
    </div>
  )
}

function ArticleCard({ article, index }) {
  const [imgError, setImgError] = useState(false)
  const domain = article.url ? new URL(article.url).hostname.replace('www.', '') : ''
  const date = article.publishedAt
    ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(article.publishedAt))
    : ''

  return (
    <a
      className={`card ${index === 0 ? 'card--featured' : ''}`}
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {(article.urlToImage && !imgError) ? (
        <div className="card-img-wrap">
          <img
            className="card-img"
            src={article.urlToImage}
            alt={article.title}
            onError={() => setImgError(true)}
          />
        </div>
      ) : (
        <div className="card-img-wrap card-img-wrap--empty">
          <span className="card-img-placeholder">PULSE</span>
        </div>
      )}
      <div className="card-body">
        <div className="card-meta">
          <span className="card-source">{article.source?.name || domain}</span>
          <span className="card-date">{date}</span>
        </div>
        <h2 className="card-title">{article.title?.replace(/\s*-\s*[^-]+$/, '')}</h2>
        {index === 0 && article.description && (
          <p className="card-desc">{article.description}</p>
        )}
        <span className="card-read">Read</span>
      </div>
    </a>
  )
}

function App() {
  const [articles, setArticles] = useState([])
  const [category, setCategory] = useState('General')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const abortRef = useRef(null)

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const url = `https://newsapi.org/v2/top-headlines?category=${category.toLowerCase()}&language=en&pageSize=${PAGE_SIZE}&page=${page}&apiKey=${API_KEY}`

    async function fetchNews() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error(`Error ${res.status}`)
        const data = await res.json()
        if (data.status === 'error') throw new Error(data.message)
        setArticles(data.articles || [])
        setTotalResults(data.totalResults || 0)
      } catch (err) {
        if (err.name === 'AbortError') return
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
    return () => controller.abort()
  }, [category, page])

  const totalPages = Math.ceil(Math.min(totalResults, 100) / PAGE_SIZE)

  const handleCategory = (cat) => {
    setCategory(cat)
    setPage(1)
    setArticles([])
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div className="header-date">
            {new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
          </div>
          <div className="header-brand">PULSE</div>
          <div className="header-tag">Daily Intelligence</div>
        </div>
        <nav className="header-nav">
          <div className="header-nav-inner">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                className={`nav-btn ${category === cat ? 'active' : ''}`}
                onClick={() => handleCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="main">
        {error && (
          <div className="error-state">
            <div className="error-code">503</div>
            <p className="error-msg">{error}</p>
            <button className="retry-btn" onClick={() => setPage(p => p)}>Retry</button>
          </div>
        )}

        {!error && (
          <>
            <div className="results-bar">
              <span className="results-label">{category}</span>
              {!loading && <span className="results-count">{totalResults.toLocaleString()} stories</span>}
            </div>

            <div className="grid">
              {loading
                ? Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)
                : articles.map((article, i) => (
                    <ArticleCard key={article.url} article={article} index={i} />
                  ))
              }
            </div>

            {!loading && articles.length === 0 && (
              <div className="empty-state">
                <p>No stories found for this category.</p>
              </div>
            )}

            {!loading && totalPages > 1 && (
              <div className="pagination">
                <button
                  className="page-btn"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Prev
                </button>
                <span className="page-info">Page {page} of {totalPages}</span>
                <button
                  className="page-btn"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <span>Pulse</span>
      </footer>
    </div>
  )
}

export default App