import { useEffect, useState } from 'react'
import { fetchJson } from '../api'
import { LoadMessage, PageControls } from '../components/shared'

export default function Item({ active }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!active) return undefined
    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setLoading(true)
      setError('')
      const params = new URLSearchParams({ page: String(page) })
      if (search.trim()) params.set('search', search.trim())
      try {
        const data = await fetchJson(`/items?${params}`, { signal: controller.signal })
        setItems(data.items || [])
        setPage(data.page || page)
        setTotalPages(data.totalPages || 1)
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          console.error(requestError)
          setError('โหลดข้อมูลไอเทมไม่สำเร็จ')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)
    return () => {
      window.clearTimeout(timeout)
      controller.abort()
    }
  }, [active, page, search])

  return (
    <main id="page-item" className={`page page-blank${active ? ' active' : ''}`}>
      <div className="container" style={{ paddingTop: 20 }}>
        <section className="panel">
          <h2>รายการไอเทม (Items)</h2>
          <label htmlFor="itemSearch" style={{ display: 'block', marginBottom: 6, color: 'var(--text-dim)', fontSize: 13 }}>ค้นหาไอเทม</label>
          <input id="itemSearch" className="items-search" type="search" autoComplete="off" placeholder="พิมพ์ชื่อไอเทม..."
            value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} />
          <div id="itemsGrid" className="items-table-wrap">
            <LoadMessage
              loading={loading}
              error={error}
              empty={!loading && !error && items.length === 0}
              emptyMessage="ไม่พบข้อมูลไอเทม"
              success={!loading && !error && items.length > 0}
              successMessage={`โหลดข้อมูลไอเทมสำเร็จ · แสดง ${items.length} รายการในหน้านี้`}
            />
            {!loading && !error && items.length > 0 && (
              <table className="items-table">
                <thead><tr><th scope="col">ชื่อ</th><th scope="col">หมวดหมู่</th><th scope="col">รายละเอียด</th></tr></thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id}>
                      <td><span className="item-name">{item.image && <img src={item.image} alt="" />}{item.name}</span></td>
                      <td className="item-category">{item.category}</td>
                      <td className="item-description">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {!loading && !error && <PageControls id="itemsPagination" page={page} totalPages={totalPages} onChange={setPage} />}
        </section>
      </div>
    </main>
  )
}
