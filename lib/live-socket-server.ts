import type { Server } from 'socket.io'
import { prisma } from '@/lib/db'
import { verifySessionToken, SESSION_COOKIE } from '@/lib/auth'

const ROOM = 'live-room'

function readSessionCookie(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === SESSION_COOKIE) return decodeURIComponent(rest.join('='))
  }
  return null
}

async function getPollState() {
  const poll = await prisma.poll.findFirst({
    where: { active: true },
    include: { options: { orderBy: { order: 'asc' }, include: { _count: { select: { votes: true } } } } },
  })
  if (!poll) return null
  const options = poll.options.map((o) => ({
    id: o.id,
    label: o.label,
    votes: o.seedCount + o._count.votes,
  }))
  const total = options.reduce((sum, o) => sum + o.votes, 0)
  return { id: poll.id, question: poll.question, options, total }
}

async function getQuestionList() {
  const questions = await prisma.question.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { upvotes: true } } },
  })
  return questions.map((q) => ({
    id: q.id,
    body: q.body,
    authorName: q.authorName,
    upvotes: q.seedUpvotes + q._count.upvotes,
  }))
}

export function attachLiveRoom(io: Server) {
  io.use((socket, next) => {
    const token = readSessionCookie(socket.handshake.headers.cookie)
    if (token) {
      const userId = verifySessionToken(token)
      if (userId) socket.data.userId = userId
    }
    next()
  })

  io.on('connection', async (socket) => {
    socket.join(ROOM)
    const sizeAfterJoin = io.sockets.adapter.rooms.get(ROOM)?.size ?? 1
    io.to(ROOM).emit('presence:count', sizeAfterJoin)

    const [messages, poll, questions] = await Promise.all([
      prisma.chatMessage.findMany({ orderBy: { createdAt: 'asc' }, take: 50 }),
      getPollState(),
      getQuestionList(),
    ])
    socket.emit('chat:history', messages)
    socket.emit('poll:update', poll)
    socket.emit('qa:list', questions)

    socket.on('disconnect', () => {
      const sizeAfterLeave = io.sockets.adapter.rooms.get(ROOM)?.size ?? 0
      io.to(ROOM).emit('presence:count', sizeAfterLeave)
    })

    socket.on('chat:send', async (body: string, ack?: (res: { ok?: true; error?: string }) => void) => {
      const userId = socket.data.userId as string | undefined
      if (!userId) return ack?.({ error: 'auth required' })
      const text = String(body || '').trim().slice(0, 500)
      if (!text) return ack?.({ error: 'empty message' })
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) return ack?.({ error: 'auth required' })
      const message = await prisma.chatMessage.create({
        data: { userId: user.id, authorName: user.name, body: text },
      })
      io.to(ROOM).emit('chat:new', message)
      ack?.({ ok: true })
    })

    socket.on('poll:vote', async (optionId: string, ack?: (res: { ok?: true; error?: string }) => void) => {
      const userId = socket.data.userId as string | undefined
      if (!userId) return ack?.({ error: 'auth required' })
      const option = await prisma.pollOption.findUnique({ where: { id: optionId } })
      if (!option) return ack?.({ error: 'option not found' })
      try {
        await prisma.pollVote.create({ data: { pollId: option.pollId, optionId, userId } })
      } catch {
        return ack?.({ error: 'already voted' })
      }
      io.to(ROOM).emit('poll:update', await getPollState())
      ack?.({ ok: true })
    })

    socket.on('qa:ask', async (body: string, ack?: (res: { ok?: true; error?: string }) => void) => {
      const userId = socket.data.userId as string | undefined
      if (!userId) return ack?.({ error: 'auth required' })
      const text = String(body || '').trim().slice(0, 300)
      if (!text) return ack?.({ error: 'empty question' })
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (!user) return ack?.({ error: 'auth required' })
      await prisma.question.create({ data: { userId: user.id, authorName: user.name, body: text } })
      io.to(ROOM).emit('qa:list', await getQuestionList())
      ack?.({ ok: true })
    })

    socket.on('qa:upvote', async (questionId: string, ack?: (res: { ok?: true; error?: string }) => void) => {
      const userId = socket.data.userId as string | undefined
      if (!userId) return ack?.({ error: 'auth required' })
      try {
        await prisma.questionUpvote.create({ data: { questionId, userId } })
      } catch {
        return ack?.({ error: 'already upvoted' })
      }
      io.to(ROOM).emit('qa:list', await getQuestionList())
      ack?.({ ok: true })
    })
  })
}
