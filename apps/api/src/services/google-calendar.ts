import { google, type calendar_v3 } from "googleapis"
import { DateTime, Interval } from "luxon"

const calendar = google.calendar("v3")

function getAuthClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  const privateKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

  if (!clientEmail || !privateKeyRaw) {
    throw new Error("Missing Google service account credentials")
  }

  // Limpar e formatar a chave privada corretamente
  let privateKey = privateKeyRaw

  // Se a chave está envolvida em aspas, remover
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
    privateKey = privateKey.slice(1, -1)
  }

  // Substituir \\n por quebras de linha reais
  privateKey = privateKey.replace(/\\n/g, "\n")

  // Garantir que tenha o formato correto
  if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
    privateKey = Buffer.from(privateKey, "base64").toString("utf8")
  }

  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  })

  return jwt
}

export function generateSlots(date: string, slotMinutes = 30): string[] {
  const slots: string[] = []
  const tz = process.env.TIMEZONE || "America/Sao_Paulo"
  const start = DateTime.fromISO(`${date}T09:00:00`, { zone: tz })
  const end = DateTime.fromISO(`${date}T18:00:00`, { zone: tz })
  for (let t = start; t < end; t = t.plus({ minutes: slotMinutes })) {
    const hh = String(t.hour).padStart(2, "0")
    const mm = String(t.minute).padStart(2, "0")
    slots.push(`${hh}:${mm}`)
  }
  return slots
}

export async function getAvailableEvents(date: string): Promise<
  Array<{
    start: string
    end: string
    meetLink?: string
    eventId?: string
    summary?: string
    startDate?: string
    startTime?: string
    endDate?: string
    endTime?: string
  }>
> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) throw new Error("Missing GOOGLE_CALENDAR_ID")

  const auth = getAuthClient()
  await auth.authorize()
  const tz = process.env.TIMEZONE || "America/Sao_Paulo"
  // build day bounds in target timezone and convert to ISO for Google
  const dayStart = DateTime.fromISO(`${date}T00:00:00`, { zone: tz }).toUTC()
  const dayEnd = DateTime.fromISO(`${date}T23:59:59.999`, { zone: tz }).toUTC()
  const timeMin = dayStart.toISO()
  const timeMax = dayEnd.toISO()

  // Buscar EVENTOS (não freebusy) para encontrar "Alinhamento Inicial"
  const cal: calendar_v3.Calendar = google.calendar({ version: "v3", auth })
  const resp: any = await (cal.events.list as any)({
    calendarId,
    timeMin,
    timeMax,
    q: "Consulta - Alinhamento Inicial", // Buscar apenas eventos com esse texto
    singleEvents: true,
    orderBy: "startTime",
  })

  console.log("📊 EVENTOS DISPONÍVEIS ENCONTRADOS:")
  console.log("🕐 TimeMin:", timeMin)
  console.log("🕑 TimeMax:", timeMax)
  console.log("📅 Calendar ID:", calendarId)
  console.log('🔍 Busca por: "Consulta - Alinhamento Inicial"')
  console.log("📡 Eventos encontrados:", resp.data?.items?.length || 0)

  const events = (resp.data?.items || []) as calendar_v3.Schema$Event[]
  const periods: Array<{
    start: string
    end: string
    meetLink?: string
    eventId?: string
    summary?: string
    startDate?: string
    startTime?: string
    endDate?: string
    endTime?: string
  }> = []

  events.forEach((event, i) => {
    const startRaw = event.start?.dateTime || event.start?.date
    const endRaw = event.end?.dateTime || event.end?.date
    if (startRaw && endRaw) {
      // extract meet link: prefer hangoutLink, then conferenceData entryPoints
      const hangout = event.hangoutLink
      const entryPoints = event.conferenceData?.entryPoints
      const videoEp = entryPoints?.find(
        (e) => e.entryPointType === "video" || e.entryPointType === "hangout"
      )
      const otherEp = entryPoints?.find((e) => e.entryPointType === "more")
      const meetLink = hangout || videoEp?.uri || otherEp?.uri || undefined

      console.log(
        `   ${i + 1}. ${event.summary} - ${startRaw} → ${endRaw} (${meetLink || "no meet"})`
      )
      // Normalize to ISO in target timezone and also expose local date/time
      const startDT = DateTime.fromISO(String(startRaw)).setZone(tz)
      const endDT = DateTime.fromISO(String(endRaw)).setZone(tz)
      periods.push({
        start: startDT.toISO() ?? startDT.toString(),
        end: endDT.toISO() ?? endDT.toString(),
        meetLink,
        eventId: event.id ?? undefined,
        summary: event.summary ?? undefined,
        startDate: startDT.toISODate() ?? undefined,
        startTime: startDT.toFormat("HH:mm"),
        endDate: endDT.toISODate() ?? undefined,
        endTime: endDT.toFormat("HH:mm"),
      })
    }
  })

  return periods
}

