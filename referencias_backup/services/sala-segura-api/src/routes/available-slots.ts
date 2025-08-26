// Cleaned available-slots.ts - timezone-aware, uses google-calendar helpers
const express = require("express")
import { DateTime } from "luxon"
import { z } from "zod"
import { supabase } from "../config/supabase"
import {
  getAvailableSlotsWithMeetLinks,
  getAvailableDatesWithSlots,
} from "../services/google-calendar"
// Make this file a module for TypeScript
export {}

const router = express.Router()

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

// Nova rota para buscar datas disponíveis nos próximos 15 dias
router.get("/dates", async (_req, res) => {
  try {
    const tz = process.env.TIMEZONE || "America/Sao_Paulo"
    const today = DateTime.now().setZone(tz).toISODate() // YYYY-MM-DD in TZ

    console.log("🔍 Buscando datas disponíveis nos próximos 15 dias...")

    // Buscar todas as datas com eventos nos próximos 15 dias
    const datesWithSlots = await getAvailableDatesWithSlots(today, 15)

    // Para cada data, verificar agendamentos no Supabase e remover slots ocupados
    const availableDates: { [date: string]: string[] } = {}

    for (const [date, slots] of Object.entries(datesWithSlots)) {
      const { data: ags, error } = await supabase
        .from("agendamentos")
        .select("horario, status")
        .eq("data", date)
        .in("status", ["PENDING", "CONFIRMED"])

      if (error) {
        console.error(`Erro ao buscar agendamentos para ${date}:`, error)
        continue
      }

      // Remover slots ocupados
      // Normalize DB horarios (which might contain seconds) to HH:MM in TZ
      const busySet = new Set<string>()
      ;(ags || []).forEach((a: { horario: string }) => {
        // a.horario can be a time string; normalize to HH:MM
        const hhmm = String(a.horario).slice(0, 5)
        busySet.add(hhmm)
      })

      const availableSlots = slots.filter((slot) => !busySet.has(slot))

      // Só incluir datas que têm pelo menos 1 slot disponível
      if (availableSlots.length > 0) {
        availableDates[date] = availableSlots
      }
    }

    console.log(
      "✅ Datas disponíveis encontradas:",
      Object.keys(availableDates).length
    )

    const tzForPeriod = process.env.TIMEZONE || "America/Sao_Paulo"
    const periodEnd = DateTime.fromISO(today, { zone: tzForPeriod })
      .plus({ days: 15 })
      .toISODate()
    return res.json({ period: `${today} - ${periodEnd}`, availableDates })
  } catch (err) {
    console.error("Erro ao buscar datas disponíveis:", err)
    return res.status(500).json({ error: "Erro interno" })
  }
})

router.get("/", async (req, res) => {
  try {
    const parsed = querySchema.safeParse(req.query)
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Parâmetros inválidos. Use ?date=YYYY-MM-DD" })
    }
    const { date } = parsed.data

    let baseSlots: string[] = []
    let baseSlotsDetailed: Array<{
      time: string
      meetLink?: string
      eventId?: string
      summary?: string
    }> = []

    try {
      console.log("🔍 Conectando ao Google Calendar...")
      console.log(
        "📧 Email:",
        process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? "OK" : "MISSING"
      )
      console.log(
        "🔑 Key:",
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? "OK" : "MISSING"
      )
      console.log(
        "📅 Calendar ID:",
        process.env.GOOGLE_CALENDAR_ID ? "OK" : "MISSING"
      )

      // Try to get detailed slots (with meet links) first
      const detailed = await getAvailableSlotsWithMeetLinks(date)
      baseSlotsDetailed = detailed
      baseSlots = detailed.map((d) => d.time)
      console.log(
        "✅ Google Calendar funcionando! Slots obtidos:",
        baseSlots.length
      )
    } catch (error) {
      console.error("❌ Erro Google Calendar:", error.message)
      console.error("🔧 Stack:", error.stack)

      // Fallback com horários de trabalho (sem meet links)
      baseSlots = [
        "09:00",
        "09:30",
        "10:30",
        "11:00",
        "11:30",
        "14:00",
        "14:30",
        "15:00",
        "15:30",
        "16:00",
        "16:30",
      ]
      baseSlotsDetailed = baseSlots.map((t) => ({ time: t }))
      console.log("🔄 Usando fallback:", baseSlots.length, "slots")
    }

    const { data: ags, error } = await supabase
      .from("agendamentos")
      .select("horario, status")
      .eq("data", date)
      .in("status", ["PENDING", "CONFIRMED"])

    if (error) {
      console.error("Erro ao buscar agendamentos:", error)
      return res.status(500).json({ error: "Erro ao buscar agendamentos" })
    }

    // Use removeBusyFromSlots logic which applies buffer & overlaps
    const busyRanges = (ags || []).map((a: { horario: string }) => {
      // Build a full ISO datetime in TZ for start and end using the date and horario
      const tz = process.env.TIMEZONE || "America/Sao_Paulo"
      const hhmm = String(a.horario).slice(0, 5)
      const start = DateTime.fromISO(`${date}T${hhmm}:00`, { zone: tz }).toISO()
      // Treat duration as appointment length to compute end (default 45)
      const appointmentLen = Number(process.env.APPOINTMENT_MINUTES || 45)
      const end = DateTime.fromISO(`${date}T${hhmm}:00`, { zone: tz })
        .plus({ minutes: appointmentLen })
        .toISO()
      return { start, end }
    })

    const availableSlots =
      require("../services/google-calendar").removeBusyFromSlots(
        date,
        baseSlots,
        busyRanges
      )

    const availableSlotsDetailed = baseSlotsDetailed.filter((s) =>
      availableSlots.includes(s.time)
    )
    return res.json({ date, availableSlots, availableSlotsDetailed })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: "Erro interno" })
  }
})

module.exports = router
