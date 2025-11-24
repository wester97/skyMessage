'use client'

import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Form, InputGroup, Modal, Badge, Alert } from 'react-bootstrap'

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_FUNCTIONS_URL || 'https://us-central1-st-ann-ai.cloudfunctions.net'

interface ScrapeUrl {
  url: string
  publisher: string
}

interface Saint {
  id?: number
  slug: string
  display_name: string
  aliases?: string[] | null
  era?: string | null
  feast_day?: string | null
  patronages?: string[] | null
  birth_date?: string | null
  death_date?: string | null
  birth_place?: string | null
  image_url?: string | null
  scrape_urls?: ScrapeUrl[] | null
  created_at?: string
  updated_at?: string
}

export default function SaintsAdmin() {
  const [saints, setSaints] = useState<Saint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSaint, setEditingSaint] = useState<Saint | null>(null)
  const [formData, setFormData] = useState<Partial<Saint>>({
    slug: '',
    display_name: '',
    aliases: [],
    era: '',
    feast_day: '',
    patronages: [],
    birth_date: '',
    death_date: '',
    birth_place: '',
    image_url: '',
    scrape_urls: [],
  })
  const [newUrl, setNewUrl] = useState({ url: '', publisher: 'New Advent' })
  const [aliasesInput, setAliasesInput] = useState('')
  const [patronagesInput, setPatronagesInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    fetchSaints()
  }, [])

  const fetchSaints = async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (searchTerm) params.set('search', searchTerm)
      params.set('limit', '100')

      const response = await fetch(`${FUNCTIONS_URL}/api/saints?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setSaints(data.data || [])
      } else {
        setError(data.error || 'Failed to fetch saints')
      }
    } catch (err: any) {
      setError(err.message || 'Error fetching saints')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchSaints()
  }

  const handleOpenModal = (saint?: Saint) => {
    if (saint) {
      setEditingSaint(saint)
      setFormData({
        slug: saint.slug,
        display_name: saint.display_name,
        aliases: saint.aliases || [],
        era: saint.era || '',
        feast_day: saint.feast_day || '',
        patronages: saint.patronages || [],
        birth_date: saint.birth_date || '',
        death_date: saint.death_date || '',
        birth_place: saint.birth_place || '',
        image_url: saint.image_url || '',
        scrape_urls: saint.scrape_urls || [],
      })
      setAliasesInput((saint.aliases || []).join(', '))
      setPatronagesInput((saint.patronages || []).join(', '))
    } else {
      setEditingSaint(null)
      setFormData({
        slug: '',
        display_name: '',
        aliases: [],
        era: '',
        feast_day: '',
        patronages: [],
        birth_date: '',
        death_date: '',
        birth_place: '',
        image_url: '',
        scrape_urls: [],
      })
      setAliasesInput('')
      setPatronagesInput('')
    }
    setShowModal(true)
    setError(null)
    setSuccess(null)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingSaint(null)
    setError(null)
    setSuccess(null)
  }

  const handleSave = async () => {
    try {
      setError(null)
      setSuccess(null)

      // Parse aliases and patronages
      const aliases = aliasesInput.split(',').map(a => a.trim()).filter(a => a)
      const patronages = patronagesInput.split(',').map(p => p.trim()).filter(p => p)

      const payload = {
        ...formData,
        aliases,
        patronages,
      }

      const url = editingSaint
        ? `${FUNCTIONS_URL}/api/saints/${editingSaint.slug}`
        : `${FUNCTIONS_URL}/api/saints`
      const method = editingSaint ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(editingSaint ? 'Saint updated successfully' : 'Saint created successfully')
        await fetchSaints()
        setTimeout(() => {
          handleCloseModal()
        }, 1000)
      } else {
        setError(data.error || 'Failed to save saint')
      }
    } catch (err: any) {
      setError(err.message || 'Error saving saint')
    }
  }

  const handleDelete = async (saint: Saint) => {
    if (!confirm(`Are you sure you want to delete ${saint.display_name}?`)) {
      return
    }

    try {
      setError(null)
      const response = await fetch(`${FUNCTIONS_URL}/api/saints/${saint.slug}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        setSuccess('Saint deleted successfully')
        await fetchSaints()
      } else {
        setError(data.error || 'Failed to delete saint')
      }
    } catch (err: any) {
      setError(err.message || 'Error deleting saint')
    }
  }

  const handleAddUrl = () => {
    if (!newUrl.url.trim()) return

    const currentUrls = formData.scrape_urls || []
    setFormData({
      ...formData,
      scrape_urls: [...currentUrls, { url: newUrl.url, publisher: newUrl.publisher }],
    })
    setNewUrl({ url: '', publisher: 'New Advent' })
  }

  const handleRemoveUrl = (index: number) => {
    const currentUrls = formData.scrape_urls || []
    setFormData({
      ...formData,
      scrape_urls: currentUrls.filter((_, i) => i !== index),
    })
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2>Saints Management</h2>
            <Button variant="primary" onClick={() => handleOpenModal()}>
              <i className="fas fa-plus me-2"></i>
              Add Saint
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Row className="mb-3">
        <Col md={6}>
          <InputGroup>
            <Form.Control
              type="text"
              placeholder="Search saints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button variant="outline-secondary" onClick={handleSearch}>
              <i className="fas fa-search"></i>
            </Button>
          </InputGroup>
        </Col>
        <Col md={6} className="text-end">
          <Button variant="outline-secondary" onClick={fetchSaints}>
            <i className="fas fa-sync me-2"></i>
            Refresh
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <Row>
          {saints.map((saint) => (
            <Col key={saint.slug} md={6} lg={4} className="mb-4">
              <Card>
                {saint.image_url && (
                  <Card.Img
                    variant="top"
                    src={saint.image_url}
                    style={{ height: '200px', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <Card.Body>
                  <Card.Title>{saint.display_name}</Card.Title>
                  <Card.Text>
                    {saint.feast_day && (
                      <small className="text-muted d-block">Feast: {saint.feast_day}</small>
                    )}
                    {saint.era && <small className="text-muted d-block">Era: {saint.era}</small>}
                    {saint.scrape_urls && saint.scrape_urls.length > 0 && (
                      <Badge bg="secondary" className="mt-2">
                        {saint.scrape_urls.length} URL{saint.scrape_urls.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </Card.Text>
                  <div className="d-flex gap-2">
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={() => handleOpenModal(saint)}
                    >
                      <i className="fas fa-pencil me-1"></i>
                      Edit
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(saint)}
                    >
                      <i className="fas fa-trash me-1"></i>
                      Delete
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {saints.length === 0 && !loading && (
        <div className="text-center py-5">
          <p className="text-muted">No saints found</p>
        </div>
      )}

      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editingSaint ? 'Edit Saint' : 'Add New Saint'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          )}

          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Slug *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.slug || ''}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    disabled={!!editingSaint}
                    placeholder="e.g., francis-of-assisi"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Display Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.display_name || ''}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    placeholder="e.g., St. Francis of Assisi"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Feast Day</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.feast_day || ''}
                    onChange={(e) => setFormData({ ...formData, feast_day: e.target.value })}
                    placeholder="e.g., October 4"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Era</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.era || ''}
                    onChange={(e) => setFormData({ ...formData, era: e.target.value })}
                    placeholder="e.g., 1181-1226"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Birth Date</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.birth_date || ''}
                    onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                    placeholder="e.g., 1181"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Death Date</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.death_date || ''}
                    onChange={(e) => setFormData({ ...formData, death_date: e.target.value })}
                    placeholder="e.g., 1226"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Birth Place</Form.Label>
              <Form.Control
                type="text"
                value={formData.birth_place || ''}
                onChange={(e) => setFormData({ ...formData, birth_place: e.target.value })}
                placeholder="e.g., Assisi, Italy"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control
                type="url"
                value={formData.image_url || ''}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Aliases (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                value={aliasesInput}
                onChange={(e) => setAliasesInput(e.target.value)}
                placeholder="e.g., Francis, St. Francis"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Patronages (comma-separated)</Form.Label>
              <Form.Control
                type="text"
                value={patronagesInput}
                onChange={(e) => setPatronagesInput(e.target.value)}
                placeholder="e.g., Animals, Ecology, Peace"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Scrape URLs</Form.Label>
              <div className="mb-2">
                {formData.scrape_urls?.map((url, index) => (
                  <div key={index} className="d-flex align-items-center mb-2 p-2 bg-light rounded">
                    <div className="flex-grow-1">
                      <small className="d-block text-muted">{url.publisher}</small>
                      <small className="d-block">{url.url}</small>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveUrl(index)}
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  </div>
                ))}
              </div>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="URL"
                  value={newUrl.url}
                  onChange={(e) => setNewUrl({ ...newUrl, url: e.target.value })}
                />
                <Form.Control
                  type="text"
                  placeholder="Publisher"
                  value={newUrl.publisher}
                  onChange={(e) => setNewUrl({ ...newUrl, publisher: e.target.value })}
                  style={{ maxWidth: '150px' }}
                />
                <Button variant="outline-secondary" onClick={handleAddUrl}>
                  <i className="fas fa-link me-1"></i>
                  Add
                </Button>
              </InputGroup>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            <i className="fas fa-save me-2"></i>
            {editingSaint ? 'Update' : 'Create'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