export function removeBusyFromSlots(
  date: string,
  slots: string[],
  busyRanges: { start: string; end: string }[],
  slotMinutes = 30
): string[] {
  if (!busyRanges.length) return slots
  const tz = process.env.TIMEZONE || "America/Sao_Paulo"

  // Convert busy ranges to luxon Intervals in target zone
  const busyIntervals = busyRanges.map((b) =>
    Interval.fromDateTimes(
      DateTime.fromISO(b.start, { zone: tz }),
      DateTime.fromISO(b.end, { zone: tz })
    )
  )

  // optional buffer in minutes to pad busy intervals (configurable)
  const buffer = Number(process.env.SLOT_BUFFER_MINUTES || "5")

  const slotIntervals = slots.map((t) => {
    const [hh, mm] = t.split(":").map(Number)
    const s = DateTime.fromISO(
      `${date}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`,
      { zone: tz }
    )
    const e = s.plus({ minutes: slotMinutes })
    return {
      label: t,
      interval: Interval.fromDateTimes(
        s.minus({ minutes: buffer }),
        e.plus({ minutes: buffer })
      ),
    }
  })

  const available = slotIntervals.filter(
    (slot) => !busyIntervals.some((busy) => slot.interval.overlaps(busy))
  )

  return available.map((s) => s.label)
}

export async function getAvailableSlotsFromCalendar(
  date: string
): Promise<string[]> {
  // Buscar eventos "Alinhamento Inicial" (horários disponíveis)
  const availableEvents = await getAvailableEvents(date)

  // Converter eventos em slots de horários
  const availableSlots: string[] = []

  availableEvents.forEach((event) => {
    // Prefer explicit startTime if available
    if (event.startTime) {
      availableSlots.push(event.startTime)
    } else {
      const tz = process.env.TIMEZONE || "America/Sao_Paulo"
      const dt = DateTime.fromISO(String(event.start)).setZone(tz)
      const hours = String(dt.hour).padStart(2, "0")
      const minutes = String(dt.minute).padStart(2, "0")
      availableSlots.push(`${hours}:${minutes}`)
    }
  })

  // Remover duplicatas e ordenar
  const uniqueSlots = [...new Set(availableSlots)].sort()

  console.log("✅ Slots disponíveis extraídos dos eventos:", uniqueSlots)
  return uniqueSlots
}

/**
 * Novo helper: retorna slots disponíveis junto com o meet link e eventId.
 * Mantém `getAvailableSlotsFromCalendar` para compatibilidade.
 */
export async function getAvailableSlotsWithMeetLinks(date: string): Promise<
  Array<{
    time: string
    endTime?: string
    meetLink?: string
    eventId?: string
    summary?: string
  }>
