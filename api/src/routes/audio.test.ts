import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../app'

describe('POST /api/audio/info', () => {
  it('extrai metadata de um vídeo válido', async () => {
    const res = await request(app)
      .post('/api/audio/info')
      .send({ url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({
      title: expect.any(String),
      duration: expect.any(Number),
      thumbnail: expect.any(String),
    })
  })

  it('retorna 400 com MISSING_URL sem body', async () => {
    const res = await request(app).post('/api/audio/info').send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('MISSING_URL')
  })

  it('retorna 400 com INVALID_URL para URL inválida', async () => {
    const res = await request(app)
      .post('/api/audio/info')
      .send({ url: 'https://google.com/watch?v=abc' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('INVALID_URL')
  })
})

describe('POST /api/audio/extract', () => {
  it('retorna trackingId e audioUrl para vídeo válido', async () => {
    const res = await request(app)
      .post('/api/audio/extract')
      .send({ url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' })

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toMatchObject({
      title: expect.any(String),
      duration: expect.any(Number),
      thumbnail: expect.any(String),
      audioUrl: expect.stringContaining('/api/audio/stream/'),
      trackingId: expect.any(String),
    })
  })

  it('retorna 400 com MISSING_URL sem body', async () => {
    const res = await request(app).post('/api/audio/extract').send({})

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('MISSING_URL')
  })

  it('retorna 400 com INVALID_URL para URL inválida', async () => {
    const res = await request(app)
      .post('/api/audio/extract')
      .send({ url: 'https://google.com/watch?v=abc' })

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('INVALID_URL')
  })

  it('usa trackingId fornecido quando disponível', async () => {
    const res = await request(app)
      .post('/api/audio/extract')
      .send({ url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw', trackingId: 'my-custom-id' })

    expect(res.status).toBe(200)
    expect(res.body.data.trackingId).toBe('my-custom-id')
    expect(res.body.data.audioUrl).toContain('my-custom-id')
  })
})

describe('GET /api/audio/stream/:trackingId', () => {
  it('retorna 404 para route sem trackingId', async () => {
    const res = await request(app).get('/api/audio/stream/').query({ url: 'https://www.youtube.com/watch?v=jNQXAC9IVRw' })

    expect(res.status).toBe(404)
  })

  it('retorna 400 com MISSING_URL sem query param url', async () => {
    const res = await request(app).get('/api/audio/stream/test-tracking-id')

    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.code).toBe('MISSING_URL')
  })
})