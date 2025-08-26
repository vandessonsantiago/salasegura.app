import { Router } from "express";
import { DateTime } from "luxon";
import { supabaseAdmin as supabase } from "../lib/supabase";
import {
  getAvailableSlotsWithMeetLinks,
  getAvailableDatesWithSlots,
} from "../services/google-calendar";

const router: Router = Router();

// Rota para buscar datas disponíveis nos próximos 15 dias
router.get("/dates", async (_req, res) => {
  try {
    const tz = process.env.TIMEZONE || "America/Sao_Paulo";
    const today = DateTime.now().setZone(tz).toISODate(); // YYYY-MM-DD in TZ

    if (!today) {
      return res.status(500).json({
        error: "Erro interno",
        message: "Não foi possível determinar a data atual"
      });
    }

    console.log("🔍 Buscando datas disponíveis nos próximos 15 dias...");

    let datesWithSlots: { [date: string]: string[] } = {};
    
    try {
      // Tentar buscar do Google Calendar
      datesWithSlots = await getAvailableDatesWithSlots(today, 15);
    } catch (googleError) {
      const errorMessage = googleError instanceof Error ? googleError.message : 'Erro desconhecido';
      console.warn("⚠️ Google Calendar não disponível, usando fallback:", errorMessage);
      
      // Fallback: gerar datas mockadas para os próximos 7 dias
      for (let i = 1; i <= 7; i++) {
        const futureDate = DateTime.now().setZone(tz).plus({ days: i }).toISODate();
        if (futureDate) {
          datesWithSlots[futureDate] = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
        }
      }
    }

    // Para cada data, verificar agendamentos no Supabase e remover slots ocupados
    const availableDates: { [date: string]: string[] } = {};

    for (const [date, slots] of Object.entries(datesWithSlots)) {
      let busySet = new Set<string>();
      
      try {
        const { data: ags, error } = await supabase
          .from("agendamentos")
          .select("horario, status")
          .eq("data", date)
          .in("status", ["PENDING", "CONFIRMED"]);

        if (error) {
          console.error(`⚠️  Aviso: Erro ao buscar agendamentos para ${date}, todos os slots estarão disponíveis:`, error);
          // Continua sem filtrar - todos os slots estarão disponíveis
        } else {
          // Remover slots ocupados se a consulta teve sucesso
          (ags || []).forEach((a: { horario: string }) => {
            const hhmm = String(a.horario).slice(0, 5);
            busySet.add(hhmm);
          });
        }
      } catch (err) {
        console.error(`⚠️  Aviso: Exceção ao buscar agendamentos para ${date}, todos os slots estarão disponíveis:`, err);
      }

      // Filtrar slots disponíveis
      const availableSlots = slots.filter((slot) => !busySet.has(slot));
      
      if (availableSlots.length > 0) {
        availableDates[date] = availableSlots;
      }
    }

    console.log("✅ Datas disponíveis processadas:", Object.keys(availableDates).length);

    res.json({
      period: "15_days",
      availableDates,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar datas disponíveis:", error);
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({
      error: "Erro interno do servidor",
      message: "Falha ao buscar datas disponíveis",
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
});

// Rota para buscar slots de uma data específica
router.get("/", async (req, res) => {
  try {
    const { date } = req.query;

    if (!date || typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        error: "Data inválida",
        message: "Use o formato YYYY-MM-DD"
      });
    }

    console.log(`🔍 Buscando slots para ${date}...`);

    let slotsDetailed: any[] = [];
    
    try {
      // Tentar buscar do Google Calendar com meet links
      slotsDetailed = await getAvailableSlotsWithMeetLinks(date);
    } catch (googleError) {
      const errorMessage = googleError instanceof Error ? googleError.message : 'Erro desconhecido';
      console.warn("⚠️ Google Calendar não disponível para slots, usando fallback:", errorMessage);
      
      // Fallback: slots mockados
      const mockSlots = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
      slotsDetailed = mockSlots.map(time => ({
        time,
        meetLink: "https://meet.google.com/mock-meeting-link",
        available: true
      }));
    }

    // Buscar agendamentos ocupados no Supabase
    let busySet = new Set<string>();
    
    try {
      const { data: ags, error } = await supabase
        .from("agendamentos")
        .select("horario, status")
        .eq("data", date)
        .in("status", ["PENDING", "CONFIRMED"]);

      if (error) {
        console.error(`⚠️  Aviso: Erro ao buscar agendamentos para ${date}, continuando sem filtros:`, error);
        // Continua sem filtrar - todos os slots estarão disponíveis
      } else {
        // Remover slots ocupados se a consulta teve sucesso
        (ags || []).forEach((a: { horario: string }) => {
          const hhmm = String(a.horario).slice(0, 5);
          busySet.add(hhmm);
        });
        console.log(`✅ Slots ocupados encontrados para ${date}:`, Array.from(busySet));
      }
    } catch (err) {
      console.error(`⚠️  Aviso: Exceção ao buscar agendamentos para ${date}, continuando sem filtros:`, err);
    }

    // Filtrar slots disponíveis
    const availableSlots: string[] = [];
    const availableSlotsDetailed = slotsDetailed.filter((slot) => {
      const time = slot.time || "";
      const hhmm = time.slice(0, 5);
      
      if (!busySet.has(hhmm)) {
        availableSlots.push(hhmm);
        return true;
      }
      return false;
    });

    console.log(`✅ ${availableSlots.length} slots disponíveis para ${date}`);

    res.json({
      date,
      availableSlots,
      availableSlotsDetailed,
    });
  } catch (error) {
    console.error("Erro ao buscar slots:", error);
    res.status(500).json({
      error: "Erro interno do servidor",
      message: "Falha ao buscar slots disponíveis"
    });
  }
});

export default router;