> {
  const availableEvents = await getAvailableEvents(date)
  const slots: Array<{
    time: string
    endTime?: string
    meetLink?: string
    eventId?: string
    summary?: string
  }> = []

  availableEvents.forEach((ev) => {
    const tz = process.env.TIMEZONE || "America/Sao_Paulo"
    // Appointment duration: prefer APPOINTMENT_MINUTES, default to 45 minutes.
    // Do NOT fall back to SLOT_MINUTES (that controls slot granularity)
    const appointmentMinutes = Number(process.env.APPOINTMENT_MINUTES || 45)

    // Determine start DateTime (prefer full ISO 'start' if present)
    const startDt = ev.start
      ? DateTime.fromISO(String(ev.start)).setZone(tz)
      : ev.startTime
        ? DateTime.fromISO(`${date}T${ev.startTime}`, { zone: tz })
        : null

    if (startDt) {
      const computedEnd = startDt.plus({ minutes: appointmentMinutes })
      const computedEndTime = computedEnd.toFormat("HH:mm")
      slots.push({
        time: ev.startTime || startDt.toFormat("HH:mm"),
        endTime: computedEndTime,
        meetLink: ev.meetLink,
        eventId: ev.eventId,
        summary: ev.summary,
      })
    } else {
      const tz = process.env.TIMEZONE || "America/Sao_Paulo"
      const dt = DateTime.fromISO(String(ev.start)).setZone(tz)
      const hours = String(dt.hour).padStart(2, "0")
      const minutes = String(dt.minute).padStart(2, "0")
      slots.push({
        time: `${hours}:${minutes}`,
        // For this branch we don't have ev.endTime available, leave undefined
        meetLink: ev.meetLink,
        eventId: ev.eventId,
        summary: ev.summary,
      })
    }
  })

  // remove duplicates by time, keep first occurrence (with meetLink)
  const uniq: {
    [time: string]: {
      time: string
      meetLink?: string
      eventId?: string
      summary?: string
    }
  } = {}
  slots.forEach((s) => {
    if (!uniq[s.time]) uniq[s.time] = s
  })

  return Object.values(uniq).sort((a, b) => a.time.localeCompare(b.time))
}

export async function getAvailableDatesWithSlots(
  startDate: string,
  days = 15
): Promise<{ [date: string]: string[] }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) throw new Error("Missing GOOGLE_CALENDAR_ID")

  const auth = getAuthClient()
  await auth.authorize()

  // Calcular intervalo de 'days' dias in configured TZ, convert to UTC for Google
  const tz = process.env.TIMEZONE || "America/Sao_Paulo"
  const startDT = DateTime.fromISO(startDate, { zone: tz }).startOf("day")
  const endDT = startDT.plus({ days }).endOf("day")
  const timeMin = startDT.toUTC().toISO()
  const timeMax = endDT.toUTC().toISO()

  console.log(
    `🔍 Buscando slots disponíveis "Consulta - Alinhamento Inicial" de ${timeMin} até ${timeMax}`
  )

  // Buscar eventos que representam slots disponíveis
  const cal: calendar_v3.Calendar = google.calendar({ version: "v3", auth })
  let resp: any = null
  try {
    resp = await (cal.events.list as any)({
      calendarId,
      timeMin,
      timeMax,
      q: "Consulta - Alinhamento Inicial",
      singleEvents: true,
      orderBy: "startTime",
    })
  } catch (err) {
    console.error("❌ Falha ao consultar Google Calendar events.list:", err)
    console.warn("⚠️ Usando fallback local de 7 dias por causa do erro no Google Calendar")
    // fallback local: populate next 7 days with common slots
    const dateSlots: { [date: string]: string[] } = {}
    for (let i = 1; i <= 7; i++) {
      const dt = DateTime.now().setZone(tz).plus({ days: i }).toISODate()
      if (dt) {
        dateSlots[dt] = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
      }
    }
    return dateSlots
  }

  console.log(
    `📡 Eventos de slots disponíveis encontrados: ${resp.data?.items?.length || 0}`
  )

  // Mapear slots disponíveis por data (baseado nos eventos)
  const dateSlots: { [date: string]: string[] } = {}
  const events = (resp.data?.items || []) as calendar_v3.Schema$Event[]

  events.forEach((event, i) => {
    const startDateTime = event.start?.dateTime || event.start?.date

    if (startDateTime) {
      // Parse using Luxon so we respect the configured timezone
      const tz = process.env.TIMEZONE || "America/Sao_Paulo"
      const startDate = DateTime.fromISO(String(startDateTime)).setZone(tz)
      const eventDate = startDate.toISODate()
      if (!eventDate) return
      const hours = String(startDate.hour).padStart(2, "0")
      const minutes = String(startDate.minute).padStart(2, "0")
      const slot = `${hours}:${minutes}`

      console.log(
        `   ${i + 1}. DATA: ${eventDate} - DISPONÍVEL: ${slot} - ${event.summary}`
      )

      if (!dateSlots[eventDate]) {
        dateSlots[eventDate] = []
      }
      dateSlots[eventDate].push(slot)
    }
  })

  // Remover duplicatas e ordenar slots para cada data
  Object.keys(dateSlots).forEach((date) => {
    dateSlots[date] = [...new Set(dateSlots[date])].sort()
    console.log(`📅 ${date}: ${dateSlots[date].join(", ")}`)
  })

  // Defensive fallback: if calendar returned no matching events, provide a
  // small set of mock slots for the next 7 days so the frontend still has data
  // to display (prevents blank UI when Google Calendar is reachable but has
  // no 'Consulta - Alinhamento Inicial' events).
  if (Object.keys(dateSlots).length === 0) {
    console.warn("⚠️ Nenhum evento de slot encontrado no Google Calendar — usando fallback local de 7 dias")
    for (let i = 1; i <= 7; i++) {
      const dt = DateTime.now().setZone(tz).plus({ days: i }).toISODate()
      if (dt) {
        dateSlots[dt] = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"]
      }
    }
  }

  return dateSlots
}

