'use client'

import { Navbar, Container } from 'react-bootstrap'

export default function Header() {
  return (
    <Navbar bg="primary" variant="dark" className="mb-3">
      <Container>
        <Navbar.Brand href="/" className="fw-bold">
          <i className="fas fa-dove me-2"></i>
          SkyMessage
        </Navbar.Brand>
        <Navbar.Text className="text-white-50">
          Chat with Catholic Saints
        </Navbar.Text>
      </Container>
    </Navbar>
  )
}