export async function createCalendarEvent(params: {
  date: string // YYYY-MM-DD
  time: string // HH:MM
  durationMinutes?: number
  summary: string
  description?: string
  attendees?: string[]
}): Promise<{ eventId: string; meetLink?: string }> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) throw new Error("Missing GOOGLE_CALENDAR_ID")

  const tz = process.env.TIMEZONE || "America/Sao_Paulo"
  // Default duration: prefer APPOINTMENT_MINUTES from env, fallback to 45
  const defaultDuration = Number(process.env.APPOINTMENT_MINUTES || 45)
  const duration = params.durationMinutes ?? defaultDuration

  const [hh, mm] = params.time.split(":").map(Number)
  const startDT = DateTime.fromISO(
    `${params.date}T${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
    { zone: tz }
  )
  const endDT = startDT.plus({ minutes: duration })

  const auth = getAuthClient()
  await auth.authorize()

  const response = await calendar.events.insert({
    auth,
    calendarId,
    conferenceDataVersion: 1,
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: { dateTime: startDT.toISO(), timeZone: tz },
      end: { dateTime: endDT.toISO(), timeZone: tz },
      attendees: (params.attendees || []).map((email) => ({ email })),
      conferenceData: { createRequest: { requestId: `meet-${Date.now()}` } },
    },
  })

  const eventId = String(response?.data?.id || "")
  let meetLink = String(
    response?.data?.hangoutLink ||
      response?.data?.conferenceData?.entryPoints?.find(
        (e) => e.entryPointType === "video"
      )?.uri ||
      ""
  )

  // Se não conseguimos o link do Meet, tentar buscar o evento novamente após um pequeno delay
  if (!meetLink && eventId) {
    console.log(`🔄 Tentando buscar link do Meet novamente para evento ${eventId}...`)
    await new Promise(resolve => setTimeout(resolve, 2000)) // Aguardar 2 segundos

    try {
      const eventResponse = await calendar.events.get({
        auth,
        calendarId,
        eventId,
      })

      meetLink = String(
        eventResponse?.data?.hangoutLink ||
          eventResponse?.data?.conferenceData?.entryPoints?.find(
            (e) => e.entryPointType === "video"
          )?.uri ||
          ""
      )

      console.log(`🔍 Tentativa de rebusca - meetLink:`, meetLink)
    } catch (error) {
      console.error(`❌ Erro ao buscar evento novamente:`, error)
    }
  }

  console.log(`🔍 Debug createCalendarEvent:`, {
    eventId,
    meetLink,
    hangoutLink: response?.data?.hangoutLink,
    conferenceData: response?.data?.conferenceData,
    entryPoints: response?.data?.conferenceData?.entryPoints,
    hasHangoutLink: !!response?.data?.hangoutLink,
    hasConferenceData: !!response?.data?.conferenceData,
    hasEntryPoints: !!response?.data?.conferenceData?.entryPoints
  });

  return { eventId, meetLink }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!calendarId) throw new Error("Missing GOOGLE_CALENDAR_ID")
  const auth = getAuthClient()
  await auth.authorize()
  await calendar.events.delete({
    auth,
    calendarId,
    eventId,
    sendUpdates: "all",
  })
}
